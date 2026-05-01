// domain/nutrition/nutrition.ts
/**
 * ✅ INTERFACE DE DOMÍNIO (UI/Logic)
 */
export interface NutritionData {
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

/**
 * ✅ INTERFACE PARA O BANCO DE DADOS (API/Storage)
 */
export interface DatabaseNutrition {
  energy_kcal: number;
  energy_kj: number;
  proteins: number;
  carbs: number;
  fat_total: number;
  fat_saturated: number;
  fat_trans: number;
  fiber: number;
  sodium: number;
  added_sugars: number;
  calcium: number;
  iron: number;
  yield_weight: number;
}

/**
 * Cria um objeto de nutrição zerado.
 */
export const createEmptyNutrition = (): NutritionData => ({
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
});

/**
 * Utilitário: Busca valores em chaves variantes (snake_case vs camelCase) 
 */
export const getNutritionalValue = (
  item: Record<string, unknown> | null | undefined, 
  keys: string[]
): number => {
  if (!item) return 0;
  
  const lookup = (obj: Record<string, unknown>): number | null => {
    for (const key of keys) {
      const val = obj[key];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
    }
    return null;
  };

  const rootValue = lookup(item);
  if (rootValue !== null) return rootValue;

  const metaNodes = ['nutritional_info', 'nutritionalInfo', 'nutrition', 'nutritional_data'];
  for (const node of metaNodes) {
    const subNode = item[node];
    if (subNode && typeof subNode === 'object' && !Array.isArray(subNode)) {
      const subValue = lookup(subNode as Record<string, unknown>);
      if (subValue !== null) return subValue;
    }
  }

  return 0;
};

/**
 * Calcula a nutrição de um item individual proporcional ao peso.
 */
export const calculateItemNutrition = (
  source: Record<string, unknown>, 
  weight: number
): NutritionData => {
  const nutrition = createEmptyNutrition();
  const factor = weight / 100;

  const mapping: Array<{ key: keyof NutritionData; fields: string[] }> = [
    { key: 'energyKcal', fields: ['energy_kcal', 'energyKcal', 'kcal', 'energy'] },
    { key: 'energyKj', fields: ['energy_kj', 'energyKj', 'kj'] },
    { key: 'proteins', fields: ['proteins', 'proteinas', 'protein'] },
    { key: 'carbs', fields: ['carbs', 'carboidratos', 'carbohydrates'] },
    { key: 'fatTotal', fields: ['fat_total', 'fatTotal', 'fats', 'gorduras', 'fat'] },
    { key: 'fatSaturated', fields: ['fat_saturated', 'fatSaturated', 'saturated_fat'] },
    { key: 'fatTrans', fields: ['fat_trans', 'fatTrans', 'trans_fat'] },
    { key: 'fiber', fields: ['fiber', 'fibras', 'dietary_fiber'] },
    { key: 'sodium', fields: ['sodium', 'sodio'] },
    { key: 'addedSugars', fields: ['added_sugars', 'addedSugars', 'sugars'] },
    { key: 'calcium', fields: ['calcium', 'calcio'] },
    { key: 'iron', fields: ['iron', 'ferro'] },
  ];

  mapping.forEach(({ key, fields }) => {
    nutrition[key] = getNutritionalValue(source, fields) * factor;
  });

  nutrition.yieldWeight = weight;
  return nutrition;
};

/**
 * ✅ FUNÇÃO MESTRA
 * Calcula a nutrição de uma Marmita completa (Dish + Accs).
 */
export function calculateMealNutrition(
  dish: Record<string, unknown> | null | undefined,
  selectedAccs: Record<string, unknown>[] = []
): NutritionData {
  const total = createEmptyNutrition();
  
  if (!dish) return total;

  const dishWeight = getNutritionalValue(dish, ['mainDishWeight', 'main_dish_weight', 'yield_weight', 'yieldWeight']) || 200;
  const dishNut = calculateItemNutrition(dish, dishWeight);

  (Object.keys(total) as Array<keyof NutritionData>).forEach(key => {
    total[key] = dishNut[key];
  });

  selectedAccs.forEach((acc) => {
    const accWeight = getNutritionalValue(acc, ['weight', 'defaultGrammage', 'default_weight']) || 100;
    const accNut = calculateItemNutrition(acc, accWeight);

    (Object.keys(total) as Array<keyof NutritionData>).forEach(key => {
      if (key !== 'yieldWeight') {
        total[key] += accNut[key];
      }
    });
    total.yieldWeight += accWeight;
  });

  if (total.energyKj === 0 && total.energyKcal > 0) {
    total.energyKj = total.energyKcal * 4.184;
  }

  return total;
}

/**
 * ✅ SOMA TOTAL DO PACOTE
 * Consolida a nutrição de várias marmitas em um único objeto para o resumo do Carrinho.
 */
export function aggregateNutritionCollection(collection: NutritionData[]): NutritionData {
  const total = createEmptyNutrition();
  
  collection.forEach((item) => {
    (Object.keys(total) as Array<keyof NutritionData>).forEach(key => {
      total[key] += (item[key] || 0);
    });
  });

  return total;
}

/**
 * ✅ ADAPTER: Converte NutritionData (UI) para DatabaseNutrition (DB/API).
 */
export function mapToDatabaseNutrition(data: NutritionData): DatabaseNutrition {
  return {
    energy_kcal: data.energyKcal,
    energy_kj: data.energyKj,
    proteins: data.proteins,
    carbs: data.carbs,
    fat_total: data.fatTotal,
    fat_saturated: data.fatSaturated,
    fat_trans: data.fatTrans,
    fiber: data.fiber,
    sodium: data.sodium,
    added_sugars: data.addedSugars,
    calcium: data.calcium,
    iron: data.iron,
    yield_weight: data.yieldWeight
  };
}

/**
 * ✅ Calcula a nutrição de uma coleção de itens genéricos
 */
export function calculateCollectionNutrition(
  items: Record<string, unknown>[]
): NutritionData {
  const total = createEmptyNutrition();
  
  items.forEach((item) => {
    const weight = getNutritionalValue(item, ['weight', 'defaultGrammage']) || 100;
    const itemNut = calculateItemNutrition(item, weight);

    (Object.keys(total) as Array<keyof NutritionData>).forEach(key => {
      if (key !== 'yieldWeight') {
        total[key] += itemNut[key];
      }
    });
    total.yieldWeight += weight;
  });

  return total;
}