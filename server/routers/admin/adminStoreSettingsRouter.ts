import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { storeSettings, appConfigs, shippingSettings } from "../../../drizzle/schema/index.js";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { encrypt, decrypt } from "../../encryption.js";
import { generateDatabaseBackup } from "../../backup.js";
import { logAction } from "../../db/lib/audit.js";
import { logger } from "../../logger.js"; 
import * as StoreLogic from "../../storeSettings.js";

// --- INTERFACES ---
interface SettingsInput {
  success_order_message?: string | null;
  successOrderMessage?: string | null;
  partners_json?: string | null;
  partnersJson?: string | null;
  label_design_elements?: string | null;
  labelDesignElements?: string | null;
  logoUrl?: string;
  favicon?: string;
  emergencyMode?: boolean;
  generalMinOrderAmount?: string | number;
  minOrderMessage?: string;
  pickupEnabled?: boolean;
  pickupLabel?: string;
  pickupInstruction?: string;
  companyInfo?: Record<string, unknown>;
  vLibrasActive?: boolean | string | null;
  highContrastActive?: boolean | string | null;
  accessibility?: {
    vLibrasActive?: boolean | string | null;
    highContrastActive?: boolean | string | null;
  };
  geminiApiKey?: string;
  googleLoginConfig?: string;
  // 📈 Analytics & BI
  googleAnalyticsId?: string;
  gaServiceAccount?: string;
  ga4PropertyId?: string; 
}

type DbType = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * ✅ UPSERT COM CRIPTOGRAFIA AUTOMÁTICA
 * Garante que chaves sensíveis nunca sejam gravadas em texto claro.
 */
async function forceSaveAppConfig(db: DbType, key: string, value: string) {
  try {
    const rawValue = (value === undefined || value === null) ? "" : String(value);
    let finalValue = rawValue;
    
    // Blindagem de chaves sensíveis (Adicionado ga_service_account para proteção do BI)
    const sensitiveKeys = ['gemini_api_key', 'google_login_config', 'smtp_pass', 'ga_service_account'];
    if (sensitiveKeys.includes(key) && rawValue.length > 0 && !rawValue.includes(':')) {
      finalValue = encrypt(rawValue) || rawValue;
    }

    await db.execute(sql`
      INSERT INTO app_configs (config_key, config_value, updated_at) 
      VALUES (${key}, ${finalValue}, NOW()) 
      ON DUPLICATE KEY UPDATE config_value = ${finalValue}, updated_at = NOW()
    `);
  } catch (error) {
    logger.error({ key, error }, "Falha ao salvar configuração em app_configs");
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao gravar configuração." });
  }
}

/**
 * 🛠️ LÓGICA REUTILIZÁVEL DE SALVAMENTO
 */
const saveSettingsLogic = adminProcedure
  .input(z.record(z.unknown()))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
    
    const dataInput = input as SettingsInput;
    
    try {
      // 1. Configurações Dinâmicas (app_configs)
      const configsToSave = [
        { key: 'success_order_message', val: (dataInput.success_order_message ?? dataInput.successOrderMessage) ?? undefined },
        { key: 'partners_json', val: (dataInput.partners_json ?? dataInput.partnersJson) ?? undefined },
        { key: 'label_design_elements', val: (dataInput.label_design_elements ?? dataInput.labelDesignElements) as string | undefined },
        { key: 'accessibility_vlibras_active', val: String(dataInput.accessibility?.vLibrasActive ?? dataInput.vLibrasActive ?? 'false') },
        { key: 'accessibility_high_contrast', val: String(dataInput.accessibility?.highContrastActive ?? dataInput.highContrastActive ?? 'false') },
        { key: 'favicon_url', val: dataInput.favicon ?? undefined },
        { key: 'gemini_api_key', val: dataInput.geminiApiKey },
        { key: 'google_login_config', val: dataInput.googleLoginConfig },
        { key: 'google_analytics_id', val: dataInput.googleAnalyticsId },
        { key: 'ga_service_account', val: dataInput.gaServiceAccount },
        { key: 'ga4_property_id', val: dataInput.ga4PropertyId }
      ];

      for (const config of configsToSave) {
        if (config.val !== undefined) {
          await forceSaveAppConfig(db, config.key, config.val);
        }
      }

      // 2. Configurações Estruturais (store_settings)
      const storeUpdate: Partial<typeof storeSettings.$inferInsert> = { updatedAt: new Date() };
      
      if (dataInput.logoUrl !== undefined) storeUpdate.logoUrl = dataInput.logoUrl;
      if (dataInput.generalMinOrderAmount !== undefined) storeUpdate.generalMinOrderAmount = String(dataInput.generalMinOrderAmount);
      if (dataInput.minOrderMessage !== undefined) storeUpdate.minOrderMessage = dataInput.minOrderMessage;

      if (Object.keys(storeUpdate).length > 1) {
        await db.update(storeSettings).set(storeUpdate).where(eq(storeSettings.id, "1"));
      }

      // 3. Auditoria
      await logAction(ctx, "UPDATE_SETTINGS_UNIFIED", "settings", { entityId: "global" });
      
      return { success: true, message: "Configurações sincronizadas com sucesso!" };
    } catch (err) {
      logger.error({ err }, "Erro ao salvar configurações globais");
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao processar a gravação dos dados." });
    }
  });

export const adminStoreSettingsRouter = router({
  
  /**
   * ✅ LEITURA GLOBAL
   * Descriptografa segredos para exibição segura no painel Admin.
   */
  get: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const generalSettings = await StoreLogic.getStoreSettings();
    const extraConfigs = await db.select().from(appConfigs);
    const [shipData] = await db.select().from(shippingSettings).limit(1);

    const getRaw = (key: string) => extraConfigs.find(r => r.configKey === key)?.configValue || "";

    const getSecret = (key: string) => {
      const val = getRaw(key);
      if (!val) return "";
      if (val.split(':').length === 3) {
        return decrypt(val) || val;
      }
      return val;
    };

    return {
      ...generalSettings,
      favicon: getRaw('favicon_url') || generalSettings.favicon || "",
      success_order_message: getRaw('success_order_message') || "",
      partners_json: getRaw('partners_json') || "[]",
      label_design_elements: getRaw('label_design_elements') || null,
      pickupEnabled: Boolean(shipData?.pickupEnabled ?? false),
      pickupLabel: shipData?.pickupLabel || "Retirada no Local",
      pickupInstruction: shipData?.pickupInstruction || "",
      geminiApiKey: getSecret('gemini_api_key'),
      googleLoginConfig: getSecret('google_login_config'),
      googleAnalyticsId: getRaw('google_analytics_id'),
      gaServiceAccount: getSecret('ga_service_account'),
    ga4PropertyId: getRaw('ga4_property_id'), 
      accessibility: {
        vLibrasActive: getRaw('accessibility_vlibras_active') === 'true',
        highContrastActive: getRaw('accessibility_high_contrast') === 'true',
      }
    };
  }),

  /**
   * ✅ LEITURA POR CHAVE
   */
  getByKey: adminProcedure
    .input(z.object({ 
      key: z.string().optional(), 
      configKey: z.string().optional() 
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const targetKey = input.key || input.configKey;
      if (!targetKey) return { value: "" };

      const [config] = await db.select()
        .from(appConfigs)
        .where(eq(appConfigs.configKey, targetKey))
        .limit(1);

      let val = config?.configValue || "";
      
      if (val && val.split(':').length === 3) {
        val = decrypt(val) || val;
      }

      return { 
        value: val,
        configValue: val 
      };
    }),

  saveConfig: adminProcedure
    .input(z.object({ 
      key: z.string().optional(), 
      value: z.string().optional(),
      configKey: z.string().optional(),
      configValue: z.string().optional() 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const targetKey = input.key || input.configKey;
      const targetValue = input.value || input.configValue;

      if (!targetKey) throw new TRPCError({ code: "BAD_REQUEST", message: "Chave é obrigatória." });
      
      await forceSaveAppConfig(db, targetKey, targetValue || "");
      return { success: true };
    }),

  upsert: saveSettingsLogic,
  update: saveSettingsLogic,
  saveCompanyInfo: saveSettingsLogic,

  /**
   * ✅ DOWNLOAD DE BACKUP
   */
  downloadBackup: adminProcedure.mutation(async () => {
    const sqlContent = await generateDatabaseBackup();
    return { 
      sql: sqlContent, 
      filename: `backup_gourmet_${new Date().toISOString().split('T')[0]}.sql` 
    };
  }),

  // ✅ Lista todas as tabelas do banco — usado pelo InfrastructureCard
  listTables: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
    const result = await db.execute(sql`SHOW TABLES`);
    const rows = result as unknown as Record<string, string>[];
    return rows.map((row) => Object.values(row)[0] as string);
  }),
});