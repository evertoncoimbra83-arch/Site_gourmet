// client\src\pages\cart\logic\cartPricingEngine.ts

import { 
  calculateItemUnitPrice, 
  calculateDiscountValue, 
  calculateGrandTotal,
  normalizeGourmetOptions,
  type PricingOptions,
  type DiscountConfig,
  type NormalizedMeal
} from "../../../../../shared/domain/math/pricing";

/* --------------------------------- TYPES ---------------------------------- */

interface GourmetCartOptions extends PricingOptions {
  packageName?: string | null;
}

export interface CouponData extends DiscountConfig {
  code: string;
  description?: string;
}

export interface CartItemBase {
  id: string | number;
  quantity: number;
  name?: string;
  price?: number | string; 
  packageId?: string | number | null;
  options?: string | PricingOptions; 
  accompaniments?: string | PricingOptions;
}

export interface ProcessedCartItem extends CartItemBase {
  unitPrice: number;
  totalItemPrice: number;
  uniqueKey: string;
  isPackage: boolean;
  displayName: string;
  meals: Array<{
    dishName: string;
    accompaniments: string[];
  }>;
  sizeName: string | null;
  standaloneAccompaniments: string[];
}

/* -------------------------------- ENGINE ---------------------------------- */

export function calculateCartDetailedTotals(
  items: CartItemBase[], 
  coupon: CouponData | null | undefined, 
  loyaltyDiscount: number = 0
) {
  const processedItems: ProcessedCartItem[] = items.map((item, index) => {
    
    // 1. Normalização via Domínio
    const rawOptions = item.options || item.accompaniments;
    const parsedOptions = normalizeGourmetOptions(rawOptions) as GourmetCartOptions;

    // ✅ CORREÇÃO DO ERRO 2345: Forçando o retorno a ser um boolean puro (!! converte null/undefined para false)
    const isPackage = !!(item.packageId || (parsedOptions.meals && parsedOptions.meals.length > 0));

    // 2. Cálculo Unitário via Domínio
    const unitPrice = calculateItemUnitPrice(item.price, parsedOptions, isPackage);
    const qty = Math.max(1, Number(item.quantity || 1));
    const totalItemPrice = unitPrice * qty;
    
    // 3. Processamento de Refeições (Meals)
    const meals = (parsedOptions.meals || []).map((m: NormalizedMeal) => ({
      dishName: String(m.dishName || "Prato"),
      accompaniments: (m.selectedAccompaniments || []).map((a) => String(a.name || ""))
    }));

    // 4. Processamento de Acompanhamentos Avulsos
    const standaloneAccs = (parsedOptions.accompaniments || []).map((a) => 
      String(a.name || "Acompanhamento")
    );

    return {
      ...item,
      unitPrice,
      totalItemPrice,
      uniqueKey: String(item.id || `item-${index}`),
      isPackage,
      displayName: String(parsedOptions.packageName || item.name || "Item"),
      meals,
      sizeName: parsedOptions.size?.name || null,
      standaloneAccompaniments: standaloneAccs,
    };
  });

  // 5. Cálculos Financeiros Finais
  const subtotal = processedItems.reduce((acc, item) => acc + item.totalItemPrice, 0);
  
  const couponDiscount = coupon 
    ? calculateDiscountValue(subtotal, coupon)
    : 0;

  const totalDiscounts = couponDiscount + loyaltyDiscount;
  const finalTotal = calculateGrandTotal(subtotal, 0, totalDiscounts);

  return {
    processedItems,
    totals: {
      subtotal,
      couponDiscount,
      loyaltyDiscount,
      total: finalTotal,
    },
    couponInfo: coupon ? {
      code: coupon.code,
      description: coupon.description,
      isValid: true
    } : null
  };
}