import { useMemo } from "react";
import { safeJsonParse, safeNumber } from "@/lib/safe-parse";

interface OrderItemForNutrition {
  quantity: number | string;
  appliedNutrition?: string | Record<string, unknown> | Array<Record<string, unknown>>;
  applied_nutrition?: string | Record<string, unknown> | Array<Record<string, unknown>>;
  nutrition?: string | Record<string, unknown> | Array<Record<string, unknown>>;
}

interface NutritionSource {
  energyKcal?: number | string;
  calories?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  carbohydrates?: number | string;
  fatTotal?: number | string;
  fats?: number | string;
}

export function useOrderNutrition(items: OrderItemForNutrition[]) {
  return useMemo(() => {
    const totals = { kcal: 0, pro: 0, cho: 0, fat: 0 };

    if (!items || !Array.isArray(items)) return { ...totals, hasNutrition: false };

    items.forEach((item) => {
      try {
        const rawNut = item.appliedNutrition || item.applied_nutrition || item.nutrition;
        if (!rawNut) return;

        const nut =
          typeof rawNut === "string"
            ? safeJsonParse<NutritionSource | NutritionSource[]>(rawNut, {})
            : rawNut;
        const qty = safeNumber(item.quantity, 1);

        if (Array.isArray(nut)) {
          nut.forEach((meal) => {
            totals.kcal += safeNumber(meal.energyKcal ?? meal.calories) * qty;
            totals.pro += safeNumber(meal.proteins) * qty;
            totals.cho += safeNumber(meal.carbs ?? meal.carbohydrates) * qty;
            totals.fat += safeNumber(meal.fatTotal ?? meal.fats) * qty;
          });
          return;
        }

        totals.kcal += safeNumber(nut.energyKcal ?? nut.calories) * qty;
        totals.pro += safeNumber(nut.proteins) * qty;
        totals.cho += safeNumber(nut.carbs ?? nut.carbohydrates) * qty;
        totals.fat += safeNumber(nut.fatTotal ?? nut.fats) * qty;
      } catch (err) {
        console.error("Erro ao processar nutricao do item:", err);
      }
    });

    return {
      kcal: Math.round(totals.kcal),
      pro: Math.round(totals.pro),
      cho: Math.round(totals.cho),
      fat: Math.round(totals.fat),
      hasNutrition: totals.kcal > 0,
    };
  }, [items]);
}
