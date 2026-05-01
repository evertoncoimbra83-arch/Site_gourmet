import { getDb } from "../server/db.js";
import { storeSettings } from "../drizzle/schema/index.js"; 
import { eq, sql } from "drizzle-orm";

// --- INTERFACES DE TIPAGEM ---

interface StoreSettingsRow {
  id: string | number;
  general_min_order_amount: string | number;
  min_order_message: string | null;
  emergency_mode: number | boolean;
  pickup_enabled: number | boolean;
  pickup_label: string | null;
  pickup_instruction: string | null;
  favicon: string | null;
  logo_url: string | null;
  site_theme: string | object | null;
  company_info: string | object | null;
  google_login: string | object | null;
  accessibility_high_contrast: number | boolean;
  accessibility_dyslexic_font: number | boolean;
  success_order_message: string | null;
  email_order_subject: string | null;
  email_order_body: string | null;
}

/**
 * ✅ BUSCA CONFIGURAÇÕES GERAIS (LEITURA NUCLEAR)
 */
export async function getStoreSettings() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");

  const [rows] = await db.execute(sql`SELECT * FROM store_settings WHERE id = '1' LIMIT 1`) as unknown as [StoreSettingsRow[]];

  const parseJsonField = (field: string | object | null): Record<string, unknown> => {
    if (!field) return {};
    try {
      return typeof field === "string" ? JSON.parse(field) : (field as Record<string, unknown>);
    } catch (e) { 
      console.error("Erro ao parsear campo JSON:", e);
      return {}; 
    }
  };

  if (!rows || rows.length === 0) {
    // Tipagem explícita para o Drizzle InferInsertModel ou similar
    const defaultData = {
      id: "1",
      generalMinOrderAmount: "0.00",
      emergencyMode: false,
      siteTheme: JSON.stringify({ primary: "#065f46", background: "#FBFBFC", foreground: "#0f172a" }),
      companyInfo: JSON.stringify({}),
      googleLogin: JSON.stringify({ enabled: false, clientId: "", clientSecret: "" }),
      accessibilityHighContrast: false,
      accessibilityDyslexicFont: false,
      pickupEnabled: true,
      pickupLabel: "Retirada no Balcão",
      pickupInstruction: "Apresente o número do pedido ao chegar."
    };

    try {
      // ✅ Usamos cast para 'never' e depois o tipo da tabela para satisfazer o Drizzle sem 'any'
      await db.insert(storeSettings).values(defaultData as unknown as typeof storeSettings.$inferInsert);
      
      return {
        ...defaultData,
        generalMinOrderAmount: 0,
        siteTheme: JSON.parse(defaultData.siteTheme),
        companyInfo: {},
        googleLogin: { enabled: false, clientId: "", clientSecret: "" }
      };
    } catch (err) {
      console.error("Erro ao criar configurações padrão:", err);
    }
  }

  const s = rows[0];

  return {
    id: String(s.id),
    generalMinOrderAmount: Number(s.general_min_order_amount || 0),
    minOrderMessage: s.min_order_message || "",
    emergencyMode: Boolean(s.emergency_mode),
    pickupEnabled: Boolean(s.pickup_enabled),
    pickupLabel: s.pickup_label || "Retirada",
    pickupInstruction: s.pickup_instruction || "", 
    favicon: s.favicon || "",
    logoUrl: s.logo_url || "",
    siteTheme: parseJsonField(s.site_theme),
    companyInfo: parseJsonField(s.company_info),
    googleLogin: parseJsonField(s.google_login),
    accessibilityHighContrast: Boolean(s.accessibility_high_contrast),
    accessibilityDyslexicFont: Boolean(s.accessibility_dyslexic_font),
    successOrderMessage: s.success_order_message || "Pedido recebido com sucesso! 🥗",
    email_order_subject: s.email_order_subject || "",
    email_order_body: s.email_order_body || ""
  };
}

/**
 * ✅ ATUALIZA CONFIGURAÇÕES GERAIS
 */
export async function updateStoreSettings(data: Partial<Record<string, unknown>>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");

  const updateData: Record<string, unknown> = { 
    updatedAt: new Date() 
  };

  if (data.generalMinOrderAmount !== undefined) updateData.generalMinOrderAmount = String(data.generalMinOrderAmount);
  if (data.minOrderMessage !== undefined) updateData.minOrderMessage = data.minOrderMessage;
  if (data.emergencyMode !== undefined) updateData.emergencyMode = Boolean(data.emergencyMode);
  if (data.successOrderMessage !== undefined) updateData.successOrderMessage = data.successOrderMessage;
  if (data.pickupEnabled !== undefined) updateData.pickupEnabled = Boolean(data.pickupEnabled);
  if (data.pickupLabel !== undefined) updateData.pickupLabel = data.pickupLabel;
  if (data.pickupInstruction !== undefined) updateData.pickupInstruction = data.pickupInstruction;
  if (data.favicon !== undefined) updateData.favicon = data.favicon;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.accessibilityHighContrast !== undefined) updateData.accessibilityHighContrast = Boolean(data.accessibilityHighContrast);
  if (data.accessibilityDyslexicFont !== undefined) updateData.accessibilityDyslexicFont = Boolean(data.accessibilityDyslexicFont);

  if (data.companyInfo) updateData.companyInfo = JSON.stringify(data.companyInfo);
  if (data.siteTheme) updateData.siteTheme = JSON.stringify(data.siteTheme);
  if (data.googleLogin) updateData.googleLogin = JSON.stringify(data.googleLogin);

  try {
    await db.update(storeSettings)
      .set(updateData)
      // ✅ Cast para 'any' removido. Usamos o tipo da coluna ID do próprio schema
      .where(eq(storeSettings.id, "1" as unknown as typeof storeSettings.id._.data)); 

    return { success: true };
  } catch (err) {
    console.error("Erro ao atualizar storeSettings:", err);
    throw new Error("Falha ao salvar configurações no banco.");
  }
}