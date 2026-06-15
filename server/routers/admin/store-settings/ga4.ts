import { MASKED_SECRET } from "./mappers.js";

export function isValidGa4MeasurementId(value: unknown): boolean {
  return typeof value === "string" && /^G-[A-Z0-9]+$/i.test(value.trim());
}

export function parseGaServiceAccountState(value: string): {
  configured: boolean;
  clientEmail?: string;
  privateKeyConfigured: boolean;
} {
  if (!value) {
    return { configured: false, privateKeyConfigured: false };
  }

  try {
    const parsed = JSON.parse(value);
    return {
      configured: parsed?.type === "service_account",
      clientEmail:
        typeof parsed?.client_email === "string" ? parsed.client_email : "",
      privateKeyConfigured: Boolean(parsed?.private_key),
    };
  } catch {
    return { configured: false, privateKeyConfigured: false };
  }
}

export function maskGaServiceAccount(value: string): string {
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);
    if (parsed.private_key) {
      parsed.private_key = MASKED_SECRET;
    }
    return JSON.stringify(parsed);
  } catch {
    return value;
  }
}
