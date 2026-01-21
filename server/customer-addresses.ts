import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db.js";
// ✅ Sincronizado com o export 'userAddresses' do schema modular
import { userAddresses } from "./../drizzle/schema.js"; 
import { encrypt } from "./encryption.js"; 

// ✅ Tipagem baseada no schema atualizado
export type CustomerAddress = typeof userAddresses.$inferSelect;
export type InsertCustomerAddress = typeof userAddresses.$inferInsert;

// --- Funções Auxiliares de Criptografia ---

function normalizeRequired(value: unknown, fieldName: string): string {
  const s = String(value ?? "").trim();
  if (!s) throw new Error(`Campo obrigatório vazio: ${fieldName}`);
  return s;
}

function normalizeOptional(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function encRequired(value: unknown, fieldName: string): string {
  const s = normalizeRequired(value, fieldName);
  return encrypt(s) ?? s;
}

function encOptional(value: unknown): string | null {
  const s = normalizeOptional(value);
  if (!s) return null;
  return encrypt(s) ?? s;
}

// --- Lógica de Negócio ---

/**
 * LISTAGEM: Busca todos os endereços do usuário
 */
export async function listAddressesByUserId(userId: number): Promise<CustomerAddress[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt)) as CustomerAddress[];
}

/**
 * RESET: Remove o status de 'padrão' de todos os endereços do usuário
 */
export async function unmarkAllAsDefault(userId: number): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userAddresses)
    .set({ isDefault: false })
    .where(eq(userAddresses.userId, userId));

  return { success: true };
}

/**
 * CRIAÇÃO: Adiciona novo endereço com criptografia AES-GCM
 */
export async function createAddress(
  data: {
    userId: number;
    label?: string | null;
    address?: string;
    street?: string; 
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string | null;
    isDefault?: boolean;
  }
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rawAddress = data.address || data.street;
  if (!rawAddress) throw new Error("Endereço (rua) é obrigatório");

  // Verifica se é o primeiro endereço para torná-lo padrão automaticamente
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userAddresses)
    .where(eq(userAddresses.userId, data.userId));

  const isFirst = Number(row?.count ?? 0) === 0;
  const shouldBeDefault = Boolean(data.isDefault) || isFirst;

  if (shouldBeDefault) {
    await unmarkAllAsDefault(data.userId);
  }

  // 1. Criptografia dos campos sensíveis
  const finalInsertData = {
    userId: data.userId, 
    label: encOptional(data.label) ?? encOptional("Casa") ?? "Casa",
    address: encRequired(rawAddress, "address"),
    number: encRequired(data.number, "number"),
    complement: encOptional(data.complement),
    neighborhood: encRequired(data.neighborhood, "neighborhood"),
    city: encRequired(data.city, "city"),
    state: encRequired(data.state, "state"),
    zipCode: encRequired(data.zipCode, "zipCode"),
    phone: encOptional(data.phone),
    isDefault: shouldBeDefault,
  };

  const [result]: any = await db.insert(userAddresses).values(finalInsertData);
  const insertId = result?.insertId;

  if (!insertId) throw new Error("Falha ao obter insertId no MariaDB");

  return { id: Number(insertId) };
}

/**
 * ATUALIZAÇÃO: Atualiza campos específicos do endereço
 */
export async function updateAddress(
  id: number,
  userId: number,
  data: Partial<any>
): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.isDefault) {
    await unmarkAllAsDefault(userId);
  }

  const finalUpdateData: any = {};

  // Mapeamento e criptografia seletiva
  if (data.label !== undefined) finalUpdateData.label = encOptional(data.label);
  if (data.address !== undefined || data.street !== undefined) {
    finalUpdateData.address = encRequired(data.address || data.street, "address");
  }
  if (data.number !== undefined) finalUpdateData.number = encRequired(data.number, "number");
  if (data.complement !== undefined) finalUpdateData.complement = encOptional(data.complement);
  if (data.neighborhood !== undefined) finalUpdateData.neighborhood = encRequired(data.neighborhood, "neighborhood");
  if (data.city !== undefined) finalUpdateData.city = encRequired(data.city, "city");
  if (data.state !== undefined) finalUpdateData.state = encRequired(data.state, "state");
  if (data.zipCode !== undefined) finalUpdateData.zipCode = encRequired(data.zipCode, "zipCode");
  if (data.phone !== undefined) finalUpdateData.phone = encOptional(data.phone);
  if (data.isDefault !== undefined) finalUpdateData.isDefault = data.isDefault;

  if (Object.keys(finalUpdateData).length === 0) return { success: true };

  await db
    .update(userAddresses)
    .set(finalUpdateData)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));

  return { success: true };
}

/**
 * EXCLUSÃO: Remove o endereço se não estiver vinculado a pedidos
 */
export async function deleteAddress(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    return await db.delete(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
  } catch (error: any) {
    throw new Error("Não é possível deletar: endereço vinculado a pedidos anteriores.");
  }
}

/**
 * BUSCA PADRÃO: Retorna o endereço principal para o checkout
 */
export async function getDefaultAddress(userId: number): Promise<CustomerAddress | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [defaultAddress] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true)))
    .limit(1);

  return (defaultAddress as CustomerAddress) || null;
}