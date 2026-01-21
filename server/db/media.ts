import { mysqlTable, serial, varchar, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const media = mysqlTable("media", {
  id: serial("id").primaryKey(),
  
  // Mapeamento exato: snake_case no banco -> camelCase no código
  url: varchar("url", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  filePath: varchar("file_path", { length: 255 }).notNull(),
  
  // Removemos fileSize e uploadedBy pois sua tabela não tem essas colunas ainda
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});