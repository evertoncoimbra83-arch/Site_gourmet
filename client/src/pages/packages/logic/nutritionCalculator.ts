// client/src/pages/packages/logic/nutritionCalculator.ts
// Barrel de nutrição para pacotes — usa o shared domain como fonte de verdade

import {
  calculateMealNutritionCanonical,
  extractDishNutritionSource,
  NutritionData,
} from "../../../../../shared/domain/nutrition/nutrition";

/**
 * Calcula a nutrição de uma refeição de pacote (prato + acompanhamentos).
 * Wrapper do shared domain para uso nos drawers de pacote.
 */
export function mapPackageMealNutrition(
  dish: Record<string, unknown> | null | undefined,
  selectedAccs: Record<string, unknown>[] = [],
  targetMainDishWeight?: number | string | null,
): NutritionData {
  const dishNutritionSource = extractDishNutritionSource(dish);

  return calculateMealNutritionCanonical({
    dish: dishNutritionSource,
    recipeWeight: (dish?.recipeWeight ?? dish?.recipe_weight ?? dish?.yieldWeight ?? dish?.yield_weight) as
      | number
      | string
      | null
      | undefined,
    targetMainDishWeight:
      (targetMainDishWeight ?? dish?.mainDishWeight ?? dish?.main_dish_weight ?? dish?.weight) as
        | number
        | string
        | null
        | undefined,
    composition: Array.isArray(dish?.composition)
      ? (dish?.composition as Record<string, unknown>[])
      : undefined,
    accompaniments: selectedAccs,
  }).nutrition;
}

interface MealForTotals {
  dishId: string | number | null;
}

export interface PackageTotals {
  isComplete: boolean;
  progress: number;
  totalPrice: number;
}

/**
 * Calcula progresso, completude e preço total de um pacote em montagem.
 */
export function calculatePackageTotals(
  meals: MealForTotals[],
  basePrice: number
): PackageTotals {
  if (!meals || meals.length === 0) {
    return { isComplete: false, progress: 0, totalPrice: basePrice };
  }

  const completedCount = meals.filter((m) => m.dishId).length;
  const progress = Math.round((completedCount / meals.length) * 100);
  const isComplete = completedCount === meals.length;

  return { isComplete, progress, totalPrice: basePrice };
}
