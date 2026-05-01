import { and, eq } from "drizzle-orm"; 
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db"; 
import { 
  dishes, 
  dishComposition, 
  dishesToSizes, 
  nutritionFacts 
} from "../../../drizzle/schema/index";
import { generateSlug } from "./admin-dishes-types";
import { safeInteger, safeNumber } from "../../lib/safe-parse";

// --- TIPAGENS ---

type NewDish = typeof dishes.$inferInsert;

interface DishPayload extends Record<string, unknown> {
  name: string;
  price: string | number;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  salePrice?: string | number | null;
  categoryId?: string | number | null;
  isActive?: boolean;
  show_nutrition?: boolean;
  showNutrition?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  ingredients?: string | null;
  energyKcal?: string | number;
  energyKj?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  fatSaturated?: string | number;
  fatTrans?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  calcium?: string | number;
  iron?: string | number;
  yieldFactor?: string | number;
  composition?: Array<{
    ingredientId?: number;
    id?: number;
    originalId?: number;
    ingredientName?: string;
    name?: string;
    quantity: string | number;
    energyKcal?: string | number;
    proteins?: string | number;
    carbs?: string | number;
    fatTotal?: string | number;
  }>;
}

// --- HELPERS ---

const toDecimal = (val: string | number | null | undefined, precision = 2): string => {
  if (val === undefined || val === null || val === "") return "0.00";
  const normalized = typeof val === "string" ? val.replace(",", ".") : val;
  const num = safeNumber(normalized, Number.NaN);
  return Number.isFinite(num) ? num.toFixed(precision) : "0.00";
};

const getSafeId = (item: { ingredientId?: number; id?: number; originalId?: number } | null | undefined): number | null => {
  if (!item) return null;
  const id = item.ingredientId || item.id || item.originalId;
  const num = safeInteger(id, 0);
  return num === 0 ? null : num;
};

function requireIntegerId(value: unknown, label: string): number {
  const id = safeInteger(value, Number.NaN);
  if (!Number.isFinite(id) || id <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${label} invÃ¡lido.` });
  }
  return id;
}

function requirePrice(value: unknown, label: string): string {
  const normalized = typeof value === "string" ? value.replace(",", ".") : value;
  const price = safeNumber(normalized, Number.NaN);
  if (!Number.isFinite(price) || price < 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${label} invÃ¡lido.` });
  }
  return price.toFixed(2);
}

// --- MUTAÇÕES ---

/**
 * ✅ CRIAR NOVO PRATO
 */
export async function createDish(data: DishPayload) {
  const db = await getDb();
  const slug = data.slug || generateSlug(data.name);

  const [result] = await db.insert(dishes).values({
    name: data.name || "Novo Prato",
    slug: slug,
    description: data.description || null,
    imageUrl: data.imageUrl || null,
    basePrice: requirePrice(data.price, "PreÃ§o"),
    salePrice: data.salePrice ? requirePrice(data.salePrice, "PreÃ§o promocional") : null,
    categoryId: data.categoryId ? requireIntegerId(data.categoryId, "Categoria") : null,
    isActive: data.isActive ?? true,
    showNutrition: data.show_nutrition ?? data.showNutrition ?? false,
    isVegetarian: data.isVegetarian ?? false,
    isGlutenFree: data.isGlutenFree ?? false,
    isLactoseFree: data.isLactoseFree ?? false,
    ingredients: data.ingredients || null,
    // Snapshot Nutricional (Colunas Individuais)
    energyKcal: toDecimal(data.energyKcal),
    energyKj: toDecimal(data.energyKj),
    proteins: toDecimal(data.proteins),
    carbs: toDecimal(data.carbs),
    fatTotal: toDecimal(data.fatTotal),
    fatSaturated: toDecimal(data.fatSaturated, 3),
    fatTrans: toDecimal(data.fatTrans, 3),
    fiber: toDecimal(data.fiber),
    sodium: toDecimal(data.sodium),
    createdAt: new Date(),
    updatedAt: new Date(),
    // nutritionalInfo é deixado como null/default
  });

  return { success: true, id: result.insertId };
}

/**
 * ✅ ATUALIZAR PRATO
 */
export async function updateDish(id: string | number, data: DishPayload) {
  const db = await getDb();
  const dishId = requireIntegerId(id, "Prato");

  return await db.transaction(async (tx) => {
    const dishPayload: Partial<NewDish> = {
      name: data.name,
      slug: data.slug || generateSlug(data.name),
      description: data.description,
      imageUrl: data.imageUrl,
      ingredients: data.ingredients,
      basePrice: requirePrice(data.price, "PreÃ§o"),
      salePrice: data.salePrice ? requirePrice(data.salePrice, "PreÃ§o promocional") : null,
      categoryId: data.categoryId ? requireIntegerId(data.categoryId, "Categoria") : null,
      isActive: data.isActive ?? true,
      showNutrition: data.show_nutrition ?? data.showNutrition ?? false,
      isVegetarian: data.isVegetarian ?? false,
      isGlutenFree: data.isGlutenFree ?? false,
      isLactoseFree: data.isLactoseFree ?? false,
      
      // ✅ ATUALIZAÇÃO DAS COLUNAS (FONTE DA VERDADE)
      energyKcal: toDecimal(data.energyKcal),
      energyKj: toDecimal(data.energyKj),
      proteins: toDecimal(data.proteins),
      carbs: toDecimal(data.carbs),
      fatTotal: toDecimal(data.fatTotal),
      fatSaturated: toDecimal(data.fatSaturated, 3),
      fatTrans: toDecimal(data.fatTrans, 3),
      fiber: toDecimal(data.fiber),
      sodium: toDecimal(data.sodium),
      calcium: toDecimal(data.calcium),
      iron: toDecimal(data.iron),
      yieldFactor: toDecimal(data.yieldFactor || 1.00),

      // ⚰️ MATANDO O LEGADO
      // Definimos como null para forçar o uso das colunas individuais no sistema
      nutritionalInfo: null, 
      
      updatedAt: new Date()
    };

    await tx.update(dishes).set(dishPayload).where(eq(dishes.id, dishId));

    // Gerenciamento da Composição e nutritionFacts (Tabela de apoio para relatórios)
    if (data.composition && Array.isArray(data.composition)) {
      await tx.delete(dishComposition).where(eq(dishComposition.dishId, dishId));
      await tx.delete(nutritionFacts).where(
        and(eq(nutritionFacts.dishId, dishId), eq(nutritionFacts.entityType, 'TOTAL'))
      );

      for (const item of data.composition) {
        const safeIngId = getSafeId(item);
        if (!safeIngId) continue;

        const [compRes] = await tx.insert(dishComposition).values({
          dishId: dishId,
          ingredientId: safeIngId,
          ingredientName: item.ingredientName || item.name || "Ingrediente",
          quantity: toDecimal(item.quantity, 3),
        });

        await tx.insert(nutritionFacts).values({
          compositionId: compRes.insertId,
          entityType: 'SNAPSHOT',
          energyKcal: toDecimal(item.energyKcal),
          proteins: toDecimal(item.proteins, 3),
          carbs: toDecimal(item.carbs, 3),
          fatTotal: toDecimal(item.fatTotal, 3)
        });
      }

      // Alimenta a tabela nutritionFacts TOTAL para auditoria e histórico
      await tx.insert(nutritionFacts).values({
        dishId: dishId,
        entityType: 'TOTAL',
        energyKcal: toDecimal(data.energyKcal),
        energyKj: toDecimal(data.energyKj),
        proteins: toDecimal(data.proteins, 3),
        carbs: toDecimal(data.carbs, 3),
        fatTotal: toDecimal(data.fatTotal, 3),
        fatSaturated: toDecimal(data.fatSaturated, 3),
        fatTrans: toDecimal(data.fatTrans, 3),
        fiber: toDecimal(data.fiber, 3),
        sodium: toDecimal(data.sodium),
        calcium: toDecimal(data.calcium),
        iron: toDecimal(data.iron)
      });
    }
    
    return { success: true };
  });
}

/**
 * ✅ DELETAR PRATO E VÍNCULOS
 */
export async function deleteDish(id: string | number) {
  const db = await getDb();
  const dishId = requireIntegerId(id, "Prato");
  
  return await db.transaction(async (tx) => {
    await tx.delete(nutritionFacts).where(eq(nutritionFacts.dishId, dishId));
    await tx.delete(dishComposition).where(eq(dishComposition.dishId, dishId));
    await tx.delete(dishesToSizes).where(eq(dishesToSizes.dishId, dishId));
    await tx.delete(dishes).where(eq(dishes.id, dishId));
    return { success: true };
  });
}

export async function toggleSizeLink(dishId: number, sizeId: number) {
  const db = await getDb();
  const dId = requireIntegerId(dishId, "Prato");
  const sId = requireIntegerId(sizeId, "Tamanho");
  
  const existing = await db.select().from(dishesToSizes)
    .where(and(eq(dishesToSizes.dishId, dId), eq(dishesToSizes.sizeId, sId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(dishesToSizes)
      .where(and(eq(dishesToSizes.dishId, dId), eq(dishesToSizes.sizeId, sId)));
    return { success: true, isLinked: false };
  } else {
    await db.insert(dishesToSizes).values({ dishId: dId, sizeId: sId });
    return { success: true, isLinked: true };
  }
}
