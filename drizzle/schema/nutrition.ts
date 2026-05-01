import { decimal, int, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";

/**
 * ✅ 1. DEFINIÇÃO DOS CAMPOS NUTRICIONAIS BASE (Macros)
 * Centraliza os nomes das colunas e tipos para evitar erros de TypeScript.
 * Usado em: nutrition_facts, dish_composition, ingredients e dishes.
 * Precisão: decimal 10,3 para gramas e 10,2 para calorias/mg.
 */
export const nutritionFields = {
  // Energia
  energyKcal: decimal("energy_kcal", { precision: 10, scale: 2 }).default("0.00"),
  energyKj: decimal("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
  yieldFactor: decimal('yield_factor', { precision: 10, scale: 2 }).default('1.00'),
  
  // Macros Principais
  proteins: decimal("proteins", { precision: 10, scale: 3 }).default("0.000"),
  carbs: decimal("carbs", { precision: 10, scale: 3 }).default("0.000"),
  fatTotal: decimal("fat_total", { precision: 10, scale: 3 }).default("0.000"),
  
  // Detalhamento de Gorduras
  fatSaturated: decimal("fat_saturated", { precision: 10, scale: 3 }).default("0.000"),
  fatTrans: decimal("fat_trans", { precision: 10, scale: 3 }).default("0.000"),
  
  // Fibras e Sódio
  fiber: decimal("fiber", { precision: 10, scale: 3 }).default("0.000"),
  sodium: decimal("sodium", { precision: 10, scale: 2 }).default("0.00"), // armazenado em mg
};

/**
 * ✅ 2. COLUNAS EXTRAS (Micronutrientes / TACO)
 * Adicione novos campos aqui (Ex: Vitamina C, Potássio) para atualizar o sistema todo.
 */
export const ingredientExtraColumns = {
  addedSugars: decimal("added_sugars", { precision: 10, scale: 2 }).default("0.00"),
  calcium: decimal("calcium", { precision: 10, scale: 2 }).default("0.00"),
  iron: decimal("iron", { precision: 10, scale: 2 }).default("0.00"),
};

/**
 * ✅ 3. ESTRUTURA PARA A TABELA NUTRITION_FACTS
 * Agrupa as colunas técnicas com os campos nutricionais.
 * Exportado para o objeto de definição de tabela no index.ts ou catalog.ts.
 */
export const nutritionFactsColumns = {
  id: int("id").primaryKey().autoincrement(),
  
  // IDs para Relações Polimórficas (Chaves Estrangeiras Flexíveis)
  ingredientId: int("ingredient_id"), 
  dishId: int("dish_id"),             
  compositionId: int("composition_id"), 

  // Controle de Contexto Nutricional
  // BASE = Cadastro do Insumo | TOTAL = Soma do Prato | SNAPSHOT = Foto da Ficha Técnica
  entityType: mysqlEnum("entity_type", ["BASE", "TOTAL", "SNAPSHOT"]).notNull(),

  // Injeção via Spread de todos os campos definidos acima
  ...nutritionFields,
  ...ingredientExtraColumns,

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
};