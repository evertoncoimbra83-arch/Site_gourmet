import { mysqlTable, varchar, decimal, boolean, int, timestamp, text, longtext } from "drizzle-orm/mysql-core";
import { accompanimentCategories } from "./catalog"; 

export const accompanimentOptions = mysqlTable("accompaniment_options", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  
  // ✅ Corrigido para CamelCase no código (JS) mapeando para snake_case (DB)
  priceModifier: decimal("price_modifier", { precision: 10, scale: 2 }).default("0.00"),
  accompanimentCategoryId: int("accompaniment_category_id").references(() => accompanimentCategories.id),
  isActive: boolean("is_active").notNull().default(true),
  isNoAccompaniment: boolean("is_no_accompaniment").notNull().default(false),
  ingredients: text("ingredients"),
  
  // ✅ Colunas Nutricionais revisadas para bater com o Frontend/Roteador
  energyKcal: int("energy_kcal"), 
  energyKj: decimal("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
  proteins: decimal("proteins", { precision: 10, scale: 2 }).default("0.00"),
  carbs: decimal("carbs", { precision: 10, scale: 2 }).default("0.00"),
  fatTotal: decimal("fat_total", { precision: 10, scale: 2 }).default("0.00"),
  fatSaturated: decimal("fat_saturated", { precision: 10, scale: 2 }).default("0.00"),
  fatTrans: decimal("fat_trans", { precision: 10, scale: 2 }).default("0.00"),
  fiber: decimal("fiber", { precision: 10, scale: 2 }).default("0.00"),
  sodium: decimal("sodium", { precision: 10, scale: 2 }).default("0.00"),
  calcium: decimal("calcium", { precision: 10, scale: 2 }).default("0.00"),
  iron: decimal("iron", { precision: 10, scale: 2 }).default("0.00"),

  showNutrition: boolean("show_nutrition").default(false),
  
  // ✅ Garante que o JSON de composição seja lido corretamente
  nutritionalInfo: longtext("nutritional_info"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
