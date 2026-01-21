// server/check-columns.ts
import "dotenv/config";
import mysql from "mysql2/promise";

async function checkTables() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL vazia");

  console.log("🔌 Conectando ao banco...");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  const tablesToCheck = ["accompanimentGroups", "dishSizes"];

  for (const table of tablesToCheck) {
    console.log(`\n📋 ESTRUTURA DA TABELA: ${table}`);
    console.log("---------------------------------------------------");
    try {
      // O comando DESCRIBE lista as colunas, tipos e se aceita NULL
      const [rows] = await connection.query(`DESCRIBE \`${table}\``);
      console.table(rows);
    } catch (error: any) {
      console.error(`❌ Erro ao ler tabela ${table}:`, error.message);
    }
  }

  await connection.end();
  process.exit(0);
}

checkTables().catch(console.error);