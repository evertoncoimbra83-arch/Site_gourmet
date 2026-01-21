import { getDb } from "../../../server/db.js"; // Caminho ajustado para subir do service até o server
import { productIngredients, ingredients, dishes } from "../../../drizzle/schema/"; // Apontando para o seu novo schema
import { eq, sql } from "drizzle-orm";

/**
 * Esta função sincroniza a tabela 'dishes' com base na ficha técnica
 * toda vez que um ingrediente é alterado ou adicionado.
 */
export async function syncDishNutrition(dishId: number) {
  // Inicializa a conexão com o banco
  const db = await getDb();
  if (!db) throw new Error("Não foi possível conectar ao banco de dados.");

  // 1. Calcula a soma total dos nutrientes da ficha técnica (Base 100g)
  // A fórmula: (Valor_Ingrediente_100g * Peso_na_Receita) / 100
  const results = await db
    .select({
      kcal: sql<number>`SUM((${ingredients.energyKcal} * ${productIngredients.quantity}) / 100)`,
      kj: sql<number>`SUM((${ingredients.energyKj} * ${productIngredients.quantity}) / 100)`,
      proteins: sql<number>`SUM((${ingredients.protein} * ${productIngredients.quantity}) / 100)`,
      carbs: sql<number>`SUM((${ingredients.carbohydrates} * ${productIngredients.quantity}) / 100)`,
      fiber: sql<number>`SUM((${ingredients.fiber} * ${productIngredients.quantity}) / 100)`,
      fatTotal: sql<number>`SUM((${ingredients.fatTotal} * ${productIngredients.quantity}) / 100)`,
      fatSaturated: sql<number>`SUM((${ingredients.fatSaturated} * ${productIngredients.quantity}) / 100)`,
      fatTrans: sql<number>`SUM((${ingredients.fatTrans} * ${productIngredients.quantity}) / 100)`,
      sodium: sql<number>`SUM((${ingredients.sodium} * ${productIngredients.quantity}) / 100)`,
    })
    .from(productIngredients)
    .innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
    .where(eq(productIngredients.productId, dishId));

  const totals = results[0];

  // 2. Atualiza a tabela 'dishes' com os novos valores calculados (Cache)
  if (totals && totals.kcal !== null) {
    await db
      .update(dishes)
      .set({
        energyKcal: Math.round(Number(totals.kcal) || 0),
        energyKj: Math.round(Number(totals.kj) || 0),
        proteins: String(totals.proteins || "0.00"),
        carbs: String(totals.carbs || "0.00"),
        fiber: String(totals.fiber || "0.00"),
        fatTotal: String(totals.fatTotal || "0.00"),
        fatSaturated: String(totals.fatSaturated || "0.00"),
        fatTrans: String(totals.fatTrans || "0.00"),
        sodium: String(totals.sodium || "0.00"),
      })
      .where(eq(dishes.id, dishId));
    
    return { success: true, totals };
  }

  return { success: false, message: "Nenhum ingrediente encontrado para este prato." };
}