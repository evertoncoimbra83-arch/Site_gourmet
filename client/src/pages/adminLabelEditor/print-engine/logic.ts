// client/src/pages/adminLabelEditor/print-engine/logic.ts
import { addDays, format } from "date-fns";
import { safeJsonParse, safeNumber } from "@/lib/safe-parse";

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

const EMPTY_NUTRITION_FALLBACK: NutritionData = {
  energyKcal: 0,
  carbs: 0,
  proteins: 0,
  fatTotal: 0,
  yieldWeight: 0,
};

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
  sizeName?: string | null;
  options?: string | ParsedOptions;
  parsedOptions?: string | ParsedOptions;
  packageItems?: MealOption[];
  applied_nutrition?: unknown;
  appliedNutrition?: unknown;
  nutrition?: unknown;
  nutritional_info?: unknown;
  nutritionalInfo?: unknown;
  nutritionData?: unknown;
  imageUrl?: string | null;
}

export interface OrderData {
  id?: string | number;
  customerName?: string;
  items?: OrderItem[];
}

function deepJsonParse<T>(val: unknown): T | Partial<T> {
  if (!val) return {} as Partial<T>;
  if (typeof val !== "string") return val as T;
  const parsed = safeJsonParse<unknown>(val, {});
  if (typeof parsed === "string") return deepJsonParse<T>(parsed);
  return parsed && typeof parsed === "object" ? (parsed as T) : ({} as Partial<T>);
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

function splitCompositionText(
  mainDish: string,
  accompaniments: string[],
): { mainDish: string; accompaniments: string[] } {
  const normalizedMainDish = cleanText(mainDish);
  const normalizedAccs = accompaniments.map(cleanText).filter(Boolean);

  if (normalizedAccs.length > 0) {
    return { mainDish: normalizedMainDish, accompaniments: normalizedAccs };
  }

  if (!normalizedMainDish.includes("+")) {
    return { mainDish: normalizedMainDish, accompaniments: [] };
  }

  const parts = normalizedMainDish
    .split("+")
    .map((part) => cleanText(part))
    .filter(Boolean);

  return {
    mainDish: parts[0] || normalizedMainDish,
    accompaniments: parts.slice(1),
  };
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

function formatMacroValue(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "--g";

  const hasFraction = Math.abs(value % 1) > 0;
  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: hasFraction ? 1 : 0,
    maximumFractionDigits: hasFraction ? 1 : 0,
  });

  return `${formatted}g`;
}

export function normalizeNutrition(raw: Record<string, unknown>): NutritionData {
  return {
    energyKcal: safeNumber(raw.energyKcal ?? raw.energy_kcal ?? raw.kcal),
    energyKj: safeNumber(raw.energyKj ?? raw.energy_kj),
    proteins: safeNumber(raw.proteins ?? raw.protein),
    carbs: safeNumber(raw.carbs ?? raw.carbohydrates),
    fatTotal: safeNumber(raw.fatTotal ?? raw.fat_total ?? raw.fats),
    fatSaturated: safeNumber(raw.fatSaturated ?? raw.fat_saturated ?? raw.saturatedFats),
    fatTrans: safeNumber(raw.fatTrans ?? raw.fat_trans ?? raw.transFats),
    fiber: safeNumber(raw.fiber ?? raw.dietary_fiber),
    sodium: safeNumber(raw.sodium ?? raw.salt),
    addedSugars: safeNumber(raw.addedSugars ?? raw.added_sugars),
    calcium: safeNumber(raw.calcium),
    iron: safeNumber(raw.iron),
    yieldWeight: safeNumber(raw.yieldWeight ?? raw.yield_weight),
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

export function formatNutritionLinear(nutri: NutritionData | null): string {
  if (!nutri) return "INF. NUTRICIONAL INDISPONÍVEL";
  return `KCAL: ${nutri.energyKcal?.toFixed(1)} | CARB: ${nutri.carbs?.toFixed(1)}G | PROT: ${nutri.proteins?.toFixed(1)}G | GORD: ${nutri.fatTotal?.toFixed(1)}G`;
}

export function formatNutritionText(nutri: NutritionData | null): string {
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

export function formatMacrosCompact(nutri: NutritionData | null): string {
  if (!nutri) return "P --g • C --g • G --g";

  return [
    `P ${formatMacroValue(nutri.proteins)}`,
    `C ${formatMacroValue(nutri.carbs)}`,
    `G ${formatMacroValue(nutri.fatTotal)}`,
  ].join(" • ");
}

export function formatMacrosLines(nutri: NutritionData | null): string {
  if (!nutri) {
    return ["Proteinas: --g", "Carboidratos: --g", "Gorduras: --g"].join("\n");
  }

  return [
    `Proteinas: ${formatMacroValue(nutri.proteins)}`,
    `Carboidratos: ${formatMacroValue(nutri.carbs)}`,
    `Gorduras: ${formatMacroValue(nutri.fatTotal)}`,
  ].join("\n");
}

export function buildFlatLabels(order: OrderData | null): FlatLabel[] {
  const items = order?.items;
  if (!Array.isArray(items)) return [];

  const labels: FlatLabel[] = [];

  for (const item of items) {
    const opts = deepJsonParse<ParsedOptions>(item.parsedOptions || item.options || "{}") as ParsedOptions;
    const qty = safeNumber(item.quantity, 1);

    for (let i = 0; i < qty; i += 1) {
      const baseDishIng = cleanText(item.ingredients);
      const meals = opts.meals || item.packageItems;
      const sizeName = cleanText(opts.sizeName || opts.selectedSizeName || item.sizeName || item.size_name || "PADRÃO");

      if (Array.isArray(meals) && meals.length > 0) {
        meals.forEach((meal, mIdx) => {
          const dishIng = cleanText(meal.ingredients ?? meal.dishIngredients);
          let accList = meal.accompaniments || meal.selectedAccompaniments || meal.selectedAccs;
          
          if (typeof accList === "string") {
            accList = safeJsonParse<Accompaniment[]>(accList, []);
          }

          const accNames = Array.isArray(accList)
            ? accList.map((acc) => cleanText(typeof acc === "string" ? acc : (acc?.name || acc?.label || ""))).filter(Boolean)
            : [];

          const splitMeal = splitCompositionText(
            cleanText(meal.dishName ?? meal.name ?? "ITEM DO COMBO"),
            accNames,
          );
          const dishName = splitMeal.mainDish;
          const normalizedAccNames = splitMeal.accompaniments;
          const compositionName =
            normalizedAccNames.length > 0
              ? `${dishName} + ${normalizedAccNames.join(" + ")}`
              : dishName;

          labels.push({
            id: `${item.id}-${i}-m-${mIdx}`,
            mainDishName: dishName,
            accompaniments: normalizedAccNames,
            displayName: compositionName,
            compositionName,
            parentName: "",
            slot: cleanText(meal.slotName ?? meal.slot) || `Marmita ${mIdx + 1}`,
            sizeName,
            dishIngredients: dishIng,
            accIngredients: normalizedAccNames.map((name) => `+ ${name}`).join("\n"),
            combinedIngredients:
              dishIng +
              (normalizedAccNames.length > 0
                ? `\nCOMPOSIÇÃO:\n${normalizedAccNames.join(", ")}`
                : ""),
            nutrition: extractNutrition(meal, mIdx),
          });
        });
        continue;
      }

      let accList = opts.accompaniments || opts.selectedAccs || opts.selectedAccompaniments;
      if (typeof accList === "string") {
        accList = safeJsonParse<Accompaniment[]>(accList, []);
      }

      const accNames = Array.isArray(accList)
        ? accList.map((acc) => cleanText(typeof acc === "string" ? acc : (acc?.name || acc?.label || ""))).filter(Boolean)
        : [];
        
      const splitItem = splitCompositionText(
        cleanText(item.dish_name ?? item.dishName ?? item.name ?? "PRATO"),
        accNames,
      );
      const dishName = splitItem.mainDish;
      const normalizedAccNames = splitItem.accompaniments;
      const compositionName =
        normalizedAccNames.length > 0
          ? `${dishName} + ${normalizedAccNames.join(" + ")}`
          : dishName;

      labels.push({
        id: `${item.id}-${i}`,
        mainDishName: dishName,
        accompaniments: normalizedAccNames,
        displayName: compositionName,
        compositionName,
        parentName: "",
        slot: "",
        sizeName,
        dishIngredients: baseDishIng,
        accIngredients:
          normalizedAccNames.map((name) => `+ ${name}`).join("\n") ||
          cleanText(item.accompaniments_ingredients),
        combinedIngredients:
          baseDishIng +
          (normalizedAccNames.length > 0
            ? `\nCOMPOSIÇÃO:\n${normalizedAccNames.join(", ")}`
            : ""),
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

    const safeMainDish = label?.mainDishName || "PRATO";
    let accsList: string[] = [];
    if (Array.isArray(label?.accompaniments)) {
      label.accompaniments.forEach((acc) => {
        if (typeof acc === "string") {
          accsList.push(...acc.split("+").map((p) => p.trim()).filter(Boolean));
        }
      });
    } else if (typeof label?.accompaniments === "string") {
      accsList = (label.accompaniments as string).split("+").map((p) => p.trim()).filter(Boolean);
    }

    let finalMainDish = safeMainDish;
    let finalAccs = [...accsList];

    if (finalAccs.length === 0 && finalMainDish.includes("+")) {
      const parts = finalMainDish.split("+").map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        finalMainDish = parts[0];
        finalAccs = parts.slice(1);
      }
    }

    const formatAccsList = (prefix: string) => finalAccs.map((acc) => `${prefix}${acc}`).join("\n");
    const formatCompLinhas = (prefix: string) => [finalMainDish, ...finalAccs.map((acc) => `${prefix}${acc}`)].join("\n");

    const safeComposition = finalAccs.length > 0 ? `${finalMainDish} + ${finalAccs.join(" + ")}` : finalMainDish;
    const safeIngredients = label?.combinedIngredients || "SEM INGREDIENTES";
    const safeSize = label?.sizeName || "PADRÃO";
    const safeNutrition = label?.nutrition || null;

    const upper = raw.toUpperCase();
    if (
      upper === "{{TABELA_NUTRI_GRAFICA}}" ||
      upper === "{TABELA_NUTRICIONAL_GRAFICA}" ||
      upper === "{{TABELA_NUTRI}}"
    ) {
      return safeNutrition ?? EMPTY_NUTRITION_FALLBACK;
    }

    const map: Record<string, string> = {
      "{{CLIENTE}}": toUpperSafe(order?.customerName || "NOME DO CLIENTE"),
      "{{NOME_PRATO}}": toUpperSafe(finalMainDish),
      "{{PRATO_PRINCIPAL}}": toUpperSafe(finalMainDish),
      "{{COMPOSICAO}}": toUpperSafe(safeComposition),
      "{{TAMANHO}}": toUpperSafe(safeSize),
      "{{TAMANHO_REFEICAO}}": toUpperSafe(safeSize),
      
      // Default multiline variables with * prefix
      "{{ACOMPANHAMENTOS_LINHAS}}": toUpperSafe(formatAccsList("* ")),
      "{{COMPOSICAO_LINHAS}}": toUpperSafe(formatCompLinhas("* ")),

      // Variants with specific prefixes
      "{{ACOMPANHAMENTOS_LINHAS_MAIS}}": toUpperSafe(formatAccsList("+ ")),
      "{{ACOMPANHAMENTOS_LINHAS_PONTO}}": toUpperSafe(formatAccsList("• ")),
      "{{ACOMPANHAMENTOS_LINHAS_ASTERISCO}}": toUpperSafe(formatAccsList("* ")),
      "{{ACOMPANHAMENTOS_LINHAS_SETA}}": toUpperSafe(formatAccsList("↳ ")),
      "{{ACOMPANHAMENTOS_LINHAS_SEM}}": toUpperSafe(formatAccsList("")),

      "{{COMPOSICAO_LINHAS_MAIS}}": toUpperSafe(formatCompLinhas("+ ")),
      "{{COMPOSICAO_LINHAS_PONTO}}": toUpperSafe(formatCompLinhas("• ")),
      "{{COMPOSICAO_LINHAS_ASTERISCO}}": toUpperSafe(formatCompLinhas("* ")),
      "{{COMPOSICAO_LINHAS_SETA}}": toUpperSafe(formatCompLinhas("↳ ")),
      "{{COMPOSICAO_LINHAS_SEM}}": toUpperSafe(formatCompLinhas("")),

      // Legacy ACOMPANHAMENTOS variable
      "{{ACOMPANHAMENTOS}}": toUpperSafe(formatAccsList("+ ")),

      "{{DATA_VAL}}": format(addDays(new Date(), validityDays), "dd/MM/yyyy"),
      "{{DATA_FAB}}": format(new Date(), "dd/MM/yyyy"),
      "{{PEDIDO_ID}}": `#${String(order?.id || "").slice(-6).toUpperCase()}`,
      "{{INGREDIENTES}}": toUpperSafe(safeIngredients),
      "{{TABELA_NUTRI_LINEAR}}": formatNutritionLinear(safeNutrition),
      "{{TABELA_NUTRI_TEXTO}}": formatNutritionText(safeNutrition),
      "{{MACROS_COMPACTO}}": formatMacrosCompact(safeNutrition),
      "{{MACROS_LINHAS}}": formatMacrosLines(safeNutrition),
    };

    map["{{ACOMPANHAMENTOS_LINHAS_PONTO}}"] = toUpperSafe(formatAccsList("\u2022 "));
    map["{{ACOMPANHAMENTOS_LINHAS_SETA}}"] = toUpperSafe(formatAccsList("\u21b3 "));
    map["{{COMPOSICAO_LINHAS_PONTO}}"] = toUpperSafe(formatCompLinhas("\u2022 "));
    map["{{COMPOSICAO_LINHAS_SETA}}"] = toUpperSafe(formatCompLinhas("\u21b3 "));

    if (map[upper]) return map[upper];

    return content.replace(/\{\{[^}]+\}\}/gi, (match) => {
      const key = match.toUpperCase();
      return map[key] !== undefined ? map[key] : match;
    });
  };
}
