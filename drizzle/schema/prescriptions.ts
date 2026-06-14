import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  longtext,
  mysqlEnum,
  decimal // ✅ IMPORTADO PARA O PREÇO
} from "drizzle-orm/mysql-core";

// ✅ IMPORTAÇÕES DOS OUTROS SCHEMAS (Para evitar duplicidade)
import { users } from "./users"; 

// ===================================================================
// INTERFACES PARA O SNAPSHOT (A "Foto" da Dieta)
// ===================================================================
export interface SnapshotDish {
  dishId: number;
  sizeId: number;
  name: string;
  sizeName?: string | null;
  weight?: number | string | null;
  sizeWeight?: number | string | null;
  mainDishWeight?: number | null;
  noAccompanimentsMessage?: string | null;
  priceAtCreation: number;
  multiplier: string | number;
  nutritionalData: {
    mainDishWeight: number;
    sizeId?: number | null;
    sizeName?: string | null;
    weight?: number | string | null;
    sizeWeight?: number | string | null;
    noAccompanimentsMessage?: string | null;
    baseMacros: {
      kcal: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
}

export interface SnapshotMeal {
  mealName: string;
  order: number;
  notes?: string;
  dishes: SnapshotDish[];
}

// ===================================================================
// 1. PRESCRIÇÕES (A Capa do Plano)
// ===================================================================
export const prescriptions = mysqlTable("prescriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).references(() => users.id),
  professionalId: varchar("professional_id", { length: 36 }).notNull(),
  planName: varchar("plan_name", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["active", "archived"]).default("active"),
  technicalInsight: text("technical_insight"),
  totalKcalTarget: int("total_kcal_target"),
  
  // ✅ MANTIDO PARA TRANSIÇÃO E BACKUP
  dietSnapshot: longtext("diet_snapshot").$type<SnapshotMeal[]>(),
  
  discountPercentage: int("discount_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================================================================
// 2. ITENS DA PRESCRIÇÃO (A NOVA TABELA ESPELHO 🚀)
// ===================================================================
export const prescriptionItems = mysqlTable("prescription_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  prescriptionId: varchar("prescription_id", { length: 36 })
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }), // Se apagar o plano, apaga os itens
    
  // Vínculos com o Catálogo
  dishId: int("dish_id").notNull(),
  sizeId: int("size_id").notNull(),
  dishName: varchar("dish_name", { length: 255 }), // Salva o nome para histórico
  
  // Estrutura na Dieta
  mealName: varchar("meal_name", { length: 100 }).notNull(), // Ex: "Refeição 1"
  order: int("order").default(0), // Para ordenar as refeições
  
  // 💰 O SEGREDO DO PREÇO IMUTÁVEL (Fim do bug do zero!)
  fixedPrice: decimal("fixed_price", { precision: 10, scale: 2 }).notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).default("1.00"),
  
  // Acompanhamentos e Macros (JSON leve apenas para o que importa no front)
  accompanimentsJson: text("accompaniments_json"),
  macrosJson: text("macros_json"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================================================================
// 3. TEMPLATES DE PRESCRIÇÃO
// ===================================================================
export const prescriptionTemplates = mysqlTable("prescription_templates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  professionalId: varchar("professional_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  content: text("content"), // Armazena o JSON stringificado (SnapshotMeal[])
  totalKcalTarget: int("total_kcal_target"),
  technicalInsight: text("technical_insight"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================================================================
// 4. RELAÇÕES (RELATIONS) - IMPORTANTÍSSIMO PARA O TRPC
// ===================================================================
export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  client: one(users, { fields: [prescriptions.clientId], references: [users.id] }),
  // ✅ Diz ao Drizzle que uma Prescrição tem Vários Itens
  items: many(prescriptionItems), 
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  // ✅ Diz ao Drizzle a qual Prescrição este item pertence
  prescription: one(prescriptions, { 
    fields: [prescriptionItems.prescriptionId], 
    references: [prescriptions.id] 
  }),
}));

export const prescriptionTemplatesRelations = relations(prescriptionTemplates, ({ one }) => ({
  professional: one(users, { fields: [prescriptionTemplates.professionalId], references: [users.id] }),
}));
