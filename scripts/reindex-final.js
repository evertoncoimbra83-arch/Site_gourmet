import "dotenv/config";
import { getDb } from "./dist/server/db.js"; 
import { users } from "./dist/drizzle/schema/index.js"; 
import { eq } from "drizzle-orm";
// Importamos as funções de criptografia da dist também
import { piiHash, normalizeDigits, decrypt } from "./dist/server/encryption.js";

function normalizeForSearch(text) {
  if (!text) return "";
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}

async function reindex() {
  
  const db = await getDb();
  const allUsers = await db.select().from(users);
  

  for (const user of allUsers) {
    try {
      const decName = decrypt(String(user.name));
      const decDoc = decrypt(String(user.customerDocument));
      const decPhone = decrypt(String(user.phone));

      await db.update(users).set({
        nameIndex: decName ? normalizeForSearch(decName) : null,
        documentIndex: decDoc ? piiHash(normalizeDigits(decDoc)) : null,
        phoneIndex: decPhone ? piiHash(normalizeDigits(decPhone)) : null,
      }).where(eq(users.id, user.id));
      
      process.stdout.write(".");
    } catch (e) {
      
    }
  }
  
  process.exit(0);
}

reindex();