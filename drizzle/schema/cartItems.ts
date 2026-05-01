import { mysqlTable, varchar, int, decimal, timestamp, json, text } from "drizzle-orm/mysql-core";
import { carts } from "./cart"; 
import { dishes } from "./catalog"; 
import { packages } from "./packages"; 

/**
 * ✅ DEFINIÇÃO DE TIPOS PARA O CAMPO OPTIONS
 * Evita o uso de 'any' e garante que o motor de domínio funcione perfeitamente.
 */
export interface CartItemOptionAcc {
  id: number | string;
  name: string;
  weight?: number | string;
  groupName?: string;
}

export interface CartItemOptionSize {
  id: number | string;
  name: string;
  price?: number | string;
}

export interface CartItemPackageMeal {
  dishId: number | string;
  dishName: string;
  selectedAccompaniments: CartItemOptionAcc[];
}

export interface CartItemOptions {
  _type?: 'single' | 'package';
  dishId?: number | string;
  packageId?: number | string;
  packageName?: string;
  // Estrutura para Pratos Individuais
  selectedSizeId?: number | string;
  selectedSizeName?: string;
  selectedSize?: CartItemOptionSize;
  selectedAccs?: CartItemOptionAcc[];
  // Estrutura para Pacotes (Combos)
  meals?: CartItemPackageMeal[];
  [key: string]: unknown; // Escape seguro para extensões futuras
}

export interface AppliedNutrition {
  energyKcal: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  sodium: number;
  fiber: number;
  yieldWeight: number;
}

/* -------------------------------- SCHEMA ---------------------------------- */

export const cartItems = mysqlTable("cart_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  
  cartId: varchar("cart_id", { length: 255 })
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),

  dishId: varchar("dish_id", { length: 255 }).references(() => dishes.id),
  packageId: varchar("package_id", { length: 255 }).references(() => packages.id),

  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  
  name: varchar("name", { length: 255 }),
  imageUrl: varchar("image_url", { length: 500 }),

  /**
   * ✅ OPTIONS COMO JSON REAL
   * Tipagem estrita para garantir que os acompanhamentos não sumam.
   */
  options: json("options").$type<CartItemOptions>(),

  /**
   * ✅ APPLIED NUTRITION COMO JSON REAL
   * Snapshot para etiquetas e histórico nutricional.
   */
  appliedNutrition: json("applied_nutrition").$type<AppliedNutrition>(),
  
  /**
   * ⚠️ CAMPO LEGADO
   * Mantido apenas para compatibilidade, mas a recomendação é usar o JSON 'options'.
   */
  accompaniments: text("accompaniments"),

  createdAt: timestamp("created_at").defaultNow(),
});