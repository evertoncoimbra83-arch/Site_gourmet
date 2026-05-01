// server/routers/storefront/auth/auth.procedures.ts

import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm"; 
import { TRPCError } from "@trpc/server";
import crypto from "node:crypto";
import { users, guests } from "../../../../drizzle/schema/index.js";
import { getDb, type DrizzleDB } from "../../../db.js";
import { lucia, promoteCart } from "../../../auth.js";
import { encrypt, decrypt, piiHash, normalizeDigits } from "../../../encryption.js";
import { isValidCPF, checkDuplicity } from "./auth.logic.js";
import { type TrpcContext } from "../../../_core/context.js";

// --- HELPERS ---

/**
 * Normaliza textos para busca (remove acentos e espaços)
 */
function normalizeForSearch(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// --- INTERFACES ---
interface RegisterInput {
  email: string;
  password: string;
  name: string;
  cpf: string;
  whatsapp?: string | null;
  guestSessionId?: string | null;
}

interface LoginInput {
  identifier: string;
  password?: string | null;
  guestSessionId?: string | null;
  rememberMe?: boolean;
}

/**
 * 🔑 LOGIN (REVISADO: COOKIES DE SESSÃO VERDADEIROS)
 */
export const loginProcedure = async ({ input, ctx }: { input: LoginInput; ctx: TrpcContext }) => {
  const db = await getDb();
  const identifier = input.identifier.trim().toLowerCase();
  
  const [result] = await db.select({
    id: users.id,
    email: users.email,
    password: users.password,
    needsReset: users.needsPasswordReset,
  })
  .from(users)
  .where(eq(users.email, identifier))
  .limit(1);

  if (!result || !result.password) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
  }

  // Caso o usuário venha de migração e ainda não tenha senha Argon2 definida
  if (Number(result.needsReset) === 1) {
    return { success: false, status: "MIGRATION_REQUIRED" as const, email: result.email };
  }

  if (!input.password) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Senha é obrigatória." });
  }

  const valid = await verify(result.password, input.password);
  if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });

  /**
   * ✅ LÓGICA DE SESSÃO DINÂMICA
   */
  const session = await lucia.createSession(result.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  
  // Se NÃO marcou 'Lembrar de mim', a sessão morre ao fechar o navegador
  if (!input.rememberMe) {
    sessionCookie.attributes.maxAge = undefined; 
    sessionCookie.attributes.expires = undefined; 
  }

  if (ctx.res) {
    if (typeof ctx.res.appendHeader === "function") {
      ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
    } else {
      ctx.res.append("Set-Cookie", sessionCookie.serialize());
    }
  }

  // Vincula o carrinho de convidado ao usuário logado
  await promoteCart(ctx.guestId || input.guestSessionId, result.id);
  
  return { success: true, status: "SUCCESS" as const };
};

/**
 * 📝 REGISTRO
 */
export const registerProcedure = async ({ input, ctx }: { input: RegisterInput; ctx: TrpcContext }) => {
  const db = await getDb();
  
  if (!isValidCPF(input.cpf)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "CPF inválido." });
  }

  // Passa o db com a tipagem correta para a lógica de duplicidade
  await checkDuplicity(db as DrizzleDB, { 
    email: input.email, 
    cpf: input.cpf, 
    phone: input.whatsapp || undefined 
  });

  const unifiedId = crypto.randomUUID();
  const hashedPassword = await hash(input.password);
  const cleanCpf = input.cpf.replace(/\D/g, "");
  const cleanPhone = input.whatsapp ? normalizeDigits(input.whatsapp) : null;

  try {
    await db.transaction(async (tx) => {
      const targetGuestId = ctx.guestId || input.guestSessionId;
      let foundReferral: string | null = null;

      // Recupera código de indicação se o convidado tiver um
      if (targetGuestId) {
        const guestData = await tx.query.guests.findFirst({
          where: eq(guests.id, targetGuestId)
        });
        if (guestData) foundReferral = guestData.referralCode || null;
      }

      await tx.insert(users).values({
        id: unifiedId,
        email: input.email.toLowerCase(),
        password: hashedPassword,
        name: encrypt(input.name.trim()),
        customerDocument: encrypt(cleanCpf),
        phone: cleanPhone ? encrypt(cleanPhone) : null,
        documentIndex: piiHash(cleanCpf),
        phoneIndex: cleanPhone ? piiHash(cleanPhone) : null,
        nameIndex: normalizeForSearch(input.name),
        role: "user",
        needsPasswordReset: 0,
        referralCode: foundReferral,
        availablePoints: 0,
        aiCredits: 2 
      });
    });

    const session = await lucia.createSession(unifiedId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    // Registro padrão: Sessão expira ao fechar o navegador por segurança
    sessionCookie.attributes.maxAge = undefined;
    sessionCookie.attributes.expires = undefined;

    if (ctx.res) {
      if (typeof ctx.res.appendHeader === "function") {
        ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
      } else {
        ctx.res.append("Set-Cookie", sessionCookie.serialize());
      }
    }

    await promoteCart(input.guestSessionId || ctx.guestId, unifiedId);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao realizar cadastro.";
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
  }
};

/**
 * 📧 REQUEST RESET
 */
export const requestPasswordResetProcedure = async ({ input }: { input: { email: string } }) => {
  const db = await getDb();
  const email = input.email.toLowerCase().trim();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  // Por segurança, sempre retornar sucesso para não expor se o e-mail existe
  if (!user) return { success: true, message: "Link enviado." }; 

  let firstName = "Cliente";
  if (user.name) {
    try {
      const fullDecryptedName = decrypt(user.name);
      if (fullDecryptedName) {
        firstName = fullDecryptedName.split(" ")[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      }
    } catch (err) {
      console.error("Erro ao descriptografar nome:", err);
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 2); 

  await db.update(users)
    .set({
      resetToken: token,
      resetExpires: expires
    })
    .where(eq(users.id, user.id));

  const resetLink = `${process.env.VITE_APP_URL || "http://localhost:5173"}/primeiro-acesso?token=${token}`;
  
  try {
    const { mailer } = await import("./../../lib/mailer.js");
    await mailer.sendPasswordReset(user.email, firstName, resetLink);
  } catch { 
    console.warn("⚠️ Mailer offline. Link gerado:", resetLink);
  }

  return { success: true, message: "Link enviado." };
};

/**
 * 🔄 RESET PASSWORD (COM AUTO-LOGIN SEGURO)
 */
export const resetPasswordProcedure = async ({ 
  input, 
  ctx 
}: { 
  input: { token: string, password: string }, 
  ctx: TrpcContext 
}) => {
  const db = await getDb();
  const now = new Date();

  const [user] = await db.select()
    .from(users)
    .where(eq(users.resetToken, input.token))
    .limit(1);

  if (!user || !user.resetExpires || new Date(user.resetExpires) < now) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Link inválido ou expirado." });
  }

  const hashedPassword = await hash(input.password);

  await db.update(users)
    .set({
      password: hashedPassword,
      needsPasswordReset: 0,
      resetToken: null,
      resetExpires: null
    })
    .where(eq(users.id, user.id));

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  
  // Login gerado no Reset também amarrado ao ciclo de vida do navegador
  sessionCookie.attributes.maxAge = undefined;
  sessionCookie.attributes.expires = undefined;

  if (ctx.res) {
    if (typeof ctx.res.appendHeader === "function") {
      ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
    } else {
      ctx.res.append("Set-Cookie", sessionCookie.serialize());
    }
  }

  await promoteCart(ctx.guestId, user.id);
  return { success: true };
};

/**
 * 🚪 LOGOUT (BLINDADO)
 */
export const logoutProcedure = async ({ ctx }: { ctx: TrpcContext }) => {
  if (ctx.session) {
    await lucia.invalidateSession(ctx.session.id);
  }
  
  const sessionCookie = lucia.createBlankSessionCookie();
  
  if (ctx.res) {
    if (typeof ctx.res.appendHeader === "function") {
      ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
    } else {
      ctx.res.append("Set-Cookie", sessionCookie.serialize());
    }
  }
  
  return { success: true };
};