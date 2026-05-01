 
// server/routers/admin/settings.ts

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
  partners_json?: string | null;
  label_design_elements?: string | null;
  logoUrl?: string;
  favicon?: string;
  emergencyMode?: boolean;
  generalMinOrderAmount?: string | number;
  minOrderMessage?: string;
  pickupEnabled?: boolean;
  pickupLabel?: string;
  pickupInstruction?: string;
  companyInfo?: Record<string, unknown>;
  company_social_info?: string | null; // Adicionado para suporte social
  geminiApiKey?: string;
  googleLoginConfig?: string;
}

type DbType = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * ✅ UPSERT ATÔMICO COM CRIPTOGRAFIA PARA CHAVES SENSÍVEIS
 */
async function forceSaveAppConfig(db: DbType, key: string, value: unknown) {
  try {
    const rawValue = (value === undefined || value === null) ? "" : String(value);
    let finalValue = rawValue;
    
    // Lista de chaves que exigem criptografia AES-GCM antes de tocar o disco
    const sensitiveKeys = ['gemini_api_key', 'google_login_config', 'company_social_info'];
    
    if (sensitiveKeys.includes(key) && rawValue.length > 0) {
      const encrypted = encrypt(rawValue);
      if (encrypted) finalValue = encrypted;
    }

    await db.execute(sql`
      INSERT INTO app_configs (config_key, config_value, updated_at) 
      VALUES (${key}, ${finalValue}, NOW()) 
      ON DUPLICATE KEY UPDATE config_value = ${finalValue}, updated_at = NOW()
    `);
  } catch (error) {
    logger.error({ key, error }, "Falha crítica ao salvar em app_configs");
    throw error;
  }
}

/**
 * Lógica unificada para salvar configurações (Upsert Global)
 */
const saveSettingsLogic = adminProcedure
  .input(z.record(z.unknown()))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
    
    const dataInput = input as SettingsInput;
    
    try {
      logger.info("Admin iniciando atualização de kernel das configurações");

      // 1. ATUALIZAR APP_CONFIGS (Chaves Dinâmicas)
      const configsToSave = [
        { key: 'success_order_message', val: dataInput.success_order_message },
        { key: 'partners_json', val: dataInput.partners_json },
        { key: 'label_design_elements', val: dataInput.label_design_elements },
        { key: 'gemini_api_key', val: dataInput.geminiApiKey },
        { key: 'google_login_config', val: dataInput.googleLoginConfig },
        { key: 'company_social_info', val: dataInput.company_social_info }
      ];

      for (const config of configsToSave) {
        if (config.val !== undefined && config.val !== null) {
          await forceSaveAppConfig(db, config.key, config.val);
        }
      }

      // 2. ATUALIZAR STORE_SETTINGS (Estrutura Fixa)
      const storeUpdate: Partial<typeof storeSettings.$inferInsert> = { updatedAt: new Date() };
      if (dataInput.logoUrl !== undefined) storeUpdate.logoUrl = dataInput.logoUrl;
      if (dataInput.favicon !== undefined) storeUpdate.favicon = dataInput.favicon;
      if (dataInput.emergencyMode !== undefined) storeUpdate.emergencyMode = dataInput.emergencyMode;
      if (dataInput.generalMinOrderAmount !== undefined) storeUpdate.generalMinOrderAmount = String(dataInput.generalMinOrderAmount);
      if (dataInput.minOrderMessage !== undefined) storeUpdate.minOrderMessage = dataInput.minOrderMessage;

      if (Object.keys(storeUpdate).length > 1) {
        await db.update(storeSettings).set(storeUpdate).where(eq(storeSettings.id, "1"));
      }

      // 3. ATUALIZAR SHIPPING_SETTINGS (Logística)
      if (dataInput.pickupEnabled !== undefined) {
        const shipUpdate = {
          pickupEnabled: Boolean(dataInput.pickupEnabled),
          pickupLabel: dataInput.pickupLabel || "Retirada no Local",
          pickupInstruction: dataInput.pickupInstruction || "",
          updatedAt: new Date()
        };
        const [existingShip] = await db.select().from(shippingSettings).limit(1);
        if (existingShip) {
          await db.update(shippingSettings).set(shipUpdate).where(eq(shippingSettings.id, existingShip.id));
        } else {
          await db.insert(shippingSettings).values(shipUpdate);
        }
      }

      await logAction(ctx, "UPDATE_SETTINGS_UNIFIED", "settings", { entityId: "global" });
      return { success: true, message: "Kernel Sincronizado!" };
    } catch (err) {
      logger.error({ err }, "Erro fatal ao salvar configurações");
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao gravar dados no banco." });
    }
  });

export const adminStoreSettingsRouter = router({
  /**
   * 🔍 BUSCA COMPLETA (Com Descriptografia)
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
      try {
        const decrypted = decrypt(val);
        return decrypted || val;
      } catch { return val; }
    };

    return {
      ...generalSettings,
      geminiApiKey: getSecret('gemini_api_key'),
      googleLoginConfig: getSecret('google_login_config'),
      company_social_info: getSecret('company_social_info'),
      success_order_message: getRaw('success_order_message'),
      partners_json: getRaw('partners_json'),
      label_design_elements: getRaw('label_design_elements'),
      pickupEnabled: Boolean(shipData?.pickupEnabled ?? false),
      pickupLabel: shipData?.pickupLabel || "Retirada no Local",
      pickupInstruction: shipData?.pickupInstruction || "",
    };
  }),

  getByKey: adminProcedure
    .input(z.object({ key: z.string().optional(), configKey: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const target = input.key || input.configKey || "";
      if (!target || !db) throw new TRPCError({ code: "BAD_REQUEST" });
      
      const [config] = await db.select().from(appConfigs).where(eq(appConfigs.configKey, target)).limit(1);
      
      let val = config?.configValue || "";
      const sensitive = ['gemini_api_key', 'google_login_config', 'company_social_info'];
      
      if (val && sensitive.includes(target)) {
        val = decrypt(val) || val;
      }
      return { value: val, configValue: val };
    }),

  saveCompanyInfo: saveSettingsLogic,
  
  saveConfig: adminProcedure
    .input(z.object({ 
      key: z.string().optional(), configKey: z.string().optional(),
      value: z.unknown().optional(), configValue: z.unknown().optional() 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const k = input.key || input.configKey;
      const v = input.value || input.configValue;
      if (!k || !db) throw new TRPCError({ code: "BAD_REQUEST" });
      await forceSaveAppConfig(db, k, v ?? "");
      return { success: true };
    }),

  upsert: saveSettingsLogic,
  update: saveSettingsLogic,

  /**
   * 💾 EXPORTAÇÃO DE DADOS
   */
  downloadBackup: adminProcedure.mutation(async () => {
    try {
      const sqlContent = await generateDatabaseBackup();
      return { sql: sqlContent, filename: `gourmet_backup_${Date.now()}.sql` };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao gerar backup" });
    }
  }),
});

export const storeRouter = adminStoreSettingsRouter;