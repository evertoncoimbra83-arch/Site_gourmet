import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../../_core/trpc.js";
import * as AdminDishes from "../../admin-dishes.js"; 
import { logAction } from "../../db/lib/audit.js"; 
import { getDb } from "../../db.js";
import { 
  accompanimentGroups, 
  accompanimentOptions, 
  sizeAccompanimentGroups,
  dishSizes,
  accompanimentCategories 
} from "../../../drizzle/schema/catalog.js";
import { eq, and, asc, sql, inArray } from "drizzle-orm";

/**
 * 🥗 Helper: Normalização de Informação Nutricional
 */
const normalizeNutritionalInfo = (dish: any) => {
  if (!dish) return dish;
  return { 
    ...dish, 
    energyKcal: Number(dish.energyKcal || 0),
    proteins: Number(dish.proteins || 0),
    carbs: Number(dish.carbs || 0),
    fatTotal: Number(dish.fatTotal || 0),
    nutritionalInfo: {
      kcal: Number(dish.energyKcal || 0),
      proteins: Number(dish.proteins || 0),
      carbs: Number(dish.carbs || 0),
      fats: Number(dish.fatTotal || 0)
    }
  };
};

export const productsRouter = router({
  // 1. Procedure de Listagem (Vitrines)
  list: publicProcedure
    .input(z.object({ 
      page: z.number().default(1), 
      perPage: z.number().default(12), 
      search: z.string().nullish(), 
      category: z.union([z.number(), z.string()]).nullish() 
    }))
    .query(async ({ input }) => {
      const result = await AdminDishes.getPaginatedDishes({ 
        page: input.page, 
        limit: input.perPage, 
        search: input.search ?? undefined, 
        categoryId: input.category ? Number(input.category) : undefined, 
        isActive: true 
      });
      return { ...result, data: result.data.map(normalizeNutritionalInfo) };
    }),

  // 2. Procedure de Categorias (Filtros)
  categories: publicProcedure.query(async () => {
    try {
      return await AdminDishes.getLocalCategories() || [];
    } catch (error) {
      return [];
    }
  }),

  // 3. Procedure de Detalhes (Drawer)
  getById: publicProcedure
    .input(z.object({ 
      id: z.union([z.string(), z.number()]).transform((v) => Number(v))
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        const dish: any = await AdminDishes.getDishById(input.id);
        
        if (!dish) {
          throw new TRPCError({ code: 'NOT_FOUND', message: "Prato não encontrado" });
        }

        // ✅ REVISADO: Agora selecionamos iconKey, weight e description explicitamente
        const sizesData = await db
          .select({
            id: dishSizes.id,
            name: dishSizes.name,
            weight: dishSizes.weight,
            description: dishSizes.description,
            iconKey: dishSizes.iconKey,
            priceModifier: dishSizes.priceModifier,
            displayOrder: dishSizes.displayOrder,
          })
          .from(dishSizes)
          .where(eq(dishSizes.isActive, true))
          .orderBy(asc(dishSizes.displayOrder));

        const allowAcc = dish.allowAccompaniments || dish.category?.allowAccompaniments;
        const sizeIds = sizesData.map(s => s.id);

        let accompanimentStructure: any[] = [];

        if (allowAcc && sizeIds.length > 0) {
          const groupLinks = await db
            .select({
              sizeId: sizeAccompanimentGroups.sizeId,
              isRequired: sizeAccompanimentGroups.isRequired,
              group: {
                id: accompanimentGroups.id,
                name: accompanimentGroups.name,
                slug: accompanimentGroups.slug,
                maxSelections: accompanimentGroups.maxSelections,
              }
            })
            .from(sizeAccompanimentGroups)
            .innerJoin(
              accompanimentGroups, 
              eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id)
            )
            .where(and(
              inArray(sizeAccompanimentGroups.sizeId, sizeIds),
              eq(accompanimentGroups.isActive, true)
            ));

          accompanimentStructure = await Promise.all(groupLinks.map(async (link) => {
            const options = await db
              .select({
                id: accompanimentOptions.id,
                name: accompanimentOptions.name,
                groupsConfig: accompanimentOptions.groupsConfig,
                showNutrition: accompanimentOptions.showNutrition,
                energyKcal: accompanimentOptions.energyKcal,
                carbs: accompanimentOptions.carbs,
                proteins: accompanimentOptions.proteins,
                fatTotal: accompanimentOptions.fatTotal,
                category: {
                  name: accompanimentCategories.name,
                  iconKey: accompanimentCategories.iconKey,
                  color: accompanimentCategories.color,
                }
              })
              .from(accompanimentOptions)
              .leftJoin(
                accompanimentCategories,
                eq(accompanimentOptions.accompanimentCategoryId, accompanimentCategories.id)
              )
              .where(and(
                eq(accompanimentOptions.isActive, true),
                sql`JSON_CONTAINS(${accompanimentOptions.groupsConfig}, JSON_OBJECT('group_id', ${link.group.id}))`
              ))
              .orderBy(asc(accompanimentOptions.displayOrder));

            return {
              ...link,
              options: options.map(opt => {
                let configs: any[] = [];
                try {
                  configs = typeof opt.groupsConfig === 'string' 
                    ? JSON.parse(opt.groupsConfig) 
                    : (opt.groupsConfig || []);
                } catch (e) { configs = []; }

                const specific = configs.find((c: any) => Number(c.group_id) === Number(link.group.id));
                
                return {
                  ...opt,
                  nutritionalInfo: {
                    kcal: Number(opt.energyKcal || 0),
                    carbs: Number(opt.carbs || 0),
                    proteins: Number(opt.proteins || 0),
                    fats: Number(opt.fatTotal || 0)
                  },
                  priceModifier: specific?.price_modifier || "0.00"
                };
              })
            };
          }));
        }

        const finalSizes = sizesData.map(size => ({
          ...size,
          id: Number(size.id),
          priceModifier: Number(size.priceModifier || 0),
          // ✅ Repassando as novas informações para o Front
          iconKey: size.iconKey || "Cube",
          weight: size.weight || "",
          description: size.description || "",
          accompanimentGroups: accompanimentStructure
            .filter(acc => Number(acc.sizeId) === Number(size.id))
            .map(acc => ({
              ...acc.group,
              isRequired: Boolean(acc.isRequired),
              options: acc.options
            }))
        }));

        logAction(ctx, "VIEW_PRODUCT", "products", { entityId: input.id, new: { nome: dish.name } }).catch(() => {});

        return {
          ...normalizeNutritionalInfo(dish),
          sizes: finalSizes
        };

      } catch (error: any) {
        console.error("❌ Erro detalhado no getById Público:", error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: "Falha ao processar os detalhes do produto" 
        });
      }
    }),
});