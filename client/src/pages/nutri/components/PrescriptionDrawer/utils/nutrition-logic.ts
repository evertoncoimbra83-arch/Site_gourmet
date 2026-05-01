/**
 * ✅ LÓGICA DE NUTRIÇÃO DEFINITIVA
 * Sempre calcula dinamicamente: Base * Fator de Peso + Acompanhamentos
 */

export interface MacroData {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionalMacros {
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  energyKcal?: number; 
  proteins?: number;   
  carbohydrates?: number; 
  fatTotal?: number;   
}

interface BuilderAccompaniment extends NutritionalMacros {
  id: string | number;
  name: string;
  isBase?: boolean;
  weight?: number | string;
  defaultGrammage?: number | string;
  default_grammage?: number | string;
}

export interface SingleCardOption {
  multiplier?: string | number;
  mainDishWeight?: string | number;
  macros?: NutritionalMacros | null;
  nutritionalData?: {
    baseMacros?: NutritionalMacros;
  };
  energyKcal?: number;
  proteins?: number;
  carbohydrates?: number;
  fatTotal?: number;
  allowedAccompaniments?: BuilderAccompaniment[];
}

const safeNum = (val: unknown): number => {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

/**
 * Calcula a nutrição total de um prato (Card) com seus acompanhamentos
 */
export function calculateSingleCardNutrition(option: SingleCardOption): MacroData {
  const multiplier = safeNum(option.multiplier) || 1; // Fator de quantidade (ex: 1 porção)
  const mainWeight = safeNum(option.mainDishWeight) || 200; // Peso do prato
  const dishFactor = mainWeight / 100; // Se pesa 200g, multiplica os macros base por 2

  // ✅ 1. Extração da Base (TS Tipado sem conflitos)
  const source = option.nutritionalData?.baseMacros || option.macros;
  
  const base = {
    kcal: safeNum(source?.kcal ?? source?.energyKcal ?? option.energyKcal ?? 0),
    protein: safeNum(source?.protein ?? source?.proteins ?? option.proteins ?? 0),
    carbs: safeNum(source?.carbs ?? source?.carbohydrates ?? option.carbohydrates ?? 0),
    fat: safeNum(source?.fat ?? source?.fatTotal ?? option.fatTotal ?? 0)
  };

  // 2. Extração e Soma dos Acompanhamentos ativos
  let accKcal = 0, accProtein = 0, accCarbs = 0, accFat = 0;
  
  const selectedAccs = (option.allowedAccompaniments || []).filter(acc => acc?.isBase === true);

  selectedAccs.forEach(curr => {
    // Acompanhamentos geralmente são calculados por porção enviada (weight) ou 100g
    const weight = safeNum(curr.weight ?? curr.defaultGrammage ?? curr.default_grammage ?? 100);
    const factor = weight / 100;
    
    accKcal += safeNum(curr.kcal ?? curr.energyKcal ?? 0) * factor;
    accProtein += safeNum(curr.protein ?? curr.proteins ?? 0) * factor;
    accCarbs += safeNum(curr.carbs ?? curr.carbohydrates ?? 0) * factor;
    accFat += safeNum(curr.fat ?? curr.fatTotal ?? 0) * factor;
  });

  // 3. Cálculo Final: ((Base * Proporção do Peso) + Acompanhamentos) * Quantidade
  return {
    kcal: Math.round(((base.kcal * dishFactor) + accKcal) * multiplier),
    protein: Number((((base.protein * dishFactor) + accProtein) * multiplier).toFixed(1)),
    carbs: Number((((base.carbs * dishFactor) + accCarbs) * multiplier).toFixed(1)),
    fat: Number((((base.fat * dishFactor) + accFat) * multiplier).toFixed(1))
  };
}