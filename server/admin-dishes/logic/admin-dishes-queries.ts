import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";
import { getDb } from "../../db"; 
import { mapDishRowToAdmin, GetPaginatedDishesParams } from "./admin-dishes-types";

import { 
  nutritionFacts,
  dishes, 
  categories, 
  dishSizes, 
  dishesToSizes, 
  dishComposition, 
  ingredients 
} from "../../../drizzle/schema/index"; 

// --- INTERFACES DE LINHA (DB ROWS) ---

interface CompositionWithIngredient {
  id: number;
  dishId: number;
  ingredientId: number | null;
  ingredientName: string | null;
  quantity: string | number;
  [key: string]: unknown;
}

interface DishAdminRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  salePrice: string | null;
  categoryId: number | null;
  isActive: boolean;
  ingredients: string | null;
  show_nutrition: boolean;
  isVegetarian: number;
  isGlutenFree: number;
  isLactoseFree: number;
  categoryName: string | null;
  [key: string]: unknown; 
}

/**
 * ✅ 1. LISTAR CATEGORIAS
 */
export async function getLocalCategories() {
  const db = await getDb();
  return await db.select().from(categories).orderBy(asc(categories.displayOrder));
}

/**
 * ✅ 2. PESQUISAR INSUMOS
 */
export async function searchIngredients(query: string) {
  const db = await getDb();
  if (!query || query.length < 2) return [];
  
  try {
    const results = await db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        category: ingredients.category,
        unit: ingredients.unit,
        yieldFactor: sql<string>`ingredients.yield_factor`, 
        energyKcal: nutritionFacts.energyKcal,
        energyKj: nutritionFacts.energyKj,
        proteins: nutritionFacts.proteins,            
        carbs: nutritionFacts.carbs,         
        fatTotal: nutritionFacts.fatTotal,               
        sodium: nutritionFacts.sodium               
      })
      .from(ingredients)
      .leftJoin(
        nutritionFacts,
        and(
          eq(nutritionFacts.ingredientId, ingredients.id),
          eq(nutritionFacts.entityType, 'BASE')
        )
      )
      .where(like(ingredients.name, `%${query}%`))
      .limit(15);

    return results.map((ing) => ({
      ...ing,
      yieldFactor: Number(ing.yieldFactor || 1),
      energyKcal: Number(ing.energyKcal || 0),
      energyKj: Number(ing.energyKj || 0),
      proteins: Number(ing.proteins || 0),
      carbs: Number(ing.carbs || 0),
      fatTotal: Number(ing.fatTotal || 0),
      sodium: Number(ing.sodium || 0),
    }));
  } catch {
    return [];
  }
}

/**
 * ✅ 3. BUSCA DETALHADA DO PRATO (GetById)
 */
export async function getDishById(id: string | number) {
  const db = await getDb(); 
  const dishId = Number(id);

  try {
    const rows = await db.select({
      id: dishes.id, 
      name: dishes.name, 
      slug: dishes.slug, 
      description: dishes.description,
      imageUrl: dishes.imageUrl, 
      price: dishes.basePrice, 
      salePrice: dishes.salePrice,
      categoryId: dishes.categoryId, 
      isActive: dishes.isActive, 
      ingredients: dishes.ingredients,
      show_nutrition: dishes.showNutrition,
      isVegetarian: sql<number>`COALESCE(dishes.is_vegetarian, 0)`,
      isGlutenFree: sql<number>`COALESCE(dishes.is_gluten_free, 0)`,
      isLactoseFree: sql<number>`COALESCE(dishes.is_lactose_free, 0)`,
      categoryName: categories.name
    }).from(dishes)
    .leftJoin(categories, eq(dishes.categoryId, categories.id))
    .where(eq(dishes.id, dishId))
    .limit(1);

    const row = rows[0] as DishAdminRow | undefined;
    if (!row) return null;

    const mappedBase = mapDishRowToAdmin(row) || {};

    const nutrition = await db.select().from(nutritionFacts)
      .where(and(eq(nutritionFacts.dishId, dishId), eq(nutritionFacts.entityType, 'TOTAL')))
      .limit(1);

    const compositionItems = await db.select()
      .from(dishComposition)
      .where(eq(dishComposition.dishId, dishId)) as CompositionWithIngredient[];
    
    const enrichedComposition = await Promise.all((compositionItems || []).map(async (item) => {
        if (item.ingredientId) {
            const [data] = await db.select({
                name: ingredients.name,
                yieldFactor: sql<string>`ingredients.yield_factor`,
                energyKcal: nutritionFacts.energyKcal,
                energyKj: nutritionFacts.energyKj,
                proteins: nutritionFacts.proteins,
                carbs: nutritionFacts.carbs,
                fatTotal: nutritionFacts.fatTotal,
                fiber: nutritionFacts.fiber,
                sodium: nutritionFacts.sodium
            })
            .from(ingredients)
            .leftJoin(
                nutritionFacts,
                and(
                    eq(nutritionFacts.ingredientId, ingredients.id),
                    eq(nutritionFacts.entityType, 'BASE')
                )
            )
            .where(eq(ingredients.id, item.ingredientId))
            .limit(1);

            return {
                ...item,
                ingredientName: data?.name || item.ingredientName || "Item desconhecido",
                yieldFactor: Number(data?.yieldFactor || 1),
                energyKcal: Number(data?.energyKcal || 0),
                energyKj: Number(data?.energyKj || 0),
                proteins: Number(data?.proteins || 0),
                carbs: Number(data?.carbs || 0),
                fatTotal: Number(data?.fatTotal || 0),
                fiber: Number(data?.fiber || 0),
                sodium: Number(data?.sodium || 0)
            };
        }
        return item;
    }));

    const rawSizes = await db.select({
      id: dishSizes.id, 
      name: dishSizes.name, 
      priceModifier: dishSizes.priceModifier,
      isActive: dishSizes.isActive
    })
    .from(dishSizes)
    .innerJoin(dishesToSizes, eq(dishSizes.id, dishesToSizes.sizeId))
    .where(eq(dishesToSizes.dishId, dishId));

    return { 
      ...mappedBase, 
      energyKcal: Number(nutrition[0]?.energyKcal || 0),
      energyKj: Number(nutrition[0]?.energyKj || 0),
      proteins: Number(nutrition[0]?.proteins || 0),
      carbs: Number(nutrition[0]?.carbs || 0),
      fatTotal: Number(nutrition[0]?.fatTotal || 0),
      fiber: Number(nutrition[0]?.fiber || 0),
      sodium: Number(nutrition[0]?.sodium || 0),
      sizes: rawSizes || [], 
      composition: enrichedComposition.map((c) => ({ 
        ...c,
        name: (c.ingredientName as string || 'Sem nome'),
        quantity: Number(c.quantity || 0)
      })) 
    };

  } catch (error: unknown) { 
    throw new Error(`Erro ao carregar prato: ${error instanceof Error ? error.message : 'Desconhecido'}`); 
  }
}

/**
 * ✅ 4. LISTAGEM PAGINADA
 */
export async function getPaginatedDishes(params: GetPaginatedDishesParams) {
  const db = await getDb();
  const offset = (params.page - 1) * params.limit;
  const conditions = [];

  if (params.search) conditions.push(like(dishes.name, `%${params.search}%`));
  if (params.categoryId) conditions.push(eq(dishes.categoryId, params.categoryId));
  if (!params.showInactive) conditions.push(eq(dishes.isActive, true));

  const whereExpr = conditions.length ? and(...conditions) : undefined;
  const [totalResult] = await db.select({ value: count() }).from(dishes).where(whereExpr);
  
  const rows = await db.select({
    id: dishes.id, 
    name: dishes.name, 
    price: dishes.basePrice, 
    salePrice: dishes.salePrice, 
    categoryId: dishes.categoryId, 
    isActive: dishes.isActive, 
    imageUrl: dishes.imageUrl, 
    categoryName: categories.name,
    // Preenchimento de campos obrigatórios da interface para evitar bugs no map
    slug: sql<string>`''`,
    description: sql<string>`''`,
    ingredients: sql<string>`''`,
    show_nutrition: sql<boolean>`false`,
    isVegetarian: sql<number>`0`,
    isGlutenFree: sql<number>`0`,
    isLactoseFree: sql<number>`0`,
  }).from(dishes).leftJoin(categories, eq(dishes.categoryId, categories.id))
  .where(whereExpr).orderBy(desc(dishes.id)).limit(params.limit).offset(offset) as DishAdminRow[];

  const dataWithSizes = await Promise.all(rows.map(async (row) => {
    const linkedSizes = await db.select({ id: dishSizes.id }).from(dishesToSizes)
      .innerJoin(dishSizes, eq(dishesToSizes.sizeId, dishSizes.id))
      .where(eq(dishesToSizes.dishId, row.id));
    
    const mapped = mapDishRowToAdmin(row) || {};
    return { ...mapped, sizes: linkedSizes };
  }));

  return { data: dataWithSizes, total: Number(totalResult?.value ?? 0) };
}

export async function listAllSizes() {
  const db = await getDb();

  return await db
    .select({
      id: dishSizes.id,
      name: dishSizes.name,
      price: dishSizes.price,
      priceModifier: dishSizes.priceModifier,
      mainDishWeight: dishSizes.mainDishWeight,
      displayOrder: dishSizes.displayOrder,
      isActive: dishSizes.isActive,
      iconKey: dishSizes.iconKey,
      color: dishSizes.color,
      description: dishSizes.description,
      groupsOrder: dishSizes.groupsOrder,
      weight: dishSizes.weight,
    })
    .from(dishSizes)
    .where(eq(dishSizes.isActive, true))
    .orderBy(asc(dishSizes.name));
}