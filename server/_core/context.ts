// server/_core/context.ts

import { type CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { type inferAsyncReturnType } from "@trpc/server";
import { getDb } from "../db.js"; 
import { lucia, promoteCart } from "../auth.js"; 
import { guests, users } from "../../drizzle/schema/index.js"; 
import { eq, and, isNull } from "drizzle-orm"; 

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const db = await getDb();
  
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  const { session, user } = sessionId 
    ? await lucia.validateSession(sessionId) 
    : { session: null, user: null };

  const guestId = req.headers["x-guest-id"] as string | undefined;
  
  // Tenta capturar o referral de todas as fontes possíveis
  const referralCode = (req.headers["x-referral-code"] || req.headers["referral"]) as string | undefined;

  if (guestId) {
    try {
      await db.insert(guests)
        .values({
          id: guestId,
          referralCode: referralCode || null,
          lastActive: new Date(),
        })
        .onDuplicateKeyUpdate({
          set: { 
            referralCode: referralCode || undefined,
            lastActive: new Date()
          }
        });

      if (user) {
        promoteCart(guestId, user.id).catch((err: unknown) => {
          console.error("❌ [Context] Erro ao promover carrinho:", err);
        });

        // VÍNCULO DE REFERRAL NO USUÁRIO
        if (referralCode) {
          const cleanReferral = referralCode.toLowerCase().trim();
          
          await db.update(users)
            .set({ referralCode: cleanReferral })
            .where(
              and(
                eq(users.id, user.id),
                // Só vincula se o usuário ainda for um "órfão"
                isNull(users.referralCode) 
              )
            )
            // ✅ FIX (no-explicit-any): Tipagem segura sem uso de 'any'
            .then((result: unknown) => {
              const parsedResult = result as [{ affectedRows?: number }];
              const affected = parsedResult[0]?.affectedRows || 0;
              
              if (affected > 0) {
                console.log(`\x1b[32m%s\x1b[0m`, `✅ [Referral Success] Usuário ${user.id} agora é indicado de: ${cleanReferral}`);
              }
            })
            .catch((err: unknown) => console.error("❌ Erro ao vincular referral ao user:", err));
        }
      }
    } catch (err: unknown) {
      console.error("❌ [DB ERROR] Falha ao sincronizar guest/referral:", err);
    }
  }

  // BLINDAGEM DOS COOKIES LUCIA
  try {
    if (session && session.fresh) {
      const newCookie = lucia.createSessionCookie(session.id);
      
      // Removemos a validade para forçar "Cookie de Sessão"
      newCookie.attributes.maxAge = undefined;
      // ✅ FIX: Comentário '@ts-expect-error' removido pois o TypeScript já valida nativamente
      newCookie.attributes.expires = undefined;

      if (typeof res.appendHeader === "function") {
        res.appendHeader("Set-Cookie", newCookie.serialize());
      } else {
        res.append("Set-Cookie", newCookie.serialize());
      }
    } else if (!session && sessionId) {
      const blankCookie = lucia.createBlankSessionCookie();
      
      if (typeof res.appendHeader === "function") {
        res.appendHeader("Set-Cookie", blankCookie.serialize());
      } else {
        res.append("Set-Cookie", blankCookie.serialize());
      }
    }
  } catch (cookieErr) {
    console.error("⚠️ [Cookie] Erro ao manipular headers de sessão:", cookieErr);
  }

  return { req, res, user, session, guestId: guestId || null, db };
}

export type TrpcContext = inferAsyncReturnType<typeof createContext>;