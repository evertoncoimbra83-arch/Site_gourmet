import { mysqlTable, serial, varchar, text, json, boolean, timestamp, int } from "drizzle-orm/mysql-core";

export const packagePersonas = mysqlTable("package_personas", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // ex: 'balanced'
  label: varchar("label", { length: 100 }).notNull(),       // ex: 'Equilibrado'
  description: text("description"),
  goal: varchar("goal", { length: 50 }).notNull(),          // balanced, high_protein, etc.
  
  // Armazenamos pesos e restrições como JSON para flexibilidade total
  weightsJson: json("weights_json").notNull(), 
  constraintsJson: json("constraints_json").notNull(),
  
  isSystem: boolean("is_system").default(false),   // Impede deleção de personas base
  isActive: boolean("is_active").default(true),
  displayOrder: int("display_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});