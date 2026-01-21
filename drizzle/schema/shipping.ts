import { mysqlTable, varchar, text, decimal, timestamp, boolean, mysqlEnum, json, int } from 'drizzle-orm/mysql-core';
import { sql } from "drizzle-orm";

// ====================================================
// --- 1. CONFIGURAÇÕES DE RETIRADA (PICKUP) ---
// ====================================================
export const shippingSettings = mysqlTable('shipping_settings', {
  /**
   * Mantemos varchar(255) pois geralmente usamos um ID fixo como 'default'
   */
  id: varchar("id", { length: 255 }).primaryKey(),
  
  pickupEnabled: boolean('pickup_enabled').default(true),
  pickupLabel: varchar('pickup_label', { length: 255 }).default('Retirada no Balcão'),
  pickupInstruction: varchar('pickup_instruction', { length: 500 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ====================================================
// --- 2. REGRAS DE ENTREGA (shipping_rules) ---
// ====================================================
export const shippingRules = mysqlTable('shipping_rules', {
  /**
   * ✅ AJUSTE CRÍTICO: 
   * Mudado de varchar para int + autoincrement para bater com o banco físico.
   * Isso remove a obrigatoriedade de passar o ID no .values() do Router.
   */
  id: varchar("id", { length: 36 }).primaryKey(),
  
  name: varchar('name', { length: 100 }).notNull(),

  /**
   * TIPO DE REGRA
   */
  type: mysqlEnum('type', ['zipcode', 'polygon']).default('zipcode').notNull(),

  /**
   * LOGÍSTICA POR CEP
   */
  cepStart: varchar('cep_start', { length: 8 }), 
  cepEnd: varchar('cep_end', { length: 8 }),     
  
  /**
   * LOGÍSTICA POR MAPA
   */
  polygonCoords: json('polygon_coords'), 

  /**
   * PRECIFICAÇÃO E STATUS
   */
  price: decimal('price', { precision: 10, scale: 2 }).default('0.00'), 
  active: boolean('active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ====================================================
// --- 3. CONFIGURAÇÕES GERAIS DA LOJA ---
// ====================================================
export const storeSettings = mysqlTable('store_settings', {
  /**
   * Mantemos varchar se você estiver usando um ID fixo 'default_store'
   */
  id: varchar("id", { length: 255 }).primaryKey(),
  
  generalMinOrderAmount: decimal('general_min_order_amount', { precision: 10, scale: 2 }).default('0.00'),
  minOrderMessage: text('min_order_message'),
  emergencyMode: boolean('emergency_mode').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});