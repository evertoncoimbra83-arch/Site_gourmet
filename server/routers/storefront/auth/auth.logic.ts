// server/routers/storefront/auth/auth.logic.ts

import { TRPCError } from "@trpc/server";
import { sql, eq } from "drizzle-orm";
import { users } from "../../../../drizzle/schema/index.js";
import { piiHash } from "../../../encryption.js";
import { isValidCpf, normalizeCpf } from "@shared/domain/checkout/cpf.js";
import { type DrizzleDB } from "../../../db.js"; // ✅ Importando tipagem correta do DB

/**
 * ✅ VALIDAÇÃO MATEMÁTICA DE CPF
 */
export function isValidCPF(cpf: string): boolean {
  return isValidCpf(cpf);
}

/**
 * 🛡️ VERIFICAÇÃO DE DUPLICIDADE
 * Usa COLLATE para garantir case-insensitivity correta no MySQL
 */
export async function checkDuplicity(
  db: DrizzleDB,
  data: { email: string, cpf: string, phone?: string | null }
) {
  const emailLower = data.email.toLowerCase().trim();

  // 1. Check E-mail
  const [emailExists] = await db
    .select()
    .from(users)
    .where(sql`${users.email} = ${emailLower} COLLATE utf8mb4_unicode_ci`)
    .limit(1);

  if (emailExists) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Este e-mail já está em uso."
    });
  }

  // 2. Check CPF (Blind Index)
  const cleanCpf = normalizeCpf(data.cpf);
  const docHash = piiHash(cleanCpf);

  if (!docHash) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao processar dados de segurança."
    });
  }

  const [cpfExists] = await db
    .select()
    .from(users)
    .where(sql`${users.documentIndex} = ${docHash} COLLATE utf8mb4_unicode_ci`)
    .limit(1);

  if (cpfExists) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Este CPF já possui uma conta ativa."
    });
  }

  // 3. Check Telefone (Blind Index)
  if (data.phone) {
    const cleanPhone = data.phone.replace(/\D/g, "");
    const phoneHash = piiHash(cleanPhone);

    if (phoneHash) {
      const [phoneExists] = await db
        .select()
        .from(users)
        .where(sql`${users.phoneIndex} = ${phoneHash} COLLATE utf8mb4_unicode_ci`)
        .limit(1);

      if (phoneExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este WhatsApp já está em uso por outra conta."
        });
      }
    }
  }
}

/**
 * 🏷️ VALIDAÇÃO DE CÓDIGO DE INDICAÇÃO
 * Verifica se o código informado pertence a um parceiro.
 */
export async function validateReferralCode(
  db: DrizzleDB,
  code: string | null | undefined
): Promise<string | null> {
  if (!code) return null;

  const cleanCode = code.trim();

  const [partner] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, cleanCode))
    .limit(1);

  if (!partner) {
    console.warn(`⚠️ Tentativa de registro com código inválido: ${cleanCode}`);
    return null;
  }

  return cleanCode;
}
