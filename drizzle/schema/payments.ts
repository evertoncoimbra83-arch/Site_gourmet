import { mysqlTable, varchar, text, decimal, timestamp, boolean, int } from 'drizzle-orm/mysql-core';

export const paymentMethods = mysqlTable('payment_methods', {
  /**
   * ✅ ID DO MÉTODO DE PAGAMENTO
   * Alterado para varchar(255) para suportar identificadores fixos (ex: 'pix', 'money')
   * ou UUIDs, eliminando a dependência de números sequenciais.
   */
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  
  // ✅ Mapeamento mantido para isActive (Código)
  isActive: boolean('is_active').default(true), 
  
  displayOrder: int('display_order').default(0),
  brandName: varchar('brand_name', { length: 100 }),
  brandLogoUrl: varchar('brand_logo_url', { length: 255 }),
  
  // ✅ Mapeamento mantido para discountPercentage (Código)
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0.00'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const foodCardBrands = mysqlTable('food_card_brands', {
  /**
   * ✅ ID DA MARCA DO CARTÃO
   * Alterado para varchar(255) para consistência global.
   */
  id: varchar('id', { length: 255 }).primaryKey(),
  
  name: varchar('name', { length: 100 }).notNull(),
  logoUrl: varchar('logo_url', { length: 255 }),
});