import { relations } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  int,
  timestamp,
  longtext,
  serial,
} from "drizzle-orm/mysql-core";

import { users } from "./users";

// ====================================================
// --- CONFIGURAÇÕES DINÂMICAS (Chaves Variáveis) ---
// ====================================================
// É aqui que salvamos a 'success_order_message' e o 'partners_json'
export const appConfigs = mysqlTable("app_configs", {
  configKey: varchar("config_key", { length: 100 }).primaryKey(),
  configValue: longtext("config_value"), // Usamos longtext para suportar JSON grande de parceiros
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ====================================================
// --- CONFIGURAÇÕES DA LOJA (Fixas) ---
// ====================================================
export const storeSettings = mysqlTable("store_settings", {
  id: varchar("id", { length: 255 }).primaryKey().default("1"),
  logoUrl: varchar("logo_url", { length: 255 }),
  favicon: varchar("favicon", { length: 255 }),
  emergencyMode: boolean("emergency_mode").default(false),
  generalMinOrderAmount: varchar("general_min_order_amount", { length: 50 }).default("0.00"),
  minOrderMessage: text("min_order_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  siteTheme: text("site_theme"),
});

// ❌ REMOVIDO: shippingSettings
// (Ela agora vive em ./shipping.ts para evitar conflito de exportação)

// ====================================================
// --- PAGAMENTOS E MÍDIA ---
// ====================================================

export const paymentMethods = mysqlTable("payment_methods", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  isActive: boolean("is_active").default(true),
  displayOrder: int("display_order").default(0),
  brandName: varchar("brand_name", { length: 100 }), 
  brandLogoUrl: varchar("brand_logo_url", { length: 255 }),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const foodCardBrands = mysqlTable("food_card_brands", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
});

export const mediaLibrary = mysqlTable("media_library", {
  id: varchar("id", { length: 255 }).primaryKey(),
  url: varchar("url", { length: 512 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 50 }),
  size: int("size"),
  altText: varchar("alt_text", { length: 255 }),
  uploadedBy: varchar("uploaded_by", { length: 255 }).references(() => users.id), 
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================================
// --- TEMA DO SITE ---
// ====================================================

export const siteTheme = mysqlTable("site_theme", {
  id: varchar("id", { length: 255 }).primaryKey(),
  borderRadius: varchar('border_radius', { length: 10 }).notNull().default('0.5rem'),
  primaryColor: varchar('primary_color', { length: 20 }).notNull().default('160 8% 35%'),
  primaryForeground: varchar('primary_foreground', { length: 20 }).notNull().default('0 0% 100%'),
  secondaryColor: varchar('secondary_color', { length: 20 }).notNull().default('48 96% 62%'),
  secondaryForeground: varchar('secondary_foreground', { length: 20 }).notNull().default('160 2% 22%'),
  backgroundColor: varchar('background_color', { length: 20 }).notNull().default('0 0% 100%'),
  foregroundColor: varchar('foreground_color', { length: 20 }).notNull().default('222 47.4% 11.2%'), 
  borderColor: varchar('border_color', { length: 20 }).notNull().default('240 5.9% 90%'),
  ringColor: varchar('ring_color', { length: 20 }).notNull().default('160 8% 35%'),
  cardColor: varchar('card_color', { length: 20 }).notNull().default('0 0% 100%'),
  cardForeground: varchar('card_foreground', { length: 20 }).notNull().default('222 47.4% 11.2%'),
  inputColor: varchar('input_color', { length: 20 }).notNull().default('240 5.9% 90%'),
  darkPrimaryColor: varchar('dark_primary_color', { length: 20 }).notNull().default('160 8% 35%'),
  darkBackgroundColor: varchar('dark_background_color', { length: 20 }).notNull().default('224 71.4% 4.1%'),
  headerBgColor: varchar("header_bg_color", { length: 50 }).default("0 0% 100%"),
  footerBgColor: varchar("footer_bg_color", { length: 50 }).default("160 8% 35%"),
  footerTextColor: varchar("footer_text_color", { length: 50 }).default("0 0% 100%"),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ====================================================
// --- ETIQUETAS ZEBRA (Biblioteca de Templates) ---
// ====================================================

export const labelTemplates = mysqlTable("label_templates", {
  id: serial("id").primaryKey(), // Usamos serial para auto-incremento numérico
  name: varchar("name", { length: 100 }).notNull(), // Nome ex: "Marmita Padrão"
  width: int("width").default(100),  // Largura em mm
  height: int("height").default(60), // Altura em mm
  elements: longtext("elements").notNull(), // O JSON completo dos textos/tags
  isDefault: boolean("is_default").default(false), // Se será o carregado por padrão
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ====================================================
// --- RELAÇÕES DE SISTEMA ---
// ====================================================

export const paymentMethodRelations = relations(paymentMethods, ({ many }) => ({
  foodCardBrands: many(foodCardBrands),
}));

export const mediaLibraryRelations = relations(mediaLibrary, ({ one }) => ({
  author: one(users, {
    fields: [mediaLibrary.uploadedBy],
    references: [users.id],
  }),
}));
