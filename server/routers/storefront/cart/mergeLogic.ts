import { eq, and, isNull, sql } from "drizzle-orm"; 
import { carts, cartItems } from "../../../../drizzle/schema/index.js"; 
import { getDb } from "../../../db.js";
import { safeNumber } from "../../../lib/safe-parse.js";

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

  // Se não tem carrinho anônimo, buscamos o do usuário apenas para retornar o contexto
  if (!guestCart) {
    const [userCartOnly] = await db.select().from(carts).where(
      and(
        eq(carts.userId, userId),
        eq(carts.status, "active")
      )
    ).limit(1);
    return userCartOnly?.id || null;
  }

  // 2. Busca se existe um carrinho de USUÁRIO ativo (antigo)
  // Renomeado para evitar conflito com variável de escopo acima
  const [existingUserCart] = await db.select().from(carts).where(
    and(
      eq(carts.userId, userId),
      eq(carts.status, "active")
    )
  ).limit(1);

  /**
   * CENÁRIO A: Usuário não tem carrinho antigo.
   * Solução: O carrinho anônimo se torna o oficial do usuário.
   */
  if (!existingUserCart) {
    // ✅ CORREÇÃO: Substituído 'any' por Record<string, unknown>
    await db.update(carts)
      .set({ userId: userId, guestId: null, updatedAt: new Date() } as Record<string, unknown>)
      .where(eq(carts.id, guestCart.id));
    return guestCart.id;
  }

  /**
   * CENÁRIO B: Usuário JÁ TEM um carrinho ativo.
   * Solução: Mesclar itens, somar quantidades de duplicados e limpar o rastro.
   */
  if (existingUserCart && guestCart.id !== existingUserCart.id) {
    const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));

    if (guestItems.length > 0) {
      for (const item of guestItems) {
        
        // Prepara a string de options para comparação via SQL
        const optionsJson = typeof item.options === 'string' 
          ? item.options 
          : JSON.stringify(item.options);

        // Busca se o mesmo item (mesma config) já existe no carrinho de destino
        const [existingItem] = await db.select().from(cartItems).where(
          and(
            eq(cartItems.cartId, existingUserCart.id),
            // Compara IDs de pratos ou pacotes respeitando nulos
            item.dishId ? eq(cartItems.dishId, item.dishId) : isNull(cartItems.dishId),
            item.packageId ? eq(cartItems.packageId, item.packageId) : isNull(cartItems.packageId),
            
            // Comparação JSON via SQL bruto
            sql`JSON_CONTAINS(${cartItems.options}, ${optionsJson})`,
            sql`JSON_LENGTH(${cartItems.options}) = JSON_LENGTH(${optionsJson})`
          )
        ).limit(1);

        if (existingItem) {
          // Soma quantidade se o item e as opções forem idênticos
          const newQty = safeNumber(existingItem.quantity) + safeNumber(item.quantity);
          // ✅ CORREÇÃO: Tipagem segura no update
          await db.update(cartItems)
            .set({ quantity: newQty } as Record<string, unknown>)
            .where(eq(cartItems.id, existingItem.id));
            
          // Deleta do carrinho antigo pois foi somado ao novo
          await db.delete(cartItems).where(eq(cartItems.id, item.id));
        } else {
          // O item é novo para o carrinho de destino, apenas troca a "chave pai"
          // ✅ CORREÇÃO: Tipagem segura no update de cartId
          await db.update(cartItems)
            .set({ cartId: existingUserCart.id } as Record<string, unknown>)
            .where(eq(cartItems.id, item.id));
        }
      }
    }

    // Deleta o cabeçalho do carrinho anônimo que agora está órfão/vazio
    await db.delete(carts).where(eq(carts.id, guestCart.id));
    
    return existingUserCart.id;
  }

  return existingUserCart.id;
}
