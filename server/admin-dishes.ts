import { and, asc, count, eq, like, sql } from "drizzle-orm"; 
import { getDb } from "./db.js"; 
import { 
  dishes, 
  categories, 
  dishSizes, 
  sizeAccompanimentGroups, 
  accompanimentGroups, 
  accompanimentOptions
} from "../drizzle/schema/catalog.js";

// ===================================================================
// TIPOS E HELPERS
// ===================================================================

export type AdminDish = {
    id: number; 
    name: string;
    price: number; 
    categoryId: number | null; 
    isActive: boolean;
    categoryName?: string | null;
    description?: string | null;
    ingredients?: string | null; 
    imageUrl?: string | null;
    slug?: string;
    // Nutricionais
    energyKcal?: number | null;
    energyKj?: number | null;
    proteins?: number | null;
    carbs?: number | null;
    fatTotal?: number | null;
    fatSaturated?: number | null;
    fatTrans?: number | null;
    fiber?: number | null;
    sodium?: number | null;
    showNutrition?: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isLactoseFree: boolean;
    allowAccompaniments?: boolean;
    updatedAt?: Date | null;
};

/**
 * ✅ Helper para garantir tipagem correta no retorno para o Frontend
 */
function mapDishRowToAdmin(row: any): AdminDish {
  return {
    ...row,
    id: Number(row.id),
    price: Number(row.price || 0),
    categoryId: row.categoryId ? Number(row.categoryId) : null,
    isActive: Boolean(row.isActive),
    categoryName: row.categoryName ?? "Sem Categoria",
    // Conversão de decimais/strings do banco para Numbers reais
    energyKcal: row.energyKcal ? Number(row.energyKcal) : 0,
    energyKj: row.energyKj ? Number(row.energyKj) : 0,
    carbs: row.carbs ? Number(row.carbs) : 0,
    proteins: row.proteins ? Number(row.proteins) : 0,
    fatTotal: row.fatTotal ? Number(row.fatTotal) : 0,
    fatSaturated: row.fatSaturated ? Number(row.fatSaturated) : 0,
    fatTrans: row.fatTrans ? Number(row.fatTrans) : 0,
    fiber: row.fiber ? Number(row.fiber) : 0,
    sodium: row.sodium ? Number(row.sodium) : 0,
    showNutrition: Boolean(row.showNutrition),
    isVegetarian: Boolean(row.isVegetarian),
    isGlutenFree: Boolean(row.isGlutenFree),
    isLactoseFree: Boolean(row.isLactoseFree),
  };
}

function toPriceString(price: any): string {
    if (price === undefined || price === null) return "0.00";
    if (typeof price === "string") price = parseFloat(price.replace(',', '.'));
    const num = Number(price);
    return isNaN(num) ? "0.00" : num.toFixed(2);
}

function generateSlug(name: string): string {
    const base = name || "dish";
    const cleanName = base.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^\w\s-]/g, '') 
        .replace(/\s+/g, '-');    
    return `${cleanName}-${Math.random().toString(36).substring(2, 5)}`; 
}

// ===================================================================
// OPERAÇÕES C.R.U.D.
// ===================================================================

export async function createDish(data: any) {
  const db = await getDb();
  const potentialId = Number(data.id);
  if (!isNaN(potentialId) && potentialId > 0) return updateDish(potentialId, data);

  const slug = data.slug || generateSlug(data.name);
  try {
    const result = await db.insert(dishes).values({
      name: data.name || "Novo Prato",
      slug: slug,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      price: toPriceString(data.price),
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      isActive: data.isActive ?? true,
      ingredients: data.ingredients || null,
      
      energyKcal: data.energyKcal ? Number(data.energyKcal) : null,
      energyKj: data.energyKj ? Number(data.energyKj) : null,
      carbs: data.carbs ? String(data.carbs) : null,
      proteins: data.proteins ? String(data.proteins) : null,
      fatTotal: data.fatTotal ? String(data.fatTotal) : null,
      fatSaturated: data.fatSaturated ? String(data.fatSaturated) : null,
      fatTrans: data.fatTrans ? String(data.fatTrans) : null,
      fiber: data.fiber ? String(data.fiber) : null,
      sodium: data.sodium ? String(data.sodium) : null,
      showNutrition: Boolean(data.showNutrition),

      isVegetarian: Boolean(data.isVegetarian),
      isGlutenFree: Boolean(data.isGlutenFree),
      isLactoseFree: Boolean(data.isLactoseFree),
    });
    return result;
  } catch (error: any) {
    console.error("❌ [CREATE ERROR]:", error.message);
    throw error;
  }
}

export async function updateDish(id: string | number, data: any) {
  const db = await getDb();
  const dishId = Number(id);

  const updateData: any = {
    name: data.name,
    description: data.description,
    imageUrl: data.imageUrl,
    price: toPriceString(data.price),
    categoryId: data.categoryId ? Number(data.categoryId) : null,
    isActive: data.isActive,
    ingredients: data.ingredients,
    
    energyKcal: data.energyKcal !== undefined ? Number(data.energyKcal) : undefined,
    energyKj: data.energyKj !== undefined ? Number(data.energyKj) : undefined,
    carbs: data.carbs !== undefined ? String(data.carbs) : undefined,
    proteins: data.proteins !== undefined ? String(data.proteins) : undefined,
    fatTotal: data.fatTotal !== undefined ? String(data.fatTotal) : undefined,
    fatSaturated: data.fatSaturated !== undefined ? String(data.fatSaturated) : undefined,
    fatTrans: data.fatTrans !== undefined ? String(data.fatTrans) : undefined,
    fiber: data.fiber !== undefined ? String(data.fiber) : undefined,
    sodium: data.sodium !== undefined ? String(data.sodium) : undefined,
    showNutrition: data.showNutrition !== undefined ? Boolean(data.showNutrition) : undefined,

    isVegetarian: Boolean(data.isVegetarian),
    isGlutenFree: Boolean(data.isGlutenFree),
    isLactoseFree: Boolean(data.isLactoseFree),
    updatedAt: new Date()
  };

  try {
    await db.update(dishes).set(updateData).where(eq(dishes.id, dishId));
    return { success: true };
  } catch (error: any) {
    console.error("❌ [UPDATE ERROR]:", error.message);
    throw error;
  }
}

export async function deleteDish(id: string | number) {
  const db = await getDb();
  try {
    await db.delete(dishes).where(eq(dishes.id, Number(id)));
    return { success: true };
  } catch (error: any) {
    if (error.errno === 1451) throw new Error("Este prato possui pedidos vinculados.");
    throw error;
  }
}

// ===================================================================
// BUSCA E LISTAGEM
// ===================================================================

export async function getPaginatedDishes(params: any) {
    const db = await getDb();
    const page = Number(params.page) || 1;
    const perPage = Number(params.limit) || 8; 
    const offset = (page - 1) * perPage;
    
    const conditions = [];
    if (params.search?.trim()) conditions.push(like(dishes.name, `%${params.search.trim()}%`));
    if (params.categoryId && params.categoryId !== 'all') conditions.push(eq(dishes.categoryId, Number(params.categoryId)));
    if (typeof params.isActive === "boolean") conditions.push(eq(dishes.isActive, params.isActive));

    const whereExpr = conditions.length ? and(...conditions) : undefined;
    const totalResult = await db.select({ value: count() }).from(dishes).where(whereExpr);

    const rows = await db
        .select({
            id: dishes.id,
            name: dishes.name,
            price: dishes.price, 
            categoryId: dishes.categoryId,
            isActive: dishes.isActive,
            description: dishes.description,
            ingredients: dishes.ingredients, 
            imageUrl: dishes.imageUrl,
            slug: dishes.slug,
            energyKcal: dishes.energyKcal,
            carbs: dishes.carbs,
            proteins: dishes.proteins,
            showNutrition: dishes.showNutrition,
            categoryName: categories.name,
            allowAccompaniments: categories.allowAccompaniments,
        })
        .from(dishes)
        .leftJoin(categories, eq(dishes.categoryId, categories.id))
        .where(whereExpr)
        .orderBy(asc(dishes.name))
        .limit(perPage)
        .offset(offset);

    return { data: rows.map(mapDishRowToAdmin), total: Number(totalResult[0]?.value ?? 0) };
}

/**
 * ✅ BUSCA COMPLETA: Inclui tipagem explícita para resolver erros de compilação
 */
export async function getDishById(id: string | number) {
  const db = await getDb();
  const dishId = Number(id);

  try {
    const [row] = await db
      .select({
        id: dishes.id,
        name: dishes.name,
        slug: dishes.slug,
        description: dishes.description,
        imageUrl: dishes.imageUrl,
        price: dishes.price,
        categoryId: dishes.categoryId,
        isActive: dishes.isActive,
        ingredients: dishes.ingredients,
        energyKcal: dishes.energyKcal,
        energyKj: dishes.energyKj,
        proteins: dishes.proteins,
        carbs: dishes.carbs,
        fatTotal: dishes.fatTotal,
        fatSaturated: dishes.fatSaturated,
        fatTrans: dishes.fatTrans,
        fiber: dishes.fiber,
        sodium: dishes.sodium,
        showNutrition: dishes.showNutrition,
        isVegetarian: dishes.isVegetarian,
        isGlutenFree: dishes.isGlutenFree,
        isLactoseFree: dishes.isLactoseFree,
        categoryName: categories.name,
        allowAccompaniments: categories.allowAccompaniments,
      })
      .from(dishes)
      .leftJoin(categories, eq(dishes.categoryId, categories.id))
      .where(eq(dishes.id, dishId))
      .limit(1);

    if (!row) return null;

    // ✅ Tipagem explícita para evitar Erro 7034/7005
    let sizes: any[] = []; 

    if (row.allowAccompaniments) {
      const rawSizes = await db.select()
        .from(dishSizes)
        .where(eq(dishSizes.isActive, true))
        .orderBy(asc(dishSizes.displayOrder));
      
      sizes = await Promise.all(rawSizes.map(async (size) => {
        const groupLinks = await db.select({ 
            group: {
              id: accompanimentGroups.id,
              name: accompanimentGroups.name,
              slug: accompanimentGroups.slug,
              maxSelections: accompanimentGroups.maxSelections,
              isActive: accompanimentGroups.isActive
            },
            isRequired: sizeAccompanimentGroups.isRequired 
        }).from(sizeAccompanimentGroups)
        .innerJoin(accompanimentGroups, eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id))
        .where(eq(sizeAccompanimentGroups.sizeId, size.id));

        const groupsWithOptions = await Promise.all(groupLinks.map(async (link) => {
          const options = await db.select()
            .from(accompanimentOptions)
            .where(and(
                eq(accompanimentOptions.isActive, true),
                sql`JSON_CONTAINS(${accompanimentOptions.groupsConfig}, JSON_OBJECT('group_id', ${link.group.id}))`
            ))
            .orderBy(asc(accompanimentOptions.displayOrder));

          return { 
              ...link.group, 
              isRequired: Boolean(link.isRequired), 
              options: options.map(opt => {
                  let configs: any[] = [];
                  try {
                    configs = typeof opt.groupsConfig === 'string' ? JSON.parse(opt.groupsConfig) : (opt.groupsConfig || []);
                  } catch (e) { configs = []; }
                  const specific = configs.find((c: any) => Number(c.group_id) === Number(link.group.id));
                  return { ...opt, priceModifier: Number(specific?.price_modifier || 0) };
              }) 
          };
        }));

        return { ...size, priceModifier: Number(size.priceModifier || 0), accompanimentGroups: groupsWithOptions };
      }));
    }

    return { 
        ...mapDishRowToAdmin(row), 
        sizes 
    };
  } catch (error) {
    console.error("❌ [getDishById Error]:", error);
    throw error;
  }
}

export async function getLocalCategories() {
  const db = await getDb();
  return await db.select().from(categories).orderBy(asc(categories.name));
}