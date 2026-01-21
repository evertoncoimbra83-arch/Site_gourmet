import { getDb } from "./db.js";
import { paymentMethods, foodCardBrands } from "../drizzle/schema.js"; 
import { eq, asc, sql } from "drizzle-orm";
import crypto from "crypto";

// Tipos inferidos do Drizzle
export type PaymentMethod = typeof paymentMethods.$inferSelect;

/**
 * ✅ HELPER DE MAPEAMENTO REVISADO
 * Removido o Number(m.id) pois o ID no banco agora é uma String (UUID).
 */
const mapPaymentMethod = (m: any) => ({
    ...m,
    // Se o banco usa String, mantemos como String para evitar erros de referência
    id: String(m.id),
    discountPercentage: Number(m.discountPercentage || 0),
    isActive: m.isActive === 1 || m.isActive === true || m.isActive === "1"
});

// --- LEITURA ---

export async function getAllPaymentMethods() {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    const result = await db.select()
        .from(paymentMethods)
        .orderBy(asc(paymentMethods.displayOrder), asc(paymentMethods.name));

    return result.map(mapPaymentMethod);
}

export async function getActivePaymentMethods() {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    const result = await db.select()
        .from(paymentMethods)
        .where(sql`${paymentMethods.isActive} = 1`) 
        .orderBy(asc(paymentMethods.displayOrder));

    return result.map(mapPaymentMethod);
}

/**
 * ✅ CORREÇÃO: O parâmetro 'id' agora é String
 */
export async function getPaymentMethodById(id: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    const result = await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, id));
        
    if (!result[0]) return null;
    return mapPaymentMethod(result[0]);
}

// --- ESCRITA ---

export async function createPaymentMethod(data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 

    // ✅ Gerando UUID manual para o ID de String
    const newId = crypto.randomUUID();

    await db.insert(paymentMethods).values({
        id: newId,
        name: data.name,
        isActive: data.isActive ?? true, 
        discountPercentage: data.discountPercentage ? String(data.discountPercentage) : "0.00",
        displayOrder: data.displayOrder ?? 0,
        description: data.description || null,
        icon: data.icon || null,
        brandName: data.brandName || null,
        brandLogoUrl: data.brandLogoUrl || null,
    } as any); 
    
    return { success: true, id: newId };
}

/**
 * ✅ CORREÇÃO: O parâmetro 'id' agora é String
 */
export async function updatePaymentMethod(id: string, data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 

    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.discountPercentage !== undefined) updateData.discountPercentage = String(data.discountPercentage);
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.brandName !== undefined) updateData.brandName = data.brandName;
    if (data.brandLogoUrl !== undefined) updateData.brandLogoUrl = data.brandLogoUrl;

    await db.update(paymentMethods)
        .set({
            ...updateData,
            updatedAt: new Date() 
        })
        .where(eq(paymentMethods.id, id));
        
    return { success: true };
}

/**
 * ✅ CORREÇÃO: O parâmetro 'id' agora é String
 */
export async function deletePaymentMethod(id: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    try {
        await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
        return { success: true };
    } catch (e) {
        throw new Error("Não é possível excluir. Este método pode estar vinculado a pedidos. Tente desativar.");
    }
}

export async function listFoodCardBrands() {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    return await db.select().from(foodCardBrands).orderBy(asc(foodCardBrands.name));
}