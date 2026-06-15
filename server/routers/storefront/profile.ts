// ROTA: /storefront/profile
import { z } from "zod";
import { TRPCError } from "@trpc/server";
// ✅ FIX: 'sql' removido das importações pois não está sendo usado
import { eq, desc } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";
import { router, protectedProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { decrypt, encrypt, piiHash, normalizeDigits } from "../../encryption.js";
import { logAction } from "../../db/lib/audit.js";
import { lucia } from "../../auth.js";
import {
  assertPasswordPolicy,
  recordAuthEvent,
} from "./auth/auth-security.js";
import crypto from "crypto";

import {
  users,
  orders,
  userAddresses as addresses,
} from "../../../drizzle/schema/index.js";

// --- HELPERS DE PRIVACIDADE ---
function unseal(val: string | null | unknown): string {
  if (!val || typeof val !== "string") return "";
  const str = val;
  try {
    if (str.split(':').length !== 3) return str;
    const decoded = decrypt(str);
    return decoded || str;
  } catch {
    return str;
  }
}

export const profileRouter = router({

  /**
   * 👤 GET: Perfil Completo
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const targetId = ctx.user.id;

    const [row] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado." });
    }

    let finalDoc = unseal(row.customerDocument);

    if (!finalDoc || finalDoc.length < 5) {
       const [lastOrder] = await db
         .select({ doc: orders.customerDocument })
         .from(orders)
         .where(eq(orders.userId, targetId))
         .orderBy(desc(orders.createdAt))
         .limit(1);
       if (lastOrder?.doc) finalDoc = unseal(lastOrder.doc);
    }

    const nameStr = unseal(row.name);
    const phoneStr = unseal(row.phone);
    const birthDateStr = row.birthDate;

    let completedFields = 0;
    const totalFields = 4;
    if (nameStr && nameStr.trim().length > 0) completedFields++;
    if (row.email && row.email.trim().length > 0) completedFields++;
    if (birthDateStr && birthDateStr.trim().length > 0) completedFields++;
    if (phoneStr && phoneStr.trim().length > 0) completedFields++;

    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    const isIncomplete = !birthDateStr || birthDateStr.trim().length === 0 || !phoneStr || phoneStr.trim().length === 0;

    return {
      id: row.id,
      name: nameStr || "Cliente",
      email: row.email,
      document: finalDoc,
      phone: phoneStr,
      birthDate: birthDateStr ? String(birthDateStr).split('T')[0] : null,
      birthYear: row.birthYear ? Number(row.birthYear) : null,
      hasPassword: !!row.password,
      referralCode: row.referralCode || null,
      completionPercentage,
      isIncomplete,
    };
  }),

  /**
   * 📝 UPDATE: Dados Cadastrais
   */
  update: protectedProcedure
    .input(z.object({
      name: z.string().min(2, "Nome muito curto").optional(),
      cpf: z.string().optional(),
      phone: z.string().optional(),
      birthDate: z.string().optional().nullable(),
      birthYear: z.number().optional().nullable(),
      referralCode: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const targetId = ctx.user.id;

      const updateData: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date()
      };

      if (input.name?.trim()) {
        updateData.name = encrypt(input.name.trim());
        updateData.nameIndex = input.name.trim().toLowerCase();
      }

      if (input.cpf) {
        const cleanCpf = normalizeDigits(input.cpf);
        if (cleanCpf.length === 11) {
            updateData.customerDocument = encrypt(cleanCpf);
            updateData.documentIndex = piiHash(cleanCpf);
        }
      }

      if (input.phone) {
        const cleanPhone = normalizeDigits(input.phone);
        if (cleanPhone.length >= 10) {
          updateData.phone = encrypt(cleanPhone);
          updateData.phoneIndex = piiHash(cleanPhone);
        }
      }

      if (input.birthDate) {
        const dateOnly = input.birthDate.split('T')[0];
        updateData.birthDate = dateOnly;
        updateData.birthYear = input.birthYear || Number(dateOnly.split('-')[0]);
      }

      if (input.referralCode !== undefined) {
        updateData.referralCode = input.referralCode?.trim() || null;
      }

      try {
        await db.update(users)
          .set(updateData)
          .where(eq(users.id, targetId));

        await logAction(ctx, "UPDATE_PROFILE", "users", { entityId: targetId });

        return {
          success: true,
          message: "Seus dados foram atualizados!"
        };
      } catch {
        // ✅ FIX: Removido 'error' não utilizado do catch
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao salvar dados. Verifique se o CPF já está em uso."
        });
      }
    }),

  /**
   * 🔑 CHANGE PASSWORD
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8, "A nova senha deve ter no minimo 8 caracteres"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const targetId = ctx.user.id;

      const [userRow] = await db
        .select({ password: users.password, email: users.email })
        .from(users)
        .where(eq(users.id, targetId))
        .limit(1);

      if (userRow?.password) {
        if (!input.currentPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Para sua segurança, digite a senha atual."
          });
        }

        const isMatch = await verify(userRow.password, input.currentPassword);
        if (!isMatch) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "A senha atual está incorreta." });
        }
      }

      assertPasswordPolicy(input.newPassword, userRow?.email);
      const hashedNewPassword = await hash(input.newPassword);

      await db.update(users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, targetId));

      await lucia.invalidateUserSessions(targetId);
      const session = await lucia.createSession(targetId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      if (ctx.req?.hostname && (
        ctx.req.hostname === "localhost" ||
        ctx.req.hostname === "127.0.0.1" ||
        ctx.req.hostname.startsWith("192.168.24.")
      )) {
        sessionCookie.attributes.secure = false;
      }
      sessionCookie.attributes.maxAge = undefined;
      sessionCookie.attributes.expires = undefined;
      if (ctx.res) {
        if (typeof ctx.res.appendHeader === "function") {
          ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
        } else {
          ctx.res.append("Set-Cookie", sessionCookie.serialize());
        }
      }

      await logAction(ctx, "CHANGE_PASSWORD", "users", { entityId: targetId });
      recordAuthEvent({
        ctx,
        action: "PASSWORD_CHANGED",
        severity: "warning",
        userId: targetId,
        identifier: userRow?.email,
        reason: "profile_change_password",
      });

      return { success: true, message: "Senha alterada com sucesso! 🛡️" };
    }),

  /**
   * 📍 ADDRESSES (GET)
   */
  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, ctx.user.id))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

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
   * ➕ ADD ADDRESS
   */
  addAddress: protectedProcedure
    .input(z.object({
      label: z.string().min(1),
      zipCode: z.string().min(8),
      street: z.string().min(1),
      number: z.string().min(1),
      neighborhood: z.string().min(1),
      city: z.string().min(1),
      state: z.string().length(2),
      complement: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      const [existing] = await db
        .select({ id: addresses.id })
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .limit(1);

      const isDefault = !existing;

      const cleanZip = normalizeDigits(input.zipCode);

      await db.insert(addresses).values({
        id: crypto.randomUUID(),
        userId: userId,
        label: encrypt(input.label),
        zipCode: encrypt(cleanZip),
        street: encrypt(input.street),
        number: encrypt(input.number),
        neighborhood: encrypt(input.neighborhood),
        city: encrypt(input.city),
        state: encrypt(input.state),
        complement: input.complement ? encrypt(input.complement) : null,
        isDefault: isDefault,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { success: true, message: "Endereço cadastrado!" };
    }),
});
