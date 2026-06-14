import { useMemo } from "react";
import {
  calculateMealNutritionCanonical,
  createEmptyNutrition,
  extractDishNutritionSource,
} from "@shared/domain/nutrition/nutrition";

export function useDishNutrition(
  dish: Record<string, unknown> | null | undefined,
  selectedSize: Record<string, unknown> | null | undefined,
  selectedOptions: Record<string, unknown>[] = [],
) {
  return useMemo(() => {
    if (!dish || !selectedSize) return createEmptyNutrition();

    const composition = Array.isArray(dish.composition)
      ? (dish.composition as Record<string, unknown>[])
      : undefined;
    const dishNutritionSource = extractDishNutritionSource(dish);

    return calculateMealNutritionCanonical({
      dish: dishNutritionSource,
      recipeWeight: (dish.recipeWeight ?? dish.recipe_weight ?? dish.yieldWeight ?? dish.yield_weight) as
        | number
        | string
        | null
        | undefined,
      targetMainDishWeight:
        (selectedSize.mainDishWeight ?? selectedSize.main_dish_weight ?? selectedSize.weight) as
          | number
          | string
          | null
          | undefined,
      composition,
      accompaniments: selectedOptions,
    }).nutrition;
  }, [dish, selectedSize, selectedOptions]);
}
