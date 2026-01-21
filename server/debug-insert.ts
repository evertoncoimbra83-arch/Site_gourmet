// server/debug-insert.ts
import "dotenv/config";
import { getDb } from "./db";
import { accompanimentGroups } from "../drizzle/schema";

async function debug() {
  const db = await getDb();
  if (!db) return console.error("Sem conexão DB");

  console.log("🔍 Tentando inserir um grupo de teste...");

  try {
    // CORREÇÃO: Usando os nomes em CamelCase definidos no schema
    const result = await db.insert(accompanimentGroups).values({
      name: "Grupo Debug " + Date.now(),
      slug: "debug-" + Date.now(),
      description: "Teste de inserção",
      isActive: true,       // Antes: is_active
      createdAt: new Date(), // Antes: created_at
      updated_at: new Date(), // Antes: updated_at
    });
    
    console.log("✅ SUCESSO! ID inserido:", result);
  } catch (error: any) {
    console.error("\n❌ ERRO FATAL DETECTADO:");
    console.error("Mensagem:", error.message);
    if (error.sqlState) console.error("Código SQL State:", error.sqlState);
    if (error.sql) console.error("Query SQL tentada:", error.sql);
  }
  
  process.exit(0);
}

debug();