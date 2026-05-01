import * as crypto from "crypto";
import { customType } from "drizzle-orm/mysql-core";

/**
 * Módulo de criptografia AES-256-GCM para proteger dados sensíveis.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; 

function getEncryptionKey(): Buffer {
  let key = process.env.DB_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("❌ ERRO CRÍTICO: DB_ENCRYPTION_KEY não configurada!");
    }
    key = "dev-secret-key-pode-ser-curta";
  }
  return crypto.scryptSync(key, "static-salt", 32);
}

// --- HELPERS DE HASHING ---

export function normalizeDigits(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Gera Hash SHA-256 para comparação de dados.
 */
export function piiHash(input: string | null | undefined): string | null {
  if (!input) return null;
  
  const cleanData = input.replace(/\D/g, "").trim();
  
  return crypto
    .createHash("sha256")
    .update(cleanData)
    .digest("hex");
}

// --- NÚCLEO DE CRIPTOGRAFIA ---

export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = String(text).trim(); 
  if (!t) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(t, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch {
    return null;
  }
}

export function decrypt(data: string | Buffer | null | undefined): string | null {
  if (!data) return null;
  const text = Buffer.isBuffer(data) ? data.toString('utf-8') : String(data);
  const parts = text.split(":");
  if (parts.length !== 3) return text;

  try {
    const [ivHex, tagHex, encryptedText] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return text; 
  }
}

/**
 * ✅ NOVO: unseal
 * Helper para garantir que o retorno seja sempre uma string, 
 * mesmo que a descriptografia falhe.
 */
export function unseal(val: unknown): string {
  if (!val) return "";
  const str = String(val).trim();
  try {
    const decrypted = decrypt(str);
    return decrypted ?? str;
  } catch {
    return str;
  }
}

// --- INTEGRAÇÃO DRIZZLE ---

export const encryptedText = (columnName: string) => 
  customType<{ data: string }>({
    dataType() { return "blob"; },
    toDriver(value: string) { return encrypt(value) as string; },
    fromDriver(value: unknown) {
      return decrypt(Buffer.isBuffer(value) ? value : String(value)) as string;
    },
  })(columnName);

// --- HELPERS MANUAIS ---

export function encryptFields<T extends Record<string, unknown>>(data: T, fields: (keyof T)[]): T {
  const encrypted = { ...data };
  for (const field of fields) {
    const v = encrypted[field];
    if (v !== undefined && v !== null) {
      encrypted[field] = encrypt(String(v)) as T[keyof T];
    }
  }
  return encrypted;
}

export function decryptFields<T extends Record<string, unknown>>(data: T, fields: (keyof T)[]): T {
  const decrypted = { ...data };
  for (const field of fields) {
    const v = decrypted[field];
    if (v !== undefined && v !== null) {
      decrypted[field] = decrypt(String(v)) as T[keyof T];
    }
  }
  return decrypted;
}