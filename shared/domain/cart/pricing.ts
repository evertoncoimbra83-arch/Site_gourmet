// shared/domain/cart/pricing.ts
import { CartItem, DiscountRule, PricingResult } from "./types";

/**
 * Interface para os dados brutos das regras vindo do banco/API
 */
interface RawDiscountRule {
  id: number | string;
  name?: string | null;
  minQuantity?: number | string | null;
  discountValue?: number | string | null;
  discount_value?: number | string | null;
  isActive?: boolean | number | null;
}

/**
 * 🧮 Motor de Preços Único
 * Centraliza o cálculo de subtotal e descontos progressivos
 */
export function calculatePricing(
  items: CartItem[],
  rules: RawDiscountRule[] = []
): PricingResult {
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // 1. Normalização das regras (Lógica extraída do Hook para o Domínio)
  const activeRules: DiscountRule[] = rules
    .map((r) => ({
      id: Number(r.id),
      name: r.name ?? "Desconto",
      minQuantity: Number(r.minQuantity || 0),
      discountValue: Number(r.discountValue || r.discount_value || 0),
      isActive: Boolean(r.isActive)
    }))
    .filter((r) => r.isActive)
    .sort((a, b) => a.minQuantity - b.minQuantity);

  // 2. Encontra a regra atual (Maior tier atingido)
  const currentRule = [...activeRules].reverse().find(r => itemCount >= r.minQuantity) || null;

  // 3. Calcula o desconto (Ex: porcentagem sobre o subtotal)
  const discounts = currentRule ? (subtotal * (currentRule.discountValue / 100)) : 0;

  return {
    subtotal,
    discounts,
    total: subtotal - discounts,
    appliedRule: currentRule
  };
}