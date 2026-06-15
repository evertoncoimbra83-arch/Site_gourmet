import { eq, sql } from "drizzle-orm";
import {
  appConfigs,
  shippingSettings,
  storeSettings,
} from "../../../../drizzle/schema/index.js";
import { getDb } from "../../../db.js";
import { encrypt } from "../../../encryption.js";
import { logger } from "../../../logger.js";
import { TRPCError } from "@trpc/server";
import type { DbType, SettingsInput } from "./types.js";
import { assertCloudinaryStorageUrl } from "@shared/utils/image-url";

const sensitiveConfigKeys = new Set([
  "gemini_api_key",
  "google_login_config",
  "smtp_pass",
  "ga_service_account",
]);

function requireCloudinarySettingUrl(
  value: string | null | undefined,
  label: string,
) {
  try {
    return assertCloudinaryStorageUrl(value, label) || "";
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : `${label} invalido.`,
    });
  }
}

export async function getRequiredDb(): Promise<DbType> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "DB indisponivel",
    });
  }
  return db;
}

export async function forceSaveAppConfig(
  db: DbType,
  key: string,
  value: string,
) {
  try {
    const rawValue = value === undefined || value === null ? "" : String(value);
    const finalConfigValue =
      key === "favicon_url"
        ? requireCloudinarySettingUrl(rawValue, "Favicon")
        : rawValue;
    let finalValue = rawValue;
    finalValue = finalConfigValue;

    if (
      sensitiveConfigKeys.has(key) &&
      rawValue.length > 0 &&
      !rawValue.includes(":")
    ) {
      finalValue = encrypt(rawValue) || rawValue;
    }

    await db.execute(sql`
      INSERT INTO app_configs (config_key, config_value, updated_at)
      VALUES (${key}, ${finalValue}, NOW())
      ON DUPLICATE KEY UPDATE config_value = ${finalValue}, updated_at = NOW()
    `);
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    logger.error({ key, error }, "Falha ao salvar configuracao em app_configs");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao gravar configuracao.",
    });
  }
}

export async function getAllAppConfigs(db: DbType) {
  return await db.select().from(appConfigs);
}

export async function getAppConfigByKey(db: DbType, key: string) {
  const [config] = await db
    .select()
    .from(appConfigs)
    .where(eq(appConfigs.configKey, key))
    .limit(1);

  return config;
}

export async function getShippingSettings(db: DbType) {
  const [shipData] = await db.select().from(shippingSettings).limit(1);
  return shipData;
}

export async function updateStructuralStoreSettings(
  db: DbType,
  input: SettingsInput,
) {
  const storeUpdate: Partial<typeof storeSettings.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.logoUrl !== undefined) {
    storeUpdate.logoUrl = requireCloudinarySettingUrl(input.logoUrl, "Logo da loja");
  }
  if (input.generalMinOrderAmount !== undefined) {
    storeUpdate.generalMinOrderAmount = String(input.generalMinOrderAmount);
  }
  if (input.minOrderMessage !== undefined) {
    storeUpdate.minOrderMessage = input.minOrderMessage;
  }

  if (Object.keys(storeUpdate).length > 1) {
    await db.update(storeSettings).set(storeUpdate).where(eq(storeSettings.id, "1"));
  }
}

export async function listDatabaseTables(db: DbType): Promise<string[]> {
  const result = await db.execute(sql`SHOW TABLES`);
  const rows = result as unknown as Record<string, string>[];
  return rows.map((row) => Object.values(row)[0] as string);
}
