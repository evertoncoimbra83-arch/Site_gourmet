import { useMemo } from "react";

// ✅ Interface para os itens que entram no hook
interface OrderItemForNutrition {
  quantity: number | string;
  appliedNutrition?: string | Record<string, unknown> | Array<Record<string, unknown>>;
  applied_nutrition?: string | Record<string, unknown> | Array<Record<string, unknown>>;
  nutrition?: string | Record<string, unknown> | Array<Record<string, unknown>>;
}

// ✅ Interface para normalizar o acesso aos dados nutricionais dentro dos loops
interface NutritionSource {
  energyKcal?: number | string;
  calories?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  carbohydrates?: number | string;
  fatTotal?: number | string;
  fats?: number | string;
}

/**
 * Hook para processar e somar macros de itens do pedido
 * Aceita tanto o formato de Prato (Objeto) quanto Pacote (Array)
 */
export function useOrderNutrition(items: OrderItemForNutrition[]) {
  return useMemo(() => {
    const totals = { kcal: 0, pro: 0, cho: 0, fat: 0 };

    if (!items || !Array.isArray(items)) return { ...totals, hasNutrition: false };

    items.forEach((item) => {
      try {
        const rawNut = item.appliedNutrition || item.applied_nutrition || item.nutrition;
        if (!rawNut) return;

        const nut = (typeof rawNut === "string" ? JSON.parse(rawNut) : rawNut) as NutritionSource | NutritionSource[];
        const qty = Number(item.quantity || 1);

        if (Array.isArray(nut)) {
          // ✅ Cenário: Pacote (Array de marmitas) - Tipado como NutritionSource
          nut.forEach((m) => {
            totals.kcal += (Number(m.energyKcal || m.calories) || 0) * qty;
            totals.pro += (Number(m.proteins) || 0) * qty;
            totals.cho += (Number(m.carbs || m.carbohydrates) || 0) * qty;
            totals.fat += (Number(m.fatTotal || m.fats) || 0) * qty;
          });
        } else {
          // ✅ Cenário: Prato Único (Objeto) - Tipado como NutritionSource
          totals.kcal += (Number(nut.energyKcal || nut.calories) || 0) * qty;
          totals.pro += (Number(nut.proteins) || 0) * qty;
          totals.cho += (Number(nut.carbs || nut.carbohydrates) || 0) * qty;
          totals.fat += (Number(nut.fatTotal || nut.fats) || 0) * qty;
        }
      } catch (err) {
        console.error("Erro ao processar nutrição do item:", err);
      }
    });

    return {
      kcal: Math.round(totals.kcal),
      pro: Math.round(totals.pro),
      cho: Math.round(totals.cho),
      fat: Math.round(totals.fat),
      hasNutrition: totals.kcal > 0
    };
  }, [items]);
}