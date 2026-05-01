import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  int,
  timestamp,
  json
} from "drizzle-orm/mysql-core";

// ✅ Importações das tabelas do catálogo e pedidos
import { orderItems } from "./orders.js";
import { 
  dishes, 
  accompanimentGroups, 
  accompanimentOptions, 
  categories 
} from "./catalog.js"; 

// ====================================================
// --- 1. TABELA DE PACOTES (PACKAGES) ---
// ==================================================== 
export const packages = mysqlTable("packages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), 
  description: text("description"),
  
  // Preços
  price: decimal("base_price", { precision: 10, scale: 2 }).notNull(), 
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }), // ✅ NOVA COLUNA: Preço promocional do combo
  
  numberOfOptions: int("number_of_options").default(3), 
  month: varchar("month", { length: 50 }), 
  imageUrl: varchar("image_url", { length: 500 }),
  
  // ✅ COLUNA REATIVADA: Agora existe no seu MySQL após o comando ALTER TABLE
  displayOrder: int("display_order").default(0),

  status: varchar("status", { length: 20 }).default("active"), 
  isActive: boolean("is_active").default(true),
  config: json("config"), // Aqui dentro salvamos os slots e a ordem groupsOrder
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ====================================================
// --- 2. TABELAS RELACIONAIS (ESTRUTURA DE SLOTS) ---
// ====================================================

export const packageOptions = mysqlTable("package_options", {
  id: int("id").primaryKey().autoincrement(),
  packageId: varchar("package_id", { length: 255 })
    .notNull()
    .references(() => packages.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(), 
  optionOrder: int("option_order").default(0),      
  createdAt: timestamp("created_at").defaultNow(),
});

export const packageOptionDishes = mysqlTable("package_option_dishes", {
  id: int("id").primaryKey().autoincrement(),
  optionId: int("option_id")
    .notNull()
    .references(() => packageOptions.id, { onDelete: 'cascade' }),
  dishId: int("dish_id")
    .notNull()
    .references(() => dishes.id, { onDelete: 'cascade' }),
});

export const packageOptionGroups = mysqlTable("package_option_groups", {
  id: int("id").primaryKey().autoincrement(),
  optionId: int("option_id")
    .notNull()
    .references(() => packageOptions.id, { onDelete: 'cascade' }),
  groupId: int("group_id")
    .notNull()
    .references(() => accompanimentGroups.id, { onDelete: 'cascade' }),
  
  // ✅ NOVA COLUNA: Ordem das opções (itens) dentro deste grupo do pacote
  itemsOrder: json("items_order").$type<number[]>().default([]),
});

// ====================================================
// --- 3. RELAÇÕES (RELATIONS) ---
// ====================================================

export const packageRelations = relations(packages, ({ many }) => ({
  orderItems: many(orderItems),
  options: many(packageOptions),
}));

export const packageOptionsRelations = relations(packageOptions, ({ one, many }) => ({
  package: one(packages, {
    fields: [packageOptions.packageId],
    references: [packages.id],
  }),
  allowedDishes: many(packageOptionDishes),
  allowedGroups: many(packageOptionGroups),
}));

export const packageOptionDishesRelations = relations(packageOptionDishes, ({ one }) => ({
  option: one(packageOptions, {
    fields: [packageOptionDishes.optionId],
    references: [packageOptions.id],
  }),
  dish: one(dishes, {
    fields: [packageOptionDishes.dishId],
    references: [dishes.id],
  }),
}));

export const packageOptionGroupsRelations = relations(packageOptionGroups, ({ one }) => ({
  option: one(packageOptions, {
    fields: [packageOptionGroups.optionId],
    references: [packageOptions.id],
  }),
  group: one(accompanimentGroups, {
    fields: [packageOptionGroups.groupId],
    references: [accompanimentGroups.id],
  }),
}));

// --- RELAÇÕES DO CATÁLOGO AUXILIARES ---

export const accompanimentOptionsWithCategoryRelations = relations(accompanimentOptions, ({ one }) => ({
  category: one(categories, {
    fields: [accompanimentOptions.accompanimentCategoryId],
    references: [categories.id],
  }),
}));

export const accompanimentGroupsWithItemsRelations = relations(accompanimentGroups, ({ many }) => ({
  options: many(accompanimentOptions),
}));