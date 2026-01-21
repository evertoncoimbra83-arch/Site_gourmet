import { z } from "zod";
import { eq, desc, sql, sum, or, like } from 'drizzle-orm'; 
import { router, adminProcedure } from "../../_core/trpc.js"; 
import { getDb } from "../../db.js"; 
import { decrypt, encrypt } from "../../encryption.js"; 
import { TRPCError } from "@trpc/server";
import { logAction } from "../../db/lib/audit.js"; 
import { createHmac } from "crypto";

import { 
    users, 
    user_profiles,
    userAddresses as customer_addresses, 
    loyaltyHistory, 
    orders,
    authUsers 
} from "../../../drizzle/schema/index.js"; 

// =========================================================
// 🔐 SEGURANÇA: BLIND INDEX & PII
// =========================================================

function generateSearchHash(val: string | null | undefined): string | null {
    if (!val) return null;
    const secret = process.env.DB_ENCRYPTION_KEY || "fallback-secret";
    return createHmac("sha256", secret)
        .update(val.toLowerCase().trim().replace(/\D/g, "")) 
        .digest("hex");
}

function safeDecrypt(val: any): string {
    if (!val) return "";
    try {
        const str = String(val);
        // Verifica se a string parece estar no formato criptografado (ex: iv:auth:data)
        if (!str.includes(':')) return str; 
        return decrypt(str) || str; 
    } catch { return String(val); }
}

const mapUser = (u: any) => {
    if (!u) return null;
    return {
        ...u,
        name: safeDecrypt(u.name),
        phone: safeDecrypt(u.phone),
        customerDocument: safeDecrypt(u.customerDocument),
    };
};

// =========================================================
// 👑 ROTEADOR DE USUÁRIOS ADMIN
// =========================================================

export const usersAdminRouter = router({
    
    // 1. LISTAGEM COM BUSCA VIA BLIND INDEX
    list: adminProcedure
        .input(z.object({
            page: z.number().default(1), 
            limit: z.number().default(20), 
            search: z.string().nullish(),
        }))
        .query(async ({ input }) => {
            const db = await getDb();
            const offset = (input.page - 1) * input.limit;

            let searchCondition = undefined;

            if (input.search && input.search.length > 2) {
                const term = input.search.trim();
                const hash = generateSearchHash(term);
                
                searchCondition = or(
                    like(users.email, `%${term}%`),
                    eq(users.id, term),
                    hash ? eq(users.nameIndex, hash) : undefined,
                    hash ? eq(users.documentIndex, hash) : undefined
                );
            }

            const userList = await db.select().from(users)
                .where(searchCondition)
                .limit(input.limit)
                .offset(offset);

            const [totalResult] = await db.select({ count: sql<number>`count(*)` })
                .from(users).where(searchCondition);

            const items = userList.map(mapUser).filter((u): u is any => u !== null);

            // Ordenação local (PII criptografada não ordena via SQL)
            items.sort((a, b) => (a.name || "").localeCompare(b.name || "", 'pt-BR'));

            return { 
                items, 
                total: Number(totalResult?.count || 0), 
                page: input.page, 
                limit: input.limit 
            };
        }),

    // 2. PERFIL DETALHADO (360º do Cliente)
    getDetails: adminProcedure
        .input(z.object({ id: z.string() })) 
        .query(async ({ input }) => {
            const db = await getDb();
            
            const [data] = await db.select({
                user: users,
                zipCode: user_profiles.zipCode,
                city: user_profiles.city,
                state: user_profiles.state
            })
            .from(users)
            .leftJoin(user_profiles, eq(users.id, user_profiles.userId))
            .where(eq(users.id, input.id))
            .limit(1);

            if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

            const [spent] = await db.select({ total: sum(orders.total) }).from(orders).where(eq(orders.userId, input.id));
            const [loyalty] = await db.select({ total: sum(loyaltyHistory.pointsChange) }).from(loyaltyHistory).where(eq(loyaltyHistory.userId, input.id));

            return {
                user: mapUser(data.user),
                stats: {
                    totalSpent: String(spent?.total || "0.00"),
                    loyaltyPoints: Number(loyalty?.total || 0),
                    city: safeDecrypt(data.city),
                    state: safeDecrypt(data.state)
                }
            };
        }),

    /**
     * ✅ SOLUÇÃO DO 404: listAddresses
     * Permite ao admin ver os endereços do cliente (descriptografados)
     */
    listAddresses: adminProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            const db = await getDb();
            const rows = await db
                .select()
                .from(customer_addresses)
                .where(eq(customer_addresses.userId, input.userId))
                .orderBy(desc(customer_addresses.createdAt));

            return rows.map(addr => ({
                ...addr,
                label: safeDecrypt(addr.label) || "Endereço",
                street: safeDecrypt(addr.street),
                number: safeDecrypt(addr.number),
                complement: safeDecrypt(addr.complement),
                neighborhood: safeDecrypt(addr.neighborhood),
                city: safeDecrypt(addr.city),
                state: safeDecrypt(addr.state),
                zipCode: safeDecrypt(addr.zipCode),
            }));
        }),

    // 3. ATUALIZAÇÃO
    update: adminProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            phone: z.string().optional().nullable(),
            customerDocument: z.string().optional().nullable(),
            role: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            const [oldUser] = await db.select().from(users).where(eq(users.id, input.id));

            const updateData: any = { updatedAt: new Date() };

            if (input.name) {
                updateData.name = encrypt(input.name);
                updateData.nameIndex = generateSearchHash(input.name);
            }
            
            if (input.phone !== undefined) {
                const cleanPhone = input.phone ? String(input.phone).replace(/\D/g, "") : null;
                updateData.phone = cleanPhone ? encrypt(cleanPhone) : null;
            }
            
            if (input.customerDocument !== undefined) {
                const cleanCpf = input.customerDocument ? String(input.customerDocument).replace(/\D/g, "") : null;
                updateData.customerDocument = cleanCpf ? encrypt(cleanCpf) : null;
                updateData.documentIndex = generateSearchHash(cleanCpf);
            }

            if (input.role) updateData.role = input.role;

            await db.update(users).set(updateData).where(eq(users.id, input.id));

            await logAction(ctx, "UPDATE_USER", "users", {
                entityId: input.id,
                old: { name: safeDecrypt(oldUser?.name), role: oldUser?.role },
                new: { name: input.name, role: input.role }
            });

            return { success: true };
        }),

    // 4. EXCLUSÃO
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            const [user] = await db.select().from(users).where(eq(users.id, input.id));

            await db.transaction(async (tx) => {
                await tx.delete(customer_addresses).where(eq(customer_addresses.userId, input.id));
                await tx.delete(authUsers).where(eq(authUsers.id, input.id));
                await tx.delete(users).where(eq(users.id, input.id));
            });

            await logAction(ctx, "DELETE_USER", "users", {
                entityId: input.id,
                old: { email: user?.email }
            });

            return { success: true };
        }),
});