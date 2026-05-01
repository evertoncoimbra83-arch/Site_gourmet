/* eslint-disable @typescript-eslint/ban-ts-comment */
// server/routers/admin/users.ts

import { z } from "zod";
import { eq, sql, sum, or, like, asc, and, desc } from 'drizzle-orm'; 
import { router, adminProcedure } from "../../_core/trpc.js"; 
import { getDb } from "../../db.js"; 
import { decrypt, encrypt, piiHash, normalizeDigits } from "../../encryption.js"; 
import { TRPCError } from "@trpc/server";
import { logAction } from "../../db/lib/audit.js"; 
import { v4 as uuidv4 } from "uuid";
import { hash } from "@node-rs/argon2"; 
import crypto from "node:crypto";

import { 
    users, 
    user_profiles,
    userAddresses as customer_addresses, 
    loyaltyHistory, 
    orders
} from "../../../drizzle/schema/index.js"; 

// --- TIPAGENS ---
type UserSelect = typeof users.$inferSelect;
type UserInsert = typeof users.$inferInsert;
type AddressInsert = typeof customer_addresses.$inferInsert;

// =========================================================
// 🔐 HELPERS DE PRIVACIDADE
// =========================================================

function unseal(val: unknown): string {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    if (!str) return "";
    
    try {
        if (str.split(':').length !== 3) return str;
        const decoded = decrypt(str);
        return decoded || "";
    } catch {
        return "";
    }
}

function normalizeForSearch(text: string | null | undefined): string {
    if (!text) return "";
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const mapUser = (u: UserSelect) => {
    if (!u) return null;
    return {
        ...u,
        name: unseal(u.name),
        phone: unseal(u.phone),
        customerDocument: unseal(u.customerDocument),
        needsPasswordReset: Number(u.needsPasswordReset ?? 0)
    };
};

// =========================================================
// 👑 ROTEADOR DE USUÁRIOS ADMIN
// =========================================================

export const usersAdminRouter = router({
    
    list: adminProcedure
        .input(z.object({
            page: z.number().default(1), 
            limit: z.number().default(20), 
            search: z.string().nullish(),
        }))
        .query(async ({ input }) => {
            const db = await getDb();
            const { page, limit, search } = input;
            const offset = (page - 1) * limit;
            
            let searchCondition = undefined;

            if (search && search.trim().length >= 2) {
                const term = search.trim();
                const termNorm = normalizeForSearch(term);
                const cleanDigits = normalizeDigits(term);
                const digitHash = cleanDigits.length >= 3 ? piiHash(cleanDigits) : null;

                searchCondition = or(
                    like(users.email, `%${term.toLowerCase()}%`),
                    like(users.nameIndex, `%${termNorm}%`),
                    eq(users.id, term), 
                    digitHash ? eq(users.documentIndex, digitHash) : undefined,
                    digitHash ? eq(users.phoneIndex, digitHash) : undefined
                );
            }

            const [userList, totalResult] = await Promise.all([
                db.select({
                    user: users,
                    address: customer_addresses,
                })
                .from(users)
                .leftJoin(customer_addresses, and(eq(users.id, customer_addresses.userId), eq(customer_addresses.isDefault, true)))
                .where(searchCondition)
                .limit(limit)
                .offset(offset)
                .orderBy(asc(users.nameIndex)), 
                
                db.select({ count: sql<number>`count(*)` })
                    .from(users)
                    .where(searchCondition)
                    .limit(1)
                    .offset(0)
            ]);

            const items = userList.map(({ user, address }) => {
                const base = mapUser(user);
                if (!base) return null;

                let mappedAddress = null;
                if (address) {
                    mappedAddress = {
                        shipping_address: unseal(address.street),
                        shipping_address_number: unseal(address.number),
                        shipping_neighborhood: unseal(address.neighborhood),
                        shipping_address_complement: unseal(address.complement),
                        shipping_zip_code: unseal(address.zipCode),
                        shipping_city: unseal(address.city),
                        shipping_state: unseal(address.state)
                    };
                }

                return { 
                    ...base, 
                    address: mappedAddress,
                    availablePoints: Number(user.availablePoints || 0)
                };
            }).filter((u): u is NonNullable<typeof u> => u !== null);

            return { items, total: Number(totalResult[0]?.count || 0), page, limit };
        }),

    getDetails: adminProcedure
        .input(z.object({ id: z.string() })) 
        .query(async ({ input }) => {
            const db = await getDb();
            
            const [data] = await db.select({ 
                user: users, 
                city: user_profiles.city, 
                state: user_profiles.state 
            })
            .from(users)
            .leftJoin(user_profiles, eq(users.id, user_profiles.userId))
            .where(eq(users.id, input.id))
            .limit(1);

            if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

            const userBase = mapUser(data.user);
            
            const spentResult = await db.select({ total: sum(orders.total) })
                .from(orders)
                .where(eq(orders.userId, input.id));

            const recentOrders = await db.select({
                id: orders.id,
                status: orders.status,
                total: orders.total,
                createdAt: orders.createdAt
            })
            .from(orders)
            .where(eq(orders.userId, input.id))
            .orderBy(desc(orders.createdAt))
            .limit(10);

            return {
                ...userBase,
                city: unseal(data.city),
                state: unseal(data.state),
                stats: {
                    totalSpent: String(spentResult[0]?.total || "0.00"),
                    loyaltyPointsAvailable: Number(data.user.availablePoints || 0) 
                },
                recentOrders 
            };
        }),

    addAddress: adminProcedure
        .input(z.object({
            userId: z.string().min(1),
            street: z.string().min(1),
            number: z.string().min(1),
            neighborhood: z.string().optional(),
            complement: z.string().optional(),
            city: z.string().min(1),
            state: z.string().length(2),
            zipCode: z.string().min(8),
            label: z.string().optional().default("Endereço Admin")
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            
            // ✅ Validação de Trust Boundary: Garante que o usuário alvo existe
            const [targetUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
            if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário alvo não encontrado." });

            const id = uuidv4();
            const payload: AddressInsert = {
                id,
                userId: input.userId,
                label: encrypt(input.label),
                street: encrypt(input.street),
                number: encrypt(input.number),
                neighborhood: input.neighborhood ? encrypt(input.neighborhood) : null,
                complement: input.complement ? encrypt(input.complement) : null,
                city: encrypt(input.city),
                state: encrypt(input.state),
                zipCode: encrypt(normalizeDigits(input.zipCode)),
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.insert(customer_addresses).values(payload);
            
            await logAction(ctx, "ADD_ADDRESS", "user_addresses", { 
                entityId: id,
                new: { userId: input.userId } 
            });
            
            return { success: true, message: "Endereço cadastrado com sucesso!" };
        }),

    create: adminProcedure
        .input(z.object({
            name: z.string().min(1),
            email: z.string().email().transform(v => v.toLowerCase().trim()),
            customerDocument: z.string().nullish(),
            phone: z.string().nullish(),
            role: z.enum(["admin", "user", "nutri"]).default("user"),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            const [exists] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
            if (exists) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está em uso." });

            const id = uuidv4();
            const cleanCpf = normalizeDigits(input.customerDocument);
            const cleanPhone = normalizeDigits(input.phone);
            const tempPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await hash(tempPassword);

            // ✅ Transação para garantir integridade Perfil + Usuário
            await db.transaction(async (tx) => {
                await tx.insert(users).values({
                    id,
                    email: input.email,
                    password: hashedPassword,
                    name: encrypt(input.name), 
                    customerDocument: encrypt(cleanCpf),
                    phone: encrypt(cleanPhone),
                    nameIndex: normalizeForSearch(input.name), 
                    documentIndex: piiHash(cleanCpf),
                    phoneIndex: piiHash(cleanPhone),
                    role: input.role,
                    availablePoints: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    needsPasswordReset: 1
                });

                await tx.insert(user_profiles).values({ 
                    id: uuidv4(), 
                    userId: id, 
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            });

            await logAction(ctx, "CREATE_USER", "users", { entityId: id });
            return { success: true, id, message: `Usuário cadastrado com sucesso!` };
        }),

    update: adminProcedure
        .input(z.object({
            id: z.string().min(1),
            name: z.string().optional(),
            phone: z.string().optional().nullable(),
            customerDocument: z.string().optional().nullable(),
            role: z.enum(["admin", "user", "nutri"]).optional(),
            email: z.string().email().optional().transform(v => v?.toLowerCase().trim()),
            needsPasswordReset: z.coerce.number().optional().nullable(),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            const { id, ...data } = input;
            const updateData: Partial<UserInsert> = { updatedAt: new Date() };
            
            // ✅ Atualização Sincronizada: Dado Criptografado + Índice de Busca
            if (data.name) {
                updateData.name = encrypt(data.name); 
                updateData.nameIndex = normalizeForSearch(data.name); 
            }
            if (data.phone !== undefined) {
                const cleanPhone = normalizeDigits(data.phone);
                updateData.phone = encrypt(cleanPhone); 
                updateData.phoneIndex = piiHash(cleanPhone); 
            }
            if (data.customerDocument !== undefined) {
                const cleanCpf = normalizeDigits(data.customerDocument);
                updateData.customerDocument = encrypt(cleanCpf);
                updateData.documentIndex = piiHash(cleanCpf); 
            }
            if (data.role) updateData.role = data.role;
            if (data.email) updateData.email = data.email;
            if (data.needsPasswordReset !== undefined) {
                updateData.needsPasswordReset = data.needsPasswordReset;
            }

            const result = await db.update(users).set(updateData).where(eq(users.id, id));
            
            // @ts-ignore
            if (result[0]?.affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND" });

            await logAction(ctx, "UPDATE_USER", "users", { entityId: id });
            return { success: true, message: "Perfil atualizado!" };
        }),

    delete: adminProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            await db.transaction(async (tx) => {
                await tx.delete(customer_addresses).where(eq(customer_addresses.userId, input.id));
                await tx.delete(loyaltyHistory).where(eq(loyaltyHistory.userId, input.id));
                await tx.delete(user_profiles).where(eq(user_profiles.userId, input.id));
                const result = await tx.delete(users).where(eq(users.id, input.id));
                
                // @ts-ignore
                if (result[0]?.affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND" });
            });
            await logAction(ctx, "DELETE_USER", "users", { entityId: input.id });
            return { success: true, message: "Usuário removido permanentemente!" };
        }),

    setPassword: adminProcedure
        .input(z.object({ userId: z.string().min(1), password: z.string().min(6) }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            const hashedPassword = await hash(input.password);
            const result = await db.update(users).set({ 
                password: hashedPassword,
                needsPasswordReset: 0 
            }).where(eq(users.id, input.userId));

            // @ts-ignore
            if (result[0]?.affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND" });

            await logAction(ctx, "SET_PASSWORD", "users", { entityId: input.userId });
            return { success: true, message: "Senha atualizada pelo administrador." };
        }),
});