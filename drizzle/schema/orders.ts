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

import { users } from "./users";
import { dishes } from "./catalog"; 
import { packages } from "./packages";
import { loyaltyHistory } from "./loyalty"; 
import { nutriScansTemp } from "./aiIntelligence.ts"; 
import { encrypt, decrypt } from "../../server/encryption"; 

// --- TIPO CUSTOMIZADO PARA ENCRIPTAÇÃO ---
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
    } catch {
      // ✅ FIX: Removido o parâmetro 'e' não utilizado para satisfazer o ESLint
      return str; 
    }
  },
});

// --- TABELA DE PEDIDOS (CABECALHO) ---
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(), 
  
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),

  originScanId: varchar("origin_scan_id", { length: 255 }),
    
  status: mysqlEnum("status", ["pending", "preparing", "shipped", "delivered", "cancelled", "completed"])
    .default("pending")
    .notNull(),
  
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalDiscount: decimal("total_discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  referralCode: varchar("referral_code", { length: 50 }),

  pointsUsed: int("points_used").default(0),
  pointsEarned: int("points_earned").default(0),
  loyaltyDiscount: decimal("loyalty_discount", { precision: 10, scale: 2 }).default("0.00"),
  
  cartId: varchar("cart_id", { length: 36 }),
  discountsSnapshot: text("discounts_snapshot"), 
  paymentMethod: varchar("payment_method", { length: 255 }).notNull(),
  paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "failed", "refunded"])
    .default("pending")
    .notNull(),
  pixCopyPaste: text("pix_copy_paste"),
  
  customerName: encryptedText("customer_name"), 
  customerDocument: encryptedText("customer_document"), 
  customerPhone: encryptedText("customer_phone"),
  customerDocumentHash: varchar("customer_document_hash", { length: 255 }),
  customerPhoneHash: varchar("customer_phone_hash", { length: 255 }),
  
  shippingAddress: encryptedText("shipping_address"),
  shippingAddressNumber: encryptedText("shipping_address_number"),
  shippingAddressComplement: encryptedText("shipping_address_complement"),
  shippingNeighborhood: encryptedText("shipping_neighborhood"),
  shippingCity: varchar("shipping_city", { length: 100 }),
  shippingState: varchar("shipping_state", { length: 2 }),
  shippingZipCode: varchar("shipping_zip_code", { length: 20 }), 
  
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
  
  options: text("options"),
  appliedNutrition: text("applied_nutrition"), 
});

// --- RELAÇÕES ---
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  scan: one(nutriScansTemp, { fields: [orders.originScanId], references: [nutriScansTemp.id] }),
  items: many(orderItems),
  loyaltyHistory: many(loyaltyHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  package: one(packages, { fields: [orderItems.packageId], references: [packages.id] }),
  dish: one(dishes, { fields: [orderItems.dishId], references: [dishes.id] }),
}));