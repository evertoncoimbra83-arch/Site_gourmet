import { eq, inArray, asc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { packages } from "../drizzle/schema/packages"; 
import { dishes, accompanimentGroups, accompanimentOptions, dishSizes } from "../drizzle/schema/index"; 
import { safeInteger, safeJsonParse, safeNumber } from "./lib/safe-parse";

const toNum = (val: unknown): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'string') {
    return safeNumber(val.replace(",", "."));
  }
  return typeof val === 'number' ? val : 0;
};

interface PackageSlotGroupConfig {
  id: string | number;
  customLabel?: string;
  optionIds?: (string | number)[];
}

interface PackageSlotConfig {
  name?: string;
  dishIds?: (string | number)[];
  groups?: PackageSlotGroupConfig[];
}

interface PackageConfig {
  slots: PackageSlotConfig[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatOption(opt: any, grammage: number, priceModifier?: unknown): Record<string, unknown> {
  return {
    id: safeInteger(opt.id),
    name: opt.name,
    ingredients: opt.ingredients || "",
    priceModifier: toNum(priceModifier || opt.priceModifier || 0),
    defaultGrammage: grammage,
    nutritional_info: {
      kcal: toNum(opt.kcal),
      proteins: toNum(opt.proteins),
      carbs: toNum(opt.carbs),
      fats: toNum(opt.fats),
      sodium: toNum(opt.sodium),
      fiber: toNum(opt.fiber)
    },
  };
}

export async function getPackageById(idInput: string | number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados não disponível");

  const id = String(idInput);

  try {
    const results = await db
      .select({
        package: {
          id: packages.id,
          name: packages.name,
          price: packages.price,
          salePrice: packages.salePrice,
          imageUrl: packages.imageUrl,
          config: packages.config,
          sizeId: packages.sizeId,
        },
        size: {
          id: dishSizes.id,
          name: dishSizes.name,
          weight: sql<number>`main_dish_weight`,
          proteinWeight: sql<number>`main_dish_weight`,
        }
      })
      .from(packages)
      .leftJoin(dishSizes, eq(packages.sizeId, dishSizes.id))
      .where(eq(packages.id, id))
      .limit(1);

    const row = results[0];
    if (!row || !row.package) return null;

    const { package: pkg, size } = row;

    let config: PackageConfig = { slots: [] };
    config = safeJsonParse<PackageConfig>(pkg.config, { slots: [] });

    const slots = Array.isArray(config?.slots) ? config.slots : [];

    // ─── 1. COLLECT DISH IDs ─────────────────────────────────────────────────
    const allDishIds: number[] = [];
    slots.forEach((slot) => {
      (slot.dishIds || []).forEach((dishId) => {
        const n = safeInteger(dishId, Number.NaN);
        if (Number.isFinite(n) && n > 0) allDishIds.push(n);
      });
    });
    const uniqueDishIds = [...new Set(allDishIds)];

    // ─── 2. FETCH DISHES ─────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allFetchedDishes: any[] = [];
    if (uniqueDishIds.length > 0) {
      allFetchedDishes = await db.select({
        id: dishes.id,
        name: dishes.name,
        price: dishes.basePrice,
        ingredients: sql<string>`dishes.ingredients`,
        kcal: sql<number>`COALESCE(energy_kcal, 0)`,
        proteins: sql<number>`COALESCE(proteins, 0)`,
        carbs: sql<number>`COALESCE(carbs, 0)`,
        fats: sql<number>`COALESCE(fat_total, 0)`,
        sodium: sql<number>`COALESCE(sodium, 0)`,
        fiber: sql<number>`COALESCE(fiber, 0)`
      }).from(dishes).where(inArray(dishes.id, uniqueDishIds));
    }

    // ─── 3. DETERMINE GROUP TYPES ────────────────────────────────────────────
    // Manual groups → numeric IDs that exist in DB
    // Smart Generator groups → UUID IDs with optionIds[]
    const hasAnyGroups = slots.some(s => Array.isArray(s.groups) && s.groups.length > 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allFetchedGroups: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allFetchedOptions: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allowedAccompaniments: any[] = [];

    if (hasAnyGroups) {
      // Fetch all DB groups and all active options once
      const groupsRaw = await db.select({
        id: accompanimentGroups.id,
        name: accompanimentGroups.name,
        minSelections: accompanimentGroups.minSelections,
        maxSelections: accompanimentGroups.maxSelections,
        defaultGrammage: sql<number>`COALESCE(default_grammage, 100)`,
        itemsOrder: accompanimentGroups.itemsOrder
      }).from(accompanimentGroups);

      allFetchedOptions = await db.select({
        id: accompanimentOptions.id,
        name: accompanimentOptions.name,
        ingredients: sql<string>`accompaniment_options.ingredients`,
        groupsConfig: sql`groups_config`,
        accompanimentCategoryId: accompanimentOptions.accompanimentCategoryId,
        priceModifier: sql`price_modifier`,
        kcal: sql<number>`COALESCE(energy_kcal, 0)`,
        proteins: sql<number>`COALESCE(proteins, 0)`,
        carbs: sql<number>`COALESCE(carbs, 0)`,
        fats: sql<number>`COALESCE(fat_total, 0)`,
        sodium: sql<number>`COALESCE(sodium, 0)`,
        fiber: sql<number>`COALESCE(fiber, 0)`
      }).from(accompanimentOptions).where(eq(accompanimentOptions.isActive, true));

      // Build DB groups with their options
      allFetchedGroups = groupsRaw.map(group => {
        let itemsFromOrder: { id?: number; group_id?: number; price_modifier?: string | number }[] = [];
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          itemsFromOrder = safeJsonParse(group.itemsOrder, []);
        } catch { itemsFromOrder = []; }

        const grammage = toNum(group.defaultGrammage);

        const groupOptions = itemsFromOrder.length > 0
          ? itemsFromOrder.map(conf => {
              const opt = allFetchedOptions.find((o: { id: unknown }) => safeInteger(o.id) === safeInteger(conf.id || conf.group_id));
              if (!opt) return null;
              const formatted = formatOption(opt, grammage, conf.price_modifier);
              allowedAccompaniments.push(formatted);
              return formatted;
            }).filter(Boolean)
          : allFetchedOptions.map((opt: { groupsConfig: unknown; accompanimentCategoryId: unknown; priceModifier: unknown }) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const configs = safeJsonParse<unknown[]>(opt.groupsConfig, []);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const link = Array.isArray(configs)
                ? configs.find((c: any) => safeInteger(c.group_id) === safeInteger(group.id)) as
                    | { price_modifier?: string | number }
                    | undefined
                : undefined;
              if (!link) return null;
              const formatted = formatOption(opt, grammage, link.price_modifier);
              allowedAccompaniments.push(formatted);
              return formatted;
            }).filter(Boolean);

        return {
          id: safeInteger(group.id),
          name: group.name,
          minSelections: safeInteger(group.minSelections),
          maxSelections: safeInteger(group.maxSelections, 1),
          defaultGrammage: grammage,
          options: groupOptions
        };
      });
    }

    // ─── 4. BUILD MAP: optionId → DB groupId ─────────────────────────────────
    const optionToGroupId = new Map<number, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allFetchedGroups.forEach((group: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (group.options || []).forEach((opt: any) => {
        const optId = safeInteger(opt.id, Number.NaN);
        const gId = safeInteger(group.id, Number.NaN);
        if (Number.isFinite(optId) && Number.isFinite(gId) && !optionToGroupId.has(optId)) {
          optionToGroupId.set(optId, gId);
        }
      });
    });

    // ─── 5. FORMAT SLOTS ─────────────────────────────────────────────────────
    const formattedOptions = slots.map((slot, index) => {
      const slotDishIds = (slot.dishIds || [])
        .map((dishId) => safeInteger(dishId, Number.NaN))
        .filter(Number.isFinite);
      const slotGroups = slot.groups || [];

      const accompanimentGroupsForSlot = slotGroups.map((groupConfig) => {
        const rawId = String(groupConfig.id);
        const numericId = safeInteger(groupConfig.id, Number.NaN);
        const hasOptionIds = Array.isArray(groupConfig.optionIds) && groupConfig.optionIds.length > 0;

        // ── Case A: Manual package — numeric DB group ID ──────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbGroup = allFetchedGroups.find((g: any) => safeInteger(g.id) === numericId);
        if (Number.isFinite(numericId) && dbGroup) {
          return {
            ...dbGroup,
            // Preserve user's custom label if set
            name: groupConfig.customLabel || dbGroup.name,
          };
        }

        // ── Case B: Smart Generator — UUID with optionIds (MASTER KEY) ────
        // Build a virtual group directly from the selected option IDs
        if (hasOptionIds) {
          const selectedOptionIds = groupConfig.optionIds!
            .map((optId) => safeInteger(optId, Number.NaN))
            .filter(Number.isFinite);
          const options = selectedOptionIds
            .map(optId => allFetchedOptions.find((o: { id: unknown }) => safeInteger(o.id) === optId))
            .filter(Boolean)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((opt: any) => {
              // Try to find the grammage from the DB group this option belongs to
              const parentGroupId = optionToGroupId.get(safeInteger(opt.id));
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const parentGroup = parentGroupId ? allFetchedGroups.find((g: any) => safeInteger(g.id) === parentGroupId) : null;
              const grammage = toNum(parentGroup?.defaultGrammage || 100);
              const formatted = formatOption(opt, grammage);
              // Add to allowedAccompaniments if not already there
              if (!allowedAccompaniments.some(a => safeInteger(a.id) === safeInteger(opt.id))) {
                allowedAccompaniments.push(formatted);
              }
              return formatted;
            });

          return {
            // Use the UUID as ID so the client can match it back
            id: rawId,
            name: groupConfig.customLabel || "Acompanhamento",
            minSelections: 0,
            maxSelections: 1,
            defaultGrammage: 100,
            options,
          };
        }

        // ── Case C: Fallback — try to resolve via optionToGroupId ─────────
        const resolvedGroupId = optionToGroupId.get(numericId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallbackGroup = resolvedGroupId ? allFetchedGroups.find((g: any) => safeInteger(g.id) === resolvedGroupId) : null;
        if (fallbackGroup) {
          return { ...fallbackGroup, name: groupConfig.customLabel || fallbackGroup.name };
        }

        return null;
      }).filter(Boolean);

      return {
        mealIndex: index,
        label: slot.name || `Refeição ${index + 1}`,
        dishes: allFetchedDishes
          .filter(d => slotDishIds.includes(safeInteger(d.id)))
          .map(d => ({
            id: safeInteger(d.id),
            name: d.name,
            price: toNum(d.price),
            nutritional_info: {
              kcal: toNum(d.kcal),
              proteins: toNum(d.proteins),
              carbs: toNum(d.carbs),
              fats: toNum(d.fats),
              sodium: toNum(d.sodium),
              fiber: toNum(d.fiber)
            }
          })),
        accompanimentGroups: accompanimentGroupsForSlot,
      };
    });

    const uniqueAllowedAccs = allowedAccompaniments.filter((v, i, a) =>
      a.findIndex(t => safeInteger(t.id) === safeInteger(v.id)) === i
    );

    return {
      id: String(pkg.id),
      name: pkg.name,
      price: toNum(pkg.price),
      salePrice: toNum(pkg.salePrice),
      imageUrl: pkg.imageUrl,
      allowedAccompaniments: uniqueAllowedAccs,
      size: size ? { ...size, weight: toNum(size.weight), proteinWeight: toNum(size.proteinWeight) } : null,
      options: formattedOptions
    };

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Erro ao processar pacote: ${msg}`);
  }
}

export async function getAllPackages() {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db
      .select({
        package: {
          id: packages.id,
          name: packages.name,
          price: packages.price,
          salePrice: packages.salePrice,
          imageUrl: packages.imageUrl,
          isActive: packages.isActive,
          numberOfOptions: packages.numberOfOptions,
        },
        sizeName: dishSizes.name
      })
      .from(packages)
      .leftJoin(dishSizes, eq(packages.sizeId, dishSizes.id))
      .where(eq(packages.isActive, true))
      .orderBy(asc(packages.name));

    return (result || []).map(r => ({
      ...r.package,
      id: String(r.package.id),
      price: toNum(r.package.price),
      salePrice: toNum(r.package.salePrice),
      sizeName: r.sizeName || "Padrão"
    }));
  } catch {
    return [];
  }
}

export async function updatePackageConfig(packageId: string | number, configData: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const finalConfig = typeof configData === 'object' ? JSON.stringify(configData) : String(configData);

  await db.update(packages)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set({ config: finalConfig as any, updatedAt: new Date() })
    .where(eq(packages.id, String(packageId)));

  return { success: true };
}
