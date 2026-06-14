// shared/domain/nutrition/nutrition.ts

export const DEFAULT_RECIPE_WEIGHT = 200;
export const DEFAULT_ACCOMPANIMENT_WEIGHT = 100;

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

export type NutritionSource = Record<string, unknown> | null | undefined;

export interface CanonicalAccompanimentInput extends Record<string, unknown> {
  weight?: number | string | null;
  defaultGrammage?: number | string | null;
  default_grammage?: number | string | null;
  isNoAccompaniment?: boolean | null;
  is_no_accompaniment?: boolean | null;
}

export interface CanonicalNutritionInput {
  dish: NutritionSource;
  recipeWeight?: number | string | null;
  targetMainDishWeight?: number | string | null;
  composition?: Array<Record<string, unknown>> | null;
  accompaniments?: CanonicalAccompanimentInput[];
  fallbackRecipeWeight?: number;
}

export interface CanonicalNutritionResult {
  nutrition: NutritionData;
  metadata: {
    recipeWeightUsed: number;
    targetMainDishWeightUsed: number;
    usedRecipeWeightFallback: boolean;
    usedTargetWeightFallback: boolean;
    accompanimentsWeightTotal: number;
    compositionItemsCount: number;
    dishNutritionSourceFound: boolean;
    missingDishNutrition: boolean;
    normalizedDishNutrition: NutritionData;
    skippedNoAccompaniment: boolean;
    skippedNoAccompanimentCount: number;
  };
}

const NUTRITION_FIELDS: Array<{ key: keyof NutritionData; aliases: string[] }> = [
  { key: "energyKcal", aliases: ["energyKcal", "energy_kcal", "kcal", "calories", "energy"] },
  { key: "energyKj", aliases: ["energyKj", "energy_kj", "kj"] },
  { key: "proteins", aliases: ["proteins", "protein", "protein_g", "proteins_g", "proteinas"] },
  { key: "carbs", aliases: ["carbs", "carbohydrates", "carbs_g", "carbohydrate_g", "carboidratos"] },
  { key: "fatTotal", aliases: ["fatTotal", "fat_total", "fat", "totalFat", "total_fat", "fats", "gorduras"] },
  { key: "fatSaturated", aliases: ["fatSaturated", "fat_saturated", "saturatedFat", "saturated_fat"] },
  { key: "fatTrans", aliases: ["fatTrans", "fat_trans", "transFat", "trans_fat"] },
  { key: "fiber", aliases: ["fiber", "fibers", "fiber_g", "dietaryFiber", "dietary_fiber", "fibras"] },
  { key: "sodium", aliases: ["sodium", "sodium_mg", "sodio"] },
  { key: "addedSugars", aliases: ["addedSugars", "added_sugars", "sugars"] },
  { key: "calcium", aliases: ["calcium", "calcio"] },
  { key: "iron", aliases: ["iron", "ferro"] },
];

const NUTRITION_NODES = [
  "nutrition",
  "nutritionalInfo",
  "nutritional_info",
  "nutritionalData",
  "nutritional_data",
  "macros",
  "baseMacros",
  "dish",
  "product",
  "selectedDish",
  "baseDish",
];

function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = typeof value === "string" ? value.replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value: number, decimals = 2): number {
  const safe = Number.isFinite(value) ? value : 0;
  return Number(safe.toFixed(decimals));
}

function normalizeLabel(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isNoAccompanimentOption(accompaniment: CanonicalAccompanimentInput): boolean {
  if (accompaniment.isNoAccompaniment === true || accompaniment.is_no_accompaniment === true) {
    return true;
  }

  // Compatibilidade temporaria para registros antigos ainda nao marcados no banco.
  return normalizeLabel(accompaniment.name) === "sem acompanhamento";
}

function firstValidNumber(values: unknown[], fallback = 0): number {
  for (const value of values) {
    const parsed = safeNumber(value, Number.NaN);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

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
  yieldWeight: 0,
});

export const getNutritionalValue = (
  item: NutritionSource,
  keys: string[],
): number => {
  if (!item) return 0;

  const sources: Record<string, unknown>[] = [item];
  for (const node of NUTRITION_NODES) {
    const nested = item[node];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      sources.push(nested as Record<string, unknown>);
    }
  }

  let firstFinite: number | null = null;

  const read = (source: Record<string, unknown>): number | null => {
    for (const key of keys) {
      if (source[key] === undefined || source[key] === null) continue;
      const parsed = safeNumber(source[key], Number.NaN);
      if (!Number.isFinite(parsed)) continue;
      if (firstFinite === null) firstFinite = parsed;
      if (parsed !== 0) return parsed;
    }
    return null;
  };

  for (const source of sources) {
    const sourceValue = read(source);
    if (sourceValue !== null) return sourceValue;
  }

  return firstFinite ?? 0;
};

export function normalizeNutritionKeys(source: NutritionSource): NutritionData {
  const nutrition = createEmptyNutrition();

  NUTRITION_FIELDS.forEach(({ key, aliases }) => {
    nutrition[key] = getNutritionalValue(source, aliases);
  });

  return nutrition;
}

export function extractDishNutritionSource(source: NutritionSource): NutritionSource {
  if (!source) return source;

  const candidates: NutritionSource[] = [
    source,
    source.nutrition as NutritionSource,
    source.nutritionalInfo as NutritionSource,
    source.nutritional_info as NutritionSource,
    source.nutritionalData as NutritionSource,
    source.nutritional_data as NutritionSource,
    source.macros as NutritionSource,
    source.baseMacros as NutritionSource,
    source.dish as NutritionSource,
    source.product as NutritionSource,
    source.selectedDish as NutritionSource,
    source.baseDish as NutritionSource,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const normalized = normalizeNutritionKeys(candidate);
    if (
      normalized.energyKcal > 0 ||
      normalized.proteins > 0 ||
      normalized.carbs > 0 ||
      normalized.fatTotal > 0
    ) {
      return candidate;
    }
  }

  return source;
}

export function inferRecipeWeightFromComposition(
  composition: Array<Record<string, unknown>> | null | undefined,
  fallbackRecipeWeight = DEFAULT_RECIPE_WEIGHT,
): { recipeWeight: number; usedFallback: boolean; compositionItemsCount: number } {
  const safeFallback = firstValidNumber([fallbackRecipeWeight], DEFAULT_RECIPE_WEIGHT);
  const items = Array.isArray(composition) ? composition : [];
  const total = items.reduce((sum, item) => sum + safeNumber(item.quantity), 0);
  const recipeWeight = total > 0 ? total : safeFallback;

  return {
    recipeWeight: round(recipeWeight, 2),
    usedFallback: total <= 0,
    compositionItemsCount: items.length,
  };
}

function finalizeNutrition(nutrition: NutritionData): NutritionData {
  if (nutrition.energyKj === 0 && nutrition.energyKcal > 0) {
    nutrition.energyKj = nutrition.energyKcal * 4.184;
  }

  return {
    energyKcal: round(nutrition.energyKcal, 2),
    energyKj: round(nutrition.energyKj, 2),
    proteins: round(nutrition.proteins, 3),
    carbs: round(nutrition.carbs, 3),
    fatTotal: round(nutrition.fatTotal, 3),
    fatSaturated: round(nutrition.fatSaturated, 3),
    fatTrans: round(nutrition.fatTrans, 3),
    fiber: round(nutrition.fiber, 3),
    sodium: round(nutrition.sodium, 2),
    addedSugars: round(nutrition.addedSugars, 2),
    calcium: round(nutrition.calcium, 2),
    iron: round(nutrition.iron, 2),
    yieldWeight: round(nutrition.yieldWeight, 2),
  };
}

function scaleNutrition(source: NutritionData, factor: number, yieldWeight: number): NutritionData {
  const scaled = createEmptyNutrition();
  const safeFactor = Number.isFinite(factor) ? factor : 0;

  NUTRITION_FIELDS.forEach(({ key }) => {
    scaled[key] = source[key] * safeFactor;
  });
  scaled.yieldWeight = yieldWeight;

  return finalizeNutrition(scaled);
}

export function calculateMainDishNutrition(input: {
  dish: NutritionSource;
  recipeWeight?: number | string | null;
  targetMainDishWeight?: number | string | null;
  composition?: Array<Record<string, unknown>> | null;
  fallbackRecipeWeight?: number;
}): CanonicalNutritionResult {
  const fallback = firstValidNumber([input.fallbackRecipeWeight], DEFAULT_RECIPE_WEIGHT);
  const inferred = inferRecipeWeightFromComposition(input.composition, fallback);
  const recipeWeightCandidate = safeNumber(input.recipeWeight, Number.NaN);
  const recipeWeightUsed =
    Number.isFinite(recipeWeightCandidate) && recipeWeightCandidate > 0
      ? recipeWeightCandidate
      : inferred.recipeWeight;

  const targetCandidate = safeNumber(input.targetMainDishWeight, Number.NaN);
  const targetMainDishWeightUsed =
    Number.isFinite(targetCandidate) && targetCandidate > 0
      ? targetCandidate
      : fallback;

  const base = normalizeNutritionKeys(input.dish);
  const dishNutritionSourceFound =
    base.energyKcal > 0 || base.proteins > 0 || base.carbs > 0 || base.fatTotal > 0;
  const ratio = targetMainDishWeightUsed / recipeWeightUsed;
  const nutrition = scaleNutrition(base, ratio, targetMainDishWeightUsed);

  return {
    nutrition,
    metadata: {
      recipeWeightUsed: round(recipeWeightUsed, 2),
      targetMainDishWeightUsed: round(targetMainDishWeightUsed, 2),
      usedRecipeWeightFallback:
        !(Number.isFinite(recipeWeightCandidate) && recipeWeightCandidate > 0) &&
        inferred.usedFallback,
      usedTargetWeightFallback: !(Number.isFinite(targetCandidate) && targetCandidate > 0),
      accompanimentsWeightTotal: 0,
      compositionItemsCount: inferred.compositionItemsCount,
      dishNutritionSourceFound,
      missingDishNutrition: !dishNutritionSourceFound,
      normalizedDishNutrition: base,
      skippedNoAccompaniment: false,
      skippedNoAccompanimentCount: 0,
    },
  };
}

export function calculateAccompanimentNutrition(
  accompaniment: CanonicalAccompanimentInput,
): { nutrition: NutritionData; weightUsed: number; skippedNoAccompaniment: boolean } {
  if (isNoAccompanimentOption(accompaniment)) {
    return {
      nutrition: createEmptyNutrition(),
      weightUsed: 0,
      skippedNoAccompaniment: true,
    };
  }

  const weightUsed = firstValidNumber(
    [
      accompaniment.weight,
      accompaniment.defaultGrammage,
      accompaniment.default_grammage,
      accompaniment.defaultWeight,
      accompaniment.default_weight,
    ],
    DEFAULT_ACCOMPANIMENT_WEIGHT,
  );
  const base = normalizeNutritionKeys(accompaniment);
  return {
    nutrition: scaleNutrition(base, weightUsed / 100, weightUsed),
    weightUsed: round(weightUsed, 2),
    skippedNoAccompaniment: false,
  };
}

export function calculateMealNutritionCanonical(
  input: CanonicalNutritionInput,
): CanonicalNutritionResult {
  const main = calculateMainDishNutrition(input);
  const total = { ...main.nutrition };
  let accompanimentsWeightTotal = 0;
  let skippedNoAccompanimentCount = 0;

  (input.accompaniments || []).forEach((acc) => {
    const { nutrition, weightUsed, skippedNoAccompaniment } = calculateAccompanimentNutrition(acc);
    if (skippedNoAccompaniment) {
      skippedNoAccompanimentCount += 1;
      return;
    }

    accompanimentsWeightTotal += weightUsed;

    NUTRITION_FIELDS.forEach(({ key }) => {
      total[key] += nutrition[key];
    });
    total.yieldWeight += weightUsed;
  });

  return {
    nutrition: finalizeNutrition(total),
    metadata: {
      ...main.metadata,
      accompanimentsWeightTotal: round(accompanimentsWeightTotal, 2),
      skippedNoAccompaniment: skippedNoAccompanimentCount > 0,
      skippedNoAccompanimentCount,
    },
  };
}

export const calculateItemNutrition = (
  source: Record<string, unknown>,
  weight: number,
): NutritionData => {
  return calculateAccompanimentNutrition({ ...source, weight }).nutrition;
};

export function calculateMealNutrition(
  dish: NutritionSource,
  selectedAccs: Record<string, unknown>[] = [],
): NutritionData {
  if (!dish) return createEmptyNutrition();

  const recipeWeight =
    getNutritionalValue(dish, ["recipeWeight", "recipe_weight", "yieldWeight", "yield_weight"]) ||
    undefined;
  const targetMainDishWeight =
    getNutritionalValue(dish, ["mainDishWeight", "main_dish_weight"]) || undefined;
  const composition = Array.isArray((dish as Record<string, unknown>).composition)
    ? ((dish as Record<string, unknown>).composition as Record<string, unknown>[])
    : undefined;

  return calculateMealNutritionCanonical({
    dish,
    recipeWeight,
    targetMainDishWeight,
    composition,
    accompaniments: selectedAccs,
  }).nutrition;
}

export function aggregateNutritionCollection(collection: NutritionData[]): NutritionData {
  const total = createEmptyNutrition();

  collection.forEach((item) => {
    (Object.keys(total) as Array<keyof NutritionData>).forEach((key) => {
      total[key] += safeNumber(item[key]);
    });
  });

  return finalizeNutrition(total);
}

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
    yield_weight: data.yieldWeight,
  };
}

export function calculateCollectionNutrition(
  items: Record<string, unknown>[],
): NutritionData {
  const total = createEmptyNutrition();

  items.forEach((item) => {
    const { nutrition } = calculateAccompanimentNutrition(item);
    NUTRITION_FIELDS.forEach(({ key }) => {
      total[key] += nutrition[key];
    });
    total.yieldWeight += nutrition.yieldWeight;
  });

  return finalizeNutrition(total);
}
