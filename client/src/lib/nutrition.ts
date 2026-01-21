import { getDb } from "../../../server/db"; // Ajuste o caminho conforme sua estrutura
import { productIngredients, ingredients } from "../../../drizzle/schema/nutrition";
import { eq, sql } from "drizzle-orm";

export async function getCalculatedNutrition(dishId: number) {
  const db = await getDb(); // Obtém a instância do banco
  
  if (!db) throw new Error("Não foi possível conectar ao banco de dados");

  const recipe = await db
    .select({
      kcal: sql<number>`SUM((${ingredients.energyKcal} * ${productIngredients.quantity}) / 100)`,
      protein: sql<number>`SUM((${ingredients.protein} * ${productIngredients.quantity}) / 100)`,
      carbs: sql<number>`SUM((${ingredients.carbohydrates} * ${productIngredients.quantity}) / 100)`,
      fats: sql<number>`SUM((${ingredients.fatTotal} * ${productIngredients.quantity}) / 100)`,
      sodium: sql<number>`SUM((${ingredients.sodium} * ${productIngredients.quantity}) / 100)`,
    })
    .from(productIngredients)
    .innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
    .where(eq(productIngredients.productId, dishId));

  return recipe[0];
}