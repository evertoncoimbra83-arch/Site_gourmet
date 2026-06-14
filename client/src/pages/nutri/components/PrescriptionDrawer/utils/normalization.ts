import { v4 as uuidv4 } from "uuid";
import { safeJsonParse, safeNumber } from "@/lib/safe-parse";
import type { FullPrescription, PrescriptionMeal, PrescriptionOption } from "../../../../../../../server/routers/storefront/nutri/types";

export interface CatalogItem {
  id: string | number;
  sizes?: unknown[];
  availableSizes?: unknown[];
  basePrice?: number | string;
  base_price?: number | string;
}

const normalizeComparable = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getCatalogSizes = (catalogItem: CatalogItem | undefined, option: Record<string, unknown>) => {
  const sizes = Array.isArray(catalogItem?.sizes)
    ? catalogItem?.sizes
    : Array.isArray(catalogItem?.availableSizes)
      ? catalogItem?.availableSizes
      : Array.isArray(option.availableSizes)
        ? option.availableSizes
        : [];

  return (sizes || []) as Record<string, unknown>[];
};

const findRealSizeForSnapshot = (
  sizes: Record<string, unknown>[],
  sizeId: number | null,
  option: Record<string, unknown>,
  nutriData: Record<string, unknown>,
) => {
  if (sizeId !== null && Number.isFinite(sizeId)) {
    const byId = sizes.find((size) => Number(size.id) === Number(sizeId));
    if (byId) return byId;
  }

  const legacyName = normalizeComparable(
    option.sizeName ?? nutriData.sizeName ?? option.size ?? option.weight,
  );
  if (!legacyName) return undefined;

  return sizes.find((size) => {
    const sizeName = normalizeComparable(size.name);
    const sizeWeight = normalizeComparable(size.weight);
    return sizeName === legacyName || sizeWeight === legacyName;
  });
};

const getSizeGroups = (size: Record<string, unknown> | undefined) => {
  const groups = Array.isArray(size?.accompanimentGroups)
    ? size?.accompanimentGroups
    : Array.isArray(size?.groups)
      ? size?.groups
      : [];

  return groups as Record<string, unknown>[];
};

const findGroupForAcc = (
  groups: Record<string, unknown>[],
  acc: Record<string, unknown>,
) => {
  const groupId = acc.groupId ?? acc.sourceGroupId;
  if (groupId !== null && groupId !== undefined) {
    const direct = groups.find((group) => String(group.id ?? group.groupId) === String(groupId));
    if (direct) return direct;
  }

  return groups.find((group) => {
    const options = Array.isArray(group.options) ? group.options : [];
    return options.some((option) => String((option as Record<string, unknown>).id) === String(acc.id));
  });
};

export function normalizePrescriptionData(
  p: unknown,
  catalog: CatalogItem[] = [],
  forceRecalculatePrices = false
): FullPrescription {
  if (!p) return { planName: "Plano Alimentar", meals: [] } as unknown as FullPrescription;

  const data = p as Record<string, unknown>;
  let rawMeals: unknown[] = [];

  if (Array.isArray(data.meals)) {
    rawMeals = data.meals;
  } else if (data.dietSnapshot) {
    rawMeals =
      typeof data.dietSnapshot === "string"
        ? safeJsonParse<unknown[]>(data.dietSnapshot, [])
        : (data.dietSnapshot as unknown[]);
  } else if (data.content) {
    rawMeals =
      typeof data.content === "string"
        ? safeJsonParse<unknown[]>(data.content, [])
        : (data.content as unknown[]);
  } else if (Array.isArray(p)) {
    rawMeals = p;
  }

  if (!Array.isArray(rawMeals)) rawMeals = [];

  const builtMeals: PrescriptionMeal[] = rawMeals.map((mItem) => {
    const m = mItem as Record<string, unknown>;
    const mealId = (m.id as string) || uuidv4();
    const mealName = (m.name as string) || (m.mealName as string) || "Refeição";

    const transformOption = (oItem: unknown): PrescriptionOption => {
      const o = oItem as Record<string, unknown>;
      const nutriData = (o.nutritionalData as Record<string, unknown>) || {};

      const macrosSource = (o.macros as Record<string, unknown>) || (nutriData.baseMacros as Record<string, unknown>) || o || {};
      const macros = {
        kcal: safeNumber(macrosSource.kcal ?? macrosSource.energyKcal),
        protein: safeNumber(macrosSource.protein ?? macrosSource.proteins),
        carbs: safeNumber(macrosSource.carbs),
        fat: safeNumber(macrosSource.fat ?? macrosSource.fatTotal),
      };

      const rawAccs = Array.isArray(o.allowedAccompaniments)
        ? o.allowedAccompaniments
        : Array.isArray(nutriData.allowedAccompaniments)
          ? nutriData.allowedAccompaniments
          : [];

      // ✅ P0 FIX: Usar defaultGrammage real do grupo/acc.
      // Removida heurística de nome ("80g"/"100g") e distribuição por índice.
      // Regra objetiva: defaultGrammage > weight salvo > fallback 100.
      let finalAccs = rawAccs.map((acc: any) => {
        if (!acc) return acc;

        // Prefere defaultGrammage explícito (salvo pelo novo builder),
        // depois weight salvo (pode ser correto se veio do catálogo),
        // nunca usa mainDishWeight como gramagem do acompanhamento.
        const calculatedWeight = Number(
          acc.defaultGrammage ??
          acc.weight ??
          100
        );
        const safeWeight = Number.isFinite(calculatedWeight) && calculatedWeight > 0
          ? calculatedWeight
          : 100;

        return {
          ...acc,
          weight: safeWeight,
          defaultGrammage: acc.defaultGrammage ?? safeWeight,
          groupName: acc.groupName ?? acc.sourceGroupName ?? null,
          groupId: acc.groupId ?? acc.sourceGroupId ?? null,
        };
      });

      const catalogItem = catalog.find((c) => String(c.id) === String(o.dishId));
      const availableSizes = getCatalogSizes(catalogItem, o);
      const rawSizeId = o.sizeId ?? nutriData.sizeId;
      const sId = rawSizeId !== undefined && rawSizeId !== null ? safeNumber(rawSizeId, Number.NaN) : null;
      const matchedSize = findRealSizeForSnapshot(availableSizes, sId, o, nutriData);

      const snapshotWeight = o.mainDishWeight !== undefined
        ? safeNumber(o.mainDishWeight, 0)
        : nutriData.mainDishWeight !== undefined
          ? safeNumber(nutriData.mainDishWeight, 0)
          : 0;

      const weight = matchedSize ? safeNumber(matchedSize.mainDishWeight ?? matchedSize.weight, snapshotWeight) : snapshotWeight;
      const hydratedSizeId = matchedSize?.id !== undefined ? safeNumber(matchedSize.id, Number.NaN) : sId;
      const sizeName = String(matchedSize?.name ?? o.sizeName ?? nutriData.sizeName ?? "") || null;
      const sizeWeight = matchedSize?.weight ?? o.sizeWeight ?? o.weight ?? nutriData.sizeWeight ?? nutriData.weight ?? null;
      const noAccompanimentsMessage = String(matchedSize?.noAccompanimentsMessage ?? o.noAccompanimentsMessage ?? nutriData.noAccompanimentsMessage ?? "") || null;
      const legacySizeMissing = Boolean(o.legacySizeMissing) || (sId !== null && !matchedSize && (availableSizes.length > 0 || Boolean(o.sizeId)));

      const groups = getSizeGroups(matchedSize);
      finalAccs = rawAccs.map((acc: any) => {
        if (!acc) return acc;

        const group = findGroupForAcc(groups, acc);
        const groupDefault = safeNumber(
          group?.defaultGrammage ?? group?.default_grammage,
          Number.NaN,
        );
        const accDefault = safeNumber(acc.defaultGrammage, Number.NaN);
        const accWeight = safeNumber(acc.weight, Number.NaN);
        const mainDishWeight = safeNumber(weight, Number.NaN);
        const optionSizeWeight = safeNumber(sizeWeight, Number.NaN);
        const weightLooksLikeDish =
          Number.isFinite(accWeight) &&
          ((Number.isFinite(mainDishWeight) && accWeight === mainDishWeight) ||
            (Number.isFinite(optionSizeWeight) && accWeight === optionSizeWeight));

        const calculatedWeight =
          (Number.isFinite(accDefault) && accDefault > 0 ? accDefault : null) ??
          (!weightLooksLikeDish && Number.isFinite(accWeight) && accWeight > 0 ? accWeight : null) ??
          (Number.isFinite(groupDefault) && groupDefault > 0 ? groupDefault : null) ??
          100;

        return {
          ...acc,
          weight: calculatedWeight,
          defaultGrammage:
            (Number.isFinite(accDefault) && accDefault > 0 ? accDefault : null) ??
            (Number.isFinite(groupDefault) && groupDefault > 0 ? groupDefault : null) ??
            calculatedWeight,
          groupName: acc.groupName ?? acc.sourceGroupName ?? group?.name ?? group?.groupName ?? null,
          groupId: acc.groupId ?? acc.sourceGroupId ?? group?.id ?? group?.groupId ?? null,
        };
      });

      const priceAtCreation = safeNumber(o.priceAtCreation ?? o.fixedPrice ?? o.price);
      let basePrice = catalogItem ? safeNumber(catalogItem.basePrice ?? catalogItem.base_price) : priceAtCreation;

      let finalPrice = priceAtCreation;
      if (forceRecalculatePrices && catalogItem) {
        const matchedSize = (availableSizes as any[]).find((s) => Number(s.id) === Number(sId));
        const catalogBasePrice = safeNumber(catalogItem.basePrice ?? catalogItem.base_price);
        if (matchedSize) {
          const sizePrice = safeNumber(matchedSize.price);
          const modifier = safeNumber(matchedSize.price_modifier ?? matchedSize.priceModifier, 1);
          finalPrice = sizePrice > 0 ? sizePrice : catalogBasePrice * (modifier === 0 ? 1 : modifier);
        } else {
          finalPrice = catalogBasePrice;
        }
      }

      const rawMultiplier = safeNumber(o.multiplier, 1);
      const safeMultiplier = rawMultiplier > 5 ? 1 : rawMultiplier;

      return {
        ...o,
        id: (o.id as string) || uuidv4(),
        dishId: o.dishId,
        name: o.name,
        sizeId: hydratedSizeId,
        sizeName,
        weight: sizeWeight,
        sizeWeight,
        mainDishWeight: weight,
        noAccompanimentsMessage,
        legacySizeMissing,
        multiplier: String(safeMultiplier),
        basePrice: basePrice,
        priceAtCreation: finalPrice,
        price: finalPrice,
        isDefault: o.isDefault === true || String(o.isDefault) === "true",
        macros: macros,
        availableSizes: availableSizes,
        allowedAccompaniments: finalAccs,
        nutritionalData: {
          ...nutriData,
          sizeId: hydratedSizeId,
          sizeName,
          weight: sizeWeight,
          sizeWeight,
          mainDishWeight: weight,
          noAccompanimentsMessage,
          baseMacros: macros,
          allowedAccompaniments: finalAccs
        }
      } as unknown as PrescriptionOption;
    };

    let finalGroups: PrescriptionMeal['groups'] = [];

    if (m.groups && Array.isArray(m.groups)) {
      finalGroups = m.groups.map((gItem) => {
        const g = gItem as Record<string, unknown>;
        return {
          id: (g.id as string) || uuidv4(),
          name: (g.name as string) || "Opções da Semana",
          minSelections: Number(g.minSelections || 1),
          maxSelections: Number(g.maxSelections || 7),
          isRequired: g.isRequired !== false,
          options: (Array.isArray(g.options) ? g.options : []).map(transformOption)
        };
      });
    } else if (Array.isArray(m.dishes)) {
      const groupsMap = new Map<string, PrescriptionMeal['groups'][number]>();
      m.dishes.forEach((dishItem) => {
        const dish = dishItem as Record<string, unknown>;
        const gName = (dish.groupName as string) || "Opções da Semana";
        if (!groupsMap.has(gName)) {
          groupsMap.set(gName, { id: uuidv4(), name: gName, minSelections: 1, maxSelections: 7, isRequired: true, options: [] });
        }
        groupsMap.get(gName)!.options.push(transformOption(dish));
      });
      finalGroups = Array.from(groupsMap.values());
    }

    return {
      id: mealId,
      name: mealName,
      notes: (m.notes as string) || "",
      groups: finalGroups
    };
  });

  return {
    id: data.id as string,
    planName: (data.planName as string) || (data.name as string) || "Plano Alimentar",
    totalKcalTarget: (data.totalKcalTarget as number) || 0,
    technicalInsight: (data.technicalInsight as string) || "",
    meals: builtMeals
  } as unknown as FullPrescription;
}
