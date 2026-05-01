import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function restoreDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "gourmet_saudavel",
    port: process.env.DB_PORT || 10005,
  });

  try {
    

    // Ler arquivos CSV
    const csvDir = "/home/ubuntu/db-backup";
    const files = fs.readdirSync(csvDir).filter(f => f.endsWith(".csv"));

    for (const file of files) {
      if (file === "__drizzle_migrations.csv") continue;

      const filePath = path.join(csvDir, file);
      const tableName = file.replace(".csv", "");
      const content = fs.readFileSync(filePath, "utf-8");
      const records = parse(content, { columns: true });

      

      for (const record of records) {
        const columns = Object.keys(record);
        const values = Object.values(record);
        const placeholders = columns.map(() => "?").join(",");

        const sql = `INSERT INTO ${tableName} (${columns.join(",")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE id=id`;

        try {
          await connection.execute(sql, values);
        } catch (err) {
          
        }
      }
    }

    
  } catch (error) {
    
  } finally {
    await connection.end();
  }
}

restoreDatabase();
