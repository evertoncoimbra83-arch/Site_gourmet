import axios from "axios";
import { TRPCError } from "@trpc/server";
import { spawn } from "node:child_process";
import { createWriteStream, promises as fs } from "node:fs";
import { eq } from "drizzle-orm";
import { router, adminProcedure, superAdminProcedure } from "../../../_core/trpc.js";
import { appConfigs, storeSettings } from "../../../../drizzle/schema/index.js";
import { decrypt } from "../../../encryption.js";
import { logAction } from "../../../db/lib/audit.js";
import { logger } from "../../../logger.js";
import * as StoreLogic from "../../../storeSettings.js";
import { AuditLogService } from "../../../services/AuditLogService.js";
import {
  assertConfirmationReason,
  assertStrongConfirmation,
} from "../operational-hardening.js";
import {
  buildTimestamp,
  getDatabaseCredentials,
  resolveBackupPath,
} from "../backups.js";
import {
  backupInputSchema,
  emergencyInputSchema,
  googleOAuthTestInputSchema,
  keyInputSchema,
  saveConfigInputSchema,
  settingsInputSchema,
} from "./schemas.js";
import {
  forceSaveAppConfig,
  getAllAppConfigs,
  getAppConfigByKey,
  getRequiredDb,
  getShippingSettings,
  listDatabaseTables,
  updateStructuralStoreSettings,
} from "./repository.js";
import {
  decryptIfNeeded,
  getRawConfig,
  getSecretConfig,
  maskGoogleLoginConfig,
  MASKED_SECRET,
  resolveTargetKey,
} from "./mappers.js";
import { maskGaServiceAccount } from "./ga4.js";
import { normalizeGtmId } from "./gtm.js";
import type { DbType, SettingsInput } from "./types.js";

function buildActor(ctx: any) {
  return {
    userId: ctx.user?.id,
    ipAddress:
      ctx.req?.ip ||
      (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      "127.0.0.1",
    userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
    requestId: ctx.req?.requestId,
  };
}

async function restoreGoogleClientSecretIfMasked(
  db: DbType,
  dataInput: SettingsInput,
) {
  if (dataInput.googleLoginConfig === undefined) return;

  try {
    const incoming = JSON.parse(dataInput.googleLoginConfig);

    if (incoming.enabled) {
      if (
        !incoming.clientId ||
        !incoming.clientId.endsWith(".apps.googleusercontent.com")
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Formato do Client ID invalido. Deve terminar com '.apps.googleusercontent.com'.",
        });
      }
      if (
        !incoming.redirectUri ||
        !/^https?:\/\/.+\/auth\/callback$/.test(incoming.redirectUri)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "A Redirect URI e invalida. Deve iniciar com http/https e terminar com '/auth/callback'.",
        });
      }
    }

    if (incoming.clientSecret === MASKED_SECRET) {
      const existing = await getAppConfigByKey(db, "google_login_config");
      let oldSecret = "";
      if (existing?.configValue) {
        const val = decryptIfNeeded(existing.configValue);
        try {
          oldSecret = JSON.parse(val).clientSecret || "";
        } catch {
          oldSecret = "";
        }
      }
      incoming.clientSecret = oldSecret;
      dataInput.googleLoginConfig = JSON.stringify(incoming);
    }
  } catch (err: any) {
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Formato invalido de configuracao.",
    });
  }
}

async function restoreGaPrivateKeyIfMasked(db: DbType, dataInput: SettingsInput) {
  if (!dataInput.gaServiceAccount) return;

  try {
    const incoming = JSON.parse(dataInput.gaServiceAccount);
    if (incoming.private_key !== MASKED_SECRET) return;

    const existing = await getAppConfigByKey(db, "ga_service_account");
    if (!existing?.configValue) return;

    const oldValue = decryptIfNeeded(existing.configValue);
    const oldParsed = JSON.parse(oldValue);
    incoming.private_key = oldParsed.private_key || "";
    dataInput.gaServiceAccount = JSON.stringify(incoming);
  } catch {
    return;
  }
}

async function saveSettings(ctx: any, input: Record<string, unknown>) {
  const db = await getRequiredDb();
  const dataInput = input as SettingsInput;

  if (dataInput.googleLoginConfig !== undefined && ctx.user.role !== "super_admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Apenas super_admin pode alterar as configuracoes do Google OAuth.",
    });
  }

  await restoreGoogleClientSecretIfMasked(db, dataInput);
  await restoreGaPrivateKeyIfMasked(db, dataInput);

  try {
    const configsToSave = [
      {
        key: "success_order_message",
        val: dataInput.success_order_message ?? dataInput.successOrderMessage,
      },
      {
        key: "partners_json",
        val: dataInput.partners_json ?? dataInput.partnersJson,
      },
      {
        key: "label_design_elements",
        val: dataInput.label_design_elements ?? dataInput.labelDesignElements,
      },
      {
        key: "accessibility_vlibras_active",
        val: String(
          dataInput.accessibility?.vLibrasActive ??
            dataInput.vLibrasActive ??
            "false",
        ),
      },
      {
        key: "accessibility_high_contrast",
        val: String(
          dataInput.accessibility?.highContrastActive ??
            dataInput.highContrastActive ??
            "false",
        ),
      },
      { key: "favicon_url", val: dataInput.favicon },
      { key: "gemini_api_key", val: dataInput.geminiApiKey },
      { key: "google_login_config", val: dataInput.googleLoginConfig },
      { key: "google_analytics_id", val: dataInput.googleAnalyticsId },
      { key: "ga_service_account", val: dataInput.gaServiceAccount },
      { key: "ga4_property_id", val: dataInput.ga4PropertyId },
      { key: "gtm_id", val: normalizeGtmId(dataInput.gtmId) },
    ];

    for (const config of configsToSave) {
      if (config.val !== undefined && config.val !== null) {
        await forceSaveAppConfig(db, config.key, String(config.val));
      }
    }

    await updateStructuralStoreSettings(db, dataInput);
    await logAction(ctx, "UPDATE_SETTINGS_UNIFIED", "settings", {
      entityId: "global",
    });

    if (dataInput.googleLoginConfig !== undefined) {
      let newConfigMasked: any = {};
      try {
        const parsedNew = JSON.parse(dataInput.googleLoginConfig);
        newConfigMasked = {
          enabled: parsedNew.enabled,
          clientId: parsedNew.clientId
            ? `${parsedNew.clientId.substring(0, 10)}...`
            : "",
          redirectUri: parsedNew.redirectUri,
          clientSecret: parsedNew.clientSecret ? "[REDACTED]" : "",
        };
      } catch {
        newConfigMasked = {};
      }

      void AuditLogService.record({
        actor: buildActor(ctx),
        module: "settings",
        action: "GOOGLE_OAUTH_CONFIG_UPDATED",
        severity: "critical",
        entityType: "settings",
        entityId: "global",
        entityLabel: "Configuracoes Globais (Google OAuth)",
        newValues: newConfigMasked,
      });
    }

    return { success: true, message: "Configuracoes sincronizadas com sucesso!" };
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    logger.error({ err }, "Erro ao salvar configuracoes globais");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao processar a gravacao dos dados.",
    });
  }
}

const saveSettingsLogic = adminProcedure
  .input(settingsInputSchema)
  .mutation(async ({ ctx, input }) => saveSettings(ctx, input));

export const adminStoreSettingsRouter = router({
  get: adminProcedure.query(async () => {
    const db = await getRequiredDb();
    const generalSettings = await StoreLogic.getStoreSettings();
    const extraConfigs = await getAllAppConfigs(db);
    const shipData = await getShippingSettings(db);
    const gaServiceAccount = getSecretConfig(extraConfigs, "ga_service_account");

    return {
      ...generalSettings,
      favicon: getRawConfig(extraConfigs, "favicon_url") || generalSettings.favicon || "",
      success_order_message: getRawConfig(extraConfigs, "success_order_message") || "",
      partners_json: getRawConfig(extraConfigs, "partners_json") || "[]",
      label_design_elements:
        getRawConfig(extraConfigs, "label_design_elements") || null,
      pickupEnabled: Boolean(shipData?.pickupEnabled ?? false),
      pickupLabel: shipData?.pickupLabel || "Retirada no Local",
      pickupInstruction: shipData?.pickupInstruction || "",
      geminiApiKey: getSecretConfig(extraConfigs, "gemini_api_key"),
      googleLoginConfig: maskGoogleLoginConfig(
        getSecretConfig(extraConfigs, "google_login_config"),
      ),
      googleAnalyticsId: getRawConfig(extraConfigs, "google_analytics_id"),
      gaServiceAccount: maskGaServiceAccount(gaServiceAccount),
      ga4PropertyId: getRawConfig(extraConfigs, "ga4_property_id"),
      gtmId: getRawConfig(extraConfigs, "gtm_id"),
      accessibility: {
        vLibrasActive:
          getRawConfig(extraConfigs, "accessibility_vlibras_active") === "true",
        highContrastActive:
          getRawConfig(extraConfigs, "accessibility_high_contrast") === "true",
      },
    };
  }),

  getByKey: adminProcedure.input(keyInputSchema).query(async ({ input }) => {
    const db = await getRequiredDb();
    const targetKey = resolveTargetKey(input);
    if (!targetKey) return { value: "" };

    const config = await getAppConfigByKey(db, targetKey);
    let val = decryptIfNeeded(config?.configValue || "");

    if (targetKey === "google_login_config") {
      val = maskGoogleLoginConfig(val);
    }
    if (targetKey === "ga_service_account") {
      val = maskGaServiceAccount(val);
    }

    return {
      value: val,
      configValue: val,
    };
  }),

  saveConfig: adminProcedure
    .input(saveConfigInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const targetKey = resolveTargetKey(input);
      let targetValue = input.value || input.configValue || "";

      if (!targetKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chave e obrigatoria.",
        });
      }

      if (targetKey === "google_login_config") {
        if (ctx.user.role !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Apenas super_admin pode alterar as configuracoes do Google OAuth.",
          });
        }

        const dataInput: SettingsInput = { googleLoginConfig: targetValue };
        await restoreGoogleClientSecretIfMasked(db, dataInput);
        targetValue = dataInput.googleLoginConfig || "";
      }

      if (targetKey === "ga_service_account") {
        const dataInput: SettingsInput = { gaServiceAccount: targetValue };
        await restoreGaPrivateKeyIfMasked(db, dataInput);
        targetValue = dataInput.gaServiceAccount || targetValue;
      }

      await forceSaveAppConfig(db, targetKey, targetValue);
      return { success: true };
    }),

  upsert: saveSettingsLogic,
  update: saveSettingsLogic,
  saveCompanyInfo: saveSettingsLogic,

  toggleEmergency: superAdminProcedure
    .input(emergencyInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (typeof input === "boolean") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Modo emergencia exige confirmacao forte.",
        });
      }
      assertStrongConfirmation(input, "Alternancia do modo emergencia");
      assertConfirmationReason(input, "Alternancia do modo emergencia");

      const db = await getRequiredDb();
      const generalSettingsBefore = await StoreLogic.getStoreSettings();

      await db
        .update(storeSettings)
        .set({ emergencyMode: input.enabled, updatedAt: new Date() })
        .where(eq(storeSettings.id, "1"));

      const generalSettingsAfter = await StoreLogic.getStoreSettings();

      void AuditLogService.record({
        actor: buildActor(ctx),
        module: "settings",
        action: "TOGGLE_EMERGENCY",
        severity: "critical",
        entityType: "settings",
        entityId: "global",
        entityLabel: "Configuracoes Globais (Modo Emergencia)",
        oldValues: { emergencyMode: generalSettingsBefore.emergencyMode },
        newValues: {
          emergencyMode: generalSettingsAfter.emergencyMode,
          confirmationReason: input.confirmationReason?.trim(),
        },
      });

      return { success: true, newState: input.enabled };
    }),

  downloadBackup: superAdminProcedure
    .input(backupInputSchema)
    .mutation(async ({ ctx, input }) => {
      const timestamp = buildTimestamp();
      const filename = `infrastructure_backup_${timestamp}.sql.gz`;
      const targetPath = resolveBackupPath(filename);
      const credentials = getDatabaseCredentials();

      await new Promise<void>((resolve, reject) => {
        const dumpArgs = [
          "-h",
          credentials.host,
          "-P",
          credentials.port,
          "-u",
          credentials.user,
          credentials.database,
        ];

        if (input.selectedTables && input.selectedTables.length > 0) {
          const validTableNames = input.selectedTables.filter((table) =>
            /^[a-zA-Z0-9_]+$/.test(table),
          );
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
            try {
              dump.kill("SIGTERM");
            } catch {
              // ignore process cleanup errors
            }
            try {
              gzip.kill("SIGTERM");
            } catch {
              // ignore process cleanup errors
            }
            fs.rm(targetPath, { force: true }).finally(() => reject(error));
            return;
          }
          resolve();
        };

        dump.on("error", () => finalize(new Error("Falha ao iniciar mysqldump.")));
        gzip.on("error", () => finalize(new Error("Falha ao iniciar gzip.")));
        output.on("error", () =>
          finalize(new Error("Falha ao escrever arquivo de backup.")),
        );

        dump.stderr.on("data", (chunk: Buffer) => {
          dumpStderr += chunk.toString("utf8");
        });

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

      void AuditLogService.record({
        actor: buildActor(ctx),
        module: "backup",
        action: "INFRASTRUCTURE_BACKUP",
        severity: "critical",
        entityType: "var/backups",
        entityId: filename,
        entityLabel: `Backup de Infraestrutura: ${filename}`,
        newValues: {
          filename,
          tables: input.selectedTables || ["all_tables"],
        },
      });

      return { filename, success: true };
    }),

  testGoogleOAuth: superAdminProcedure
    .input(googleOAuthTestInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      let resolvedSecret = input.clientSecret;

      if (resolvedSecret === MASKED_SECRET) {
        const existing = await getAppConfigByKey(db, "google_login_config");
        if (existing?.configValue) {
          const val = decryptIfNeeded(existing.configValue);
          try {
            resolvedSecret = JSON.parse(val).clientSecret || "";
          } catch {
            resolvedSecret = "";
          }
        }
      }

      if (!input.clientId || !input.clientId.endsWith(".apps.googleusercontent.com")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Formato do Client ID invalido. Deve terminar com '.apps.googleusercontent.com'.",
        });
      }
      if (!input.redirectUri || !/^https?:\/\/.+\/auth\/callback$/.test(input.redirectUri)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "A Redirect URI e invalida. Deve iniciar com http/https e terminar com '/auth/callback'.",
        });
      }
      if (!resolvedSecret || resolvedSecret === MASKED_SECRET) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Client Secret nao configurado ou invalido.",
        });
      }

      let networkOk = false;
      let errorMsg = "";
      try {
        const res = await axios.get(
          "https://accounts.google.com/.well-known/openid-configuration",
          { timeout: 5000 },
        );
        if (res.status === 200 && res.data.issuer) {
          networkOk = true;
        }
      } catch (err: any) {
        errorMsg = err.message || String(err);
      }

      void AuditLogService.record({
        actor: buildActor(ctx),
        module: "settings",
        action: "GOOGLE_OAUTH_CONFIG_TESTED",
        severity: networkOk ? "info" : "warning",
        entityType: "settings",
        entityId: "global",
        entityLabel: "Google OAuth Connection Validation",
        newValues: {
          success: networkOk,
          error: errorMsg || null,
          clientId: `${input.clientId.substring(0, 10)}...`,
          redirectUri: input.redirectUri,
        },
      });

      if (!networkOk) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Falha na conexao externa com o Google: ${errorMsg}`,
        });
      }

      return {
        success: true,
        message: "Conectividade e formatos validados com sucesso!",
      };
    }),

  listTables: adminProcedure.query(async () => {
    const db = await getRequiredDb();
    return await listDatabaseTables(db);
  }),
});
