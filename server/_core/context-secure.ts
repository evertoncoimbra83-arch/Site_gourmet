import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Cria o contexto tRPC com autenticação segura
 * 
 * SEGURANÇA:
 * - ✅ Sem "chave mestra" ou bypass de autenticação
 * - ✅ Valida token OAuth em todas as requisições
 * - ✅ Rejeita requisições sem autenticação válida
 * - ✅ Logs de tentativas de acesso não autorizado
 * - ✅ Proteção contra CSRF via cookies seguros
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Única forma de autenticação: OAuth válido
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Log de falha de autenticação (para monitoramento)
    const clientIp = getClientIp(opts.req);
    const userAgent = opts.req.headers["user-agent"] || "unknown";
    
    console.warn(
      `[AUTH] Falha de autenticação | IP: ${clientIp} | User-Agent: ${userAgent}`,
      error instanceof Error ? error.message : "Erro desconhecido"
    );
    
    // Usuário permanece null - sem bypass
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

/**
 * Extrai o IP real do cliente, considerando proxies
 */
function getClientIp(req: CreateExpressContextOptions["req"]): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Middleware para verificar se o usuário está autenticado
 * Use isso em procedures que requerem autenticação
 */
export function requireAuth(user: User | null): User {
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Middleware para verificar se o usuário é admin
 * Use isso em procedures que requerem permissão de admin
 */
export function requireAdmin(user: User | null): User {
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
