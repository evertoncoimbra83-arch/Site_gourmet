/**
 * server/finance/types.ts
 *
 * Contratos e definições de tipos para o motor de cálculo financeiro e margem real.
 */

/**
 * Tipos de avisos financeiros disparados durante o cálculo.
 */
export type MarginWarning =
  | "missingIngredientCost" // Custo de ingrediente não informado (R$ 0 ou undefined)
  | "missingPackagingCost"  // Custo de embalagem não informado (R$ 0 ou undefined)
  | "missingPaymentFee"     // Taxa de pagamento não informada (R$ 0 ou undefined)
  | "missingShippingCost"   // Custo real de frete/logística não informado (R$ 0 ou undefined)
  | "negativeMargin"        // Margem de lucro negativa
  | "zeroRevenue";          // Receita bruta ou líquida igual a zero

/**
 * Interface de entrada de dados para o cálculo de margem real.
 */
export interface MarginCalculationInput {
  grossRevenue: number;         // Receita bruta (antes de descontos)
  discounts: number;            // Descontos aplicados no item/pedido
  ingredientCost?: number;      // Custo de ingredientes (insumos)
  packagingCost?: number;       // Custo de embalagem
  accompanimentCost?: number;   // Custo adicional de acompanhamentos
  paymentFeePercent?: number;   // Taxa de pagamento do adquirente em porcentagem (ex: 1.99)
  paymentFeeFlat?: number;      // Taxa fixa de pagamento do adquirente (ex: 0.10)
  realShippingCost?: number;    // Custo logístico real do frete
  quantity?: number;            // Quantidade de itens (default: 1)
}

/**
 * Detalhamento dos custos agregados no cálculo.
 */
export interface CostBreakdown {
  productCost: number;          // (ingredientCost + packagingCost + accompanimentCost) * quantity
  paymentFee: number;           // (netRevenue * (paymentFeePercent / 100)) + (paymentFeeFlat * quantity)
  logisticsCost: number;        // realShippingCost
  totalCost: number;            // productCost + paymentFee + logisticsCost
}

/**
 * Interface resultante do cálculo de margem real.
 */
export interface MarginCalculationResult {
  grossRevenue: number;         // Receita bruta
  discounts: number;            // Descontos aplicados
  netRevenue: number;           // Receita líquida (grossRevenue - discounts)
  productCost: number;          // CPV total (ingredientes + embalagem + acompanhamentos)
  paymentFee: number;           // Taxas financeiras de intermediação
  logisticsCost: number;        // Custo operacional logístico real
  totalCost: number;            // Custo consolidado (productCost + paymentFee + logisticsCost)
  grossProfit: number;          // Lucro bruto de contribuição (netRevenue - totalCost)
  marginPercent: number;        // Margem percentual (grossProfit / netRevenue * 100)
  warnings: MarginWarning[];     // Avisos gerados no cálculo
}

/**
 * Interface para tirar um snapshot de custos no pedido.
 */
export interface CostSnapshotInput {
  orderId: string;
  itemId: string;
  dishId?: number;
  packageId?: string;
  ingredientCost: number;
  packagingCost: number;
  accompanimentCost: number;
  totalProductCost: number;
}
