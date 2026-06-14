import { mysqlTable, int, varchar, decimal, timestamp, json, index } from 'drizzle-orm/mysql-core';

/**
 * 📊 TABELA 1: FACTOS DE VENDAS (Mix de Produtos & Engenharia de Cardápio)
 * Objetivo: Saber exatamente o que vende mais (Prato + Acompanhamentos) e auditar
 * granularmente o comportamento de customizações, kits e desvios de macronutrientes.
 */
export const biSalesFacts = mysqlTable('bi_sales_facts', {
  id: int('id').primaryKey().autoincrement(),
  orderId: int('order_id').notNull(),

  // Link com o prato de produção
  dishId: int('dish_id'),

  // Hash para agrupar combinações (ex: "carne_moida_arroz_feijao")
  combinationHash: varchar('combination_hash', { length: 255 }),

  itemsDetail: json('items_detail'),
  quantity: int('quantity').default(1),

  netRevenue: decimal('net_revenue', { precision: 10, scale: 2 }),

  // 🚀 NOVOS CAMPOS GRANULARES PARA ENGENHARIA DE CARDÁPIO (Marmitas Fitness):
  // IAV (Índice de Customização Volátil): 1 se o cliente alterou acompanhamentos/tamanhos padrão, 0 se comprou prato fechado
  isCustomized: int('is_customized').default(0),

  // IRK (Índice de Relevância em Kits): 1 se o prato saiu de dentro de um pacote/assinatura combo, 0 se foi venda avulsa
  isFromKit: int('is_from_kit').default(0),

  // DMN (Desvio de Macro-Nutrientes): O delta energético em Kcal adicionado ou removido através das customizações do pedido
  macroDeviationKcal: int('macro_deviation_kcal').default(0),

  dateId: int('date_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('bi_sales_facts_order_id_idx').on(table.orderId),
  dateIdIdx: index('bi_sales_facts_date_id_idx').on(table.dateId),
  dishIdIdx: index('bi_sales_facts_dish_id_idx').on(table.dishId), // Índice vital para acelerar o agrupamento de médias (AVG) no dashboard
}));

/**
 * 💰 TABELA 2: FACTOS FINANCEIROS (Fluxo de Caixa e Retenção)
 * Objetivo: Gestão de descontos, cupons e lucro líquido real.
 */
export const biFinancialFacts = mysqlTable('bi_financial_facts', {
  id: int('id').primaryKey().autoincrement(),
  orderId: int('order_id').notNull(),

  paymentMethod: varchar('payment_method', { length: 50 }),
  couponCode: varchar('coupon_code', { length: 255 }),

  grossTotal: decimal('gross_total', { precision: 10, scale: 2 }),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0.00'),

  discountCoupon: decimal('discount_coupon', { precision: 10, scale: 2 }).default('0.00'),
  discountLoyalty: decimal('discount_loyalty', { precision: 10, scale: 2 }).default('0.00'),
  discountAuto: decimal('discount_auto', { precision: 10, scale: 2 }).default('0.00'),

  netTotal: decimal('net_total', { precision: 10, scale: 2 }),

  dateId: int('date_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('bi_financial_facts_order_id_idx').on(table.orderId),
  dateIdIdx: index('bi_financial_facts_date_id_idx').on(table.dateId),
}));

/**
 * 🧠 TABELA 3: INTELIGÊNCIA DE CARDÁPIO (O Cérebro do SmartGenerator)
 * Objetivo: "Ensinar" ao sistema os macros e as tendências de mercado.
 * É aqui que seu script local (pesquisas) vai injetar conhecimento.
 */
export const biDishIntelligence = mysqlTable('bi_dish_intelligence', {
  id: int('id').primaryKey().autoincrement(),

  // FK para o prato original (Unique para garantir 1 inteligência por prato)
  dishId: int('dish_id').notNull().unique(),

  // Dados Nutricionais Reais (Ensinando as Personas)
  proteinGrams: decimal('protein_grams', { precision: 10, scale: 2 }).default('0.00'),
  carbGrams: decimal('carb_grams', { precision: 10, scale: 2 }).default('0.00'),
  fatGrams: decimal('fat_grams', { precision: 10, scale: 2 }).default('0.00'),
  calories: int('calories').default(0),

  // Tags de Especialista (ex: ['saciedade_alta', 'imunidade', 'mais_pedido'])
  intelligenceTags: json('intelligence_tags'),

  // Score de Tendência Mundial/Local (-100 a 100)
  // Útil para o motor priorizar o que está "na moda" saudável
  trendScore: int('trend_score').default(0),

  // Espaço para o seu script de aprendizado local salvar metadados extras
  marketMetadata: json('market_metadata'),

  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});