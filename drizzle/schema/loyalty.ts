import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  int,
  timestamp,
  json,
} from "drizzle-orm/mysql-core";

import { users } from "./users";
import { orders } from "./orders";

// ✅ Interface para tipagem das regras de resgate
export interface RedemptionRule {
  minOrderValue: number;
  maxDiscount: number;
}

/**
 * ⚙️ 2. CONFIGURAÇÕES DO PROGRAMA (Loyalty Settings)
 */
export const loyaltySettings = mysqlTable("loyalty_settings", {
  // Ajustado para varchar(255) conforme seu código, mas garanta que o banco suporte
  id: varchar("id", { length: 255 }).primaryKey(),
  enabled: boolean("enabled").default(true),
  
  // --- REGRAS DE ACÚMULO (CONVERSÃO) ---
  // Relação Real -> Pontos (Ex: R$ 1,00 gasto = 1 ponto ganho)
  conversionRatePoints: int("conversion_rate_points").default(1), 
  conversionRateMoney: decimal("conversion_rate_money", { precision: 10, scale: 2 }).default("1.00"),
  
  // --- REGRAS DE RESGATE (REDEMPTION) ---
  // ✅ NOVA COLUNA: Regras por Faixa (JSON)
  redemptionRules: json("redemption_rules").$type<RedemptionRule[]>().notNull().default([]),

  // ✅ RESGATE LINEAR (FALLBACK): Removida a duplicidade de chaves
  redemptionRatePoints: int("redemption_rate_points").default(100),
  redemptionRateMoney: decimal("redemption_rate_money", { precision: 10, scale: 2 }).default("1.00"),
  
  // --- LIMITES E TRAVAS ---
  minCartAmount: decimal("min_cart_amount", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }).default("50.00"),
  
  // Mensagem personalizada para valor mínimo insuficiente
  minOrderMessage: text("min_order_message"),

  // --- BÔNUS E VALIDADE ---
  pointsPerSignup: int("points_per_signup").default(0),
  pointsPerReview: int("points_per_review").default(0),
  pointsExpirationDays: int("points_expiration_days").default(365),

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * 💰 1. SALDO DE PONTOS (Wallet)
 */
export const loyaltyPoints = mysqlTable("loyalty_points", {
  userId: varchar("user_id", { length: 255 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  
  availablePoints: int("available_points").default(0).notNull(),
  totalEarned: int("total_earned").default(0).notNull(),
  
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * 📑 3. EXTRATO / HISTÓRICO
 */
export const loyaltyHistory = mysqlTable("loyalty_history", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  orderId: varchar("order_id", { length: 255 })
    .references(() => orders.id, { onDelete: "set null" }),

  pointsChange: int("points_change").notNull(),
  type: varchar("type", { length: 20 }).default('earned').notNull(), // 'earned', 'spent', 'expired', 'bonus'
  reason: varchar("reason", { length: 255 }),
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// --- RELAÇÕES ---
export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  user: one(users, { fields: [loyaltyPoints.userId], references: [users.id] }),
}));

export const loyaltyHistoryRelations = relations(loyaltyHistory, ({ one }) => ({
  user: one(users, { fields: [loyaltyHistory.userId], references: [users.id] }),
  order: one(orders, { fields: [loyaltyHistory.orderId], references: [orders.id] }),
}));