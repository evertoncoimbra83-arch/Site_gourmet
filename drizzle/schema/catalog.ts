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
} from "drizzle-orm/mysql-core";

// ====================================================
// 1. CATEGORIAS DE PRATOS (Menu Principal)
// ====================================
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(), 
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 50 }), 
  description: text("description"),
  displayOrder: int("display_order").default(0),
  isActive: boolean("is_active").default(true),
  allowAccompaniments: boolean("allow_accompaniments").default(true), 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(), 
});

// ====================================================
// 2. PRATOS (DISHES)
// ====================================================
export const dishes = mysqlTable("dishes", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }), 
  price: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  categoryId: int("category_id").references(() => categories.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").default(true),
  
  // Nutricionais Planos
  energyKcal: int("energy_kcal"),
  energyKj: int("energy_kj"),
  proteins: decimal("proteins", { precision: 10, scale: 2 }),
  carbs: decimal("carbs", { precision: 10, scale: 2 }),
  fiber: decimal("fiber", { precision: 10, scale: 2 }),
  fatTotal: decimal("fat_total", { precision: 10, scale: 2 }),
  fatSaturated: decimal("fat_saturated", { precision: 10, scale: 2 }),
  fatTrans: decimal("fat_trans", { precision: 10, scale: 2 }),
  sodium: decimal("sodium", { precision: 10, scale: 2 }),

  showNutrition: boolean("show_nutrition").default(false),
  ingredients: text("ingredients"), 
  
  isVegetarian: boolean("is_vegetarian").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isLactoseFree: boolean("is_lactose_free").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ====================================================
// 3. TAMANHOS E ACOMPANHAMENTOS
// ====================================================
export const accompanimentCategories = mysqlTable("accompaniment_categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  iconKey: varchar("icon_key", { length: 50 }),    
  color: varchar("color", { length: 20 }),          
  displayOrder: int("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const dishSizes = mysqlTable("dish_sizes", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull(),
  weight: varchar("weight", { length: 50 }),
  priceModifier: decimal("price_modifier", { precision: 10, scale: 2 }).default("0.00"),
  description: text("description"),
  // ✅ CORREÇÃO: Removido o default "Box" para evitar que o banco ignore o envio do Admin
  iconKey: varchar("icon_key", { length: 50 }).default("Cube"), 
  color: varchar("color", { length: 20 }).default("slate"),
  displayOrder: int("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const accompanimentGroups = mysqlTable("accompaniment_groups", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  maxSelections: int("max_selections").notNull().default(1),
  minSelections: int("min_selections").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const accompanimentOptions = mysqlTable("accompaniment_options", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  accompanimentCategoryId: int("accompaniment_category_id")
    .references(() => accompanimentCategories.id),
  groupsConfig: json("groups_config").$type<any[] | string>().notNull().default([]), 
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: int("display_order").notNull().default(0),
  showNutrition: boolean("show_nutrition").notNull().default(false),
  
  energyKcal: int("energy_kcal"),
  carbs: decimal("carbs", { precision: 10, scale: 2 }),
  proteins: decimal("proteins", { precision: 10, scale: 2 }),
  fatTotal: decimal("fat_total", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const sizeAccompanimentGroups = mysqlTable("size_accompaniment_groups", {
  id: int("id").primaryKey().autoincrement(),
  sizeId: int("size_id").notNull().references(() => dishSizes.id, { onDelete: 'cascade' }),
  accompanimentGroupId: int("accompaniment_group_id").notNull().references(() => accompanimentGroups.id, { onDelete: 'cascade' }),
  isRequired: boolean("is_required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================================================================
// RELACIONAMENTOS (Drizzle Relations)
// ===================================================================

export const accompanimentCategoriesRelations = relations(accompanimentCategories, ({ many }) => ({
  options: many(accompanimentOptions),
}));

export const accompanimentOptionsRelations = relations(accompanimentOptions, ({ one }) => ({
  category: one(accompanimentCategories, {
    fields: [accompanimentOptions.accompanimentCategoryId],
    references: [accompanimentCategories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  dishes: many(dishes),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  category: one(categories, { 
    fields: [dishes.categoryId], 
    references: [categories.id] 
  }),
  // ✅ Adicionado para permitir trpc.public.dishes.getById buscar tamanhos diretamente
  sizes: many(dishSizes) 
}));

export const dishSizesRelations = relations(dishSizes, ({ many }) => ({
  sizeAccompanimentGroups: many(sizeAccompanimentGroups),
}));

export const accompanimentGroupsRelations = relations(accompanimentGroups, ({ many }) => ({
  sizeAccompanimentGroups: many(sizeAccompanimentGroups),
  options: many(accompanimentOptions)
}));

export const sizeAccompanimentGroupRelations = relations(sizeAccompanimentGroups, ({ one }) => ({
  size: one(dishSizes, { 
    fields: [sizeAccompanimentGroups.sizeId], 
    references: [dishSizes.id] 
  }),
  group: one(accompanimentGroups, { 
    fields: [sizeAccompanimentGroups.accompanimentGroupId], 
    references: [accompanimentGroups.id] 
  }),
}));