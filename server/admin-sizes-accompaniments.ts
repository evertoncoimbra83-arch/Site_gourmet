import { asc, eq, sql, desc } from "drizzle-orm"; 
import { getDb } from "./db.js";
import {
  dishSizes,
  accompanimentGroups,
  accompanimentOptions,
  dishes,
  categories,
  sizeAccompanimentGroups,
} from "../drizzle/schema/catalog.js"; 

// ===================================================================
// HELPERS
// ===================================================================
function toPriceString(price: any): string {
  if (price === undefined || price === null || price === "") return "0.00";
  const num = typeof price === "string" ? parseFloat(price.replace(',', '.')) : price;
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

function generateSlug(name: string): string {
  const base = name || "item";
  const clean = base.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, '-');    
  return `${clean}-${Math.random().toString(36).substring(2, 7)}`; 
}

// ===================================================================
// 1) DISH SIZES (TAMANHOS)
// ===================================================================

export async function getAllLinks() {
  const db = await getDb();
  try {
    const [rows]: any = await db.execute(sql`
      SELECT 
        size_id as sizeId, 
        accompaniment_group_id as groupId 
      FROM size_accompaniment_groups
    `);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("❌ Erro ao buscar todos os vínculos:", error);
    return [];
  }
}

export async function getAllDishSizes() {
  const db = await getDb();
  const result = await db.select().from(dishSizes).orderBy(asc(dishSizes.displayOrder));
  return result.map((size: any) => ({
    ...size,
    id: Number(size.id),
    priceModifier: Number(size.priceModifier || 0),
    description: size.description || "", 
    isActive: Boolean(size.isActive)
  }));
}

export async function getSizeById(id: number | string) {
  const db = await getDb();
  const rows = await db.select().from(dishSizes).where(eq(dishSizes.id, Number(id))).limit(1);
  if (!rows[0]) return null;
  return { 
    ...rows[0], 
    id: Number(rows[0].id),
    description: rows[0].description || "" 
  };
}

export async function createDishSize(data: any) {
  const db = await getDb();
  const [result]: any = await db.insert(dishSizes).values({
    name: data.name,
    weight: data.weight ?? null,
    description: data.description ?? null,
    iconKey: data.iconKey ?? "Cube",
    priceModifier: toPriceString(data.priceModifier),
    displayOrder: Number(data.displayOrder ?? 0),
    isActive: data.isActive ?? true,
  });
  return { success: true, id: result.insertId };
}

export async function updateDishSize(id: number | string, data: any) {
  const db = await getDb();
  
  // Remove campos que não devem ser atualizados no SET
  const { id: _, ...updateData } = data;

  if (Object.keys(updateData).length === 0) {
    return { success: true, message: "Sem alterações" };
  }

  if (updateData.priceModifier !== undefined) {
    updateData.priceModifier = toPriceString(updateData.priceModifier);
  }

  await db.update(dishSizes)
    .set(updateData)
    .where(eq(dishSizes.id, Number(id)));

  return { success: true };
}

export async function deleteDishSize(id: number | string) {
  const db = await getDb();
  await db.execute(sql`DELETE FROM size_accompaniment_groups WHERE size_id = ${Number(id)}`);
  await db.delete(dishSizes).where(eq(dishSizes.id, Number(id)));
  return { success: true };
}

// ===================================================================
// 2) ACCOMPANIMENT GROUPS (GRUPOS)
// ===================================================================

export async function getAllAccompanimentGroups() {
  const db = await getDb();
  const result = await db.select().from(accompanimentGroups).orderBy(asc(accompanimentGroups.name));
  return result.map((g: any) => ({ 
    ...g, 
    id: Number(g.id),
    maxSelections: Number(g.maxSelections || 1)
  }));
}

export async function createAccompanimentGroup(data: any) {
  const db = await getDb();
  const [result]: any = await db.insert(accompanimentGroups).values({
    name: data.name,
    slug: generateSlug(data.name),
    description: data.description || null,
    maxSelections: data.maxSelections ?? 1,
    isActive: true,
  });
  return { success: true, id: result.insertId };
}

// ===================================================================
// 3) ACCOMPANIMENT OPTIONS (OPÇÕES MASTER)
// ===================================================================

export async function getAccompanimentOptionsByGroup(groupId: number | string) {
  const db = await getDb();
  return await db.select()
    .from(accompanimentOptions)
    .where(sql`JSON_CONTAINS(${accompanimentOptions.groupsConfig}, JSON_OBJECT('group_id', ${Number(groupId)}))`);
}

export async function updateAccompanimentOption(id: number | string, data: any) {
  const db = await getDb();
  const { id: _, ...updateData } = data;
  
  if (Object.keys(updateData).length === 0) return { success: true };

  if (updateData.priceModifier !== undefined) {
    updateData.priceModifier = toPriceString(updateData.priceModifier);
  }
  
  return await db.update(accompanimentOptions)
    .set(updateData)
    .where(eq(accompanimentOptions.id, Number(id)));
}

// ===================================================================
// 4) VÍNCULOS (TAMANHO <-> GRUPO)
// ===================================================================

export async function linkAccompanimentToSize(data: { sizeId: number | string, groupId: number | string }) {
  const db = await getDb();
  await db.execute(sql`
    INSERT INTO size_accompaniment_groups (size_id, accompaniment_group_id) 
    VALUES (${Number(data.sizeId)}, ${Number(data.groupId)})
    ON DUPLICATE KEY UPDATE size_id = size_id
  `);
  return { success: true };
}

export async function unlinkAccompanimentFromSize(sizeId: number | string, groupId: number | string) {
  const db = await getDb();
  await db.execute(sql`
    DELETE FROM size_accompaniment_groups 
    WHERE size_id = ${Number(sizeId)} AND accompaniment_group_id = ${Number(groupId)}
  `);
  return { success: true };
}

// ===================================================================
// 5) AUXILIARES
// ===================================================================

export async function getPaginatedDishes() {
  const db = await getDb();
  return await db.select().from(dishes).orderBy(desc(dishes.id)).limit(100); 
}

export async function getLocalCategories() {
  const db = await getDb();
  return db.select().from(categories).orderBy(asc(categories.name));
}