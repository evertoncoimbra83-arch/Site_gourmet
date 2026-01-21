import { eq, and, isNull } from "drizzle-orm";
import { carts, cartItems } from "../../../../drizzle/schema/index.js"; 
import { getDb } from "../../../db.js";
import crypto from "crypto";

/**
 * 🌪️ FUSÃO DE CARRINHOS (Merge Strategy)
 * Garante que itens adicionados como visitante não sejam perdidos ao logar.
 */
export async function mergeGuestCartIntoUserCart(guestId: string, userId: string) {
  const db = await getDb();
  if (!db) return null;

  // 1. Busca se existe um carrinho ANÔNIMO ativo
  const [guestCart] = await db.select().from(carts).where(
    and(
      eq(carts.guestId, guestId),
      eq(carts.status, "active")
    )
  ).limit(1);

  // Se não tem carrinho anônimo, não há nada para mesclar.
  if (!guestCart) return null;

  // 2. Busca se existe um carrinho de USUÁRIO ativo (antigo)
  const [userCart] = await db.select().from(carts).where(
    and(
      eq(carts.userId, userId),
      eq(carts.status, "active")
    )
  ).limit(1);

  // CENÁRIO A: Usuário não tem carrinho antigo.
  // Solução: Simplesmente "toma posse" do carrinho anônimo.
  if (!userCart) {
    await db.update(carts)
      .set({ userId: userId, guestId: null } as any)
      .where(eq(carts.id, guestCart.id));
    return guestCart.id;
  }

  // CENÁRIO B: Usuário JÁ TEM carrinho antigo e também tem um anônimo.
  // Solução: Mover os itens do anônimo para o antigo e deletar o anônimo.
  if (userCart && guestCart.id !== userCart.id) {
    // Busca itens do carrinho anônimo
    const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));

    if (guestItems.length > 0) {
      for (const item of guestItems) {
        // ✅ CORREÇÃO: Compara dishId OU packageId
        const [existingItem] = await db.select().from(cartItems).where(
          and(
            eq(cartItems.cartId, userCart.id),
            // Se o item for um prato, compara dishId. Se não, garante que dishId é nulo no destino.
            item.dishId ? eq(cartItems.dishId, item.dishId) : isNull(cartItems.dishId),
            // Se o item for um pacote, compara packageId.
            item.packageId ? eq(cartItems.packageId, item.packageId) : isNull(cartItems.packageId),
            // Opcional: comparar 'options' se quiser diferenciar personalizações (ex: sem cebola vs com cebola)
            // eq(cartItems.options, item.options) 
          )
        ).limit(1);

        if (existingItem) {
          // Soma quantidade se o item for idêntico
          const newQty = Number(existingItem.quantity) + Number(item.quantity);
          await db.update(cartItems)
            .set({ quantity: newQty } as any)
            .where(eq(cartItems.id, existingItem.id));
            
          // Remove o item original do carrinho anônimo (já foi somado)
          await db.delete(cartItems).where(eq(cartItems.id, item.id));
        } else {
          // Move o item para o carrinho do usuário
          await db.update(cartItems)
            .set({ cartId: userCart.id } as any) // Mantém o ID do item, só troca o pai
            .where(eq(cartItems.id, item.id));
        }
      }
    }

    // Deleta o carrinho anônimo que ficou vazio (ou com itens já movidos)
    await db.delete(carts).where(eq(carts.id, guestCart.id));
    
    // Retorna o ID do carrinho do usuário (que agora tem tudo)
    return userCart.id;
  }

  return userCart.id;
}