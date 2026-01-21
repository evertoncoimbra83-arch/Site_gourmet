// server/_core/context.ts
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { lucia } from "server/auth.js"; // Importa o Lucia que você acabou de achar
import { getDb } from "server/db.js";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // 1. Captura o guestId (UUID gerado no frontend)
  const guestId = req.headers["x-guest-id"] as string | undefined;

  // 2. Lê o cookie de sessão do Lucia
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  
  if (!sessionId) {
    return { 
      req, res, 
      user: null, 
      session: null, 
      guestId: guestId || null,
      db: await getDb() 
    };
  }

  // 3. Valida a sessão com o Lucia
  const { session, user } = await lucia.validateSession(sessionId);

  // 4. Renova o cookie se necessário
  if (session && session.fresh) {
    res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
  }
  
  if (!session) {
    res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
  }

  return { 
    req, res, 
    user, 
    session, 
    guestId: guestId || null,
    db: await getDb()
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;