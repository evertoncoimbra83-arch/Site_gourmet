import { Lucia } from "lucia";
import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { getDb } from "./db.js";
import { sessions, carts, cartItems, users, guests } from "../drizzle/schema/index.js";
import { eq, and, isNull, or } from "drizzle-orm";
import { logger } from "./logger.js";
import { decrypt } from "./encryption.js";

// Instância global do banco
const db = await getDb();

if (!db) {
  throw new Error("Não foi possível inicializar o banco de dados no módulo de autenticação.");
}

const adapter = new DrizzleMySQLAdapter(db, sessions, users);

function normalizeJson(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return normalizeJson(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeJson((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function sameCartConfiguration(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeJson(a)) === JSON.stringify(normalizeJson(b));
}

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  getUserAttributes: (attributes) => {
    let cleanName = attributes.name || "";
    // Se o nome contiver o separador de encriptação, tenta descriptografar
    if (cleanName && cleanName.includes(":")) {
       try { cleanName = decrypt(cleanName) || cleanName; } catch { /* mantém original */ }
    }

    return {
      email: attributes.email,
      name: cleanName,
      role: attributes.role ?? "user",
      referralCode: attributes.referralCode ?? null,
      needsPasswordReset: Number(attributes.needsPasswordReset) === 1 || attributes.needsPasswordReset === true, 
      deletedAt: attributes.deletedAt ?? null,
    };
  },
  getSessionAttributes: (attributes) => {
    return {
      referralCode: attributes.referralCode ?? null,
      guestId: attributes.guestId ?? null,
      userAgent: attributes.userAgent ?? null,
      ipAddress: attributes.ipAddress ?? null,
    };
  },
});

/**
 * 🛠️ PROMOÇÃO DE CARRINHO + TRANSFERÊNCIA DE REFERRAL
 */
export async function promoteCart(guestSessionId: string | null | undefined, userId: string | number): Promise<void> {
  if (!guestSessionId || ["undefined", "null", ""].includes(String(guestSessionId))) return;
  const userIdStr = String(userId);

  try {
    const guestCheck = await db.query.guests.findFirst({
      where: eq(guests.id, guestSessionId),
      columns: { id: true, convertedUserId: true, referralCode: true }
    });

    if (!guestCheck) return;
    if (guestCheck.convertedUserId && String(guestCheck.convertedUserId) !== userIdStr) {
      return;
    }

    await db.transaction(async (tx) => {
      // 1. Referral
      if (guestCheck.referralCode) {
        await tx.update(users)
          .set({ referralCode: guestCheck.referralCode })
          .where(and(eq(users.id, userIdStr), isNull(users.referralCode)));
      }

      // 3. Busca carrinhos
      const userCart = await tx.query.carts.findFirst({
        where: and(eq(carts.userId, userIdStr), eq(carts.status, "active"))
      });

      const guestCart = await tx.query.carts.findFirst({
        where: and(
          or(eq(carts.guestId, guestSessionId), eq(carts.sessionId, guestSessionId)),
          eq(carts.status, "active")
        )
      });

      if (!guestCart) return;

      if (userCart && userCart.id !== guestCart.id) {
        const guestItems = await tx.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));
        const userItems = await tx.select().from(cartItems).where(eq(cartItems.cartId, userCart.id));

        for (const item of guestItems) {
          const duplicate = userItems.find(
            (candidate) =>
              String(candidate.dishId ?? "") === String(item.dishId ?? "") &&
              String(candidate.packageId ?? "") === String(item.packageId ?? "") &&
              sameCartConfiguration(candidate.options, item.options),
          );

          if (duplicate) {
            const newQty = (duplicate.quantity || 0) + (item.quantity || 0);
            await tx.update(cartItems).set({ quantity: newQty }).where(eq(cartItems.id, duplicate.id));
            duplicate.quantity = newQty;
            await tx.delete(cartItems).where(eq(cartItems.id, item.id));
          } else {
            await tx.update(cartItems).set({ cartId: userCart.id }).where(eq(cartItems.id, item.id));
            userItems.push({ ...item, cartId: userCart.id });
          }
        }
        await tx.delete(carts).where(eq(carts.id, guestCart.id));
      } 
      else if (!userCart) {
        await tx.update(carts)
          .set({ userId: userIdStr, guestId: null, sessionId: null, updatedAt: new Date() })
          .where(eq(carts.id, guestCart.id));
      }

      await tx.update(guests)
        .set({ convertedUserId: userIdStr, lastActive: new Date() }) 
        .where(eq(guests.id, guestSessionId));
    });

    logger.info({ userId: userIdStr, guestId: guestSessionId }, "Promoção de carrinho concluída");

  } catch (error: unknown) {
    const dbError = error as { errno?: number; code?: string; message?: string };

    if (dbError.errno === 1020 || dbError.code === "ER_CHECKREAD") {
      return; 
    }
    
    logger.error(
      { err: dbError.message, guestId: guestSessionId, userId: userIdStr }, 
      "Erro ao promover carrinho"
    );
  }
} // ✅ CHAVE ADICIONADA AQUI

/**
 * 📝 INTEGRAÇÃO DE TIPOS LUCIA
 */
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
    DatabaseSessionAttributes: DatabaseSessionAttributes;
  }

  interface DatabaseUserAttributes {
    email: string;
    name: string | null;
    role: "admin" | "user" | "super_admin" | "operator" | "nutri";
    needsPasswordReset: number | boolean | null; 
    referralCode?: string | null;
    deletedAt?: Date | null;
  }

  interface DatabaseSessionAttributes {
    referralCode?: string | null;
    guestId?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
  }
}
