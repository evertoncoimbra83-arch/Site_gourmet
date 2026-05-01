/**
 * ✅ INTERFACES DE TIPAGEM ESTRETA
 */
export interface NutritionResult {
  energyKcal: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  sodium: number;
  fiber: number;
}

interface NutritionalSource {
  energyKcal?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  // Fallbacks legados
  kcal?: string | number;
  protein?: string | number;
  fats?: string | number;
  nutritional_info?: string | Record<string, unknown>;
  nutritionalInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * ✅ HELPER INTERNO: Extração com Fallback
 * Busca nas colunas novas e no JSON legado de forma segura.
 */
const extractVal = (data: NutritionalSource | string | null | undefined, key: keyof NutritionResult): number => {
  if (!data) return 0;
  
  let source: Record<string, unknown> = {};

  if (typeof data === 'string') {
    try { source = JSON.parse(data); } catch { return 0; }
  } else {
    source = data as Record<string, unknown>;
  }

  // Mapeamento de chaves para compatibilidade
  const mapping: Record<keyof NutritionResult, string[]> = {
    energyKcal: ['energyKcal', 'energy_kcal', 'kcal', 'calories'],
    proteins: ['proteins', 'protein'],
    carbs: ['carbs', 'carbohydrates'],
    fatTotal: ['fatTotal', 'fat_total', 'fats', 'fat'],
    sodium: ['sodium'],
    fiber: ['fiber']
  };

  const keysToTry = mapping[key];

  // 1. Tenta na raiz do objeto (Novas Colunas)
  for (const k of keysToTry) {
    if (source[k] !== undefined && source[k] !== null) return Number(source[k]);
  }

  // 2. Tenta dentro dos objetos de info nutricional (Legado)
  const legacyInfo = (source.nutritional_info || source.nutritionalInfo || {}) as Record<string, unknown>;
  const info = typeof legacyInfo === 'string' ? JSON.parse(legacyInfo) : legacyInfo;

  for (const k of keysToTry) {
    // Trata formato { energy: { value: 10 } } ou { energyKcal: 10 }
    const nested = info[k] as any;
    const val = nested?.value !== undefined ? nested.value : info[k];
    if (val !== undefined && val !== null) return Number(val);
  }

  return 0;
};

/**
 * ✅ MAP PACKAGE MEAL NUTRITION (Individual Marmita)
 * Resolve o Erro 2305: Calcula a nutrição de 1 marmita ajustando pelo peso.
 */
export function mapPackageMealNutrition(
  dish: NutritionalSource | null | undefined,
  selectedAccs: NutritionalSource[] = [],
  mainDishWeight: number = 200
): NutritionResult {
  const result: NutritionResult = {
    energyKcal: 0, proteins: 0, carbs: 0, fatTotal: 0, sodium: 0, fiber: 0
  };

  if (!dish) return result;

  // 1. Prato Principal (Proporcional)
  const factor = mainDishWeight / 100;
  const keys: (keyof NutritionResult)[] = ['energyKcal', 'proteins', 'carbs', 'fatTotal', 'sodium', 'fiber'];

  keys.forEach(key => {
    result[key] += extractVal(dish, key) * factor;
  });

  // 2. Acompanhamentos (Base 100g ou peso fixo)
  selectedAccs.forEach(acc => {
    const accWeight = Number(acc.weight || acc.defaultGrammage || 100);
    const accFactor = accWeight / 100;
    keys.forEach(key => {
      result[key] += extractVal(acc, key) * accFactor;
    });
  });

  // Arredondamento final
  return {
    energyKcal: Number(result.energyKcal.toFixed(1)),
    proteins: Number(result.proteins.toFixed(1)),
    carbs: Number(result.carbs.toFixed(1)),
    fatTotal: Number(result.fatTotal.toFixed(1)),
    sodium: Number(result.sodium.toFixed(1)),
    fiber: Number(result.fiber.toFixed(1)),
  };
}

/**
 * ✅ PARSE NUTRITION (Simples)
 * Extrai e normaliza os dados de um item único em base 100g.
 */
export const parseNutrition = (data: NutritionalSource | string | null | undefined): NutritionResult => {
  return mapPackageMealNutrition(data as NutritionalSource, [], 100);
};

/**
 * ✅ CALCULATE PACKAGE TOTALS (Kit Completo)
 * Soma nutrientes e preços de todas as marmitas do pacote.
 */
export const calculatePackageTotals = (
  selectedMeals: Array<Record<string, unknown>>, 
  basePrice: number
) => {
  const totals = {
    nutrition: { energyKcal: 0, proteins: 0, carbs: 0, fatTotal: 0, sodium: 0, fiber: 0 },
    extrasPrice: 0,
    completedMealsCount: 0
  };

  selectedMeals.forEach((meal) => {
    if (!meal.dishId) return;
    totals.completedMealsCount++;

    // Calcula a nutrição da marmita individual
    const mealNutrition = mapPackageMealNutrition(
      meal as NutritionalSource,
      (meal.selectedAccompaniments as NutritionalSource[]) || [],
      Number(meal.mainDishWeight || 200)
    );

    // Soma ao total do pacote
    const keys = Object.keys(totals.nutrition) as (keyof NutritionResult)[];
    keys.forEach(key => {
      totals.nutrition[key] += mealNutrition[key];
    });

    // Soma preços extras
    const accompaniments = (meal.selectedAccompaniments as Array<Record<string, unknown>>) || [];
    accompaniments.forEach((acc) => {
      totals.extrasPrice += Number(acc.price || acc.priceModifier || 0);
    });
  });

  const isComplete = selectedMeals.length > 0 && totals.completedMealsCount === selectedMeals.length;
  const progress = selectedMeals.length > 0 ? (totals.completedMealsCount / selectedMeals.length) * 100 : 0;

  return {
    nutrition: totals.nutrition,
    totalPrice: Number(basePrice) + totals.extrasPrice,
    progress,
    isComplete
  };
};