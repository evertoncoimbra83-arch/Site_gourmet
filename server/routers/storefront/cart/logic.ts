import { eq, and, asc } from "drizzle-orm";
import { cartItems, carts, coupons, discountRules, loyaltySettings } from "../../../../drizzle/schema/index.js";
import * as Loyalty from "../../../loyalty.js";

function safeFloat(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim().replace("R$", "").trim();
  if (str.includes(",")) str = str.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export async function syncCartState(db: any, cartId: string, userId?: string | null) {
  try {
    // 1. Busca o Carrinho
    const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    if (!cart) return null;

    // ✅ Prioriza o usuário logado no momento (ctx.userId)
    const activeUserId = userId || cart.userId || null;

    // 2. Busca e Processa os Itens
    const itemsRaw = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
    let subtotal = 0;

    const items = itemsRaw.map((item: any) => {
      const price = safeFloat(item.unitPrice ?? 0);
      const qty = parseInt(String(item.quantity || 0), 10);
      
      subtotal += price * qty;

      // Parse de JSON com fallback seguro
      let optionsParsed = {};
      try {
        optionsParsed = typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {});
      } catch (e) { optionsParsed = {}; }

      let nutritionParsed = {};
      try {
        nutritionParsed = typeof item.appliedNutrition === 'string' ? JSON.parse(item.appliedNutrition) : (item.appliedNutrition || {});
      } catch (e) { nutritionParsed = {}; }

      return {
        ...item,
        unitPrice: price,
        quantity: qty,
        totalPrice: price * qty,
        options: optionsParsed, 
        appliedNutrition: nutritionParsed
      };
    });

    // 3. Desconto Progressivo (Combo/Quantidade)
    let autoDiscount = 0;
    const rules = await db.select().from(discountRules).where(eq(discountRules.isActive, true)).orderBy(asc(discountRules.minQuantity));
    const totalQty = items.reduce((acc: number, i: any) => acc + i.quantity, 0);
    
    const applicableRule = [...rules].reverse().find((r) => totalQty >= (r.minQuantity || 0));
    
    if (applicableRule) {
      autoDiscount = subtotal * (safeFloat(applicableRule.discountValue) / 100);
    }

    // 4. Cupom de Desconto
    let couponDiscount = 0;
    if (cart.couponCode) {
      const [dbCoupon] = await db.select().from(coupons).where(eq(coupons.code, cart.couponCode)).limit(1);
      if (dbCoupon) {
        const dVal = safeFloat(dbCoupon.discountValue);
        const isPercent = String(dbCoupon.discountType).toLowerCase().includes("percent");
        
        // Regra: Cupom aplica sobre o que sobrou após o desconto progressivo
        const baseCalc = Math.max(0, subtotal - autoDiscount);
        couponDiscount = isPercent ? baseCalc * (dVal / 100) : dVal;
      }
    }

    // 5. Fidelidade (Loyalty)
    let loyaltyDiscount = 0;
    // Normalização da flag de fidelidade
    const isLoyaltyActive = cart.usesLoyalty === true || cart.usesLoyalty === 1 || String(cart.usesLoyalty) === "true";

    // ✅ Só calcula fidelidade se houver um usuário REAL logado
    if (isLoyaltyActive && activeUserId) {
      try {
        const loyaltyData = await Loyalty.getUserPoints(activeUserId);
        const points = Number(loyaltyData?.current_points || loyaltyData?.points || 0);

        if (points > 0) {
          const [settings] = await db.select().from(loyaltySettings).limit(1);
          if (settings) {
            const pointsReq = safeFloat(settings.redemptionRatePoints) || 100;
            const moneyVal = safeFloat(settings.redemptionRateMoney) || 1;
            
            let potentialDiscount = (points / pointsReq) * moneyVal;
            
            const maxD = safeFloat(settings.maxDiscountAmount);
            if (maxD > 0 && potentialDiscount > maxD) potentialDiscount = maxD;

            // O desconto de fidelidade é o ÚLTIMO a ser aplicado
            const currentBill = Math.max(0, subtotal - autoDiscount - couponDiscount);
            loyaltyDiscount = Math.min(potentialDiscount, currentBill);
          }
        }
      } catch (err) {
        console.error("[LOYALTY-ERROR]", err);
        loyaltyDiscount = 0;
      }
    }

    // 6. Totais Finais
    const shipping = safeFloat(cart.shippingValue);
    const totalDiscounts = autoDiscount + couponDiscount + loyaltyDiscount;
    const finalTotal = Math.max(0, subtotal + shipping - totalDiscounts);

    const totals = {
      subtotal: Number(subtotal.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      autoDiscount: Number(autoDiscount.toFixed(2)),
      couponDiscount: Number(couponDiscount.toFixed(2)),
      loyaltyDiscount: Number(loyaltyDiscount.toFixed(2)), 
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
      final: Number(finalTotal.toFixed(2)),
      couponCode: cart.couponCode || null,
    };

    // 7. Persistência
    await db.update(carts).set({
      discountsJson: JSON.stringify({ 
        totals, 
        autoDiscountName: applicableRule?.name || null 
      }),
      discountValue: totals.totalDiscounts.toString(),
      // ✅ Sincroniza o userId no carrinho se ele ainda não tiver dono
      userId: cart.userId ? cart.userId : activeUserId,
      updatedAt: new Date(),
    } as any).where(eq(carts.id, cartId));

    return { 
      cartId, 
      totals, 
      items,
      usesLoyalty: isLoyaltyActive,
      autoDiscountName: applicableRule?.name || null
    };

  } catch (error) {
    console.error("❌ Erro em syncCartState:", error);
    return null;
  }
}