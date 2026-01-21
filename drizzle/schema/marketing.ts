import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  int,
  timestamp,
  mysqlEnum
} from "drizzle-orm/mysql-core";

import { users } from "./users.js";
import { orders } from "./orders.js";

// ====================================================
// --- REGRAS DE DESCONTO PROGRESSIVO ---
// ====================================================

/**
 * ⚙️ REGRAS DE DESCONTO (Ex: Compre 5 ganhe 10%)
 * Baseado estritamente na estrutura real da sua tabela física.
 */
export const discountRules = mysqlTable("discount_rules", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 512 }),
  
  // Colunas de Quantidade (min_quantity)
  minQuantity: int("min_quantity"),
  maxQuantity: int("max_quantity"),
  
  // Mapeamento: JS 'discountType' -> DB 'type' | JS 'discountValue' -> DB 'value'
  discountType: mysqlEnum("type", ["percentage", "fixed"]).notNull(),
  discountValue: decimal("value", { precision: 10, scale: 2 }).notNull(),
  
  priority: int("priority"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ====================================================
// --- CUPONS DE DESCONTO ---
// ====================================================

export const coupons = mysqlTable("coupons", {
  id: varchar("id", { length: 255 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  
  // Mapeamento: JS 'discountType' -> DB 'discount_type'
  discountType: mysqlEnum("discount_type", ["percentage", "fixed"]).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: int("usage_limit"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================================
// --- LOG DE USO E RELAÇÕES ---
// ====================================================

export const couponUsage = mysqlTable("coupon_usage", { 
  id: varchar("id", { length: 255 }).primaryKey(),
  couponId: varchar("coupon_id", { length: 255 }).notNull().references(() => coupons.id),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  orderId: varchar("order_id", { length: 255 }).references(() => orders.id),
  usedAt: timestamp("used_at").defaultNow(),
});

export const couponRelations = relations(coupons, ({ many }) => ({
  usage: many(couponUsage),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupons, { fields: [couponUsage.couponId], references: [coupons.id] }),
  user: one(users, { fields: [couponUsage.userId], references: [users.id] }),
  order: one(orders, { fields: [couponUsage.orderId], references: [orders.id] }),
}));