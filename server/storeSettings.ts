import { getDb } from "./db.js";
import { storeSettings } from "../drizzle/schema/index.js"; 
import { eq, sql } from "drizzle-orm";

export type StoreSettings = {
  id: string;
  generalMinOrderAmount: number;
  minOrderMessage: string | null;
  emergencyMode: boolean;
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");

  // ☢️ LEITURA NUCLEAR
  const [rows]: any = await db.execute(sql`SELECT * FROM store_settings WHERE id = '1' LIMIT 1`);

  if (!rows || rows.length === 0) {
    await db.insert(storeSettings).values({
      id: "1",
      generalMinOrderAmount: "0.00",
      minOrderMessage: null,
      emergencyMode: false,
    });
    return { id: "1", generalMinOrderAmount: 0, minOrderMessage: null, emergencyMode: false };
  }

  const s = rows[0];

 s  // 1. PÂNICO (Já funciona)
  const isEmergency = Boolean(
    s.emergencyMode === 1 || s.emergencyMode === true || 
    s.emergency_mode === 1 || s.emergency_mode === true
  );

  // 2. VALOR MÍNIMO (Já funciona, mas reforçado)
  const rawAmount = s.generalMinOrderAmount ?? s.general_min_order_amount;
  const minOrderAmount = Number(rawAmount || 0);

  // 3. MENSAGEM (Onde estava o problema)
  // Tentamos ler camelCase ou snake_case. 
  // Se for null/undefined, transformamos em string vazia "" para não quebrar o input do React.
  const rawMsg = s.minOrderMessage ?? s.min_order_message;
  const minOrderMsg = rawMsg ? String(rawMsg) : "";

  return {
    id: String(s.id),
    generalMinOrderAmount: minOrderAmount,
    minOrderMessage: minOrderMsg, // Agora garantimos que vai uma string
    emergencyMode: isEmergency, 
  };
}

export async function updateStoreSettings(data: {
  generalMinOrderAmount?: string | number;
  minOrderMessage?: string | null;
  emergencyMode?: boolean;
}) {
  const db = await getDb();
  
  const updateData: any = { updated_at: new Date() };

  if (data.generalMinOrderAmount !== undefined) {
    updateData.generalMinOrderAmount = String(data.generalMinOrderAmount);
  }
  
  // ✅ UPDATE: Garante que a mensagem seja salva
  if (data.minOrderMessage !== undefined) {
    updateData.minOrderMessage = data.minOrderMessage;
  }
  
  if (typeof data.emergencyMode !== 'undefined') {
    updateData.emergencyMode = data.emergencyMode;
  }

  await db.update(storeSettings)
    .set(updateData)
    .where(eq(storeSettings.id, "1"));

  return { success: true };
}