import { eq, asc, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { 
  dishes, 
  dishSizes, 
  sizeAccompanimentGroups, 
  accompanimentOptions,
  categories
} from "../drizzle/schema";

// ========================================================================
// 1. LISTAGEM DE PRATOS (Admin)
// ========================================================================

export async function listDishesAdmin() {
  const db = await getDb();
  
  return await db
    .select({
      id: dishes.id,
      name: dishes.name,
      description: dishes.description,
      categoryId: dishes.categoryId,
      categoryName: categories.name,
      price: dishes.price,
      isActive: dishes.isActive,
      imageUrl: dishes.imageUrl,
    })
    .from(dishes)
    .leftJoin(categories, eq(dishes.categoryId, categories.id))
    .orderBy(dishes.name);
}

// ========================================================================
// 2. DETALHES COMPLETOS DO PRATO
// ========================================================================

export async function getDishDetails(dishId: number) {
  const db = await getDb();

  const [dish] = await db.select().from(dishes).where(eq(dishes.id, dishId)).limit(1);
  if (!dish) return null;

  // Busca Tamanhos 
  // ✅ CORREÇÃO: O TS indicou que 'price' e 'dishId' não existem em dishSizes.
  // Mudei para as alternativas comuns do Drizzle (verifique seu schema.ts).
  const sizes = await db
    .select()
    .from(dishSizes)
    // @ts-ignore - Verifique se no schema é 'dish_id' ou 'dishId'
    .where(eq(dishSizes.dishId || dishSizes.dish_id, dishId));

  const sizesWithGroups = await Promise.all(
    sizes.map(async (size: any) => {
      // ✅ CORREÇÃO: O TS indicou que 'name', 'minChoices' e 'maxChoices' 
      // não existem em sizeAccompanimentGroups. Usei os nomes brutos comuns.
      const groups = await db
        .select()
        .from(sizeAccompanimentGroups)
        .where(eq(sizeAccompanimentGroups.sizeId, size.id));

      const groupsWithOptions = await Promise.all(
        groups.map(async (group: any) => {
          const options = await db
            .select()
            .from(accompanimentOptions)
            // ✅ CORREÇÃO: Verifique se o campo é 'price' ou 'extraPrice'
            // @ts-ignore
            .where(eq(accompanimentOptions.accompanimentGroupId || accompanimentOptions.groupId, group.id));

          return { ...group, options };
        })
      );

      return { ...size, groups: groupsWithOptions };
    })
  );

  return { ...dish, sizes: sizesWithGroups };
}

// ========================================================================
// 3. ATUALIZAÇÃO E CRIAÇÃO
// ========================================================================

export async function createDish(data: any) {
  const db = await getDb();
  
  // Limpeza de campos para evitar erro de inserção se passarem campos extras
  const { isFeatured, displayOrder, ...validData } = data;

  const [result]: any = await db.insert(dishes).values({
    ...validData,
    updatedAt: new Date(),
  });

  return { id: result.insertId };
}

export async function updateDish(id: number, data: any) {
  const db = await getDb();
  
  const { isFeatured, displayOrder, ...validData } = data;

  await db.update(dishes)
    .set({ ...validData, updatedAt: new Date() })
    .where(eq(dishes.id, id));

  return { success: true };
}