import { TRPCError } from "@trpc/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
//import { serialize } from "cookie"; // ✅ Importação nomeada para compatibilidade v1.0+
import bcrypt from "bcryptjs";

// ✅ Caminhos ajustados para a estrutura do servidor
import { publicProcedure, router } from "server/_core/trpc.js"; 
import { getDb } from "../../../server/db"; 
import { users } from "drizzle/schema/index.js"; 
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

export const authRouter = router({
  
  // 1. LOGIN DESENVOLVIMENTO (Backdoor para testes locais)
  devLogin: publicProcedure
    .mutation(async ({ ctx }) => {
      if (process.env.NODE_ENV === 'production') {
        throw new TRPCError({ 
          code: 'FORBIDDEN', 
          message: 'Dev login desabilitado em produção.' 
        });
      }

      const db = await getDb();
      
      // Busca o primeiro usuário com papel de admin
      const adminUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.role, 'admin'), 
      });

      if (!adminUser) {
        throw new TRPCError({ 
          code: 'NOT_FOUND', 
          message: 'Nenhum administrador encontrado no sistema.' 
        });
      }

      const token = jwt.sign(
        { id: adminUser.id, role: adminUser.role }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      // ✅ Define o cookie HttpOnly no cabeçalho da resposta
      if (ctx.res) {
        ctx.res.setHeader('Set-Cookie', serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 dias
          })
        );
      }

      return { 
        success: true, 
        user: { id: adminUser.id, name: adminUser.name, role: adminUser.role } 
      };
    }),

  // 2. LOGIN PADRÃO (E-mail e Senha)
  login: publicProcedure
    .input(z.object({ 
      email: z.string().email("E-mail inválido"), 
      password: z.string().min(1, "Senha é obrigatória") 
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, input.email),
      });

      if (!user || !user.password) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Credenciais inválidas." 
        });
      }

      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Credenciais inválidas." 
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: "7d" }
      );

      if (ctx.res) {
        ctx.res.setHeader("Set-Cookie", serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
          })
        );
      }

      return { 
        success: true, 
        user: { id: user.id, name: user.name, role: user.role } 
      };
    }),

  // 3. ME (Retorna dados do usuário logado baseado no Token)
  me: publicProcedure.query(async ({ ctx }) => {
    // ctx.user deve ser preenchido pelo seu middleware de autenticação no trpc.ts
    if (!ctx.user?.id) return null;
    
    const db = await getDb();
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, ctx.user!.id),
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }),

  // 4. LOGOUT (Limpa o Cookie)
  logout: publicProcedure.mutation(({ ctx }) => {
    if (ctx.res) {
      ctx.res.setHeader("Set-Cookie", serialize("token", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 0, // Expira imediatamente
        })
      );
    }
    return { success: true };
  }),
});