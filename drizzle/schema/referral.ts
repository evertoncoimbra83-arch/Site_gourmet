import { mysqlTable, varchar, timestamp, text, decimal, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./users"; 
import { orders } from "./orders"; 
import { carts } from "./cart";

/**
 * TABELA DE PARCEIROS E INDICADORES
 * Gerencia Nutricionistas, Academias e Influenciadores.
 */
export const referrals = mysqlTable("referrals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  
  // O código que será usado na URL (?ref=JULIA10)
  code: varchar("code", { length: 50 }).notNull().unique(), 
  
  name: varchar("name", { length: 255 }).notNull(),
  
  // Categoria do parceiro para filtros no Monitor
  type: varchar("type", { length: 50 }).default("nutri"), 
  
  // Vinculação com a conta de usuário (para o parceiro ver o próprio painel)
  userId: varchar("user_id", { length: 255 }), 
  
  // Configurações financeiras
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.00"), 
  
  notes: text("notes"),
  
  /**
   * ✅ CAMPO DE STATUS
   * Permite pausar parcerias sem deletar os dados históricos.
   */
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * DEFINIÇÃO DE RELAÇÕES
 * Facilita a busca de "Quais pedidos a Nutri X gerou?" via ORM.
 */
export const referralsRelations = relations(referrals, ({ many, one }) => ({
  author: one(users, {
    fields: [referrals.userId],
    references: [users.id],
  }),
  attributedOrders: many(orders),
  attributedCarts: many(carts),
}));