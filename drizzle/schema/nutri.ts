import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  boolean,
  timestamp,
  text,
  json,
  index,
  unique,
  int,
} from "drizzle-orm/mysql-core";

import { users } from "./users";
import { encryptedText } from "../../server/encryption";

// --- INTERFACES DE DADOS ---
export interface AssignedDish {
  dishId: string;
  sizeId?: string; 
  dishName: string; 
  sizeName?: string; 
  mealTime?: string;
  notes?: string;
  technicalInsight?: string;
}

// --- 1. PERFIL DO NUTRICIONISTA ---
export const nutriProfiles = mysqlTable("nutri_profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  crn: varchar("crn", { length: 50 }).notNull().unique(),
  specialty: varchar("specialty", { length: 255 }),
  website: varchar("website", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  bio: text("bio"), 
  phone: varchar("phone", { length: 20 }),
  referralCode: varchar("referral_code", { length: 50 }).unique(), 
  discountPercentage: int("discount_percentage").default(0),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- 2. CONSULTÓRIOS / ENDEREÇOS ---
export const nutriAddresses = mysqlTable("nutri_addresses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  nutriId: varchar("nutri_id", { length: 255 })
    .notNull()
    .references(() => nutriProfiles.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(), 
  
  /**
   * ✅ PADRONIZAÇÃO DE CEP
   * TS usa zipCode, Banco de Dados usa a coluna zip_code.
   */
  zipCode: encryptedText("zip_code"),
  
  street: encryptedText("street"),
  number: encryptedText("number"),
  complement: encryptedText("complement"),
  neighborhood: encryptedText("neighborhood"),
  city: encryptedText("city"),
  state: encryptedText("state"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- 3. VÍNCULO PROFISSIONAL x CLIENTE ---
export const professionalClients = mysqlTable("professional_clients", {
  id: varchar("id", { length: 255 }).primaryKey(),
  professionalId: varchar("professional_id", { length: 255 })
    .notNull()
    .references(() => nutriProfiles.id, { onDelete: "cascade" }),
  clientId: varchar("client_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("active"),
  assignedDishes: json("assigned_dishes").$type<AssignedDish[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  idxProfessional: index("idx_professional").on(table.professionalId),
  idxClient: index("idx_client").on(table.clientId),
  uniqueRelationship: unique("unique_relationship").on(table.professionalId, table.clientId),
}));

// --- 4. AVALIAÇÕES / PARECER TÉCNICO ---
export const professionalReviews = mysqlTable("professional_reviews", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  dishId: varchar("dish_id", { length: 255 }).notNull(),
  technicalInsight: text("technical_insight"), 
  nutritionalHighlights: text("nutritional_highlights"), 
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 5. RELACIONAMENTOS ---

export const nutriProfilesRelations = relations(nutriProfiles, ({ one, many }) => ({
  user: one(users, { fields: [nutriProfiles.userId], references: [users.id] }),
  offices: many(nutriAddresses),
  clients: many(professionalClients),
}));

export const professionalClientsRelations = relations(professionalClients, ({ one }) => ({
  nutri: one(nutriProfiles, { fields: [professionalClients.professionalId], references: [nutriProfiles.id] }),
  client: one(users, { fields: [professionalClients.clientId], references: [users.id] }),
}));

export const nutriAddressesRelations = relations(nutriAddresses, ({ one }) => ({
  nutri: one(nutriProfiles, { fields: [nutriAddresses.nutriId], references: [nutriProfiles.id] }),
}));

export const professionalReviewsRelations = relations(professionalReviews, ({ one }) => ({
  user: one(users, { fields: [professionalReviews.userId], references: [users.id] }),
}));