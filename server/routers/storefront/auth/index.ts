// server/routers/storefront/auth/index.ts

import {
  router,
  publicProcedure,
  protectedProcedure,
  createRateLimitMiddleware,
} from "../../../_core/trpc.js";
import { z } from "zod";
import { and, eq, isNull, ne, desc } from "drizzle-orm";
import { getDb } from "../../../db.js";
import {
  users,
  sessions,
  auditLogs,
  userOauthAccounts,
  guests,
  nutriProfiles,
  professionalClients,
} from "../../../../drizzle/schema/index.js";
import { decrypt, encrypt, piiHash } from "../../../encryption.js";
import { lucia, promoteCart } from "../../../auth.js";
import { signLinkingToken, verifyLinkingToken } from "../../../auth/oauth/linkingToken.js";
import { generateGoogleAuthUrl } from "../../../auth/oauth/google.js";
import { AuditLogService } from "../../../services/AuditLogService.js";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

import { generateState } from "../../../auth/oauth/state.js";
import { generateNonce } from "../../../auth/oauth/nonce.js";
import { generateCodeChallenge, generateCodeVerifier } from "../../../auth/oauth/pkce.js";
import { exchangeCodeForTokens, verifyGoogleIdToken } from "../../../auth/oauth/google.js";

import {
  registerProcedure,
  loginProcedure,
  logoutProcedure,
  requestPasswordResetProcedure,
  resetPasswordProcedure
} from "./auth.procedures.js";
import { getAuthInputKey } from "./auth-security.js";

/**
 * Interfaces de Resposta Estritas
 */
interface LoginResponse {
  success: boolean;
  status: "SUCCESS" | "MIGRATION_REQUIRED" | "ERROR";
  email?: string;
  message?: string;
}

interface ActionResponse {
  success: boolean;
  message?: string;
}

export const authRouter = router({

  /**
   * 🔍 VERIFICA SE USUÁRIO EXISTE
   */
  checkUserExists: publicProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "auth-check-user",
        limit: 20,
        windowMs: 15 * 60 * 1000,
        getInputKey: getAuthInputKey,
      }),
    )
    .input(z.object({
      email: z.string().email("E-mail inválido"),
      document: z.string().optional().nullish(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const cleanEmail = input.email.toLowerCase().trim();

      const [emailUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, cleanEmail), isNull(users.deletedAt)))
        .limit(1);

      let cpfExists = false;
      if (input.document) {
        const cleanCpf = input.document.replace(/\D/g, "");
        const docHash = piiHash(cleanCpf);
        if (docHash) {
          const [cpfUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.documentIndex, docHash), isNull(users.deletedAt)))
            .limit(1);
          cpfExists = !!cpfUser;
        }
      }

      return {
        exists: !!emailUser || cpfExists,
        emailExists: !!emailUser,
        cpfExists,
      };
    }),

  createGuestSession: publicProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "auth-create-guest-session",
        limit: 15,
        windowMs: 15 * 60 * 1000,
        getInputKey: getAuthInputKey,
      }),
    )
    .input(z.object({
      email: z.string().email("E-mail inválido").transform(v => v.toLowerCase().trim()),
      name: z.string().min(2, "Nome muito curto"),
      phone: z.string().min(10, "Telefone inválido"),
      cpf: z.string().min(11, "CPF inválido"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const cleanCpf = input.cpf.replace(/\D/g, "");
      const cleanPhone = input.phone.replace(/\D/g, "");
      const cleanName = input.name.trim();
      const docHash = piiHash(cleanCpf);
      const emailLower = input.email;

      const [emailUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, emailLower), isNull(users.deletedAt)))
        .limit(1);

      let cpfUser = null;
      if (docHash) {
        const [foundCpf] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.documentIndex, docHash), isNull(users.deletedAt)))
          .limit(1);
        cpfUser = foundCpf;
      }

      const unifiedId = crypto.randomUUID();
      let finalEmail = emailLower;

      if (emailUser || cpfUser) {
        finalEmail = `${emailLower}.guest_${crypto.randomUUID()}`;
      }

      await db.insert(users).values({
        id: unifiedId,
        email: finalEmail,
        password: null,
        name: encrypt(cleanName),
        customerDocument: encrypt(cleanCpf),
        phone: encrypt(cleanPhone),
        documentIndex: docHash || null,
        phoneIndex: piiHash(cleanPhone) || null,
        nameIndex: cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(),
        role: "user",
        loginMethod: "guest",
        needsPasswordReset: 0,
        availablePoints: 0,
        aiCredits: 0,
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

      sessionCookie.attributes.maxAge = undefined;
      sessionCookie.attributes.expires = undefined;

      if (ctx.res) {
        if (typeof ctx.res.appendHeader === "function") {
          ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
        } else {
          ctx.res.append("Set-Cookie", sessionCookie.serialize());
        }
      }

      await promoteCart(ctx.guestId, unifiedId);

      return {
        success: true,
        userId: unifiedId,
      };
    }),


  /**
   * 📝 REGISTRO
   */
  register: publicProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "auth-register",
        limit: 10,
        windowMs: 15 * 60 * 1000,
        getInputKey: getAuthInputKey,
      }),
    )
    .input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("E-mail inválido").transform(v => v.toLowerCase().trim()),
      password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
      cpf: z.string().min(11, "CPF inválido"),
      whatsapp: z.string().optional().nullish(),
      guestSessionId: z.string().optional().nullish(),
    }))
    .mutation(async ({ input, ctx }): Promise<ActionResponse> => {
      return registerProcedure({ input, ctx });
    }),

  /**
   * 🔑 LOGIN
   * ✅ Sincronizado com o Frontend: inclusão de rememberMe
   */
  login: publicProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "auth-login",
        limit: 10,
        windowMs: 15 * 60 * 1000,
        getInputKey: getAuthInputKey,
      }),
    )
    .input(z.object({
      identifier: z.string().min(1, "E-mail ou CPF é obrigatório").trim(),
      password: z.string().optional().nullish(),
      guestSessionId: z.string().optional().nullish(),
      rememberMe: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }): Promise<LoginResponse> => {
      const result = await loginProcedure({ input, ctx });
      return result as LoginResponse;
    }),

  /**
   * 🚪 LOGOUT
   */
  logout: publicProcedure
    .mutation(async ({ ctx }): Promise<ActionResponse> => {
      return logoutProcedure({ ctx });
    }),

  /**
   * 📧 SOLICITAR RECUPERAÇÃO DE SENHA
   */
  requestPasswordReset: publicProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "auth-reset-request",
        limit: 8,
        windowMs: 15 * 60 * 1000,
        getInputKey: getAuthInputKey,
      }),
    )
    .input(z.object({
      email: z.string().email("E-mail inválido").transform(v => v.toLowerCase().trim())
    }))
    .mutation(async ({ input, ctx }): Promise<ActionResponse> => {
      return requestPasswordResetProcedure({ input, ctx });
    }),

  /**
   * 🔄 EXECUÇÃO DA TROCA DE SENHA
   */
  resetPassword: publicProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "auth-reset-password",
        limit: 8,
        windowMs: 15 * 60 * 1000,
      }),
    )
    .input(z.object({
      token: z.string().min(1, "Token obrigatório"),
      password: z.string().min(8, "Senha muito curta")
    }))
    .mutation(async ({ input, ctx }): Promise<ActionResponse> => {
      return resetPasswordProcedure({ input, ctx });
    }),

  /**
   * 👤 ME (Validação de Sessão e Perfil)
   * ✅ Resolvendo o erro NOT_FOUND e garantindo descriptografia dos dados sensíveis
   */
  me: publicProcedure.query(async ({ ctx }) => {
    // Se não houver sessão no contexto (Lucia Auth), retorna null imediatamente
    if (!ctx.user?.id) return null;

    try {
      const db = await getDb();

      const [profile] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!profile) return null;

      // Retorna o objeto do usuário com os campos sensíveis descriptografados para o Frontend
      const displayEmail = profile.email && profile.email.includes(".guest_")
        ? profile.email.split(".guest_")[0]
        : profile.email;

      return {
        ...ctx.user,
        name: profile.name ? decrypt(profile.name) : null,
        customerDocument: profile.customerDocument ? decrypt(profile.customerDocument) : null,
        phone: profile.phone ? decrypt(profile.phone) : null,
        availablePoints: Number(profile.availablePoints || 0),
        aiCredits: Number(profile.aiCredits ?? 0),
        needsPasswordReset: profile.needsPasswordReset === 1,
        email: displayEmail,
        role: profile.role
      };
    } catch (error) {
      console.error("❌ Erro em auth.me:", error);
      // Fallback para o usuário básico do contexto em caso de erro no DB
      return ctx.user;
    }
  }),

  /**
   * 🔒 LISTA AS SESSÕES ATIVAS
   */
  linkReferral: protectedProcedure
    .input(
      z.object({
        referralCode: z.string().trim().min(2, "Codigo de convite obrigatorio."),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const [nutri] = await db
        .select({
          id: nutriProfiles.id,
          userId: nutriProfiles.userId,
          referralCode: nutriProfiles.referralCode,
          isActive: nutriProfiles.isActive,
        })
        .from(nutriProfiles)
        .where(eq(nutriProfiles.referralCode, input.referralCode))
        .limit(1);

      if (!nutri || nutri.isActive === false) {
        void AuditLogService.record({
          actor: {
            userId: ctx.user.id,
            ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
            userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "REFERRAL_LINK_DENIED",
          severity: "warning",
          entityType: "professional_client",
          newValues: { reason: "invalid_referral_code" },
        });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Codigo de convite invalido ou inativo.",
        });
      }

      if (nutri.userId === ctx.user.id) {
        void AuditLogService.record({
          actor: {
            userId: ctx.user.id,
            ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
            userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "REFERRAL_LINK_DENIED",
          severity: "warning",
          entityType: "professional_client",
          entityId: nutri.id,
          newValues: { reason: "self_link" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O nutricionista nao pode aceitar o proprio convite.",
        });
      }

      const [currentUser = { referralCode: null }] = await db
        .select({ referralCode: users.referralCode })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const existingRelationship = await db.query.professionalClients.findFirst({
        where: and(
          eq(professionalClients.professionalId, nutri.id),
          eq(professionalClients.clientId, ctx.user.id),
        ),
      });

      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ referralCode: input.referralCode })
          .where(eq(users.id, ctx.user.id));

        if (!existingRelationship) {
          await tx.insert(professionalClients).values({
            id: crypto.randomUUID(),
            professionalId: nutri.id,
            clientId: ctx.user.id,
            status: "active",
          });
        } else if (existingRelationship.status !== "active") {
          await tx
            .update(professionalClients)
            .set({ status: "active", updatedAt: new Date() })
            .where(eq(professionalClients.id, existingRelationship.id));
        }
      });

      void AuditLogService.record({
        actor: {
          userId: ctx.user.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
        },
        module: "auth",
        action: "REFERRAL_LINKED",
        severity: "info",
        entityType: "professional_client",
        entityId: nutri.id,
        newValues: {
          professionalId: nutri.id,
          clientId: ctx.user.id,
          hadReferral: Boolean(currentUser.referralCode),
          status: existingRelationship ? "ALREADY_LINKED" : "LINKED",
        },
      });

      return {
        success: true,
        status: existingRelationship ? "ALREADY_LINKED" : "LINKED",
        professionalId: nutri.id,
      };
    }),

  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, ctx.user.id))
      .orderBy(desc(sessions.expiresAt));

    // Log SESSION_VIEWED
    void AuditLogService.record({
      actor: {
        userId: ctx.user.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId,
      },
      module: "auth",
      action: "SESSION_VIEWED",
      severity: "info",
      entityType: "session",
      newValues: { count: userSessions.length },
    });

    return userSessions.map((s) => {
      // Estimate creation date since there's no created_at column
      // Lucia sessions default to 30 days validity
      const estimatedCreatedAt = new Date(s.expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        sessionId: s.id,
        createdAt: estimatedCreatedAt,
        expiresAt: s.expiresAt,
        currentSession: s.id === ctx.session.id,
        userAgent: s.userAgent || null,
        ip: s.ipAddress || null,
        lastActivity: s.id === ctx.session.id ? new Date() : null,
      };
    });
  }),

  /**
   * 🔒 ENCERRAR OUTRAS SESSÕES
   */
  logoutOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    const otherSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.userId, ctx.user.id), ne(sessions.id, ctx.session.id)));

    let revokedCount = 0;
    for (const s of otherSessions) {
      await lucia.invalidateSession(s.id);
      revokedCount++;

      void AuditLogService.record({
        actor: {
          userId: ctx.user.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId,
        },
        module: "auth",
        action: "SESSION_REVOKED",
        severity: "warning",
        entityType: "session",
        entityId: s.id,
        newValues: { reason: "logout_other_sessions" },
      });
    }

    void AuditLogService.record({
      actor: {
        userId: ctx.user.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId,
      },
      module: "auth",
      action: "LOGOUT_OTHER_SESSIONS",
      severity: "warning",
      entityType: "session",
      newValues: { count: revokedCount },
    });

    return revokedCount;
  }),

  /**
   * 🔒 ENCERRAR TODAS AS SESSÕES (LOGOUT TOTAL)
   */
  logoutAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();

    // Fetch all sessions of the user to log individual revokes
    const userSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.userId, ctx.user.id));

    for (const s of userSessions) {
      void AuditLogService.record({
        actor: {
          userId: ctx.user.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId,
        },
        module: "auth",
        action: "SESSION_REVOKED",
        severity: "warning",
        entityType: "session",
        entityId: s.id,
        newValues: { reason: "logout_all_sessions" },
      });
    }

    // Invalidate all sessions in Lucia
    await lucia.invalidateUserSessions(ctx.user.id);

    // Clear session cookie
    const sessionCookie = lucia.createBlankSessionCookie();
    if (ctx.res) {
      if (typeof ctx.res.appendHeader === "function") {
        ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
      } else {
        ctx.res.append("Set-Cookie", sessionCookie.serialize());
      }
    }

    void AuditLogService.record({
      actor: {
        userId: ctx.user.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId,
      },
      module: "auth",
      action: "LOGOUT_ALL_SESSIONS",
      severity: "warning",
      entityType: "session",
      newValues: { count: userSessions.length },
    });

    return { success: true };
  }),

  /**
   * 🔒 ENCERRAR SESSÃO ESPECÍFICA (REVOGAÇÃO MANUAL)
   */
  logoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // Verify session belongs to the user
      const [sessionVal] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, input.sessionId), eq(sessions.userId, ctx.user.id)))
        .limit(1);

      if (!sessionVal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sessão não encontrada ou não pertence a este usuário.",
        });
      }

      await lucia.invalidateSession(input.sessionId);

      // If it was the current session, clear cookie
      if (input.sessionId === ctx.session.id) {
        const sessionCookie = lucia.createBlankSessionCookie();
        if (ctx.res) {
          if (typeof ctx.res.appendHeader === "function") {
            ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
          } else {
            ctx.res.append("Set-Cookie", sessionCookie.serialize());
          }
        }
      }

      void AuditLogService.record({
        actor: {
          userId: ctx.user.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId,
        },
        module: "auth",
        action: "SESSION_REVOKED",
        severity: "warning",
        entityType: "session",
        entityId: input.sessionId,
        newValues: { reason: "manual_revoke" },
      });

      return { success: true };
    }),

  /**
   * 🔒 HISTÓRICO DE ATIVIDADES DE SEGURANÇA
   */
  recentAuthActivity: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        module: auditLogs.module,
        severity: auditLogs.severity,
        createdAt: auditLogs.createdAt,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        newValues: auditLogs.newValues,
      })
      .from(auditLogs)
      .where(and(eq(auditLogs.userId, ctx.user.id), eq(auditLogs.module, "auth")))
      .orderBy(desc(auditLogs.createdAt))
      .limit(30);

    return logs.map((log) => {
      let reason = "";
      try {
        if (log.newValues) {
          const parsed = JSON.parse(log.newValues);
          reason = parsed.reason || "";
        }
      } catch {}
      return {
        id: log.id,
        action: log.action,
        severity: log.severity,
        createdAt: log.createdAt,
        ipAddress: log.ipAddress || "127.0.0.1",
        userAgent: log.userAgent || "unknown",
        reason,
      };
    });
  }),

  /**
   * 🌐 OAUTH GOOGLE START
   * Gera parâmetros PKCE/state/nonce e retorna a URL de autorização oficial do Google.
   */
  oauthGoogleStart: publicProcedure
    .input(z.object({ provider: z.literal("google") }))
    .mutation(async ({ ctx, input }) => {
      const state = generateState();
      const nonce = generateNonce();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      const url = await generateGoogleAuthUrl({ state, nonce, codeChallenge });

      void AuditLogService.record({
        actor: {
          userId: ctx.user?.id || null,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
        },
        module: "auth",
        action: "OAUTH_START",
        severity: "info",
        entityType: "oauth_flow",
        newValues: { provider: input.provider, state },
      });

      return {
        url,
        state,
        nonce,
        codeVerifier,
        codeChallenge,
      };
    }),

  /**
   * 🌐 OAUTH GOOGLE COMPLETE
   * Endpoint centralizado de callback que realiza login ou auto-cadastro (se não autenticado)
   * ou inicia fluxo de vinculação segura gerando linkingToken (se já autenticado).
   */
  oauthGoogleComplete: publicProcedure
    .input(
      z.object({
        provider: z.literal("google"),
        code: z.string(),
        state: z.string(),
        expectedState: z.string(),
        expectedNonce: z.string(),
        codeVerifier: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // 1. Validar CSRF
      if (input.state !== input.expectedState) {
        void AuditLogService.record({
          actor: {
            userId: ctx.user?.id || null,
            ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
            userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "OAUTH_ERROR",
          severity: "warning",
          entityType: "oauth_flow",
          newValues: { reason: "state_mismatch", provider: input.provider },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "State inválido. Possível ataque de CSRF detectado.",
        });
      }

      let payload;
      try {
        const tokens = await exchangeCodeForTokens({
          code: input.code,
          codeVerifier: input.codeVerifier,
        });

        payload = await verifyGoogleIdToken({
          idToken: tokens.idToken,
          expectedNonce: input.expectedNonce,
        });
      } catch (err: any) {
        void AuditLogService.record({
          actor: {
            userId: ctx.user?.id || null,
            ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
            userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "OAUTH_ERROR",
          severity: "critical",
          entityType: "oauth_flow",
          newValues: { reason: "token_verification_failed", error: err.message, provider: input.provider },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Falha na verificação de identidade do Google: ${err.message}`,
        });
      }

      const providerUserId = payload.sub;
      const email = (payload.email || "").toLowerCase().trim();
      const emailVerified = payload.email_verified === true;
      const name = payload.name || "Usuário Google";

      // Requisito obrigatório: email_verified
      if (!emailVerified) {
        void AuditLogService.record({
          actor: {
            userId: ctx.user?.id || null,
            ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
            userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "OAUTH_LINK_DENIED",
          severity: "warning",
          entityType: "oauth_account",
          newValues: { provider: input.provider, email, reason: "email_not_verified" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O e-mail da conta do Google precisa estar verificado pelo Google.",
        });
      }

      // --- CENÁRIO A: USUÁRIO JÁ AUTENTICADO (Iniciar Fluxo de Vinculação) ---
      if (ctx.user && ctx.session) {
        // Validação de sessão recente (menor que 15 minutos)
        const sessionCreatedAt = (ctx.session as any).createdAt
          ? new Date((ctx.session as any).createdAt)
          : new Date(ctx.session.expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sessionAgeMs = Date.now() - sessionCreatedAt.getTime();
        if (sessionAgeMs > 15 * 60 * 1000) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Sessão expirada ou muito antiga. Por favor, reautentique-se com sua senha para vincular.",
          });
        }

        // Verifica colisão: conta social já vinculada a outro
        const [alreadyLinked] = await db
          .select()
          .from(userOauthAccounts)
          .where(
            and(
              eq(userOauthAccounts.provider, input.provider),
              eq(userOauthAccounts.providerUserId, providerUserId)
            )
          )
          .limit(1);

        if (alreadyLinked) {
          if (alreadyLinked.userId !== ctx.user.id) {
            void AuditLogService.record({
              actor: {
                userId: ctx.user.id,
                ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
              },
              module: "auth",
              action: "OAUTH_LINK_DENIED",
              severity: "critical",
              entityType: "oauth_account",
              newValues: { provider: input.provider, email, reason: "social_account_already_linked_to_other_user" },
            });
            throw new TRPCError({
              code: "CONFLICT",
              message: "Esta conta do Google já está vinculada a outro perfil do sistema.",
            });
          }
          return { success: true, status: "ALREADY_LINKED" as const, message: "Esta conta já está vinculada ao seu perfil." };
        }

        // Verifica colisão: e-mail em uso por outro usuário local
        const [existingUser] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, email), isNull(users.deletedAt)))
          .limit(1);

        if (existingUser && existingUser.id !== ctx.user.id) {
          void AuditLogService.record({
            actor: {
              userId: ctx.user.id,
              ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
              userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
              requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
            },
            module: "auth",
            action: "OAUTH_LINK_DENIED",
            severity: "critical",
            entityType: "oauth_account",
            newValues: { provider: input.provider, email, reason: "email_belongs_to_other_user" },
          });
          throw new TRPCError({
            code: "CONFLICT",
            message: "O e-mail dessa conta Google é utilizado por outro perfil cadastrado.",
          });
        }

        // Gera token temporário assinado de vinculação para confirmação explícita no painel
        const linkingToken = signLinkingToken({
          userId: ctx.user.id,
          provider: input.provider,
          providerUserId,
          email,
          emailVerified,
          expiresAt: Date.now() + 5 * 60 * 1000, // expiração em 5 minutos
        });

        void AuditLogService.record({
          actor: {
            userId: ctx.user.id,
            ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
            userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "OAUTH_LINK_ATTEMPT",
          severity: "info",
          entityType: "oauth_account",
          newValues: { provider: input.provider, email, reason: "needs_explicit_confirmation" },
        });

        return {
          success: false,
          status: "REQUIRES_CONFIRMATION" as const,
          linkingToken,
          email,
        };
      }

      // --- CENÁRIO B: USUÁRIO ANÔNIMO (Login ou Cadastro) ---
      const [oauthMapping] = await db
        .select()
        .from(userOauthAccounts)
        .where(
          and(
            eq(userOauthAccounts.provider, input.provider),
            eq(userOauthAccounts.providerUserId, providerUserId)
          )
        )
        .limit(1);

      if (oauthMapping) {
        // --- 1. LOGIN DE CONTA JÁ VINCULADA ---
        const [user] = await db
          .select()
          .from(users)
          .where(and(eq(users.id, oauthMapping.userId), isNull(users.deletedAt)))
          .limit(1);

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "O usuário associado a esta conta Google não foi localizado ou foi excluído.",
          });
        }

        const ipAddress = ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1";
        const userAgent = ctx.req?.headers?.["user-agent"] || "unknown";

        const session = await lucia.createSession(user.id, { ipAddress, userAgent });
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

        await db
          .update(userOauthAccounts)
          .set({ lastUsedAt: new Date() })
          .where(eq(userOauthAccounts.id, oauthMapping.id));

        await db
          .update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, user.id));

        void AuditLogService.record({
          actor: {
            userId: user.id,
            ipAddress,
            userAgent,
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "OAUTH_LOGIN_SUCCESS",
          severity: "info",
          entityType: "user",
          entityId: user.id,
          newValues: { provider: input.provider, email },
        });

        return {
          success: true,
          status: "SUCCESS" as const,
          user: {
            id: user.id,
            email: user.email,
            name: decrypt(user.name) || user.name,
          },
        };
      }

      // --- 2. CADASTRO OU TAKEOVER ---
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);

      if (existingUser) {
        // Proteção contra Takeover: E-mail existe localmente mas não há vínculo
        void AuditLogService.record({
          actor: {
            userId: null,
            ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
            userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "OAUTH_LINK_DENIED",
          severity: "critical",
          entityType: "oauth_account",
          newValues: { provider: input.provider, email, reason: "email_collision" },
        });
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este e-mail já está associado a uma conta existente. Acesse usando sua senha e vincule a conta Google no seu perfil.",
        });
      }

      // Auto-cadastro de novo usuário
      const newUserId = crypto.randomUUID();
      const ipAddress = ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1";
      const userAgent = ctx.req?.headers?.["user-agent"] || "unknown";

      await db.transaction(async (tx) => {
        let foundReferral: string | null = null;
        if (ctx.guestId) {
          const guestData = await tx.query.guests.findFirst({
            where: eq(guests.id, ctx.guestId)
          });
          if (guestData) foundReferral = guestData.referralCode || null;
        }

        // Criando usuário anônimo e sem senha
        await tx.insert(users).values({
          id: newUserId,
          email,
          password: null,
          name: encrypt(name.trim()),
          customerDocument: null,
          phone: null,
          documentIndex: null,
          phoneIndex: null,
          nameIndex: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(),
          role: "user",
          needsPasswordReset: 0,
          referralCode: foundReferral,
          availablePoints: 0,
          aiCredits: 2,
          lastSignedIn: new Date(),
        });

        // Vinculando a conta social
        await tx.insert(userOauthAccounts).values({
          id: crypto.randomUUID(),
          userId: newUserId,
          provider: input.provider,
          providerUserId,
          email,
          emailVerified: true,
          lastUsedAt: new Date(),
        });
      });

      await promoteCart(ctx.guestId, newUserId);

      const session = await lucia.createSession(newUserId, { ipAddress, userAgent });
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

      void AuditLogService.record({
        actor: {
          userId: newUserId,
          ipAddress,
          userAgent,
          requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
        },
        module: "auth",
        action: "OAUTH_REGISTER_SUCCESS",
        severity: "info",
        entityType: "user",
        entityId: newUserId,
        newValues: { provider: input.provider, email },
      });

      return {
        success: true,
        status: "SUCCESS" as const,
        user: {
          id: newUserId,
          email,
          name,
        },
      };
    }),

  /**
   * 🌐 OAUTH LINK (VINCULAÇÃO DE CONTA)
   * Processa a confirmação explícita validando o token de vinculação gerado.
   */
  oauthLink: protectedProcedure
    .input(
      z.object({
        linkingToken: z.string(),
        confirm: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      if (!input.confirm) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmação explícita é necessária para realizar o vínculo.",
        });
      }

      const payload = verifyLinkingToken(input.linkingToken);
      if (!payload) {
        void AuditLogService.record({
          actor: {
            userId: ctx.user.id,
            ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
            userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
            requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
          },
          module: "auth",
          action: "OAUTH_LINK_DENIED",
          severity: "warning",
          entityType: "oauth_account",
          newValues: { reason: "invalid_or_expired_token" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O link de vinculação expirou ou é inválido. Repita o processo.",
        });
      }

      if (payload.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Token de vinculação não pertence à sua sessão ativa.",
        });
      }

      // Dupla proteção: Garante que não foi cadastrado no intervalo
      const [alreadyLinked] = await db
        .select()
        .from(userOauthAccounts)
        .where(
          and(
            eq(userOauthAccounts.provider, payload.provider),
            eq(userOauthAccounts.providerUserId, payload.providerUserId)
          )
        )
        .limit(1);

      if (alreadyLinked) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Esta conta já foi vinculada a outro perfil de usuário.",
        });
      }

      const uniqueId = crypto.randomUUID();
      await db.insert(userOauthAccounts).values({
        id: uniqueId,
        userId: ctx.user.id,
        provider: payload.provider,
        providerUserId: payload.providerUserId,
        email: payload.email,
        emailVerified: payload.emailVerified,
        lastUsedAt: new Date(),
      });

      void AuditLogService.record({
        actor: {
          userId: ctx.user.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
        },
        module: "auth",
        action: "OAUTH_LINK_SUCCESS",
        severity: "info",
        entityType: "oauth_account",
        entityId: uniqueId,
        newValues: { provider: payload.provider, email: payload.email },
      });

      return { success: true, message: "Conta Google vinculada com sucesso!" };
    }),

  /**
   * 🌐 UNLINK OAUTH ACCOUNT (DESVINCULAÇÃO DE CONTA SOCIAL)
   * Impede a desvinculação se a conta não possuir senha e for a última forma de autenticação.
   */
  unlinkOAuthAccount: protectedProcedure
    .input(
      z.object({
        provider: z.literal("google"),
        confirm: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      if (!input.confirm) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmação explícita é necessária para desvincular a conta.",
        });
      }

      // 1. Verificar se usuário possui senha local
      const [user] = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." });
      }

      // 2. Contar vínculos ativos de login social
      const socialAccounts = await db
        .select()
        .from(userOauthAccounts)
        .where(eq(userOauthAccounts.userId, ctx.user.id));

      const hasPassword = !!user.password;
      const oauthCount = socialAccounts.length;

      // Se não há senha Argon2 local e este é o único vínculo social, bloqueia desvinculação
      if (!hasPassword && oauthCount <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode desvincular seu único método de acesso. Defina uma senha local primeiro.",
        });
      }

      // Deletar o vínculo do provedor correspondente
      await db
        .delete(userOauthAccounts)
        .where(
          and(
            eq(userOauthAccounts.userId, ctx.user.id),
            eq(userOauthAccounts.provider, input.provider)
          )
        );

      void AuditLogService.record({
        actor: {
          userId: ctx.user.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
        },
        module: "auth",
        action: "OAUTH_UNLINK",
        severity: "info",
        entityType: "oauth_account",
        newValues: { provider: input.provider },
      });

      return { success: true, message: "Conta desvinculada com sucesso." };
    }),

  /**
   * 🌐 LIST OAUTH ACCOUNTS
   * Lista as contas sociais conectadas no painel do usuário.
   */
  listOAuthAccounts: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const accounts = await db
        .select()
        .from(userOauthAccounts)
        .where(eq(userOauthAccounts.userId, ctx.user.id));

      return accounts.map(acc => ({
        provider: acc.provider,
        email: acc.email,
        createdAt: acc.createdAt,
        lastUsedAt: acc.lastUsedAt,
      }));
    }),
});
