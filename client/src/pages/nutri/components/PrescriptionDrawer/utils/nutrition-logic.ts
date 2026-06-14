import { calculateMealNutritionCanonical } from "@shared/domain/nutrition/nutrition";

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
  recipeWeight?: string | number;
  recipe_weight?: string | number;
  yieldWeight?: string | number;
  yield_weight?: string | number;
  composition?: Array<Record<string, unknown>>;
  macros?: NutritionalMacros | null;
  nutritionalData?: {
    baseMacros?: NutritionalMacros;
    recipeWeight?: string | number;
    recipe_weight?: string | number;
    composition?: Array<Record<string, unknown>>;
  };
  energyKcal?: number;
  proteins?: number;
  carbohydrates?: number;
  fatTotal?: number;
  allowedAccompaniments?: BuilderAccompaniment[];
}

const safeNum = (val: unknown): number => {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

export function calculateSingleCardNutrition(option: SingleCardOption): MacroData {
  const multiplier = safeNum(option.multiplier) || 1;
  const source = option.nutritionalData?.baseMacros || option.macros;
  const selectedAccs = option.allowedAccompaniments || [];

  const calculated = calculateMealNutritionCanonical({
    dish: {
      energyKcal: source?.kcal ?? source?.energyKcal ?? option.energyKcal ?? 0,
      proteins: source?.protein ?? source?.proteins ?? option.proteins ?? 0,
      carbs: source?.carbs ?? source?.carbohydrates ?? option.carbohydrates ?? 0,
      fatTotal: source?.fat ?? source?.fatTotal ?? option.fatTotal ?? 0,
    },
    recipeWeight:
      option.recipeWeight ??
      option.recipe_weight ??
      option.yieldWeight ??
      option.yield_weight ??
      option.nutritionalData?.recipeWeight ??
      option.nutritionalData?.recipe_weight,
    targetMainDishWeight: option.mainDishWeight,
    composition: option.composition ?? option.nutritionalData?.composition,
    accompaniments: selectedAccs as unknown as Record<string, unknown>[],
  }).nutrition;

  return {
    kcal: Math.round(calculated.energyKcal * multiplier),
    protein: Number((calculated.proteins * multiplier).toFixed(1)),
    carbs: Number((calculated.carbs * multiplier).toFixed(1)),
    fat: Number((calculated.fatTotal * multiplier).toFixed(1)),
  };
}
