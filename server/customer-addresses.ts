/* eslint-disable @typescript-eslint/ban-ts-comment */
// server/routers/storefront/customer-addresses.ts

import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db.js"; 
import { userAddresses } from "../drizzle/schema/index.js"; 
import { encrypt, normalizeDigits } from "./encryption.js"; 
import crypto from "crypto";

// ✅ Tipagem baseada no schema oficial
export type CustomerAddress = typeof userAddresses.$inferSelect;
export type InsertCustomerAddress = typeof userAddresses.$inferInsert;

// --- Funções Auxiliares de Sanitização ---

function normalizeRequired(value: unknown, fieldName: string): string {
  const s = String(value ?? "").trim();
  if (!s) throw new Error(`Campo obrigatório vazio: ${fieldName}`);
  return s;
}

function normalizeOptional(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

/**
 * ✅ CORREÇÃO: Garante retorno de string. 
 * Se o encrypt retornar null, lança erro para evitar quebra no DB.
 */
function encRequired(value: unknown, fieldName: string): string {
  const s = normalizeRequired(value, fieldName);
  const encrypted = encrypt(s);
  if (!encrypted) throw new Error(`Falha ao processar dados de segurança: ${fieldName}`);
  return encrypted; 
}

function encOptional(value: unknown): string | null {
  const s = normalizeOptional(value);
  if (!s) return null;
  return encrypt(s); // Aqui pode ser null pois o campo no DB aceita null
}

// --- Lógica de Negócio (Camada de Persistência) ---

/**
 * LISTAGEM: Busca todos os endereços do usuário
 */
export async function listAddressesByUserId(userId: string): Promise<CustomerAddress[]> {
  const db = await getDb();
  return await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));
}

/**
 * RESET: Remove o status de 'padrão' de todos os endereços do usuário
 */
export async function unmarkAllAsDefault(userId: string): Promise<{ success: boolean }> {
  const db = await getDb();
  
  await db
    .update(userAddresses)
    .set({ isDefault: false })
    .where(eq(userAddresses.userId, userId));

  return { success: true };
}

/**
 * CRIAÇÃO: Adiciona novo endereço com criptografia
 */
export async function createAddress(
  data: {
    userId: string;
    label?: string | null;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string | null;
    isDefault?: boolean;
  }
): Promise<{ id: string }> {
  const db = await getDb();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userAddresses)
    .where(eq(userAddresses.userId, data.userId));

  const isFirst = Number(result?.count ?? 0) === 0;
  const shouldBeDefault = Boolean(data.isDefault) || isFirst;

  if (shouldBeDefault) {
    await unmarkAllAsDefault(data.userId);
  }

  const newId = crypto.randomUUID();

  const insertData: InsertCustomerAddress = {
    id: newId,
    userId: data.userId, 
    label: encOptional(data.label || "Entrega"),
    street: encRequired(data.street, "rua"),
    number: encRequired(data.number, "número"),
    complement: encOptional(data.complement),
    neighborhood: encRequired(data.neighborhood, "bairro"),
    city: encRequired(data.city, "cidade"),
    state: encRequired(data.state, "estado"),
    zipCode: encRequired(normalizeDigits(data.zipCode), "CEP"),
    phone: encOptional(data.phone ? normalizeDigits(data.phone) : null),
    isDefault: shouldBeDefault,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.insert(userAddresses).values(insertData);

  return { id: newId };
}

/**
 * ATUALIZAÇÃO
 */
export async function updateAddress(
  id: string,
  userId: string,
  data: Partial<{
    label: string | null;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
    isDefault: boolean;
  }>
): Promise<{ success: boolean }> {
  const db = await getDb();

  if (data.isDefault) {
    await unmarkAllAsDefault(userId);
  }

  const updateValues: Partial<InsertCustomerAddress> = {
    updatedAt: new Date()
  };

  if (data.label !== undefined) updateValues.label = encOptional(data.label);
  if (data.street !== undefined) updateValues.street = encRequired(data.street, "rua");
  if (data.number !== undefined) updateValues.number = encRequired(data.number, "número");
  if (data.complement !== undefined) updateValues.complement = encOptional(data.complement);
  if (data.neighborhood !== undefined) updateValues.neighborhood = encRequired(data.neighborhood, "bairro");
  if (data.city !== undefined) updateValues.city = encRequired(data.city, "cidade");
  if (data.state !== undefined) updateValues.state = encRequired(data.state, "estado");
  if (data.zipCode !== undefined) updateValues.zipCode = encRequired(normalizeDigits(data.zipCode), "CEP");
  if (data.phone !== undefined) updateValues.phone = encOptional(data.phone ? normalizeDigits(data.phone) : null);
  if (data.isDefault !== undefined) updateValues.isDefault = Boolean(data.isDefault);

  const res = await db
    .update(userAddresses)
    .set(updateValues)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));

  // @ts-ignore
  if (res[0]?.affectedRows === 0) {
    throw new Error("Endereço não encontrado ou acesso negado.");
  }

  return { success: true };
}

/**
 * EXCLUSÃO
 */
export async function deleteAddress(id: string, userId: string) {
  const db = await getDb();
  try {
    const res = await db.delete(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
      
    // @ts-ignore
    if (res[0]?.affectedRows === 0) {
      throw new Error("Endereço não encontrado ou acesso negado.");
    }
    
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.message.includes("acesso negado")) throw err;
    throw new Error("Não é possível deletar: este endereço possui pedidos vinculados.");
  }
}

/**
 * BUSCA PADRÃO
 */
export async function getDefaultAddress(userId: string): Promise<CustomerAddress | null> {
  const db = await getDb();
  const [defaultAddress] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true)))
    .limit(1);

  return defaultAddress || null;
}