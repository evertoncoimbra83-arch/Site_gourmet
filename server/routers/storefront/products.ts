import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { eq, and, asc, like } from "drizzle-orm";
import * as schema from "../../../drizzle/schema/index.js";
import { safeInteger, safeNumber } from "../../lib/safe-parse.js";

// --- TIPAGENS ---
type DishSchema = typeof schema.dishes.$inferSelect;

/**
 * ✅ Normalização Manual Blindada
 * Substituído 'any' por tipos inferidos do Schema para satisfazer o ESLint.
 */
const normalizeDish = (dish: DishSchema | Record<string, unknown> | null) => {
  if (!dish) return null;

  const toNum = (val: unknown) => {
    return safeNumber(val);
  };

  // ✅ CORREÇÃO: Usamos Record<string, unknown> para acessar propriedades flexíveis
  // sem disparar o erro de 'any' do ESLint.
  const d = dish as Record<string, unknown>;
  
  const rawCatId = d.categoryId ?? d.category_id ?? d.categoryIdRaw;
  const showNutrition = Boolean(d.showNutrition ?? d.show_nutrition ?? d.show_nutritional_info);

  return {
    id: safeInteger(d.id),
    name: (d.name as string) || "Sem nome",
    slug: (d.slug as string) || String(d.id), 
    description: (d.description as string) || "",
    imageUrl: (d.imageUrl as string) || (d.image_url as string) || null,
    price: toNum(d.basePrice || d.base_price || d.price || 0),
    salePrice: (d.salePrice || d.sale_price) ? toNum(d.salePrice || d.sale_price) : null,
    categoryId: rawCatId ? safeInteger(rawCatId) : null,
    isActive: !!(d.isActive ?? d.is_active),
    displayOrder: toNum(d.displayOrder ?? d.display_order ?? 0),
    showNutrition,

    energyKcal: toNum(d.energyKcal ?? d.energy_kcal ?? 0),
    energyKj: toNum(d.energyKj ?? d.energy_kj ?? 0),
    proteins: toNum(d.proteins ?? 0),
    carbs: toNum(d.carbs ?? 0),
    fatTotal: toNum(d.fatTotal ?? d.fat_total ?? 0),
    fatSaturated: toNum(d.fatSaturated ?? d.fat_saturated ?? 0),
    fatTrans: toNum(d.fatTrans ?? d.fat_trans ?? 0),
    fiber: toNum(d.fiber ?? 0),
    sodium: toNum(d.sodium ?? 0),
    calcium: toNum(d.calcium ?? 0),
    iron: toNum(d.iron ?? 0),
    ingredients: (d.ingredients as string) || "",

    nutrition: {
      kcal: Math.round(toNum(d.energyKcal ?? d.energy_kcal ?? 0)),
      proteins: toNum(d.proteins ?? 0),
      carbs: toNum(d.carbs ?? 0),
      fats: toNum(d.fatTotal ?? d.fat_total ?? 0),
      fiber: toNum(d.fiber ?? 0),
      sodium: toNum(d.sodium ?? 0),
    },
  };
};

export const productsRouter = router({
  /**
   * 1. LISTAGEM DE PRODUTOS (Vitrine)
   */
  list: publicProcedure
    // ✅ CORREÇÃO: Input envolvido em um .optional()
    .input(z.object({
        page: z.number().default(1),
        perPage: z.number().default(100),
        search: z.string().nullish(),
        category: z.union([z.number(), z.string()]).nullish(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      
      // ✅ Proteção caso o input seja undefined
      const page = input?.page || 1;
      const perPage = input?.perPage || 100;
      const search = input?.search;
      const category = input?.category;

      const offset = (page - 1) * perPage;
      const conditions = [eq(schema.dishes.isActive, true)];

      if (search) {
        conditions.push(like(schema.dishes.name, `%${search}%`));
      }
      
      if (category && category !== "all") {
        const catId = safeInteger(category, Number.NaN);
        if (Number.isFinite(catId)) conditions.push(eq(schema.dishes.categoryId, catId));
      }

      const rows = await db
        .select({
          dish: schema.dishes,
          categoryName: schema.categories.name
        })
        .from(schema.dishes)
        .leftJoin(schema.categories, eq(schema.dishes.categoryId, schema.categories.id))
        .where(and(...conditions))
        .limit(perPage)
        .offset(offset)
        .orderBy(asc(schema.dishes.displayOrder));

      return rows.map((row) => {
        const normalized = normalizeDish(row.dish);
        return normalized ? { ...normalized, categoryName: row.categoryName } : null;
      }).filter((item): item is NonNullable<typeof item> => item !== null);
    }),

  /**
   * 2. DETALHE DO PRODUTO (Busca por ID)
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      const [row] = await db
        .select()
        .from(schema.dishes)
        .where(and(eq(schema.dishes.id, input.id), eq(schema.dishes.isActive, true)))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado." });

      const normalizedDish = normalizeDish(row);

      const sizesData = await db
        .select({ 
          id: schema.dishSizes.id,
          name: schema.dishSizes.name,
          priceModifier: schema.dishSizes.priceModifier,
          mainDishWeight: schema.dishSizes.mainDishWeight
        })
        .from(schema.dishSizes)
        .innerJoin(schema.dishesToSizes, eq(schema.dishSizes.id, schema.dishesToSizes.sizeId))
        .where(eq(schema.dishesToSizes.dishId, input.id));

      const sizesWithDetails = await Promise.all(sizesData.map(async (size) => {
        const groups = await db
          .select({
            id: schema.accompanimentGroups.id,
            name: schema.accompanimentGroups.name,
            minSelections: schema.sizeAccompanimentGroups.minSelections,
            maxSelections: schema.sizeAccompanimentGroups.maxSelections,
          })
          .from(schema.sizeAccompanimentGroups)
          .innerJoin(schema.accompanimentGroups, eq(schema.sizeAccompanimentGroups.accompanimentGroupId, schema.accompanimentGroups.id))
          .where(and(
            eq(schema.sizeAccompanimentGroups.sizeId, size.id), 
            eq(schema.accompanimentGroups.isActive, true)
          ));

        const groupsWithExtras = await Promise.all(groups.map(async (group) => {
          const options = await db
            .select({
              id: schema.accompanimentOptions.id,
              name: schema.accompanimentOptions.name,
              priceModifier: schema.accompanimentOptions.priceModifier,
              energyKcal: schema.accompanimentOptions.energyKcal,
              proteins: schema.accompanimentOptions.proteins,
              carbs: schema.accompanimentOptions.carbs,
              fatTotal: schema.accompanimentOptions.fatTotal,
            })
            .from(schema.accompanimentOptions)
            .innerJoin(schema.groupToOptions, eq(schema.accompanimentOptions.id, schema.groupToOptions.optionId))
            .where(eq(schema.groupToOptions.groupId, group.id));

          return {
            ...group,
            options: options.map(opt => ({
              ...opt,
              priceModifier: safeNumber(opt.priceModifier)
            }))
          };
        }));

        return { 
          ...size, 
          priceModifier: safeNumber(size.priceModifier), 
          accompanimentGroups: groupsWithExtras 
        };
      }));

      return {
        ...normalizedDish,
        sizes: sizesWithDetails
      };
    }),
});
