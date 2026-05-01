// products/logic/useDishNutrition
import { useMemo } from "react";

/**
 * ✅ HOOK: USE DISH NUTRITION (PADRONIZADO)
 * Calcula a ficha técnica completa (13 campos) para Pratos Avulsos.
 */

// Tipagem para facilitar a manutenção dos campos calculados
interface NutritionTotals {
  energyKcal: number;
  energyKj: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  fatSaturated: number;
  fatTrans: number;
  fiber: number;
  sodium: number;
  addedSugars: number;
  calcium: number;
  iron: number;
  yieldWeight: number;
}

export function useDishNutrition(
  dish: Record<string, unknown> | null | undefined, 
  selectedSize: Record<string, unknown> | null | undefined, 
  selectedOptions: Record<string, unknown>[] = []
) {
  return useMemo(() => {
    // 1. Estado Inicial
    const totals: NutritionTotals = {
      energyKcal: 0,
      energyKj: 0,
      proteins: 0,
      carbs: 0,
      fatTotal: 0,
      fatSaturated: 0,
      fatTrans: 0,
      fiber: 0,
      sodium: 0,
      addedSugars: 0,
      calcium: 0,
      iron: 0,
      yieldWeight: 0
    };

    if (!dish || !selectedSize) return totals;

    // 2. Helper de Extração Blindado (Lê snake_case, camelCase e aninhados)
    const getVal = (source: Record<string, unknown> | null | undefined, ...keys: string[]): number => {
      if (!source) return 0;
      
      // Tenta na raiz e em objetos de nutrição comuns
      const roots = [
        source, 
        source.nutritional_info as Record<string, unknown>, 
        source.nutritionalInfo as Record<string, unknown>, 
        source.nutrition as Record<string, unknown>
      ];
      
      for (const root of roots) {
        if (!root) continue;
        for (const key of keys) {
          const value = root[key];
          if (value !== undefined && value !== null) return Number(value);
        }
      }
      return 0;
    };

    // 3. Helper de Acumulação
    const accumulate = (targetKey: keyof NutritionTotals, keys: string[], factor: number, source: Record<string, unknown>) => {
      totals[targetKey] += (getVal(source, ...keys) * factor);
    };

    // =========================================================
    // A. CÁLCULO DO PRATO PRINCIPAL
    // =========================================================
    const mainWeight = Number(selectedSize.mainDishWeight || selectedSize.main_dish_weight || 0);
    const dishFactor = (mainWeight > 0 ? mainWeight : 200) / 100;

    accumulate('energyKcal', ['energy_kcal', 'energyKcal', 'kcal'], dishFactor, dish);
    accumulate('energyKj', ['energy_kj', 'energyKj', 'kj'], dishFactor, dish);
    accumulate('proteins', ['proteins', 'protein'], dishFactor, dish);
    accumulate('carbs', ['carbs', 'carbohydrates'], dishFactor, dish);
    accumulate('fatTotal', ['fat_total', 'fatTotal', 'fats'], dishFactor, dish);
    accumulate('fatSaturated', ['fat_saturated', 'fatSaturated'], dishFactor, dish);
    accumulate('fatTrans', ['fat_trans', 'fatTrans'], dishFactor, dish);
    accumulate('fiber', ['fiber'], dishFactor, dish);
    accumulate('sodium', ['sodium'], dishFactor, dish);
    accumulate('addedSugars', ['added_sugars', 'addedSugars'], dishFactor, dish);
    accumulate('calcium', ['calcium'], dishFactor, dish);
    accumulate('iron', ['iron'], dishFactor, dish);
    totals.yieldWeight += (mainWeight > 0 ? mainWeight : 200);

    // =========================================================
    // B. CÁLCULO DOS ACOMPANHAMENTOS
    // =========================================================
    selectedOptions.forEach((opt) => {
      const accWeight = Number(opt.weight || opt.defaultGrammage || opt.default_grammage || 100);
      const accFactor = accWeight / 100;

      accumulate('energyKcal', ['energy_kcal', 'energyKcal', 'kcal'], accFactor, opt);
      accumulate('energyKj', ['energy_kj', 'energyKj', 'kj'], accFactor, opt);
      accumulate('proteins', ['proteins', 'protein'], accFactor, opt);
      accumulate('carbs', ['carbs', 'carbohydrates'], accFactor, opt);
      accumulate('fatTotal', ['fat_total', 'fatTotal', 'fats'], accFactor, opt);
      accumulate('fatSaturated', ['fat_saturated', 'fatSaturated'], accFactor, opt);
      accumulate('fatTrans', ['fat_trans', 'fatTrans'], accFactor, opt);
      accumulate('fiber', ['fiber'], accFactor, opt);
      accumulate('sodium', ['sodium'], accFactor, opt);
      accumulate('addedSugars', ['added_sugars', 'addedSugars'], accFactor, opt);
      accumulate('calcium', ['calcium'], accFactor, opt);
      accumulate('iron', ['iron'], accFactor, opt);
      totals.yieldWeight += accWeight;
    });

    // =========================================================
    // C. FINALIZAÇÃO E ARREDONDAMENTO
    // =========================================================
    if (totals.energyKj === 0 && totals.energyKcal > 0) {
      totals.energyKj = totals.energyKcal * 4.184;
    }

    const r3 = (n: number) => Number(n.toFixed(3));
    const r2 = (n: number) => Number(n.toFixed(2));

    return {
      energyKcal: r2(totals.energyKcal),
      energyKj: r2(totals.energyKj),
      proteins: r3(totals.proteins),
      carbs: r3(totals.carbs),
      fatTotal: r3(totals.fatTotal),
      fatSaturated: r3(totals.fatSaturated),
      fatTrans: r3(totals.fatTrans),
      fiber: r3(totals.fiber),
      sodium: r2(totals.sodium),
      addedSugars: r2(totals.addedSugars),
      calcium: r2(totals.calcium),
      iron: r2(totals.iron),
      yieldWeight: r2(totals.yieldWeight)
    };

  }, [dish, selectedSize, JSON.stringify(selectedOptions)]);
}