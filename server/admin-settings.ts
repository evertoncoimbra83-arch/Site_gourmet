import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { storeSettings } from "../drizzle/schema";

export async function getStoreSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const settings = await db.select().from(storeSettings).limit(1);
  
  if (settings.length === 0) {
    // Cria padrão se não existir (fallback de segurança)
    await db.insert(storeSettings).values({
      generalMinOrderAmount: "0.00",
    });
    return (await db.select().from(storeSettings).limit(1))[0];
  }
  
  return settings[0];
}

export async function updateStoreSettings(data: {
  generalMinOrderAmount?: string;
  minOrderMessage?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Garante que existe registro 1
  const existing = await getStoreSettings();
  
  await db.update(storeSettings).set({
    generalMinOrderAmount: data.generalMinOrderAmount,
    minOrderMessage: data.minOrderMessage,
    updated_at: new Date(),
  }).where(eq(storeSettings.id, existing.id));

  return { success: true };
}