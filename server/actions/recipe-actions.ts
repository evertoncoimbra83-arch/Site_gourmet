"use server";

import { getDb } from "../db"; 
import { productIngredients } from "../../drizzle/schema/nutrition";
// Ajustado: Saindo de server/actions (..) voltando para server e entrando em services
import { syncDishNutrition } from "client/src/services/nutrition-sync"; 
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Adiciona um ingrediente à ficha técnica e recalcula os totais do prato
 */
export async function addIngredientToRecipe(
  dishId: number, 
  ingredientId: number, 
  quantity: number
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Falha na conexão com o banco");

    await db.insert(productIngredients).values({
      productId: dishId,
      ingredientId: ingredientId,
      quantity: String(quantity),
    });

    await syncDishNutrition(dishId);

    revalidatePath("/admin/dishes");
    revalidatePath(`/produto/${dishId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar ingrediente:", error);
    return { success: false, error: "Falha ao salvar ingrediente." };
  }
}

/**
 * Remove um ingrediente e atualiza a nutrição
 */
export async function removeIngredientFromRecipe(id: number, dishId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Falha na conexão com o banco");

    await db.delete(productIngredients).where(eq(productIngredients.id, id));
    
    await syncDishNutrition(dishId);

    revalidatePath("/admin/dishes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao remover:", error);
    return { success: false, error: "Erro ao remover." };
  }
}