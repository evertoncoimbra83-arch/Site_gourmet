import { getDb } from "../../../server/db";
// ✅ Importamos apenas o que temos certeza absoluta que está exportado em index.ts
import { dishes } from "../../../drizzle/schema"; 
import { eq, sql } from "drizzle-orm";

/**
 * Sincroniza a tabela 'dishes' com base na ficha técnica
 * Utilizando SQL puro para contornar inconsistências de mapeamento (snake_case vs camelCase)
 */
export async function syncDishNutrition(dishId: number) {
  const db = await getDb();
  if (!db) throw new Error("Não foi possível conectar ao banco de dados.");

  // 1. Calcula a soma total dos nutrientes usando MySQL puro
  // Assumimos que no banco os nomes são: product_ingredients e snake_case para as colunas
  const results = await db.execute(sql`
    SELECT 
      SUM((i.energy_kcal * pi.quantity) / 100) as kcal,
      SUM((i.energy_kj * pi.quantity) / 100) as kj,
      SUM((i.protein * pi.quantity) / 100) as proteins,
      SUM((i.carbohydrates * pi.quantity) / 100) as carbs,
      SUM((i.fiber * pi.quantity) / 100) as fiber,
      SUM((i.fat_total * pi.quantity) / 100) as fatTotal,
      SUM((i.fat_saturated * pi.quantity) / 100) as fatSaturated,
      SUM((i.fat_trans * pi.quantity) / 100) as fatTrans,
      SUM((i.sodium * pi.quantity) / 100) as sodium
    FROM product_ingredients pi
    INNER JOIN ingredients i ON pi.ingredient_id = i.id
    WHERE pi.product_id = ${dishId}
  `);

  // O Drizzle/MySQL retorna um array onde o primeiro elemento contém as linhas
  const rows = results[0] as unknown as Array<Record<string, string | number | null>>;
  const totals = rows[0];

  // 2. Atualiza a tabela 'dishes' (usando o schema Drizzle exportado em index.ts)
  if (totals && totals.kcal !== null) {
    await db
      .update(dishes)
      .set({
        // Convertendo para String, pois colunas decimais/numéricas esperam strings no Drizzle
        energyKcal: String(Math.round(Number(totals.kcal) || 0)),
        energyKj: String(Math.round(Number(totals.kj) || 0)),
        proteins: String(Number(totals.proteins || 0).toFixed(2)),
        carbs: String(Number(totals.carbs || 0).toFixed(2)),
        fiber: String(Number(totals.fiber || 0).toFixed(2)),
        fatTotal: String(Number(totals.fatTotal || 0).toFixed(2)),
        fatSaturated: String(Number(totals.fatSaturated || 0).toFixed(2)),
        fatTrans: String(Number(totals.fatTrans || 0).toFixed(2)),
        sodium: String(Number(totals.sodium || 0).toFixed(2)),
      })
      .where(eq(dishes.id, dishId));
    
    return { success: true, totals };
  }

  return { success: false, message: "Nenhum ingrediente encontrado para este prato." };
}