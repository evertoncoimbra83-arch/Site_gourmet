import { getDb } from "../../../server/db"; 
// ✅ Importação correta conforme o seu schema catalog.ts
import { dishComposition, ingredients } from "../../../drizzle/schema/catalog";
import { eq, sql } from "drizzle-orm";

export async function getCalculatedNutrition(dishId: number) {
  const db = await getDb();
  
  if (!db) throw new Error("Não foi possível conectar ao banco de dados");

  /**
   * ✅ CÁLCULO PROPORCIONAL
   * 1. Pega a quantidade do ingrediente na composição (dishComposition.quantity).
   * 2. Pega os valores nutricionais do ingrediente base (ingredients).
   * 3. Calcula: (ValorBase * Quantidade) / 100.
   * 4. Agrupa por dishId.
   */
  const recipe = await db
    .select({
      kcal: sql<number>`SUM((${dishComposition.energyKcal} * ${dishComposition.quantity}) / 100)`,
      protein: sql<number>`SUM((${dishComposition.proteins} * ${dishComposition.quantity}) / 100)`,
      carbs: sql<number>`SUM((${dishComposition.carbs} * ${dishComposition.quantity}) / 100)`,
      fats: sql<number>`SUM((${dishComposition.fatTotal} * ${dishComposition.quantity}) / 100)`,
      sodium: sql<number>`SUM((${dishComposition.sodium} * ${dishComposition.quantity}) / 100)`,
    })
    .from(dishComposition)
    // No seu schema, dishComposition tem a FK ingredientId para ingredients.id
    .innerJoin(ingredients, eq(dishComposition.ingredientId, ingredients.id))
    .where(eq(dishComposition.dishId, dishId));

  // Retorna o primeiro resultado ou um objeto zerado caso o prato não tenha composição
  return recipe[0] || { 
    kcal: 0, 
    protein: 0, 
    carbs: 0, 
    fats: 0, 
    sodium: 0 
  };
}