import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { storeSettings } from "../drizzle/schema/index";
import crypto from "crypto";

export async function getStoreSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const settings = await db.select().from(storeSettings).limit(1);
  
  if (settings.length === 0) {
    // ✅ CORREÇÃO ERRO 2769: Fornecendo o 'id' obrigatório (UUID)
    const newId = crypto.randomUUID();
    
    await db.insert(storeSettings).values({
      id: newId,
      generalMinOrderAmount: "0.00",
      emergencyMode: false,
      minOrderMessage: "O valor mínimo para pedidos é R$ {min}"
    });
    
    const [newSettings] = await db.select().from(storeSettings).where(eq(storeSettings.id, newId)).limit(1);
    return newSettings;
  }
  
  return settings[0];
}

export async function updateStoreSettings(data: {
  generalMinOrderAmount?: string;
  minOrderMessage?: string | null;
  emergencyMode?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Garante que existe registro para atualizar
  const existing = await getStoreSettings();
  
  // ✅ CORREÇÃO ERRO 2561: Usando 'updatedAt' em vez de 'updated_at'
  await db.update(storeSettings).set({
    generalMinOrderAmount: data.generalMinOrderAmount,
    minOrderMessage: data.minOrderMessage,
    emergencyMode: data.emergencyMode,
    updatedAt: new Date(), 
  }).where(eq(storeSettings.id, existing.id));

  return { success: true };
}