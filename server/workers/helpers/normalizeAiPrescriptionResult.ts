import crypto from "crypto";
import { safeNumber } from "../../lib/safe-parse.js";

// --- TIPAGEM DO CATÁLOGO ---
type CatalogOption = {
  id: string | number;
  name: string;
  energyKcal?: number;
  proteins?: number;
  carbs?: number;
  fatTotal?: number;
  priceModifier?: number;
};

type CatalogGroup = {
  id: string | number;
  name: string;
  minSelections?: number;
  maxSelections?: number;
  isRequired?: boolean;
  options: CatalogOption[];
};

type CatalogSize = {
  id: string | number;
  name: string;
  weight?: number;
  mainDishWeight?: number;
  price?: number;
  isDefault?: boolean;
  accompanimentGroups: CatalogGroup[];
};

type CatalogDish = {
  id: string | number;
  name: string;
  description?: string;
  energyKcal?: number;
  proteins?: number;
  carbs?: number;
  fatTotal?: number;
  availableSizes: CatalogSize[];
};

export type NutriCatalog = {
  dishes: CatalogDish[];
};

// --- TIPAGEM DA IA (ENTRADA) ---
type AiSelectedAcc = {
  groupId?: string | number;
  categoryId?: string | number;
  optionId?: string | number;
  name?: string;
  extraPrice?: number;
};

type AiOption = {
  id?: string;
  dishId?: string | number;
  sizeId?: string | number;
  name?: string;
  priceAtCreation?: number;
  selectedAccompaniments?: AiSelectedAcc[];
};

// Interface auxiliar para remover 'any'
interface NormalizedAcc {
  groupId: string | number;
  optionId: string | number;
  name: string;
  extraPrice: number;
}

// --- HELPERS DE APOIO ---
function toStr(v: unknown) {
  return String(v ?? "");
}

function findDish(catalog: NutriCatalog, dishId?: string | number) {
  return catalog.dishes.find((d) => toStr(d.id) === toStr(dishId));
}

function findDefaultSize(dish: CatalogDish) {
  return dish.availableSizes.find((s) => s.isDefault) || dish.availableSizes[0];
}

function findSize(dish: CatalogDish, sizeId?: string | number) {
  return dish.availableSizes.find((s) => toStr(s.id) === toStr(sizeId)) || findDefaultSize(dish);
}

/**
 * ✅ NORMALIZA ACOMPANHAMENTOS
 */
function normalizeSelectedAccs(
  size: CatalogSize,
  selectedAccompaniments?: AiSelectedAcc[]
): NormalizedAcc[] {
  const inputAccs = Array.isArray(selectedAccompaniments) ? selectedAccompaniments : [];
  const normalized: NormalizedAcc[] = [];

  const weight = safeNumber(size.mainDishWeight || size.weight);

  for (const group of size.accompanimentGroups || []) {
    const requestedForGroup = inputAccs.filter(
      (a) => toStr(a.groupId || a.categoryId) === toStr(group.id)
    );

    const validRequested: NormalizedAcc[] = requestedForGroup
      .map((acc) => {
        const found = group.options.find((o) => toStr(o.id) === toStr(acc.optionId));
        if (!found) return null;

        return {
          groupId: group.id,
          optionId: found.id,
          name: found.name,
          extraPrice: safeNumber(found.priceModifier || acc.extraPrice),
        };
      })
      .filter((item): item is NormalizedAcc => item !== null);

    // 🔥 REGRA DE 200g: Se > 200g, força 2 acompanhamentos
    let effectiveMin = safeNumber(group.minSelections);
    let effectiveMax = safeNumber(group.maxSelections, 1);

    if (weight > 200) {
      effectiveMin = Math.max(effectiveMin, 2);
      effectiveMax = Math.max(effectiveMax, 2);
    }

    let finalGroupSelections = validRequested.slice(0, effectiveMax);

    if (finalGroupSelections.length < effectiveMin) {
      const missing = effectiveMin - finalGroupSelections.length;
      const existingIds = new Set(finalGroupSelections.map((x) => toStr(x.optionId)));

      const fallback: NormalizedAcc[] = group.options
        .filter((o) => !existingIds.has(toStr(o.id)))
        .slice(0, missing)
        .map((o) => ({
          groupId: group.id,
          optionId: o.id,
          name: o.name,
          extraPrice: safeNumber(o.priceModifier),
        }));

      finalGroupSelections = [...finalGroupSelections, ...fallback].slice(0, effectiveMax);
    }

    normalized.push(...finalGroupSelections);
  }

  return normalized;
}

/**
 * ✅ NORMALIZA UMA OPÇÃO DE PRATO
 */
function normalizeOption(option: AiOption, catalog: NutriCatalog) {
  const dish = findDish(catalog, option.dishId);
  if (!dish) return null;

  const size = findSize(dish, option.sizeId);
  if (!size) return null;

  const selectedAccs = normalizeSelectedAccs(size, option.selectedAccompaniments);

  const basePrice = safeNumber(size.price);
  const extrasPrice = selectedAccs.reduce((sum, acc) => sum + acc.extraPrice, 0);
  const finalPrice = basePrice + extrasPrice;

  return {
    id: option.id || `opt-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
    dishId: dish.id,
    sizeId: size.id,
    name: dish.name,
    sizeName: size.name,
    priceAtCreation: finalPrice,
    selectedAccompaniments: selectedAccs,
    availableSizes: dish.availableSizes,
    nutritionalData: {
      mainDishWeight: safeNumber(size.mainDishWeight || size.weight),
      baseMacros: {
        kcal: safeNumber(dish.energyKcal),
        protein: safeNumber(dish.proteins),
        carbs: safeNumber(dish.carbs),
        fat: safeNumber(dish.fatTotal),
      },
    },
    macros: {
      kcal: safeNumber(dish.energyKcal),
      protein: safeNumber(dish.proteins),
      carbs: safeNumber(dish.carbs),
      fat: safeNumber(dish.fatTotal),
    },
  };
}

/**
 * ✅ FUNÇÃO PRINCIPAL EXPORTADA
 */
export function normalizeAiPrescriptionResult(
  aiResult: unknown,
  catalog: NutriCatalog
) {
  const meals = Array.isArray(aiResult) ? aiResult : [];

  return (meals as Record<string, unknown>[])
    .map((meal, mealIndex) => {
      const rawGroups = Array.isArray(meal?.groups) ? (meal.groups as Record<string, unknown>[]) : [];

      const groups = rawGroups
        .map((group, groupIndex) => {
          const rawOptions = Array.isArray(group?.options) ? (group.options as AiOption[]) : [];

          const options = rawOptions
            .map((opt) => normalizeOption(opt, catalog))
            .filter((opt): opt is NonNullable<typeof opt> => opt !== null);

          if (!options.length) return null;

          return {
            id: String(group?.id || `group-${mealIndex + 1}-${groupIndex + 1}`),
            name: String(group?.name || "Escolhas da Dieta"),
            isRequired: Boolean(group?.isRequired ?? true),
            options,
          };
        })
        .filter((g): g is NonNullable<typeof g> => g !== null);

      if (!groups.length) return null;

      return {
        id: String(meal?.id || `meal-${mealIndex + 1}`),
        name: String(meal?.name || `Refeição ${mealIndex + 1}`),
        notes: String(meal?.notes || ""),
        groups,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
}
