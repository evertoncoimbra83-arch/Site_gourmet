/**
 * server/finance/purchases.ts
 *
 * Helpers e lógica de negócio para Entrada de Compras, normalização e classificação.
 */

export type PurchaseUnit = "g" | "kg" | "ml" | "l" | "un" | "pacote" | "rolo" | "caixa";

export const SUPPORTED_UNITS: PurchaseUnit[] = ["g", "kg", "ml", "l", "un", "pacote", "rolo", "caixa"];

/**
 * Normaliza e sanitiza a string da unidade.
 */
export function normalizePurchaseUnit(unit: string): string {
  if (!unit) return "un";
  const normalized = unit.trim().toLowerCase();
  if (SUPPORTED_UNITS.includes(normalized as PurchaseUnit)) {
    return normalized;
  }
  return "un";
}

/**
 * Converte a quantidade comprada para a unidade base (ex: kg -> g, l -> ml).
 * Para unidades compostas (caixa, rolo, pacote), exige o fator de conversão.
 */
export function convertPurchaseQuantityToBaseUnit(
  quantity: number,
  unit: string,
  conversionFactor?: number
): number {
  if (quantity == null || isNaN(quantity) || !isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  const normalizedUnit = normalizePurchaseUnit(unit);
  const factor = conversionFactor ?? 1;

  if (factor <= 0 || isNaN(factor) || !isFinite(factor)) {
    return 0; // Se o fator for inválido para caixas/pacotes, retorna 0 (pendente)
  }

  switch (normalizedUnit) {
    case "kg":
      return quantity * 1000;
    case "l":
      return quantity * 1000;
    case "g":
    case "ml":
    case "un":
      return quantity * factor; // Permite fator multiplicativo se fornecido, senão factor é 1
    case "pacote":
    case "rolo":
    case "caixa":
      // Unidades agrupadas exigem o fator de conversão de forma estrita
      if (conversionFactor == null || conversionFactor <= 0) {
        return 0;
      }
      return quantity * conversionFactor;
    default:
      return quantity;
  }
}

/**
 * Calcula o custo unitário por base unit com precisão de 6 casas decimais.
 * Evita divisão por zero, NaN e Infinity.
 */
export function calculateCostPerBaseUnit(totalPrice: number, baseQuantity: number): number {
  if (
    totalPrice == null ||
    isNaN(totalPrice) ||
    !isFinite(totalPrice) ||
    totalPrice <= 0 ||
    baseQuantity == null ||
    isNaN(baseQuantity) ||
    !isFinite(baseQuantity) ||
    baseQuantity <= 0
  ) {
    return 0;
  }

  const rawCost = totalPrice / baseQuantity;
  // Arredonda para 6 casas decimais
  return Math.round(rawCost * 1000000) / 1000000;
}

/**
 * Infere o status de classificação de um item com base nos vínculos preenchidos.
 */
export function inferClassificationStatus(item: {
  category?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: number | null;
  conversionFactor?: number | null;
  unit: string;
}): "pending" | "classified" | "ignored" {
  if (!item.category) return "pending";

  if (item.category === "IGNORE") {
    return "ignored";
  }

  const normalizedUnit = normalizePurchaseUnit(item.unit);
  const needsConversionFactor = ["pacote", "rolo", "caixa"].includes(normalizedUnit);

  // Categorias que exigem vinculação física (insumos ou embalagens)
  if (item.category === "FOOD_INGREDIENT" || item.category === "PACKAGING") {
    const hasLink = item.linkedEntityType && item.linkedEntityId && item.linkedEntityId > 0;
    const hasValidFactor = !needsConversionFactor || (item.conversionFactor != null && item.conversionFactor > 0);

    if (hasLink && hasValidFactor) {
      return "classified";
    }
    return "pending";
  }

  // Outras categorias operacionais não exigem relacionamento com catálogo de ingredientes
  return "classified";
}

/**
 * Valida os dados de entrada de um item de compra.
 */
export function validatePurchaseItem(item: {
  rawDescription: string;
  quantity: number;
  totalPrice: number;
  unit: string;
  conversionFactor?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.rawDescription || item.rawDescription.trim() === "") {
    errors.push("Descrição bruta do item é obrigatória.");
  }

  if (item.quantity == null || isNaN(item.quantity) || item.quantity <= 0) {
    errors.push("Quantidade deve ser maior que zero.");
  }

  if (item.totalPrice == null || isNaN(item.totalPrice) || item.totalPrice < 0) {
    errors.push("Preço total não pode ser negativo.");
  }

  const normalizedUnit = normalizePurchaseUnit(item.unit);
  if (["pacote", "rolo", "caixa"].includes(normalizedUnit)) {
    if (item.conversionFactor == null || isNaN(item.conversionFactor) || item.conversionFactor <= 0) {
      errors.push(`Unidades agrupadas (${item.unit}) exigem um fator de conversão maior que zero.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
