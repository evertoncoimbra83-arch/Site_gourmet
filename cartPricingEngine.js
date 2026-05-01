// cartPricingEngine.js
import { safeNumber } from '../utils';

export function calculateCartDetailedTotals(items, coupon) {
  let subtotal = 0;
  let discount = 0;

  items.forEach(item => {
    subtotal += item.quantity * item.price;
  });

  if (coupon) {
    // Aplicar desconto com base no tipo de desconto
    if (coupon.type === 'percentage') {
      discount = subtotal * (safeNumber(coupon.value, 0) / 100);
    } else if (coupon.type === 'fixed') {
      discount = safeNumber(coupon.value, 0);
    }
  }

  const total = subtotal - discount;
  return { subtotal, discount, total };
}
