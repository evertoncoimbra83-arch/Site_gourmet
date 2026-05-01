// server/lib/reindex-logic.ts  <-- MOVA PARA CÁ
import crypto from "node:crypto";
import { getDb } from "../../../../server/db";  // Caminho ajustado para a raiz do server
import { users } from "../../../../drizzle/schema/index.js"; // Caminho ajustado para o schema
import { eq } from "drizzle-orm";

const PII_PEPPER = process.env.PII_PEPPER || "";
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || "";
const ALGORITHM = "aes-256-gcm";

// --- FUNÇÕES DE APOIO ---
function getEncryptionKey() {
  // O scryptSync precisa de um buffer ou string. Garantindo que a chave exista.
  return crypto.scryptSync(ENCRYPTION_KEY || "fallback-key", "static-salt", 32);
}

function decrypt(data: string | null | undefined): string | null {
  if (!data) return null;
  const parts = data.split(":");
  if (parts.length !== 3) return data;
  try {
    const [ivHex, tagHex, encryptedText] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted.trim();
  } catch { return null; }
}

function piiHash(input: string): string {
  const cleanData = input.replace(/\D/g, "").trim();
  return crypto.createHash("sha256").update(cleanData + PII_PEPPER).digest("hex");
}

// --- LÓGICA PRINCIPAL ---
export async function reindexUsers() {
  if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY não configurada.");

  const db = await getDb();
  
  // 1. Busca todos os usuários
  const allUsers = await db.select().from(users);
  let count = 0;

  for (const user of allUsers) {
    // Usando as propriedades conforme seu Drizzle Schema
    const cpfEncrypted = user.customerDocument; 
    const cpfReal = decrypt(cpfEncrypted);
    
    if (cpfReal) {
      const novoHash = piiHash(cpfReal);
      const hashAtual = user.documentIndex;
      
      if (novoHash !== hashAtual) {
        await db.update(users)
          .set({ documentIndex: novoHash })
          .where(eq(users.id, user.id));
        count++;
      }
    }
  }

  return { count };
}