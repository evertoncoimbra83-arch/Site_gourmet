// client/src/pages/adminLabelEditor/print-engine/logic.ts
import { addDays, format } from "date-fns";

export interface NutritionData {
  energyKcal?: number;
  energyKj?: number;
  proteins?: number;
  carbs?: number;
  fatTotal?: number;
  fatSaturated?: number;
  fatTrans?: number;
  fiber?: number;
  sodium?: number;
  addedSugars?: number;
  calcium?: number;
  iron?: number;
  yieldWeight?: number;
}

export interface FlatLabel {
  id: string | number;
  displayName: string;
  mainDishName: string;      // ✅ ADICIONADO: Nome limpo do prato principal
  accompaniments: string[];  // ✅ ADICIONADO: Lista estruturada de acompanhamentos
  compositionName: string;
  parentName: string;
  slot: string;
  dishIngredients: string;
  accIngredients: string;
  combinedIngredients: string;
  nutrition: NutritionData | null;
  sizeName: string;
}

export interface Accompaniment {
  label?: string;
  id?: string | number;
  name?: string;
  weight?: number | string;
  ingredients?: string;
  group?: string;
}

export interface MealOption {
  dishId?: string | number;
  dishName?: string;
  name?: string;
  ingredients?: string;
  dishIngredients?: string;
  selectedAccompaniments?: Accompaniment[];
  selectedAccs?: Accompaniment[];
  accompaniments?: Accompaniment[];
  slot?: string;
  slotName?: string;
  label?: string;
  applied_nutrition?: unknown;
  nutrition?: unknown;
  nutritionalInfo?: unknown;
  composition_ids?: { dish?: string | number; accs?: Array<string | number> };
}

export interface ParsedOptions {
  sizeName?: string;
  selectedSizeName?: string;
  meals?: MealOption[];
  selectedAccs?: Accompaniment[];
  selectedAccompaniments?: Accompaniment[];
  accompaniments?: Accompaniment[];
}

export interface OrderItem {
  totalPrice: number;
  id: string | number;
  quantity: number | string;
  name?: string;
  dish_name?: string;
  dishName?: string;
  ingredients?: string;
  accompaniments_ingredients?: string;
  size_name?: string;
  options?: string | ParsedOptions;
  parsedOptions?: string | ParsedOptions;
  packageItems?: MealOption[];
  applied_nutrition?: unknown;
  appliedNutrition?: unknown;
  nutrition?: unknown;
  nutritional_info?: unknown;
  nutritionalInfo?: unknown;
  nutritionData?: unknown;
}

export interface OrderData {
  id?: string | number;
  customerName?: string;
  items?: OrderItem[];
}

function deepJsonParse<T>(val: unknown): T | Partial<T> {
  if (!val) return {} as Partial<T>;
  if (typeof val !== "string") return val as T;
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === "string") return deepJsonParse<T>(parsed);
    return (parsed && typeof parsed === "object") ? (parsed as T) : ({} as Partial<T>);
  } catch {
    return {} as Partial<T>;
  }
}

/**
 * ✅ MELHORIA ESTADO DE ARTE: Normalização Oficial do Motor
 * Centraliza o parsing que antes ficava espalhado no frontend.
 */
export function normalizeOrderItems(items: OrderItem[]): OrderItem[] {
  return items.map(item => {
    const opts = deepJsonParse<ParsedOptions>(item.parsedOptions || item.options || "{}") as ParsedOptions;
    return { 
      ...item, 
      parsedOptions: opts,
      options: opts 
    };
  });
}

/**
 * ✅ MELHORIA CODEX: Sanitização Universal
 */
export function cleanText(val: unknown): string {
  const str = String(val ?? "").trim();
  return str
    .replace(/Ã§/g, 'ç')
    .replace(/Ã£/g, 'ã')
    .replace(/Ã©/g, 'é')
    .replace(/Â/g, '')
    .replace(/adddim$/i, "") 
    .trim();
}

function toUpperSafe(val: unknown): string {
  return cleanText(val).toUpperCase();
}

export function formatNutritionAmount(value: unknown, unit: "kcal" | "g" | "mg"): string {
  const parsed = Number(String(value ?? 0).replace(",", "."));
  if (!Number.isFinite(parsed)) return "-";

  const formatted = parsed.toLocaleString("pt-BR", {
    minimumFractionDigits: unit === "g" && parsed % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: unit === "g" ? 1 : 0,
  });

  return `${formatted}${unit === "kcal" ? " kcal" : unit}`;
}

export function normalizeNutrition(raw: Record<string, unknown>): NutritionData {
  return {
    energyKcal: Number(raw.energyKcal ?? raw.energy_kcal ?? raw.kcal ?? 0),
    energyKj: Number(raw.energyKj ?? raw.energy_kj ?? 0),
    proteins: Number(raw.proteins ?? raw.protein ?? 0),
    carbs: Number(raw.carbs ?? raw.carbohydrates ?? 0),
    fatTotal: Number(raw.fatTotal ?? raw.fat_total ?? raw.fats ?? 0),
    fatSaturated: Number(raw.fatSaturated ?? raw.fat_saturated ?? raw.saturatedFats ?? 0),
    fatTrans: Number(raw.fatTrans ?? raw.fat_trans ?? raw.transFats ?? 0),
    fiber: Number(raw.fiber ?? raw.dietary_fiber ?? 0),
    sodium: Number(raw.sodium ?? raw.salt ?? 0),
    addedSugars: Number(raw.addedSugars ?? raw.added_sugars ?? 0),
    calcium: Number(raw.calcium ?? 0),
    iron: Number(raw.iron ?? 0),
    yieldWeight: Number(raw.yieldWeight ?? raw.yield_weight ?? 0),
  };
}

export function extractNutrition(
  src: Partial<OrderItem> | MealOption | null | undefined,
  mealIndex = 0,
): NutritionData | null {
  if (!src) return null;

  const srcRecord = src as Record<string, unknown>;
  const candidates = [
    srcRecord.nutrition,
    srcRecord.nutritionalInfo,
    srcRecord.nutritional_info,
    srcRecord.appliedNutrition,
    srcRecord.applied_nutrition,
    srcRecord.nutritionData,
  ];

  for (const raw of candidates) {
    if (!raw || raw === "null") continue;
    const parsed = deepJsonParse<unknown>(raw);

    if (Array.isArray(parsed)) {
      const item = parsed[mealIndex] ?? parsed[0];
      if (item && typeof item === "object") {
        return normalizeNutrition(item as Record<string, unknown>);
      }
      continue;
    }

    if (parsed && typeof parsed === "object") {
      const data = parsed as Record<string, unknown>;
      const hasNutrition =
        data.energyKcal !== undefined ||
        data.energy_kcal !== undefined ||
        data.kcal !== undefined ||
        data.carbs !== undefined ||
        data.carbohydrates !== undefined;

      if (hasNutrition) return normalizeNutrition(data);
    }
  }

  return null;
}

function formatNutritionLinear(nutri: NutritionData | null): string {
  if (!nutri) return "INF. NUTRICIONAL INDISPONÍVEL";
  return `KCAL: ${nutri.energyKcal?.toFixed(1)} | CARB: ${nutri.carbs?.toFixed(1)}G | PROT: ${nutri.proteins?.toFixed(1)}G | GORD: ${nutri.fatTotal?.toFixed(1)}G`;
}

function formatNutritionText(nutri: NutritionData | null): string {
  if (!nutri) return "INFORMAÇÃO NUTRICIONAL INDISPONÍVEL";
  const weight = nutri.yieldWeight ? `PORÇÃO DE ${nutri.yieldWeight}G` : "PORÇÃO PADRÃO";
  return [
    `INFORMAÇÃO NUTRICIONAL (${weight})`,
    "----------------------------------------------------",
    `CALORIAS: ${nutri.energyKcal?.toFixed(1)} KCAL  |  CARBOIDRATOS: ${nutri.carbs?.toFixed(1)} G`,
    `PROTEÍNAS: ${nutri.proteins?.toFixed(1)} G    |  GORD. TOTAIS: ${nutri.fatTotal?.toFixed(1)} G`,
    `GORD. SAT.: ${nutri.fatSaturated?.toFixed(1)} G    |  GORD. TRANS: ${nutri.fatTrans?.toFixed(1)} G`,
    `FIBRAS: ${nutri.fiber?.toFixed(1)} G        |  SÓDIO: ${nutri.sodium?.toFixed(1)} MG`,
  ].join("\n");
}

export function buildFlatLabels(order: OrderData | null): FlatLabel[] {
  const items = order?.items;
  if (!Array.isArray(items)) return [];

  const labels: FlatLabel[] = [];

  for (const item of items) {
    const opts = deepJsonParse<ParsedOptions>(item.parsedOptions || item.options || "{}") as ParsedOptions;
    const qty = Number(item.quantity || 1);

    for (let i = 0; i < qty; i += 1) {
      const baseDishIng = cleanText(item.ingredients);
      const meals = opts.meals || item.packageItems;
      const sizeName = cleanText(opts.sizeName || opts.selectedSizeName || item.size_name || "PADRÃO");

      if (Array.isArray(meals) && meals.length > 0) {
        meals.forEach((meal, mIdx) => {
          const dishIng = cleanText(meal.ingredients ?? meal.dishIngredients);
          let accList = meal.accompaniments || meal.selectedAccompaniments || meal.selectedAccs;
          
          if (typeof accList === "string") {
            try { accList = JSON.parse(accList) as Accompaniment[]; } catch { accList = []; }
          }

          const accNames = Array.isArray(accList)
            ? accList.map((acc) => cleanText(typeof acc === "string" ? acc : (acc?.name || acc?.label || ""))).filter(Boolean)
            : [];

          const dishName = cleanText(meal.dishName ?? meal.name ?? "ITEM DO COMBO");
          const compositionName = accNames.length > 0 ? `${dishName} + ${accNames.join(" + ")}` : dishName;

          labels.push({
            id: `${item.id}-${i}-m-${mIdx}`,
            mainDishName: dishName,
            accompaniments: accNames,
            displayName: compositionName,
            compositionName,
            parentName: "",
            slot: cleanText(meal.slotName ?? meal.slot) || `Marmita ${mIdx + 1}`,
            sizeName,
            dishIngredients: dishIng,
            accIngredients: accNames.map((name) => `+ ${name}`).join("\n"),
            combinedIngredients: dishIng + (accNames.length > 0 ? `\nCOMPOSIÇÃO:\n${accNames.join(", ")}` : ""),
            nutrition: extractNutrition(meal, mIdx),
          });
        });
        continue;
      }

      let accList = opts.accompaniments || opts.selectedAccs || opts.selectedAccompaniments;
      if (typeof accList === "string") {
        try { accList = JSON.parse(accList) as Accompaniment[]; } catch { accList = []; }
      }

      const accNames = Array.isArray(accList)
        ? accList.map((acc) => cleanText(typeof acc === "string" ? acc : (acc?.name || acc?.label || ""))).filter(Boolean)
        : [];
        
      const dishName = cleanText(item.dish_name ?? item.dishName ?? item.name ?? "PRATO");
      const compositionName = accNames.length > 0 ? `${dishName} + ${accNames.join(" + ")}` : dishName;

      labels.push({
        id: `${item.id}-${i}`,
        mainDishName: dishName,
        accompaniments: accNames,
        displayName: compositionName,
        compositionName,
        parentName: "",
        slot: "",
        sizeName,
        dishIngredients: baseDishIng,
        accIngredients: accNames.map((name) => `+ ${name}`).join("\n") || cleanText(item.accompaniments_ingredients),
        combinedIngredients: baseDishIng + (accNames.length > 0 ? `\nCOMPOSIÇÃO:\n${accNames.join(", ")}` : ""),
        nutrition: extractNutrition(item, i),
      });
    }
  }

  return labels;
}

export function createLabelContentParser(
  order: OrderData | null,
  flatLabels: FlatLabel[],
  validityDays = 90,
) {
  const warnedMissingLabelIndexes = new Set<number>();

  return (content: string, labelIndex = 0): string | NutritionData | null => {
    if (!content || typeof content !== "string") return content;

    const label = flatLabels[labelIndex];
    const raw = content.trim();

    if (!label && !warnedMissingLabelIndexes.has(labelIndex)) {
      warnedMissingLabelIndexes.add(labelIndex);
      console.warn("[adminLabelEditor/print-engine] Missing flat label for parser", {
        labelIndex,
        availableLabels: flatLabels.length,
        orderId: order?.id,
        token: raw,
      });
    }

    const safeDishName = label?.displayName || "PRATO";
    const safeComposition = label?.displayName || safeDishName;
    const safeAccs = label?.accIngredients || "";
    const safeIngredients = label?.combinedIngredients || "SEM INGREDIENTES";
    const safeSize = label?.sizeName || "PADRÃO";
    const safeNutrition = label?.nutrition || null;

    const upper = raw.toUpperCase();
    if (
      upper === "{{TABELA_NUTRI_GRAFICA}}" ||
      upper === "{TABELA_NUTRICIONAL_GRAFICA}" ||
      upper === "{{TABELA_NUTRI}}"
    ) {
      return safeNutrition ?? {
        energyKcal: 0,
        carbs: 0,
        proteins: 0,
        fatTotal: 0,
        yieldWeight: 0,
      };
    }

    const map: Record<string, string> = {
      "{{CLIENTE}}": toUpperSafe(order?.customerName || "NOME DO CLIENTE"),
      "{{NOME_PRATO}}": toUpperSafe(safeDishName),
      "{{COMPOSICAO}}": toUpperSafe(safeComposition),
      "{{TAMANHO}}": toUpperSafe(safeSize),
      "{{ACOMPANHAMENTOS}}": toUpperSafe(safeAccs),
      "{{DATA_VAL}}": format(addDays(new Date(), validityDays), "dd/MM/yyyy"),
      "{{DATA_FAB}}": format(new Date(), "dd/MM/yyyy"),
      "{{PEDIDO_ID}}": `#${String(order?.id || "").slice(-6).toUpperCase()}`,
      "{{INGREDIENTES}}": toUpperSafe(safeIngredients),
      "{{TABELA_NUTRI_LINEAR}}": formatNutritionLinear(safeNutrition),
      "{{TABELA_NUTRI_TEXTO}}": formatNutritionText(safeNutrition),
    };

    if (map[upper]) return map[upper];

    return content.replace(/\{\{[^}]+\}\}/gi, (match) => {
      const key = match.toUpperCase();
      return map[key] !== undefined ? map[key] : match;
    });
  };
}