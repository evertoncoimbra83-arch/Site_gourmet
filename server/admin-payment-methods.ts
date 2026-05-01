import { eq, asc } from "drizzle-orm";
import { getDb } from "./db";
import { 
    paymentMethods, 
    foodCardBrands, 
} from "../drizzle/schema/index"; 
import crypto from "crypto";

// Tipos base sincronizados com o Schema
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;
export type FoodCardBrand = typeof foodCardBrands.$inferSelect;
export type InsertFoodCardBrand = typeof foodCardBrands.$inferInsert;

// =========================================================================
// 1. MÉTODOS DE PAGAMENTO (CRUD)
// =========================================================================

/**
 * Lista todos os métodos de pagamento (incluindo inativos) para o admin.
 */
export async function listAllPaymentMethods(): Promise<PaymentMethod[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
        .select()
        .from(paymentMethods)
        .orderBy(asc(paymentMethods.displayOrder), asc(paymentMethods.name));
}

/**
 * Cria um novo método de pagamento.
 */
export async function createPaymentMethod(data: Omit<InsertPaymentMethod, 'id'>) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const newId = crypto.randomUUID();

    // ✅ CORREÇÃO: Removido 'any' e usado o tipo de inserção correto do Drizzle
    await db.insert(paymentMethods).values({
        ...(data as InsertPaymentMethod),
        id: newId,
    });
    
    return { id: newId };
}

/**
 * Atualiza um método de pagamento existente.
 */
export async function updatePaymentMethod(id: string, data: Partial<InsertPaymentMethod>) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // ✅ CORREÇÃO TS2561: Alterado 'updated_at' para 'updatedAt' conforme o Schema do Drizzle
    await db.update(paymentMethods)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(paymentMethods.id, id));
    
    return { success: true };
}

/**
 * Remove um método de pagamento.
 */
export async function deletePaymentMethod(id: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    
    return { success: true };
}

// =========================================================================
// 2. BANDEIRAS DE CARTÃO-REFEIÇÃO (CRUD)
// =========================================================================

/**
 * Lista todas as marcas de cartão-refeição (admin).
 */
export async function listFoodCardBrands(): Promise<FoodCardBrand[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
        .select()
        .from(foodCardBrands)
        .orderBy(asc(foodCardBrands.name));
}

/**
 * Cria uma nova marca de cartão-refeição.
 */
export async function createFoodCardBrand(data: Omit<InsertFoodCardBrand, 'id'>) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const newId = crypto.randomUUID();

    // ✅ CORREÇÃO: Removido 'any' e usado cast para o tipo de inserção do Schema
    await db.insert(foodCardBrands).values({
        ...(data as InsertFoodCardBrand),
        id: newId
    });
    
    return { id: newId };
}

/**
 * Remove uma marca de cartão-refeição.
 */
export async function deleteFoodCardBrand(id: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(foodCardBrands).where(eq(foodCardBrands.id, id)); 
    
    return { success: true };
}

// =========================================================================
// 3. FUNÇÃO AUXILIAR PARA O FRONTEND
// =========================================================================

/**
 * Retorna os métodos ativos (usado pelo public router)
 */
export async function listPaymentMethods(): Promise<PaymentMethod[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.isActive, true))
        .orderBy(asc(paymentMethods.displayOrder));
}