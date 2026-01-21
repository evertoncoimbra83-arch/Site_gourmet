import { eq, desc, asc, and } from "drizzle-orm";
import { getDb } from "./db";
import { 
    paymentMethods, 
    foodCardBrands, 
    orders 
} from "../drizzle/schema"; 
import { z } from "zod";

// Tipos base (assumindo que estes tipos são exportados pelo seu schema, o que corrigimos)
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

    const methodData = {
        ...data,
        // Converte o valor do minAmount para string (decimal no DB)
        minAmount: data.minAmount.toString(), 
    };

    const [newMethod] = await db.insert(paymentMethods).values(methodData as any);
    
    return newMethod;
}

/**
 * Atualiza um método de pagamento existente.
 */
export async function updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const updateData: any = { ...data };

    if (updateData.minAmount !== undefined) {
        updateData.minAmount = updateData.minAmount.toString();
    }
    
    await db.update(paymentMethods).set(updateData).where(eq(paymentMethods.id, id));
    
    return { success: true };
}

/**
 * Remove um método de pagamento.
 */
export async function deletePaymentMethod(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Lógica para desativar em vez de deletar, se houver pedidos
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

    const [newBrand] = await db.insert(foodCardBrands).values(data as any);
    
    return newBrand;
}

/**
 * Remove uma marca de cartão-refeição.
 */
export async function deleteFoodCardBrand(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(foodCardBrands).where(eq(foodCardBrands.id, id));
    
    return { success: true };
}

// =========================================================================
// 3. FUNÇÃO AUXILIAR PARA O FRONTEND (listPaymentMethods)
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