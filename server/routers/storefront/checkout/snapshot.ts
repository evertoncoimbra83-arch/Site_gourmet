import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { carts, cartItems, dishes, packages } from "drizzle/schema/index.js"; // ✅ Adicionado packages

function num(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function loadCartAndSnapshot(tx: any, userId: string | null, cartId?: string) {
  
  // 1. Localização do Carrinho
  let cartQuery = tx.select().from(carts);

  if (cartId) {
    cartQuery.where(eq(carts.id, cartId));
  } else if (userId) {
    cartQuery.where(and(
      eq(carts.userId, userId),
      eq(carts.status, "active")
    )); 
  } else {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Carrinho não identificado." });
  }

  const [cart] = await cartQuery.limit(1);
  if (!cart) throw new TRPCError({ code: "NOT_FOUND", message: "Carrinho expirou." });

  // 2. Extração dos Totais
  let totals = { subtotal: 0, shipping: 0, autoDiscount: 0, couponDiscount: 0, loyaltyDiscount: 0, total: 0 };

  if (cart.discountsJson) {
    try {
      const parsed = typeof cart.discountsJson === 'string' ? JSON.parse(cart.discountsJson) : cart.discountsJson;
      if (parsed.totals) {
        totals = {
          subtotal: num(parsed.totals.subtotal),
          shipping: num(parsed.totals.shipping || cart.shippingValue),
          autoDiscount: num(parsed.totals.autoDiscount),
          couponDiscount: num(parsed.totals.couponDiscount),
          loyaltyDiscount: num(parsed.totals.loyaltyDiscount || 0), // ✅ Adicionado Loyalty
          total: num(parsed.totals.total || parsed.totals.final)
        };
      }
    } catch (e) { console.error("Erro parse totals", e); }
  }

  // 3. 🛡️ SELEÇÃO DE ITENS (Sincronizada)
  const items = await tx
    .select({
      id: cartItems.id,
      dishId: cartItems.dishId,
      packageId: cartItems.packageId,
      quantity: cartItems.quantity,
      unitPrice: cartItems.unitPrice, 
      // ✅ CAMPOS ESSENCIAIS ADICIONADOS:
      options: cartItems.options, 
      appliedNutrition: cartItems.appliedNutrition,
      // Dados de pratos e pacotes (para fallback)
      dishName: dishes.name,
      packageName: packages.name,
      dishPrice: dishes.price,
      packagePrice: packages.price
    })
    .from(cartItems)
    .leftJoin(dishes, eq(cartItems.dishId, dishes.id))
    .leftJoin(packages, eq(cartItems.packageId, packages.id)) // ✅ Join com pacotes
    .where(eq(cartItems.cartId, cart.id));

  if (!items.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Carrinho vazio." });

  // 4. Normalização e Blindagem
  const normalizedItems = items.map((item: any) => {
    // Parse do JSON de opções (onde está o nome e os acompanhamentos reais)
    let opts: any = {};
    try {
      opts = typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {});
    } catch (e) { opts = {}; }

    // Prioridade de Nome: JSON > Tabela Pratos > Tabela Pacotes
    const finalName = opts.dishName || opts.packageName || item.dishName || item.packageName || "Item";

    // Prioridade de Preço: Item do Carrinho > JSON > Tabela Prato/Pacote
    let finalUnitPrice = num(item.unitPrice || opts.totalUnitPrice || item.dishPrice || item.packagePrice);

    return {
      ...item,
      name: finalName, // Nome garantido
      options: opts,   // Objeto pronto para o createOrderWithItems
      unitPrice: finalUnitPrice,
      totalItemPrice: Number((finalUnitPrice * num(item.quantity)).toFixed(2))
    };
  });

  // 5. Totais finais para o Router
  return {
    cart,
    items: normalizedItems,
    totals: {
      ...totals,
      // ✅ Soma correta de todos os descontos (Progressivo + Cupom + Fidelidade)
      totalDiscounts: Number((totals.autoDiscount + totals.couponDiscount + totals.loyaltyDiscount).toFixed(2)),
    },
    details: {
      couponCode: cart.couponCode,
      autoDiscountName: (cart as any).autoDiscountName || "Desconto Progressivo"
    }
  };
}