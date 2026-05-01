import { mysqlTable, varchar, timestamp, bigint } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const media = mysqlTable("media", {
  // ✅ ID Robusto
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  
  // ✅ URL Completa do Cloudinary (Ex: https://res.cloudinary.com/...)
  url: varchar("url", { length: 512 }).notNull(),
  
  // ✅ Nome original para busca (Ex: strogonoff-de-frango)
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  
  // ✅ Tipo (image/webp, image/jpeg)
  mimeType: varchar("mime_type", { length: 50 }),
  
  /**
   * ✅ IMPORTANTE: O public_id do Cloudinary (Ex: pratos/imagem_123)
   * Precisamos dele exato para poder deletar o arquivo da nuvem depois.
   */
  filePath: varchar("file_path", { length: 255 }).notNull(),

  /**
   * ✅ COLUNA CRUCIAL: Pasta de Organização
   * É através desta coluna que o MediaPickerModal faz o filtro:
   * (item.folder === currentFolder)
   */
  folder: varchar("folder", { length: 100 }).notNull().default("geral"),
  
  // ✅ Timestamp de auditoria
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});