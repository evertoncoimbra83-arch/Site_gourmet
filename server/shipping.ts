import { eq, asc } from "drizzle-orm";
import { getDb } from "./db"; 
import { shippingRules } from "../drizzle/schema"; 

// Tipos base baseados no schema do Drizzle
export type ShippingZone = typeof shippingRules.$inferSelect;
export type InsertShippingZone = typeof shippingRules.$inferInsert;

// =========================================================================
// 1. LÓGICA DE APLICAÇÃO (Acessível por Usuários Comuns)
// =========================================================================

/**
 * Retorna as zonas de entrega ativas.
 */
export async function listActiveZones(): Promise<ShippingZone[]> {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    return db
        .select()
        .from(shippingRules)
        .where(eq(shippingRules.isActive, true))
        .orderBy(asc(shippingRules.shippingCost));
}

/**
 * Encontra a zona de entrega mais adequada para um CEP.
 */
export async function findZoneByZipCode(zipCode: string): Promise<ShippingZone | null> {
    const activeZones = await listActiveZones();
    const zipCodeNumeric = parseInt(zipCode.replace(/\D/g, ""), 10);
    
    const matchingZone = activeZones.find(zone => {
        if (zone.zipCodeStart && zone.zipCodeEnd) {
            const start = parseInt(zone.zipCodeStart.replace(/\D/g, ""), 10);
            const end = parseInt(zone.zipCodeEnd.replace(/\D/g, ""), 10);
            return zipCodeNumeric >= start && zipCodeNumeric <= end;
        }
        return false; 
    });

    return matchingZone || null;
}

/**
 * Calcula o custo de frete.
 */
export async function calculateShippingCost(zipCode: string): Promise<{ cost: number; name: string | null }> {
    const zone = await findZoneByZipCode(zipCode);

    if (!zone) {
        return { cost: -1, name: "Fora da área de entrega" };
    }

    return { 
        cost: parseFloat(String(zone.shippingCost || "0")), 
        name: zone.name || "Entrega padrão"
    };
}


// =========================================================================
// 2. ADMIN (CRUD - Apenas para administradores)
// =========================================================================

/**
 * Cria uma nova zona de entrega.
 */
export async function createZone(data: Omit<InsertShippingZone, "id">) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    // Tipagem segura para acessar propriedades que podem vir com nomes diferentes do Admin
    const rawData = data as Record<string, unknown>;

    const zoneData: InsertShippingZone = {
        ...data,
        shippingCost: String(rawData.price || rawData.shippingCost || "0.00"),
        zipCodeStart: String(rawData.cepStart || rawData.zipCodeStart || ""), 
        zipCodeEnd: String(rawData.cepEnd || rawData.zipCodeEnd || ""),
    };

    await db.insert(shippingRules).values(zoneData);
    
    return { success: true };
}

/**
 * Atualiza uma zona de entrega.
 */
export async function updateZone(id: string | number, data: Partial<InsertShippingZone>) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...rest } = data;
    const rawData = data as Record<string, unknown>;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...rest };

    if (rawData.price !== undefined) updateData.shippingCost = String(rawData.price);
    if (rawData.cepStart !== undefined) updateData.zipCodeStart = String(rawData.cepStart).replace(/\D/g, "");
    if (rawData.cepEnd !== undefined) updateData.zipCodeEnd = String(rawData.cepEnd).replace(/\D/g, "");
    
    updateData.updatedAt = new Date();

    await db.update(shippingRules)
        .set(updateData)
        .where(eq(shippingRules.id, Number(id)));
    
    return { success: true };
}

/**
 * Remove uma zona de entrega.
 */
export async function deleteZone(id: string | number) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    await db.delete(shippingRules).where(eq(shippingRules.id, Number(id)));
    
    return { success: true };
}