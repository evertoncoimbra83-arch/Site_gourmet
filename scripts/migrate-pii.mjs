import crypto from "crypto";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// --- CONFIGURAÇÃO MANUAL (Pegue do seu .env) ---
const PII_PEPPER = process.env.PII_PEPPER || "";
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";

// --- LOGICA DE CRIPTOGRAFIA (Copiada do seu arquivo de encriptar) ---
function getEncryptionKey() {
  return crypto.scryptSync(ENCRYPTION_KEY, "static-salt", 32);
}

function decrypt(data) {
  if (!data) return null;
  const text = String(data);
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
  } catch (e) { return null; }
}

function piiHash(input) {
  if (!input) return null;
  const cleanData = input.replace(/\D/g, "").trim(); // Força a limpeza
  return crypto.createHash("sha256").update(cleanData + PII_PEPPER).digest("hex");
}

// --- EXECUÇÃO ---
async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log("🚀 Buscando usuários...");
  const [users] = await connection.execute("SELECT id, customer_document_hash, document_index FROM users");

  console.log(`📊 Processando ${users.length} registros...`);

  for (const user of users) {
    const cpfReal = decrypt(user.customer_document_hash);
    
    if (cpfReal) {
      const novoHash = piiHash(cpfReal);
      
      if (novoHash !== user.document_index) {
        await connection.execute(
          "UPDATE users SET document_index = ? WHERE id = ?",
          [novoHash, user.id]
        );
        console.log(`✅ ID ${user.id}: Hash atualizado (CPF: ${cpfReal})`);
      } else {
        console.log(`ℹ️ ID ${user.id}: Já está correto.`);
      }
    } else {
      console.warn(`❌ ID ${user.id}: Falha ao descriptografar.`);
    }
  }

  console.log("\n✨ Migração finalizada!");
  await connection.end();
}

run().catch(console.error);