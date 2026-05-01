import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { accompanimentOptions } from "../drizzle/schema";

export async function updateAccompanimentOption(id: number, data: Record<string, unknown>) {
  const db = await getDb();

  // ✅ CORREÇÃO: Usando booleanos reais (true/false) em vez de 1/0
  const payload: Partial<typeof accompanimentOptions.$inferInsert> = {
    name: data.name as string,
    isActive: Boolean(data.isActive), // Converte para true/false
    accompanimentCategoryId: (data.accompanimentCategoryId as number) || null,
    ingredients: (data.ingredients as string) || "",
    
    // Nutricionais
    energyKcal: Number(data.energyKcal || 0),
    energyKj: String(data.energyKj || "0.00"),
    proteins: String(data.proteins || "0.00"),
    carbs: String(data.carbs || "0.00"),
    fatTotal: String(data.fatTotal || "0.00"),
    sodium: String(data.sodium || "0.00"),
    
    // JSON da Composição
    nutritionalInfo: JSON.stringify(data.composition || []),
    showNutrition: !!data.showNutrition, // Garante valor booleano
    updatedAt: new Date()
  };

  await db.update(accompanimentOptions)
    .set(payload)
    .where(eq(accompanimentOptions.id, id));

  return { success: true };
}