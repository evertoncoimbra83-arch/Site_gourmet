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
import {
  assertPasswordPolicy,
  normalizeAuthIdentifier,
  recordAuthEvent,
} from "./auth-security.js";

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
  const identifier = normalizeAuthIdentifier(input.identifier);
  
  const [result] = await db.select({
    id: users.id,
    email: users.email,
    password: users.password,
    needsReset: users.needsPasswordReset,
    deletedAt: users.deletedAt,
  })
  .from(users)
  .where(eq(users.email, identifier))
  .limit(1);

  if (!result || !result.password) {
    recordAuthEvent({
      ctx,
      action: "LOGIN_PASSWORD_FAIL",
      severity: "warning",
      identifier,
      reason: "invalid_credentials",
    });
    throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
  }

  if (result.deletedAt) {
    recordAuthEvent({
      ctx,
      action: "LOGIN_BLOCKED_DELETED",
      severity: "critical",
      userId: result.id,
      identifier,
      reason: "soft_deleted_user",
    });
    throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
  }

  // Caso o usuário venha de migração e ainda não tenha senha Argon2 definida
  if (Number(result.needsReset) === 1) {
    return { success: false, status: "MIGRATION_REQUIRED" as const, email: result.email };
  }

  if (!input.password) {
    recordAuthEvent({
      ctx,
      action: "LOGIN_PASSWORD_FAIL",
      severity: "warning",
      userId: result.id,
      identifier,
      reason: "missing_password",
    });
    throw new TRPCError({ code: "BAD_REQUEST", message: "Senha é obrigatória." });
  }

  const valid = await verify(result.password, input.password);
  if (!valid) {
    recordAuthEvent({
      ctx,
      action: "LOGIN_PASSWORD_FAIL",
      severity: "warning",
      userId: result.id,
      identifier,
      reason: "invalid_credentials",
    });
    throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
  }

  /**
   * ✅ LÓGICA DE SESSÃO DINÂMICA
   */
  const ipAddress = ctx.req ? (ctx.req.ip || (ctx.req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1") : "127.0.0.1";
  const userAgent = ctx.req ? (ctx.req.headers?.["user-agent"] || "unknown") : "unknown";
  const session = await lucia.createSession(result.id, {
    ipAddress,
    userAgent,
  });
  const sessionCookie = lucia.createSessionCookie(session.id);
  
  if (ctx.req?.hostname && (
    ctx.req.hostname === "localhost" || 
    ctx.req.hostname === "127.0.0.1" || 
    ctx.req.hostname.startsWith("192.168.24.")
  )) {
    sessionCookie.attributes.secure = false;
  }

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
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, result.id));
  recordAuthEvent({
    ctx,
    action: "LOGIN_PASSWORD_SUCCESS",
    severity: "info",
    userId: result.id,
    identifier,
    reason: input.rememberMe ? "remember_me" : "session_cookie",
  });
  
  return { success: true, status: "SUCCESS" as const };
};

/**
 * 📝 REGISTRO
 */
export const registerProcedure = async ({ input, ctx }: { input: RegisterInput; ctx: TrpcContext }) => {
  const db = await getDb();
  const email = normalizeAuthIdentifier(input.email);
  assertPasswordPolicy(input.password, email);
  
  if (!isValidCPF(input.cpf)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "CPF inválido." });
  }

  // Passa o db com a tipagem correta para a lógica de duplicidade
  await checkDuplicity(db as DrizzleDB, { 
    email, 
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
        email,
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

    const ipAddress = ctx.req ? (ctx.req.ip || (ctx.req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1") : "127.0.0.1";
    const userAgent = ctx.req ? (ctx.req.headers?.["user-agent"] || "unknown") : "unknown";
    const session = await lucia.createSession(unifiedId, {
      ipAddress,
      userAgent,
    });
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    if (ctx.req?.hostname && (
      ctx.req.hostname === "localhost" || 
      ctx.req.hostname === "127.0.0.1" || 
      ctx.req.hostname.startsWith("192.168.24.")
    )) {
      sessionCookie.attributes.secure = false;
    }
    
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
    recordAuthEvent({
      ctx,
      action: "REGISTER_PASSWORD_SUCCESS",
      severity: "info",
      userId: unifiedId,
      identifier: email,
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao realizar cadastro.";
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
  }
};

/**
 * 📧 REQUEST RESET
 */
export const requestPasswordResetProcedure = async ({ input, ctx }: { input: { email: string }; ctx?: TrpcContext }) => {
  const db = await getDb();
  const email = normalizeAuthIdentifier(input.email);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  recordAuthEvent({
    ctx,
    action: "RESET_REQUESTED",
    severity: "warning",
    userId: user?.id,
    identifier: email,
    reason: user ? "account_match" : "no_account_match",
  });
  
  // Por segurança, sempre retornar sucesso para não expor se o e-mail existe
  if (!user || user.deletedAt) return { success: true, message: "Link enviado." }; 

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
  assertPasswordPolicy(input.password);

  const [user] = await db.select()
    .from(users)
    .where(eq(users.resetToken, input.token))
    .limit(1);

  if (!user || user.deletedAt || !user.resetExpires || new Date(user.resetExpires) < now) {
    recordAuthEvent({
      ctx,
      action: "RESET_PASSWORD_FAIL",
      severity: "warning",
      userId: user?.id,
      reason: user?.deletedAt ? "soft_deleted_user" : "invalid_or_expired_token",
      metadata: { tokenPrefix: input.token.slice(0, 6) },
    });
    throw new TRPCError({ code: "BAD_REQUEST", message: "Link inválido ou expirado." });
  }

  assertPasswordPolicy(input.password, user.email);
  const hashedPassword = await hash(input.password);

  await db.update(users)
    .set({
      password: hashedPassword,
      needsPasswordReset: 0,
      resetToken: null,
      resetExpires: null
    })
    .where(eq(users.id, user.id));

  await lucia.invalidateUserSessions(user.id);
  const ipAddress = ctx.req ? (ctx.req.ip || (ctx.req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1") : "127.0.0.1";
  const userAgent = ctx.req ? (ctx.req.headers?.["user-agent"] || "unknown") : "unknown";
  const session = await lucia.createSession(user.id, {
    ipAddress,
    userAgent,
  });
  const sessionCookie = lucia.createSessionCookie(session.id);
  
  if (ctx.req?.hostname && (
    ctx.req.hostname === "localhost" || 
    ctx.req.hostname === "127.0.0.1" || 
    ctx.req.hostname.startsWith("192.168.24.")
  )) {
    sessionCookie.attributes.secure = false;
  }
  
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
  recordAuthEvent({
    ctx,
    action: "RESET_SUCCESS",
    severity: "warning",
    userId: user.id,
    identifier: user.email,
    reason: "password_reset",
  });
  return { success: true };
};

/**
 * 🚪 LOGOUT (BLINDADO)
 */
export const logoutProcedure = async ({ ctx }: { ctx: TrpcContext }) => {
  const userId = ctx.user?.id || null;
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
  recordAuthEvent({
    ctx,
    action: "LOGOUT",
    severity: "info",
    userId,
    reason: ctx.session ? "session_invalidated" : "no_active_session",
  });
  
  return { success: true };
};
