import { decrypt } from "../../../encryption.js";
import type { AppConfigRow } from "./types.js";

export const MASKED_SECRET = "••••••••";

export function decryptIfNeeded(value: string): string {
  if (!value) return "";
  if (value.split(":").length === 3) {
    return decrypt(value) || value;
  }
  return value;
}

export function getRawConfig(rows: AppConfigRow[], key: string): string {
  return rows.find((row) => row.configKey === key)?.configValue || "";
}

export function getSecretConfig(rows: AppConfigRow[], key: string): string {
  return decryptIfNeeded(getRawConfig(rows, key));
}

export function maskGoogleLoginConfig(value: string): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    if (parsed.clientSecret) {
      parsed.clientSecret = MASKED_SECRET;
    }
    return JSON.stringify(parsed);
  } catch {
    return value;
  }
}

export function resolveTargetKey(input: {
  key?: string;
  configKey?: string;
}): string | undefined {
  return input.key || input.configKey;
}
