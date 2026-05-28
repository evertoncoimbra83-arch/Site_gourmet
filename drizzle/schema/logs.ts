import { index, mysqlTable, varchar, text, timestamp, serial } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const auditLogs = mysqlTable("audit_logs", {
  // ✅ SERIAL define automaticamente: INT NOT NULL AUTO_INCREMENT PRIMARY KEY
  id: serial("id").primaryKey(),
  
  // Referência ao usuário (UUID do Clerk/Auth)
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  
  // Ação executada (Ex: "LOGIN", "UPDATE_PRODUCT")
  action: varchar("action", { length: 100 }).notNull(),
  
  // Módulo organizacional (Ex: "settings", "orders")
  module: varchar("module", { length: 100 }).default("system").notNull(),
  
  // Classificação de criticidade do log (Ex: "info", "warning", "critical")
  severity: varchar("severity", { length: 20 }).default("info").notNull(),

  // Tabela e ID do registro afetado
  entity: varchar("entity", { length: 100 }),
  entityId: varchar("entity_id", { length: 255 }),
  
  // Rótulo amigável da entidade (Ex: "Pix", "Cupom DESCONTO")
  entityLabel: varchar("entity_label", { length: 255 }),
  
  // Valores em JSON (usamos text para compatibilidade ampla)
  oldValues: text("old_values"),
  newValues: text("new_values"),
  
  // Informações de rede e rastreabilidade de sessão
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestId: varchar("request_id", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  moduleIdx: index("audit_logs_module_idx").on(table.module),
  severityIdx: index("audit_logs_severity_idx").on(table.severity),
  requestIdIdx: index("audit_logs_request_id_idx").on(table.requestId),
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  entityLookupIdx: index("audit_logs_entity_lookup_idx").on(table.entity, table.entityId),
}));
