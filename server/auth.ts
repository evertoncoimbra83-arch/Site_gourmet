// server/auth.ts
import { Lucia } from "lucia";
import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { getDb } from "./db.js";
import { authUsers, sessions, carts, cartItems } from "../drizzle/schema/index.js";
import { eq, and, isNull, or } from "drizzle-orm";

const db = await getDb();

// Configuração do Adaptador Lucia para Drizzle
const adapter = new DrizzleMySQLAdapter(db, sessions, authUsers);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  getUserAttributes: (attributes: any) => {
    return {
      email: attributes.email,
      name: attributes.name ?? "",
      role: attributes.role ?? "customer",
    };
  },
});

/**
 * 🛠️ PROMOÇÃO DE CARRINHO (Merge de Itens)
 * Transfere itens de um carrinho anônimo (visitante) para o usuário logado.
 */
export async function promoteCart(guestSessionId: string, userId: string | number) {
  if (!guestSessionId || guestSessionId === "undefined" || guestSessionId === "null") return;

  const userIdStr = String(userId);

  try {
    const db = await getDb();
    if (!db) return;

    // 1. Busca carrinho ativo do usuário
    const userCart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, userIdStr), eq(carts.status, "active"))
    });

    // 2. Busca carrinho de convidado (procura em guestId OU sessionId por segurança)
    const guestCart = await db.query.carts.findFirst({
      where: and(
        or(eq(carts.guestId, guestSessionId), eq(carts.sessionId, guestSessionId)),
        eq(carts.status, "active")
      )
    });

    if (!guestCart) return;

    // --- CENÁRIO A: O usuário JÁ TINHA um carrinho antes desta sessão ---
    if (userCart && userCart.id !== guestCart.id) {
      const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));

      for (const item of guestItems) {
        // Verifica se o item já existe no carrinho de destino para somar quantidade
        const [duplicate] = await db.select().from(cartItems).where(
          and(
            eq(cartItems.cartId, userCart.id),
            item.dishId ? eq(cartItems.dishId, item.dishId) : isNull(cartItems.dishId),
            item.packageId ? eq(cartItems.packageId, item.packageId) : isNull(cartItems.packageId)
          )
        );

        if (duplicate) {
          const newQty = Number(duplicate.quantity || 0) + Number(item.quantity || 0);
          await db.update(cartItems)
            .set({ quantity: newQty }) 
            .where(eq(cartItems.id, duplicate.id));
          
          // Remove o item do carrinho anônimo pois ele foi "mesclado"
          await db.delete(cartItems).where(eq(cartItems.id, item.id));
        } else {
          // Apenas move o item para o novo carrinho
          await db.update(cartItems)
            .set({ cartId: userCart.id })
            .where(eq(cartItems.id, item.id));
        }
      }
      // Deleta o carrinho de visitante agora que está vazio
      await db.delete(carts).where(eq(carts.id, guestCart.id));
    } 
    // --- CENÁRIO B: O usuário NÃO tinha carrinho, vamos "adotar" o de visitante ---
    else if (guestCart && !userCart) {
      await db.update(carts)
        .set({ 
          userId: userIdStr,
          guestId: null, // Limpa para indicar que agora é um carrinho de usuário real
          sessionId: null, 
          status: "active",
          updatedAt: new Date() 
        } as any)
        .where(eq(carts.id, guestCart.id));
    }
  } catch (error) {
    console.error("❌ [CART-ERROR] Erro ao promover carrinho:", error);
  }
}

// ✅ TIPAGEM GLOBAL LUCIA
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string | null;
      role: string;
    };
  }
}