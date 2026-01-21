import { useMemo } from "react";

export function useProductNutrition(dish: any, selectedAccs: any[]) {
  return useMemo(() => {
    if (!dish) return null;

    return {
      kcal: Number(dish.energyKcal || 0) + 
            selectedAccs.reduce((sum, acc) => sum + (acc.nutrition?.kcal || 0), 0),
      proteins: Number(dish.proteins || 0) + 
                selectedAccs.reduce((sum, acc) => sum + (acc.nutrition?.proteins || 0), 0),
      carbs: Number(dish.carbs || 0) + 
             selectedAccs.reduce((sum, acc) => sum + (acc.nutrition?.carbs || 0), 0),
      fats: Number(dish.fatTotal || 0) + 
            selectedAccs.reduce((sum, acc) => sum + (acc.nutrition?.fats || 0), 0),
    };
  }, [dish, selectedAccs]);
}