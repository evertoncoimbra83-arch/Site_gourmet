import { mysqlTable, varchar, int, timestamp, boolean } from 'drizzle-orm/mysql-core';

export const showcases = mysqlTable('showcases', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  active: boolean('active').default(true),
  order: int('order').default(0), // Para ordenar qual vitrine aparece primeiro
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});