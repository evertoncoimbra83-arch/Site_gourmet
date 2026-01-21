import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";

import { users } from "./users.js";
import { orders } from "./orders.js";

// --- CONFIGURAÇÕES DO SISTEMA DE PONTOS ---
export const loyaltySettings = mysqlTable("loyalty_settings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  enabled: boolean("enabled").default(true),
  
  // Mapeamento explícito para snake_case do banco
  conversionRatePoints: int("conversion_rate_points").default(1), 
  conversionRateMoney: decimal("conversion_rate_money", { precision: 10, scale: 2 }).default("1.00"),
  redemptionRatePoints: int("redemption_rate_points").default(100),
  redemptionRateMoney: decimal("redemption_rate_money", { precision: 10, scale: 2 }).default("1.00"),

  minCartAmount: decimal("min_cart_amount", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }).default("50.00"),
  
  // Campos de bônus que o seu Admin utiliza
  pointsPerSignup: int("points_per_signup").default(100),
  pointsPerReview: int("points_per_review").default(10),
  pointsExpirationDays: int("points_expiration_days").default(365),

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- HISTÓRICO DE MOVIMENTAÇÃO DE PONTOS ---
export const loyaltyHistory = mysqlTable("loyalty_history", {
  id: varchar("id", { length: 255 }).primaryKey(),
  
  // ✅ IMPORTANTE: userId no código mapeia para user_id no banco
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
    
  // ✅ IMPORTANTE: pointsChange no código mapeia para points_change no banco
  pointsChange: int("points_change").notNull(),
  
  reason: varchar("reason", { length: 255 }),
  
  // ✅ IMPORTANTE: orderId no código mapeia para order_id no banco
  orderId: varchar("order_id", { length: 255 })
    .references(() => orders.id), 
    
  description: text("description"),
  type: varchar("type", { length: 20 }).default('earned'), 
  createdAt: timestamp("created_at").defaultNow(),
});

// --- RELAÇÕES ---
export const loyaltyHistoryRelations = relations(loyaltyHistory, ({ one }) => ({
  user: one(users, { 
    fields: [loyaltyHistory.userId], 
    references: [users.id] 
  }),
  order: one(orders, { 
    fields: [loyaltyHistory.orderId], 
    references: [orders.id] 
  }),
}));