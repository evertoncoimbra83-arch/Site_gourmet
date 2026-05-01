import { mysqlTable, int, varchar, text, decimal, timestamp, boolean } from 'drizzle-orm/mysql-core';

export const paymentMethods = mysqlTable('payment_methods', {
  // ✅ CORREÇÃO DEFINITIVA: int + autoincrement
  id: int('id').primaryKey().autoincrement(),
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  
  // Colunas essenciais
  slug: varchar('slug', { length: 255 }), 
  instructions: text('instructions'),

  isActive: boolean('is_active').default(true), 
  displayOrder: int('display_order').default(0),
  
  brandName: varchar('brand_name', { length: 100 }),
  brandLogoUrl: varchar('brand_logo_url', { length: 255 }),
  
  // Decimal retorna string no JS
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0.00'),
  
  // Datas em snake_case para compatibilidade com o banco
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const foodCardBrands = mysqlTable('food_card_brands', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  logoUrl: varchar('logo_url', { length: 255 }),
});