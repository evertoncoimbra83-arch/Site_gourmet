import { dishes } from "./../../drizzle/schema"; // Ajuste o caminho conforme seu projeto

// Extraímos o tipo do prato diretamente do Schema do Drizzle
type Dish = typeof dishes.$inferSelect;

/**
 * Interface padronizada de nutrição baseada no seu contrato novo (Fase 1)
 */
export interface StandardNutrition {
  energyKcal: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  fiber: number;
  sodium: number;
}

/**
 * 🎯 DISH NUTRITION NORMALIZER (Fase 2 do Roadmap)
 * Transforma dados brutos do banco (Strings Decimais ou JSON Legado) em Números.
 */
export function normalizeDishNutrition(dish: Partial<Dish>): StandardNutrition {
  // 1. Tentar extrair do JSON legado (nutritionalInfo) se ele existir
  let legacyData: Record<string, unknown> = {};
  
  if (dish.nutritionalInfo) {
    try {
      legacyData = typeof dish.nutritionalInfo === 'string' 
        ? JSON.parse(dish.nutritionalInfo) 
        : (dish.nutritionalInfo as Record<string, unknown>);
    } catch {
      // Falha no parse? Mantemos o objeto vazio
    }
  }

  // Helper para converter valores que podem vir do MySQL como String, null ou undefined
  const toNum = (val: unknown, fallback: unknown): number => {
    const finalVal = val ?? fallback ?? 0;
    return Number(finalVal);
  };

  // 2. Montar o objeto oficial priorizando as colunas individuais
  return {
    energyKcal: toNum(dish.energyKcal, legacyData.energy_kcal || legacyData.calories),
    proteins:   toNum(dish.proteins,   legacyData.proteins    || legacyData.protein),
    carbs:      toNum(dish.carbs,      legacyData.carbs       || legacyData.carbohydrates),
    fatTotal:   toNum(dish.fatTotal,   legacyData.fat_total   || legacyData.fat),
    fiber:      toNum(dish.fiber,      legacyData.fiber),
    sodium:     toNum(dish.sodium,     legacyData.sodium),
  };
}