/**
 * server/finance/marginCalculator.ts
 *
 * Helper puro de cálculo de margem real de contribuição e consolidação financeira.
 */

import type { MarginCalculationInput, MarginCalculationResult, MarginWarning } from "./types";

/**
 * Função utilitária para arredondar valores monetários para duas casas decimais.
 */
function roundMoney(value: number): number {
  if (value == null || isNaN(value) || !isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/**
 * Calcula a margem real de contribuição com base em insumos, embalagem, logística e taxas.
 * Retorna todos os valores arredondados de forma segura e sem gerar NaN/Infinity.
 */
export function calculateMargin(input: MarginCalculationInput): MarginCalculationResult {
  const warnings: MarginWarning[] = [];

  const qty = Math.max(1, input.quantity ?? 1);
  const grossRevenue = roundMoney(input.grossRevenue);
  const discounts = roundMoney(input.discounts);

  // Receita Líquida
  const netRevenue = roundMoney(grossRevenue - discounts);

  // Custos Individuais
  const ingredientUnit = input.ingredientCost ?? 0;
  const packagingUnit = input.packagingCost ?? 0;
  const accompanimentUnit = input.accompanimentCost ?? 0;

  // Custo de Produto Vendido (CPV)
  const productCost = roundMoney((ingredientUnit + packagingUnit + accompanimentUnit) * qty);

  // Taxa de Pagamento
  const feePercent = input.paymentFeePercent ?? 0;
  const feeFlat = input.paymentFeeFlat ?? 0;
  const paymentFee = roundMoney(
    (netRevenue > 0 ? netRevenue * (feePercent / 100) : 0) + (feeFlat * qty)
  );

  // Logística/Entrega
  const logisticsCost = roundMoney(input.realShippingCost ?? 0);

  // Custo Total Consolidado
  const totalCost = roundMoney(productCost + paymentFee + logisticsCost);

  // Lucro Bruto
  const grossProfit = roundMoney(netRevenue - totalCost);

  // Margem Percentual
  const marginPercent = netRevenue > 0 ? roundMoney((grossProfit / netRevenue) * 100) : 0;

  // --- GERAÇÃO DE WARNINGS ---
  if (input.ingredientCost == null || input.ingredientCost <= 0) {
    warnings.push("missingIngredientCost");
  }
  if (input.packagingCost == null || input.packagingCost <= 0) {
    warnings.push("missingPackagingCost");
  }
  if (
    (input.paymentFeePercent == null || input.paymentFeePercent <= 0) &&
    (input.paymentFeeFlat == null || input.paymentFeeFlat <= 0)
  ) {
    warnings.push("missingPaymentFee");
  }
  if (input.realShippingCost == null || input.realShippingCost <= 0) {
    warnings.push("missingShippingCost");
  }
  if (grossProfit < 0) {
    warnings.push("negativeMargin");
  }
  if (grossRevenue <= 0 || netRevenue <= 0) {
    warnings.push("zeroRevenue");
  }

  return {
    grossRevenue,
    discounts,
    netRevenue,
    productCost,
    paymentFee,
    logisticsCost,
    totalCost,
    grossProfit,
    marginPercent,
    warnings,
  };
}
