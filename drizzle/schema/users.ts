// server/drizzle/schema/users.ts

import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  decimal,
  boolean,
  int,
  timestamp,
  mysqlEnum,
  smallint,
  index
} from "drizzle-orm/mysql-core";

import { orders } from "./orders";
import { couponUsage } from "./marketing";
import { loyaltyHistory } from "./loyalty";
import { mediaLibrary } from "./config";
import { encryptedText } from "../../server/encryption"; 

// ====================================================
// --- 1. TABELA PRINCIPAL (USERS) ---
// ====================================================
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  
  // Índices para busca (hashes ou termos normalizados)
  nameIndex: varchar("name_index", { length: 255 }),
  documentIndex: varchar("document_index", { length: 255 }), 
  phoneIndex: varchar("phone_index", { length: 255 }),
  
  email: varchar("email", { length: 255 }).notNull().unique(),
  
  name: encryptedText("name"), 
  customerDocument: encryptedText("customer_document"), 
  phone: encryptedText("phone"), 
  
  phoneLast4: varchar("phone_last4", { length: 4 }),
  
  role: mysqlEnum('role', ['admin', 'user', 'nutri']).default('user'),
  password: varchar("password", { length: 255 }),

  // --- CAMPOS DE RECUPERAÇÃO DE SENHA ---
  resetToken: varchar("reset_token", { length: 255 }),
  resetExpires: timestamp("reset_token_expires_at"),

  needsPasswordReset: int("needs_password_reset").default(0),

  availablePoints: int("loyalty_balance").default(0).notNull(), 
  
  /**
   * ✅ SISTEMA DE CRÉDITOS IA
   * aiCredits: Saldo mensal de consultas para o Gourmet AI.
   * Padrão: 2 créditos por mês.
   */
  aiCredits: int("ai_credits").default(2).notNull(), // Nova coluna adicionada aqui

  referralCode: varchar("referral_code", { length: 50 }),
  
  birthDate: varchar("birth_date", { length: 255 }), 
  birthYear: smallint("birth_year"),
  openId: varchar("open_id", { length: 255 }),
  loginMethod: varchar("login_method", { length: 50 }),
  
  lastSignedIn: timestamp("last_signed_in"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(), 
}, (table) => ({
  nameIdx: index("name_search_idx").on(table.nameIndex),
  docIdx: index("doc_search_idx").on(table.documentIndex),
  emailIdx: index("email_idx").on(table.email),
  // Índice opcional se você for criar um admin de monitoramento de uso de IA
  aiCreditsIdx: index("ai_credits_idx").on(table.aiCredits),
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
  professional_title: varchar("professional_title", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- RELAÇÕES ---
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(user_profiles), 
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