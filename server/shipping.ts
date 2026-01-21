import { eq, asc } from "drizzle-orm";
import { getDb } from "./db.js"; 
import { shippingRules } from "../drizzle/schema.js"; 
import { z } from "zod";
import crypto from "crypto"; // Garantir que o crypto esteja disponível para o UUID

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
        .where(eq(shippingRules.active, true))
        .orderBy(asc(shippingRules.price));
}

/**
 * Encontra a zona de entrega mais adequada para um CEP.
 */
export async function findZoneByZipCode(zipCode: string): Promise<ShippingZone | null> {
    const activeZones = await listActiveZones();
    const zipCodeNumeric = parseInt(zipCode.replace(/\D/g, ""), 10);
    
    const matchingZone = activeZones.find(zone => {
        if (zone.cepStart && zone.cepEnd) {
            const start = parseInt(zone.cepStart.replace(/\D/g, ""), 10);
            const end = parseInt(zone.cepEnd.replace(/\D/g, ""), 10);
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
        cost: parseFloat(String(zone.price || "0")), 
        name: zone.name || "Entrega padrão"
    };
}


// =========================================================================
// 2. ADMIN (CRUD - Apenas para administradores)
// =========================================================================

/**
 * Cria uma nova zona de entrega.
 * ✅ Correção do erro de Overload: Definindo zoneData com o tipo InsertShippingZone
 */
export async function createZone(data: Omit<InsertShippingZone, "id">) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const newId = crypto.randomUUID(); 

    // ✅ Construímos o objeto respeitando o contrato do Drizzle
    const zoneData: InsertShippingZone = {
        ...data,
        id: newId, // Atribuindo a string UUID
        price: String(data.price || "0.00"),
        cepStart: data.cepStart?.replace(/\D/g, "") || "", 
        cepEnd: data.cepEnd?.replace(/\D/g, "") || "",
    };

    await db.insert(shippingRules).values(zoneData);
    
    return { 
        success: true, 
        id: newId 
    };
}

/**
 * Atualiza uma zona de entrega.
 * ✅ O cast 'as any' no 'eq' só é necessário se o seu schema.ts ainda não tiver sido
 * alterado para varchar/string. Se já alterou, o TS reconhecerá automaticamente.
 */
export async function updateZone(id: string, data: Partial<InsertShippingZone>) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");
    
    // Filtramos o ID dos dados de atualização para evitar conflitos
    const { id: _, ...rest } = data;
    const updateData: any = { ...rest };

    if (updateData.price !== undefined) {
        updateData.price = String(updateData.price);
    }
    if (updateData.cepStart !== undefined) {
        updateData.cepStart = updateData.cepStart?.replace(/\D/g, "");
    }
    if (updateData.cepEnd !== undefined) {
        updateData.cepEnd = updateData.cepEnd?.replace(/\D/g, "");
    }
    
    // @ts-ignore - Caso o schema local ainda aponte para 'number'
    await db.update(shippingRules)
        .set(updateData)
        .where(eq(shippingRules.id, id));
    
    return { success: true };
}

/**
 * Remove uma zona de entrega.
 */
export async function deleteZone(id: string) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    // @ts-ignore - Caso o schema local ainda aponte para 'number'
    await db.delete(shippingRules).where(eq(shippingRules.id, id));
    
    return { success: true };
}