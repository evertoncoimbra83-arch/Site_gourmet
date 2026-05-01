import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { 
  accompanimentOptions, 
  accompanimentCategories 
} from "../drizzle/schema/index";

/**
 * Busca todos os acompanhamentos, garantindo que mesmo itens 
 * sem categoria (null) sejam retornados.
 */
export async function getAccsWithNutrition() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: accompanimentOptions.id,
      name: accompanimentOptions.name,
      isActive: accompanimentOptions.isActive,
      showNutrition: accompanimentOptions.showNutrition, 
      priceModifier: accompanimentOptions.priceModifier,
      
      // ID da Categoria (Pode ser null)
      accompanimentCategoryId: accompanimentOptions.accompanimentCategoryId,
      
      // ✅ Fallbacks seguros para campos de Join (evita erro de undefined no front)
      categoryName: sql`COALESCE(${accompanimentCategories.name}, 'Sem Categoria')`,
      iconKey: sql`COALESCE(${accompanimentCategories.iconKey}, NULL)`,
      categoryColor: sql`COALESCE(${accompanimentCategories.color}, '#CBD5E1')`,
      
      // Nutrientes
      energyKcal: accompanimentOptions.energyKcal,
      energyKj: accompanimentOptions.energyKj, 
      proteins: accompanimentOptions.proteins,
      carbs: accompanimentOptions.carbs,
      fatTotal: accompanimentOptions.fatTotal,
      fatSaturated: accompanimentOptions.fatSaturated, 
      fatTrans: accompanimentOptions.fatTrans,         
      sodium: accompanimentOptions.sodium,
      fiber: accompanimentOptions.fiber,
      calcium: accompanimentOptions.calcium,
      iron: accompanimentOptions.iron,
      
      ingredients: accompanimentOptions.ingredients,
      
      // Ficha Técnica (JSON/String)
      nutritionalInfo: accompanimentOptions.nutritionalInfo,

      // Placeholder para vínculos de grupos
      linkedGroupIds: sql`'[]'`, 
    })
    .from(accompanimentOptions)
    // ✅ Left Join mantém todos os registros da tabela "Options"
    .leftJoin(
      accompanimentCategories, 
      eq(accompanimentOptions.accompanimentCategoryId, accompanimentCategories.id)
    )
    .orderBy(accompanimentOptions.name);
}