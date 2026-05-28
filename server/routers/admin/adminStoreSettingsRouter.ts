import { z } from "zod";
import { router, adminProcedure, superAdminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { storeSettings, appConfigs, shippingSettings } from "../../../drizzle/schema/index.js";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { encrypt, decrypt } from "../../encryption.js";
import { logAction } from "../../db/lib/audit.js";
import { logger } from "../../logger.js"; 
import * as StoreLogic from "../../storeSettings.js";
import { AuditLogService } from "../../services/AuditLogService.js";
import {
  assertConfirmationReason,
  assertStrongConfirmation,
} from "./operational-hardening.js";
import { spawn } from "node:child_process";
import { createWriteStream, promises as fs } from "node:fs";
import { getDatabaseCredentials, resolveBackupPath, buildTimestamp } from "./backups.js";

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

  toggleEmergency: superAdminProcedure
    .input(z.union([
      z.boolean(),
      z.object({
        enabled: z.boolean(),
        confirmationToken: z.string().optional(),
        confirmationReason: z.string().optional(),
      }),
    ]))
    .mutation(async ({ ctx, input }) => {
      if (typeof input === "boolean") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Modo emergencia exige confirmacao forte.",
        });
      }
      assertStrongConfirmation(input, "Alternancia do modo emergencia");
      assertConfirmationReason(input, "Alternancia do modo emergencia");

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

      const generalSettingsBefore = await StoreLogic.getStoreSettings();

      await db.update(storeSettings)
        .set({ emergencyMode: input.enabled, updatedAt: new Date() })
        .where(eq(storeSettings.id, "1"));

      const generalSettingsAfter = await StoreLogic.getStoreSettings();

      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId
      };

      void AuditLogService.record({
        actor,
        module: "settings",
        action: "TOGGLE_EMERGENCY",
        severity: "critical",
        entityType: "settings",
        entityId: "global",
        entityLabel: "Configurações Globais (Modo Emergência)",
        oldValues: { emergencyMode: generalSettingsBefore.emergencyMode },
        newValues: {
          emergencyMode: generalSettingsAfter.emergencyMode,
          confirmationReason: input.confirmationReason?.trim(),
        }
      });

      return { success: true, newState: input.enabled };
    }),

  /**
   * ✅ DOWNLOAD DE BACKUP SEGURO (STREAM COM SELEÇÃO DE TABELAS)
   */
  downloadBackup: superAdminProcedure
    .input(z.object({
      selectedTables: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const timestamp = buildTimestamp();
      const filename = `infrastructure_backup_${timestamp}.sql.gz`;
      const targetPath = resolveBackupPath(filename);
      const credentials = getDatabaseCredentials();

      await new Promise<void>((resolve, reject) => {
        const dumpArgs = [
          "-h", credentials.host,
          "-P", credentials.port,
          "-u", credentials.user,
          credentials.database
        ];
        
        if (input.selectedTables && input.selectedTables.length > 0) {
          const validTableNames = input.selectedTables.filter(t => /^[a-zA-Z0-9_]+$/.test(t));
          dumpArgs.push(...validTableNames);
        }

        const dump = spawn("mysqldump", dumpArgs, {
          env: { ...process.env, MYSQL_PWD: credentials.password },
          stdio: ["ignore", "pipe", "pipe"],
        });

        const gzip = spawn("gzip", ["-c"], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        const output = createWriteStream(targetPath, { flags: "wx" });

        let dumpClosed = false;
        let gzipClosed = false;
        let outputFinished = false;
        let dumpStderr = "";
        let settled = false;

        const finalize = (error?: Error) => {
          if (settled) return;
          settled = true;

          dump.stdout?.unpipe();
          gzip.stdout?.unpipe();
          output.close();

          if (error) {
            try { dump.kill("SIGTERM"); } catch {}
            try { gzip.kill("SIGTERM"); } catch {}
            fs.rm(targetPath, { force: true }).finally(() => reject(error));
            return;
          }
          resolve();
        };

        dump.on("error", () => finalize(new Error("Falha ao iniciar mysqldump.")));
        gzip.on("error", () => finalize(new Error("Falha ao iniciar gzip.")));
        output.on("error", () => finalize(new Error("Falha ao escrever arquivo de backup.")));

        dump.stderr.on("data", (chunk: Buffer) => { dumpStderr += chunk.toString("utf8"); });

        dump.stdout.pipe(gzip.stdin);
        gzip.stdout.pipe(output);

        output.on("finish", () => {
          outputFinished = true;
          if (dumpClosed && gzipClosed) finalize();
        });

        dump.on("close", (code) => {
          dumpClosed = true;
          if (code !== 0) {
            gzip.kill("SIGTERM");
            finalize(new Error(dumpStderr || "mysqldump falhou."));
          } else if (gzipClosed && outputFinished) {
            finalize();
          }
        });

        gzip.on("close", (code) => {
          gzipClosed = true;
          if (code !== 0) {
            finalize(new Error("gzip falhou."));
          } else if (dumpClosed && outputFinished) {
            finalize();
          }
        });
      });

      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId
      };

      void AuditLogService.record({
        actor,
        module: "backup",
        action: "INFRASTRUCTURE_BACKUP",
        severity: "critical",
        entityType: "var/backups",
        entityId: filename,
        entityLabel: `Backup de Infraestrutura: ${filename}`,
        newValues: {
          filename,
          tables: input.selectedTables || ["all_tables"]
        }
      });

      return { filename, success: true };
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
