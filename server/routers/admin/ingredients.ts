import { adminProcedure, router } from "../../_core/trpc.js"; 
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db.js"; 
import { ingredients, nutritionFacts, dishComposition } from "../../../drizzle/schema/index.js"; 
import { eq, and, asc, like, sql } from "drizzle-orm";

// --- TIPAGEM E INTERFACES ---

type IngredientInsert = typeof ingredients.$inferInsert;
type NutritionInsert = typeof nutritionFacts.$inferInsert;

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  image_thumb_url?: string | null;
  nutriments?: {
    'energy-kcal_100g'?: number | string;
    'energy-kj_100g'?: number | string;
    proteins_100g?: number | string;
    carbohydrates_100g?: number | string;
    fat_100g?: number | string;
    'saturated-fat_100g'?: number | string;
    fiber_100g?: number | string;
    sodium_100g?: number | string;
    calcium_100g?: number | string;
    iron_100g?: number | string;
  };
}

const toDecimal = (val: unknown, precision = 2) => {
  if (val === undefined || val === null || val === "") return "0.00";
  const num = typeof val === "string" ? parseFloat(val.replace(',', '.')) : Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(precision);
};

const ingredientSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().optional().default("Geral"),
  unit: z.string().optional().default("g"),
  yieldFactor: z.coerce.number().default(1),
  energyKcal: z.coerce.number().default(0),
  energyKj: z.coerce.number().default(0),
  proteins: z.coerce.number().default(0),
  carbs: z.coerce.number().default(0),
  addedSugars: z.coerce.number().default(0),
  fatTotal: z.coerce.number().default(0),
  fatSaturated: z.coerce.number().default(0),
  fatTrans: z.coerce.number().default(0),
  fiber: z.coerce.number().default(0),
  sodium: z.coerce.number().default(0),
  calcium: z.coerce.number().default(0),
  iron: z.coerce.number().default(0),
});

export const ingredientsRouter = router({
  
  /**
   * 1. LISTAGEM
   */
  list: adminProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => { 
      const db = await getDb();
      return await db.select({
        id: ingredients.id,
        name: ingredients.name,
        unit: ingredients.unit,
        category: ingredients.category,
        yieldFactor: nutritionFacts.yieldFactor,
        energyKcal: nutritionFacts.energyKcal,
        energyKj: nutritionFacts.energyKj,
        proteins: nutritionFacts.proteins,
        carbs: nutritionFacts.carbs,
        addedSugars: nutritionFacts.addedSugars,
        fatTotal: nutritionFacts.fatTotal,
        fatSaturated: nutritionFacts.fatSaturated,
        fatTrans: nutritionFacts.fatTrans,
        fiber: nutritionFacts.fiber,
        sodium: nutritionFacts.sodium,
        calcium: nutritionFacts.calcium,
        iron: nutritionFacts.iron,
      })
      .from(ingredients)
      .leftJoin(
        nutritionFacts, 
        and(eq(nutritionFacts.ingredientId, ingredients.id), eq(nutritionFacts.entityType, 'BASE'))
      )
      .where(input?.search ? like(ingredients.name, `%${input.search}%`) : undefined)
      .orderBy(asc(ingredients.name));
    }),

  /**
   * 2. SALVAR (CREATE / UPDATE)
   */
  create: adminProcedure
    .input(ingredientSchema)
    .mutation(async ({ input }) => { 
      const db = await getDb();
      return await db.transaction(async (tx) => {
        let ingId = input.id;
        
        const payloadIngredients: IngredientInsert = {
          name: input.name,
          category: input.category,
          unit: input.unit,
        };

        if (ingId) {
          await tx.update(ingredients).set(payloadIngredients).where(eq(ingredients.id, ingId));
        } else {
          const [res] = await tx.insert(ingredients).values(payloadIngredients) as unknown as [{ insertId: number }];
          ingId = res.insertId;
        }

        await tx.delete(nutritionFacts).where(
          and(eq(nutritionFacts.ingredientId, ingId!), eq(nutritionFacts.entityType, 'BASE'))
        );

        const nutritionData: NutritionInsert = {
          ingredientId: ingId,
          entityType: 'BASE',
          energyKcal: toDecimal(input.energyKcal),
          energyKj: toDecimal(input.energyKj),
          yieldFactor: toDecimal(input.yieldFactor),
          proteins: toDecimal(input.proteins, 3),
          carbs: toDecimal(input.carbs, 3),
          fatTotal: toDecimal(input.fatTotal, 3),
          fatSaturated: toDecimal(input.fatSaturated, 3),
          fatTrans: toDecimal(input.fatTrans, 3),
          fiber: toDecimal(input.fiber, 3),
          sodium: toDecimal(input.sodium),
          addedSugars: toDecimal(input.addedSugars),
          calcium: toDecimal(input.calcium),
          iron: toDecimal(input.iron),
        };

        await tx.insert(nutritionFacts).values(nutritionData);

        const action = input.id ? "atualizado" : "cadastrado";
        return { 
          success: true, 
          id: ingId,
          message: `Insumo "${input.name}" ${action} com sucesso!` 
        };
      });
    }),

  /**
   * 3. BUSCA EXTERNA (OpenFoodFacts)
   */
  searchExternal: adminProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      try {
        let searchTerm = input.name;
        if (searchTerm.includes('fatsecret.com.br')) {
          const parts = decodeURIComponent(searchTerm).split('/').filter(Boolean);
          const slug = parts[parts.length - 2] === '100g' ? parts[parts.length - 3] : parts[parts.length - 1];
          searchTerm = slug.replace(/-/g, ' ');
        }

        const isBarcode = /^\d+$/.test(searchTerm);
        const url = isBarcode 
          ? `https://br.openfoodfacts.org/api/v0/product/${searchTerm}.json`
          : `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&action=process&json=1&page_size=24`;
        
        const response = await fetch(url);
        const data = await response.json();
        const products = (isBarcode ? (data.product ? [data.product] : []) : (data.products || [])) as OpenFoodFactsProduct[];

        return products.map((p) => ({
          name: p.product_name || searchTerm,
          brand: p.brands || "Marca Externa",
          image: p.image_thumb_url || null,
          energyKcal: toDecimal(p.nutriments?.['energy-kcal_100g'] || 0),
          energyKj: toDecimal(p.nutriments?.['energy-kj_100g'] || 0),
          proteins: toDecimal(p.nutriments?.proteins_100g || 0, 3),
          carbs: toDecimal(p.nutriments?.carbohydrates_100g || 0, 3),
          fatTotal: toDecimal(p.nutriments?.fat_100g || 0, 3),
          fatSaturated: toDecimal(p.nutriments?.['saturated-fat_100g'] || 0, 3),
          fiber: toDecimal(p.nutriments?.fiber_100g || 0, 3),
          sodium: toDecimal((Number(p.nutriments?.sodium_100g || 0)) * 1000, 2),
          calcium: toDecimal(p.nutriments?.calcium_100g || 0),
          iron: toDecimal(p.nutriments?.iron_100g || 0),
        }));
      } catch {
        return [];
      }
    }),

  /**
   * 4. EXCLUSÃO
   */
  delete: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [usage] = await db.select({ count: sql<number>`count(*)` })
        .from(dishComposition)
        .where(eq(dishComposition.ingredientId, input.id));
      
      if (Number(usage?.count || 0) > 0) {
        throw new TRPCError({ 
          code: 'CONFLICT', 
          message: `Insumo em uso: Este item está vinculado a uma ou mais fichas técnicas.` 
        });
      }

      await db.transaction(async (tx) => {
        await tx.delete(nutritionFacts).where(eq(nutritionFacts.ingredientId, input.id));
        await tx.delete(ingredients).where(eq(ingredients.id, input.id));
      });

      return { 
        success: true,
        message: input.name ? `Insumo "${input.name}" removido.` : "Insumo removido com sucesso."
      };
    })
});