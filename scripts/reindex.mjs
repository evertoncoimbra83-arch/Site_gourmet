/* eslint-env node */
import crypto from "crypto";
import { Buffer } from "buffer"; // ✅ Importe explícito para o ESLint parar de reclamar
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Carrega o .env da raiz do projeto
dotenv.config();

// --- CONFIGURAÇÃO ---
const PII_PEPPER = process.env.PII_PEPPER || "";
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const ALGORITHM = "aes-256-gcm";

if (!ENCRYPTION_KEY || !DATABASE_URL) {
  console.error("❌ Erro: ENCRYPTION_KEY ou DATABASE_URL não encontradas no .env");
  process.exit(1);
}

// --- LOGICA DE CRIPTOGRAFIA ---
function getEncryptionKey() {
  return crypto.scryptSync(ENCRYPTION_KEY, "static-salt", 32);
}

function decrypt(data) {
  if (!data) return null;
  
  const text = Buffer.isBuffer(data) ? data.toString("utf8") : String(data);
  
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
    return decrypted.trim();
  } catch {
    return null;
  }
}

function piiHash(input) {
  if (!input) return null;
  const cleanData = String(input).replace(/\D/g, "").trim();
  
  return crypto
    .createHash("sha256")
    .update(cleanData + PII_PEPPER)
    .digest("hex");
}

// --- EXECUÇÃO ---
async function run() {
  console.log("🚀 Conectando ao banco de dados...");
  
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    const [users] = await connection.execute(
      "SELECT id, customer_document_hash, document_index FROM users"
    );

    console.log(`📊 Processando ${users.length} usuários encontrados...`);
    let count = 0;

    for (const user of users) {
      const cpfReal = decrypt(user.customer_document_hash);
      
      if (cpfReal) {
        const novoHash = piiHash(cpfReal);
        
        if (novoHash !== user.document_index) {
          await connection.execute(
            "UPDATE users SET document_index = ? WHERE id = ?",
            [novoHash, user.id]
          );
          console.log(`✅ ID ${user.id} [ATUALIZADO] -> CPF: ${cpfReal}`);
          count++;
        } else {
          console.log(`ℹ️ ID ${user.id} [OK]`);
        }
      } else {
        console.warn(`⚠️ ID ${user.id}: Falha na descriptografia.`);
      }
    }

    console.log(`\n✨ Migração finalizada! ${count} registros corrigidos.`);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    if (connection) await connection.end();
  }
}

run();