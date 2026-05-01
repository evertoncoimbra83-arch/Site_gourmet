import { mysqlTable, varchar, decimal, int, timestamp, longtext } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// 🛒 CABEÇALHO DO RASCUNHO (AdminOrderDraft)
export const adminOrderDrafts = mysqlTable("admin_order_drafts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  adminId: varchar("admin_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }), 

  shippingValue: decimal("shipping_value", { precision: 10, scale: 2 }).default("0.00"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0.00"),

  status: varchar("status", { length: 20 }).default("active"),
  metadataJson: longtext("metadata_json"), 
  
  discountsSnapshot: longtext("discounts_snapshot"),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// 🍱 ITENS DO RASCUNHO (AdminOrderDraftItem)
export const adminOrderDraftItems = mysqlTable("admin_order_draft_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  draftId: varchar("draft_id", { length: 255 }).notNull(), 

  // 🔗 RELAÇÕES
  dishId: varchar("dish_id", { length: 255 }),      
  packageId: varchar("package_id", { length: 255 }), 

  name: varchar("name", { length: 255 }),
  quantity: int("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0.00"),

  // 📝 CONFIGURAÇÕES E DETALHES
  options: longtext("options"), // JSON com estrutura visual (tamanho, ids, etc.)
  
  // ✅ ATUALIZADO: Substituímos 'accompaniments' por 'applied_nutrition'
  // Agora o Drizzle sabe onde salvar aquele JSON rico de macros que criamos
  appliedNutrition: longtext("applied_nutrition"), 

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});