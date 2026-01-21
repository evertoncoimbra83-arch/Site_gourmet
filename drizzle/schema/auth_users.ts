import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

/**
 * 👤 TABELA DE USUÁRIOS DE AUTENTICAÇÃO
 */
export const authUsers = mysqlTable("auth_users", {
  id: varchar("id", { length: 255 }).primaryKey(), 
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),

  /**
   * ✅ CAMPOS DE RESET (Agora tipados corretamente)
   */
  resetToken: varchar("reset_token", { length: 255 }),
  resetExpires: timestamp("reset_expires"),
});