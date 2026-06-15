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

/**
 * Normaliza a descrição do item de compra (case-insensitive, sem acentos, sem caracteres especiais).
 */
export function normalizePurchaseDescription(desc: string): string {
  if (!desc) return "";
  return desc
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s]/g, "") // remove caracteres especiais, mantém letras, números e espaços
    .replace(/\s+/g, " "); // simplifica espaços múltiplos
}

/**
 * Calcula a pontuação de match entre a descrição limpa e o padrão da regra.
 * 100 para correspondência exata.
 * 50+ se for parcial (includes).
 */
export function scoreClassificationRule(cleanDesc: string, pattern: string): number {
  const cleanPattern = normalizePurchaseDescription(pattern);
  if (!cleanDesc || !cleanPattern) return 0;

  if (cleanDesc === cleanPattern) {
    return 100;
  }

  if (cleanDesc.includes(cleanPattern)) {
    return 50 + cleanPattern.length;
  }

  return 0;
}

export interface ClassificationSuggestion {
  category: string;
  linkedEntityType: string | null;
  linkedEntityId: number | null;
  defaultUnit: string | null;
  conversionFactor: number;
  confidence: number;
  reason: string;
}

/**
 * Busca a melhor regra aplicável e formata a sugestão correspondente.
 */
export function findBestClassificationRule(
  rawDescription: string,
  rules: {
    id: number;
    pattern: string;
    category: string;
    linkedEntityType?: string | null;
    linkedEntityId?: number | null;
    defaultUnit?: string | null;
    conversionFactor?: string | number | null;
    confidence: number;
  }[]
): ClassificationSuggestion | null {
  const cleanDesc = normalizePurchaseDescription(rawDescription);
  if (!cleanDesc) return null;

  let bestRule: any = null;
  let highestScore = 0;

  for (const rule of rules) {
    const score = scoreClassificationRule(cleanDesc, rule.pattern);
    if (score > highestScore) {
      highestScore = score;
      bestRule = rule;
    }
  }

  if (highestScore >= 50 && bestRule) {
    const factor = bestRule.conversionFactor ? parseFloat(String(bestRule.conversionFactor)) : 1;
    const reason =
      highestScore === 100
        ? "Correspondência exata encontrada com base no histórico."
        : `Correspondência parcial encontrada com o padrão "${bestRule.pattern}".`;

    return {
      category: bestRule.category,
      linkedEntityType: bestRule.linkedEntityType || null,
      linkedEntityId: bestRule.linkedEntityId || null,
      defaultUnit: bestRule.defaultUnit || null,
      conversionFactor: isNaN(factor) || factor <= 0 ? 1 : factor,
      confidence: bestRule.confidence,
      reason,
    };
  }

  return null;
}

/**
 * Verifica se um item de compra está em estado aplicável para atualização de custo vigente.
 */
export function canApplyPurchaseItemCost(item: {
  category?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: number | null;
  computedCostPerBaseUnit?: string | number | null;
  classificationStatus?: string | null;
}): boolean {
  if (!item) return false;
  if (item.category !== "FOOD_INGREDIENT") return false;
  if (item.linkedEntityType !== "ingredient") return false;
  if (!item.linkedEntityId || item.linkedEntityId <= 0) return false;
  if (item.classificationStatus !== "classified") return false;
  if (item.computedCostPerBaseUnit == null) return false;

  const cost = typeof item.computedCostPerBaseUnit === "string"
    ? parseFloat(item.computedCostPerBaseUnit)
    : Number(item.computedCostPerBaseUnit);
  if (isNaN(cost) || cost < 0) return false;

  return true;
}

/**
 * Calcula a variação absoluta e percentual entre o custo atual e o novo.
 * Retorna se há variação crítica (>= 30%).
 */
export function calculateCostDelta(
  currentCost: number,
  newCost: number
): { diffAbsolute: number; diffPercent: number; isHighVariance: boolean } {
  if (
    currentCost == null ||
    isNaN(currentCost) ||
    !isFinite(currentCost) ||
    currentCost < 0 ||
    newCost == null ||
    isNaN(newCost) ||
    !isFinite(newCost) ||
    newCost < 0
  ) {
    return { diffAbsolute: 0, diffPercent: 0, isHighVariance: false };
  }

  const diffAbsolute = newCost - currentCost;
  let diffPercent = 0;
  if (currentCost > 0) {
    diffPercent = (diffAbsolute / currentCost) * 100;
  }

  const safeDiffPercent = isNaN(diffPercent) || !isFinite(diffPercent) ? 0 : diffPercent;
  const isHighVariance = Math.abs(safeDiffPercent) >= 30;

  return {
    diffAbsolute: Math.round(diffAbsolute * 1000000) / 1000000,
    diffPercent: Math.round(safeDiffPercent * 100) / 100,
    isHighVariance,
  };
}

/**
 * Valida a aplicação de custo.
 */
export function validateCostApplication(
  currentCost: number,
  newCost: number
): { valid: boolean; error?: string; warning?: string } {
  if (newCost < 0) {
    return { valid: false, error: "O custo sugerido não pode ser negativo." };
  }
  if (newCost === 0) {
    return { valid: true, warning: "O custo sugerido é R$ 0,00. Confirme se deseja zerar este custo." };
  }
  return { valid: true };
}
