// shared/domain/math/pricing.ts

/* --------------------------------- TYPES ---------------------------------- */

export interface PricingSize {
  name?: string;
  // Suporta tanto o modificador em % (legado) quanto a diferença fixa (novo)
  price_modifier?: number | string | null; 
  priceDiff?: number | string | null;
}

export interface PricingAccompaniment {
  name?: string;
  price?: number | string | null;
  price_modifier?: number | string | null; // Legado
  priceModifier?: number | string | null;  // Legado camelCase
  type?: 'fixed' | 'percentage' | string | null;
  priceModifierType?: string | null;
}

/** ✅ Interface da Marmita (Meal) dentro de um Pacote */
export interface NormalizedMeal {
  dishName: string;
  selectedAccompaniments?: PricingAccompaniment[];
}

/** ✅ Interface das Opções que o sistema entende */
export interface PricingOptions {
  size?: PricingSize | null;
  accompaniments?: PricingAccompaniment[] | null;
  packageName?: string | null;
  meals?: NormalizedMeal[] | null;
}

export interface DiscountConfig {
  type: 'percentage' | 'fixed';
  value: number | string;
}

/* ------------------------------ NORMALIZERS ------------------------------ */

/**
 * ✅ NORMALIZADOR DE OPÇÕES (Fonte Única e Sem ANY)
 * Transforma dados desconhecidos (JSON ou Objetos) no contrato PricingOptions.
 */
export function normalizeGourmetOptions(opts: unknown): PricingOptions {
  if (!opts) return {};
  
  let data: unknown = opts;

  if (typeof opts === "string") {
    try {
      data = JSON.parse(opts);
    } catch {
      return {};
    }
  }

  if (Array.isArray(data)) {
    return { meals: data as NormalizedMeal[] };
  }

  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    
    return {
      size: (obj.size as PricingSize) || null,
      accompaniments: (obj.accompaniments || obj.selectedAccompaniments) as PricingAccompaniment[] || null,
      packageName: typeof obj.packageName === "string" ? obj.packageName : null,
      meals: Array.isArray(obj.meals) ? (obj.meals as NormalizedMeal[]) : null
    };
  }

  return {};
}

/* -------------------------------- PRICING -------------------------------- */

/**
 * ✅ A FONTE DA VERDADE PARA PREÇO UNITÁRIO
 * Regra: (Base * Modificador de Tamanho) + Adicionais (Fixos ou %)
 */
export function calculateItemUnitPrice(
  basePrice: number | string | undefined | null, 
  options?: PricingOptions | null,
  isPackage: boolean = false
): number {
  // 1. Se for Pacote, o preço costuma ser o valor final direto já calculado
  if (isPackage) {
    return Number(basePrice) || 0;
  }

  const base = Number(basePrice) || 0;
  
  // 2. Cálculo do Tamanho: Aplica % (price_modifier) E/OU Diferença Fixa (priceDiff)
  const size = options?.size;
  const sizeModifier = Number(size?.price_modifier || 0);
  const sizeDiff = Number(size?.priceDiff || 0);

  // Fórmula: Base * (1 + %/100) + Diferença Fixa
  const priceAfterSize = (base * (1 + sizeModifier / 100)) + sizeDiff;

  // 3. Cálculo de Acompanhamentos (Suporta fixo e porcentagem)
  let accsTotal = 0;
  const accList = options?.accompaniments;

  if (Array.isArray(accList)) {
    accsTotal = accList.reduce((sum, acc) => {
      // Pega o valor de qualquer campo possível de preço/modificador
      const val = Number(acc?.price || acc?.price_modifier || acc?.priceModifier || 0);
      const type = String(acc?.type || acc?.priceModifierType || "fixed").toLowerCase();

      if (type === "percentage") {
        return sum + (priceAfterSize * (val / 100));
      }
      return sum + val;
    }, 0);
  }

  const total = priceAfterSize + accsTotal;
  return Number(total.toFixed(2));
}

/**
 * ✅ CÁLCULO DE DESCONTO
 */
export function calculateDiscountValue(subtotal: number, discount: DiscountConfig): number {
  const value = Number(discount.value) || 0;
  const safeSubtotal = Math.max(0, subtotal);
  
  if (discount.type === 'percentage') {
    return Number((safeSubtotal * (value / 100)).toFixed(2));
  }
  return Number(Math.min(value, safeSubtotal).toFixed(2));
}

/**
 * ✅ CÁLCULO DE TOTAIS
 */
export function calculateGrandTotal(subtotal: number, shipping: number = 0, totalDiscounts: number = 0): number {
  const s = Number(subtotal) || 0;
  const f = Number(shipping) || 0;
  const d = Number(totalDiscounts) || 0;

  const result = s + f - d;
  return Number(Math.max(0, result).toFixed(2));
}