// server/debug-insert.ts
import "dotenv/config";
import { getDb } from "./db.js";
import { accompanimentGroups } from "../drizzle/schema/index.js";
import { logger } from "./logger.js";

// Interface para capturar erros do banco sem usar 'any'
interface DatabaseError {
  message: string;
  code?: string;
  sqlState?: string;
  sql?: string;
}

async function debug(): Promise<void> {
  const db = await getDb();
  
  if (!db) {
    logger.error("Falha ao conectar com o banco de dados.");
    process.exit(1);
  }

  const timestamp = Date.now();
  const groupName = `Grupo Debug ${timestamp}`;

  try {
    logger.info({ groupName }, "Iniciando inserção de teste...");

    // ✅ Ajustado de acordo com o que o seu Schema realmente suporta
    const newGroup: typeof accompanimentGroups.$inferInsert = {
      name: groupName,
      slug: `debug-${timestamp}`,
      isActive: true,
      // Removidos createdAt e updatedAt pois não existem na sua tabela
      minSelections: 1,
      maxSelections: 1
    };

    await db.insert(accompanimentGroups).values(newGroup);
    
    logger.info("✅ Inserção de debug realizada com sucesso!");

  } catch (error: unknown) {
    const dbError = error as DatabaseError;
    
    logger.error({ 
      message: dbError.message || "Erro desconhecido",
      code: dbError.code,
      sqlState: dbError.sqlState,
      query: dbError.sql 
    }, "❌ Erro na inserção de debug");
  } finally {
    process.exit(0);
  }
}

void debug();