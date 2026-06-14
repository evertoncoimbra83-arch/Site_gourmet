import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  int,
  timestamp,
  primaryKey,
  longtext,
} from "drizzle-orm/mysql-core";

// Importações de schemas satélites
import { nutritionFactsColumns } from "./nutrition"; 
import { accompanimentOptions } from "./accompaniments"; 

// ===================================================================
// 1. INGREDIENTES (Insumos Base)
// ===================================================================
export const ingredients = mysqlTable("ingredients", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  source: varchar("source", { length: 50 }).default("Manual"), 
  unit: varchar("unit", { length: 20 }).default("g"), 
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================================================================
// 2. FATOS NUTRICIONAIS (Tabela de apoio para Fichas Técnicas)
// ===================================================================
export const nutritionFacts = mysqlTable("nutrition_facts", nutritionFactsColumns);

// ===================================================================
// 3. CATEGORIAS DE PRATOS
// ===================================================================
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  iconKey: varchar("icon_key", { length: 50 }),
  // ✅ ADICIONADO: Coluna color para suportar a personalização do Drawer e do Site
  color: varchar("color", { length: 20 }).default("slate"), 
  imageUrl: varchar("image_url", { length: 500 }),
  displayOrder: int("display_order").default(0),
  isActive: boolean("is_active").default(true),
  allowAccompaniments: boolean("allow_accompaniments").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================================================================
// 4. CATEGORIAS DE ACOMPANHAMENTOS
// ===================================================================
export const accompanimentCategories = mysqlTable("accompaniment_categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  iconKey: varchar("icon_key", { length: 50 }),
  color: varchar("color", { length: 20 }),
  displayOrder: int("display_order").default(0),
  isActive: boolean("is_active").default(true),
});

// ===================================================================
// 5. PRATOS (DISHES)
// ===================================================================
export const dishes = mysqlTable("dishes", {
  id: int("id").primaryKey().autoincrement(),
  woocommerceId: int("woocommerce_id"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: longtext("description"), 
  imageUrl: varchar("image_url", { length: 500 }),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
  showNutrition: boolean("show_nutrition").default(false),
  isVegetarian: boolean("is_vegetarian").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isLactoseFree: boolean("is_lactose_free").default(false),
  ingredients: text("ingredients"),
  nutritionalInfo: longtext("nutritional_info"),
  
  // Nutrição consolidada (facilitando leitura do BI e Front)
  energyKcal: decimal("energy_kcal", { precision: 10, scale: 2 }).default("0.00"),
  energyKj: decimal("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
  proteins: decimal("proteins", { precision: 10, scale: 2 }).default("0.00"),
  carbs: decimal("carbs", { precision: 10, scale: 2 }).default("0.00"),
  fatTotal: decimal("fat_total", { precision: 10, scale: 2 }).default("0.00"),
  fatSaturated: decimal("fat_saturated", { precision: 10, scale: 3 }).default("0.000"),
  fatTrans: decimal("fat_trans", { precision: 10, scale: 3 }).default("0.000"),
  fiber: decimal("fiber", { precision: 10, scale: 2 }).default("0.00"),
  sodium: decimal("sodium", { precision: 10, scale: 2 }).default("0.00"),
  
  isVisible: boolean("is_visible").default(true),
  status: varchar("status", { length: 20 }).default("active"),
  displayOrder: int("display_order").default(0),
  yieldFactor: decimal("yield_factor", { precision: 10, scale: 2 }).default("1.00"),
  calcium: decimal("calcium", { precision: 10, scale: 2 }).default("0.00"),
  iron: decimal("iron", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================================================================
// 6. TAMANHOS (SIZES)
// ===================================================================
export const dishSizes = mysqlTable("dish_sizes", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  priceModifier: decimal("price_modifier", { precision: 10, scale: 2 }).default("0.00"),
  mainDishWeight: decimal("main_dish_weight", { precision: 10, scale: 2 }).default("200.00"),
  displayOrder: int("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  iconKey: varchar("icon_key", { length: 50 }).default("Box"),
  color: varchar("color", { length: 20 }).default("slate"),
  description: text("description"),
  groupsOrder: text("groups_order"), 
  weight: varchar("weight", { length: 20 }), 
  noAccompanimentsMessage: varchar("no_accompaniments_message", { length: 255 }),
});

// ===================================================================
// 7. GRUPOS DE ACOMPANHAMENTO
// ===================================================================
export const accompanimentGroups = mysqlTable("accompaniment_groups", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  defaultGrammage: decimal("default_grammage", { precision: 10, scale: 2 }).default("100.00"),
  itemsOrder: longtext("items_order"), 
  maxSelections: int("max_selections").notNull().default(1),
  minSelections: int("min_selections").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// ===================================================================
// 8. TABELAS DE VÍNCULO (PIVOTS)
// ===================================================================
export const groupToOptions = mysqlTable("group_to_options", {
  id: int("id").primaryKey().autoincrement(),
  groupId: int("group_id").notNull().references(() => accompanimentGroups.id, { onDelete: 'cascade' }),
  optionId: int("option_id").notNull().references(() => accompanimentOptions.id, { onDelete: 'cascade' }),
});

export const dishComposition = mysqlTable("dish_composition", {
  id: int("id").primaryKey().autoincrement(),
  dishId: int("dish_id").references(() => dishes.id, { onDelete: 'cascade' }),
  accompanimentOptionId: int("accompaniment_option_id"), 
  ingredientId: int("ingredient_id").references(() => ingredients.id),
  ingredientName: varchar("ingredient_name", { length: 255 }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("g"),

  energyKcal: decimal("energy_kcal", { precision: 10, scale: 2 }).default("0.00"),
  energyKj: decimal("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
  proteins: decimal("proteins", { precision: 10, scale: 3 }).default("0.000"),
  carbs: decimal("carbs", { precision: 10, scale: 3 }).default("0.000"),
  fatTotal: decimal("fat_total", { precision: 10, scale: 3 }).default("0.000"),
  fatSaturated: decimal("fat_saturated", { precision: 10, scale: 3 }).default("0.000"),
  fatTrans: decimal("fat_trans", { precision: 10, scale: 3 }).default("0.000"),
  fiber: decimal("fiber", { precision: 10, scale: 3 }).default("0.000"),
  sodium: decimal("sodium", { precision: 10, scale: 2 }).default("0.00"),
  calcium: decimal("calcium", { precision: 10, scale: 2 }).default("0.00"),
  iron: decimal("iron", { precision: 10, scale: 2 }).default("0.00"),
});

export const dishesToSizes = mysqlTable("dishes_to_sizes", {
  dishId: int("dish_id").notNull().references(() => dishes.id, { onDelete: 'cascade' }),
  sizeId: int("size_id").notNull().references(() => dishSizes.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.dishId, t.sizeId] }),
}));

export const sizeAccompanimentGroups = mysqlTable("size_accompaniment_groups", {
  id: int("id").primaryKey().autoincrement(),
  sizeId: int("size_id").notNull().references(() => dishSizes.id, { onDelete: 'cascade' }),
  accompanimentGroupId: int("accompaniment_group_id").notNull().references(() => accompanimentGroups.id, { onDelete: 'cascade' }),
  minSelections: int("min_selections"),
  maxSelections: int("max_selections"),
});

// ===================================================================
// RELAÇÕES (RELATIONS)
// ===================================================================
export const dishesRelations = relations(dishes, ({ one, many }) => ({
  category: one(categories, { fields: [dishes.categoryId], references: [categories.id] }),
  sizes: many(dishesToSizes),
  composition: many(dishComposition),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  dishes: many(dishes),
}));

export const dishCompositionRelations = relations(dishComposition, ({ one }) => ({
  dish: one(dishes, { fields: [dishComposition.dishId], references: [dishes.id] }),
  ingredient: one(ingredients, { fields: [dishComposition.ingredientId], references: [ingredients.id] }),
  accompanimentOption: one(accompanimentOptions, { fields: [dishComposition.accompanimentOptionId], references: [accompanimentOptions.id] }),
}));

export const dishSizesRelations = relations(dishSizes, ({ many }) => ({
  dishLinks: many(dishesToSizes),
  accompanimentGroups: many(sizeAccompanimentGroups),
}));

export const accompanimentGroupsRelations = relations(accompanimentGroups, ({ many }) => ({
  options: many(groupToOptions),
  sizeLinks: many(sizeAccompanimentGroups),
}));