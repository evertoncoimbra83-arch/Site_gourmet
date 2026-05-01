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

function toPriceString(price: string | number | null | undefined): string {
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

function ensureValidJson(data: any): any[] {
  if (!data) return [];
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return []; }
  }
  return data;
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
  
  return result.map((size) => ({
    ...size,
    id: Number(size.id),
    priceModifier: Number(size.priceModifier || 0),
    displayOrder: Number(size.displayOrder || 0),
    description: size.description || "", 
    isActive: Boolean(size.isActive),
    groupsOrder: ensureValidJson(size.groupsOrder)
  }));
}

export async function createDishSize(data: {
  name: string;
  weight?: string | number | null;
  description?: string | null;
  iconKey?: string | null;
  priceModifier?: string | number;
  displayOrder?: number;
  isActive?: boolean;
  groupsOrder?: number[];
}) {
  const db = await getDb();
  const [result]: any = await db.insert(dishSizes).values({
    name: data.name,
    weight: data.weight ? String(data.weight) : null,
    description: data.description ?? null,
    iconKey: data.iconKey ?? "Cube",
    priceModifier: toPriceString(data.priceModifier),
    displayOrder: Number(data.displayOrder ?? 0),
    isActive: data.isActive ?? true,
    groupsOrder: data.groupsOrder || [],
  });
  return { success: true, id: result.insertId };
}

export async function updateDishSize(id: number | string, data: any) {
  const db = await getDb();
  const { id: _, ...rest } = data;

  const payload: any = {
    ...rest,
    updatedAt: new Date()
  };

  if (rest.priceModifier !== undefined) payload.priceModifier = toPriceString(rest.priceModifier);
  if (rest.displayOrder !== undefined) payload.displayOrder = Number(rest.displayOrder);
  
  if (rest.groupsOrder !== undefined) {
    payload.groupsOrder = Array.isArray(rest.groupsOrder) ? rest.groupsOrder : [];
  }

  await db.update(dishSizes)
    .set(payload)
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
  return result.map((g) => ({ 
    ...g, 
    id: Number(g.id),
    maxSelections: Number(g.maxSelections || 1),
    itemsOrder: ensureValidJson(g.itemsOrder)
  }));
}

export async function updateAccompanimentGroup(id: number | string, data: any) {
  const db = await getDb();
  const { id: _, ...rest } = data;

  const payload: any = {
    ...rest,
    updatedAt: new Date()
  };

  if (rest.itemsOrder !== undefined) {
    payload.itemsOrder = Array.isArray(rest.itemsOrder) ? rest.itemsOrder : [];
  }

  await db.update(accompanimentGroups)
    .set(payload)
    .where(eq(accompanimentGroups.id, Number(id)));

  return { success: true };
}

// ===================================================================
// 3) ACCOMPANIMENT OPTIONS (OPÇÕES MASTER)
// ===================================================================

export async function getAccompanimentOptionsByGroup(groupId: number | string) {
  const db = await getDb();
  
  const [group]: any = await db.select().from(accompanimentGroups).where(eq(accompanimentGroups.id, Number(groupId))).limit(1);
  const orderArray = ensureValidJson(group?.itemsOrder);

  const items = await db.select()
    .from(accompanimentOptions)
    .where(sql`JSON_CONTAINS(${accompanimentOptions.groupsConfig}, JSON_OBJECT('group_id', ${Number(groupId)}))`);

  if (orderArray && orderArray.length > 0) {
    return items.sort((a: any, b: any) => {
      const posA = orderArray.indexOf(Number(a.id));
      const posB = orderArray.indexOf(Number(b.id));
      const indexA = posA === -1 ? 999 : posA;
      const indexB = posB === -1 ? 999 : posB;
      return indexA - indexB;
    });
  }

  return items;
}

export async function updateAccompanimentOption(id: number | string, data: any) {
  const db = await getDb();
  const { id: _, ...updateData } = data;

  const payload: any = { ...updateData, updatedAt: new Date() };

  if (updateData.priceModifier !== undefined) payload.priceModifier = toPriceString(updateData.priceModifier);
  if (updateData.proteins !== undefined) payload.proteins = String(updateData.proteins);
  if (updateData.carbs !== undefined) payload.carbs = String(updateData.carbs);
  if (updateData.fatTotal !== undefined) payload.fatTotal = String(updateData.fatTotal);

  return await db.update(accompanimentOptions)
    .set(payload)
    .where(eq(accompanimentOptions.id, Number(id)));
}

// ===================================================================
// 4) VÍNCULOS
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

export async function getPaginatedDishes() {
  const db = await getDb();
  return await db.select().from(dishes).orderBy(desc(dishes.id)).limit(100); 
}

export async function getLocalCategories() {
  const db = await getDb();
  return db.select().from(categories).orderBy(asc(categories.name));
}