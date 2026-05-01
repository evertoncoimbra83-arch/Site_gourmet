import { mysqlTable, varchar, text, timestamp, serial } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const auditLogs = mysqlTable("audit_logs", {
  // ✅ SERIAL define automaticamente: INT NOT NULL AUTO_INCREMENT PRIMARY KEY
  id: serial("id").primaryKey(),
  
  // Referência ao usuário (UUID do Clerk/Auth)
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  
  // Ação executada (Ex: "LOGIN", "UPDATE_PRODUCT")
  action: varchar("action", { length: 100 }).notNull(),
  
  // Tabela e ID do registro afetado
  entity: varchar("entity", { length: 100 }),
  entityId: varchar("entity_id", { length: 255 }),
  
  // Valores em JSON (usamos text para compatibilidade ampla)
  oldValues: text("old_values"),
  newValues: text("new_values"),
  
  // Informações de rede
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});