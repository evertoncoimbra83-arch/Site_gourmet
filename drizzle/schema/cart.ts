import { mysqlTable, varchar, decimal, timestamp, text, boolean, int } from "drizzle-orm/mysql-core";
import { users } from "./users.js"; 

export const carts = mysqlTable("carts", {
  /**
   * ✅ ID DO CARRINHO
   * UUID v4 gerado no backend.
   */
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  
  /**
   * 👤 USUÁRIO LOGADO (Opcional)
   * Se o usuário fizer login, preenchemos este campo.
   */
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  
  /**
   * 👻 VISITANTE (Opcional - A CHAVE DO PROBLEMA)
   * Armazena o UUID gerado no LocalStorage para quem não tem login.
   * Isso permite salvar o carrinho mesmo sem sessão do Lucia.
   */
  guestId: varchar("guest_id", { length: 36 }),

  // Status da sessão (active, abandoned, completed)
  status: varchar("status", { length: 20 }).default("active"),

  // Campo legado para sessão do Lucia (pode manter por segurança)
  sessionId: varchar("session_id", { length: 255 }), 

  // 💰 Valores Monetários
  shippingValue: decimal("shipping_value", { precision: 10, scale: 2 }).default("0.00"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0.00"),
  
  // 🎟️ Cupons e Descontos
  couponCode: varchar("coupon_code", { length: 50 }),
  couponId: int("coupon_id"), 
  
  /**
   * ✅ Uso do tipo 'boolean'
   * O Drizzle converte automaticamente para tinyint(1) no MySQL,
   * mas no TypeScript fica boolean (true/false) em vez de number (0/1).
   */
  usesLoyalty: boolean("uses_loyalty").default(false),

  // 📦 JSONs de Cache
  discountsJson: text("discounts_json"), 
  itemsSnapshotJson: text("items_snapshot_json"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});