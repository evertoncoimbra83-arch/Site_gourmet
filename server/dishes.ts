import { eq, and, asc } from "drizzle-orm";
import { getDb } from "./db";
import { getAccsWithNutrition } from "./accompaniments";

import {
  dishes,
  dishSizes,
  sizeAccompanimentGroups,
  accompanimentGroups,
  dishesToSizes
} from "../drizzle/schema/catalog";

/**
 * Busca detalhes completos de um prato, incluindo tamanhos, acompanhamentos e macros.
 */
export async function getDishDetails(dishId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // 1. BUSCA O PRATO
    const dishRows = await db
      .select({
        id: dishes.id,
        name: dishes.name,
        slug: dishes.slug,
        description: dishes.description,
        imageUrl: dishes.imageUrl,
        price: dishes.basePrice,
        salePrice: dishes.salePrice,
        categoryId: dishes.categoryId,
        isActive: dishes.isActive,
        show_nutrition: dishes.showNutrition,
        ingredients: dishes.ingredients,
        energyKcal: dishes.energyKcal,
        energyKj: dishes.energyKj,
        proteins: dishes.proteins,
        carbs: dishes.carbs,
        fatTotal: dishes.fatTotal,
        sodium: dishes.sodium,
        fiber: dishes.fiber,
        calcium: dishes.calcium,
        iron: dishes.iron
      })
      .from(dishes)
      .where(eq(dishes.id, dishId))
      .limit(1);

    if (!dishRows || dishRows.length === 0) {
      return null;
    }

    const rawDish = dishRows[0];

    // 2. BUSCA TAMANHOS (Sizes)
    const sizes = await db
      .select({
        id: dishSizes.id,
        name: dishSizes.name,
        price: dishSizes.price,
        priceModifier: dishSizes.priceModifier,
        mainDishWeight: dishSizes.mainDishWeight,
        noAccompanimentsMessage: dishSizes.noAccompanimentsMessage,
        isActive: dishSizes.isActive,
        displayOrder: dishSizes.displayOrder
      })
      .from(dishSizes)
      .innerJoin(dishesToSizes, eq(dishSizes.id, dishesToSizes.sizeId))
      .where(and(eq(dishesToSizes.dishId, dishId), eq(dishSizes.isActive, true)))
      .orderBy(asc(dishSizes.displayOrder));

    // 3. BUSCA MACROS DOS ACOMPANHAMENTOS
    const allOptions = (await getAccsWithNutrition()) || [];

    // 4. PROCESSA GRUPOS E OPÇÕES PARA CADA TAMANHO
    const sizesWithGroups = await Promise.all(
      (sizes || []).map(async (size) => {
        const rawGroups = await db
          .select({
            pivot: sizeAccompanimentGroups,
            group: accompanimentGroups
          })
          .from(sizeAccompanimentGroups)
          .innerJoin(accompanimentGroups, eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id))
          .where(and(
            eq(sizeAccompanimentGroups.sizeId, size.id),
            eq(accompanimentGroups.isActive, true)
          ));

        const groupsWithOptions = (rawGroups || []).map((row) => {
          const { group, pivot } = row;
          if (!group || !pivot) return null;

          let itemsConfig: unknown[] = [];
          try {
            itemsConfig = typeof group.itemsOrder === 'string'
              ? JSON.parse(group.itemsOrder)
              : (group.itemsOrder || []);
          } catch { itemsConfig = []; }

          const relevantOptions = (Array.isArray(itemsConfig) ? itemsConfig : []).map((config: unknown) => {
            const c = config as Record<string, unknown>;
            const optId = c?.optionId || c?.id || c?.group_id || c;
            const masterOpt = allOptions.find(opt => Number(opt.id) === Number(optId));

            if (!masterOpt) return null;

            return {
              ...masterOpt,
              id: Number(masterOpt.id),
              priceModifier: Number((c?.priceModifier || c?.price_modifier || masterOpt.priceModifier || 0) as number),
              energyKcal: Number(masterOpt.energyKcal || 0),
              proteins: Number(masterOpt.proteins || 0),
              carbs: Number(masterOpt.carbs || 0),
              fatTotal: Number(masterOpt.fatTotal || 0),
              sodium: Number(masterOpt.sodium || 0),
              fiber: Number(masterOpt.fiber || 0),
              calcium: Number(masterOpt.calcium || 0),
              iron: Number(masterOpt.iron || 0)
            };
          }).filter(Boolean);

          return {
            id: pivot.id,
            groupId: group.id,
            name: group.name,
            defaultGrammage: Number(group.defaultGrammage || 100),
            minSelections: Number(pivot.minSelections ?? group.minSelections ?? 0),
            maxSelections: Number(pivot.maxSelections ?? group.maxSelections ?? 1),
            options: relevantOptions
          };
        }).filter(Boolean);

        return {
          ...size,
          id: Number(size.id),
          price: Number(size.price || 0),
          priceModifier: Number(size.priceModifier || 0),
          mainDishWeight: Number(size.mainDishWeight || 200),
          accompanimentGroups: groupsWithOptions
        };
      })
    );

    // 5. NORMALIZAÇÃO FINAL
    const finalNutrition = {
      kcal: Math.round(Number(rawDish.energyKcal || 0)),
      kj: Math.round(Number(rawDish.energyKj || (Number(rawDish.energyKcal) * 4.184) || 0)),
      proteins: Number(rawDish.proteins || 0),
      carbs: Number(rawDish.carbs || 0),
      fats: Number(rawDish.fatTotal || 0),
      sodium: Number(rawDish.sodium || 0),
      fiber: Number(rawDish.fiber || 0),
      calcium: Number(rawDish.calcium || 0),
      iron: Number(rawDish.iron || 0)
    };

    return {
      ...rawDish,
      id: Number(rawDish.id),
      slug: rawDish.slug || String(rawDish.id),
      categoryId: rawDish.categoryId ? Number(rawDish.categoryId) : null,
      price: Number(rawDish.price || 0),
      salePrice: rawDish.salePrice ? Number(rawDish.salePrice) : null,
      showNutrition: !!rawDish.show_nutrition,
      ingredients: rawDish.ingredients || "",

      energyKcal: Number(rawDish.energyKcal || 0),
      proteins: Number(rawDish.proteins || 0),
      carbs: Number(rawDish.carbs || 0),
      fatTotal: Number(rawDish.fatTotal || 0),
      sodium: Number(rawDish.sodium || 0),
      fiber: Number(rawDish.fiber || 0),
      calcium: Number(rawDish.calcium || 0),
      iron: Number(rawDish.iron || 0),

      nutritional_info: finalNutrition,
      sizes: sizesWithGroups
    };

  } catch {
    throw new Error(`Falha ao carregar o prato.`);
  }
}