// server/db/auto-migrate.ts

import { getDb } from "../db";
import { sql } from "drizzle-orm";

export async function runAutoMigrations() {
  const db = await getDb();
  if (!db) return;

  try {
    // 1. Garante que a tabela store_settings existe
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_settings (
        id VARCHAR(255) PRIMARY KEY,
        general_min_order_amount DECIMAL(10,2) DEFAULT 0.00,
        min_order_message TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Tenta adicionar a coluna emergency_mode (se não existir)
    try {
      await db.execute(sql`ALTER TABLE store_settings ADD COLUMN emergency_mode BOOLEAN DEFAULT FALSE;`);
      
    } catch (e: unknown) {
      // FIX TS18046: Tratando o erro 'unknown' de forma segura
      const error = e as { code?: string };
      if (error.code === 'ER_DUP_FIELDNAME') { 
        /* Coluna já existe, ignoramos o erro silenciosamente */ 
      } else {
        throw e;
      }
    }

    // 3. Garante que a tabela app_configs existe
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_configs (
        config_key VARCHAR(100) PRIMARY KEY,
        config_value LONGBLOB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Garante que o registro padrão existe
    await db.execute(sql`
      INSERT IGNORE INTO store_settings (id, general_min_order_amount, min_order_message, emergency_mode)
      VALUES ('1', 0.00, 'Mínimo: {min_amount}', FALSE);
    `);

  // ✅ CORREÇÃO ESLint: Removida a variável 'error' não utilizada
  } catch { 
    /* Catch global silencioso para evitar travamento no boot */
  }
}