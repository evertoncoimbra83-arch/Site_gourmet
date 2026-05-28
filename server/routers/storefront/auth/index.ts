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
import { users, sessions, auditLogs, userOauthAccounts } from "../../../../drizzle/schema/index.js";
import { decrypt } from "../../../encryption.js";
import { lucia } from "../../../auth.js";
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

      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, cleanEmail), isNull(users.deletedAt)))
        .limit(1);

      return { 
        exists: !!existingUser 
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
      return {
        ...ctx.user,
        name: profile.name ? decrypt(profile.name) : null,
        customerDocument: profile.customerDocument ? decrypt(profile.customerDocument) : null,
        phone: profile.phone ? decrypt(profile.phone) : null,
        availablePoints: Number(profile.availablePoints || 0),
        aiCredits: Number(profile.aiCredits ?? 0),
        needsPasswordReset: profile.needsPasswordReset === 1,
        email: profile.email,
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
   * 🌐 OAUTH START
   * Gera e retorna os parâmetros PKCE, state e nonce para iniciar o fluxo.
   */
  oauthStart: publicProcedure
    .input(z.object({ provider: z.literal("google") }))
    .mutation(async ({ ctx, input }) => {
      const state = generateState();
      const nonce = generateNonce();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

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
        state,
        nonce,
        codeVerifier,
        codeChallenge,
      };
    }),

  /**
   * 🌐 OAUTH CALLBACK
   * Valida state/nonce e troca o código pelo payload Google decodificado.
   * Não cria sessão local nesta fase (P1).
   */
  oauthCallback: publicProcedure
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
      // 1. Validar state contra CSRF
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
        // 2. Trocar code por tokens
        const tokens = await exchangeCodeForTokens({
          code: input.code,
          codeVerifier: input.codeVerifier,
        });

        // 3. Validar ID Token criptograficamente
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
      const email = payload.email || "";
      const emailVerified = payload.email_verified === true;
      const name = payload.name || null;
      const picture = payload.picture || null;

      void AuditLogService.record({
        actor: {
          userId: ctx.user?.id || null,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId || crypto.randomUUID(),
        },
        module: "auth",
        action: "OAUTH_CALLBACK",
        severity: "info",
        entityType: "oauth_flow",
        newValues: { provider: input.provider, email, emailVerified, providerUserId },
      });

      return {
        provider: input.provider,
        providerUserId,
        email,
        emailVerified,
        name,
        picture,
      };
    }),

  /**
   * 🌐 OAUTH LINK (ACCOUNT LINKING & TAKEOVER PROTECTION)
   * Vincula uma conta Google ao perfil logado do usuário atual com segurança estrita.
   */
  oauthLink: protectedProcedure
    .input(
      z.object({
        provider: z.literal("google"),
        providerUserId: z.string(),
        email: z.string().email(),
        emailVerified: z.boolean(),
        forceConfirm: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // Regra 1: email_verified deve ser true
      if (!input.emailVerified) {
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
          newValues: { provider: input.provider, email: input.email, reason: "email_not_verified" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O e-mail da conta do Google precisa estar verificado para ser vinculado.",
        });
      }

      // Regra 2: Verifica se esta conta externa já está vinculada a alguém
      const [alreadyLinked] = await db
        .select()
        .from(userOauthAccounts)
        .where(
          and(
            eq(userOauthAccounts.provider, input.provider),
            eq(userOauthAccounts.providerUserId, input.providerUserId)
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
            newValues: { provider: input.provider, email: input.email, reason: "social_account_already_linked_to_other_user" },
          });
          throw new TRPCError({
            code: "CONFLICT",
            message: "Esta conta do Google já está vinculada a outro usuário do sistema.",
          });
        }

        // Se já for do usuário atual
        return { success: true, message: "Esta conta já está vinculada ao seu perfil." };
      }

      // Regra 3: Se o e-mail coincidido com o Google já pertencer a outro usuário
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, input.email.toLowerCase().trim()), isNull(users.deletedAt)))
        .limit(1);

      if (existingUser) {
        if (existingUser.id !== ctx.user.id) {
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
            newValues: { provider: input.provider, email: input.email, reason: "email_belongs_to_other_user" },
          });
          throw new TRPCError({
            code: "CONFLICT",
            message: "O e-mail dessa conta Google é utilizado por outro perfil cadastrado.",
          });
        }

        // Se o e-mail coincide com o dele mesmo, mas ele não confirmou a vinculação de forma explícita
        if (!input.forceConfirm) {
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
            newValues: { provider: input.provider, email: input.email, reason: "needs_explicit_confirmation" },
          });
          return { success: false, status: "REQUIRES_CONFIRMATION", message: "Confirme a associação de sua conta Google ao seu e-mail cadastrado." };
        }
      }

      // Vínculo seguro
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
        newValues: { provider: input.provider, email: input.email },
      });

      const uniqueId = crypto.randomUUID();
      await db.insert(userOauthAccounts).values({
        id: uniqueId,
        userId: ctx.user.id,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email,
        emailVerified: input.emailVerified,
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
        newValues: { provider: input.provider, email: input.email },
      });

      return { success: true, message: "Conta Google vinculada com sucesso!" };
    }),
});
