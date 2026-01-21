import { initTRPC, TRPCError } from "@trpc/server";
import { type TrpcContext } from "./context.js"; 
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * Inicialização do tRPC.
 * Centralizamos aqui para que todos os roteadores herdem as mesmas configurações.
 */
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// === EXPORTAÇÕES BÁSICAS ===
export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const middleware = t.middleware;

/**
 * 🔓 1. PROCEDIMENTO PÚBLICO
 * Acesso livre para qualquer um.
 */
export const publicProcedure = t.procedure;
export const trackedPublicProcedure = t.procedure; 

/**
 * 🔐 2. MIDDLEWARE DE AUTENTICAÇÃO (isAuthed)
 * Garante que o usuário está logado.
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED", 
      message: "Sessão expirada ou não autenticada." 
    });
  }
  
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
    },
  });
});

/**
 * 👑 3. MIDDLEWARE DE ADMIN (isAdmin)
 * Garante que o usuário está logado E é um administrador.
 */
const isAdminMiddleware = t.middleware(({ ctx, next }) => {
  // Verifica se o usuário existe e se a role é 'admin'
  if (!ctx.user || ctx.user.role !== 'admin') {
    console.warn(`[🛡️ SEGURANÇA] Acesso Admin negado para: ${ctx.user?.email || 'Anônimo'}`);
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Acesso restrito a administradores." 
    });
  }
  
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
      isAdmin: true,
    },
  });
});

// === EXPORTAÇÃO DOS PROCEDIMENTOS FINAIS ===

/**
 * Use este para rotas que exigem apenas login (ex: Perfil, Meus Pedidos)
 */
export const protectedProcedure = t.procedure.use(isAuthed);
export const authProcedure = protectedProcedure; 

/**
 * ✅ USE ESTE PARA TODAS AS ROTAS DO PAINEL ADMIN
 * (Accompaniments, Sizes, Dishes, Users, etc.)
 */
export const adminProcedure = t.procedure.use(isAdminMiddleware);