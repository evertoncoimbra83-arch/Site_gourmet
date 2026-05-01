import { asc, eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { 
  dishSizes, 
  sizeAccompanimentGroups, 
  dishesToSizes 
} from "../drizzle/schema/index";
import { safeInteger, safeJsonParse, safeNumber } from "./lib/safe-parse";

// ===================================================================
// HELPERS LOCAIS
// ===================================================================

function toPriceString(price: unknown): string {
  if (price === undefined || price === null || price === "") return "0.00";
  const normalized = typeof price === "string" ? price.replace(",", ".") : price;
  const num = safeNumber(normalized, Number.NaN);
  if (!Number.isFinite(num) || num < 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Valor monetÃ¡rio invÃ¡lido." });
  }
  return num.toFixed(2);
}

function ensureValidJson(data: unknown): number[] {
  if (!data) return [];
  if (typeof data === 'string') {
    const parsed = safeJsonParse<unknown>(data, []);
    return Array.isArray(parsed) ? parsed : [];
  }
  return Array.isArray(data) ? data : [];
}

// ===================================================================
// LÓGICA DE TAMANHOS (SIZES)
// ===================================================================

export async function getAllDishSizes() {
  const db = await getDb();
  const result = await db.select().from(dishSizes).orderBy(asc(dishSizes.displayOrder));
  
  return result.map((size) => ({
    ...size,
    id: safeInteger(size.id),
    isActive: Boolean(size.isActive),
    priceModifier: size.priceModifier || "0.00",
    mainDishWeight: size.mainDishWeight || "200.00",
    groupsOrder: ensureValidJson(size.groupsOrder)
  }));
}

export async function upsertDishSize(data: Record<string, unknown>) {
  const db = await getDb();
  const id = data.id ? safeInteger(data.id, Number.NaN) : null;
  if (data.id && !Number.isFinite(id)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "ID do tamanho invÃ¡lido." });
  }

  // ✅ CORREÇÃO: Usando disable-next-line para silenciar o linter no cast necessário
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    name: data.name as string,
    weight: (data.weight as string) || null,
    price: toPriceString(data.price),
    priceModifier: toPriceString(data.priceModifier),
    mainDishWeight: toPriceString(data.mainDishWeight || 200),
    iconKey: (data.iconKey as string) || "Box",
    color: (data.color as string) || "slate",
    isActive: Boolean(data.isActive),
    description: (data.description as string) || null,
    groupsOrder: JSON.stringify(ensureValidJson(data.groupsOrder)),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(dishSizes).set(payload).where(eq(dishSizes.id, id));
    return { success: true, id };
  } else {
    const insertPayload = {
      ...payload,
      displayOrder: 0,
      createdAt: new Date()
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [res]: any = await db.insert(dishSizes).values(insertPayload);
    
    const insertId = res?.insertId || (Array.isArray(res) ? res[0]?.insertId : null);
    
    return { success: true, id: insertId };
  }
}

export async function deleteDishSize(id: number) {
  const db = await getDb();
  
  return await db.transaction(async (tx) => {
    await tx.delete(sizeAccompanimentGroups).where(eq(sizeAccompanimentGroups.sizeId, id));
    await tx.delete(dishesToSizes).where(eq(dishesToSizes.sizeId, id));
    return await tx.delete(dishSizes).where(eq(dishSizes.id, id));
  });
}

// ===================================================================
// VÍNCULOS DE TAMANHO COM GRUPOS (Link/Unlink)
// ===================================================================

export async function toggleSizeGroupLink(sizeId: number, groupId: number) {
  const db = await getDb();

  const [existing] = await db.select()
    .from(sizeAccompanimentGroups)
    .where(and(
      eq(sizeAccompanimentGroups.sizeId, sizeId),
      eq(sizeAccompanimentGroups.accompanimentGroupId, groupId)
    ))
    .limit(1);

  if (existing) {
    await db.delete(sizeAccompanimentGroups)
      .where(and(
        eq(sizeAccompanimentGroups.sizeId, sizeId),
        eq(sizeAccompanimentGroups.accompanimentGroupId, groupId)
      ));
  } else {
    await db.insert(sizeAccompanimentGroups).values({
      sizeId,
      accompanimentGroupId: groupId
    });
  }

  const currentGroups = await db.select({ id: sizeAccompanimentGroups.accompanimentGroupId })
    .from(sizeAccompanimentGroups)
    .where(eq(sizeAccompanimentGroups.sizeId, sizeId));

  const newOrder = currentGroups.map(g => g.id);

  // ✅ CORREÇÃO: Silenciando o linter no cast de sincronização da ordem
  await db.update(dishSizes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set({ groupsOrder: JSON.stringify(newOrder) } as any)
    .where(eq(dishSizes.id, sizeId));

  return { success: true, linked: !existing };
}
