import { mysqlTable, varchar, decimal, int, timestamp, text } from "drizzle-orm/mysql-core";
import { dishes } from "./catalog.js"; 

/**
 * 1. BIBLIOTECA DE INSUMOS (Ingredients)
 * Valores baseados em 100g ou 100ml.
 * Esta tabela armazena a base de dados TACO/TBCA + Insumos Manuais.
 */
export const ingredients = mysqlTable("ingredients", {
  id: int("id").primaryKey().autoincrement(),
  
  // ✅ Alterado para 'text' para evitar o erro de "Data too long" com a base TACO/TBCA
  name: text("name").notNull(),
  
  // ✅ Categoria para organizar os itens (ex: Carnes, Frutas, Cereais, Leguminosas)
  category: varchar("category", { length: 100 }),
  
  source: varchar("source", { length: 50 }).default("Manual"), 
  externalId: varchar("external_id", { length: 50 }),
  yieldFactor: decimal("yield_factor", { precision: 10, scale: 2 }).default("1.00"),

  // Macronutrientes (Baseados em 100g/ml)
  calories: decimal("calories", { precision: 10, scale: 2 }).default("0.00"),
  energyKj: decimal("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
  carbohydrates: decimal("carbohydrates", { precision: 10, scale: 2 }).default("0.00"),
  
  // ✅ Açúcares de Adição (Obrigatório na nova rotulagem da Anvisa)
  addedSugars: decimal("added_sugars", { precision: 10, scale: 2 }).default("0.00"),
  
  protein: decimal("protein", { precision: 10, scale: 2 }).default("0.00"),
  fats: decimal("fats", { precision: 10, scale: 2 }).default("0.00"),
  fatSaturated: decimal("fat_saturated", { precision: 10, scale: 2 }).default("0.00"),
  fatTrans: decimal("fat_trans", { precision: 10, scale: 2 }).default("0.00"),
  fiber: decimal("fiber", { precision: 10, scale: 2 }).default("0.00"),
  sodium: decimal("sodium", { precision: 10, scale: 2 }).default("0.00"),
  
  unit: varchar("unit", { length: 20 }).default("g"), 

  // Controle de auditoria
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * 2. FICHA TÉCNICA (Product Ingredients)
 * Tabela Pivot que liga os pratos (dishes) aos insumos (ingredients) 
 * definindo a composição exata de cada marmita/produto.
 */
export const productIngredients = mysqlTable("product_ingredients", {
  id: int("id").primaryKey().autoincrement(),
  
  // Referência ao prato em catalog.ts
  productId: int("product_id")
    .notNull()
    .references(() => dishes.id, { onDelete: "cascade" }),
    
  // Referência ao insumo nesta tabela
  ingredientId: int("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
    
  // Quantidade líquida usada no prato (ex: 0.150 para 150g)
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
});