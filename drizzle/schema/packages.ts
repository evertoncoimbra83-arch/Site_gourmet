// client/src/db/schema.ts (ou o caminho do seu arquivo de schema)
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
  longtext 
} from "drizzle-orm/mysql-core";

import { orderItems } from "./orders";
import { accompanimentOptions } from "./accompaniments";
import { 
  dishes, 
  accompanimentGroups, 
  categories,
  dishSizes 
} from "./catalog"; 

// ✅ Interface para a coluna JSON de configuração
export interface PackageSlotConfig {
  slots: {
    name: string;
    dishIds: (string | number)[];
    sizeId?: string | number | null;
    groups: {
      id: string | number;
      customLabel?: string | null;
    }[];
  }[];
}

// --- 1. PACOTES (PACKAGES) ---
export const packages = mysqlTable("packages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), 
  description: text("description"),
  
  // ✅ COLUNAS PARA VITRINE PREMIUM & FILTROS
  // highlights: frases separadas por vírgula para os checks do card
  highlights: text("highlights"), 
  // category: para vincular aos filtros (Emagrecimento, Ganho de Massa, etc)
  category: varchar("category", { length: 100 }),
  // isPopular: ativa o badge de destaque e borda esmeralda
  isPopular: boolean("is_popular").default(false),
  
  price: decimal("base_price", { precision: 10, scale: 2 }).notNull(), 
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }), 
  sizeId: int("size_id").references(() => dishSizes.id, { onDelete: 'set null' }),
  numberOfOptions: int("number_of_options").default(3), 
  month: varchar("month", { length: 50 }), 
  imageUrl: varchar("image_url", { length: 500 }),
  displayOrder: int("display_order").default(0),
  status: varchar("status", { length: 20 }).default("active"), 
  isActive: boolean("is_active").default(true),
  
  config: json("config").$type<PackageSlotConfig>(), 
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- 2. TABELAS RELACIONAIS (ESTRUTURA DE SLOTS) ---

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
  itemsOrder: longtext("items_order"), 
});

// --- 3. RELAÇÕES (RELATIONS) ---

export const packageRelations = relations(packages, ({ one, many }) => ({
  orderItems: many(orderItems),
  options: many(packageOptions),
  size: one(dishSizes, {
    fields: [packages.sizeId],
    references: [dishSizes.id],
  }),
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

// --- RELAÇÕES AUXILIARES ---

export const accompanimentOptionsWithCategoryRelations = relations(accompanimentOptions, ({ one }) => ({
  category: one(categories, {
    fields: [accompanimentOptions.accompanimentCategoryId],
    references: [categories.id],
  }),
}));