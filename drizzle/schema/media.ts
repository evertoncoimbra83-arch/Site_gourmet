import { mysqlTable, varchar, timestamp, bigint, int } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const media = mysqlTable("media", {
  // ✅ CORREÇÃO: Mudado para serial (que é bigint auto_increment no MySQL)
  // Isso resolve o erro 2769 e faz o banco atualizar sozinho
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  
  url: varchar("url", { length: 512 }).notNull(),
  
  // ✅ Ajustado nomes para bater com a tabela que você enviou (media_library / media)
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  
  mimeType: varchar("mime_type", { length: 50 }),
  
  // ✅ Importante para o delete físico funcionar
  filePath: varchar("file_path", { length: 255 }).notNull(),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});