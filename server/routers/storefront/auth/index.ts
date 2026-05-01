// server/routers/storefront/auth/index.ts

import {
  router,
  publicProcedure,
  createRateLimitMiddleware,
} from "../../../_core/trpc.js";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db.js";
import { users } from "../../../../drizzle/schema/index.js";
import { decrypt } from "../../../encryption.js";

import { 
  registerProcedure, 
  loginProcedure, 
  logoutProcedure,
  requestPasswordResetProcedure,
  resetPasswordProcedure 
} from "./auth.procedures.js";

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
        .where(eq(users.email, cleanEmail))
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
      }),
    )
    .input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("E-mail inválido").transform(v => v.toLowerCase().trim()),
      password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
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
      }),
    )
    .input(z.object({ 
      email: z.string().email("E-mail inválido").transform(v => v.toLowerCase().trim()) 
    }))
    .mutation(async ({ input }): Promise<ActionResponse> => {
      return requestPasswordResetProcedure({ input });
    }),

  /**
   * 🔄 EXECUÇÃO DA TROCA DE SENHA
   */
  resetPassword: publicProcedure
    .input(z.object({ 
      token: z.string().min(1, "Token obrigatório"), 
      password: z.string().min(6, "Senha muito curta") 
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
});
