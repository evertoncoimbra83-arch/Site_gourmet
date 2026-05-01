/**
 * ✅ INTERFACES DE TIPAGEM
 */
interface NutritionalInfo {
  energy_kcal?: number | string;
  energyKcal?: number | string;
  kcal?: number | string;
  energy_kj?: number | string;
  energyKj?: number | string;
  kj?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  fat_total?: number | string;
  fatTotal?: number | string;
  fats?: number | string;
  fat_saturated?: number | string;
  fatSaturated?: number | string;
  fat_trans?: number | string;
  fatTrans?: number | string;
  fiber?: number | string;
  sodium?: number | string;
  added_sugars?: number | string;
  addedSugars?: number | string;
  calcium?: number | string;
  iron?: number | string;
  yield_weight?: number | string;
  yieldWeight?: number | string;
}

interface DishOrAcc {
  nutritional_info?: NutritionalInfo;
  nutrition?: NutritionalInfo;
  nutritionalInfo?: NutritionalInfo;
  mainDishWeight?: number | string;
  main_dish_weight?: number | string;
  yield_weight?: number | string;
  yieldWeight?: number | string;
  weight?: number | string;
  defaultGrammage?: number | string;
  default_grammage?: number | string;
  // Permite indexação dinâmica segura para o getVal
  [key: string]: unknown; 
}

/**
 * ✅ MAPPER TURBINADO: CALCULA A FICHA TÉCNICA COMPLETA
 */
export function mapPackageMealNutrition(dish: DishOrAcc | null | undefined, selectedAccs: DishOrAcc[] = []) {
  // 1. Proteção de entrada
  if (!dish) return null;

  const safeAccs = Array.isArray(selectedAccs) ? selectedAccs : [];

  // 2. Helper auxiliar para buscar valores em múltiplas chaves (resiliência)
  const getVal = (item: DishOrAcc | null | undefined, ...keys: string[]): number => {
    if (!item) return 0;
    
    // Tenta encontrar no nível raiz
    for (const key of keys) {
      const val = item[key];
      if (val !== undefined && val !== null) return Number(val);
    }

    // Tenta encontrar dentro de nutritional_info
    const info = (item.nutritional_info || item.nutrition || item.nutritionalInfo || {}) as Record<string, unknown>;
    for (const key of keys) {
      const val = info[key];
      if (val !== undefined && val !== null) return Number(val);
    }

    return 0;
  };

  // 3. Determina o peso do Prato Principal
  const dishWeight = getVal(dish, 'mainDishWeight', 'main_dish_weight', 'yield_weight', 'yieldWeight') || 200;
  const dishFactor = dishWeight / 100;

  // 4. Função Mestra de Soma
  const calculateField = (keys: string[]): number => {
    let total = getVal(dish, ...keys) * dishFactor;

    safeAccs.forEach((acc) => {
      const accWeight = getVal(acc, 'weight', 'defaultGrammage', 'default_grammage') || 100;
      const accFactor = accWeight / 100;
      total += getVal(acc, ...keys) * accFactor;
    });

    return total;
  };

  // 5. Cálculo do Peso Total Final (Yield)
  const totalWeight = dishWeight + safeAccs.reduce((sum, acc) => {
    return sum + (getVal(acc, 'weight', 'defaultGrammage', 'default_grammage') || 100);
  }, 0);

  // 6. Retorno formatado
  const energyKcal = calculateField(['energy_kcal', 'energyKcal', 'kcal']);

  return {
    energy_kcal: energyKcal,
    energy_kj: calculateField(['energy_kj', 'energyKj', 'kj']) || (energyKcal * 4.184),
    proteins: calculateField(['proteins']),
    carbs: calculateField(['carbs']),
    fat_total: calculateField(['fat_total', 'fatTotal', 'fats']),
    fat_saturated: calculateField(['fat_saturated', 'fatSaturated']),
    fat_trans: calculateField(['fat_trans', 'fatTrans']),
    fiber: calculateField(['fiber']),
    sodium: calculateField(['sodium']),
    added_sugars: calculateField(['added_sugars', 'addedSugars']),
    calcium: calculateField(['calcium']),
    iron: calculateField(['iron']),
    yieldWeight: totalWeight
  };
}