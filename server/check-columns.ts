// server/check-columns.ts
import "dotenv/config";
import mysql from "mysql2/promise";
import { logger } from "./logger.js";

async function checkTables(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    logger.error("❌ DATABASE_URL não configurada no arquivo .env");
    process.exit(1);
  }

  let connection;

  try {
    // Usamos mysql2 diretamente para garantir a execução do comando 'DESCRIBE' puro
    connection = await mysql.createConnection(dbUrl);
    logger.info("🔌 Conexão estabelecida. Inspecionando estrutura das tabelas...");

    const tablesToCheck = [
      "accompanimentGroups", 
      "dishSizes", 
      "base_ceps", // Adicionei aqui para você conferir se os campos de GPS estão ok
      "geo_mesh"
    ];

    for (const table of tablesToCheck) {
      try {
        // DESCRIBE fornece: Field, Type, Null, Key, Default, Extra
        const [rows] = await connection.query(`DESCRIBE \`${table}\``);
        
        console.log(`\n📊 TABELA: ${table.toUpperCase()}`);
        console.table(rows);

      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.warn({ table, error: msg }, `⚠️ Tabela não encontrada ou inacessível.`);
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error({ error: msg }, "❌ Falha crítica ao conectar no MariaDB.");
  } finally {
    if (connection) {
      await connection.end();
      logger.info("🔒 Conexão encerrada.");
    }
    process.exit(0);
  }
}

// Execução do script
checkTables().catch((err) => {
  console.error("Erro fatal no script:", err);
  process.exit(1);
});