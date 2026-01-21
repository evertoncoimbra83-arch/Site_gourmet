import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  decimal,
  boolean,
  int,
  timestamp,
  mysqlEnum,
  text,
  char,
  smallint,
  index // ✅ Adicionado para performance
} from "drizzle-orm/mysql-core";

import { orders } from "./orders.js";
import { couponUsage } from "./marketing.js";
import { loyaltyHistory } from "./loyalty.js";
import { mediaLibrary } from "./config.js";
import { encryptedText } from "../../server/encryption.js"; 

// ====================================================
// --- 1. TABELA PRINCIPAL (USERS) ---
// ====================================================
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  
  // ✅ INDICES DE BUSCA (Blind Index)
  // Renomeado para documentIndex para bater com o código do seu roteador
  nameIndex: varchar("name_index", { length: 255 }),
  documentIndex: varchar("document_index", { length: 255 }), 
  phoneIndex: varchar("phone_index", { length: 255 }),
  
  email: varchar("email", { length: 255 }).notNull().unique(),
  
  // Dados Encriptados
  name: encryptedText("name"), // ✅ Alterado de text para encryptedText
  customerDocument: encryptedText("customer_document"), 
  phone: encryptedText("phone"), 
  
  // Auxiliar para suporte/exibição rápida
  phoneLast4: varchar("phone_last4", { length: 4 }),
  
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  password: varchar("password", { length: 255 }),
  loyaltyBalance: int("loyalty_balance").default(0).notNull(), 
  
  birthDate: varchar("birth_date", { length: 255 }), 
  birthYear: smallint("birth_year"),
  openId: varchar("open_id", { length: 255 }),
  loginMethod: varchar("login_method", { length: 50 }),
  
  lastSignedIn: timestamp("last_signed_in"),
  createdAt: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  // ✅ Adicionando índices de performance para as buscas em hash
  nameIdx: index("name_search_idx").on(table.nameIndex),
  docIdx: index("doc_search_idx").on(table.documentIndex),
}));

// ====================================================
// --- 2. PERFIL DO USUÁRIO ---
// ====================================================
export const user_profiles = mysqlTable("user_profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
    
  birthDate: encryptedText("birth_date"),
  zipCode: encryptedText("zip_code"),
  city: encryptedText("city"), 
  state: encryptedText("state"), 
  
  totalSpent: decimal("total_spent", { precision: 15, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ====================================================
// --- 3. ENDEREÇOS MÚLTIPLOS ---
// ====================================================
export const userAddresses = mysqlTable("user_addresses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
    
  label: encryptedText("label"), 
  street: encryptedText("address"), 
  number: encryptedText("number"),
  complement: encryptedText("complement"), 
  neighborhood: encryptedText("neighborhood"),
  zipCode: encryptedText("zip_code"),
  city: encryptedText("city"), 
  state: encryptedText("state"),
  phone: encryptedText("phone"), 
  receiverName: encryptedText("receiver_name"),
  
  isDefault: boolean("is_default").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- RELAÇÕES (Corrigidas para refletir o ID String) ---
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(user_profiles, { fields: [users.id], references: [user_profiles.userId] }),
  orders: many(orders),
  addresses: many(userAddresses),
  loyaltyHistory: many(loyaltyHistory),
  couponUsage: many(couponUsage),
  uploadedMedia: many(mediaLibrary),
}));

export const userProfilesRelations = relations(user_profiles, ({ one }) => ({
  user: one(users, { fields: [user_profiles.userId], references: [users.id] }),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, { fields: [userAddresses.userId], references: [users.id] }),
}));