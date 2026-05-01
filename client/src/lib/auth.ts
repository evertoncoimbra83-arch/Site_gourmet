import { TRPCError } from "@trpc/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { serialize, type CookieSerializeOptions } from "cookie";
import bcrypt from "bcryptjs";

// ✅ Ajuste de importação para compatibilidade com Node v24
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { authenticator } = require('otplib');

import { publicProcedure, router } from "../../../server/_core/trpc.js"; 
import { getDb } from "../../../server/db"; 

// --- CONFIGURAÇÕES E TIPAGENS ---
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

interface AuthResponse {
  success: boolean;
  isEmergency?: boolean;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

const COOKIE_OPTIONS: CookieSerializeOptions = {
  httpOnly: true,
  path: "/",
  sameSite: 'lax',
  secure: process.env.NODE_ENV === "production", 
  maxAge: 60 * 60 * 24 * 7, 
};

export const authRouter = router({
  
  login: publicProcedure
    .input(z.object({ 
      email: z.string().email("E-mail inválido"), 
      password: z.string().min(1, "Senha é obrigatória"),
      emergencySecret: z.string().optional(),
      totpCode: z.string().optional()
    }))
    .mutation(async ({ input, ctx }): Promise<AuthResponse> => {
      
      // 🚨 1. CIRCUITO DE EMERGÊNCIA (ZERO-KNOWLEDGE)
      // Se o e-mail bater com o .env falso, validamos sem o banco .10
      if (
        input.email === process.env.EMERGENCY_LOGIN_EMAIL && 
        input.emergencySecret && 
        input.totpCode
      ) {
        const isValidEmergency = authenticator.check(input.totpCode, input.emergencySecret);

        if (isValidEmergency) {
          console.warn(`⚠️ [SECURITY] ACESSO DE EMERGÊNCIA UTILIZADO POR: ${input.email}`);
          
          const token = jwt.sign(
            { id: "emergency-admin", role: "ADMIN" }, 
            JWT_SECRET, 
            { expiresIn: "2h" } 
          );

          if (ctx.res) {
            const cookieStr = serialize("token", token, COOKIE_OPTIONS);
            ctx.res.setHeader("Set-Cookie", cookieStr);
          }

          return { 
            success: true, 
            isEmergency: true,
            user: { id: "emergency", name: "Everton (Contingência)", role: "ADMIN" } 
          };
        }
        
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Código de emergência ou Segredo Master inválidos." 
        });
      }

      // 2. FLUXO NORMAL (DEPENDENTE DO BANCO .10)
      try {
        const db = await getDb();
        
        const user = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, input.email),
        });

        if (!user || !user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });
        }

        const isValid = await bcrypt.compare(input.password, user.password);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });
        }

        const token = jwt.sign(
          { id: user.id, role: user.role }, 
          JWT_SECRET, 
          { expiresIn: "7d" }
        );

        if (ctx.res) {
          const cookieStr = serialize("token", token, COOKIE_OPTIONS);
          ctx.res.setHeader("Set-Cookie", cookieStr);
        }

        return { 
          success: true, 
          user: { id: user.id, name: user.name ?? "Usuário", role: user.role ?? "user" } 
        };

      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("❌ Falha crítica de conexão com o banco .10");
        
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Servidor de dados offline. Use o acesso de contingência." 
        });
      }
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return null;
    
    // Bypass do banco também no procedimento 'me' para manter a sessão ativa na contingência
    if (userId === "emergency-admin") {
      return { id: userId, name: "Everton (Contingência)", email: process.env.EMERGENCY_LOGIN_EMAIL, role: "ADMIN" };
    }

    try {
      const db = await getDb();
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name ?? "Usuário",
        email: user.email,
        role: user.role
      };
    } catch {
      return null;
    }
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    if (ctx.res) {
      const cookieStr = serialize("token", "", {
        ...COOKIE_OPTIONS,
        maxAge: 0, 
      });
      ctx.res.setHeader("Set-Cookie", cookieStr);
    }
    return { success: true };
  }),
});