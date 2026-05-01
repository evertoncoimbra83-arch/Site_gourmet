import { mysqlTable, varchar, decimal, timestamp, text, boolean, int } from "drizzle-orm/mysql-core";
import { users } from "./users"; 

export const carts = mysqlTable("carts", {
  /**
   * ✅ ID DO CARRINHO
   * UUID v4 gerado no backend.
   */
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  
  /**
   * 👤 USUÁRIO LOGADO (Opcional)
   */
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  
  /**
   * 👻 VISITANTE (Opcional)
   * Armazena o UUID gerado no LocalStorage.
   */
  guestId: varchar("guest_id", { length: 36 }),

  /**
   * 🚀 MONITORAMENTO: REFERRAL
   * "Carimba" o carrinho com o código de indicação (ex: ?ref=NUTRI01).
   * Essencial para o seu Monitor mostrar quem indicou este cliente.
   */
  referralCode: varchar("referral_code", { length: 50 }),

  // Status da sessão (active, abandoned, completed)
  status: varchar("status", { length: 20 }).default("active"),

  // Campo legado para sessão do Lucia
  sessionId: varchar("session_id", { length: 255 }), 

  // 💰 Valores Monetários
  shippingValue: decimal("shipping_value", { precision: 10, scale: 2 }).default("0.00"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0.00"),
  
  // 🎟️ Cupons e Descontos
  couponCode: varchar("coupon_code", { length: 50 }),
  couponId: int("coupon_id"), 
  
  /**
   * ✅ Uso do tipo 'boolean'
   */
  usesLoyalty: boolean("uses_loyalty").default(false),

  // 📦 JSONs de Cache
  discountsJson: text("discounts_json"), 
  itemsSnapshotJson: text("items_snapshot_json"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});