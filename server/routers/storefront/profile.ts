import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hash, verify } from "@node-rs/argon2"; 
import { router, protectedProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { decrypt, encrypt } from "../../encryption.js";
import { logAction } from "../../db/lib/audit.js";
import crypto from "crypto";

import {
  users,
  orders,
  userAddresses as addresses,
} from "../../../drizzle/schema/index.js";

// --- HELPERS DE PRIVACIDADE ---
function unseal(val: any): string {
  if (!val) return "";
  const str = String(val);
  try {
    if (str.split(':').length !== 3) return str;
    const decoded = decrypt(str);
    return decoded || str;
  } catch (e) {
    return str;
  }
}

const generateBlindIndex = (value: string) => {
  if (!value) return null;
  const cleanValue = value.replace(/\D/g, "");
  return crypto.createHash("sha256").update(cleanValue).digest("hex");
};

export const profileRouter = router({
  
  /**
   * 👤 GET: Retorna o perfil completo usando apenas o UUID unificado
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const targetId = ctx.user.id; // 🎯 UUID Direto

    const [row] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);

    if (!row) {
      console.error(`[AUTH] Perfil não encontrado no banco para ID: ${targetId}`);
      throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado." });
    }

    let finalDoc = unseal(row.customerDocument);
    
    // Fallback: Se o CPF estiver vazio, tenta recuperar do histórico de pedidos usando o UUID
    if (!finalDoc || finalDoc.length < 5) { 
       const [lastOrder] = await db
         .select({ doc: orders.customerDocument })
         .from(orders)
         .where(eq(orders.userId, targetId))
         .orderBy(desc(orders.id))
         .limit(1);
       if (lastOrder?.doc) finalDoc = unseal(lastOrder.doc);
    }

    return {
      id: row.id,
      name: unseal(row.name) || "Cliente", 
      email: row.email,
      document: finalDoc,
      phone: unseal(row.phone),
      birthDate: row.birthDate ? String(row.birthDate).split('T')[0] : null,
      birthYear: row.birthYear ? Number(row.birthYear) : null,
    };
  }),

  /**
   * 📝 UPDATE: Atualiza dados usando o UUID unificado
   */
  update: protectedProcedure
    .input(z.object({
      name: z.string().min(2, "Nome muito curto").optional(),
      cpf: z.string().optional(),
      phone: z.string().optional(),
      birthDate: z.string().optional().nullable(),
      birthYear: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const targetId = ctx.user.id;

      const updateData: any = { updatedAt: new Date() };

      if (input.name?.trim()) {
        updateData.name = encrypt(input.name.trim());
      }

      if (input.cpf) {
        const cleanCpf = input.cpf.replace(/\D/g, "");
        if (cleanCpf.length === 11) {
            updateData.customerDocument = encrypt(cleanCpf); 
            updateData.customerDocumentHash = generateBlindIndex(cleanCpf); 
        }
      }

      if (input.phone) {
        const cleanPhone = input.phone.replace(/\D/g, "");
        if (cleanPhone.length >= 8) {
            updateData.phone = encrypt(cleanPhone); 
        }
      }

      if (input.birthDate) {
        const dateOnly = input.birthDate.split('T')[0];
        updateData.birthDate = dateOnly;
        if (!input.birthYear) {
          updateData.birthYear = Number(dateOnly.split('-')[0]);
        }
      }

      if (input.birthYear !== undefined) {
        updateData.birthYear = input.birthYear;
      }

      try {
        await db.update(users).set(updateData).where(eq(users.id, targetId));
        await logAction(ctx, "UPDATE_PROFILE", "users", { entityId: targetId });
        return { success: true };
      } catch (e) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao salvar dados." });
      }
    }),

  /**
   * 🔑 CHANGE PASSWORD: Unificado na tabela users (ajuste conforme seu schema)
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const targetId = ctx.user.id; 

      // Assumindo que o password agora está na tabela users unificada
      const [userRow] = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, targetId))
        .limit(1);

      if (!userRow?.password) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não possui senha definida." });

      const isMatch = await verify(userRow.password, input.currentPassword);
      if (!isMatch) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });

      const hashedNewPassword = await hash(input.newPassword); 
      
      await db.update(users).set({ password: hashedNewPassword }).where(eq(users.id, targetId));
      await logAction(ctx, "CHANGE_PASSWORD", "users", { entityId: targetId });
      return { success: true };
    }),

  /**
   * 📍 ADDRESSES (GET): Busca direta por UUID
   */
  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const targetId = ctx.user.id;

    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, targetId))
      .orderBy(desc(addresses.isDefault), desc(addresses.id));

    return rows.map(addr => ({
      ...addr,
      label: unseal(addr.label),
      street: unseal(addr.street),
      number: unseal(addr.number),
      neighborhood: unseal(addr.neighborhood),
      city: unseal(addr.city),
      state: unseal(addr.state),
      zipCode: unseal(addr.zipCode),
      complement: unseal(addr.complement),
      isDefault: Boolean(addr.isDefault)
    }));
  }),

  /**
   * ➕ ADD ADDRESS: Inserção usando o UUID
   */
  addAddress: protectedProcedure
    .input(z.object({
      label: z.string().min(1),
      zipCode: z.string(),
      street: z.string(),
      number: z.string(),
      neighborhood: z.string(),
      city: z.string(),
      state: z.string(),
      complement: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const targetId = ctx.user.id;

      const existing = await db.select().from(addresses).where(eq(addresses.userId, targetId)).limit(1);
      const isDefault = existing.length === 0;

      await db.insert(addresses).values({
        id: `ADDR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        userId: targetId,
        label: encrypt(input.label),
        zipCode: encrypt(input.zipCode),
        street: encrypt(input.street),
        number: encrypt(input.number),
        neighborhood: encrypt(input.neighborhood),
        city: encrypt(input.city),
        state: encrypt(input.state),
        complement: input.complement ? encrypt(input.complement) : "",
        isDefault: isDefault,
      } as any);

      return { success: true };
    }),
});