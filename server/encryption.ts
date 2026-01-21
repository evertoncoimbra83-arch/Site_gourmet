// server/encryption.ts
import * as crypto from "crypto";
import { customType } from "drizzle-orm/mysql-core";

/**
 * Módulo de criptografia AES-256-GCM para proteger dados sensíveis.
 * Padrão de mercado (ALE - Application Level Encryption).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Padrão recomendado para GCM é 12 bytes
const PII_PEPPER = process.env.PII_PEPPER || "";

/**
 * Obtém/Gera a chave de criptografia de 32 bytes
 */
function getEncryptionKey(): Buffer {
  let key = process.env.DB_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("❌ ERRO CRÍTICO: DB_ENCRYPTION_KEY não configurada em produção!");
    }
    key = "dev-secret-key-pode-ser-curta";
  }

  // Scrypt garante que a chave tenha sempre 32 bytes (256 bits) independente do input
  return crypto.scryptSync(key, "static-salt", 32);
}

// --- HELPERS DE HASHING (Para buscas no DB) ---

export function normalizeDigits(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

export function piiHash(input: string | null | undefined): string | null {
  if (!input) return null;
  // Permite rodar sem pepper em dev, mas avisa
  if (!PII_PEPPER && process.env.NODE_ENV === "production") {
      console.warn("⚠️ PII_PEPPER ausente. Hashes menos seguros.");
  }
  return crypto.createHash("sha256").update(`${PII_PEPPER}:${input}`).digest("hex");
}

// --- NÚCLEO DE CRIPTOGRAFIA ---

/**
 * Criptografa um texto: iv:authTag:encryptedData
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = String(text).trim(); // Garante que é string
  if (!t) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(t, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    
    // Formato: IV:TAG:DADO
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("❌ [ENCRYPTION] Erro ao criptografar:", error);
    return null;
  }
}

/**
 * Descriptografa dados.
 * ✅ BLINDADO: Aceita String ou Buffer (resolve o erro data.split)
 */
export function decrypt(data: string | Buffer | null | undefined): string | null {
  if (!data) return null;

  // 1. Converte Buffer para String se necessário
  let text = "";
  if (Buffer.isBuffer(data)) {
    text = data.toString('utf-8');
  } else {
    text = String(data);
  }

  // 2. Verifica formato
  const parts = text.split(":");
  
  // Se não tem 3 partes, assume que é legado (texto puro) ou inválido
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
  } catch (error) {
    // Retorna o dado original se falhar (fallback de segurança para migração)
    // console.error("❌ [ENCRYPTION] Falha ao descriptografar:", (error as Error).message);
    return text; 
  }
}

// --- 🛡️ INTEGRAÇÃO NATIVA DRIZZLE ---

/**
 * Tipo customizado para o Drizzle. 
 * Use em vez de varchar() para campos sensíveis.
 */
export const encryptedText = (columnName: string) => 
  customType<{ data: string }>({
    dataType() {
      // ✅ Alterado para BLOB para evitar problemas de encoding no banco
      return "blob"; 
    },
    toDriver(value: string) {
      // Encripta automaticamente ao salvar
      const encrypted = encrypt(value);
      return encrypted as string; 
    },
    fromDriver(value: unknown) {
      // ✅ BLINDAGEM: Verifica se é Buffer antes de descriptografar
      if (Buffer.isBuffer(value)) {
        return decrypt(value) as string;
      }
      return decrypt(String(value)) as string;
    },
  })(columnName);


// --- HELPERS MANUAIS ---

export function encryptFields<T extends Record<string, any>>(data: T, fields: (keyof T)[]): T {
  const encrypted = { ...data };
  for (const field of fields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      const v = encrypted[field];
      encrypted[field] = encrypt(typeof v === "string" ? v : String(v)) as any;
    }
  }
  return encrypted;
}

export function decryptFields<T extends Record<string, any>>(data: T, fields: (keyof T)[]): T {
  const decrypted = { ...data };
  for (const field of fields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      decrypted[field] = decrypt(decrypted[field]) as any;
    }
  }
  return decrypted;
}