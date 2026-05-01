import { mysqlTable, varchar, datetime, text } from "drizzle-orm/mysql-core";
import { users } from "./users"; 

/**
 * TABELA DE SESSÕES (LUCIA AUTH + SGA TRACKING)
 * Gerencia o estado de login e fornece dados para segurança e rastreamento de indicações.
 */
export const sessions = mysqlTable("sessions", {
  /**
   * ✅ ID DA SESSÃO
   * O Lucia Auth exige que este campo seja uma String (VARCHAR).
   */
  id: varchar("id", { length: 255 }).primaryKey(),

  /**
   * 🚩 USER ID
   * Aponta para a tabela 'users'. 
   */
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /**
   * 🏷️ VÍNCULO DE INDICAÇÃO (REFERRAL)
   * Armazena o código capturado da URL (?ref=...) para esta sessão específica.
   * Isso garante que a atribuição de venda seja precisa.
   */
  referralCode: varchar("referral_code", { length: 100 }),

  /**
   * 🆔 GUEST ID (SESSÃO DE CONVIDADO)
   * Útil para vincular o carrinho de quem ainda não logou à sessão atual.
   */
  guestId: varchar("guest_id", { length: 255 }),

  /**
   * ✅ EXPIRAÇÃO
   * { mode: 'date' } para compatibilidade com Lucia v3+.
   */
  expiresAt: datetime("expires_at", { fsp: 3, mode: "date" }).notNull(),

  /**
   * 🛡️ MONITORAMENTO
   */
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;