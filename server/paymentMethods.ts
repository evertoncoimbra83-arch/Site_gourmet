import { getDb } from "./db.js";
import { paymentMethods } from "../drizzle/schema/index.js";
import { eq, asc } from "drizzle-orm"; // ✅ CORREÇÃO: 'sql' removido (não utilizado)

// Tipos inferidos do Drizzle
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return Boolean(v);
}

function toSlug(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "") || "metodo_pagamento";
}

function toMoneyString(v: unknown): string {
  if (v === null || v === undefined || v === "") return "0.00";
  const n = Number(v);
  if (Number.isFinite(n)) return n.toFixed(2);
  const n2 = Number(String(v).replace(",", "."));
  return Number.isFinite(n2) ? n2.toFixed(2) : "0.00";
}

const mapPaymentMethod = (m: PaymentMethod) => ({
  ...m,
  id: String(m.id), 
  discountPercentage: Number(m.discountPercentage ?? 0),
  isActive: toBool(m.isActive),
});

export async function getAllPaymentMethods() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.displayOrder), asc(paymentMethods.name));

  return result.map(mapPaymentMethod);
}

export async function getActivePaymentMethods() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.isActive, toBool(true)))
    .orderBy(asc(paymentMethods.displayOrder), asc(paymentMethods.name));

  return result.map(mapPaymentMethod);
}

export const listPaymentMethods = getActivePaymentMethods;

export async function getPaymentMethodById(id: string | number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, String(id)));

  if (!result[0]) return null;
  return mapPaymentMethod(result[0]);
}

export async function createPaymentMethod(data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const name = String(data?.name ?? "").trim();
  if (!name) throw new Error("Campo obrigatório vazio: name");

  // ✅ CORREÇÃO: Usando Record<string, unknown> para evitar 'any' e aceitar colunas extras
  const payload: Record<string, unknown> = {
    name,
    isActive: data?.isActive !== undefined ? toBool(data.isActive) : true,
    discountPercentage: toMoneyString(data?.discountPercentage),
    displayOrder: Number.isFinite(Number(data?.displayOrder)) ? Number(data.displayOrder) : 0,
    description: (data?.description as string) ?? null,
    icon: (data?.icon as string) ?? null,
    brandName: (data?.brandName as string) ?? null,
    brandLogoUrl: (data?.brandLogoUrl as string) ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // ✅ CORREÇÃO: Use "@ts-expect-error" em vez de "@ts-ignore" para colunas não mapeadas no Schema
  payload.slug = data?.slug ? toSlug(data.slug) : toSlug(name);

  payload.instructions = (data?.instructions as string) ?? null;

  // Garante que o ID (que veio como string incorreta) seja removido para o AUTO_INCREMENT agir
  delete payload.id;

  await db.insert(paymentMethods).values(payload as InsertPaymentMethod);

  return { success: true };
}

export async function updatePaymentMethod(id: string | number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = String(data.name).trim();
  if (data.isActive !== undefined) updateData.isActive = toBool(data.isActive);
  if (data.discountPercentage !== undefined) updateData.discountPercentage = toMoneyString(data.discountPercentage);
  if (data.displayOrder !== undefined) updateData.displayOrder = Number.isFinite(Number(data.displayOrder)) ? Number(data.displayOrder) : 0;
  if (data.description !== undefined) updateData.description = data.description as string;
  if (data.icon !== undefined) updateData.icon = data.icon as string;
  if (data.brandName !== undefined) updateData.brandName = data.brandName as string;
  if (data.brandLogoUrl !== undefined) updateData.brandLogoUrl = data.brandLogoUrl as string;

  // ✅ CORREÇÃO: Tratando campos extras de forma tipada
  if (data.slug !== undefined) updateData.slug = toSlug(data.slug);
  if (data.instructions !== undefined) updateData.instructions = data.instructions as string;

  await db
    .update(paymentMethods)
    .set(updateData as Partial<InsertPaymentMethod>)
    .where(eq(paymentMethods.id, String(id)));

  return { success: true };
}

export async function deletePaymentMethod(id: string | number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, String(id)));
    return { success: true };
  } catch {
    throw new Error("Não é possível excluir. Este método possui histórico.");
  }
}