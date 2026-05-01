import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  timestamp,
  boolean,
  longtext,
} from "drizzle-orm/mysql-core";

// ====================================================
// --- 1. MALHA GEOGRÁFICA (geo_mesh) ---
// ====================================================
export const geoMesh = mysqlTable("geo_mesh", {
  // ✅ Padronizado: zipCode no TS, cep no DB (para consistência com addresses)
  zipCode: varchar("cep", { length: 20 }).primaryKey(),
  neighborhood: varchar("bairro", { length: 100 }),
  city: varchar("cidade", { length: 100 }).default("Jundiaí"),
  
  storeSlug: varchar("store_slug", { length: 100 }).default("default"),

  lat: decimal("lat", { precision: 10, scale: 8 }).notNull(),
  lng: decimal("lng", { precision: 11, scale: 8 }).notNull(),
  lastSeen: timestamp("last_seen").defaultNow().onUpdateNow(),
});

// ====================================================
// --- 2. ZONAS DE ENTREGA (shipping_zones) ---
// ====================================================
export const shippingZones = mysqlTable("shipping_zones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), 
  storeSlug: varchar("store_slug", { length: 100 }).default("default"),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("zipcode"),
  
  // ✅ CamelCase no TS para bater com as interfaces de lógica
  polygonCoords: longtext("polygon_coords"), 

  // ✅ Padronização de nomes de colunas vs propriedades TS
  zipCodeStart: varchar("zip_code_start", { length: 20 }).notNull(),
  zipCodeEnd: varchar("zip_code_end", { length: 20 }).notNull(),

  shippingCost: decimal("shipping_cost", {
    precision: 10,
    scale: 2,
  }).notNull(),

  estimatedDays: int("estimated_days"),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const shippingRules = shippingZones;

// ====================================================
// --- 3. CONFIGURAÇÕES GERAIS DE ENTREGA (shipping_settings) ---
// ====================================================
export const shippingSettings = mysqlTable("shipping_settings", {
  id: int("id").autoincrement().primaryKey(),

  pickupEnabled: boolean("pickup_enabled").default(true),

  // ✅ Nomes de propriedades ajustados para casar com o erro do CheckoutView
  pickupLabel: varchar("pickup_label", { length: 255 }).default("Retirada no Balcão"),

  pickupInstruction: varchar("pickup_instruction", { length: 500 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});