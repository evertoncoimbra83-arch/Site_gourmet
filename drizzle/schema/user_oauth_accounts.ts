import { mysqlTable, varchar, boolean, timestamp, unique } from "drizzle-orm/mysql-core";
import { users } from "./users";

/**
 * TABELA DE CONTAS OAUTH (GOOGLE, ETC.)
 * Associa uma conta de login social externa (provedor + provider_user_id) a um usuário local.
 */
export const userOauthAccounts = mysqlTable("user_oauth_accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  
  // Vínculo com a tabela de usuários locales
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
    
  // Provedor de identidade (Ex: "google")
  provider: varchar("provider", { length: 50 }).notNull(),
  
  // ID exclusivo do usuário no provedor (Ex: "sub" do payload Google)
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
  
  // E-mail retornado pelo provedor
  email: varchar("email", { length: 255 }).notNull(),
  
  // Indica se o provedor validou a identidade do dono do e-mail
  emailVerified: boolean("email_verified").default(false).notNull(),
  
  // Metadados temporais
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => ({
  // Restrição: O mesmo ID de usuário externo só pode ser vinculado a uma conta local
  providerUserUnq: unique("provider_user_unq").on(table.provider, table.providerUserId),
  // Restrição: Um usuário local só pode vincular uma conta de cada provedor
  userProviderUnq: unique("user_provider_unq").on(table.userId, table.provider),
}));
