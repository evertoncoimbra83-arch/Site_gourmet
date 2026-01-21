import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  decimal,
  int,
  timestamp,
  mysqlEnum,
  text,
  customType
} from "drizzle-orm/mysql-core";

import { users } from "./users.js";
import { dishes } from "./catalog.js"; 
import { packages } from "./packages.js";
import { loyaltyHistory } from "./loyalty.js"; 
import { encrypt, decrypt } from "../../server/encryption.js"; 

// --- TIPO CUSTOMIZADO PARA ENCRIPTAÇÃO (Dados Sensíveis PII) ---
const encryptedText = customType<{ data: string | null }>({
  dataType() { return 'text'; },
  toDriver(value: unknown) {
    if (!value) return null;
    const str = String(value);
    return str.includes(':') ? str : encrypt(str);
  },
  fromDriver(value: unknown) {
    if (!value) return null;
    const str = String(value);
    try {
      return str.includes(':') ? decrypt(str) : str;
    } catch (e) {
      return str; 
    }
  },
});

// --- TABELA DE PEDIDOS (CABECALHO) ---
export const orders = mysqlTable("orders", {
  /** * ✅ ID AMIGÁVEL GS-XXXX 
   * Mantemos varchar(255) para flexibilidade.
   */
  id: varchar("id", { length: 255 }).primaryKey(), 
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  status: mysqlEnum("status", ["pending", "preparing", "shipped", "delivered", "cancelled", "completed"])
    .default("pending")
    .notNull(),
  
  // Financeiro
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalDiscount: decimal("total_discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  // Detalhes do Pagamento e Descontos
  discountsSnapshot: text("discounts_snapshot"), 
  paymentMethod: varchar("payment_method", { length: 255 }).notNull(),
  paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  pixCopyPaste: text("pix_copy_paste"),
  
  // Dados do Cliente (Protegidos)
  customerName: encryptedText("customer_name"), 
  customerDocument: encryptedText("customer_document"), 
  customerPhone: encryptedText("customer_phone"),
  customerDocumentHash: varchar("customer_document_hash", { length: 255 }),
  customerPhoneHash: varchar("customer_phone_hash", { length: 255 }),
  
  // Endereço de Entrega
  shippingAddress: encryptedText("shipping_address"),
  shippingAddressNumber: encryptedText("shipping_address_number"),
  shippingAddressComplement: encryptedText("shipping_address_complement"),
  shippingNeighborhood: encryptedText("shipping_neighborhood"),
  shippingCity: varchar("shipping_city", { length: 100 }),
  shippingState: varchar("shipping_state", { length: 2 }),
  shippingZipCode: varchar("shipping_zip_code", { length: 20 }),
  
  // Fidelidade
  loyaltyPointsUsed: int("loyalty_points_used").default(0),
  loyaltyPointsEarned: int("loyalty_points_earned").default(0),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- TABELA DE ITENS DO PEDIDO (DETALHE) ---
export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  
  dishId: varchar("dish_id", { length: 255 }).references(() => dishes.id),
  packageId: varchar("package_id", { length: 255 }).references(() => packages.id), 
  
  dishName: varchar("dish_name", { length: 255 }).notNull(),
  sizeName: varchar("size_name", { length: 100 }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  
  // ✅ COLUNAS PARA CUSTOMIZAÇÃO (JSON)
  options: text("options"),               // JSON Completo (Escolhas de marmitas e acompanhamentos)
  appliedNutrition: text("applied_nutrition"), 
});

// --- RELAÇÕES ---
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  loyaltyHistory: many(loyaltyHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  package: one(packages, { fields: [orderItems.packageId], references: [packages.id] }),
  dish: one(dishes, { fields: [orderItems.dishId], references: [dishes.id] }),
}));