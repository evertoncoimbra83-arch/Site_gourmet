import * as trpcExpress from "@trpc/server/adapters/express";
import { lucia } from "../auth.js"; 
import { getDb } from "../db.js";

/**
 * Cria o contexto para as requisições tRPC.
 * Captura Usuário (Lucia), Sessão, IP e User-Agent para Auditoria.
 */
export const createContext = async ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  // 1. INICIALIZAÇÃO DO BANCO
  // Já deixamos o DB pronto no contexto para evitar chamadas repetidas
  const db = await getDb();

  // 2. METADADOS DA CONEXÃO
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers['user-agent'] || "unknown";
  
  // 3. IDENTIFICAÇÃO DO VISITANTE (CARRINHO ANÔNIMO)
  // O frontend deve enviar 'x-guest-id' (gerado no localStorage)
  // Mantivemos suporte a 'x-session-id' caso você ainda esteja usando o nome antigo
  const guestId = (req.headers['x-guest-id'] as string) || (req.headers['x-session-id'] as string) || null;

  // 4. AUTENTICAÇÃO (LUCIA AUTH)
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");

  let user = null;
  let session = null;

  if (sessionId) {
    const validSession = await lucia.validateSession(sessionId);
    
    // Gerenciamento de Cookies (Renovação Automática)
    if (validSession.session && validSession.session.fresh) {
      const sessionCookie = lucia.createSessionCookie(validSession.session.id);
      res.appendHeader("Set-Cookie", sessionCookie.serialize());
    }
    if (!validSession.session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      res.appendHeader("Set-Cookie", sessionCookie.serialize());
    }

    user = validSession.user;
    session = validSession.session;
  }

  // 5. RETORNO DO CONTEXTO UNIFICADO
  return {
    // Ferramentas
    db,
    req,
    res,
    
    // Auditoria
    ip,
    userAgent,
    
    // Autenticação (Login Real)
    session, // Objeto de sessão do Lucia (ou null)
    user,    // Objeto de usuário do Lucia (ou null)
    userId: user?.id ?? null, // Atalho para o ID do usuário
    isAdmin: (user as any)?.role === 'admin',

    // Visitante (Login Anônimo)
    // ✅ Isso é o que o Cart Router vai usar quando user for null
    guestId, 
  };
};

export type TrpcContext = Awaited<ReturnType<typeof createContext>>;