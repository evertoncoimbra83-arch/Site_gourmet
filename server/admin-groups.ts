import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { accompanimentGroups, groupToOptions } from "../drizzle/schema";

export async function updateAccompanimentGroup(id: number, data: Record<string, unknown>) {
  const db = await getDb();
  
  // ✅ Garante que o items_order seja uma String JSON válida antes de ir pro MySQL
  const itemsOrderJson = Array.isArray(data.itemsOrder) 
    ? JSON.stringify(data.itemsOrder) 
    : (typeof data.itemsOrder === 'string' ? data.itemsOrder : "[]");

  const payload = {
    name: data.name as string,
    isActive: data.isActive ? 1 : 0,
    minSelections: Number(data.minSelections || 0),
    maxSelections: Number(data.maxSelections || 1),
    itemsOrder: itemsOrderJson, // Coluna longtext no banco
    updatedAt: new Date()
  };

  await db.update(accompanimentGroups)
    .set(payload as Record<string, unknown>)
    .where(eq(accompanimentGroups.id, id));

  // ✅ Sincroniza a tabela pivot groupToOptions (Para Joins rápidos)
  if (Array.isArray(data.itemsOrder)) {
    await db.delete(groupToOptions).where(eq(groupToOptions.groupId, id));
    
    const optionIds = data.itemsOrder
      .map((o: Record<string, unknown>) => o.group_id || o.id)
      .filter(Boolean);
    
    if (optionIds.length > 0) {
      const entries = optionIds.map((optId: unknown) => ({
        groupId: id,
        optionId: Number(optId)
      }));
      await db.insert(groupToOptions).values(entries);
    }
  }

  return { success: true };
}