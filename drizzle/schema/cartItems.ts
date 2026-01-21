import { mysqlTable, varchar, int, decimal, timestamp, text } from "drizzle-orm/mysql-core";
import { carts } from "./cart.js"; // ✅ Ajustado para 'carts' (plural) para bater com a tabela pai
import { dishes } from "./catalog.js"; 
import { packages } from "./packages.js"; 

export const cartItems = mysqlTable("cart_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  
  // ✅ VÍNCULO CORRIGIDO COM CARTS
  cartId: varchar("cart_id", { length: 255 })
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),

  dishId: varchar("dish_id", { length: 255 }).references(() => dishes.id),
  packageId: varchar("package_id", { length: 255 }).references(() => packages.id),

  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  
  name: varchar("name", { length: 255 }),
  // Aumentado para 500 caracteres para evitar cortes em URLs longas
  imageUrl: varchar("image_url", { length: 500 }),

  // 🚨 AS COLUNAS MÁGICAS PARA O JSON FUNCIONAR
  options: text("options"), // Guarda: Acompanhamentos, Tamanho, Config do Kit
  appliedNutrition: text("applied_nutrition"), // Guarda: Kcal, Proteínas, etc.
  
  // Mantido para legado/backup
  accompaniments: text("accompaniments"),

  createdAt: timestamp("created_at").defaultNow(),
});