import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  int,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

import { ingredients } from "./catalog";

// ===================================================================
// 1. FORNECEDORES (SUPPLIERS)
// ===================================================================
export const suppliers = mysqlTable("suppliers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================================================================
// 2. ENTRADAS DE COMPRAS (PURCHASE ENTRIES)
// ===================================================================
export const purchaseEntries = mysqlTable("purchase_entries", {
  id: int("id").primaryKey().autoincrement(),
  supplierId: int("supplier_id").references(() => suppliers.id, { onDelete: "restrict" }),
  supplierNameSnapshot: varchar("supplier_name_snapshot", { length: 255 }),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  purchasedAt: timestamp("purchased_at").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  source: mysqlEnum("source", ["manual", "spreadsheet", "xml"]).default("manual").notNull(),
  classificationStatus: mysqlEnum("classification_status", ["pending", "partial", "classified", "ignored"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================================================================
// 3. ITENS DE COMPRA (PURCHASE ENTRY ITEMS)
// ===================================================================
export const purchaseEntryItems = mysqlTable("purchase_entry_items", {
  id: int("id").primaryKey().autoincrement(),
  purchaseEntryId: int("purchase_entry_id")
    .notNull()
    .references(() => purchaseEntries.id, { onDelete: "cascade" }),
  rawDescription: varchar("raw_description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  category: mysqlEnum("category", [
    "FOOD_INGREDIENT",
    "PACKAGING",
    "LABEL_PRINTING",
    "CLEANING",
    "LOGISTICS",
    "PAYMENT_OR_SERVICE_FEE",
    "OPERATIONAL_EXPENSE",
    "IGNORE"
  ]),
  linkedEntityType: mysqlEnum("linked_entity_type", ["ingredient", "packaging", "operational"]),
  linkedEntityId: int("linked_entity_id"),
  conversionFactor: decimal("conversion_factor", { precision: 10, scale: 4 }).default("1.0000"),
  computedCostPerBaseUnit: decimal("computed_cost_per_base_unit", { precision: 12, scale: 6 }).default("0.000000"),
  classificationStatus: mysqlEnum("classification_status", ["pending", "classified", "ignored"])
    .default("pending")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================================================================
// 4. REGRAS DE CLASSIFICAÇÃO (PURCHASE CLASSIFICATION RULES)
// ===================================================================
export const purchaseClassificationRules = mysqlTable("purchase_classification_rules", {
  id: int("id").primaryKey().autoincrement(),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "FOOD_INGREDIENT",
    "PACKAGING",
    "LABEL_PRINTING",
    "CLEANING",
    "LOGISTICS",
    "PAYMENT_OR_SERVICE_FEE",
    "OPERATIONAL_EXPENSE",
    "IGNORE"
  ]).notNull(),
  linkedEntityType: mysqlEnum("linked_entity_type", ["ingredient", "packaging", "operational"]),
  linkedEntityId: int("linked_entity_id"),
  defaultUnit: varchar("default_unit", { length: 20 }),
  conversionFactor: decimal("conversion_factor", { precision: 10, scale: 4 }).default("1.0000"),
  confidence: int("confidence").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================================================================
// RELAÇÕES (RELATIONS)
// ===================================================================
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseEntries: many(purchaseEntries),
}));

export const purchaseEntriesRelations = relations(purchaseEntries, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseEntries.supplierId], references: [suppliers.id] }),
  items: many(purchaseEntryItems),
}));

export const purchaseEntryItemsRelations = relations(purchaseEntryItems, ({ one }) => ({
  purchaseEntry: one(purchaseEntries, { fields: [purchaseEntryItems.purchaseEntryId], references: [purchaseEntries.id] }),
  ingredient: one(ingredients, { fields: [purchaseEntryItems.linkedEntityId], references: [ingredients.id] }),
}));
