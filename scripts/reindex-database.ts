import "dotenv/config"; 
import { getDb } from "../server/db"; 
import { users } from "../drizzle/schema/"; 
import { eq } from "drizzle-orm";
import { piiHash, normalizeDigits, decrypt } from "../server/encryption";

/**
 * 🧹 HELPER DE NORMALIZAÇÃO
 * Transforma "João da Silva" em "joao da silva"
 * Salvar o texto assim no nameIndex permite busca parcial com LIKE.
 */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, " ") 
    .trim();
}

async function reindexDatabase() {
  
  
  
  const db = await getDb();

  // 1. Busca todos os usuários da base
  const allUsers = await db.select().from(users);
  

  let successCount = 0;
  let errorCount = 0;

  for (const user of allUsers) {
    try {
      // --- A. CPF (Continua sendo Blind Index / Hash Seguro) ---
      const rawDoc = user.customerDocument ? String(user.customerDocument) : "";
      const decryptedDoc = decrypt(rawDoc);
      let newDocHash = null;
      if (decryptedDoc) {
        newDocHash = piiHash(normalizeDigits(decryptedDoc)); 
      }

      // --- B. NOME (Agora será TEXTO LIMPO no índice para busca parcial) ---
      const rawName = user.name ? String(user.name) : "";
      const decryptedName = decrypt(rawName);
      let newNameValue = null;
      if (decryptedName) {
        // ✅ MUDANÇA: Não usamos piiHash aqui. Salvamos o texto para o LIKE.
        newNameValue = normalizeForSearch(decryptedName);
      }

      // --- C. TELEFONE (Continua sendo Blind Index / Hash Seguro) ---
      const rawPhone = user.phone ? String(user.phone) : "";
      const decryptedPhone = decrypt(rawPhone);
      let newPhoneHash = null;
      if (decryptedPhone) {
        newPhoneHash = piiHash(normalizeDigits(decryptedPhone));
      }

      // --- D. ATUALIZAÇÃO NO BANCO ---
      await db.update(users)
        .set({
          documentIndex: newDocHash, // Hash Exato
          nameIndex: newNameValue,   // ✅ Texto Aberto (joao silva)
          phoneIndex: newPhoneHash,  // Hash Exato
        } as any)
        .where(eq(users.id, user.id));

      successCount++;
      if (successCount % 10 === 0) process.stdout.write("."); // Feedback a cada 10 registros

    } catch (err) {
      
      errorCount++;
    }
  }

  
  
  
  
  
  process.exit(0);
}

reindexDatabase().catch((err) => {
  
  process.exit(1);
});