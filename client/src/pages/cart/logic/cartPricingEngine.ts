import { getItemCalculatedPrice } from "./pricing";

export function calculateCartDetailedTotals(items: any[], coupon: any, loyaltyDiscount: number = 0) {
  // 1. Processa cada item com a lógica de adicionais e tamanhos
  const processedItems = items.map((item, index) => {
    const unitPrice = getItemCalculatedPrice(item);
    const totalItemPrice = unitPrice * (item.quantity || 1);
    
    // Normalização para a View (acompanhamentos, marmitas, etc)
    let options = item.options || item.accompaniments;
    if (typeof options === 'string') try { options = JSON.parse(options); } catch { options = {}; }

    return {
      ...item,
      unitPrice,
      totalItemPrice,
      uniqueKey: item.id || `item-${index}`,
      isPackage: !!item.packageId || (options?.meals?.length > 0),
      displayName: options?.packageName || item.name,
      meals: options?.meals || [],
      sizeName: options?.size?.name || null,
      standaloneAccompaniments: options?.accompaniments || [],
    };
  });

  // 2. Cálculo do Subtotal Bruto
  const subtotal = processedItems.reduce((acc, item) => acc + item.totalItemPrice, 0);

  // 3. Lógica de Cupom
  let couponDiscountValue = 0;
  let couponError = null;

  if (coupon) {
    if (coupon.type === 'percentage') {
      couponDiscountValue = subtotal * (coupon.value / 100);
    } else {
      couponDiscountValue = coupon.value;
    }
    
    // Garante que o desconto não seja maior que o subtotal
    if (couponDiscountValue > subtotal) couponDiscountValue = subtotal;
  }

  // 4. Totais Finais
  const total = subtotal - couponDiscountValue - loyaltyDiscount;

  return {
    processedItems,
    totals: {
      subtotal,
      couponDiscount: couponDiscountValue,
      loyaltyDiscount,
      total: Math.max(0, total),
    },
    couponInfo: coupon ? {
      code: coupon.code,
      description: coupon.description,
      isValid: true
    } : null
  };
}