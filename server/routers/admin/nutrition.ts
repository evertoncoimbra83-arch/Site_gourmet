import { router, adminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { ingredients, productIngredients } from "../../../drizzle/schema/index.js"; 
import { eq, like, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Roteador de Nutrição (Admin)
 * Gerencia a Tabela TACO/Ingredientes e a Ficha Técnica dos Pratos.
 */
export const adminNutritionRouter = router({
  
  // 1. Busca de Ingredientes (Autocomplete do Painel)
  searchIngredients: adminProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const db = await getDb();
      return await db
        .select()
        .from(ingredients)
        .where(like(ingredients.name, `%${input}%`))
        .limit(20);
    }),

  // 2. Criar ou Atualizar Ingrediente (Upsert)
  upsertIngredient: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Nome é obrigatório"),
      energyKcal: z.coerce.number().optional(),
      calories: z.coerce.number().optional(),    
      protein: z.coerce.number().default(0),
      carbohydrates: z.coerce.number().optional(),
      carbs: z.coerce.number().optional(),       
      fatTotal: z.coerce.number().optional(),
      fats: z.coerce.number().optional(),        
      sodium: z.coerce.number().default(0),
      fiber: z.coerce.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Normalização baseada nos nomes que o banco real utiliza
      const caloriesValue = input.calories ?? input.energyKcal ?? 0;
      const carbsValue = input.carbohydrates ?? input.carbs ?? 0;
      const fatsValue = input.fats ?? input.fatTotal ?? 0;

      try {
        // ✅ Query SQL corrigida usando os nomes reais do seu banco (conforme DESCRIBE)
        await db.execute(sql`
          INSERT INTO ingredients (
            name, 
            calories, 
            carbohydrates, 
            protein, 
            fats, 
            fiber, 
            sodium,
            source
          ) VALUES (
            ${input.name}, 
            ${caloriesValue}, 
            ${carbsValue}, 
            ${input.protein}, 
            ${fatsValue}, 
            ${input.fiber}, 
            ${input.sodium},
            'Manual'
          )
          ON DUPLICATE KEY UPDATE
            calories = VALUES(calories),
            carbohydrates = VALUES(carbohydrates),
            protein = VALUES(protein),
            fats = VALUES(fats),
            fiber = VALUES(fiber),
            sodium = VALUES(sodium)
        `);

        const [rows]: any = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
        // Ajuste para pegar o ID independente do formato de retorno do driver
        const insertedId = rows?.[0]?.id || rows?.[0]?.[0]?.id;

        return { success: true, id: insertedId ? Number(insertedId) : null };

      } catch (error: any) {
        console.error("❌ [NUTRITION UPSERT ERROR]:", error);
        
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Erro ao salvar ingrediente. Verifique se as colunas 'calories' e 'fats' existem no banco." 
        });
      }
    }),

  // 3. Salvar Composição Técnica do Prato (Ficha Técnica)
  saveDishComposition: adminProcedure
    .input(z.object({
      dishId: z.coerce.number(),
      composition: z.array(z.object({
        ingredientId: z.coerce.number(),
        quantity: z.coerce.string(), 
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      return await db.transaction(async (tx) => {
        // 1. Limpa a ficha técnica anterior do prato
        await tx.delete(productIngredients)
          .where(eq(productIngredients.productId, input.dishId));

        // 2. Insere a nova lista de ingredientes e quantidades
        if (input.composition.length > 0) {
          await tx.insert(productIngredients).values(
            input.composition.map(item => ({
              productId: input.dishId,
              ingredientId: item.ingredientId,
              quantity: item.quantity,
            }))
          );
        }

        return { success: true };
      });
    }),
});