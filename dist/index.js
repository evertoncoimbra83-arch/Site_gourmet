var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema/catalog.ts
import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  int,
  timestamp,
  json
} from "drizzle-orm/mysql-core";
var categories, dishes, accompanimentCategories, dishSizes, accompanimentGroups, accompanimentOptions, sizeAccompanimentGroups, accompanimentCategoriesRelations, accompanimentOptionsRelations, categoriesRelations, dishesRelations, dishSizesRelations, accompanimentGroupsRelations, sizeAccompanimentGroupRelations;
var init_catalog = __esm({
  "drizzle/schema/catalog.ts"() {
    "use strict";
    categories = mysqlTable("categories", {
      id: int("id").primaryKey().autoincrement(),
      name: varchar("name", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      category: varchar("category", { length: 50 }),
      description: text("description"),
      displayOrder: int("display_order").default(0),
      isActive: boolean("is_active").default(true),
      allowAccompaniments: boolean("allow_accompaniments").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
    });
    dishes = mysqlTable("dishes", {
      id: int("id").primaryKey().autoincrement(),
      name: varchar("name", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      description: text("description"),
      imageUrl: varchar("image_url", { length: 500 }),
      price: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
      categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
      isActive: boolean("is_active").default(true),
      // Nutricionais Planos
      // ✅ Verifique se 'energy_kcal' existe no banco. Se for 'calories', mude a string entre aspas.
      energyKcal: int("energy_kcal"),
      energyKj: int("energy_kj"),
      proteins: decimal("proteins", { precision: 10, scale: 2 }),
      carbs: decimal("carbs", { precision: 10, scale: 2 }),
      fiber: decimal("fiber", { precision: 10, scale: 2 }),
      fatTotal: decimal("fat_total", { precision: 10, scale: 2 }),
      fatSaturated: decimal("fat_saturated", { precision: 10, scale: 2 }),
      fatTrans: decimal("fat_trans", { precision: 10, scale: 2 }),
      sodium: decimal("sodium", { precision: 10, scale: 2 }),
      showNutrition: boolean("show_nutrition").default(false),
      ingredients: text("ingredients"),
      isVegetarian: boolean("is_vegetarian").default(false),
      isGlutenFree: boolean("is_gluten_free").default(false),
      isLactoseFree: boolean("is_lactose_free").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
    });
    accompanimentCategories = mysqlTable("accompaniment_categories", {
      id: int("id").primaryKey().autoincrement(),
      name: varchar("name", { length: 100 }).notNull().unique(),
      iconKey: varchar("icon_key", { length: 50 }),
      color: varchar("color", { length: 20 }),
      displayOrder: int("display_order").default(0),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
    });
    dishSizes = mysqlTable("dish_sizes", {
      id: int("id").primaryKey().autoincrement(),
      name: varchar("name", { length: 50 }).notNull(),
      weight: varchar("weight", { length: 50 }),
      priceModifier: decimal("price_modifier", { precision: 10, scale: 2 }).default("0.00"),
      iconKey: varchar("icon_key", { length: 50 }).default("Box"),
      color: varchar("color", { length: 20 }).default("slate"),
      displayOrder: int("display_order").notNull().default(0),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
    });
    accompanimentGroups = mysqlTable("accompaniment_groups", {
      id: int("id").primaryKey().autoincrement(),
      name: varchar("name", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      description: text("description"),
      maxSelections: int("max_selections").notNull().default(1),
      minSelections: int("min_selections").notNull().default(0),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
    });
    accompanimentOptions = mysqlTable("accompaniment_options", {
      id: int("id").primaryKey().autoincrement(),
      name: varchar("name", { length: 100 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      accompanimentCategoryId: int("accompaniment_category_id").references(() => accompanimentCategories.id),
      groupsConfig: json("groups_config").$type().notNull().default([]),
      isActive: boolean("is_active").notNull().default(true),
      displayOrder: int("display_order").notNull().default(0),
      showNutrition: boolean("show_nutrition").notNull().default(false),
      // ✅ Sincronizado com os nomes da tabela de pratos para facilitar cálculos
      energyKcal: int("energy_kcal"),
      carbs: decimal("carbs", { precision: 10, scale: 2 }),
      proteins: decimal("proteins", { precision: 10, scale: 2 }),
      fatTotal: decimal("fat_total", { precision: 10, scale: 2 }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
    });
    sizeAccompanimentGroups = mysqlTable("size_accompaniment_groups", {
      id: int("id").primaryKey().autoincrement(),
      sizeId: int("size_id").notNull().references(() => dishSizes.id, { onDelete: "cascade" }),
      accompanimentGroupId: int("accompaniment_group_id").notNull().references(() => accompanimentGroups.id, { onDelete: "cascade" }),
      isRequired: boolean("is_required").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    accompanimentCategoriesRelations = relations(accompanimentCategories, ({ many }) => ({
      options: many(accompanimentOptions)
    }));
    accompanimentOptionsRelations = relations(accompanimentOptions, ({ one }) => ({
      category: one(accompanimentCategories, {
        fields: [accompanimentOptions.accompanimentCategoryId],
        references: [accompanimentCategories.id]
      })
    }));
    categoriesRelations = relations(categories, ({ many }) => ({
      dishes: many(dishes)
    }));
    dishesRelations = relations(dishes, ({ one }) => ({
      category: one(categories, {
        fields: [dishes.categoryId],
        references: [categories.id]
      })
    }));
    dishSizesRelations = relations(dishSizes, ({ many }) => ({
      sizeAccompanimentGroups: many(sizeAccompanimentGroups)
    }));
    accompanimentGroupsRelations = relations(accompanimentGroups, ({ many }) => ({
      sizeAccompanimentGroups: many(sizeAccompanimentGroups)
    }));
    sizeAccompanimentGroupRelations = relations(sizeAccompanimentGroups, ({ one }) => ({
      size: one(dishSizes, {
        fields: [sizeAccompanimentGroups.sizeId],
        references: [dishSizes.id]
      }),
      group: one(accompanimentGroups, {
        fields: [sizeAccompanimentGroups.accompanimentGroupId],
        references: [accompanimentGroups.id]
      })
    }));
  }
});

// drizzle/schema/packages.ts
import { relations as relations2 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable2,
  varchar as varchar2,
  text as text2,
  decimal as decimal2,
  boolean as boolean2,
  int as int2,
  timestamp as timestamp2,
  json as json2
} from "drizzle-orm/mysql-core";
var packages, packageOptions, packageOptionDishes, packageOptionGroups, packageRelations, packageOptionsRelations, packageOptionDishesRelations, packageOptionGroupsRelations, accompanimentOptionsWithCategoryRelations, accompanimentGroupsWithItemsRelations;
var init_packages = __esm({
  "drizzle/schema/packages.ts"() {
    "use strict";
    init_orders();
    init_catalog();
    packages = mysqlTable2("packages", {
      id: varchar2("id", { length: 255 }).primaryKey(),
      name: varchar2("name", { length: 255 }).notNull(),
      slug: varchar2("slug", { length: 255 }).notNull().unique(),
      description: text2("description"),
      price: decimal2("base_price", { precision: 10, scale: 2 }).notNull(),
      numberOfOptions: int2("number_of_options").default(3),
      month: varchar2("month", { length: 50 }),
      imageUrl: varchar2("image_url", { length: 500 }),
      isActive: boolean2("is_active").default(true),
      config: json2("config"),
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow().onUpdateNow()
    });
    packageOptions = mysqlTable2("package_options", {
      id: int2("id").primaryKey().autoincrement(),
      packageId: varchar2("package_id", { length: 255 }).notNull().references(() => packages.id, { onDelete: "cascade" }),
      name: varchar2("name", { length: 255 }).notNull(),
      optionOrder: int2("option_order").default(0),
      createdAt: timestamp2("created_at").defaultNow()
    });
    packageOptionDishes = mysqlTable2("package_option_dishes", {
      id: int2("id").primaryKey().autoincrement(),
      optionId: int2("option_id").notNull().references(() => packageOptions.id, { onDelete: "cascade" }),
      dishId: int2("dish_id").notNull().references(() => dishes.id, { onDelete: "cascade" })
    });
    packageOptionGroups = mysqlTable2("package_option_groups", {
      id: int2("id").primaryKey().autoincrement(),
      optionId: int2("option_id").notNull().references(() => packageOptions.id, { onDelete: "cascade" }),
      groupId: int2("group_id").notNull().references(() => accompanimentGroups.id, { onDelete: "cascade" })
    });
    packageRelations = relations2(packages, ({ many }) => ({
      orderItems: many(orderItems),
      options: many(packageOptions)
    }));
    packageOptionsRelations = relations2(packageOptions, ({ one, many }) => ({
      package: one(packages, {
        fields: [packageOptions.packageId],
        references: [packages.id]
      }),
      allowedDishes: many(packageOptionDishes),
      allowedGroups: many(packageOptionGroups)
    }));
    packageOptionDishesRelations = relations2(packageOptionDishes, ({ one }) => ({
      option: one(packageOptions, {
        fields: [packageOptionDishes.optionId],
        references: [packageOptions.id]
      }),
      dish: one(dishes, {
        fields: [packageOptionDishes.dishId],
        references: [dishes.id]
      })
    }));
    packageOptionGroupsRelations = relations2(packageOptionGroups, ({ one }) => ({
      option: one(packageOptions, {
        fields: [packageOptionGroups.optionId],
        references: [packageOptions.id]
      }),
      group: one(accompanimentGroups, {
        fields: [packageOptionGroups.groupId],
        references: [accompanimentGroups.id]
      })
    }));
    accompanimentOptionsWithCategoryRelations = relations2(accompanimentOptions, ({ one }) => ({
      category: one(categories, {
        fields: [accompanimentOptions.accompanimentCategoryId],
        references: [categories.id]
      })
    }));
    accompanimentGroupsWithItemsRelations = relations2(accompanimentGroups, ({ many }) => ({
      options: many(accompanimentOptions)
    }));
  }
});

// drizzle/schema/loyalty.ts
import { relations as relations3 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable3,
  varchar as varchar3,
  text as text3,
  decimal as decimal3,
  boolean as boolean3,
  int as int3,
  timestamp as timestamp3
} from "drizzle-orm/mysql-core";
var loyaltySettings, loyaltyHistory, loyaltyHistoryRelations;
var init_loyalty = __esm({
  "drizzle/schema/loyalty.ts"() {
    "use strict";
    init_users();
    init_orders();
    loyaltySettings = mysqlTable3("loyalty_settings", {
      id: varchar3("id", { length: 255 }).primaryKey(),
      enabled: boolean3("enabled").default(true),
      // Mapeamento explícito para snake_case do banco
      conversionRatePoints: int3("conversion_rate_points").default(1),
      conversionRateMoney: decimal3("conversion_rate_money", { precision: 10, scale: 2 }).default("1.00"),
      redemptionRatePoints: int3("redemption_rate_points").default(100),
      redemptionRateMoney: decimal3("redemption_rate_money", { precision: 10, scale: 2 }).default("1.00"),
      minCartAmount: decimal3("min_cart_amount", { precision: 10, scale: 2 }).default("0.00"),
      maxDiscountAmount: decimal3("max_discount_amount", { precision: 10, scale: 2 }).default("50.00"),
      // Campos de bônus que o seu Admin utiliza
      pointsPerSignup: int3("points_per_signup").default(100),
      pointsPerReview: int3("points_per_review").default(10),
      pointsExpirationDays: int3("points_expiration_days").default(365),
      updatedAt: timestamp3("updated_at").defaultNow().onUpdateNow()
    });
    loyaltyHistory = mysqlTable3("loyalty_history", {
      id: varchar3("id", { length: 255 }).primaryKey(),
      // ✅ IMPORTANTE: userId no código mapeia para user_id no banco
      userId: varchar3("user_id", { length: 255 }).notNull().references(() => users.id),
      // ✅ IMPORTANTE: pointsChange no código mapeia para points_change no banco
      pointsChange: int3("points_change").notNull(),
      reason: varchar3("reason", { length: 255 }),
      // ✅ IMPORTANTE: orderId no código mapeia para order_id no banco
      orderId: varchar3("order_id", { length: 255 }).references(() => orders.id),
      description: text3("description"),
      type: varchar3("type", { length: 20 }).default("earned"),
      createdAt: timestamp3("created_at").defaultNow()
    });
    loyaltyHistoryRelations = relations3(loyaltyHistory, ({ one }) => ({
      user: one(users, {
        fields: [loyaltyHistory.userId],
        references: [users.id]
      }),
      order: one(orders, {
        fields: [loyaltyHistory.orderId],
        references: [orders.id]
      })
    }));
  }
});

// server/encryption.ts
import * as crypto2 from "crypto";
import { customType } from "drizzle-orm/mysql-core";
function getEncryptionKey() {
  let key = process.env.DB_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u274C ERRO CR\xCDTICO: DB_ENCRYPTION_KEY n\xE3o configurada em produ\xE7\xE3o!");
    }
    key = "dev-secret-key-pode-ser-curta";
  }
  return crypto2.scryptSync(key, "static-salt", 32);
}
function normalizeDigits(v) {
  return (v ?? "").replace(/\D/g, "");
}
function piiHash(input) {
  if (!input) return null;
  if (!PII_PEPPER && process.env.NODE_ENV === "production") {
    console.warn("\u26A0\uFE0F PII_PEPPER ausente. Hashes menos seguros.");
  }
  return crypto2.createHash("sha256").update(`${PII_PEPPER}:${input}`).digest("hex");
}
function encrypt(text13) {
  if (!text13) return null;
  const t2 = String(text13).trim();
  if (!t2) return null;
  try {
    const key = getEncryptionKey();
    const iv = crypto2.randomBytes(IV_LENGTH);
    const cipher = crypto2.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(t2, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("\u274C [ENCRYPTION] Erro ao criptografar:", error);
    return null;
  }
}
function decrypt(data) {
  if (!data) return null;
  let text13 = "";
  if (Buffer.isBuffer(data)) {
    text13 = data.toString("utf-8");
  } else {
    text13 = String(data);
  }
  const parts = text13.split(":");
  if (parts.length !== 3) return text13;
  try {
    const [ivHex, tagHex, encryptedText3] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto2.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedText3, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    return text13;
  }
}
var ALGORITHM, IV_LENGTH, PII_PEPPER, encryptedText;
var init_encryption = __esm({
  "server/encryption.ts"() {
    "use strict";
    ALGORITHM = "aes-256-gcm";
    IV_LENGTH = 12;
    PII_PEPPER = process.env.PII_PEPPER || "";
    encryptedText = (columnName) => customType({
      dataType() {
        return "blob";
      },
      toDriver(value) {
        const encrypted = encrypt(value);
        return encrypted;
      },
      fromDriver(value) {
        if (Buffer.isBuffer(value)) {
          return decrypt(value);
        }
        return decrypt(String(value));
      }
    })(columnName);
  }
});

// drizzle/schema/orders.ts
import { relations as relations4 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable4,
  varchar as varchar4,
  decimal as decimal4,
  int as int4,
  timestamp as timestamp4,
  mysqlEnum,
  text as text4,
  customType as customType2
} from "drizzle-orm/mysql-core";
var encryptedText2, orders, orderItems, ordersRelations, orderItemsRelations;
var init_orders = __esm({
  "drizzle/schema/orders.ts"() {
    "use strict";
    init_users();
    init_catalog();
    init_packages();
    init_loyalty();
    init_encryption();
    encryptedText2 = customType2({
      dataType() {
        return "text";
      },
      toDriver(value) {
        if (!value) return null;
        const str = String(value);
        return str.includes(":") ? str : encrypt(str);
      },
      fromDriver(value) {
        if (!value) return null;
        const str = String(value);
        try {
          return str.includes(":") ? decrypt(str) : str;
        } catch (e) {
          return str;
        }
      }
    });
    orders = mysqlTable4("orders", {
      /** * ✅ ID AMIGÁVEL GS-XXXX 
       * Mantemos varchar(255) para flexibilidade.
       */
      id: varchar4("id", { length: 255 }).primaryKey(),
      userId: varchar4("user_id", { length: 255 }).notNull().references(() => users.id),
      status: mysqlEnum("status", ["pending", "preparing", "shipped", "delivered", "cancelled", "completed"]).default("pending").notNull(),
      // Financeiro
      subtotal: decimal4("subtotal", { precision: 10, scale: 2 }).notNull(),
      shippingCost: decimal4("shipping_cost", { precision: 10, scale: 2 }).default("0.00").notNull(),
      totalDiscount: decimal4("total_discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
      total: decimal4("total", { precision: 10, scale: 2 }).notNull(),
      // Detalhes do Pagamento e Descontos
      discountsSnapshot: text4("discounts_snapshot"),
      paymentMethod: varchar4("payment_method", { length: 255 }).notNull(),
      paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
      pixCopyPaste: text4("pix_copy_paste"),
      // Dados do Cliente (Protegidos)
      customerName: encryptedText2("customer_name"),
      customerDocument: encryptedText2("customer_document"),
      customerPhone: encryptedText2("customer_phone"),
      customerDocumentHash: varchar4("customer_document_hash", { length: 255 }),
      customerPhoneHash: varchar4("customer_phone_hash", { length: 255 }),
      // Endereço de Entrega
      shippingAddress: encryptedText2("shipping_address"),
      shippingAddressNumber: encryptedText2("shipping_address_number"),
      shippingAddressComplement: encryptedText2("shipping_address_complement"),
      shippingNeighborhood: encryptedText2("shipping_neighborhood"),
      shippingCity: varchar4("shipping_city", { length: 100 }),
      shippingState: varchar4("shipping_state", { length: 2 }),
      shippingZipCode: varchar4("shipping_zip_code", { length: 20 }),
      // Fidelidade
      loyaltyPointsUsed: int4("loyalty_points_used").default(0),
      loyaltyPointsEarned: int4("loyalty_points_earned").default(0),
      notes: text4("notes"),
      createdAt: timestamp4("created_at").defaultNow(),
      updatedAt: timestamp4("updated_at").defaultNow().onUpdateNow()
    });
    orderItems = mysqlTable4("order_items", {
      id: varchar4("id", { length: 255 }).primaryKey(),
      orderId: varchar4("order_id", { length: 255 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
      dishId: varchar4("dish_id", { length: 255 }).references(() => dishes.id),
      packageId: varchar4("package_id", { length: 255 }).references(() => packages.id),
      dishName: varchar4("dish_name", { length: 255 }).notNull(),
      sizeName: varchar4("size_name", { length: 100 }),
      quantity: int4("quantity").notNull(),
      unitPrice: decimal4("unit_price", { precision: 10, scale: 2 }).notNull(),
      discountAmount: decimal4("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
      totalPrice: decimal4("total_price", { precision: 10, scale: 2 }).notNull(),
      // ✅ COLUNAS PARA CUSTOMIZAÇÃO (JSON)
      options: text4("options"),
      // JSON Completo (Escolhas de marmitas e acompanhamentos)
      appliedNutrition: text4("applied_nutrition")
    });
    ordersRelations = relations4(orders, ({ one, many }) => ({
      user: one(users, { fields: [orders.userId], references: [users.id] }),
      items: many(orderItems),
      loyaltyHistory: many(loyaltyHistory)
    }));
    orderItemsRelations = relations4(orderItems, ({ one }) => ({
      order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
      package: one(packages, { fields: [orderItems.packageId], references: [packages.id] }),
      dish: one(dishes, { fields: [orderItems.dishId], references: [dishes.id] })
    }));
  }
});

// drizzle/schema/marketing.ts
import { relations as relations5 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable5,
  varchar as varchar5,
  text as text5,
  decimal as decimal5,
  boolean as boolean4,
  int as int5,
  timestamp as timestamp5,
  mysqlEnum as mysqlEnum2
} from "drizzle-orm/mysql-core";
var discountRules, coupons, couponUsage, couponRelations, couponUsageRelations;
var init_marketing = __esm({
  "drizzle/schema/marketing.ts"() {
    "use strict";
    init_users();
    init_orders();
    discountRules = mysqlTable5("discount_rules", {
      id: int5("id").primaryKey().autoincrement(),
      name: varchar5("name", { length: 255 }).notNull(),
      description: varchar5("description", { length: 512 }),
      // Colunas de Quantidade (min_quantity)
      minQuantity: int5("min_quantity"),
      maxQuantity: int5("max_quantity"),
      // Mapeamento: JS 'discountType' -> DB 'type' | JS 'discountValue' -> DB 'value'
      discountType: mysqlEnum2("type", ["percentage", "fixed"]).notNull(),
      discountValue: decimal5("value", { precision: 10, scale: 2 }).notNull(),
      priority: int5("priority"),
      isActive: boolean4("is_active").default(true),
      createdAt: timestamp5("created_at").defaultNow(),
      updatedAt: timestamp5("updated_at").defaultNow().onUpdateNow()
    });
    coupons = mysqlTable5("coupons", {
      id: varchar5("id", { length: 255 }).primaryKey(),
      code: varchar5("code", { length: 50 }).notNull().unique(),
      description: text5("description"),
      // Mapeamento: JS 'discountType' -> DB 'discount_type'
      discountType: mysqlEnum2("discount_type", ["percentage", "fixed"]).notNull(),
      discountValue: decimal5("discount_value", { precision: 10, scale: 2 }).notNull(),
      minOrderValue: decimal5("min_order_value", { precision: 10, scale: 2 }),
      maxDiscount: decimal5("max_discount", { precision: 10, scale: 2 }),
      usageLimit: int5("usage_limit"),
      validFrom: timestamp5("valid_from"),
      validUntil: timestamp5("valid_until"),
      isActive: boolean4("is_active").default(true),
      createdAt: timestamp5("created_at").defaultNow()
    });
    couponUsage = mysqlTable5("coupon_usage", {
      id: varchar5("id", { length: 255 }).primaryKey(),
      couponId: varchar5("coupon_id", { length: 255 }).notNull().references(() => coupons.id),
      userId: varchar5("user_id", { length: 255 }).notNull().references(() => users.id),
      orderId: varchar5("order_id", { length: 255 }).references(() => orders.id),
      usedAt: timestamp5("used_at").defaultNow()
    });
    couponRelations = relations5(coupons, ({ many }) => ({
      usage: many(couponUsage)
    }));
    couponUsageRelations = relations5(couponUsage, ({ one }) => ({
      coupon: one(coupons, { fields: [couponUsage.couponId], references: [coupons.id] }),
      user: one(users, { fields: [couponUsage.userId], references: [users.id] }),
      order: one(orders, { fields: [couponUsage.orderId], references: [orders.id] })
    }));
  }
});

// drizzle/schema/config.ts
import { relations as relations6 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable6,
  varchar as varchar6,
  text as text6,
  decimal as decimal6,
  boolean as boolean5,
  int as int6,
  timestamp as timestamp6
} from "drizzle-orm/mysql-core";
var paymentMethods, foodCardBrands, mediaLibrary, siteTheme, paymentMethodRelations, mediaLibraryRelations;
var init_config = __esm({
  "drizzle/schema/config.ts"() {
    "use strict";
    init_users();
    paymentMethods = mysqlTable6("payment_methods", {
      // ✅ Alterado para varchar(255) para consistência global
      id: varchar6("id", { length: 255 }).primaryKey(),
      name: varchar6("name", { length: 100 }).notNull(),
      description: text6("description"),
      icon: varchar6("icon", { length: 100 }),
      isActive: boolean5("is_active").default(true),
      displayOrder: int6("display_order").default(0),
      brandName: varchar6("brand_name", { length: 100 }),
      brandLogoUrl: varchar6("brand_logo_url", { length: 255 }),
      discountPercentage: decimal6("discount_percentage", { precision: 5, scale: 2 }).default("0.00"),
      createdAt: timestamp6("created_at").defaultNow(),
      updated_at: timestamp6("updated_at").defaultNow().onUpdateNow()
    });
    foodCardBrands = mysqlTable6("food_card_brands", {
      // ✅ Alterado para varchar(255)
      id: varchar6("id", { length: 255 }).primaryKey(),
      name: varchar6("name", { length: 100 }).notNull(),
      isActive: boolean5("is_active").default(true)
    });
    mediaLibrary = mysqlTable6("media_library", {
      // ✅ Alterado para varchar(255)
      id: varchar6("id", { length: 255 }).primaryKey(),
      url: varchar6("url", { length: 512 }).notNull(),
      fileName: varchar6("file_name", { length: 255 }).notNull(),
      mimeType: varchar6("mime_type", { length: 50 }),
      size: int6("size"),
      altText: varchar6("alt_text", { length: 255 }),
      /**
       * 🚩 AJUSTE CRÍTICO: uploadedBy
       * Alterado de bigint para varchar(255) para bater com users.id.
       */
      uploadedBy: varchar6("uploaded_by", { length: 255 }).references(() => users.id),
      createdAt: timestamp6("created_at").defaultNow()
    });
    siteTheme = mysqlTable6("site_theme", {
      // ✅ Alterado para varchar(255)
      id: varchar6("id", { length: 255 }).primaryKey(),
      borderRadius: varchar6("border_radius", { length: 10 }).notNull().default("0.5rem"),
      primaryColor: varchar6("primary_color", { length: 20 }).notNull().default("160 8% 35%"),
      primaryForeground: varchar6("primary_foreground", { length: 20 }).notNull().default("0 0% 100%"),
      secondaryColor: varchar6("secondary_color", { length: 20 }).notNull().default("48 96% 62%"),
      secondaryForeground: varchar6("secondary_foreground", { length: 20 }).notNull().default("160 2% 22%"),
      backgroundColor: varchar6("background_color", { length: 20 }).notNull().default("0 0% 100%"),
      foregroundColor: varchar6("foreground_color", { length: 20 }).notNull().default("222 47.4% 11.2%"),
      borderColor: varchar6("border_color", { length: 20 }).notNull().default("240 5.9% 90%"),
      ringColor: varchar6("ring_color", { length: 20 }).notNull().default("160 8% 35%"),
      cardColor: varchar6("card_color", { length: 20 }).notNull().default("0 0% 100%"),
      cardForeground: varchar6("card_foreground", { length: 20 }).notNull().default("222 47.4% 11.2%"),
      inputColor: varchar6("input_color", { length: 20 }).notNull().default("240 5.9% 90%"),
      darkPrimaryColor: varchar6("dark_primary_color", { length: 20 }).notNull().default("160 8% 35%"),
      darkBackgroundColor: varchar6("dark_background_color", { length: 20 }).notNull().default("224 71.4% 4.1%"),
      headerBgColor: varchar6("header_bg_color", { length: 50 }).default("0 0% 100%"),
      footerBgColor: varchar6("footer_bg_color", { length: 50 }).default("160 8% 35%"),
      footerTextColor: varchar6("footer_text_color", { length: 50 }).default("0 0% 100%"),
      updated_at: timestamp6("updated_at").defaultNow().onUpdateNow()
    });
    paymentMethodRelations = relations6(paymentMethods, ({ many }) => ({
      foodCardBrands: many(foodCardBrands)
    }));
    mediaLibraryRelations = relations6(mediaLibrary, ({ one }) => ({
      author: one(users, {
        fields: [mediaLibrary.uploadedBy],
        references: [users.id]
      })
    }));
  }
});

// drizzle/schema/users.ts
import { relations as relations7 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable7,
  varchar as varchar7,
  decimal as decimal7,
  boolean as boolean6,
  int as int7,
  timestamp as timestamp7,
  mysqlEnum as mysqlEnum3,
  smallint,
  index
} from "drizzle-orm/mysql-core";
var users, user_profiles, userAddresses, usersRelations, userProfilesRelations, userAddressesRelations;
var init_users = __esm({
  "drizzle/schema/users.ts"() {
    "use strict";
    init_orders();
    init_marketing();
    init_loyalty();
    init_config();
    init_encryption();
    users = mysqlTable7("users", {
      id: varchar7("id", { length: 255 }).primaryKey(),
      // ✅ INDICES DE BUSCA (Blind Index)
      // Renomeado para documentIndex para bater com o código do seu roteador
      nameIndex: varchar7("name_index", { length: 255 }),
      documentIndex: varchar7("document_index", { length: 255 }),
      phoneIndex: varchar7("phone_index", { length: 255 }),
      email: varchar7("email", { length: 255 }).notNull().unique(),
      // Dados Encriptados
      name: encryptedText("name"),
      // ✅ Alterado de text para encryptedText
      customerDocument: encryptedText("customer_document"),
      phone: encryptedText("phone"),
      // Auxiliar para suporte/exibição rápida
      phoneLast4: varchar7("phone_last4", { length: 4 }),
      role: mysqlEnum3("role", ["admin", "user"]).default("user").notNull(),
      password: varchar7("password", { length: 255 }),
      loyaltyBalance: int7("loyalty_balance").default(0).notNull(),
      birthDate: varchar7("birth_date", { length: 255 }),
      birthYear: smallint("birth_year"),
      openId: varchar7("open_id", { length: 255 }),
      loginMethod: varchar7("login_method", { length: 50 }),
      lastSignedIn: timestamp7("last_signed_in"),
      createdAt: timestamp7("created_at").defaultNow(),
      updated_at: timestamp7("updated_at").defaultNow().onUpdateNow()
    }, (table) => ({
      // ✅ Adicionando índices de performance para as buscas em hash
      nameIdx: index("name_search_idx").on(table.nameIndex),
      docIdx: index("doc_search_idx").on(table.documentIndex)
    }));
    user_profiles = mysqlTable7("user_profiles", {
      id: varchar7("id", { length: 255 }).primaryKey(),
      userId: varchar7("user_id", { length: 255 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      birthDate: encryptedText("birth_date"),
      zipCode: encryptedText("zip_code"),
      city: encryptedText("city"),
      state: encryptedText("state"),
      totalSpent: decimal7("total_spent", { precision: 15, scale: 2 }).default("0.00"),
      createdAt: timestamp7("created_at").defaultNow(),
      updated_at: timestamp7("updated_at").defaultNow().onUpdateNow()
    });
    userAddresses = mysqlTable7("user_addresses", {
      id: varchar7("id", { length: 255 }).primaryKey(),
      userId: varchar7("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
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
      isDefault: boolean6("is_default").default(false),
      createdAt: timestamp7("created_at").defaultNow(),
      updated_at: timestamp7("updated_at").defaultNow().onUpdateNow()
    });
    usersRelations = relations7(users, ({ one, many }) => ({
      profile: one(user_profiles, { fields: [users.id], references: [user_profiles.userId] }),
      orders: many(orders),
      addresses: many(userAddresses),
      loyaltyHistory: many(loyaltyHistory),
      couponUsage: many(couponUsage),
      uploadedMedia: many(mediaLibrary)
    }));
    userProfilesRelations = relations7(user_profiles, ({ one }) => ({
      user: one(users, { fields: [user_profiles.userId], references: [users.id] })
    }));
    userAddressesRelations = relations7(userAddresses, ({ one }) => ({
      user: one(users, { fields: [userAddresses.userId], references: [users.id] })
    }));
  }
});

// drizzle/schema/cart.ts
import { mysqlTable as mysqlTable8, varchar as varchar8, decimal as decimal8, timestamp as timestamp8, text as text8, boolean as boolean7, int as int8 } from "drizzle-orm/mysql-core";
var carts;
var init_cart = __esm({
  "drizzle/schema/cart.ts"() {
    "use strict";
    init_users();
    carts = mysqlTable8("carts", {
      /**
       * ✅ ID DO CARRINHO
       * UUID v4 gerado no backend.
       */
      id: varchar8("id", { length: 36 }).primaryKey().notNull(),
      /**
       * 👤 USUÁRIO LOGADO (Opcional)
       * Se o usuário fizer login, preenchemos este campo.
       */
      userId: varchar8("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
      /**
       * 👻 VISITANTE (Opcional - A CHAVE DO PROBLEMA)
       * Armazena o UUID gerado no LocalStorage para quem não tem login.
       * Isso permite salvar o carrinho mesmo sem sessão do Lucia.
       */
      guestId: varchar8("guest_id", { length: 36 }),
      // Status da sessão (active, abandoned, completed)
      status: varchar8("status", { length: 20 }).default("active"),
      // Campo legado para sessão do Lucia (pode manter por segurança)
      sessionId: varchar8("session_id", { length: 255 }),
      // 💰 Valores Monetários
      shippingValue: decimal8("shipping_value", { precision: 10, scale: 2 }).default("0.00"),
      discountValue: decimal8("discount_value", { precision: 10, scale: 2 }).default("0.00"),
      // 🎟️ Cupons e Descontos
      couponCode: varchar8("coupon_code", { length: 50 }),
      couponId: int8("coupon_id"),
      /**
       * ✅ Uso do tipo 'boolean'
       * O Drizzle converte automaticamente para tinyint(1) no MySQL,
       * mas no TypeScript fica boolean (true/false) em vez de number (0/1).
       */
      usesLoyalty: boolean7("uses_loyalty").default(false),
      // 📦 JSONs de Cache
      discountsJson: text8("discounts_json"),
      itemsSnapshotJson: text8("items_snapshot_json"),
      // Timestamps
      createdAt: timestamp8("created_at").defaultNow(),
      updatedAt: timestamp8("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/cartItems.ts
import { mysqlTable as mysqlTable9, varchar as varchar9, int as int9, decimal as decimal9, timestamp as timestamp9, text as text9 } from "drizzle-orm/mysql-core";
var cartItems;
var init_cartItems = __esm({
  "drizzle/schema/cartItems.ts"() {
    "use strict";
    init_cart();
    init_catalog();
    init_packages();
    cartItems = mysqlTable9("cart_items", {
      id: varchar9("id", { length: 255 }).primaryKey(),
      // ✅ VÍNCULO CORRIGIDO COM CARTS
      cartId: varchar9("cart_id", { length: 255 }).notNull().references(() => carts.id, { onDelete: "cascade" }),
      dishId: varchar9("dish_id", { length: 255 }).references(() => dishes.id),
      packageId: varchar9("package_id", { length: 255 }).references(() => packages.id),
      quantity: int9("quantity").notNull().default(1),
      unitPrice: decimal9("unit_price", { precision: 10, scale: 2 }).notNull(),
      name: varchar9("name", { length: 255 }),
      // Aumentado para 500 caracteres para evitar cortes em URLs longas
      imageUrl: varchar9("image_url", { length: 500 }),
      // 🚨 AS COLUNAS MÁGICAS PARA O JSON FUNCIONAR
      options: text9("options"),
      // Guarda: Acompanhamentos, Tamanho, Config do Kit
      appliedNutrition: text9("applied_nutrition"),
      // Guarda: Kcal, Proteínas, etc.
      // Mantido para legado/backup
      accompaniments: text9("accompaniments"),
      createdAt: timestamp9("created_at").defaultNow()
    });
  }
});

// drizzle/schema/media.ts
import { mysqlTable as mysqlTable10, varchar as varchar10, timestamp as timestamp10, bigint } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
var media;
var init_media = __esm({
  "drizzle/schema/media.ts"() {
    "use strict";
    media = mysqlTable10("media", {
      // ✅ CORREÇÃO: Mudado para serial (que é bigint auto_increment no MySQL)
      // Isso resolve o erro 2769 e faz o banco atualizar sozinho
      id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
      url: varchar10("url", { length: 512 }).notNull(),
      // ✅ Ajustado nomes para bater com a tabela que você enviou (media_library / media)
      originalFilename: varchar10("original_filename", { length: 255 }).notNull(),
      mimeType: varchar10("mime_type", { length: 50 }),
      // ✅ Importante para o delete físico funcionar
      filePath: varchar10("file_path", { length: 255 }).notNull(),
      createdAt: timestamp10("created_at").default(sql`CURRENT_TIMESTAMP`)
    });
  }
});

// drizzle/schema/auth_users.ts
import { mysqlTable as mysqlTable11, varchar as varchar11, timestamp as timestamp11 } from "drizzle-orm/mysql-core";
var authUsers;
var init_auth_users = __esm({
  "drizzle/schema/auth_users.ts"() {
    "use strict";
    authUsers = mysqlTable11("auth_users", {
      id: varchar11("id", { length: 255 }).primaryKey(),
      email: varchar11("email", { length: 255 }).notNull().unique(),
      password: varchar11("password", { length: 255 }).notNull(),
      role: varchar11("role", { length: 50 }).notNull().default("user"),
      /**
       * ✅ CAMPOS DE RESET (Agora tipados corretamente)
       */
      resetToken: varchar11("reset_token", { length: 255 }),
      resetExpires: timestamp11("reset_expires")
    });
  }
});

// drizzle/schema/sessions.ts
import { mysqlTable as mysqlTable12, varchar as varchar12, datetime } from "drizzle-orm/mysql-core";
var sessions;
var init_sessions = __esm({
  "drizzle/schema/sessions.ts"() {
    "use strict";
    init_auth_users();
    sessions = mysqlTable12("sessions", {
      /**
       * ✅ ID DA SESSÃO
       * O Lucia gera strings aleatórias longas para o ID da sessão.
       */
      id: varchar12("id", { length: 255 }).primaryKey(),
      /**
       * 🚩 AJUSTE CRÍTICO: user_id
       * Alterado para VARCHAR(255) para casar perfeitamente com authUsers.id.
       * Sem isso, o Lucia falha ao tentar criar uma sessão para um usuário recém-logado.
       */
      userId: varchar12("user_id", { length: 255 }).notNull().references(() => authUsers.id, { onDelete: "cascade" }),
      // Limpa sessões se o user for deletado
      /**
       * ✅ EXPIRAÇÃO
       * fsp: 3 garante precisão de milissegundos, recomendada pelo Lucia.
       */
      expiresAt: datetime("expires_at", { fsp: 3 }).notNull()
    });
  }
});

// drizzle/schema/shipping.ts
import { mysqlTable as mysqlTable13, varchar as varchar13, text as text10, decimal as decimal10, timestamp as timestamp12, boolean as boolean8, mysqlEnum as mysqlEnum4, json as json3 } from "drizzle-orm/mysql-core";
var shippingSettings, shippingRules, storeSettings;
var init_shipping = __esm({
  "drizzle/schema/shipping.ts"() {
    "use strict";
    shippingSettings = mysqlTable13("shipping_settings", {
      /**
       * Mantemos varchar(255) pois geralmente usamos um ID fixo como 'default'
       */
      id: varchar13("id", { length: 255 }).primaryKey(),
      pickupEnabled: boolean8("pickup_enabled").default(true),
      pickupLabel: varchar13("pickup_label", { length: 255 }).default("Retirada no Balc\xE3o"),
      pickupInstruction: varchar13("pickup_instruction", { length: 500 }),
      createdAt: timestamp12("created_at").defaultNow(),
      updatedAt: timestamp12("updated_at").defaultNow().onUpdateNow()
    });
    shippingRules = mysqlTable13("shipping_rules", {
      /**
       * ✅ AJUSTE CRÍTICO: 
       * Mudado de varchar para int + autoincrement para bater com o banco físico.
       * Isso remove a obrigatoriedade de passar o ID no .values() do Router.
       */
      id: varchar13("id", { length: 36 }).primaryKey(),
      name: varchar13("name", { length: 100 }).notNull(),
      /**
       * TIPO DE REGRA
       */
      type: mysqlEnum4("type", ["zipcode", "polygon"]).default("zipcode").notNull(),
      /**
       * LOGÍSTICA POR CEP
       */
      cepStart: varchar13("cep_start", { length: 8 }),
      cepEnd: varchar13("cep_end", { length: 8 }),
      /**
       * LOGÍSTICA POR MAPA
       */
      polygonCoords: json3("polygon_coords"),
      /**
       * PRECIFICAÇÃO E STATUS
       */
      price: decimal10("price", { precision: 10, scale: 2 }).default("0.00"),
      active: boolean8("active").default(true),
      createdAt: timestamp12("created_at").defaultNow(),
      updatedAt: timestamp12("updated_at").defaultNow().onUpdateNow()
    });
    storeSettings = mysqlTable13("store_settings", {
      /**
       * Mantemos varchar se você estiver usando um ID fixo 'default_store'
       */
      id: varchar13("id", { length: 255 }).primaryKey(),
      generalMinOrderAmount: decimal10("general_min_order_amount", { precision: 10, scale: 2 }).default("0.00"),
      minOrderMessage: text10("min_order_message"),
      emergencyMode: boolean8("emergency_mode").default(false),
      createdAt: timestamp12("created_at").defaultNow(),
      updatedAt: timestamp12("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/logs.ts
import { mysqlTable as mysqlTable14, varchar as varchar14, text as text11, timestamp as timestamp13, serial } from "drizzle-orm/mysql-core";
var auditLogs;
var init_logs = __esm({
  "drizzle/schema/logs.ts"() {
    "use strict";
    init_users();
    auditLogs = mysqlTable14("audit_logs", {
      // ✅ SERIAL define automaticamente: INT NOT NULL AUTO_INCREMENT PRIMARY KEY
      id: serial("id").primaryKey(),
      // Referência ao usuário (UUID do Clerk/Auth)
      userId: varchar14("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
      // Ação executada (Ex: "LOGIN", "UPDATE_PRODUCT")
      action: varchar14("action", { length: 100 }).notNull(),
      // Tabela e ID do registro afetado
      entity: varchar14("entity", { length: 100 }),
      entityId: varchar14("entity_id", { length: 255 }),
      // Valores em JSON (usamos text para compatibilidade ampla)
      oldValues: text11("old_values"),
      newValues: text11("new_values"),
      // Informações de rede
      ipAddress: varchar14("ip_address", { length: 45 }),
      userAgent: text11("user_agent"),
      createdAt: timestamp13("created_at").defaultNow().notNull()
    });
  }
});

// drizzle/schema/nutrition.ts
import { mysqlTable as mysqlTable15, varchar as varchar15, decimal as decimal11, int as int13, timestamp as timestamp14, text as text12 } from "drizzle-orm/mysql-core";
var ingredients, productIngredients;
var init_nutrition = __esm({
  "drizzle/schema/nutrition.ts"() {
    "use strict";
    init_catalog();
    ingredients = mysqlTable15("ingredients", {
      id: int13("id").primaryKey().autoincrement(),
      // ✅ Alterado para 'text' para evitar o erro de "Data too long" com a base TACO/TBCA
      name: text12("name").notNull(),
      // ✅ Categoria para organizar os itens (ex: Carnes, Frutas, Cereais, Leguminosas)
      category: varchar15("category", { length: 100 }),
      source: varchar15("source", { length: 50 }).default("Manual"),
      externalId: varchar15("external_id", { length: 50 }),
      yieldFactor: decimal11("yield_factor", { precision: 10, scale: 2 }).default("1.00"),
      // Macronutrientes (Baseados em 100g/ml)
      calories: decimal11("calories", { precision: 10, scale: 2 }).default("0.00"),
      energyKj: decimal11("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
      carbohydrates: decimal11("carbohydrates", { precision: 10, scale: 2 }).default("0.00"),
      // ✅ Açúcares de Adição (Obrigatório na nova rotulagem da Anvisa)
      addedSugars: decimal11("added_sugars", { precision: 10, scale: 2 }).default("0.00"),
      protein: decimal11("protein", { precision: 10, scale: 2 }).default("0.00"),
      fats: decimal11("fats", { precision: 10, scale: 2 }).default("0.00"),
      fatSaturated: decimal11("fat_saturated", { precision: 10, scale: 2 }).default("0.00"),
      fatTrans: decimal11("fat_trans", { precision: 10, scale: 2 }).default("0.00"),
      fiber: decimal11("fiber", { precision: 10, scale: 2 }).default("0.00"),
      sodium: decimal11("sodium", { precision: 10, scale: 2 }).default("0.00"),
      unit: varchar15("unit", { length: 20 }).default("g"),
      // Controle de auditoria
      updatedAt: timestamp14("updated_at").defaultNow().onUpdateNow()
    });
    productIngredients = mysqlTable15("product_ingredients", {
      id: int13("id").primaryKey().autoincrement(),
      // Referência ao prato em catalog.ts
      productId: int13("product_id").notNull().references(() => dishes.id, { onDelete: "cascade" }),
      // Referência ao insumo nesta tabela
      ingredientId: int13("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
      // Quantidade líquida usada no prato (ex: 0.150 para 150g)
      quantity: decimal11("quantity", { precision: 10, scale: 3 }).notNull()
    });
  }
});

// drizzle/schema/appconfig.ts
import { mysqlTable as mysqlTable16, varchar as varchar16, longtext, timestamp as timestamp15 } from "drizzle-orm/mysql-core";
var appConfigs;
var init_appconfig = __esm({
  "drizzle/schema/appconfig.ts"() {
    "use strict";
    appConfigs = mysqlTable16("app_configs", {
      // Chave identificadora (ex: 'accessibility_high_contrast', 'zebra_layout_default')
      configKey: varchar16("config_key", { length: 100 }).primaryKey(),
      // Conteúdo da configuração (Pode ser 'true', '1.25', ou JSON)
      configValue: longtext("config_value").notNull(),
      // Controle de versão temporal
      updatedAt: timestamp15("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/showcase.ts
import { mysqlTable as mysqlTable17, varchar as varchar17, int as int14, timestamp as timestamp16, boolean as boolean9 } from "drizzle-orm/mysql-core";
var showcases;
var init_showcase = __esm({
  "drizzle/schema/showcase.ts"() {
    "use strict";
    showcases = mysqlTable17("showcases", {
      id: int14("id").primaryKey().autoincrement(),
      title: varchar17("title", { length: 255 }).notNull(),
      description: varchar17("description", { length: 500 }),
      active: boolean9("active").default(true),
      order: int14("order").default(0),
      // Para ordenar qual vitrine aparece primeiro
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/index.ts
var init_schema = __esm({
  "drizzle/schema/index.ts"() {
    "use strict";
    init_users();
    init_catalog();
    init_orders();
    init_marketing();
    init_packages();
    init_config();
    init_cart();
    init_cartItems();
    init_media();
    init_sessions();
    init_auth_users();
    init_shipping();
    init_loyalty();
    init_logs();
    init_nutrition();
    init_appconfig();
    init_showcase();
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accompanimentCategories: () => accompanimentCategories,
  accompanimentCategoriesRelations: () => accompanimentCategoriesRelations,
  accompanimentGroups: () => accompanimentGroups,
  accompanimentGroupsRelations: () => accompanimentGroupsRelations,
  accompanimentGroupsWithItemsRelations: () => accompanimentGroupsWithItemsRelations,
  accompanimentOptions: () => accompanimentOptions,
  accompanimentOptionsRelations: () => accompanimentOptionsRelations,
  accompanimentOptionsWithCategoryRelations: () => accompanimentOptionsWithCategoryRelations,
  appConfigs: () => appConfigs,
  auditLogs: () => auditLogs,
  authUsers: () => authUsers,
  cartItems: () => cartItems,
  carts: () => carts,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  couponRelations: () => couponRelations,
  couponUsage: () => couponUsage,
  couponUsageRelations: () => couponUsageRelations,
  coupons: () => coupons,
  discountRules: () => discountRules,
  dishSizes: () => dishSizes,
  dishSizesRelations: () => dishSizesRelations,
  dishes: () => dishes,
  dishesRelations: () => dishesRelations,
  foodCardBrands: () => foodCardBrands,
  ingredients: () => ingredients,
  loyaltyHistory: () => loyaltyHistory,
  loyaltyHistoryRelations: () => loyaltyHistoryRelations,
  loyaltySettings: () => loyaltySettings,
  media: () => media,
  mediaLibrary: () => mediaLibrary,
  mediaLibraryRelations: () => mediaLibraryRelations,
  orderItems: () => orderItems,
  orderItemsRelations: () => orderItemsRelations,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  packageOptionDishes: () => packageOptionDishes,
  packageOptionDishesRelations: () => packageOptionDishesRelations,
  packageOptionGroups: () => packageOptionGroups,
  packageOptionGroupsRelations: () => packageOptionGroupsRelations,
  packageOptions: () => packageOptions,
  packageOptionsRelations: () => packageOptionsRelations,
  packageRelations: () => packageRelations,
  packages: () => packages,
  paymentMethodRelations: () => paymentMethodRelations,
  paymentMethods: () => paymentMethods,
  productIngredients: () => productIngredients,
  sessions: () => sessions,
  shippingRules: () => shippingRules,
  shippingSettings: () => shippingSettings,
  showcases: () => showcases,
  siteTheme: () => siteTheme,
  sizeAccompanimentGroupRelations: () => sizeAccompanimentGroupRelations,
  sizeAccompanimentGroups: () => sizeAccompanimentGroups,
  storeSettings: () => storeSettings,
  userAddresses: () => userAddresses,
  userAddressesRelations: () => userAddressesRelations,
  userProfilesRelations: () => userProfilesRelations,
  user_profiles: () => user_profiles,
  users: () => users,
  usersRelations: () => usersRelations
});
var init_schema2 = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    init_schema();
  }
});

// server/db.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
async function getDb() {
  if (dbInstance) return dbInstance;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL n\xE3o encontrada no .env");
  }
  try {
    if (!pool) {
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 6e4,
        queueLimit: 0
      });
    }
    dbInstance = drizzle(pool, { schema: schema_exports, mode: "default" });
    console.log("\u2705 Database Pool Initialized (MySQL)");
    return dbInstance;
  } catch (error) {
    console.error("\u274C Falha ao conectar no banco de dados:", error);
    throw error;
  }
}
var dbInstance, pool;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema2();
    init_schema2();
  }
});

// server/routers/lib/mailer.ts
var mailer_exports = {};
__export(mailer_exports, {
  mailer: () => mailer
});
import nodemailer from "nodemailer";
var mailer;
var init_mailer = __esm({
  "server/routers/lib/mailer.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_encryption();
    mailer = {
      /**
       * 📡 Substitui variáveis {{tag}} e injeta no Master Layout
       */
      parseTemplate(contentHtml, variables, masterLayout) {
        let finalHtml = masterLayout && masterLayout.includes("{{content}}") ? masterLayout.replace("{{content}}", contentHtml) : contentHtml;
        Object.entries(variables).forEach(([key, value]) => {
          finalHtml = finalHtml.replace(new RegExp(`{{${key}}}`, "g"), value);
        });
        return finalHtml;
      },
      /**
       * 📡 Configura o transporte dinamicamente via Banco de Dados
       */
      async getTransport() {
        const db2 = await getDb();
        const configs = await db2.select().from(appConfigs);
        const getVal = (key) => configs.find((c) => c.configKey === key)?.configValue;
        const host = getVal("smtp_host") || "127.0.0.1";
        const port = Number(getVal("smtp_port")) || 1025;
        const user = getVal("smtp_user") || "";
        const passRaw = getVal("smtp_pass") || "";
        let pass = "";
        if (passRaw && passRaw.includes(":")) {
          try {
            pass = decrypt(passRaw) || "";
          } catch (e) {
            pass = passRaw;
          }
        } else {
          pass = passRaw;
        }
        const transportOptions = {
          host,
          port,
          secure: port === 465,
          auth: user ? { user: String(user), pass: String(pass) } : void 0,
          tls: { rejectUnauthorized: false }
        };
        return {
          transporter: nodemailer.createTransport(transportOptions),
          from: user || "sistema@gourmet.local",
          configs
        };
      },
      /**
       * 📧 E-MAIL DE BEM-VINDO (Novo método adicionado para corrigir erro no Auth)
       */
      async sendWelcomeEmail(to, name) {
        try {
          const { transporter, from, configs } = await this.getTransport();
          const getVal = (key) => configs.find((c) => c.configKey === key)?.configValue;
          const masterLayout = getVal("email_master_layout");
          const subjectTemplate = getVal("email_welcome_subject") || "Bem-vindo \xE0 Gourmet Saud\xE1vel, {{name}}!";
          const bodyTemplate = getVal("email_welcome_body") || `
        <div style="font-family: sans-serif; color: #334155;">
          <h2 style="color: #059669;">Seja muito bem-vindo(a), {{name}}!</h2>
          <p>Estamos muito felizes em ter voc\xEA conosco. Sua conta foi criada com sucesso e voc\xEA j\xE1 pode realizar seus pedidos de marmitas saud\xE1veis.</p>
          <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
             <strong>Dica:</strong> Explore nosso card\xE1pio semanal para encontrar pratos frescos e balanceados!
          </div>
          <p style="margin-top: 30px;">Atenciosamente,<br>Equipe Gourmet Saud\xE1vel</p>
        </div>
      `;
          const variables = { name };
          await transporter.sendMail({
            from: `"Gourmet Saud\xE1vel" <${from}>`,
            to,
            subject: this.parseTemplate(subjectTemplate, variables),
            html: this.parseTemplate(bodyTemplate, variables, masterLayout)
          });
          return { success: true };
        } catch (err) {
          console.error("\u274C Erro Mailer (Welcome):", err);
          throw err;
        }
      },
      /**
       * 📧 CONFIRMAÇÃO DE PEDIDO
       */
      async sendOrderConfirmation(to, order) {
        try {
          const { transporter, from, configs } = await this.getTransport();
          const getVal = (key) => configs.find((c) => c.configKey === key)?.configValue;
          const masterLayout = getVal("email_master_layout");
          const subjectTemplate = getVal("email_order_subject") || "Pedido Confirmado! #{{orderId}}";
          const bodyTemplate = getVal("email_order_body") || `
        <div style="font-family: sans-serif; color: #334155;">
          <h2 style="color: #059669;">Ol\xE1 {{customerName}}, recebemos seu pedido!</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top:0; font-size: 16px; color: #0f172a;">\u{1F4E6} Itens do Pedido #{{orderId}}</h3>
            {{itemsHtml}}
          </div>
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px; background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 14px; text-transform: uppercase;">\u{1F4CD} Endere\xE7o de Entrega</h4>
              <p style="margin: 0; font-size: 13px; line-height: 1.5;">{{addressHtml}}</p>
            </div>
            <div style="flex: 1; min-width: 250px; background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 14px; text-transform: uppercase;">\u{1F4B0} Resumo Financeiro</h4>
              <table style="width: 100%; font-size: 13px;">
                <tr><td>Subtotal:</td><td style="text-align: right;">{{subtotal}}</td></tr>
                <tr><td>Frete:</td><td style="text-align: right;">{{shipping}}</td></tr>
                <tr style="color: #ef4444;"><td>Descontos:</td><td style="text-align: right;">- {{discount}}</td></tr>
                <tr style="font-weight: bold; font-size: 15px; color: #0f172a;">
                  <td style="padding-top: 8px;">Total:</td>
                  <td style="padding-top: 8px; text-align: right;">{{total}}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `;
          const itemsHtml = `
        <table style="width: 100%; border-collapse: collapse;">
          ${order.items.map((item) => `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${item.name}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.4;">${item.details}</div>
              </td>
            </tr>
          `).join("")}
        </table>
      `;
          const variables = {
            customerName: order.customerName,
            orderId: order.id,
            itemsHtml,
            addressHtml: order.address || "Retirada no Local",
            subtotal: order.financials?.subtotal || "R$ 0,00",
            shipping: order.financials?.shipping || "R$ 0,00",
            discount: order.financials?.discount || "R$ 0,00",
            total: order.financials?.total || "R$ 0,00"
          };
          await transporter.sendMail({
            from: `"Gourmet Saud\xE1vel" <${from}>`,
            to,
            subject: this.parseTemplate(subjectTemplate, variables),
            html: this.parseTemplate(bodyTemplate, variables, masterLayout)
          });
          return { success: true };
        } catch (err) {
          console.error("\u274C Erro Mailer (Pedido):", err);
          throw err;
        }
      },
      /**
       * 📧 RECUPERAÇÃO DE SENHA
       */
      async sendPasswordReset(to, name, resetLink) {
        try {
          const { transporter, from, configs } = await this.getTransport();
          const getVal = (key) => configs.find((c) => c.configKey === key)?.configValue;
          const masterLayout = getVal("email_master_layout");
          const subjectTemplate = getVal("email_reset_subject") || "Recupera\xE7\xE3o de Senha - Gourmet Saud\xE1vel";
          const bodyTemplate = getVal("email_reset_body") || `
        <div style="font-family: sans-serif;">
          <h2>Recuperar Senha</h2>
          <p>Ol\xE1 {{name}}, recebemos uma solicita\xE7\xE3o para redefinir sua senha.</p>
          <p>Clique no bot\xE3o abaixo para prosseguir:</p>
          <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Alterar Minha Senha</a>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Se voc\xEA n\xE3o solicitou esta altera\xE7\xE3o, ignore este e-mail.</p>
        </div>
      `;
          const variables = { name, resetLink };
          const finalHtml = this.parseTemplate(bodyTemplate, variables, masterLayout);
          await transporter.sendMail({
            from: `"Seguran\xE7a Gourmet" <${from}>`,
            to,
            subject: this.parseTemplate(subjectTemplate, variables),
            html: finalHtml
          });
          return { success: true };
        } catch (err) {
          console.error("\u274C Erro Mailer (Reset):", err);
          throw err;
        }
      }
    };
  }
});

// server/_core/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as trpcExpress from "@trpc/server/adapters/express";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
var t = initTRPC.context().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    };
  }
});
var router = t.router;
var mergeRouters = t.mergeRouters;
var middleware = t.middleware;
var publicProcedure = t.procedure;
var trackedPublicProcedure = t.procedure;
var isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sess\xE3o expirada ou n\xE3o autenticada."
    });
  }
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session
    }
  });
});
var isAdminMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    console.warn(`[\u{1F6E1}\uFE0F SEGURAN\xC7A] Acesso Admin negado para: ${ctx.user?.email || "An\xF4nimo"}`);
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a administradores."
    });
  }
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
      isAdmin: true
    }
  });
});
var protectedProcedure = t.procedure.use(isAuthed);
var adminProcedure = t.procedure.use(isAdminMiddleware);

// server/routers/admin/analytics.ts
init_db();
init_schema();
import { z } from "zod";
import { sql as sql2, gte } from "drizzle-orm";
import { TRPCError as TRPCError2 } from "@trpc/server";
var adminAnalyticsRouter = router({
  getStats: adminProcedure.input(
    z.object({
      days: z.number().default(1)
    }).nullish()
    // Aceita nulo ou indefinido
  ).query(async ({ input }) => {
    try {
      const db2 = await getDb();
      if (!db2) {
        throw new TRPCError2({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha na conex\xE3o com o banco de dados."
        });
      }
      const days = input?.days ?? 1;
      const dateLimit = /* @__PURE__ */ new Date();
      dateLimit.setDate(dateLimit.getDate() - days);
      const [orderStats] = await db2.select({
        count: sql2`count(${orders.id})`,
        revenue: sql2`sum(${orders.total})`
      }).from(orders).where(gte(orders.createdAt, dateLimit));
      const [customerCount] = await db2.select({ value: sql2`count(${users.id})` }).from(users);
      const businessData = {
        ordersToday: Number(orderStats?.count || 0),
        revenueToday: Number(orderStats?.revenue || 0),
        activeCustomers: Number(customerCount?.value || 0)
      };
      const postHogData = await fetchPostHogInsight("insight_id_do_funil");
      return {
        ...businessData,
        abandonmentRate: postHogData?.results?.[0]?.rate || 0,
        conversionTrend: [10, 15, 8, 12, 18, 14, 20]
        // Mock de tendência
      };
    } catch (error) {
      console.error("\u274C [ANALYTICS ERROR]:", error);
      throw new TRPCError2({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao processar estat\xEDsticas de vendas."
      });
    }
  })
});
async function fetchPostHogInsight(insightId) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId || insightId === "insight_id_do_funil") return null;
  try {
    const url = `https://app.posthog.com/api/projects/${projectId}/insights/${insightId}/`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// server/routers/admin/logs.ts
init_db();
init_schema();
init_encryption();
import { z as z2 } from "zod";
import { desc, eq as eq2 } from "drizzle-orm";
import { TRPCError as TRPCError3 } from "@trpc/server";
function unseal(val) {
  if (!val) return "";
  try {
    const str = String(val);
    if (str.split(":").length !== 3) return str;
    return decrypt(str) || str;
  } catch {
    return String(val);
  }
}
var adminLogsRouter = router({
  list: adminProcedure.input(z2.object({
    limit: z2.number().min(1).max(100).default(50),
    offset: z2.number().default(0)
  })).query(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indispon\xEDvel." });
    try {
      const rows = await db2.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        // Vem encriptado do banco
        userEmail: users.email,
        // Geralmente público, mas trataremos por segurança
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues
      }).from(auditLogs).leftJoin(users, eq2(auditLogs.userId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(input.limit).offset(input.offset);
      return rows.map((row) => {
        const parseLogValues = (val) => {
          if (!val) return null;
          if (typeof val === "object" && !Buffer.isBuffer(val)) return val;
          try {
            const str = Buffer.isBuffer(val) ? val.toString("utf8") : String(val);
            return JSON.parse(str);
          } catch {
            return { info: "Dados em formato incompat\xEDvel" };
          }
        };
        return {
          id: row.id,
          action: row.action,
          entity: row.entity,
          entityId: row.entityId,
          ipAddress: row.ipAddress || "Interno",
          oldValues: parseLogValues(row.oldValues),
          newValues: parseLogValues(row.newValues),
          // ✅ APLICAÇÃO DO UNSEAL: Descriptografa o nome do admin/usuário
          user: row.userName ? { name: unseal(row.userName), email: row.userEmail } : { name: "Sistema", email: "Autom\xE1tico" },
          createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : (/* @__PURE__ */ new Date()).toISOString()
        };
      });
    } catch (error) {
      console.error("\u274C [LOGS ERROR]:", error.message);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao carregar trilha de auditoria."
      });
    }
  })
});

// server/routers/admin/media.ts
import { z as z3 } from "zod";
init_db();
init_schema();
import { desc as desc2, eq as eq3 } from "drizzle-orm";
import { TRPCError as TRPCError4 } from "@trpc/server";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var UPLOADS_DIR = path.resolve(__dirname, "../../../public/uploads");
var adminMediaRouter = router({
  // --- UPLOAD COM PROCESSAMENTO (SHARP) ---
  upload: adminProcedure.input(z3.object({
    filename: z3.string(),
    mimeType: z3.string(),
    base64Data: z3.string()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "BD Offline" });
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      const buffer = Buffer.from(input.base64Data, "base64");
      const uniqueName = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const filePath = path.join(UPLOADS_DIR, uniqueName);
      await sharp(buffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(filePath);
      const fileUrl = `/uploads/${uniqueName}`;
      await db2.insert(media).values({
        url: fileUrl,
        originalFilename: input.filename,
        mimeType: "image/webp",
        filePath
      });
      return { success: true, url: fileUrl };
    } catch (error) {
      console.error("\u274C [MEDIA UPLOAD ERROR]:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: `Falha ao processar imagem: ${error.message}`
      });
    }
  }),
  // --- LISTAGEM ---
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(media).orderBy(desc2(media.id));
  }),
  // --- DELEÇÃO FÍSICA E LÓGICA ---
  delete: adminProcedure.input(z3.object({ id: z3.union([z3.string(), z3.number()]) })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const id = isNaN(Number(input.id)) ? input.id : Number(input.id);
    try {
      const [item] = await db2.select().from(media).where(eq3(media.id, id));
      if (item) {
        if (item.filePath) {
          try {
            await fs.unlink(item.filePath);
          } catch (e) {
            console.warn(`\u26A0\uFE0F Arquivo ${item.filePath} n\xE3o encontrado no disco.`);
          }
        }
        await db2.delete(media).where(eq3(media.id, id));
      }
      return { success: true };
    } catch (error) {
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao excluir m\xEDdia do servidor."
      });
    }
  })
});

// server/routers/admin/discount-rules.ts
import { z as z5 } from "zod";

// server/discountRules.ts
init_db();
init_schema2();
import { eq as eq4, desc as desc3 } from "drizzle-orm";
import { z as z4 } from "zod";
var discountRuleInput = z4.object({
  // ✅ Agora forçamos o ID a ser um número (ou convertido para número)
  id: z4.coerce.number().optional(),
  name: z4.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  description: z4.string().max(512).optional().nullable(),
  minQuantity: z4.coerce.number().min(1),
  maxQuantity: z4.coerce.number().optional().nullable(),
  discountType: z4.enum(["percentage", "fixed"]),
  discount_value: z4.coerce.number().min(0),
  priority: z4.coerce.number().optional().nullable(),
  isActive: z4.boolean().optional().default(true)
});
async function listDiscountRules() {
  const db2 = await getDb();
  if (!db2) throw new Error("Banco de dados n\xE3o inicializado");
  try {
    const rules = await db2.select().from(discountRules).orderBy(desc3(discountRules.id));
    return rules.map((rule) => ({
      ...rule,
      // ✅ Mantemos como número internamente
      id: Number(rule.id),
      minQuantity: Number(rule.minQuantity),
      discount_value: Number(rule.discount_value),
      isActive: Boolean(rule.isActive)
    }));
  } catch (error) {
    console.error("\u274C ERRO AO LISTAR:", error.message);
    return [];
  }
}
async function createDiscountRule(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  try {
    await db2.insert(discountRules).values({
      name: data.name,
      description: data.description ?? null,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity ?? null,
      discountType: data.discountType,
      discount_value: data.discount_value.toString(),
      priority: data.priority ?? 0,
      isActive: data.isActive
    });
    return { success: true };
  } catch (error) {
    console.error("\u274C ERRO NO INSERT:", error.message);
    throw error;
  }
}
async function updateDiscountRule(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  try {
    await db2.update(discountRules).set({
      name: data.name,
      description: data.description ?? null,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity ?? null,
      discountType: data.discountType,
      discount_value: data.discount_value.toString(),
      priority: data.priority ?? 0,
      isActive: data.isActive,
      updated_at: /* @__PURE__ */ new Date()
    }).where(eq4(discountRules.id, id));
    return { success: true };
  } catch (error) {
    console.error("\u274C ERRO NO UPDATE:", error.message);
    throw error;
  }
}
async function deleteDiscountRule(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  try {
    await db2.delete(discountRules).where(eq4(discountRules.id, id));
    return { success: true };
  } catch (error) {
    console.error("\u274C ERRO AO DELETAR:", error.message);
    throw error;
  }
}

// server/routers/admin/discount-rules.ts
var adminDiscountRulesRouter = router({
  // 1) Listar todas as regras
  list: adminProcedure.query(async () => {
    return await listDiscountRules();
  }),
  // 2) Criar nova regra
  create: adminProcedure.input(discountRuleInput).mutation(async ({ input }) => {
    return await createDiscountRule(input);
  }),
  // 3) Atualizar regra existente
  update: adminProcedure.input(
    discountRuleInput.extend({
      // Garante que o ID seja tratado como número para o MySQL INT
      id: z5.coerce.number()
    })
  ).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return await updateDiscountRule(id, data);
  }),
  // 4) Deletar regra
  delete: adminProcedure.input(z5.object({
    id: z5.coerce.number()
  })).mutation(async ({ input }) => {
    return await deleteDiscountRule(input.id);
  })
});

// server/routers/admin/loyalty.ts
import { z as z6 } from "zod";

// server/admin-loyalty.ts
init_db();
init_schema();
import { eq as eq5, desc as desc4, like, or, count, and, sql as sql3 } from "drizzle-orm";
import crypto3 from "crypto";
async function getLoyaltyConfigs() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  let settings = await db2.select().from(loyaltySettings).limit(1);
  if (settings.length === 0) {
    await db2.insert(loyaltySettings).values({
      id: "1",
      enabled: true,
      conversionRatePoints: 1,
      conversionRateMoney: "1.00",
      redemptionRatePoints: 100,
      redemptionRateMoney: "1.00",
      maxDiscountAmount: "50.00",
      minCartAmount: "0.00",
      pointsExpirationDays: 365,
      pointsPerSignup: 100,
      pointsPerReview: 10
    });
    settings = await db2.select().from(loyaltySettings).limit(1);
  }
  const config = settings[0];
  return {
    ...config,
    id: String(config.id),
    enabled: Boolean(config.enabled),
    conversionRateMoney: Number(config.conversionRateMoney),
    redemptionRateMoney: Number(config.redemptionRateMoney),
    maxDiscountAmount: Number(config.maxDiscountAmount),
    minCartAmount: Number(config.minCartAmount)
  };
}
async function updateLoyaltyConfigs(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.enabled !== void 0) updateData.enabled = data.enabled;
  if (data.conversionRatePoints !== void 0) updateData.conversionRatePoints = Number(data.conversionRatePoints);
  if (data.conversionRateMoney !== void 0) updateData.conversionRateMoney = String(data.conversionRateMoney);
  if (data.redemptionRatePoints !== void 0) updateData.redemptionRatePoints = Number(data.redemptionRatePoints);
  if (data.redemptionRateMoney !== void 0) updateData.redemptionRateMoney = String(data.redemptionRateMoney);
  if (data.maxDiscountAmount !== void 0) updateData.maxDiscountAmount = String(data.maxDiscountAmount);
  if (data.minCartAmount !== void 0) updateData.minCartAmount = String(data.minCartAmount);
  if (data.pointsExpirationDays !== void 0) updateData.pointsExpirationDays = data.pointsExpirationDays;
  if (data.pointsPerSignup !== void 0) updateData.pointsPerSignup = data.pointsPerSignup;
  if (data.pointsPerReview !== void 0) updateData.pointsPerReview = data.pointsPerReview;
  await db2.update(loyaltySettings).set(updateData).where(eq5(loyaltySettings.id, "1"));
  return { success: true };
}
async function getCustomersLoyalty(params) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const offset = (params.page - 1) * params.limit;
  const conditions = [];
  if (params.search && params.search.trim() !== "" && params.search !== "undefined") {
    const term = `%${params.search}%`;
    conditions.push(or(like(users.email, term), like(users.name, term)));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  try {
    const dataQuery = await db2.select({
      id: users.id,
      name: users.name,
      email: users.email,
      loyaltyBalance: users.loyaltyBalance,
      // SOMA CONDICIONAL: Soma apenas se o status for 'completed'
      // Usa o truque '+ 0' e REPLACE para limpar as aspas do banco
      spent_total: sql3`
          COALESCE(SUM(
            CASE 
              WHEN ${orders.status} = 'completed' 
              THEN REPLACE(${orders.total}, '"', '') + 0 
              ELSE 0 
            END
          ), 0)
        `.as("spent_total")
    }).from(users).leftJoin(orders, eq5(orders.userId, users.id)).where(whereClause).groupBy(users.id).orderBy(desc4(users.loyaltyBalance)).limit(params.limit).offset(offset);
    const [totalResult] = await db2.select({ value: count() }).from(users).where(whereClause);
    return {
      items: dataQuery.map((i) => ({
        id: i.id,
        name: i.name,
        email: i.email,
        // Normalização final para o Frontend
        points: Number(i.loyaltyBalance || 0),
        totalSpent: Number(i.spent_total || 0)
      })),
      total: Number(totalResult?.value || 0),
      totalPages: Math.ceil(Number(totalResult?.value || 0) / params.limit)
    };
  } catch (err) {
    console.error("\u274C Erro fatal no SQL de fidelidade:", err);
    throw err;
  }
}
async function getCustomerHistory(userId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const history = await db2.select().from(loyaltyHistory).where(eq5(loyaltyHistory.userId, userId)).orderBy(desc4(loyaltyHistory.createdAt));
  return history.map((item) => ({
    ...item,
    id: String(item.id),
    userId: String(item.userId),
    points: Number(item.pointsChange)
  }));
}
async function addManualPoints(userId, points, reason) {
  const db2 = await getDb();
  if (!db2) throw new Error("Banco de dados n\xE3o dispon\xEDvel");
  const type = points > 0 ? "earned" : "burned";
  try {
    await db2.insert(loyaltyHistory).values({
      id: crypto3.randomUUID(),
      userId,
      pointsChange: points,
      type,
      reason,
      description: reason,
      createdAt: /* @__PURE__ */ new Date()
    });
    await db2.execute(sql3`
            UPDATE users 
            SET loyalty_balance = loyalty_balance + ${points} 
            WHERE id = ${userId}
        `);
    return { success: true };
  } catch (error) {
    console.error("\u274C Erro SQL ao inserir pontos:", error);
    throw new Error("Falha ao gravar ajuste manual no banco.");
  }
}

// server/routers/admin/loyalty.ts
import { createDecipheriv as createDecipheriv2, scryptSync as scryptSync2 } from "crypto";

// server/db/lib/audit.ts
init_db();
init_schema();
async function logAction(ctx, action, entity, details) {
  const db2 = await getDb();
  if (!db2) return;
  try {
    const agora = /* @__PURE__ */ new Date();
    agora.setHours(agora.getHours() - 3);
    const logData = {
      action,
      entity,
      entityId: details.entityId ? String(details.entityId) : "global",
      userId: ctx.userId || ctx.user?.id || null,
      // ✅ MELHORIA NOS DETALHES: 
      // Se enviarmos 'old' e 'new', o log fica completo
      oldValues: details.old ? JSON.stringify(details.old) : null,
      newValues: details.new ? JSON.stringify(details.new) : null,
      ipAddress: ctx.ip || "127.0.0.1",
      userAgent: ctx.userAgent || "Sistema",
      createdAt: agora
      // Usa a data corrigida
    };
    await db2.insert(auditLogs).values(logData);
    console.log(`\u{1F6E1}\uFE0F Log Auditado: ${action} | Criado em: ${agora.toLocaleString()}`);
  } catch (e) {
    console.error("\u274C Erro ao gravar auditoria:", e);
  }
}

// server/routers/admin/loyalty.ts
var ENCRYPTION_KEY_RAW = process.env.DB_ENCRYPTION_KEY || "fallback-key-de-seguranca";
var ALGORITHM2 = "aes-256-gcm";
function decryptManual(text13) {
  if (!text13 || !text13.includes(":")) return text13 || null;
  try {
    const [ivHex, authTagHex, encryptedHex] = text13.split(":");
    const key = scryptSync2(ENCRYPTION_KEY_RAW, "static-salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv2(ALGORITHM2, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return "Erro na descriptografia";
  }
}
var adminLoyaltySettingsRouter = router({
  // ✅ BUSCA CONFIGURAÇÕES GLOBAIS (Regras do Clube)
  get: adminProcedure.query(async () => {
    return await getLoyaltyConfigs();
  }),
  // ✅ BUSCA LISTAGEM DE CLIENTES (Saldos e Gastos Reais)
  getCustomers: adminProcedure.input(z6.object({
    page: z6.number().default(1),
    limit: z6.number().default(10),
    search: z6.string().nullish()
  }).optional()).query(async ({ input }) => {
    const result = await getCustomersLoyalty({
      page: input?.page ?? 1,
      limit: input?.limit ?? 10,
      search: input?.search || void 0
    });
    return {
      ...result,
      items: result.items.map((c) => ({
        ...c,
        id: String(c.id),
        name: decryptManual(c.name) || c.email || "Cliente s/ Nome",
        // Já mapeado como 'points' e 'totalSpent' na lógica
        points: c.points,
        totalSpent: c.totalSpent
      }))
    };
  }),
  // ✅ AJUSTE MANUAL DE PONTOS
  addManualPoints: adminProcedure.input(z6.object({
    userId: z6.string(),
    points: z6.coerce.number(),
    reason: z6.string().min(1, "O motivo \xE9 obrigat\xF3rio")
  })).mutation(async ({ ctx, input }) => {
    const result = await addManualPoints(input.userId, input.points, input.reason);
    await logAction(ctx, "LOYALTY_MANUAL_ADJUST", "loyalty", {
      entityId: input.userId,
      new: { pontos: input.points, motivo: input.reason }
    });
    return result;
  }),
  // ✅ ATUALIZAR REGRAS DE PONTUAÇÃO E RESGATE
  update: adminProcedure.input(z6.any()).mutation(async ({ ctx, input }) => {
    const oldConfigs = await getLoyaltyConfigs();
    const result = await updateLoyaltyConfigs(input);
    await logAction(ctx, "UPDATE_LOYALTY_RULES", "loyalty", {
      entityId: "global_configs",
      old: oldConfigs,
      new: input
    });
    return result;
  }),
  // ✅ HISTÓRICO INDIVIDUAL (EXTRATO)
  getCustomerHistory: adminProcedure.input(z6.object({ userId: z6.string() })).query(async ({ input }) => {
    const history = await getCustomerHistory(input.userId);
    return history.map((h) => ({
      ...h,
      id: String(h.id),
      // Normaliza o campo points para o extrato
      points: Number(h.points || h.pointsChange || 0)
    }));
  })
});

// server/routers/admin/marketing.ts
import { z as z7 } from "zod";

// server/storeSettings.ts
init_db();
init_schema();
import { eq as eq6, sql as sql4 } from "drizzle-orm";
async function getStoreSettings() {
  const db2 = await getDb();
  if (!db2) throw new Error("Banco de dados n\xE3o dispon\xEDvel");
  const [rows] = await db2.execute(sql4`SELECT * FROM store_settings WHERE id = '1' LIMIT 1`);
  if (!rows || rows.length === 0) {
    await db2.insert(storeSettings).values({
      id: "1",
      generalMinOrderAmount: "0.00",
      minOrderMessage: null,
      emergencyMode: false
    });
    return { id: "1", generalMinOrderAmount: 0, minOrderMessage: null, emergencyMode: false };
  }
  const s = rows[0];
  s;
  const isEmergency = Boolean(
    s.emergencyMode === 1 || s.emergencyMode === true || s.emergency_mode === 1 || s.emergency_mode === true
  );
  const rawAmount = s.generalMinOrderAmount ?? s.general_min_order_amount;
  const minOrderAmount = Number(rawAmount || 0);
  const rawMsg = s.minOrderMessage ?? s.min_order_message;
  const minOrderMsg = rawMsg ? String(rawMsg) : "";
  return {
    id: String(s.id),
    generalMinOrderAmount: minOrderAmount,
    minOrderMessage: minOrderMsg,
    // Agora garantimos que vai uma string
    emergencyMode: isEmergency
  };
}
async function updateStoreSettings(data) {
  const db2 = await getDb();
  const updateData = { updated_at: /* @__PURE__ */ new Date() };
  if (data.generalMinOrderAmount !== void 0) {
    updateData.generalMinOrderAmount = String(data.generalMinOrderAmount);
  }
  if (data.minOrderMessage !== void 0) {
    updateData.minOrderMessage = data.minOrderMessage;
  }
  if (typeof data.emergencyMode !== "undefined") {
    updateData.emergencyMode = data.emergencyMode;
  }
  await db2.update(storeSettings).set(updateData).where(eq6(storeSettings.id, "1"));
  return { success: true };
}

// server/routers/admin/marketing.ts
import { TRPCError as TRPCError5 } from "@trpc/server";
var adminMarketingRouter = router({
  // Busca as regras de venda (Pedido Mínimo, etc)
  getRules: adminProcedure.query(async () => {
    try {
      const settings = await getStoreSettings();
      return {
        generalMinOrderAmount: Number(settings.generalMinOrderAmount || 0),
        minOrderMessage: settings.minOrderMessage || ""
      };
    } catch (error) {
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar regras de venda."
      });
    }
  }),
  // Atualiza as regras com Auditoria Integrada
  updateRules: adminProcedure.input(z7.object({
    // Coerce garante a conversão de String -> Number antes de salvar
    generalMinOrderAmount: z7.coerce.number().min(0),
    minOrderMessage: z7.string().min(1, "A mensagem \xE9 obrigat\xF3ria")
  })).mutation(async ({ ctx, input }) => {
    try {
      const oldSettings = await getStoreSettings();
      const result = await updateStoreSettings(input);
      await logAction(ctx, "UPDATE_MARKETING_RULES", "store_settings", {
        entityId: "global",
        old: {
          minAmount: oldSettings.generalMinOrderAmount,
          message: oldSettings.minOrderMessage
        },
        new: input
      });
      return result;
    } catch (error) {
      console.error("\u274C [MARKETING ERROR]:", error);
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao salvar e auditar novas regras."
      });
    }
  })
});

// server/routers/admin/finance.ts
import { z as z8 } from "zod";

// server/coupon.ts
init_db();
init_schema2();
import { eq as eq7, sql as sql5, desc as desc5 } from "drizzle-orm";
async function listCoupons() {
  const db2 = await getDb();
  const results = await db2.select({
    id: coupons.id,
    code: coupons.code,
    description: coupons.description,
    discountType: coupons.discountType,
    discountValue: coupons.discountValue,
    minOrderValue: coupons.minOrderValue,
    maxDiscount: coupons.maxDiscount,
    usageLimit: coupons.usageLimit,
    validFrom: coupons.validFrom,
    validUntil: coupons.validUntil,
    isActive: coupons.isActive,
    // Contagem de usos via leftJoin
    timesUsed: sql5`count(${couponUsage.id})`
  }).from(coupons).leftJoin(couponUsage, eq7(coupons.id, couponUsage.couponId)).groupBy(coupons.id).orderBy(desc5(coupons.createdAt));
  return results;
}
async function createCoupon(input) {
  const db2 = await getDb();
  await db2.insert(coupons).values({
    id: crypto.randomUUID(),
    // Gerando ID string
    code: input.code.toUpperCase(),
    description: input.description || null,
    discountType: input.discountType,
    discountValue: input.discountValue.toString(),
    // Convertendo para string (decimal)
    minOrderValue: input.minOrderValue ? input.minOrderValue.toString() : null,
    maxDiscount: input.maxDiscount ? input.maxDiscount.toString() : null,
    usageLimit: input.usageLimit || null,
    isActive: input.isActive ?? true,
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null
  });
  return { success: true };
}
async function updateCoupon(id, data) {
  const db2 = await getDb();
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.description !== void 0) updateData.description = data.description;
  if (data.discountType !== void 0) updateData.discountType = data.discountType;
  if (data.discountValue !== void 0) updateData.discountValue = data.discountValue.toString();
  if (data.minOrderValue !== void 0) updateData.minOrderValue = data.minOrderValue?.toString();
  if (data.maxDiscount !== void 0) updateData.maxDiscount = data.maxDiscount?.toString();
  if (data.usageLimit !== void 0) updateData.usageLimit = data.usageLimit;
  if (data.isActive !== void 0) updateData.isActive = data.isActive;
  if (data.validFrom !== void 0) updateData.validFrom = data.validFrom;
  if (data.validUntil !== void 0) updateData.validUntil = data.validUntil;
  await db2.update(coupons).set(updateData).where(eq7(coupons.id, id));
  return { success: true };
}
async function deleteCoupon(id) {
  const db2 = await getDb();
  await db2.delete(couponUsage).where(eq7(couponUsage.couponId, id));
  await db2.delete(coupons).where(eq7(coupons.id, id));
  return { success: true };
}

// server/admin-payment-methods.ts
init_db();
init_schema2();
import { eq as eq8, asc } from "drizzle-orm";
async function listAllPaymentMethods() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  return db2.select().from(paymentMethods).orderBy(asc(paymentMethods.displayOrder), asc(paymentMethods.name));
}
async function createPaymentMethod(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const methodData = {
    ...data,
    // Converte o valor do minAmount para string (decimal no DB)
    minAmount: data.minAmount.toString()
  };
  const [newMethod] = await db2.insert(paymentMethods).values(methodData);
  return newMethod;
}
async function updatePaymentMethod(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const updateData = { ...data };
  if (updateData.minAmount !== void 0) {
    updateData.minAmount = updateData.minAmount.toString();
  }
  await db2.update(paymentMethods).set(updateData).where(eq8(paymentMethods.id, id));
  return { success: true };
}

// server/admin-reports.ts
init_db();
init_schema2();
import { eq as eq9, desc as desc7, or as or2, sql as sql6, and as and3, gte as gte2, lte, count as count2 } from "drizzle-orm";
async function getDashboardSummary(timeframe) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  let startDate;
  const endDate = /* @__PURE__ */ new Date();
  switch (timeframe) {
    case "day":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 1);
      break;
    case "week":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    default:
      throw new Error("Timeframe inv\xE1lido.");
  }
  const timeFilter = and3(
    // ✅ CORREÇÃO DE COLUNA: created_at -> createdAt
    gte2(orders.createdAt, startDate),
    lte(orders.createdAt, endDate)
  );
  const [revenueResult] = await db2.select({
    // ✅ CORREÇÃO DE COLUNA: total_price -> totalPrice
    revenue: sql6`SUM(${orders.total})`,
    count: count2(orders.id)
  }).from(orders).where(
    and3(
      timeFilter,
      or2(
        eq9(orders.status, "delivered"),
        eq9(orders.status, "completed")
      )
    )
  );
  const salesByDay = await db2.select({
    // ✅ CORREÇÃO DE COLUNA: created_at -> createdAt
    date: sql6`DATE(${orders.createdAt})`,
    sales: sql6`SUM(${orders.total})`
  }).from(orders).where(timeFilter).groupBy(sql6`DATE(${orders.createdAt})`).orderBy(sql6`DATE(${orders.createdAt})`);
  const topProducts = await db2.select({
    name: dishes.name,
    quantity: sql6`SUM(${orderItems.quantity})`
  }).from(orderItems).innerJoin(dishes, eq9(orderItems.dishId, dishes.id)).innerJoin(orders, eq9(orderItems.orderId, orders.id)).where(timeFilter).groupBy(dishes.name).orderBy(sql6`SUM(${orderItems.quantity}) DESC`).limit(5);
  return {
    totalRevenue: revenueResult.revenue || "0.00",
    totalOrders: revenueResult.count,
    salesByDay,
    topProducts
  };
}
async function getPaymentMethodReport(startDate, endDate) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const timeFilter = and3(
    // ✅ CORREÇÃO DE COLUNA: created_at -> createdAt
    gte2(orders.createdAt, startDate),
    lte(orders.createdAt, endDate)
  );
  const results = await db2.select({
    // ✅ CORREÇÃO DE COLUNA: payment_method -> paymentMethod
    paymentMethod: orders.paymentMethod,
    totalRevenue: sql6`SUM(${orders.total})`,
    totalOrders: count2(orders.id)
  }).from(orders).where(timeFilter).groupBy(orders.paymentMethod).orderBy(desc7(sql6`SUM(${orders.total})`));
  return results.map((row) => ({
    paymentMethod: row.paymentMethod,
    // Mapeamento final
    totalRevenue: row.totalRevenue,
    totalOrders: row.totalOrders
  }));
}

// server/media-library.ts
init_db();
init_schema2();
import { eq as eq10, desc as desc8 } from "drizzle-orm";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  woocommerceUrl: process.env.WOOCOMMERCE_URL ?? "",
  woocommerceConsumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY ?? "",
  woocommerceConsumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "",
  dbEncryptionKey: process.env.DB_ENCRYPTION_KEY ?? "NjQVtjD/c8lan0GQBsZNo868grK4ysaX+iD9YgqCcZY="
  // default
};

// server/storage.ts
var ENV2 = ENV;
function getStorageConfig() {
  const baseUrl = ENV2.forgeApiUrl;
  const apiKey = ENV2.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/media-library.ts
function generateUniqueFilename(originalFilename) {
  const timestamp17 = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const parts = originalFilename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "bin";
  return `${timestamp17}-${randomStr}.${extension}`;
}
async function uploadImage(data) {
  const db2 = await getDb();
  if (!db2) {
    throw new Error("Database not available");
  }
  try {
    const filename = generateUniqueFilename(data.originalFilename);
    const fileKey = `media-library/${filename}`;
    const { url } = await storagePut(data.file, fileKey, data.mimeType);
    const [inserted] = await db2.insert(mediaLibrary).values({
      url,
      fileName: filename,
      mimeType: data.mimeType,
      size: data.fileSize,
      altText: data.altText,
      uploadedBy: data.uploadedBy
    });
    const [newItem] = await db2.select().from(mediaLibrary).where(eq10(mediaLibrary.url, url)).limit(1);
    return newItem;
  } catch (error) {
    console.error("[MediaLibrary] Error uploading image:", error);
    throw error;
  }
}
async function listMediaLibrary() {
  const db2 = await getDb();
  if (!db2) {
    throw new Error("Database not available");
  }
  try {
    return await db2.select().from(mediaLibrary).orderBy(desc8(mediaLibrary.createdAt));
  } catch (error) {
    console.error("[MediaLibrary] Error listing media:", error);
    throw error;
  }
}

// server/routers/admin/finance.ts
var adminCouponsRouter = router({
  list: adminProcedure.query(async () => await listCoupons()),
  create: adminProcedure.input(z8.object({
    code: z8.string().min(1).toUpperCase(),
    description: z8.string().nullish(),
    discountType: z8.enum(["percentage", "fixed"]),
    discount_value: z8.number().positive(),
    minOrderValue: z8.number().nullish(),
    maxDiscount: z8.number().nullish(),
    usageLimit: z8.number().int().nullish(),
    validFrom: z8.coerce.date().nullish(),
    validUntil: z8.coerce.date().nullish(),
    isActive: z8.boolean().optional().default(true)
  })).mutation(async ({ input }) => await createCoupon(input)),
  update: adminProcedure.input(z8.object({
    id: z8.union([z8.string(), z8.number()]),
    code: z8.string().optional(),
    description: z8.string().nullish(),
    discountType: z8.enum(["percentage", "fixed"]).optional(),
    discount_value: z8.number().optional(),
    minOrderValue: z8.number().nullish(),
    maxDiscount: z8.number().nullish(),
    usageLimit: z8.number().int().nullish(),
    validFrom: z8.coerce.date().nullish(),
    validUntil: z8.coerce.date().nullish(),
    isActive: z8.boolean().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return await updateCoupon(numericId, data);
  }),
  delete: adminProcedure.input(z8.object({ id: z8.union([z8.string(), z8.number()]) })).mutation(async ({ input }) => {
    const numericId = typeof input.id === "string" ? parseInt(input.id, 10) : input.id;
    return await deleteCoupon(numericId);
  })
});
var adminPaymentMethodsRouter = router({
  listAll: adminProcedure.query(async () => await listAllPaymentMethods()),
  create: adminProcedure.input(z8.object({
    name: z8.string(),
    type: z8.enum(["card", "cash", "meal_card", "pix"]),
    minAmount: z8.number().optional().default(0),
    displayOrder: z8.number().optional().default(0),
    isActive: z8.boolean().optional().default(true),
    description: z8.string().optional(),
    brandName: z8.string().optional(),
    brandLogoUrl: z8.string().optional(),
    discountPercentage: z8.number().optional().default(0)
  })).mutation(async ({ input }) => await createPaymentMethod(input)),
  update: adminProcedure.input(z8.object({
    id: z8.union([z8.string(), z8.number()]),
    name: z8.string().optional(),
    isActive: z8.boolean().optional(),
    discountPercentage: z8.number().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return await updatePaymentMethod(numericId, data);
  })
});
var adminReportsRouter = router({
  getDashboardSummary: adminProcedure.input(z8.object({ timeframe: z8.enum(["day", "week", "month"]) })).query(async ({ input }) => await getDashboardSummary(input.timeframe)),
  getPaymentMethodReport: adminProcedure.input(z8.object({
    startDate: z8.coerce.date(),
    endDate: z8.coerce.date()
  })).query(async ({ input }) => await getPaymentMethodReport(input.startDate, input.endDate))
});
var adminMediaRouter2 = router({
  list: adminProcedure.query(async () => await listMediaLibrary()),
  upload: adminProcedure.input(z8.object({ filename: z8.string(), mimeType: z8.string(), base64Data: z8.string() })).mutation(async ({ input, ctx }) => {
    const fileBuffer = Buffer.from(input.base64Data, "base64");
    const authorId = ctx.user?.id || "system";
    return await uploadImage({
      file: fileBuffer,
      originalFilename: input.filename,
      mimeType: input.mimeType,
      uploadedBy: authorId,
      fileSize: fileBuffer.length
    });
  })
});
var adminFinanceRouter = router({
  coupons: adminCouponsRouter,
  payments: adminPaymentMethodsRouter,
  reports: adminReportsRouter,
  media: adminMediaRouter2
});

// server/routers/admin/categories.ts
init_db();
init_schema();
import { z as z9 } from "zod";
import { eq as eq11, asc as asc2 } from "drizzle-orm";
var adminCategoriesRouter = router({
  // Lista todas as categorias ordenadas pela ordem de exibição definida
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(categories).orderBy(asc2(categories.displayOrder));
  }),
  // Cria ou Atualiza uma categoria
  upsert: adminProcedure.input(z9.object({
    id: z9.number().optional(),
    name: z9.string().min(1, "O nome da categoria \xE9 obrigat\xF3rio"),
    allowAccompaniments: z9.boolean().default(true),
    isActive: z9.boolean().default(true),
    displayOrder: z9.number().optional()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const slug = input.name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    const data = {
      name: input.name,
      slug,
      allowAccompaniments: input.allowAccompaniments,
      isActive: input.isActive,
      displayOrder: input.displayOrder ?? 0,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (input.id) {
      await db2.update(categories).set(data).where(eq11(categories.id, input.id));
    } else {
      await db2.insert(categories).values({
        ...data,
        createdAt: /* @__PURE__ */ new Date()
      });
    }
    return { success: true };
  }),
  // Adicionei a rota de Delete por conveniência (CRUD completo)
  delete: adminProcedure.input(z9.object({ id: z9.number() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.delete(categories).where(eq11(categories.id, input.id));
    return { success: true };
  })
});

// server/routers/admin/nutrition.ts
init_db();
init_schema();
import { z as z10 } from "zod";
import { eq as eq12, like as like3, sql as sql7 } from "drizzle-orm";
import { TRPCError as TRPCError6 } from "@trpc/server";
var adminNutritionRouter = router({
  // 1. Busca de Ingredientes (Autocomplete do Painel)
  searchIngredients: adminProcedure.input(z10.string()).query(async ({ input }) => {
    const db2 = await getDb();
    return await db2.select().from(ingredients).where(like3(ingredients.name, `%${input}%`)).limit(20);
  }),
  // 2. Criar ou Atualizar Ingrediente (Upsert)
  upsertIngredient: adminProcedure.input(z10.object({
    id: z10.number().optional(),
    name: z10.string().min(1, "Nome \xE9 obrigat\xF3rio"),
    energyKcal: z10.coerce.number().optional(),
    calories: z10.coerce.number().optional(),
    protein: z10.coerce.number().default(0),
    carbohydrates: z10.coerce.number().optional(),
    carbs: z10.coerce.number().optional(),
    fatTotal: z10.coerce.number().optional(),
    fats: z10.coerce.number().optional(),
    sodium: z10.coerce.number().default(0),
    fiber: z10.coerce.number().default(0)
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const caloriesValue = input.calories ?? input.energyKcal ?? 0;
    const carbsValue = input.carbohydrates ?? input.carbs ?? 0;
    const fatsValue = input.fats ?? input.fatTotal ?? 0;
    try {
      await db2.execute(sql7`
          INSERT INTO ingredients (
            name, 
            calories, 
            carbohydrates, 
            protein, 
            fats, 
            fiber, 
            sodium,
            source
          ) VALUES (
            ${input.name}, 
            ${caloriesValue}, 
            ${carbsValue}, 
            ${input.protein}, 
            ${fatsValue}, 
            ${input.fiber}, 
            ${input.sodium},
            'Manual'
          )
          ON DUPLICATE KEY UPDATE
            calories = VALUES(calories),
            carbohydrates = VALUES(carbohydrates),
            protein = VALUES(protein),
            fats = VALUES(fats),
            fiber = VALUES(fiber),
            sodium = VALUES(sodium)
        `);
      const [rows] = await db2.execute(sql7`SELECT LAST_INSERT_ID() as id`);
      const insertedId = rows?.[0]?.id || rows?.[0]?.[0]?.id;
      return { success: true, id: insertedId ? Number(insertedId) : null };
    } catch (error) {
      console.error("\u274C [NUTRITION UPSERT ERROR]:", error);
      throw new TRPCError6({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao salvar ingrediente. Verifique se as colunas 'calories' e 'fats' existem no banco."
      });
    }
  }),
  // 3. Salvar Composição Técnica do Prato (Ficha Técnica)
  saveDishComposition: adminProcedure.input(z10.object({
    dishId: z10.coerce.number(),
    composition: z10.array(z10.object({
      ingredientId: z10.coerce.number(),
      quantity: z10.coerce.string()
    }))
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    return await db2.transaction(async (tx) => {
      await tx.delete(productIngredients).where(eq12(productIngredients.productId, input.dishId));
      if (input.composition.length > 0) {
        await tx.insert(productIngredients).values(
          input.composition.map((item) => ({
            productId: input.dishId,
            ingredientId: item.ingredientId,
            quantity: item.quantity
          }))
        );
      }
      return { success: true };
    });
  })
});

// server/routers/admin/accompaniments.ts
init_db();
init_catalog();
import { z as z11 } from "zod";
import { eq as eq13, asc as asc3, desc as desc9, sql as sql8 } from "drizzle-orm";
var generateSlug = (text13) => text13.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
var adminAccompanimentsRouter = router({
  // ===================================================================
  // ✅ CATEGORIAS (Ícones e Cores: 'Proteína', 'Legume')
  // ===================================================================
  categories: router({
    list: adminProcedure.query(async () => {
      const db2 = await getDb();
      return await db2.select().from(accompanimentCategories).orderBy(asc3(accompanimentCategories.displayOrder));
    }),
    upsert: adminProcedure.input(z11.object({
      id: z11.number().optional(),
      name: z11.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      iconKey: z11.string().optional().nullable(),
      color: z11.string().optional().nullable(),
      displayOrder: z11.number().default(0),
      isActive: z11.boolean().default(true)
    })).mutation(async ({ input }) => {
      const db2 = await getDb();
      const data = { ...input, updatedAt: /* @__PURE__ */ new Date() };
      if (input.id) {
        await db2.update(accompanimentCategories).set(data).where(eq13(accompanimentCategories.id, input.id));
      } else {
        await db2.insert(accompanimentCategories).values({ ...data, createdAt: /* @__PURE__ */ new Date() });
      }
      return { success: true };
    }),
    delete: adminProcedure.input(z11.object({ id: z11.number() })).mutation(async ({ input }) => {
      const db2 = await getDb();
      return await db2.delete(accompanimentCategories).where(eq13(accompanimentCategories.id, input.id));
    })
  }),
  // ===================================================================
  // ✅ GRUPOS (Slots como 'Escolha 1 Acompanhamento')
  // ===================================================================
  groups: router({
    list: adminProcedure.query(async () => {
      const db2 = await getDb();
      return await db2.select().from(accompanimentGroups).orderBy(desc9(accompanimentGroups.id));
    }),
    upsert: adminProcedure.input(z11.object({
      id: z11.number().optional(),
      name: z11.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      description: z11.string().optional().nullable(),
      maxSelections: z11.number().min(1).default(1),
      minSelections: z11.number().default(0),
      isActive: z11.boolean().default(true)
    })).mutation(async ({ input }) => {
      const db2 = await getDb();
      const data = {
        name: input.name,
        description: input.description || "",
        maxSelections: input.maxSelections,
        minSelections: input.minSelections,
        isActive: input.isActive,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (input.id) {
        await db2.update(accompanimentGroups).set(data).where(eq13(accompanimentGroups.id, input.id));
      } else {
        await db2.insert(accompanimentGroups).values({
          ...data,
          slug: generateSlug(input.name),
          createdAt: /* @__PURE__ */ new Date()
        });
      }
      return { success: true };
    }),
    delete: adminProcedure.input(z11.object({ id: z11.number() })).mutation(async ({ input }) => {
      const db2 = await getDb();
      return await db2.delete(accompanimentGroups).where(eq13(accompanimentGroups.id, input.id));
    })
  }),
  // ===================================================================
  // ✅ OPÇÕES (Itens como 'Arroz', 'Feijão')
  // ===================================================================
  options: router({
    listAll: adminProcedure.query(async () => {
      const db2 = await getDb();
      return await db2.select().from(accompanimentOptions).orderBy(asc3(accompanimentOptions.name));
    }),
    listByGroup: adminProcedure.input(z11.object({ groupId: z11.number() })).query(async ({ input }) => {
      const db2 = await getDb();
      return await db2.select().from(accompanimentOptions).where(sql8`JSON_CONTAINS(groups_config, JSON_OBJECT('group_id', ${input.groupId}))`).orderBy(asc3(accompanimentOptions.displayOrder));
    }),
    // ✅ ROTA QUE ESTAVA DANDO 404
    getComposition: adminProcedure.input(z11.object({ optionId: z11.number() })).query(async ({ input }) => {
      const db2 = await getDb();
      const result = await db2.select().from(accompanimentOptions).where(eq13(accompanimentOptions.id, input.optionId)).limit(1);
      return result[0] || null;
    }),
    upsert: adminProcedure.input(z11.object({
      id: z11.number().optional(),
      name: z11.string().min(1),
      accompanimentCategoryId: z11.number().optional().nullable(),
      // ✅ CORREÇÃO ZOD: Aceita array ou string (JSON) para evitar erro de tipo
      groupsConfig: z11.union([z11.array(z11.any()), z11.string()]).optional().default([]),
      isActive: z11.boolean().optional().default(true),
      displayOrder: z11.number().optional().default(0),
      nutritionalInfo: z11.string().optional().nullable(),
      showNutrition: z11.boolean().optional().default(false)
    })).mutation(async ({ input }) => {
      const db2 = await getDb();
      const rawConfig = typeof input.groupsConfig === "string" ? JSON.parse(input.groupsConfig) : input.groupsConfig;
      const cleanGroupsConfig = (rawConfig || []).map((g) => ({
        group_id: Number(g.group_id),
        price_modifier: String(g.price_modifier || "0.00")
      }));
      const data = {
        name: input.name,
        accompanimentCategoryId: input.accompanimentCategoryId,
        groupsConfig: cleanGroupsConfig,
        isActive: input.isActive,
        displayOrder: input.displayOrder,
        showNutrition: input.showNutrition,
        nutritionalInfo: input.nutritionalInfo || "",
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (input.id) {
        await db2.update(accompanimentOptions).set(data).where(eq13(accompanimentOptions.id, input.id));
      } else {
        await db2.insert(accompanimentOptions).values({
          ...data,
          slug: generateSlug(input.name),
          createdAt: /* @__PURE__ */ new Date()
        });
      }
      return { success: true };
    }),
    delete: adminProcedure.input(z11.object({ id: z11.number() })).mutation(async ({ input }) => {
      const db2 = await getDb();
      return await db2.delete(accompanimentOptions).where(eq13(accompanimentOptions.id, input.id));
    })
  })
});

// server/routers/admin/packages.ts
import { z as z12 } from "zod";
import { TRPCError as TRPCError7 } from "@trpc/server";
init_db();
init_schema();
import { eq as eq14, desc as desc10, asc as asc4 } from "drizzle-orm";
import { nanoid } from "nanoid";
var packageConfigSchema = z12.object({
  slots: z12.array(z12.object({
    name: z12.string(),
    dishIds: z12.array(z12.union([z12.string(), z12.number()])),
    groups: z12.array(z12.object({
      id: z12.union([z12.string(), z12.number()]),
      customLabel: z12.string().optional().nullable()
    }))
  }))
});
var parseConfig = (config) => {
  if (!config) return { slots: [] };
  if (typeof config === "string") {
    try {
      return JSON.parse(config);
    } catch {
      return { slots: [] };
    }
  }
  return config;
};
var adminPackagesRouter = router({
  // 1) LISTAGEM
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    const result = await db2.select().from(packages).orderBy(desc10(packages.createdAt));
    return result.map((pkg) => ({
      ...pkg,
      id: String(pkg.id),
      base_price: Number(pkg.price || 0),
      config: parseConfig(pkg.config)
    }));
  }),
  // 2) DETALHES
  get: adminProcedure.input(z12.object({ id: z12.string().or(z12.number()) })).query(async ({ input }) => {
    const db2 = await getDb();
    const [pkg] = await db2.select().from(packages).where(eq14(packages.id, String(input.id))).limit(1);
    if (!pkg) throw new TRPCError7({ code: "NOT_FOUND", message: "Pacote n\xE3o encontrado" });
    return {
      ...pkg,
      id: String(pkg.id),
      base_price: Number(pkg.price || 0),
      config: parseConfig(pkg.config)
    };
  }),
  // ✅ SOLUÇÃO DO 404: Listas auxiliares para o formulário
  getDishes: adminProcedure.query(async () => {
    const db2 = await getDb();
    const result = await db2.select().from(dishes).where(eq14(dishes.isActive, true)).orderBy(asc4(dishes.name));
    return result.map((d) => ({ id: String(d.id), name: d.name }));
  }),
  getAccompanimentGroups: adminProcedure.query(async () => {
    const db2 = await getDb();
    const result = await db2.select().from(accompanimentGroups).orderBy(asc4(accompanimentGroups.name));
    return result.map((g) => ({ id: String(g.id), name: g.name }));
  }),
  // 🥘 Auxiliar unificado (Builder) - Ótimo para performance
  getBuilderData: adminProcedure.query(async () => {
    const db2 = await getDb();
    const allDishes = await db2.select().from(dishes).where(eq14(dishes.isActive, true)).orderBy(asc4(dishes.name));
    const allGroups = await db2.select().from(accompanimentGroups).orderBy(asc4(accompanimentGroups.name));
    return {
      dishes: allDishes.map((d) => ({ id: String(d.id), name: d.name })),
      groups: allGroups.map((g) => ({ id: String(g.id), name: g.name }))
    };
  }),
  // 3) CRIAÇÃO
  create: adminProcedure.input(z12.object({
    name: z12.string().min(1),
    slug: z12.string().min(1),
    description: z12.string().optional().nullable(),
    image_url: z12.string().optional().nullable(),
    base_price: z12.coerce.string(),
    number_of_options: z12.coerce.number(),
    month: z12.string().optional().nullable(),
    isActive: z12.boolean().optional().default(true),
    config: packageConfigSchema
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    try {
      const newId = nanoid();
      await db2.insert(packages).values({
        id: newId,
        // <--- Aqui estava faltando o ID
        name: input.name,
        slug: input.slug,
        description: input.description,
        imageUrl: input.image_url,
        price: input.base_price,
        numberOfOptions: input.number_of_options,
        month: input.month,
        isActive: input.isActive,
        config: input.config
      });
      await logAction(ctx, "CREATE_PACKAGE", "packages", {
        entityId: newId,
        // Log com o ID correto
        new: { name: input.name, price: input.base_price }
      });
      return { success: true, id: newId };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new TRPCError7({ code: "CONFLICT", message: "J\xE1 existe um pacote com este Slug." });
      }
      throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),
  // 4) ATUALIZAÇÃO
  update: adminProcedure.input(z12.object({
    id: z12.string().or(z12.number()),
    name: z12.string().min(1),
    slug: z12.string().min(1),
    description: z12.string().optional().nullable(),
    image_url: z12.string().optional().nullable(),
    base_price: z12.coerce.string(),
    number_of_options: z12.coerce.number(),
    month: z12.string().optional().nullable(),
    isActive: z12.boolean().optional(),
    config: packageConfigSchema
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const { id, ...data } = input;
    const [old] = await db2.select().from(packages).where(eq14(packages.id, String(id)));
    if (!old) throw new TRPCError7({ code: "NOT_FOUND", message: "Pacote n\xE3o encontrado" });
    await db2.update(packages).set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      imageUrl: data.image_url,
      price: data.base_price,
      numberOfOptions: data.number_of_options,
      month: data.month,
      isActive: data.isActive,
      config: data.config
    }).where(eq14(packages.id, String(id)));
    await logAction(ctx, "UPDATE_PACKAGE", "packages", {
      entityId: String(id),
      old: { name: old?.name },
      new: { name: data.name }
    });
    return { success: true };
  }),
  // 5) DELEÇÃO
  delete: adminProcedure.input(z12.object({ id: z12.string().or(z12.number()) })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    await db2.delete(packages).where(eq14(packages.id, String(input.id)));
    await logAction(ctx, "DELETE_PACKAGE", "packages", {
      entityId: String(input.id)
    });
    return { success: true };
  })
});

// server/routers/admin/coupons.ts
import { z as z13 } from "zod";
init_db();
init_schema();
import { eq as eq15, desc as desc11 } from "drizzle-orm";
import { TRPCError as TRPCError8 } from "@trpc/server";
var cleanDate = (val) => {
  if (!val || typeof val === "string" && val.trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};
var couponInputSchema = z13.object({
  code: z13.string().min(3).max(50).toUpperCase().trim(),
  discountType: z13.enum(["percentage", "fixed"]),
  discountValue: z13.coerce.number().positive(),
  // No input do Zod mantemos camelCase
  minOrderValue: z13.coerce.number().nullish().default(0),
  maxDiscount: z13.coerce.number().nullish(),
  usageLimit: z13.coerce.number().int().nullish(),
  validFrom: z13.any().nullish(),
  validUntil: z13.any().nullish(),
  description: z13.string().nullish(),
  isActive: z13.boolean().optional().default(true)
}).passthrough();
var adminCouponsRouter2 = router({
  // 1. LISTAGEM
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    try {
      const result = await db2.select().from(coupons).orderBy(desc11(coupons.id));
      return result.map((c) => ({
        ...c,
        id: String(c.id),
        // ✅ CORREÇÃO: Usando 'discount_value' que é o nome real no seu banco
        discountValue: Number(c.discount_value || 0),
        minOrderValue: Number(c.minOrderValue || 0),
        isActive: Boolean(c.isActive)
      }));
    } catch (error) {
      throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar cupons." });
    }
  }),
  // 2. CRIAÇÃO
  create: adminProcedure.input(couponInputSchema).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [existing] = await db2.select().from(coupons).where(eq15(coupons.code, input.code));
    if (existing) throw new TRPCError8({ code: "CONFLICT", message: "Este c\xF3digo de cupom j\xE1 existe." });
    try {
      const insertData = {
        code: input.code,
        description: input.description,
        discountType: input.discountType,
        // ✅ CORREÇÃO: Mapeando para o nome da coluna no banco
        discount_value: input.discountValue.toFixed(2),
        minOrderValue: input.minOrderValue?.toFixed(2) || "0.00",
        maxDiscount: input.maxDiscount?.toFixed(2) || null,
        usageLimit: input.usageLimit,
        isActive: Boolean(input.isActive),
        validFrom: cleanDate(input.validFrom),
        validUntil: cleanDate(input.validUntil)
      };
      const [result] = await db2.insert(coupons).values(insertData);
      await logAction(ctx, "CREATE_COUPON", "coupons", {
        entityId: input.code,
        new: { code: input.code, valor: input.discountValue }
      });
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error("\u274C Erro no Drizzle:", error);
      throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cupom." });
    }
  }),
  // 3. ATUALIZAÇÃO
  update: adminProcedure.input(z13.object({ id: z13.string().or(z13.number()) }).passthrough()).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const { id, ...data } = input;
    const [oldCoupon] = await db2.select().from(coupons).where(eq15(coupons.id, id));
    if (!oldCoupon) throw new TRPCError8({ code: "NOT_FOUND", message: "Cupom n\xE3o encontrado." });
    const updatePayload = { updatedAt: /* @__PURE__ */ new Date() };
    if (data.code !== void 0) updatePayload.code = String(data.code).toUpperCase();
    if (data.discountValue !== void 0) updatePayload.discount_value = Number(data.discountValue).toFixed(2);
    if (data.isActive !== void 0) updatePayload.isActive = Boolean(data.isActive);
    if (data.validFrom !== void 0) updatePayload.validFrom = cleanDate(data.validFrom);
    if (data.validUntil !== void 0) updatePayload.validUntil = cleanDate(data.validUntil);
    try {
      await db2.update(coupons).set(updatePayload).where(eq15(coupons.id, id));
      await logAction(ctx, "UPDATE_COUPON", "coupons", {
        entityId: id,
        old: { code: oldCoupon?.code },
        new: updatePayload
      });
      return { success: true };
    } catch (error) {
      throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar cupom." });
    }
  }),
  // 4. DELEÇÃO
  delete: adminProcedure.input(z13.object({ id: z13.string().or(z13.number()) })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    try {
      const [coupon] = await db2.select().from(coupons).where(eq15(coupons.id, input.id));
      if (!coupon) return { success: true };
      await db2.delete(coupons).where(eq15(coupons.id, input.id));
      await logAction(ctx, "DELETE_COUPON", "coupons", {
        entityId: input.id,
        old: { code: coupon?.code }
      });
      return { success: true };
    } catch (error) {
      throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar cupom." });
    }
  })
});

// server/routers/admin/payment-methods.ts
import { z as z14 } from "zod";
init_db();
init_schema();
import { eq as eq16, sql as sql9 } from "drizzle-orm";
var adminPaymentMethodsRouter2 = router({
  listAll: adminProcedure.query(async () => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database not available");
    return await db2.select().from(paymentMethods).orderBy(sql9`display_order ASC`);
  }),
  create: adminProcedure.input(z14.object({
    name: z14.string().min(1),
    isActive: z14.boolean().optional().default(true),
    brand_name: z14.string().optional().nullable(),
    brand_logo_url: z14.string().optional().nullable(),
    description: z14.string().optional().nullable(),
    icon: z14.string().optional().nullable(),
    discount_percentage: z14.coerce.number().optional().default(0)
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.insert(paymentMethods).values({
      name: input.name,
      isActive: input.isActive,
      // Schema: isActive
      brandName: input.brand_name,
      // Schema: brandName
      brandLogoUrl: input.brand_logo_url,
      // Schema: brandLogoUrl
      description: input.description,
      icon: input.icon,
      discountPercentage: String(input.discount_percentage)
      // Schema: discountPercentage
    });
    return { success: true };
  }),
  update: adminProcedure.input(z14.object({
    id: z14.coerce.string(),
    name: z14.string().optional().nullable(),
    description: z14.string().optional().nullable(),
    brand_name: z14.string().optional().nullable(),
    brandName: z14.string().optional().nullable(),
    brand_logo_url: z14.string().optional().nullable(),
    brandLogoUrl: z14.string().optional().nullable(),
    icon: z14.string().optional().nullable(),
    discount_percentage: z14.coerce.number().optional().nullable(),
    discountPercentage: z14.coerce.number().optional().nullable(),
    isActive: z14.any().optional()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database not available");
    const finalName = input.name;
    const finalDesc = input.description;
    const finalBrand = input.brand_name ?? input.brandName;
    const finalLogo = input.brand_logo_url ?? input.brandLogoUrl;
    const finalIcon = input.icon;
    const finalDiscount = input.discount_percentage ?? input.discountPercentage;
    const updateData = {};
    if (finalName !== void 0) updateData.name = finalName;
    if (finalDesc !== void 0) updateData.description = finalDesc;
    if (finalBrand !== void 0) updateData.brandName = finalBrand;
    if (finalLogo !== void 0) updateData.brandLogoUrl = finalLogo;
    if (finalIcon !== void 0) updateData.icon = finalIcon;
    if (finalDiscount !== void 0) updateData.discountPercentage = String(finalDiscount);
    if (input.isActive !== void 0) {
      updateData.isActive = input.isActive ? 1 : 0;
    }
    updateData.updated_at = /* @__PURE__ */ new Date();
    if (Object.keys(updateData).length > 1) {
      const [result] = await db2.update(paymentMethods).set(updateData).where(eq16(paymentMethods.id, input.id));
      console.log("\u{1F4CA} [RESULTADO] Linhas afetadas:", result.affectedRows);
    }
    const [confimacao] = await db2.select().from(paymentMethods).where(eq16(paymentMethods.id, input.id));
    console.log("\u{1F440} [VERIFICA\xC7\xC3O] Valor no banco:", confimacao);
    return { success: true };
  }),
  delete: adminProcedure.input(z14.object({ id: z14.coerce.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.delete(paymentMethods).where(eq16(paymentMethods.id, input.id));
    return { success: true };
  })
});

// server/routers/admin/dishes.ts
import { z as z15 } from "zod";

// server/admin-dishes.ts
init_db();
init_catalog();
import { and as and4, asc as asc5, count as count3, eq as eq17, like as like4, sql as sql10 } from "drizzle-orm";
function mapDishRowToAdmin(row) {
  return {
    ...row,
    id: Number(row.id),
    price: Number(row.price || 0),
    categoryId: row.categoryId ? Number(row.categoryId) : null,
    isActive: Boolean(row.isActive),
    categoryName: row.categoryName ?? "Sem Categoria",
    // Conversão de decimais/strings do banco para Numbers reais
    energyKcal: row.energyKcal ? Number(row.energyKcal) : 0,
    energyKj: row.energyKj ? Number(row.energyKj) : 0,
    carbs: row.carbs ? Number(row.carbs) : 0,
    proteins: row.proteins ? Number(row.proteins) : 0,
    fatTotal: row.fatTotal ? Number(row.fatTotal) : 0,
    fatSaturated: row.fatSaturated ? Number(row.fatSaturated) : 0,
    fatTrans: row.fatTrans ? Number(row.fatTrans) : 0,
    fiber: row.fiber ? Number(row.fiber) : 0,
    sodium: row.sodium ? Number(row.sodium) : 0,
    showNutrition: Boolean(row.showNutrition),
    isVegetarian: Boolean(row.isVegetarian),
    isGlutenFree: Boolean(row.isGlutenFree),
    isLactoseFree: Boolean(row.isLactoseFree)
  };
}
function toPriceString(price) {
  if (price === void 0 || price === null) return "0.00";
  if (typeof price === "string") price = parseFloat(price.replace(",", "."));
  const num2 = Number(price);
  return isNaN(num2) ? "0.00" : num2.toFixed(2);
}
function generateSlug2(name) {
  const base = name || "dish";
  const cleanName = base.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
  return `${cleanName}-${Math.random().toString(36).substring(2, 5)}`;
}
async function createDish(data) {
  const db2 = await getDb();
  const potentialId = Number(data.id);
  if (!isNaN(potentialId) && potentialId > 0) return updateDish(potentialId, data);
  const slug = data.slug || generateSlug2(data.name);
  try {
    const result = await db2.insert(dishes).values({
      name: data.name || "Novo Prato",
      slug,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      price: toPriceString(data.price),
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      isActive: data.isActive ?? true,
      ingredients: data.ingredients || null,
      energyKcal: data.energyKcal ? Number(data.energyKcal) : null,
      energyKj: data.energyKj ? Number(data.energyKj) : null,
      carbs: data.carbs ? String(data.carbs) : null,
      proteins: data.proteins ? String(data.proteins) : null,
      fatTotal: data.fatTotal ? String(data.fatTotal) : null,
      fatSaturated: data.fatSaturated ? String(data.fatSaturated) : null,
      fatTrans: data.fatTrans ? String(data.fatTrans) : null,
      fiber: data.fiber ? String(data.fiber) : null,
      sodium: data.sodium ? String(data.sodium) : null,
      showNutrition: Boolean(data.showNutrition),
      isVegetarian: Boolean(data.isVegetarian),
      isGlutenFree: Boolean(data.isGlutenFree),
      isLactoseFree: Boolean(data.isLactoseFree)
    });
    return result;
  } catch (error) {
    console.error("\u274C [CREATE ERROR]:", error.message);
    throw error;
  }
}
async function updateDish(id, data) {
  const db2 = await getDb();
  const dishId = Number(id);
  const updateData = {
    name: data.name,
    description: data.description,
    imageUrl: data.imageUrl,
    price: toPriceString(data.price),
    categoryId: data.categoryId ? Number(data.categoryId) : null,
    isActive: data.isActive,
    ingredients: data.ingredients,
    energyKcal: data.energyKcal !== void 0 ? Number(data.energyKcal) : void 0,
    energyKj: data.energyKj !== void 0 ? Number(data.energyKj) : void 0,
    carbs: data.carbs !== void 0 ? String(data.carbs) : void 0,
    proteins: data.proteins !== void 0 ? String(data.proteins) : void 0,
    fatTotal: data.fatTotal !== void 0 ? String(data.fatTotal) : void 0,
    fatSaturated: data.fatSaturated !== void 0 ? String(data.fatSaturated) : void 0,
    fatTrans: data.fatTrans !== void 0 ? String(data.fatTrans) : void 0,
    fiber: data.fiber !== void 0 ? String(data.fiber) : void 0,
    sodium: data.sodium !== void 0 ? String(data.sodium) : void 0,
    showNutrition: data.showNutrition !== void 0 ? Boolean(data.showNutrition) : void 0,
    isVegetarian: Boolean(data.isVegetarian),
    isGlutenFree: Boolean(data.isGlutenFree),
    isLactoseFree: Boolean(data.isLactoseFree),
    updatedAt: /* @__PURE__ */ new Date()
  };
  try {
    await db2.update(dishes).set(updateData).where(eq17(dishes.id, dishId));
    return { success: true };
  } catch (error) {
    console.error("\u274C [UPDATE ERROR]:", error.message);
    throw error;
  }
}
async function deleteDish(id) {
  const db2 = await getDb();
  try {
    await db2.delete(dishes).where(eq17(dishes.id, Number(id)));
    return { success: true };
  } catch (error) {
    if (error.errno === 1451) throw new Error("Este prato possui pedidos vinculados.");
    throw error;
  }
}
async function getPaginatedDishes(params) {
  const db2 = await getDb();
  const page = Number(params.page) || 1;
  const perPage = Number(params.limit) || 8;
  const offset = (page - 1) * perPage;
  const conditions = [];
  if (params.search?.trim()) conditions.push(like4(dishes.name, `%${params.search.trim()}%`));
  if (params.categoryId && params.categoryId !== "all") conditions.push(eq17(dishes.categoryId, Number(params.categoryId)));
  if (typeof params.isActive === "boolean") conditions.push(eq17(dishes.isActive, params.isActive));
  const whereExpr = conditions.length ? and4(...conditions) : void 0;
  const totalResult = await db2.select({ value: count3() }).from(dishes).where(whereExpr);
  const rows = await db2.select({
    id: dishes.id,
    name: dishes.name,
    price: dishes.price,
    categoryId: dishes.categoryId,
    isActive: dishes.isActive,
    description: dishes.description,
    ingredients: dishes.ingredients,
    imageUrl: dishes.imageUrl,
    slug: dishes.slug,
    energyKcal: dishes.energyKcal,
    carbs: dishes.carbs,
    proteins: dishes.proteins,
    showNutrition: dishes.showNutrition,
    categoryName: categories.name,
    allowAccompaniments: categories.allowAccompaniments
  }).from(dishes).leftJoin(categories, eq17(dishes.categoryId, categories.id)).where(whereExpr).orderBy(asc5(dishes.name)).limit(perPage).offset(offset);
  return { data: rows.map(mapDishRowToAdmin), total: Number(totalResult[0]?.value ?? 0) };
}
async function getDishById(id) {
  const db2 = await getDb();
  const dishId = Number(id);
  try {
    const [row] = await db2.select({
      id: dishes.id,
      name: dishes.name,
      slug: dishes.slug,
      description: dishes.description,
      imageUrl: dishes.imageUrl,
      price: dishes.price,
      categoryId: dishes.categoryId,
      isActive: dishes.isActive,
      ingredients: dishes.ingredients,
      energyKcal: dishes.energyKcal,
      energyKj: dishes.energyKj,
      proteins: dishes.proteins,
      carbs: dishes.carbs,
      fatTotal: dishes.fatTotal,
      fatSaturated: dishes.fatSaturated,
      fatTrans: dishes.fatTrans,
      fiber: dishes.fiber,
      sodium: dishes.sodium,
      showNutrition: dishes.showNutrition,
      isVegetarian: dishes.isVegetarian,
      isGlutenFree: dishes.isGlutenFree,
      isLactoseFree: dishes.isLactoseFree,
      categoryName: categories.name,
      allowAccompaniments: categories.allowAccompaniments
    }).from(dishes).leftJoin(categories, eq17(dishes.categoryId, categories.id)).where(eq17(dishes.id, dishId)).limit(1);
    if (!row) return null;
    let sizes = [];
    if (row.allowAccompaniments) {
      const rawSizes = await db2.select().from(dishSizes).where(eq17(dishSizes.isActive, true)).orderBy(asc5(dishSizes.displayOrder));
      sizes = await Promise.all(rawSizes.map(async (size) => {
        const groupLinks = await db2.select({
          group: {
            id: accompanimentGroups.id,
            name: accompanimentGroups.name,
            slug: accompanimentGroups.slug,
            maxSelections: accompanimentGroups.maxSelections,
            isActive: accompanimentGroups.isActive
          },
          isRequired: sizeAccompanimentGroups.isRequired
        }).from(sizeAccompanimentGroups).innerJoin(accompanimentGroups, eq17(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id)).where(eq17(sizeAccompanimentGroups.sizeId, size.id));
        const groupsWithOptions = await Promise.all(groupLinks.map(async (link) => {
          const options = await db2.select().from(accompanimentOptions).where(and4(
            eq17(accompanimentOptions.isActive, true),
            sql10`JSON_CONTAINS(${accompanimentOptions.groupsConfig}, JSON_OBJECT('group_id', ${link.group.id}))`
          )).orderBy(asc5(accompanimentOptions.displayOrder));
          return {
            ...link.group,
            isRequired: Boolean(link.isRequired),
            options: options.map((opt) => {
              let configs = [];
              try {
                configs = typeof opt.groupsConfig === "string" ? JSON.parse(opt.groupsConfig) : opt.groupsConfig || [];
              } catch (e) {
                configs = [];
              }
              const specific = configs.find((c) => Number(c.group_id) === Number(link.group.id));
              return { ...opt, priceModifier: Number(specific?.price_modifier || 0) };
            })
          };
        }));
        return { ...size, priceModifier: Number(size.priceModifier || 0), accompanimentGroups: groupsWithOptions };
      }));
    }
    return {
      ...mapDishRowToAdmin(row),
      sizes
    };
  } catch (error) {
    console.error("\u274C [getDishById Error]:", error);
    throw error;
  }
}
async function getLocalCategories() {
  const db2 = await getDb();
  return await db2.select().from(categories).orderBy(asc5(categories.name));
}

// server/admin-sizes-accompaniments.ts
init_db();
init_catalog();
import { asc as asc6, eq as eq18, sql as sql11, desc as desc12 } from "drizzle-orm";
function toPriceString2(price) {
  if (price === void 0 || price === null || price === "") return "0.00";
  const num2 = typeof price === "string" ? parseFloat(price.replace(",", ".")) : price;
  return isNaN(num2) ? "0.00" : num2.toFixed(2);
}
function generateSlug3(name) {
  const base = name || "item";
  const clean = base.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
  return `${clean}-${Math.random().toString(36).substring(2, 7)}`;
}
async function getAllLinks() {
  const db2 = await getDb();
  try {
    const [rows] = await db2.execute(sql11`
      SELECT 
        size_id as sizeId, 
        accompaniment_group_id as groupId 
      FROM size_accompaniment_groups
    `);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("\u274C Erro ao buscar todos os v\xEDnculos:", error);
    return [];
  }
}
async function getAllDishSizes() {
  const db2 = await getDb();
  const result = await db2.select().from(dishSizes).orderBy(asc6(dishSizes.displayOrder));
  return result.map((size) => ({
    ...size,
    id: Number(size.id),
    priceModifier: Number(size.priceModifier || 0),
    isActive: Boolean(size.isActive)
  }));
}
async function createDishSize(data) {
  const db2 = await getDb();
  const [result] = await db2.insert(dishSizes).values({
    name: data.name,
    weight: data.weight ?? null,
    priceModifier: toPriceString2(data.priceModifier),
    displayOrder: Number(data.displayOrder ?? 0),
    isActive: data.isActive ?? true
  });
  return { success: true, id: result.insertId };
}
async function deleteDishSize(id) {
  const db2 = await getDb();
  await db2.execute(sql11`DELETE FROM size_accompaniment_groups WHERE size_id = ${Number(id)}`);
  await db2.delete(dishSizes).where(eq18(dishSizes.id, Number(id)));
  return { success: true };
}
async function getAllAccompanimentGroups() {
  const db2 = await getDb();
  const result = await db2.select().from(accompanimentGroups).orderBy(asc6(accompanimentGroups.name));
  return result.map((g) => ({
    ...g,
    id: Number(g.id),
    maxSelections: Number(g.max_selections || g.maxSelections || 1)
  }));
}
async function createAccompanimentGroup(data) {
  const db2 = await getDb();
  const [result] = await db2.insert(accompanimentGroups).values({
    name: data.name,
    slug: generateSlug3(data.name),
    description: data.description || null,
    maxSelections: data.maxSelections ?? 1,
    isActive: true
  });
  return { success: true, id: result.insertId };
}
async function deleteAccompanimentGroup(id) {
  const db2 = await getDb();
  await db2.execute(sql11`DELETE FROM size_accompaniment_groups WHERE accompaniment_group_id = ${Number(id)}`);
  await db2.delete(accompanimentGroups).where(eq18(accompanimentGroups.id, Number(id)));
  return { success: true };
}
async function createAccompanimentOption(data) {
  const db2 = await getDb();
  return await db2.insert(accompanimentOptions).values({
    ...data,
    slug: generateSlug3(data.name),
    priceModifier: toPriceString2(data.priceModifier)
  });
}
async function updateAccompanimentOption(id, data) {
  const db2 = await getDb();
  const updateData = { ...data };
  if (updateData.priceModifier !== void 0) updateData.priceModifier = toPriceString2(updateData.priceModifier);
  return await db2.update(accompanimentOptions).set(updateData).where(eq18(accompanimentOptions.id, Number(id)));
}
async function deleteAccompanimentOption(id) {
  const db2 = await getDb();
  return await db2.delete(accompanimentOptions).where(eq18(accompanimentOptions.id, Number(id)));
}
async function linkAccompanimentToSize(data) {
  const db2 = await getDb();
  await db2.execute(sql11`
    INSERT INTO size_accompaniment_groups (size_id, accompaniment_group_id) 
    VALUES (${Number(data.sizeId)}, ${Number(data.groupId)})
    ON DUPLICATE KEY UPDATE size_id = size_id
  `);
  return { success: true };
}
async function unlinkAccompanimentFromSize(sizeId, groupId) {
  const db2 = await getDb();
  await db2.execute(sql11`
    DELETE FROM size_accompaniment_groups 
    WHERE size_id = ${Number(sizeId)} AND accompaniment_group_id = ${Number(groupId)}
  `);
  return { success: true };
}

// server/routers/admin/dishes.ts
import { TRPCError as TRPCError9 } from "@trpc/server";
var normalizeIdToNumber = (id) => {
  const num2 = Number(id);
  if (isNaN(num2)) return 0;
  return num2;
};
var adminDishesRouter = router({
  list: adminProcedure.input(z15.object({
    page: z15.number().default(1),
    perPage: z15.number().default(8),
    search: z15.string().nullish(),
    categoryId: z15.any().nullish()
  }).optional()).query(async ({ input }) => {
    try {
      return await getPaginatedDishes({
        page: input?.page ?? 1,
        limit: input?.perPage ?? 8,
        search: input?.search || void 0,
        categoryId: input?.categoryId === "all" || !input?.categoryId ? void 0 : normalizeIdToNumber(input.categoryId)
      });
    } catch (error) {
      console.error("\u274C [TRPC DISH LIST ERROR]:", error);
      throw new TRPCError9({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar pratos."
      });
    }
  }),
  /**
   * ✅ BUSCA POR ID: Agora com log de erro explícito para debugar o banco
   */
  getById: adminProcedure.input(z15.number()).query(async ({ input }) => {
    try {
      const dish = await getDishById(input);
      if (!dish) {
        throw new TRPCError9({ code: "NOT_FOUND", message: "Prato n\xE3o encontrado." });
      }
      return dish;
    } catch (error) {
      console.error("\u274C [TRPC getById ERROR]:", error);
      throw new TRPCError9({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao buscar prato: ${error.message}`
      });
    }
  }),
  toggleActive: adminProcedure.input(z15.object({
    id: z15.number().or(z15.string()),
    isActive: z15.boolean()
  })).mutation(async ({ ctx, input }) => {
    try {
      const idNum = normalizeIdToNumber(input.id);
      const dish = await getDishById(idNum);
      const result = await updateDish(idNum, { isActive: input.isActive });
      await logAction(ctx, "TOGGLE_DISH_VISIBILITY", "dishes", {
        entityId: input.id,
        old: { nome: dish?.name, ativo: !input.isActive },
        new: { nome: dish?.name, ativo: input.isActive }
      });
      return result;
    } catch (error) {
      console.error("\u274C [TRPC toggleActive ERROR]:", error);
      throw new TRPCError9({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao alterar status." });
    }
  }),
  listCategories: adminProcedure.query(async () => {
    try {
      return await getLocalCategories();
    } catch (error) {
      console.error("\u274C [TRPC listCategories ERROR]:", error);
      return [];
    }
  }),
  create: adminProcedure.input(z15.object({
    name: z15.string(),
    ingredients: z15.string().optional().nullable(),
    description: z15.string().optional().nullable(),
    price: z15.any().optional(),
    categoryId: z15.any().optional(),
    isActive: z15.boolean().default(true),
    imageUrl: z15.string().optional().nullable()
  }).passthrough()).mutation(async ({ ctx, input }) => {
    try {
      const result = await createDish(input);
      await logAction(ctx, "CREATE_DISH", "dishes", {
        entityId: result?.insertId || input.name,
        new: { nome: input.name, preco: input.price }
      });
      return result;
    } catch (error) {
      console.error("\u274C [TRPC create DISH ERROR]:", error);
      throw new TRPCError9({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar prato." });
    }
  }),
  update: adminProcedure.input(z15.object({
    id: z15.any(),
    name: z15.string().optional(),
    ingredients: z15.string().optional().nullable()
  }).passthrough()).mutation(async ({ ctx, input }) => {
    try {
      const { id, ...data } = input;
      const idNum = normalizeIdToNumber(id);
      const oldDish = await getDishById(idNum);
      const result = await updateDish(idNum, data);
      await logAction(ctx, "UPDATE_DISH", "dishes", {
        entityId: idNum,
        old: { nome: oldDish?.name, preco: oldDish?.price },
        new: { nome: data.name || oldDish?.name, preco: data.price }
      });
      return result;
    } catch (error) {
      console.error("\u274C [TRPC update DISH ERROR]:", error);
      throw new TRPCError9({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar prato." });
    }
  }),
  delete: adminProcedure.input(z15.object({ id: z15.any() })).mutation(async ({ ctx, input }) => {
    try {
      const idNum = normalizeIdToNumber(input.id);
      const dish = await getDishById(idNum);
      const result = await deleteDish(idNum);
      await logAction(ctx, "DELETE_DISH", "dishes", {
        entityId: idNum,
        old: { nome: dish?.name }
      });
      return result;
    } catch (error) {
      console.error("\u274C [TRPC delete DISH ERROR]:", error);
      throw new TRPCError9({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao excluir prato." });
    }
  })
});
var adminSizesRouter = router({
  list: adminProcedure.query(async () => await getAllDishSizes()),
  getAccompanimentGroups: adminProcedure.query(
    async () => await getAllLinks()
  ),
  create: adminProcedure.input(z15.any()).mutation(async ({ ctx, input }) => {
    const res = await createDishSize(input);
    await logAction(ctx, "CREATE_SIZE", "sizes", { new: input });
    return res;
  }),
  delete: adminProcedure.input(z15.object({ id: z15.any() })).mutation(async ({ ctx, input }) => {
    const id = normalizeIdToNumber(input.id);
    const res = await deleteDishSize(id);
    await logAction(ctx, "DELETE_SIZE", "sizes", { entityId: id });
    return res;
  }),
  linkAccompanimentToSize: adminProcedure.input(z15.object({ sizeId: z15.number(), groupId: z15.number() })).mutation(async ({ ctx, input }) => {
    const res = await linkAccompanimentToSize(input);
    await logAction(ctx, "LINK_ACCOMPANIMENT", "sizes", { new: input });
    return res;
  }),
  unlinkAccompanimentFromSize: adminProcedure.input(z15.object({ sizeId: z15.number(), groupId: z15.number() })).mutation(async ({ ctx, input }) => {
    const res = await unlinkAccompanimentFromSize(
      normalizeIdToNumber(input.sizeId),
      normalizeIdToNumber(input.groupId)
    );
    await logAction(ctx, "UNLINK_ACCOMPANIMENT", "sizes", { old: input });
    return res;
  })
});
var adminAccompanimentsRouter2 = router({
  groups: router({
    list: adminProcedure.query(async () => await getAllAccompanimentGroups()),
    upsert: adminProcedure.input(z15.any()).mutation(async ({ ctx, input }) => {
      const res = await createAccompanimentGroup(input);
      await logAction(ctx, "UPSERT_ACCOMP_GROUP", "accompaniments", { new: input });
      return res;
    }),
    delete: adminProcedure.input(z15.object({ id: z15.any() })).mutation(async ({ ctx, input }) => {
      const id = normalizeIdToNumber(input.id);
      const res = await deleteAccompanimentGroup(id);
      await logAction(ctx, "DELETE_ACCOMP_GROUP", "accompaniments", { entityId: id });
      return res;
    })
  }),
  options: router({
    create: adminProcedure.input(z15.any()).mutation(async ({ ctx, input }) => {
      const res = await createAccompanimentOption(input);
      await logAction(ctx, "CREATE_ACCOMP_OPTION", "accompaniments", { new: input });
      return res;
    }),
    update: adminProcedure.input(z15.any()).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const res = await updateAccompanimentOption(normalizeIdToNumber(id), data);
      await logAction(ctx, "UPDATE_ACCOMP_OPTION", "accompaniments", { entityId: id, new: data });
      return res;
    }),
    delete: adminProcedure.input(z15.object({ id: z15.any() })).mutation(async ({ ctx, input }) => {
      const id = normalizeIdToNumber(input.id);
      const res = await deleteAccompanimentOption(id);
      await logAction(ctx, "DELETE_ACCOMP_OPTION", "accompaniments", { entityId: id });
      return res;
    })
  })
});

// server/routers/admin/users.ts
import { z as z16 } from "zod";
import { eq as eq19, desc as desc13, sql as sql12, sum as sum2, or as or3, like as like5 } from "drizzle-orm";
init_db();
init_encryption();
import { TRPCError as TRPCError10 } from "@trpc/server";
init_schema();
import { createHmac } from "crypto";
function generateSearchHash(val) {
  if (!val) return null;
  const secret = process.env.DB_ENCRYPTION_KEY || "fallback-secret";
  return createHmac("sha256", secret).update(val.toLowerCase().trim().replace(/\D/g, "")).digest("hex");
}
function safeDecrypt(val) {
  if (!val) return "";
  try {
    const str = String(val);
    if (!str.includes(":")) return str;
    return decrypt(str) || str;
  } catch {
    return String(val);
  }
}
var mapUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    name: safeDecrypt(u.name),
    phone: safeDecrypt(u.phone),
    customerDocument: safeDecrypt(u.customerDocument)
  };
};
var usersAdminRouter = router({
  // 1. LISTAGEM COM BUSCA VIA BLIND INDEX
  list: adminProcedure.input(z16.object({
    page: z16.number().default(1),
    limit: z16.number().default(20),
    search: z16.string().nullish()
  })).query(async ({ input }) => {
    const db2 = await getDb();
    const offset = (input.page - 1) * input.limit;
    let searchCondition = void 0;
    if (input.search && input.search.length > 2) {
      const term = input.search.trim();
      const hash3 = generateSearchHash(term);
      searchCondition = or3(
        like5(users.email, `%${term}%`),
        eq19(users.id, term),
        hash3 ? eq19(users.nameIndex, hash3) : void 0,
        hash3 ? eq19(users.documentIndex, hash3) : void 0
      );
    }
    const userList = await db2.select().from(users).where(searchCondition).limit(input.limit).offset(offset);
    const [totalResult] = await db2.select({ count: sql12`count(*)` }).from(users).where(searchCondition);
    const items = userList.map(mapUser).filter((u) => u !== null);
    items.sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
    return {
      items,
      total: Number(totalResult?.count || 0),
      page: input.page,
      limit: input.limit
    };
  }),
  // 2. PERFIL DETALHADO (360º do Cliente)
  getDetails: adminProcedure.input(z16.object({ id: z16.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const [data] = await db2.select({
      user: users,
      zipCode: user_profiles.zipCode,
      city: user_profiles.city,
      state: user_profiles.state
    }).from(users).leftJoin(user_profiles, eq19(users.id, user_profiles.userId)).where(eq19(users.id, input.id)).limit(1);
    if (!data) throw new TRPCError10({ code: "NOT_FOUND", message: "Usu\xE1rio n\xE3o encontrado" });
    const [spent] = await db2.select({ total: sum2(orders.total) }).from(orders).where(eq19(orders.userId, input.id));
    const [loyalty] = await db2.select({ total: sum2(loyaltyHistory.pointsChange) }).from(loyaltyHistory).where(eq19(loyaltyHistory.userId, input.id));
    return {
      user: mapUser(data.user),
      stats: {
        totalSpent: String(spent?.total || "0.00"),
        loyaltyPoints: Number(loyalty?.total || 0),
        city: safeDecrypt(data.city),
        state: safeDecrypt(data.state)
      }
    };
  }),
  /**
   * ✅ SOLUÇÃO DO 404: listAddresses
   * Permite ao admin ver os endereços do cliente (descriptografados)
   */
  listAddresses: adminProcedure.input(z16.object({ userId: z16.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const rows = await db2.select().from(userAddresses).where(eq19(userAddresses.userId, input.userId)).orderBy(desc13(userAddresses.createdAt));
    return rows.map((addr) => ({
      ...addr,
      label: safeDecrypt(addr.label) || "Endere\xE7o",
      street: safeDecrypt(addr.street),
      number: safeDecrypt(addr.number),
      complement: safeDecrypt(addr.complement),
      neighborhood: safeDecrypt(addr.neighborhood),
      city: safeDecrypt(addr.city),
      state: safeDecrypt(addr.state),
      zipCode: safeDecrypt(addr.zipCode)
    }));
  }),
  // 3. ATUALIZAÇÃO
  update: adminProcedure.input(z16.object({
    id: z16.string(),
    name: z16.string().optional(),
    phone: z16.string().optional().nullable(),
    customerDocument: z16.string().optional().nullable(),
    role: z16.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [oldUser] = await db2.select().from(users).where(eq19(users.id, input.id));
    const updateData = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.name) {
      updateData.name = encrypt(input.name);
      updateData.nameIndex = generateSearchHash(input.name);
    }
    if (input.phone !== void 0) {
      const cleanPhone = input.phone ? String(input.phone).replace(/\D/g, "") : null;
      updateData.phone = cleanPhone ? encrypt(cleanPhone) : null;
    }
    if (input.customerDocument !== void 0) {
      const cleanCpf = input.customerDocument ? String(input.customerDocument).replace(/\D/g, "") : null;
      updateData.customerDocument = cleanCpf ? encrypt(cleanCpf) : null;
      updateData.documentIndex = generateSearchHash(cleanCpf);
    }
    if (input.role) updateData.role = input.role;
    await db2.update(users).set(updateData).where(eq19(users.id, input.id));
    await logAction(ctx, "UPDATE_USER", "users", {
      entityId: input.id,
      old: { name: safeDecrypt(oldUser?.name), role: oldUser?.role },
      new: { name: input.name, role: input.role }
    });
    return { success: true };
  }),
  // 4. EXCLUSÃO
  delete: adminProcedure.input(z16.object({ id: z16.string() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [user] = await db2.select().from(users).where(eq19(users.id, input.id));
    await db2.transaction(async (tx) => {
      await tx.delete(userAddresses).where(eq19(userAddresses.userId, input.id));
      await tx.delete(authUsers).where(eq19(authUsers.id, input.id));
      await tx.delete(users).where(eq19(users.id, input.id));
    });
    await logAction(ctx, "DELETE_USER", "users", {
      entityId: input.id,
      old: { email: user?.email }
    });
    return { success: true };
  })
});

// server/routers/admin/orders.ts
import { z as z17 } from "zod";
init_db();
init_encryption();
import { TRPCError as TRPCError11 } from "@trpc/server";
import { eq as eq20, desc as desc14, like as like6, or as or4, sql as sql13 } from "drizzle-orm";
init_schema();
var safeDecrypt2 = (val) => {
  if (!val) return "";
  try {
    const str = String(val).trim();
    if (str.includes(":")) {
      const decrypted = decrypt(str);
      return decrypted || str;
    }
    return str;
  } catch (err) {
    return String(val);
  }
};
var safeJsonParse = (val) => {
  if (!val || val === "null") return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(String(val));
  } catch {
    return null;
  }
};
var resolveCustomerName = (orderName, userName) => {
  const decryptedOrderName = safeDecrypt2(orderName || "");
  if (!decryptedOrderName || decryptedOrderName === "Cliente WP") {
    return safeDecrypt2(userName || "") || "Cliente Visitante";
  }
  return decryptedOrderName;
};
var ordersAdminRouter = router({
  // ✅ 1. BUSCAR CONFIGURAÇÃO (Corrigido para aceitar chave específica)
  getConfig: adminProcedure.input(z17.object({ key: z17.string().optional() }).optional()).query(async ({ input }) => {
    const db2 = await getDb();
    if (input?.key) {
      const [config] = await db2.select().from(appConfigs).where(eq20(appConfigs.configKey, input.key)).limit(1);
      return config || null;
    }
    const configs = await db2.select().from(appConfigs);
    const configObj = {};
    configs.forEach((c) => {
      configObj[c.configKey] = c.configValue;
    });
    return configObj;
  }),
  // ✅ 2. SALVAR CONFIGURAÇÃO (Corrigido para bater com os tipos do logAction)
  setConfig: adminProcedure.input(z17.object({ key: z17.string(), value: z17.string() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const existing = await db2.select().from(appConfigs).where(eq20(appConfigs.configKey, input.key)).limit(1);
    if (existing.length > 0) {
      await db2.update(appConfigs).set({ configValue: input.value, updatedAt: /* @__PURE__ */ new Date() }).where(eq20(appConfigs.configKey, input.key));
    } else {
      await db2.insert(appConfigs).values({
        configKey: input.key,
        configValue: input.value,
        updatedAt: /* @__PURE__ */ new Date()
      });
    }
    await logAction(ctx, "SET_CONFIG", "app_configs", {
      entityId: input.key,
      // Usamos a chave como ID da entidade
      new: { value: input.value }
    });
    return { success: true };
  }),
  // ✅ 3. BUSCA RÁPIDA (Search)
  search: adminProcedure.input(z17.object({
    query: z17.string().optional(),
    limit: z17.number().default(50)
  })).query(async ({ input }) => {
    const db2 = await getDb();
    const whereClause = input.query ? or4(
      eq20(orders.id, input.query),
      like6(sql13`CAST(${orders.id} AS CHAR)`, `%${input.query}%`),
      like6(orders.customerName, `%${input.query}%`)
    ) : void 0;
    const results = await db2.select().from(orders).leftJoin(users, eq20(orders.userId, users.id)).where(whereClause).limit(input.limit).orderBy(desc14(orders.createdAt));
    return results.map(({ orders: o, users: u }) => ({
      ...o,
      id: String(o.id),
      customerName: resolveCustomerName(o.customerName, u?.name || null),
      userName: safeDecrypt2(u?.name || "")
    }));
  }),
  // ✅ 4. LISTAGEM GERAL
  list: adminProcedure.input(z17.object({
    page: z17.number().default(1),
    limit: z17.number().default(20),
    search: z17.string().optional()
  })).query(async ({ input }) => {
    const db2 = await getDb();
    const offset = (input.page - 1) * input.limit;
    const whereClause = input.search ? or4(
      like6(sql13`CAST(${orders.id} AS CHAR)`, `%${input.search}%`),
      like6(orders.customerName, `%${input.search}%`)
    ) : void 0;
    const [totalResult] = await db2.select({ count: sql13`count(*)` }).from(orders).where(whereClause);
    const baseOrders = await db2.select().from(orders).leftJoin(users, eq20(orders.userId, users.id)).where(whereClause).orderBy(desc14(orders.createdAt)).limit(input.limit).offset(offset);
    return {
      orders: baseOrders.map(({ orders: o, users: u }) => ({
        ...o,
        id: String(o.id),
        customerName: resolveCustomerName(o.customerName, u?.name || null),
        customerPhone: safeDecrypt2(o.customerPhone || "") || safeDecrypt2(u?.phone || ""),
        total: Number(o.total || 0)
      })),
      meta: {
        totalItems: Number(totalResult?.count || 0),
        totalPages: Math.ceil(Number(totalResult?.count || 0) / input.limit),
        currentPage: input.page
      }
    };
  }),
  // ✅ 5. DETALHES COMPLETOS (GetById)
  getById: adminProcedure.input(z17.object({ id: z17.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const rows = await db2.select().from(orders).leftJoin(users, eq20(orders.userId, users.id)).where(eq20(orders.id, input.id)).limit(1);
    if (!rows.length) throw new TRPCError11({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    const { orders: row, users: userRow } = rows[0];
    const itemsRaw = await db2.select().from(orderItems).where(eq20(orderItems.orderId, input.id));
    return {
      ...row,
      id: String(row.id),
      customerName: resolveCustomerName(row.customerName, userRow?.name || null),
      customerEmail: userRow?.email || "E-mail n\xE3o dispon\xEDvel",
      userName: safeDecrypt2(userRow?.name || ""),
      customerPhone: safeDecrypt2(row.customerPhone || "") || safeDecrypt2(userRow?.phone || ""),
      customerDocument: safeDecrypt2(row.customerDocument || ""),
      shippingAddress: safeDecrypt2(row.shippingAddress || ""),
      shippingAddressNumber: safeDecrypt2(row.shippingAddressNumber || ""),
      shippingAddressComplement: safeDecrypt2(row.shippingAddressComplement || ""),
      shippingNeighborhood: safeDecrypt2(row.shippingNeighborhood || ""),
      shippingCity: safeDecrypt2(row.shippingCity || ""),
      shippingState: safeDecrypt2(row.shippingState || ""),
      items: itemsRaw.map((item) => ({
        ...item,
        id: String(item.id),
        options: safeJsonParse(item.options),
        accompaniments: safeJsonParse(item.accompaniments),
        appliedNutrition: safeJsonParse(item.appliedNutrition)
      }))
    };
  }),
  // ✅ 6. ATUALIZAR PEDIDO (UpdateOrder)
  updateOrder: adminProcedure.input(z17.object({
    id: z17.string(),
    customerName: z17.string().optional(),
    customerPhone: z17.string().optional(),
    shippingAddress: z17.string().optional(),
    shippingAddressNumber: z17.string().optional(),
    shippingNeighborhood: z17.string().optional(),
    total: z17.number().optional()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const { id, total, ...data } = input;
    const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    if (total !== void 0) {
      updateData.total = String(total);
    }
    await db2.update(orders).set(updateData).where(eq20(orders.id, id));
    await logAction(ctx, "UPDATE_ORDER_FULL", "orders", { entityId: id, new: input });
    return { success: true };
  }),
  // ✅ 7. STATUS E DELETE
  updateStatus: adminProcedure.input(z17.object({ id: z17.string(), status: z17.string() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [oldOrder] = await db2.select().from(orders).where(eq20(orders.id, input.id)).limit(1);
    await db2.update(orders).set({ status: input.status, updatedAt: /* @__PURE__ */ new Date() }).where(eq20(orders.id, input.id));
    await logAction(ctx, "UPDATE_ORDER_STATUS", "orders", { entityId: input.id, old: { status: oldOrder?.status }, new: { status: input.status } });
    return { success: true };
  }),
  delete: adminProcedure.input(z17.object({ id: z17.string() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    await db2.transaction(async (tx) => {
      await tx.delete(loyaltyHistory).where(eq20(loyaltyHistory.orderId, input.id));
      await tx.delete(couponUsage).where(eq20(couponUsage.orderId, input.id));
      await tx.delete(orderItems).where(eq20(orderItems.orderId, input.id));
      await tx.delete(orders).where(eq20(orders.id, input.id));
    });
    await logAction(ctx, "DELETE_ORDER", "orders", { entityId: input.id });
    return { success: true };
  })
});

// server/routers/admin/settings.ts
import { z as z18 } from "zod";
init_db();
init_schema();
init_encryption();
import { TRPCError as TRPCError12 } from "@trpc/server";

// server/backup.ts
import { execSync } from "child_process";
async function generateDatabaseBackup() {
  const containerName = "gourmet_db";
  const dbName = "gourmet_saudavel";
  try {
    console.log(`\u{1F4E6} [BACKUP] Executando dump via shell seguro...`);
    const command = `docker exec ${containerName} /usr/bin/mysqldump -u root --password=root ${dbName}`;
    const output = execSync(command, {
      maxBuffer: 1024 * 1024 * 64,
      encoding: "utf8",
      // 'pipe' no stderr nos permite ver o erro real se falhar
      stdio: ["pipe", "pipe", "pipe"]
    });
    return output;
  } catch (error) {
    const stderr = error.stderr?.toString() || "";
    const message = error.message || "";
    console.error("\u274C [MYSQL ERROR]:", stderr);
    console.error("\u274C [EXEC ERROR]:", message);
    if (stderr.includes("Unknown database")) {
      throw new Error(`O banco '${dbName}' n\xE3o existe no container.`);
    }
    if (stderr.includes("Access denied")) {
      throw new Error("Senha do banco incorreta no script de backup.");
    }
    throw new Error(`Erro no Docker: ${stderr || message}`);
  }
}

// server/routers/admin/settings.ts
import { eq as eq21 } from "drizzle-orm";
var exportProgress = { percent: 0, status: "Aguardando..." };
async function upsertConfig(db2, key, value) {
  const result = await db2.update(appConfigs).set({ configValue: value }).where(eq21(appConfigs.configKey, key));
  if (result[0]?.affectedRows === 0) {
    await db2.insert(appConfigs).values({ configKey: key, configValue: value });
  }
}
var adminSettingsRouter = router({
  /**
   * ⚙️ BUSCAR CONFIGURAÇÕES
   */
  get: adminProcedure.query(async () => {
    try {
      const db2 = await getDb();
      const generalSettings = await getStoreSettings();
      const extraConfigs = await db2.select().from(appConfigs);
      const getRawConfig = (key) => extraConfigs.find((r) => r.configKey === key)?.configValue;
      const getEncryptedConfig = (key) => {
        const row = extraConfigs.find((r) => r.configKey === key);
        if (!row?.configValue) return null;
        try {
          const decrypted = decrypt(row.configValue);
          return decrypted ? JSON.parse(decrypted) : null;
        } catch (e) {
          return null;
        }
      };
      return {
        ...generalSettings,
        googleLogin: getEncryptedConfig("google_auth_credentials") || { enabled: false, clientId: "", clientSecret: "" },
        companyInfo: getEncryptedConfig("company_social_info") || { phone: "", whatsapp: "", email: "", address: "", instagram: "", facebook: "" },
        accessibility: {
          vLibrasActive: getRawConfig("accessibility_vlibras") === "true",
          highContrastActive: getRawConfig("accessibility_high_contrast") === "true"
        }
      };
    } catch (error) {
      throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar configura\xE7\xF5es." });
    }
  }),
  /**
   * 💾 ATUALIZAR ACESSIBILIDADE E GERAL
   */
  update: adminProcedure.input(z18.any()).mutation(async ({ ctx, input }) => {
    try {
      const db2 = await getDb();
      const { accessibility, ...storeData } = input;
      await updateStoreSettings(storeData);
      if (accessibility) {
        await upsertConfig(db2, "accessibility_vlibras", String(accessibility.vLibrasActive));
        await upsertConfig(db2, "accessibility_high_contrast", String(accessibility.highContrastActive));
      }
      await logAction(ctx, "UPDATE_SETTINGS", "settings", { entityId: "global", new: input });
      return { success: true };
    } catch (error) {
      throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao salvar." });
    }
  }),
  /**
   * 📈 STATUS DO PROGRESSO (Para o Frontend)
   */
  getExportStatus: adminProcedure.query(() => {
    return exportProgress;
  }),
  /**
   * 📦 EXPORTAÇÃO COM BARRA DE PROGRESSO
   */
  exportKernel: adminProcedure.mutation(async ({ ctx }) => {
    const { execSync: execSync2 } = await import("child_process");
    const fs2 = await import("fs");
    const path3 = await import("path");
    const AdmZip = (await import("adm-zip")).default;
    try {
      exportProgress = { percent: 10, status: "\u{1F680} Iniciando build e exporta\xE7\xE3o..." };
      try {
        execSync2("npm run build", { stdio: "ignore", timeout: 3e5 });
        exportProgress = { percent: 40, status: "\u{1F6E0}\uFE0F Build conclu\xEDdo, zipando arquivos..." };
      } catch (e) {
        exportProgress = { percent: 40, status: "\u26A0\uFE0F Build ignorado, coletando dist atual..." };
      }
      const zip = new AdmZip();
      const rootDir = process.cwd();
      const distPath = path3.join(rootDir, "dist");
      if (fs2.existsSync(distPath)) {
        zip.addLocalFolder(distPath, "dist");
        exportProgress = { percent: 70, status: "\u{1F4E6} Pasta /dist adicionada..." };
      }
      ["package.json", "package-lock.json", "ecosystem.config.cjs", ".env"].forEach((f) => {
        const filePath = path3.join(rootDir, f);
        if (fs2.existsSync(filePath)) zip.addLocalFile(filePath);
      });
      exportProgress = { percent: 90, status: "\u{1F510} Finalizando compress\xE3o..." };
      const buffer = zip.toBuffer();
      await logAction(ctx, "EXPORT_KERNEL", "system", { entityId: "dist.zip" });
      exportProgress = { percent: 100, status: "\u{1F3C1} Pronto para download!" };
      return {
        base64: buffer.toString("base64"),
        filename: `kernel-deploy-${Date.now()}.zip`
      };
    } catch (err) {
      exportProgress = { percent: 0, status: "\u274C Erro na exporta\xE7\xE3o" };
      throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }
  }),
  /**
   * 🏢 SALVAR INFO DA EMPRESA
   */
  saveCompanyInfo: adminProcedure.input(z18.any()).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const encryptedValue = encrypt(JSON.stringify(input));
    if (!encryptedValue) throw new Error("Erro na criptografia");
    await upsertConfig(db2, "company_social_info", encryptedValue);
    await logAction(ctx, "UPDATE_COMPANY_INFO", "app_configs", { entityId: "company_info" });
    return { success: true };
  }),
  /**
   * 🔐 CONFIG GOOGLE
   */
  saveGoogleConfig: adminProcedure.input(z18.object({
    enabled: z18.boolean(),
    clientId: z18.string().min(1),
    clientSecret: z18.string().min(1)
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const encryptedValue = encrypt(JSON.stringify(input));
    if (!encryptedValue) throw new Error("Erro na criptografia");
    await upsertConfig(db2, "google_auth_credentials", encryptedValue);
    await logAction(ctx, "UPDATE_GOOGLE_AUTH", "app_configs", { entityId: "google_auth" });
    return { success: true };
  }),
  /**
   * 💾 BACKUP SQL
   */
  downloadBackup: adminProcedure.mutation(async ({ ctx }) => {
    const sqlContent = await generateDatabaseBackup();
    await logAction(ctx, "DATABASE_BACKUP", "system", { entityId: "mysql" });
    return { sql: sqlContent, filename: `backup_${Date.now()}.sql` };
  }),
  /**
   * 📥 UPGRADE SYSTEM (IMPLANTAÇÃO)
   */
  upgradeSystem: adminProcedure.input(z18.object({ fileBase64: z18.string() })).mutation(async ({ ctx, input }) => {
    try {
      const fs2 = await import("fs");
      const path3 = await import("path");
      const { exec } = await import("child_process");
      const buffer = Buffer.from(input.fileBase64, "base64");
      const uploadPath = path3.join(process.cwd(), "update_package.zip");
      fs2.writeFileSync(uploadPath, buffer);
      await logAction(ctx, "UPGRADE_SYSTEM", "system", { entityId: "kernel_zip" });
      const deployCommand = "unzip -o update_package.zip && npm install --production && (sleep 2 && pm2 restart gourmet-novo &)";
      exec(deployCommand, (error) => {
        if (error) console.error("\u274C [DEPLOY ERROR]:", error.message);
      });
      return { success: true };
    } catch (error) {
      throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "Falha no deploy: " + error.message });
    }
  })
});

// server/routers/admin/shipping.ts
init_db();
init_schema();
import { z as z19 } from "zod";
import { eq as eq22, asc as asc7, and as and6, gte as gte3, lte as lte2 } from "drizzle-orm";
import { TRPCError as TRPCError13 } from "@trpc/server";
var adminShippingRouter = router({
  // --- 🏪 CONFIGURAÇÕES DE RETIRADA (PICKUP) ---
  getSettings: adminProcedure.query(async () => {
    const db2 = await getDb();
    const settings = await db2.select().from(shippingSettings).limit(1);
    if (settings.length === 0) {
      return { pickupEnabled: false, pickupLabel: "Retirada no Balc\xE3o", pickupInstruction: "" };
    }
    return {
      ...settings[0],
      pickupEnabled: Boolean(settings[0].pickupEnabled),
      pickupLabel: settings[0].pickupLabel || "Retirada no Balc\xE3o",
      pickupInstruction: settings[0].pickupInstruction || ""
    };
  }),
  updateSettings: adminProcedure.input(z19.object({
    pickupEnabled: z19.boolean(),
    pickupLabel: z19.string().min(1),
    pickupInstruction: z19.string().optional().nullable()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const existing = await db2.select().from(shippingSettings).limit(1);
    const data = {
      // ✅ CORREÇÃO: Passando boolean diretamente (o Drizzle converte para o driver)
      pickupEnabled: input.pickupEnabled,
      pickupLabel: input.pickupLabel,
      pickupInstruction: input.pickupInstruction || ""
    };
    if (existing.length > 0) {
      await db2.update(shippingSettings).set(data).where(eq22(shippingSettings.id, existing[0].id));
    } else {
      await db2.insert(shippingSettings).values({ id: "default", ...data });
    }
    await logAction(ctx, "UPDATE_SHIPPING_SETTINGS", "shipping", { new: input });
    return { success: true };
  }),
  // --- 🚚 REGRAS DE ENTREGA ---
  getRules: adminProcedure.query(async () => {
    const db2 = await getDb();
    const rules = await db2.select().from(shippingRules).orderBy(asc7(shippingRules.name));
    return rules.map((rule) => ({
      ...rule,
      price: Number(rule.price || 0),
      active: Boolean(rule.active),
      startZipCode: rule.cepStart || "",
      endZipCode: rule.cepEnd || "",
      description: rule.name || ""
    }));
  }),
  upsertRule: adminProcedure.input(z19.object({
    id: z19.number().optional(),
    description: z19.string().min(1),
    startZipCode: z19.string().length(8),
    endZipCode: z19.string().length(8),
    price: z19.number().min(0),
    active: z19.boolean().default(true)
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const data = {
      name: input.description,
      type: "zipcode",
      cepStart: input.startZipCode.replace(/\D/g, ""),
      cepEnd: input.endZipCode.replace(/\D/g, ""),
      price: input.price.toString(),
      // ✅ CORREÇÃO: Usando boolean diretamente em vez de 1/0
      active: input.active
    };
    try {
      if (input.id) {
        await db2.update(shippingRules).set(data).where(eq22(shippingRules.id, input.id));
        await logAction(ctx, "UPDATE_SHIPPING_RULE", "shipping", { entityId: String(input.id), new: data });
      } else {
        await db2.insert(shippingRules).values(data);
        await logAction(ctx, "CREATE_SHIPPING_RULE", "shipping", { new: data });
      }
      return { success: true };
    } catch (error) {
      console.error("ERRO_UPSERT_SHIPPING:", error);
      throw new TRPCError13({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao salvar regra de frete." });
    }
  }),
  deleteRule: adminProcedure.input(z19.object({ id: z19.number() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    await db2.delete(shippingRules).where(eq22(shippingRules.id, input.id));
    await logAction(ctx, "DELETE_SHIPPING_RULE", "shipping", { entityId: String(input.id) });
    return { success: true };
  }),
  // --- 🧮 CÁLCULO PÚBLICO (CHECKOUT) ---
  calculate: publicProcedure.input(z19.object({
    cep: z19.string()
  })).query(async ({ input }) => {
    const db2 = await getDb();
    const cepClean = input.cep.replace(/\D/g, "").substring(0, 8);
    const [settings] = await db2.select().from(shippingSettings).limit(1);
    const matchedRules = await db2.select().from(shippingRules).where(
      and6(
        // ✅ CORREÇÃO: Comparação usando boolean diretamente
        eq22(shippingRules.active, true),
        eq22(shippingRules.type, "zipcode"),
        lte2(shippingRules.cepStart, cepClean),
        gte3(shippingRules.cepEnd, cepClean)
      )
    ).limit(1);
    return {
      pickup: settings ? {
        enabled: Boolean(settings.pickupEnabled),
        label: settings.pickupLabel,
        instruction: settings.pickupInstruction
      } : null,
      delivery: matchedRules.length > 0 ? {
        price: Number(matchedRules[0].price || 0),
        name: matchedRules[0].name
      } : null
    };
  })
});

// server/routers/admin/showcase.ts
init_db();
init_schema();
import { z as z20 } from "zod";
import { eq as eq23, asc as asc8 } from "drizzle-orm";
var adminShowcaseRouter = router({
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(showcases).orderBy(asc8(showcases.order));
  }),
  // Cria uma nova vitrine
  create: adminProcedure.input(z20.object({
    title: z20.string().min(1),
    description: z20.string().optional(),
    active: z20.boolean().default(true),
    order: z20.number().default(0)
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [result] = await db2.insert(showcases).values(input);
    await logAction(ctx, "CREATE_SHOWCASE", "showcase", { new: input });
    return { id: result.insertId };
  }),
  // Deleta uma vitrine
  delete: adminProcedure.input(z20.object({ id: z20.number() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    await db2.delete(showcases).where(eq23(showcases.id, input.id));
    await logAction(ctx, "DELETE_SHOWCASE", "showcase", { entityId: String(input.id) });
    return { success: true };
  })
});

// server/routers/admin/automation.routes.ts
init_loyalty();
init_db();
import { sql as sql14 } from "drizzle-orm";
async function runLoyaltyExpirationLogic() {
  const db2 = await getDb();
  let processedCount = 0;
  const settings = await db2.query.loyaltySettings.findFirst();
  if (!settings || !settings.enabled) {
    throw new Error("Sistema de fidelidade desativado.");
  }
  const expirationDays = settings.pointsExpirationDays || 365;
  const cutoffDate = /* @__PURE__ */ new Date();
  cutoffDate.setDate(cutoffDate.getDate() - expirationDays);
  const formattedDate = cutoffDate.toISOString().slice(0, 19).replace("T", " ");
  await db2.transaction(async (tx) => {
    const toExpire = await tx.execute(sql14`
      SELECT user_id, SUM(points_change) as total 
      FROM loyalty_history 
      WHERE created_at < ${formattedDate} AND type = 'earned'
      GROUP BY user_id
    `);
    const rows = toExpire[0] || [];
    for (const row of rows) {
      if (Number(row.total) > 0) {
        await tx.insert(loyaltyHistory).values({
          id: `exp_${Date.now()}_${row.user_id.slice(0, 8)}`,
          userId: row.user_id,
          pointsChange: -Number(row.total),
          reason: "Expira\xE7\xE3o Autom\xE1tica",
          type: "expired"
        });
        processedCount++;
      }
    }
  });
  return { processedCount };
}
var loyaltyAdminRouter = router({
  runManualExpiration: adminProcedure.mutation(async () => {
    console.log("--- [ADMIN] Execu\xE7\xE3o manual disparada ---");
    const result = await runLoyaltyExpirationLogic();
    return {
      success: true,
      processedUsers: result.processedCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  })
});

// server/routers/admin/mail.ts
import { z as z21 } from "zod";
init_mailer();
init_schema();
init_db();
import { eq as eq24 } from "drizzle-orm";
var mailAdminRouter = router({
  /**
   * 📥 GET CONFIGS
   * Carrega todas as configurações de e-mail e SMTP do banco
   */
  getConfigs: protectedProcedure.query(async () => {
    const db2 = await getDb();
    const configs = await db2.select().from(appConfigs);
    return configs.filter(
      (c) => c.configKey.startsWith("smtp_") || c.configKey.startsWith("email_")
    );
  }),
  /**
   * 💾 SAVE CONFIGS
   * Salva ou atualiza as configurações (Upsert)
   */
  saveConfigs: protectedProcedure.input(z21.array(z21.object({
    configKey: z21.string(),
    configValue: z21.string()
  }))).mutation(async ({ input }) => {
    const db2 = await getDb();
    for (const item of input) {
      const [exists] = await db2.select().from(appConfigs).where(eq24(appConfigs.configKey, item.configKey)).limit(1);
      if (exists) {
        await db2.update(appConfigs).set({ configValue: item.configValue }).where(eq24(appConfigs.configKey, item.configKey));
      } else {
        await db2.insert(appConfigs).values({
          configKey: item.configKey,
          configValue: item.configValue
        });
      }
    }
    return { success: true };
  }),
  /**
   * 🧪 TEST CONNECTION
   * Envia um e-mail de teste rápido para validar as credenciais SMTP
   */
  testConnection: protectedProcedure.input(z21.object({ to: z21.string().email() })).mutation(async ({ input }) => {
    const { transporter, from } = await mailer.getTransport();
    await transporter.sendMail({
      from: `"Teste de Sistema" <${from}>`,
      to: input.to,
      subject: "Teste de Conex\xE3o SMTP \u{1F680}",
      html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h1 style="color: #059669;">Conex\xE3o Bem-Sucedida!</h1>
            <p>Se voc\xEA recebeu este e-mail, suas configura\xE7\xF5es de SMTP est\xE3o funcionando corretamente.</p>
            <p style="color: #64748b; font-size: 12px;">Data do teste: ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")}</p>
          </div>
        `
    });
    return { success: true };
  })
});

// server/routers/admin/index.ts
var adminRouter = router({
  analytics: adminAnalyticsRouter,
  logs: adminLogsRouter,
  media: adminMediaRouter,
  marketing: adminMarketingRouter,
  loyaltySettings: adminLoyaltySettingsRouter,
  coupons: adminCouponsRouter2,
  discountRules: adminDiscountRulesRouter,
  finance: adminFinanceRouter,
  paymentMethods: adminPaymentMethodsRouter2,
  loyalty: loyaltyAdminRouter,
  // Gestão de Cardápio
  categories: adminCategoriesRouter,
  nutrition: adminNutritionRouter,
  packages: adminPackagesRouter,
  dishes: adminDishesRouter,
  sizes: adminSizesRouter,
  accompaniments: adminAccompanimentsRouter,
  // Vitrines
  showcases: adminShowcaseRouter,
  // Gestão de Usuários e Pedidos
  users: usersAdminRouter,
  orders: ordersAdminRouter,
  // ✅ Aqui o trpc vincula toda a lógica de pedidos
  /**
   * ✅ ROTA DE COMUNICAÇÃO (E-MAIL)
   */
  mail: mailAdminRouter,
  // Configurações Globais
  settings: adminSettingsRouter,
  storeSettings: adminSettingsRouter,
  shipping: adminShippingRouter
  // ❌ REMOVIDO: userName: safeDecrypt(...) 
  // Essa linha causaria erro de compilação aqui. 
  // A descriptografia deve ser feita dentro do ordersAdminRouter.
});

// server/routers/storefront/cart/index.ts
import { z as z24 } from "zod";
init_schema();
import { eq as eq29, and as and11, or as or7, desc as desc17 } from "drizzle-orm";
import crypto5 from "crypto";
import { TRPCError as TRPCError16 } from "@trpc/server";

// server/routers/storefront/cart/items.ts
import { z as z22 } from "zod";
init_schema();
import { eq as eq27, and as and9, or as or6, desc as desc16 } from "drizzle-orm";
import crypto4 from "crypto";
import { TRPCError as TRPCError14 } from "@trpc/server";

// server/routers/storefront/cart/logic.ts
init_schema();
import { eq as eq26, asc as asc9 } from "drizzle-orm";

// server/loyalty.ts
init_db();
init_schema();
import { eq as eq25, desc as desc15, like as like7, or as or5, count as count4, and as and7, sum as sum3, sql as sql15 } from "drizzle-orm";
async function getUserPoints(userId) {
  const db2 = await getDb();
  if (!db2) return { current_points: 0, lifetime_points: 0 };
  try {
    const history = await db2.select().from(loyaltyHistory).where(eq25(loyaltyHistory.userId, userId));
    let current = 0;
    let lifetime = 0;
    history.forEach((row) => {
      const p = Number(row.pointsChange) || 0;
      current += p;
      if (p > 0) lifetime += p;
    });
    return {
      current_points: current,
      lifetime_points: lifetime,
      points: current,
      // Nome comum
      balance: current,
      // Nome comum
      total: current
      // Nome comum
    };
  } catch (error) {
    return { current_points: 0, lifetime_points: 0 };
  }
}

// server/routers/storefront/cart/logic.ts
function safeFloat(val) {
  if (val === null || val === void 0 || val === "") return 0;
  if (typeof val === "number") return val;
  let str = String(val).trim().replace("R$", "").trim();
  if (str.includes(",")) str = str.replace(/\./g, "").replace(",", ".");
  const num2 = parseFloat(str);
  return isNaN(num2) ? 0 : num2;
}
async function syncCartState(db2, cartId, userId) {
  try {
    const [cart] = await db2.select().from(carts).where(eq26(carts.id, cartId)).limit(1);
    if (!cart) return null;
    const activeUserId = userId || cart.userId || null;
    const itemsRaw = await db2.select().from(cartItems).where(eq26(cartItems.cartId, cartId));
    let subtotal = 0;
    const items = itemsRaw.map((item) => {
      const price = safeFloat(item.unitPrice ?? 0);
      const qty = parseInt(String(item.quantity || 0), 10);
      subtotal += price * qty;
      let optionsParsed = {};
      try {
        optionsParsed = typeof item.options === "string" ? JSON.parse(item.options) : item.options || {};
      } catch (e) {
        optionsParsed = {};
      }
      let nutritionParsed = {};
      try {
        nutritionParsed = typeof item.appliedNutrition === "string" ? JSON.parse(item.appliedNutrition) : item.appliedNutrition || {};
      } catch (e) {
        nutritionParsed = {};
      }
      return {
        ...item,
        unitPrice: price,
        quantity: qty,
        totalPrice: price * qty,
        options: optionsParsed,
        appliedNutrition: nutritionParsed
      };
    });
    let autoDiscount = 0;
    const rules = await db2.select().from(discountRules).where(eq26(discountRules.isActive, true)).orderBy(asc9(discountRules.minQuantity));
    const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
    const applicableRule = [...rules].reverse().find((r) => totalQty >= (r.minQuantity || 0));
    if (applicableRule) {
      autoDiscount = subtotal * (safeFloat(applicableRule.discountValue) / 100);
    }
    let couponDiscount = 0;
    if (cart.couponCode) {
      const [dbCoupon] = await db2.select().from(coupons).where(eq26(coupons.code, cart.couponCode)).limit(1);
      if (dbCoupon) {
        const dVal = safeFloat(dbCoupon.discountValue);
        const isPercent = String(dbCoupon.discountType).toLowerCase().includes("percent");
        const baseCalc = Math.max(0, subtotal - autoDiscount);
        couponDiscount = isPercent ? baseCalc * (dVal / 100) : dVal;
      }
    }
    let loyaltyDiscount = 0;
    const isLoyaltyActive = cart.usesLoyalty === true || cart.usesLoyalty === 1 || String(cart.usesLoyalty) === "true";
    if (isLoyaltyActive && activeUserId) {
      try {
        const loyaltyData = await getUserPoints(activeUserId);
        const points = Number(loyaltyData?.current_points || loyaltyData?.points || 0);
        if (points > 0) {
          const [settings] = await db2.select().from(loyaltySettings).limit(1);
          if (settings) {
            const pointsReq = safeFloat(settings.redemptionRatePoints) || 100;
            const moneyVal = safeFloat(settings.redemptionRateMoney) || 1;
            let potentialDiscount = points / pointsReq * moneyVal;
            const maxD = safeFloat(settings.maxDiscountAmount);
            if (maxD > 0 && potentialDiscount > maxD) potentialDiscount = maxD;
            const currentBill = Math.max(0, subtotal - autoDiscount - couponDiscount);
            loyaltyDiscount = Math.min(potentialDiscount, currentBill);
          }
        }
      } catch (err) {
        console.error("[LOYALTY-ERROR]", err);
        loyaltyDiscount = 0;
      }
    }
    const shipping = safeFloat(cart.shippingValue);
    const totalDiscounts = autoDiscount + couponDiscount + loyaltyDiscount;
    const finalTotal = Math.max(0, subtotal + shipping - totalDiscounts);
    const totals = {
      subtotal: Number(subtotal.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      autoDiscount: Number(autoDiscount.toFixed(2)),
      couponDiscount: Number(couponDiscount.toFixed(2)),
      loyaltyDiscount: Number(loyaltyDiscount.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
      final: Number(finalTotal.toFixed(2)),
      couponCode: cart.couponCode || null
    };
    await db2.update(carts).set({
      discountsJson: JSON.stringify({
        totals,
        autoDiscountName: applicableRule?.name || null
      }),
      discountValue: totals.totalDiscounts.toString(),
      // ✅ Sincroniza o userId no carrinho se ele ainda não tiver dono
      userId: cart.userId ? cart.userId : activeUserId,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq26(carts.id, cartId));
    return {
      cartId,
      totals,
      items,
      usesLoyalty: isLoyaltyActive,
      autoDiscountName: applicableRule?.name || null
    };
  } catch (error) {
    console.error("\u274C Erro em syncCartState:", error);
    return null;
  }
}

// server/routers/storefront/cart/items.ts
var safeFloat2 = (v) => {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
};
var cartItemsRouter = router({
  addItem: publicProcedure.input(z22.object({
    dishId: z22.union([z22.string(), z22.number()]).optional().nullable(),
    packageId: z22.union([z22.string(), z22.number()]).optional().nullable(),
    quantity: z22.number().min(1),
    totalUnitPrice: z22.number().optional().nullable(),
    optionsPayload: z22.any().optional().nullable(),
    nutritionPayload: z22.any().optional().nullable(),
    cartId: z22.string().optional().nullable(),
    guestSessionId: z22.string().optional().nullable()
  })).mutation(async ({ input, ctx }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = input.guestSessionId || ctx.guestId;
    if (!userId && !guestId) {
      throw new TRPCError14({
        code: "BAD_REQUEST",
        message: "Identifica\xE7\xE3o de visitante ausente. Tente recarregar a p\xE1gina."
      });
    }
    const optionsClean = input.optionsPayload ? { ...input.optionsPayload } : {};
    const nutritionToSave = input.nutritionPayload ?? optionsClean?.appliedNutrition ?? null;
    if (optionsClean.appliedNutrition) {
      delete optionsClean.appliedNutrition;
    }
    let finalDishId = null;
    let finalPackageId = null;
    const isPackage = !!(optionsClean.packageName || optionsClean.meals || input.packageId);
    if (isPackage) {
      const rawId = input.packageId || input.dishId;
      finalPackageId = rawId ? String(rawId) : null;
    } else {
      finalDishId = input.dishId ? String(input.dishId) : null;
    }
    let currentCartId = input.cartId;
    if (!currentCartId) {
      const searchCondition = userId ? eq27(carts.userId, userId) : eq27(carts.guestId, guestId);
      const [existing] = await db2.select().from(carts).where(
        and9(
          searchCondition,
          or6(eq27(carts.status, "open"), eq27(carts.status, "active"))
        )
      ).orderBy(desc16(carts.updatedAt)).limit(1);
      if (existing) {
        currentCartId = String(existing.id);
      } else {
        const newId = crypto4.randomUUID();
        await db2.insert(carts).values({
          id: newId,
          userId,
          // ✅ Salva explicitamente no guestId para garantir a persistência anônima
          guestId: userId ? null : guestId,
          sessionId: guestId,
          // Mantido para compatibilidade legado
          status: "active"
        });
        currentCartId = newId;
      }
    }
    let baseItem = null;
    if (finalPackageId) {
      const [pkg] = await db2.select().from(packages).where(eq27(packages.id, finalPackageId)).limit(1);
      baseItem = pkg;
    } else if (finalDishId) {
      const [dish] = await db2.select().from(dishes).where(eq27(dishes.id, finalDishId)).limit(1);
      baseItem = dish;
    }
    if (!baseItem) throw new TRPCError14({ code: "NOT_FOUND", message: "Produto n\xE3o encontrado." });
    const unitPrice = safeFloat2(input.totalUnitPrice ?? optionsClean?.totalUnitPrice ?? baseItem.price ?? 0);
    const newItemId = crypto4.randomUUID();
    const optionsString = JSON.stringify(optionsClean);
    await db2.insert(cartItems).values({
      id: newItemId,
      cartId: currentCartId,
      dishId: finalDishId,
      packageId: finalPackageId,
      quantity: input.quantity,
      unitPrice: String(unitPrice),
      name: optionsClean.packageName || optionsClean.dishName || baseItem.name || "Item",
      imageUrl: baseItem.imageUrl || baseItem.image || null,
      options: optionsString,
      appliedNutrition: nutritionToSave ? JSON.stringify(nutritionToSave) : null,
      accompaniments: optionsString
    });
    return await syncCartState(db2, currentCartId, userId || void 0);
  }),
  removeItem: publicProcedure.input(z22.object({ cartItemId: z22.string() })).mutation(async ({ ctx, input }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const [item] = await db2.select().from(cartItems).where(eq27(cartItems.id, input.cartItemId)).limit(1);
    if (!item) throw new TRPCError14({ code: "NOT_FOUND", message: "Item n\xE3o encontrado." });
    await db2.delete(cartItems).where(eq27(cartItems.id, input.cartItemId));
    return await syncCartState(db2, item.cartId, userId || void 0);
  }),
  updateQuantity: publicProcedure.input(z22.object({ cartItemId: z22.string(), quantity: z22.number().min(1) })).mutation(async ({ ctx, input }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const [item] = await db2.select().from(cartItems).where(eq27(cartItems.id, input.cartItemId)).limit(1);
    if (!item) throw new TRPCError14({ code: "NOT_FOUND", message: "Item n\xE3o encontrado." });
    await db2.update(cartItems).set({ quantity: input.quantity }).where(eq27(cartItems.id, input.cartItemId));
    return await syncCartState(db2, item.cartId, userId || void 0);
  })
});

// server/routers/storefront/cart/rewards.ts
import { z as z23 } from "zod";
init_schema();
import { eq as eq28, and as and10 } from "drizzle-orm";
init_db();
import { TRPCError as TRPCError15 } from "@trpc/server";
var cartRewardsRouter = router({
  // 1. APLICAR CUPOM
  applyCoupon: publicProcedure.input(z23.object({
    cartId: z23.string().uuid(),
    code: z23.string().min(1)
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database unavailable");
    const [coupon] = await db2.select().from(coupons).where(
      and10(
        eq28(coupons.code, input.code.toUpperCase()),
        eq28(coupons.isActive, true)
      )
    ).limit(1);
    if (!coupon) {
      throw new TRPCError15({
        code: "NOT_FOUND",
        message: "Cupom inv\xE1lido ou expirado."
      });
    }
    await db2.update(carts).set({
      couponCode: coupon.code,
      couponId: coupon.id,
      discountValue: String(coupon.discountValue || "0"),
      discountType: coupon.discountType,
      discount_type: coupon.discountType
    }).where(eq28(carts.id, input.cartId));
    const targetUserId = ctx.user?.id;
    return await syncCartState(db2, input.cartId, targetUserId ? String(targetUserId) : void 0);
  }),
  // 2. REMOVER CUPOM
  removeCoupon: publicProcedure.input(z23.object({ cartId: z23.string().uuid() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database unavailable");
    await db2.update(carts).set({
      couponCode: null,
      couponId: null,
      discountValue: "0",
      discountType: "fixed",
      discount_type: "fixed"
    }).where(eq28(carts.id, input.cartId));
    const targetUserId = ctx.user?.id;
    return await syncCartState(db2, input.cartId, targetUserId ? String(targetUserId) : void 0);
  }),
  // 3. ALTERNAR USO DE PONTOS (Fidelidade)
  toggleLoyalty: publicProcedure.input(z23.object({
    cartId: z23.string().uuid(),
    active: z23.boolean()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database unavailable");
    await db2.update(carts).set({
      usesLoyalty: input.active,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq28(carts.id, input.cartId));
    const targetUserId = ctx.user?.id;
    return await syncCartState(db2, input.cartId, targetUserId ? String(targetUserId) : void 0);
  })
});

// server/routers/storefront/cart/index.ts
var cartRouter = router({
  // 🔗 Sub-roteadores
  items: cartItemsRouter,
  // Adicionar/Remover itens
  applyCoupon: cartRewardsRouter.applyCoupon,
  removeCoupon: cartRewardsRouter.removeCoupon,
  /**
   * ✅ ATIVAR/DESATIVAR FIDELIDADE
   * Alterna o uso de pontos e recalcula o total instantaneamente.
   */
  toggleLoyalty: publicProcedure.input(z24.object({
    cartId: z24.string().optional(),
    active: z24.boolean()
  })).mutation(async ({ ctx, input }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId;
    let targetCartId = input.cartId;
    if (!targetCartId) {
      const searchCondition = userId ? eq29(carts.userId, userId) : guestId ? eq29(carts.guestId, guestId) : null;
      if (!searchCondition) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "Sem identifica\xE7\xE3o de sess\xE3o" });
      }
      const [cart] = await db2.select().from(carts).where(
        and11(
          or7(eq29(carts.status, "active"), eq29(carts.status, "open")),
          searchCondition
        )
      ).orderBy(desc17(carts.updatedAt)).limit(1);
      if (!cart) throw new TRPCError16({ code: "NOT_FOUND", message: "Carrinho n\xE3o encontrado" });
      targetCartId = cart.id;
    }
    await db2.update(carts).set({
      usesLoyalty: input.active,
      // Agora é boolean direto no schema
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq29(carts.id, targetCartId));
    return await syncCartState(db2, targetCartId, userId || void 0);
  }),
  /**
   * 🛒 OBTER RESUMO DO CARRINHO (GetSummary)
   * A rota principal que o frontend chama para renderizar a sacola.
   */
  getSummary: publicProcedure.query(async ({ ctx }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId;
    if (!userId && !guestId) {
      return null;
    }
    const searchCondition = userId ? eq29(carts.userId, userId) : eq29(carts.guestId, guestId);
    let [cart] = await db2.select().from(carts).where(
      and11(
        or7(eq29(carts.status, "active"), eq29(carts.status, "open")),
        searchCondition
      )
    ).orderBy(desc17(carts.updatedAt)).limit(1);
    if (!cart) {
      const newCartId = crypto5.randomUUID();
      await db2.insert(carts).values({
        id: newCartId,
        // Se tiver logado, vincula ao User. Se não, vincula ao GuestId
        userId: userId || null,
        guestId: userId ? null : guestId,
        sessionId: guestId,
        // Mantemos sessionId preenchido para compatibilidade legado
        status: "active"
      });
      [cart] = await db2.select().from(carts).where(eq29(carts.id, newCartId)).limit(1);
    }
    if (!cart) throw new TRPCError16({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao inicializar carrinho." });
    if (userId && !cart.userId && cart.guestId === guestId) {
      await db2.update(carts).set({ userId, guestId: null }).where(eq29(carts.id, cart.id));
      cart.userId = userId;
    }
    const result = await syncCartState(db2, cart.id, userId || void 0);
    return {
      ...result,
      cart
    };
  }),
  /**
   * 🆔 CRIAR OU RETOMAR CARRINHO (Usado no Login/Merge explícito)
   */
  getOrCreateCart: publicProcedure.mutation(async ({ ctx }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId;
    if (!userId && !guestId) {
      throw new TRPCError16({ code: "BAD_REQUEST", message: "Visitante n\xE3o identificado." });
    }
    const searchCondition = userId ? eq29(carts.userId, userId) : eq29(carts.guestId, guestId);
    let [cart] = await db2.select().from(carts).where(
      and11(
        eq29(carts.status, "active"),
        searchCondition
      )
    ).orderBy(desc17(carts.updatedAt)).limit(1);
    if (!cart) {
      const newCartId = crypto5.randomUUID();
      await db2.insert(carts).values({
        id: newCartId,
        userId: userId || null,
        guestId: userId ? null : guestId,
        sessionId: guestId,
        status: "active"
      });
      return { cartId: newCartId };
    }
    if (userId && !cart.userId) {
      await db2.update(carts).set({ userId, guestId: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq29(carts.id, cart.id));
    }
    return { cartId: cart.id };
  })
});

// server/routers/storefront/auth.ts
init_schema();
init_db();
import { z as z25 } from "zod";
import { hash, verify } from "@node-rs/argon2";
import { eq as eq31, and as and13, gt } from "drizzle-orm";
import { TRPCError as TRPCError17 } from "@trpc/server";

// server/auth.ts
init_db();
init_schema();
import { Lucia } from "lucia";
import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { eq as eq30, and as and12, isNull, or as or8 } from "drizzle-orm";
var db = await getDb();
var adapter = new DrizzleMySQLAdapter(db, sessions, authUsers);
var lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name ?? "",
      role: attributes.role ?? "customer"
    };
  }
});
async function promoteCart(guestSessionId, userId) {
  if (!guestSessionId || guestSessionId === "undefined" || guestSessionId === "null") return;
  const userIdStr = String(userId);
  try {
    const db2 = await getDb();
    if (!db2) return;
    const userCart = await db2.query.carts.findFirst({
      where: and12(eq30(carts.userId, userIdStr), eq30(carts.status, "active"))
    });
    const guestCart = await db2.query.carts.findFirst({
      where: and12(
        or8(eq30(carts.guestId, guestSessionId), eq30(carts.sessionId, guestSessionId)),
        eq30(carts.status, "active")
      )
    });
    if (!guestCart) return;
    if (userCart && userCart.id !== guestCart.id) {
      const guestItems = await db2.select().from(cartItems).where(eq30(cartItems.cartId, guestCart.id));
      for (const item of guestItems) {
        const [duplicate] = await db2.select().from(cartItems).where(
          and12(
            eq30(cartItems.cartId, userCart.id),
            item.dishId ? eq30(cartItems.dishId, item.dishId) : isNull(cartItems.dishId),
            item.packageId ? eq30(cartItems.packageId, item.packageId) : isNull(cartItems.packageId)
          )
        );
        if (duplicate) {
          const newQty = Number(duplicate.quantity || 0) + Number(item.quantity || 0);
          await db2.update(cartItems).set({ quantity: newQty }).where(eq30(cartItems.id, duplicate.id));
          await db2.delete(cartItems).where(eq30(cartItems.id, item.id));
        } else {
          await db2.update(cartItems).set({ cartId: userCart.id }).where(eq30(cartItems.id, item.id));
        }
      }
      await db2.delete(carts).where(eq30(carts.id, guestCart.id));
    } else if (guestCart && !userCart) {
      await db2.update(carts).set({
        userId: userIdStr,
        guestId: null,
        // Limpa para indicar que agora é um carrinho de usuário real
        sessionId: null,
        status: "active",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq30(carts.id, guestCart.id));
    }
  } catch (error) {
    console.error("\u274C [CART-ERROR] Erro ao promover carrinho:", error);
  }
}

// server/routers/storefront/auth.ts
init_encryption();
import crypto6 from "node:crypto";
function unseal2(val) {
  if (!val) return "";
  try {
    const str = String(val);
    if (str.split(":").length !== 3) return str;
    const decrypted = decrypt(str);
    return decrypted || str;
  } catch {
    return String(val);
  }
}
var authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user || !ctx.session) return null;
    try {
      const db2 = await getDb();
      const profile = await db2.query.users.findFirst({
        where: eq31(users.id, ctx.user.id)
      });
      if (!profile) return ctx.user;
      return {
        ...ctx.user,
        name: unseal2(profile.name),
        customerDocument: unseal2(profile.customerDocument),
        phone: unseal2(profile.phone),
        email: profile.email,
        role: profile.role || ctx.user.role || "user"
      };
    } catch (error) {
      return ctx.user;
    }
  }),
  login: publicProcedure.input(z25.object({
    identifier: z25.string().email(),
    password: z25.string(),
    guestSessionId: z25.string().nullish()
  })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    const [existingAuth] = await db2.select().from(authUsers).where(eq31(authUsers.email, input.identifier.toLowerCase())).limit(1);
    if (!existingAuth) throw new TRPCError17({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const validPassword = await verify(existingAuth.password, input.password);
    if (!validPassword) throw new TRPCError17({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const session = await lucia.createSession(existingAuth.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    if (ctx.res) ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
    if (input.guestSessionId) {
      promoteCart(input.guestSessionId, existingAuth.id).catch(console.error);
    }
    return { success: true };
  }),
  register: publicProcedure.input(z25.object({
    name: z25.string().min(2),
    email: z25.string().email(),
    password: z25.string().min(6),
    cpf: z25.string().transform((v) => v.replace(/\D/g, "")),
    whatsapp: z25.string().optional().nullish(),
    guestSessionId: z25.string().nullish()
  })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    const documentHash = piiHash(input.cpf);
    const nameIndex = piiHash(input.name.toLowerCase());
    if (!documentHash || !nameIndex) {
      throw new TRPCError17({ code: "INTERNAL_SERVER_ERROR", message: "Erro de seguran\xE7a." });
    }
    const [existingCpf] = await db2.select().from(users).where(eq31(users.documentIndex, documentHash)).limit(1);
    if (existingCpf) throw new TRPCError17({ code: "BAD_REQUEST", message: "Este CPF j\xE1 est\xE1 cadastrado." });
    const [existingEmail] = await db2.select().from(authUsers).where(eq31(authUsers.email, input.email.toLowerCase())).limit(1);
    if (existingEmail) throw new TRPCError17({ code: "BAD_REQUEST", message: "Este e-mail j\xE1 est\xE1 em uso." });
    const hashedPassword = await hash(input.password);
    const unifiedId = crypto6.randomUUID();
    const cleanPhone = input.whatsapp ? normalizeDigits(input.whatsapp) : null;
    try {
      await db2.transaction(async (tx) => {
        await tx.insert(users).values({
          id: unifiedId,
          email: input.email.toLowerCase(),
          name: encrypt(input.name),
          customerDocument: encrypt(input.cpf),
          phone: cleanPhone ? encrypt(cleanPhone) : null,
          nameIndex,
          documentIndex: documentHash,
          phoneIndex: cleanPhone ? piiHash(cleanPhone) : null,
          role: "user",
          loyaltyBalance: 0
        });
        await tx.insert(authUsers).values({
          id: unifiedId,
          email: input.email.toLowerCase(),
          password: hashedPassword,
          role: "user",
          loyaltyBalance: "0.00"
        });
      });
      const session = await lucia.createSession(unifiedId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      if (ctx.res) ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
      if (input.guestSessionId) {
        promoteCart(input.guestSessionId, unifiedId).catch(
          (err) => console.error("\u274C Erro no promoteCart background:", err)
        );
      }
      Promise.resolve().then(() => (init_mailer(), mailer_exports)).then(({ mailer: mailer2 }) => {
        mailer2.sendWelcomeEmail(input.email, input.name).catch(
          (err) => console.error("\u274C Erro envio e-mail background:", err)
        );
      }).catch(() => {
      });
      return { success: true };
    } catch (error) {
      if (error.message.includes("Lock wait timeout")) {
        throw new TRPCError17({ code: "TIMEOUT", message: "Servidor ocupado. Tente novamente." });
      }
      throw new TRPCError17({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar conta." });
    }
  }),
  requestPasswordReset: publicProcedure.input(z25.object({ email: z25.string().email() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const [userAuth] = await db2.select().from(authUsers).where(eq31(authUsers.email, input.email.toLowerCase())).limit(1);
    if (!userAuth) return { success: true };
    const [profile] = await db2.select().from(users).where(eq31(users.id, userAuth.id)).limit(1);
    const token = crypto6.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 36e5);
    await db2.update(authUsers).set({ resetToken: token, resetExpires: expires }).where(eq31(authUsers.id, userAuth.id));
    const baseUrl = process.env.VITE_APP_URL || "http://localhost:5173";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    const name = profile ? unseal2(profile.name) : "Cliente";
    Promise.resolve().then(() => (init_mailer(), mailer_exports)).then(({ mailer: mailer2 }) => {
      mailer2.sendPasswordReset(userAuth.email, name, resetLink).catch(console.error);
    }).catch(console.error);
    return { success: true };
  }),
  resetPassword: publicProcedure.input(z25.object({ token: z25.string(), password: z25.string().min(6) })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const [userAuth] = await db2.select().from(authUsers).where(and13(
      eq31(authUsers.resetToken, input.token),
      gt(authUsers.resetExpires, /* @__PURE__ */ new Date())
    )).limit(1);
    if (!userAuth) throw new TRPCError17({ code: "BAD_REQUEST", message: "Link inv\xE1lido." });
    const hashedPassword = await hash(input.password);
    await db2.update(authUsers).set({ password: hashedPassword, resetToken: null, resetExpires: null }).where(eq31(authUsers.id, userAuth.id));
    return { success: true };
  }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session) await lucia.invalidateSession(ctx.session.id);
    const blankCookie = lucia.createBlankSessionCookie();
    if (ctx.res) ctx.res.appendHeader("Set-Cookie", blankCookie.serialize());
    return { success: true };
  })
});

// server/routers/storefront/public.ts
init_schema();
init_db();
init_encryption();
import { eq as eq33, inArray as inArray2 } from "drizzle-orm";

// server/routers/storefront/products.ts
import { z as z26 } from "zod";
import { TRPCError as TRPCError18 } from "@trpc/server";
init_db();
init_catalog();
import { eq as eq32, and as and14, asc as asc10, sql as sql16, inArray } from "drizzle-orm";
var normalizeNutritionalInfo = (dish) => {
  if (!dish) return dish;
  return {
    ...dish,
    energyKcal: Number(dish.energyKcal || 0),
    proteins: Number(dish.proteins || 0),
    carbs: Number(dish.carbs || 0),
    fatTotal: Number(dish.fatTotal || 0),
    // Mantemos compatibilidade com o Drawer que pode esperar um objeto nutritionalInfo
    nutritionalInfo: {
      kcal: Number(dish.energyKcal || 0),
      proteins: Number(dish.proteins || 0),
      carbs: Number(dish.carbs || 0),
      fats: Number(dish.fatTotal || 0)
    }
  };
};
var productsRouter = router({
  // 1. Procedure de Listagem (Vitrines)
  list: publicProcedure.input(z26.object({
    page: z26.number().default(1),
    perPage: z26.number().default(12),
    search: z26.string().nullish(),
    category: z26.union([z26.number(), z26.string()]).nullish()
  })).query(async ({ input }) => {
    const result = await getPaginatedDishes({
      page: input.page,
      limit: input.perPage,
      search: input.search ?? void 0,
      categoryId: input.category ? Number(input.category) : void 0,
      isActive: true
    });
    return { ...result, data: result.data.map(normalizeNutritionalInfo) };
  }),
  // 2. Procedure de Categorias (Filtros)
  categories: publicProcedure.query(async () => {
    try {
      const cats = await getLocalCategories();
      return cats || [];
    } catch (error) {
      console.error("\u274C Erro ao buscar categorias:", error);
      return [];
    }
  }),
  // 3. Procedure de Detalhes
  getById: publicProcedure.input(z26.object({
    id: z26.union([z26.string(), z26.number()]).transform((v) => Number(v))
  })).query(async ({ ctx, input }) => {
    try {
      const db2 = await getDb();
      const dish = await getDishById(input.id);
      if (!dish) {
        throw new TRPCError18({ code: "NOT_FOUND", message: "Prato n\xE3o encontrado" });
      }
      const sizesData = await db2.select().from(dishSizes).where(eq32(dishSizes.isActive, true)).orderBy(asc10(dishSizes.displayOrder));
      const allowAcc = dish.allowAccompaniments || dish.category?.allowAccompaniments;
      const sizeIds = sizesData.map((s) => s.id);
      let accompanimentStructure = [];
      if (allowAcc && sizeIds.length > 0) {
        const groupLinks = await db2.select({
          sizeId: sizeAccompanimentGroups.sizeId,
          isRequired: sizeAccompanimentGroups.isRequired,
          group: {
            id: accompanimentGroups.id,
            name: accompanimentGroups.name,
            slug: accompanimentGroups.slug,
            maxSelections: accompanimentGroups.maxSelections
          }
        }).from(sizeAccompanimentGroups).innerJoin(
          accompanimentGroups,
          eq32(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id)
        ).where(and14(
          inArray(sizeAccompanimentGroups.sizeId, sizeIds),
          eq32(accompanimentGroups.isActive, true)
        ));
        accompanimentStructure = await Promise.all(groupLinks.map(async (link) => {
          const options = await db2.select({
            id: accompanimentOptions.id,
            name: accompanimentOptions.name,
            groupsConfig: accompanimentOptions.groupsConfig,
            showNutrition: accompanimentOptions.showNutrition,
            // ✅ Mudança: Pegamos colunas individuais em vez de nutritionalInfo
            energyKcal: accompanimentOptions.energyKcal,
            carbs: accompanimentOptions.carbs,
            proteins: accompanimentOptions.proteins,
            fatTotal: accompanimentOptions.fatTotal,
            category: {
              name: accompanimentCategories.name,
              iconKey: accompanimentCategories.iconKey,
              color: accompanimentCategories.color
            }
          }).from(accompanimentOptions).leftJoin(
            accompanimentCategories,
            eq32(accompanimentOptions.accompanimentCategoryId, accompanimentCategories.id)
          ).where(and14(
            eq32(accompanimentOptions.isActive, true),
            sql16`JSON_CONTAINS(${accompanimentOptions.groupsConfig}, JSON_OBJECT('group_id', ${link.group.id}))`
          )).orderBy(asc10(accompanimentOptions.displayOrder));
          return {
            ...link,
            options: options.map((opt) => {
              let configs = [];
              try {
                configs = typeof opt.groupsConfig === "string" ? JSON.parse(opt.groupsConfig) : opt.groupsConfig || [];
              } catch (e) {
                configs = [];
              }
              const specific = configs.find((c) => Number(c.group_id) === Number(link.group.id));
              return {
                ...opt,
                // ✅ Injetamos no formato esperado pelo Front
                nutritionalInfo: {
                  kcal: Number(opt.energyKcal || 0),
                  carbs: Number(opt.carbs || 0),
                  proteins: Number(opt.proteins || 0),
                  fats: Number(opt.fatTotal || 0)
                },
                priceModifier: specific?.price_modifier || "0.00"
              };
            })
          };
        }));
      }
      const finalSizes = sizesData.map((size) => ({
        ...size,
        id: Number(size.id),
        priceModifier: Number(size.priceModifier || 0),
        accompanimentGroups: accompanimentStructure.filter((acc) => Number(acc.sizeId) === Number(size.id)).map((acc) => ({
          ...acc.group,
          isRequired: Boolean(acc.isRequired),
          options: acc.options
        }))
      }));
      logAction(ctx, "VIEW_PRODUCT", "products", { entityId: input.id, new: { nome: dish.name } }).catch(() => {
      });
      return {
        ...normalizeNutritionalInfo(dish),
        sizes: finalSizes
      };
    } catch (error) {
      console.error("\u274C Erro detalhado no getById P\xFAblico:", error);
      throw new TRPCError18({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao processar os detalhes do produto"
      });
    }
  })
});

// server/routers/storefront/public.ts
var publicRouter = router({
  /**
   * 🍽️ Sub-rota de Produtos (Alias para compatibilidade com o Front)
   * Isso resolve o erro: trpc.public.dishes.getById
   */
  dishes: productsRouter,
  /**
   * 1. CONFIGURAÇÕES DA LOJA E ACESSIBILIDADE
   */
  getStoreSettings: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      if (!db2) throw new Error("Database connection failed");
      const general = await getStoreSettings();
      const extraConfigs = await db2.select().from(appConfigs).where(inArray2(appConfigs.configKey, [
        "accessibility_high_contrast",
        "accessibility_dyslexic_font",
        "accessibility_font_scale"
      ]));
      const getVal = (k) => extraConfigs.find((r) => r.configKey === k)?.configValue;
      return {
        ...general,
        accessibility: {
          highContrast: getVal("accessibility_high_contrast") === "true",
          dyslexicFont: getVal("accessibility_dyslexic_font") === "true",
          fontScale: parseFloat(getVal("accessibility_font_scale") || "1.00")
        }
      };
    } catch (error) {
      console.error("\u26A0\uFE0F Erro ao carregar Store Settings, usando fallback.");
      return {
        id: "1",
        generalMinOrderAmount: 0,
        minOrderMessage: "",
        emergencyMode: false,
        accessibility: { highContrast: false, dyslexicFont: false, fontScale: 1 }
      };
    }
  }),
  /**
   * 2. INFORMAÇÕES DE CONTATO E REDES SOCIAIS
   */
  getCompanyInfo: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      if (!db2) throw new Error("Database offline");
      const [row] = await db2.select().from(appConfigs).where(eq33(appConfigs.configKey, "company_social_info")).limit(1);
      const defaultInfo = {
        phone: "(11) 99999-9999",
        whatsapp: "5511999999999",
        email: "contato@sualoja.com.br",
        address: "Cidade, Estado",
        instagram: "@sualoja",
        facebook: "sualoja"
      };
      if (!row?.configValue) return defaultInfo;
      const decrypted = decrypt(row.configValue);
      if (!decrypted) return defaultInfo;
      try {
        const parsed = JSON.parse(decrypted);
        return { ...defaultInfo, ...parsed };
      } catch (e) {
        return defaultInfo;
      }
    } catch (error) {
      console.error("\u274C [PUBLIC_INFO_ERROR]:", error);
      return { phone: "", whatsapp: "", email: "", address: "", instagram: "", facebook: "" };
    }
  })
});

// server/routers/storefront/store.ts
init_db();
init_schema();
import { eq as eq34, inArray as inArray3 } from "drizzle-orm";
var storeRouter = router({
  /**
   * CONFIGURAÇÕES PÚBLICAS DE APARÊNCIA
   * Resolve o erro 403 no hook useAccessibility.
   */
  getPublicSettings: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      if (!db2) return {};
      const rows = await db2.select().from(appConfigs).where(inArray3(appConfigs.configKey, [
        "accessibility",
        "general_appearance",
        "store_info"
      ]));
      const settings = {};
      rows.forEach((row) => {
        try {
          settings[row.configKey] = JSON.parse(row.configValue || "{}");
        } catch (e) {
          settings[row.configKey] = row.configValue;
        }
      });
      return settings;
    } catch (error) {
      console.error("\u274C [STORE_SETTINGS_ERROR]:", error);
      return {};
    }
  }),
  /**
   * VITRINES E BANNERS (Showcases)
   * Resolve o erro 404 ao carregar a Home Page.
   */
  getShowcases: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      if (!db2) return [];
      const [config] = await db2.select().from(appConfigs).where(eq34(appConfigs.configKey, "showcases")).limit(1);
      if (!config || !config.configValue) return [];
      return JSON.parse(config.configValue);
    } catch (error) {
      console.error("\u274C [SHOWCASES_ERROR]:", error);
      return [];
    }
  })
});

// server/routers/storefront/addresses.ts
import { z as z27 } from "zod";
import { TRPCError as TRPCError19 } from "@trpc/server";
init_encryption();
init_db();
init_schema();
import { eq as eq35, and as and15, sql as sql17, desc as desc18 } from "drizzle-orm";
import { generateIdFromEntropySize as generateIdFromEntropySize2 } from "lucia";
import axios from "axios";
var AddressInput = z27.object({
  label: z27.string().optional().nullable(),
  street: z27.string().min(1, "Rua \xE9 obrigat\xF3ria"),
  number: z27.string().optional().nullable(),
  complement: z27.string().optional().nullable(),
  neighborhood: z27.string().optional().nullable(),
  city: z27.string().optional().nullable(),
  state: z27.string().optional().nullable(),
  zipCode: z27.string().min(1, "CEP \xE9 obrigat\xF3rio"),
  phone: z27.string().optional().nullable(),
  isDefault: z27.boolean().optional()
});
function safeDecrypt3(val) {
  if (!val) return "";
  try {
    const str = String(val);
    if (str.split(":").length !== 3) return str;
    return decrypt(str) || str;
  } catch {
    return String(val);
  }
}
function toFront(addr) {
  if (!addr) return null;
  return {
    ...addr,
    id: String(addr.id),
    label: safeDecrypt3(addr.label) || "Endere\xE7o",
    street: safeDecrypt3(addr.street),
    number: safeDecrypt3(addr.number) || "S/N",
    complement: safeDecrypt3(addr.complement) || "",
    neighborhood: safeDecrypt3(addr.neighborhood) || "",
    city: safeDecrypt3(addr.city) || "",
    state: safeDecrypt3(addr.state) || "",
    zipCode: safeDecrypt3(addr.zipCode),
    phone: safeDecrypt3(addr.phone) || "",
    isDefault: !!addr.isDefault
  };
}
var addressesRouter = router({
  /**
   * ✅ RESOLUÇÃO DO ERRO: "addresses.getStoreSettings"
   */
  getStoreSettings: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      const settings = await db2.select().from(storeSettings).limit(1);
      if (!settings || settings.length === 0) {
        return {
          id: "default",
          generalMinOrderAmount: "0.00",
          emergencyMode: false,
          minOrderMessage: "Valor m\xEDnimo n\xE3o atingido"
        };
      }
      return settings[0];
    } catch (error) {
      console.error("\u{1F6A8} [DB ERROR] Erro ao buscar storeSettings:", error);
      return { id: "error", generalMinOrderAmount: "0.00", emergencyMode: false };
    }
  }),
  /**
   * ⚙️ CONFIGURAÇÕES DE ENTREGA
   */
  getSettings: publicProcedure.query(async () => {
    const db2 = await getDb();
    try {
      const [settings] = await db2.select().from(storeSettings).limit(1);
      return {
        minOrderValue: Number(settings?.generalMinOrderAmount || 0),
        isDeliveryEnabled: !settings?.emergencyMode,
        deliveryFee: 0,
        baseFee: 0,
        minOrderMessage: settings?.minOrderMessage || "Valor m\xEDnimo n\xE3o atingido"
      };
    } catch {
      return { minOrderValue: 0, isDeliveryEnabled: true, deliveryFee: 0, baseFee: 0, minOrderMessage: "" };
    }
  }),
  /**
   * 🔍 BUSCA CEP EXTERNA (ViaCEP)
   */
  getCep: publicProcedure.input(z27.object({ cep: z27.string() })).query(async ({ input }) => {
    const cleanCep = input.cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return null;
    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { timeout: 5e3 });
      if (data.erro) return null;
      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf
      };
    } catch {
      return null;
    }
  }),
  /**
   * 🏁 VALIDAÇÃO DE ZONA DE ENTREGA
   */
  validateZipZone: publicProcedure.input(z27.object({ zipCode: z27.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const cleanZip = input.zipCode.replace(/\D/g, "");
    try {
      const [rows] = await db2.execute(sql17`
          SELECT id, name, price AS shippingCost
          FROM shipping_rules
          WHERE active = 1
            AND CAST(cep_start AS UNSIGNED) <= CAST(${cleanZip} AS UNSIGNED)
            AND CAST(cep_end AS UNSIGNED) >= CAST(${cleanZip} AS UNSIGNED)
          LIMIT 1
        `);
      const rule = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (!rule) return { isValid: false, shippingCost: 0 };
      return {
        isValid: true,
        zoneId: String(rule.id),
        zoneName: rule.name,
        shippingCost: Number(rule.shippingCost ?? 0)
      };
    } catch {
      return { isValid: false, shippingCost: 0, error: "Tabela shipping_rules n\xE3o encontrada" };
    }
  }),
  /**
   * 📋 LISTAR ENDEREÇOS
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const rows = await db2.select().from(userAddresses).where(eq35(userAddresses.userId, ctx.user.id)).orderBy(desc18(userAddresses.isDefault), desc18(userAddresses.createdAt));
    return rows.map(toFront);
  }),
  /**
   * ➕ CRIAR ENDEREÇO
   */
  create: protectedProcedure.input(AddressInput).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    if (input.isDefault) {
      await db2.update(userAddresses).set({ isDefault: false }).where(eq35(userAddresses.userId, userId));
    }
    const id = generateIdFromEntropySize2(15);
    await db2.insert(userAddresses).values({
      id,
      userId,
      label: encrypt(input.label || "Endere\xE7o"),
      street: encrypt(input.street),
      number: encrypt(input.number || "S/N"),
      complement: encrypt(input.complement || ""),
      neighborhood: encrypt(input.neighborhood || ""),
      city: encrypt(input.city || ""),
      state: encrypt(input.state || ""),
      zipCode: encrypt(input.zipCode),
      phone: encrypt(input.phone || ""),
      isDefault: !!input.isDefault
    });
    logAction(ctx, "CREATE_ADDRESS", "user_addresses", {
      entityId: id,
      new: { label: input.label, zip: input.zipCode }
    }).catch(() => {
    });
    return { success: true, id };
  }),
  /**
   * 🗑️ EXCLUIR ENDEREÇO
   */
  delete: protectedProcedure.input(z27.object({ id: z27.string() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [addr] = await db2.select().from(userAddresses).where(and15(eq35(userAddresses.id, input.id), eq35(userAddresses.userId, ctx.user.id)));
    if (!addr) throw new TRPCError19({ code: "NOT_FOUND" });
    await db2.delete(userAddresses).where(and15(eq35(userAddresses.id, input.id), eq35(userAddresses.userId, ctx.user.id)));
    logAction(ctx, "DELETE_ADDRESS", "user_addresses", {
      entityId: input.id,
      old: { label: safeDecrypt3(addr.label) }
    }).catch(() => {
    });
    return { success: true };
  })
});

// server/paymentMethods.ts
init_db();
init_schema2();
import { eq as eq36, asc as asc11, sql as sql18 } from "drizzle-orm";
import crypto7 from "crypto";
var mapPaymentMethod = (m) => ({
  ...m,
  // Se o banco usa String, mantemos como String para evitar erros de referência
  id: String(m.id),
  discountPercentage: Number(m.discountPercentage || 0),
  isActive: m.isActive === 1 || m.isActive === true || m.isActive === "1"
});
async function getAllPaymentMethods() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const result = await db2.select().from(paymentMethods).orderBy(asc11(paymentMethods.displayOrder), asc11(paymentMethods.name));
  return result.map(mapPaymentMethod);
}
async function getActivePaymentMethods() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const result = await db2.select().from(paymentMethods).where(sql18`${paymentMethods.isActive} = 1`).orderBy(asc11(paymentMethods.displayOrder));
  return result.map(mapPaymentMethod);
}
async function getPaymentMethodById(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const result = await db2.select().from(paymentMethods).where(eq36(paymentMethods.id, id));
  if (!result[0]) return null;
  return mapPaymentMethod(result[0]);
}
async function createPaymentMethod2(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const newId = crypto7.randomUUID();
  await db2.insert(paymentMethods).values({
    id: newId,
    name: data.name,
    isActive: data.isActive ?? true,
    discountPercentage: data.discountPercentage ? String(data.discountPercentage) : "0.00",
    displayOrder: data.displayOrder ?? 0,
    description: data.description || null,
    icon: data.icon || null,
    brandName: data.brandName || null,
    brandLogoUrl: data.brandLogoUrl || null
  });
  return { success: true, id: newId };
}
async function updatePaymentMethod2(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const updateData = {};
  if (data.name !== void 0) updateData.name = data.name;
  if (data.isActive !== void 0) updateData.isActive = data.isActive;
  if (data.discountPercentage !== void 0) updateData.discountPercentage = String(data.discountPercentage);
  if (data.displayOrder !== void 0) updateData.displayOrder = data.displayOrder;
  if (data.description !== void 0) updateData.description = data.description;
  if (data.icon !== void 0) updateData.icon = data.icon;
  if (data.brandName !== void 0) updateData.brandName = data.brandName;
  if (data.brandLogoUrl !== void 0) updateData.brandLogoUrl = data.brandLogoUrl;
  await db2.update(paymentMethods).set({
    ...updateData,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq36(paymentMethods.id, id));
  return { success: true };
}
async function deletePaymentMethod(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  try {
    await db2.delete(paymentMethods).where(eq36(paymentMethods.id, id));
    return { success: true };
  } catch (e) {
    throw new Error("N\xE3o \xE9 poss\xEDvel excluir. Este m\xE9todo pode estar vinculado a pedidos. Tente desativar.");
  }
}

// server/routers/storefront/paymentMethods.ts
import { z as z28 } from "zod";
import { TRPCError as TRPCError20 } from "@trpc/server";
var paymentMethodSchema = z28.object({
  name: z28.string().min(1, "O nome \xE9 obrigat\xF3rio"),
  isActive: z28.boolean().optional().default(true),
  discountPercentage: z28.coerce.number().min(0).max(100).optional().default(0),
  displayOrder: z28.coerce.number().int().optional().default(0),
  description: z28.string().optional().nullable(),
  icon: z28.string().optional().nullable(),
  brandName: z28.string().optional().nullable(),
  brandLogoUrl: z28.string().optional().nullable(),
  type: z28.string().optional().default("cash")
});
var paymentMethodsRouter = router({
  // --- 🛒 ÁREA DO CLIENTE (Checkout) ---
  /**
   * Listar métodos ativos para o cliente escolher como pagar.
   */
  list: publicProcedure.query(async () => {
    try {
      return await getActivePaymentMethods();
    } catch (error) {
      throw new TRPCError20({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),
  /**
   * Buscar detalhes de um método específico.
   */
  get: publicProcedure.input(z28.object({ id: z28.coerce.number() })).query(async ({ input }) => {
    const method = await getPaymentMethodById(input.id);
    if (!method) throw new TRPCError20({ code: "NOT_FOUND", message: "M\xE9todo n\xE3o encontrado." });
    return method;
  }),
  // --- ⚙️ ÁREA ADMINISTRATIVA (adminProcedure) ---
  listAll: adminProcedure.query(async () => {
    try {
      return await getAllPaymentMethods();
    } catch (error) {
      throw new TRPCError20({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),
  create: adminProcedure.input(paymentMethodSchema).mutation(async ({ input }) => {
    try {
      return await createPaymentMethod2(input);
    } catch (error) {
      throw new TRPCError20({ code: "BAD_REQUEST", message: error.message });
    }
  }),
  update: adminProcedure.input(paymentMethodSchema.partial().extend({ id: z28.coerce.number() })).mutation(async ({ input }) => {
    try {
      const { id, ...data } = input;
      return await updatePaymentMethod2(id, data);
    } catch (error) {
      throw new TRPCError20({ code: "BAD_REQUEST", message: error.message });
    }
  }),
  delete: adminProcedure.input(z28.object({ id: z28.coerce.number() })).mutation(async ({ input }) => {
    try {
      return await deletePaymentMethod(input.id);
    } catch (error) {
      throw new TRPCError20({ code: "CONFLICT", message: error.message });
    }
  })
});

// server/routers/storefront/orders.ts
import { z as z29 } from "zod";
import { TRPCError as TRPCError21 } from "@trpc/server";
init_db();
init_schema();
init_mailer();
import { eq as eq37, inArray as inArray4, desc as desc19 } from "drizzle-orm";
var ordersRouter = router({
  // 1. LISTAR PEDIDOS
  list: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR", message: "BD indispon\xEDvel" });
    const userId = String(ctx.user.id);
    const baseOrders = await db2.select().from(orders).where(eq37(orders.userId, userId)).orderBy(desc19(orders.createdAt)).limit(50);
    if (baseOrders.length === 0) return [];
    const orderIds = baseOrders.map((o) => o.id);
    const allItemsRaw = await db2.select().from(orderItems).where(inArray4(orderItems.orderId, orderIds));
    return baseOrders.map((o) => {
      const items = allItemsRaw.filter((item) => item.orderId === o.id).map((item) => ({
        ...item,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        totalPrice: Number(item.totalPrice || 0),
        options: typeof item.options === "string" ? JSON.parse(item.options) : item.options,
        appliedNutrition: typeof item.appliedNutrition === "string" ? JSON.parse(item.appliedNutrition) : item.appliedNutrition
      }));
      return {
        ...o,
        total: Number(o.total || 0),
        subtotal: Number(o.subtotal || 0),
        shippingCost: Number(o.shippingCost || 0),
        totalDiscount: Number(o.totalDiscount || 0),
        items
      };
    });
  }),
  // 2. CHECKOUT (Criação do Pedido)
  checkout: publicProcedure.input(z29.object({
    customerName: z29.string(),
    customerEmail: z29.string().email(),
    userId: z29.string().nullable().optional(),
    subtotal: z29.number(),
    shippingCost: z29.number(),
    totalDiscount: z29.number(),
    total: z29.number(),
    items: z29.array(z29.object({
      name: z29.string(),
      quantity: z29.number(),
      price: z29.number(),
      options: z29.any(),
      nutrition: z29.any().optional()
    }))
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR", message: "BD indispon\xEDvel" });
    try {
      const orderValues = {
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        subtotal: String(input.subtotal),
        shippingCost: String(input.shippingCost),
        totalDiscount: String(input.totalDiscount),
        total: String(input.total),
        status: "pending"
      };
      if (input.userId) {
        orderValues.userId = String(input.userId);
      }
      const [result] = await db2.insert(orders).values(orderValues);
      const generatedOrderId = result.insertId;
      const itemsToInsert = input.items.map((item) => ({
        orderId: String(generatedOrderId),
        dishName: item.name,
        quantity: item.quantity,
        price: String(item.price),
        totalPrice: String(item.price * item.quantity),
        options: JSON.stringify(item.options),
        appliedNutrition: JSON.stringify(item.nutrition || {})
      }));
      await db2.insert(orderItems).values(itemsToInsert);
      const emailItems = input.items.map((item) => {
        let details = "";
        if (item.options?._type === "multi") {
          details = item.options.meals.map(
            (m) => `\u2022 ${m.dishName}: ${m.selectedAccompaniments.map((a) => a.name).join(", ")}`
          ).join("<br/>");
        } else if (item.options?._type === "single") {
          const accs = item.options.selectedAccompaniments?.map((a) => a.name).join(", ");
          details = accs ? `Acomp: ${accs}` : "Tradicional";
        }
        return { name: item.name, details };
      });
      if (mailer) {
        mailer.sendOrderConfirmation(input.customerEmail, {
          id: String(generatedOrderId),
          customerName: input.customerName,
          total: input.total,
          items: emailItems
        }).catch((err) => console.error("\u{1F4E7} Erro SMTP Checkout:", err));
      }
      return {
        success: true,
        orderId: String(generatedOrderId)
      };
    } catch (error) {
      console.error("\u274C Erro no Checkout:", error);
      throw new TRPCError21({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao processar pedido: " + error.message
      });
    }
  }),
  // 3. DETALHE PÚBLICO
  getPublicDetail: publicProcedure.input(z29.object({ orderId: z29.string().min(1) })).query(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR", message: "BD indispon\xEDvel" });
    const [row] = await db2.select().from(orders).where(eq37(orders.id, input.orderId)).limit(1);
    if (!row) throw new TRPCError21({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    return {
      ...row,
      total: Number(row.total || 0),
      subtotal: Number(row.subtotal || 0),
      shippingCost: Number(row.shippingCost || 0)
    };
  })
});

// server/routers/storefront/profile.ts
import { z as z30 } from "zod";
import { eq as eq38, desc as desc20 } from "drizzle-orm";
import { TRPCError as TRPCError22 } from "@trpc/server";
import { hash as hash2, verify as verify2 } from "@node-rs/argon2";
init_db();
init_encryption();
init_schema();
import crypto8 from "crypto";
function unseal3(val) {
  if (!val) return "";
  const str = String(val);
  try {
    if (str.split(":").length !== 3) return str;
    const decoded = decrypt(str);
    return decoded || str;
  } catch (e) {
    return str;
  }
}
var generateBlindIndex = (value) => {
  if (!value) return null;
  const cleanValue = value.replace(/\D/g, "");
  return crypto8.createHash("sha256").update(cleanValue).digest("hex");
};
var profileRouter = router({
  /**
   * 👤 GET: Retorna o perfil completo usando apenas o UUID unificado
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const targetId = ctx.user.id;
    const [row] = await db2.select().from(users).where(eq38(users.id, targetId)).limit(1);
    if (!row) {
      console.error(`[AUTH] Perfil n\xE3o encontrado no banco para ID: ${targetId}`);
      throw new TRPCError22({ code: "NOT_FOUND", message: "Perfil n\xE3o encontrado." });
    }
    let finalDoc = unseal3(row.customerDocument);
    if (!finalDoc || finalDoc.length < 5) {
      const [lastOrder] = await db2.select({ doc: orders.customerDocument }).from(orders).where(eq38(orders.userId, targetId)).orderBy(desc20(orders.id)).limit(1);
      if (lastOrder?.doc) finalDoc = unseal3(lastOrder.doc);
    }
    return {
      id: row.id,
      name: unseal3(row.name) || "Cliente",
      email: row.email,
      document: finalDoc,
      phone: unseal3(row.phone),
      birthDate: row.birthDate ? String(row.birthDate).split("T")[0] : null,
      birthYear: row.birthYear ? Number(row.birthYear) : null
    };
  }),
  /**
   * 📝 UPDATE: Atualiza dados usando o UUID unificado
   */
  update: protectedProcedure.input(z30.object({
    name: z30.string().min(2, "Nome muito curto").optional(),
    cpf: z30.string().optional(),
    phone: z30.string().optional(),
    birthDate: z30.string().optional().nullable(),
    birthYear: z30.number().optional().nullable()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const targetId = ctx.user.id;
    const updateData = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.name?.trim()) {
      updateData.name = encrypt(input.name.trim());
    }
    if (input.cpf) {
      const cleanCpf = input.cpf.replace(/\D/g, "");
      if (cleanCpf.length === 11) {
        updateData.customerDocument = encrypt(cleanCpf);
        updateData.customerDocumentHash = generateBlindIndex(cleanCpf);
      }
    }
    if (input.phone) {
      const cleanPhone = input.phone.replace(/\D/g, "");
      if (cleanPhone.length >= 8) {
        updateData.phone = encrypt(cleanPhone);
      }
    }
    if (input.birthDate) {
      const dateOnly = input.birthDate.split("T")[0];
      updateData.birthDate = dateOnly;
      if (!input.birthYear) {
        updateData.birthYear = Number(dateOnly.split("-")[0]);
      }
    }
    if (input.birthYear !== void 0) {
      updateData.birthYear = input.birthYear;
    }
    try {
      await db2.update(users).set(updateData).where(eq38(users.id, targetId));
      await logAction(ctx, "UPDATE_PROFILE", "users", { entityId: targetId });
      return { success: true };
    } catch (e) {
      throw new TRPCError22({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao salvar dados." });
    }
  }),
  /**
   * 🔑 CHANGE PASSWORD: Unificado na tabela users (ajuste conforme seu schema)
   */
  changePassword: protectedProcedure.input(z30.object({
    currentPassword: z30.string(),
    newPassword: z30.string().min(6)
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const targetId = ctx.user.id;
    const [userRow] = await db2.select({ password: users.password }).from(users).where(eq38(users.id, targetId)).limit(1);
    if (!userRow?.password) throw new TRPCError22({ code: "NOT_FOUND", message: "Usu\xE1rio n\xE3o possui senha definida." });
    const isMatch = await verify2(userRow.password, input.currentPassword);
    if (!isMatch) throw new TRPCError22({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });
    const hashedNewPassword = await hash2(input.newPassword);
    await db2.update(users).set({ password: hashedNewPassword }).where(eq38(users.id, targetId));
    await logAction(ctx, "CHANGE_PASSWORD", "users", { entityId: targetId });
    return { success: true };
  }),
  /**
   * 📍 ADDRESSES (GET): Busca direta por UUID
   */
  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const targetId = ctx.user.id;
    const rows = await db2.select().from(userAddresses).where(eq38(userAddresses.userId, targetId)).orderBy(desc20(userAddresses.isDefault), desc20(userAddresses.id));
    return rows.map((addr) => ({
      ...addr,
      label: unseal3(addr.label),
      street: unseal3(addr.street),
      number: unseal3(addr.number),
      neighborhood: unseal3(addr.neighborhood),
      city: unseal3(addr.city),
      state: unseal3(addr.state),
      zipCode: unseal3(addr.zipCode),
      complement: unseal3(addr.complement),
      isDefault: Boolean(addr.isDefault)
    }));
  }),
  /**
   * ➕ ADD ADDRESS: Inserção usando o UUID
   */
  addAddress: protectedProcedure.input(z30.object({
    label: z30.string().min(1),
    zipCode: z30.string(),
    street: z30.string(),
    number: z30.string(),
    neighborhood: z30.string(),
    city: z30.string(),
    state: z30.string(),
    complement: z30.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const targetId = ctx.user.id;
    const existing = await db2.select().from(userAddresses).where(eq38(userAddresses.userId, targetId)).limit(1);
    const isDefault = existing.length === 0;
    await db2.insert(userAddresses).values({
      id: `ADDR-${crypto8.randomBytes(4).toString("hex").toUpperCase()}`,
      userId: targetId,
      label: encrypt(input.label),
      zipCode: encrypt(input.zipCode),
      street: encrypt(input.street),
      number: encrypt(input.number),
      neighborhood: encrypt(input.neighborhood),
      city: encrypt(input.city),
      state: encrypt(input.state),
      complement: input.complement ? encrypt(input.complement) : "",
      isDefault
    });
    return { success: true };
  })
});

// server/routers/storefront/packages.ts
import { z as z31 } from "zod";
import { TRPCError as TRPCError23 } from "@trpc/server";

// server/packages.ts
init_db();
init_packages();
init_catalog();
import { eq as eq39, inArray as inArray5, asc as asc12 } from "drizzle-orm";
var toNum = (val) => {
  if (val === null || val === void 0) return 0;
  const n = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val;
  return isNaN(n) ? 0 : n;
};
async function getPackageById(idInput) {
  const db2 = await getDb();
  if (!db2) throw new Error("Base de dados n\xE3o dispon\xEDvel");
  const id = String(idInput);
  try {
    const [pkg] = await db2.select().from(packages).where(eq39(packages.id, id)).limit(1);
    if (!pkg) return null;
    const allCategories = await db2.select().from(accompanimentCategories).where(eq39(accompanimentCategories.isActive, true));
    let config = { slots: [] };
    try {
      if (typeof pkg.config === "string") {
        config = JSON.parse(pkg.config);
      } else if (pkg.config && typeof pkg.config === "object") {
        config = pkg.config;
      }
    } catch (e) {
      console.error("Erro parse JSON");
    }
    const slots = Array.isArray(config?.slots) ? config.slots : [];
    const allDishIds = [];
    const allGroupIds = [];
    slots.forEach((slot) => {
      if (slot?.dishIds) allDishIds.push(...slot.dishIds.map(Number));
      if (slot?.groups) allGroupIds.push(...slot.groups.map((g) => Number(g.id)));
    });
    const uniqueDishIds = [...new Set(allDishIds)].filter((n) => !isNaN(n) && n > 0);
    const uniqueGroupIds = [...new Set(allGroupIds)].filter((n) => !isNaN(n) && n > 0);
    let allFetchedDishes = [];
    if (uniqueDishIds.length > 0) {
      allFetchedDishes = await db2.select({
        id: dishes.id,
        name: dishes.name,
        price: dishes.price || dishes.basePrice || "0.00",
        nutritionalInfo: dishes.nutritionalInfo
      }).from(dishes).where(inArray5(dishes.id, uniqueDishIds));
    }
    let allFetchedGroups = [];
    if (uniqueGroupIds.length > 0) {
      const groupsRaw = await db2.select().from(accompanimentGroups).where(inArray5(accompanimentGroups.id, uniqueGroupIds));
      const allActiveOptions = await db2.select().from(accompanimentOptions).where(eq39(accompanimentOptions.isActive, true));
      allFetchedGroups = groupsRaw.map((group) => {
        const groupOptions = allActiveOptions.map((opt) => {
          const groupsConfig = typeof opt.groupsConfig === "string" ? JSON.parse(opt.groupsConfig) : opt.groupsConfig || [];
          const configLink = groupsConfig.find((gc) => Number(gc.group_id) === group.id);
          if (!configLink) return null;
          const categoryData = allCategories.find((c) => c.id === opt.accompanimentCategoryId);
          return {
            id: Number(opt.id),
            name: opt.name,
            priceModifier: toNum(configLink.price_modifier || opt.priceModifier),
            nutritional_info: opt.nutritionalInfo,
            // ✅ AQUI OS ÍCONES SÃO INJETADOS
            category: categoryData ? {
              id: categoryData.id,
              name: categoryData.name,
              iconKey: categoryData.iconKey,
              color: categoryData.color
            } : null
          };
        }).filter(Boolean);
        return {
          id: Number(group.id),
          name: group.name,
          maxSelections: Number(group.maxSelections || 1),
          options: groupOptions
        };
      });
    }
    const formattedOptions = slots.map((slot, index2) => {
      const slotDishIds = Array.isArray(slot?.dishIds) ? slot.dishIds.map(Number) : [];
      const slotConfigs = Array.isArray(slot?.groups) ? slot.groups : [];
      const slotGroupIds = slotConfigs.map((g) => Number(g?.id));
      return {
        mealIndex: index2,
        label: slot?.name || `Refei\xE7\xE3o ${index2 + 1}`,
        dishes: allFetchedDishes.filter((d) => d && slotDishIds.includes(Number(d.id))).map((d) => ({
          id: Number(d.id),
          name: d.name,
          price: toNum(d.price),
          nutritional_info: d.nutritionalInfo || {}
        })),
        accompanimentGroups: allFetchedGroups.filter((g) => g && slotGroupIds.includes(Number(g.id))).map((g) => {
          const custom = slotConfigs.find((sg) => Number(sg?.id) === Number(g?.id));
          return {
            ...g,
            name: custom?.customLabel || g.name
          };
        }),
        selectedAccompaniments: []
      };
    });
    return {
      id: String(pkg.id),
      name: pkg.name,
      price: toNum(pkg.price),
      imageUrl: pkg.imageUrl,
      options: formattedOptions
    };
  } catch (error) {
    console.error("\u274C ERRO NO GET PACKAGE:", error.message);
    throw error;
  }
}
async function getAllPackages() {
  const db2 = await getDb();
  if (!db2) return [];
  try {
    const result = await db2.select().from(packages).where(eq39(packages.isActive, true)).orderBy(asc12(packages.name));
    return result.map((p) => ({ ...p, id: String(p.id), price: toNum(p.price) }));
  } catch (e) {
    return [];
  }
}
async function getAllActiveDishes() {
  const db2 = await getDb();
  if (!db2) return [];
  return await db2.select({
    id: dishes.id,
    name: dishes.name,
    price: dishes.price || dishes.basePrice
  }).from(dishes).where(eq39(dishes.isActive, true));
}
async function updatePackageConfig(packageId, configData) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database offline");
  await db2.update(packages).set({
    config: configData,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq39(packages.id, String(packageId)));
  return { success: true };
}

// server/routers/storefront/packages.ts
init_db();
init_catalog();
import { eq as eq40, and as and16, inArray as inArray6 } from "drizzle-orm";
var toNum2 = (val) => {
  if (val === null || val === void 0) return 0;
  const n = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val;
  return isNaN(n) ? 0 : n;
};
var normalizePackage = (pkg) => {
  if (!pkg) return null;
  const rawPrice = pkg.price ?? pkg.basePrice ?? pkg.base_price;
  return {
    ...pkg,
    price: toNum2(rawPrice),
    basePrice: toNum2(rawPrice),
    numberOfOptions: Number(pkg.numberOfOptions || pkg.number_of_options || 0),
    config: typeof pkg.config === "string" ? JSON.parse(pkg.config) : pkg.config
  };
};
var packagesRouter = router({
  // 1. LISTAGEM GERAL
  list: publicProcedure.input(z31.object({ search: z31.string().nullish() }).optional()).query(async () => {
    try {
      const result = await getAllPackages();
      if (!result) return [];
      return result.map(normalizePackage);
    } catch (error) {
      console.error("Erro listing packages:", error);
      return [];
    }
  }),
  // 2. BUSCA POR ID (USADO NO DRAWER)
  getById: publicProcedure.input(z31.object({
    id: z31.union([z31.string(), z31.number()]).transform((v) => String(v))
  })).query(async ({ input }) => {
    try {
      const pkg = await getPackageById(input.id);
      if (!pkg) throw new TRPCError23({ code: "NOT_FOUND", message: "Pacote n\xE3o encontrado" });
      return normalizePackage(pkg);
    } catch (error) {
      throw new TRPCError23({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro ao buscar pacote"
      });
    }
  }),
  /**
   * ✅ LISTAR PRATOS PARA O BUILDER COM ÍCONES NAS CATEGORIAS
   */
  listAllDishes: publicProcedure.query(async () => {
    const db2 = await getDb();
    const allDishes = await getAllActiveDishes();
    const allCategories = await db2.select().from(accompanimentCategories).where(eq40(accompanimentCategories.isActive, true));
    if (!allDishes || allDishes.length === 0) return [];
    const sizes = await db2.select().from(dishSizes).where(eq40(dishSizes.isActive, true));
    return await Promise.all(allDishes.map(async (dish) => {
      let accompaniments = [];
      if (dish.allowAccompaniments && sizes.length > 0) {
        const sizeIds = sizes.map((s) => s.id);
        const groupLinks = await db2.select({
          sizeId: sizeAccompanimentGroups.sizeId,
          isRequired: sizeAccompanimentGroups.isRequired,
          id: accompanimentGroups.id,
          name: accompanimentGroups.name
        }).from(sizeAccompanimentGroups).innerJoin(accompanimentGroups, eq40(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id)).where(and16(
          inArray6(sizeAccompanimentGroups.sizeId, sizeIds),
          eq40(accompanimentGroups.isActive, true)
        ));
        if (groupLinks.length > 0) {
          const allOptions = await db2.select().from(accompanimentOptions).where(eq40(accompanimentOptions.isActive, true));
          accompaniments = groupLinks.map((link) => {
            const filteredOptions = allOptions.map((opt) => {
              const config = typeof opt.groupsConfig === "string" ? JSON.parse(opt.groupsConfig) : opt.groupsConfig || [];
              const specific = config.find((c) => Number(c.group_id) === link.id);
              if (!specific) return null;
              const categoryData = allCategories.find((c) => c.id === opt.accompanimentCategoryId);
              return {
                ...opt,
                priceModifier: specific.price_modifier || "0.00",
                // ✅ Hidrata o objeto category para o frontend renderizar o ícone
                category: categoryData ? {
                  id: categoryData.id,
                  name: categoryData.name,
                  iconKey: categoryData.iconKey,
                  color: categoryData.color
                } : null
              };
            }).filter(Boolean);
            return {
              ...link,
              options: filteredOptions
            };
          });
        }
      }
      return {
        ...dish,
        accompaniments
      };
    }));
  }),
  // 4. ATUALIZAÇÃO DE CONFIGURAÇÃO (ADMIN)
  updateConfig: publicProcedure.input(z31.object({
    id: z31.union([z31.string(), z31.number()]).transform((v) => String(v)),
    config: z31.any()
  })).mutation(async ({ input }) => {
    const configStr = typeof input.config === "string" ? input.config : JSON.stringify(input.config);
    return await updatePackageConfig(input.id, configStr);
  })
});

// server/routers/storefront/discounts.ts
init_db();
init_schema();
import { eq as eq41, asc as asc13 } from "drizzle-orm";
var fetchRulesLogic = async () => {
  const db2 = await getDb();
  if (!db2) return [];
  try {
    const rules = await db2.select().from(discountRules).where(eq41(discountRules.isActive, true)).orderBy(asc13(discountRules.minQuantity));
    return rules.map((rule) => ({
      ...rule,
      // Garantimos que os valores saiam como números para o Frontend não quebrar
      discountValue: Number(rule.discountValue || 0),
      minQuantity: Number(rule.minQuantity || 0)
    }));
  } catch (error) {
    console.error("\u274C [DISCOUNTS] Erro ao buscar regras de desconto:", error);
    return [];
  }
};
var discountsRouter = router({
  /**
   * 🛒 getDiscountRules
   * Utilizada pelo componente DiscountRoadmap para mostrar o progresso no carrinho.
   */
  getDiscountRules: publicProcedure.query(async () => {
    return await fetchRulesLogic();
  }),
  /**
   * 🔄 getActiveRules (Legada)
   * Mantida para compatibilidade com partes antigas do sistema.
   */
  getActiveRules: publicProcedure.query(async () => {
    return await fetchRulesLogic();
  })
});

// server/routers/storefront/loyalty.ts
init_db();
init_schema();
import { sql as sql19, eq as eq42 } from "drizzle-orm";
import { z as z32 } from "zod";
var loyaltyRouter = router({
  /**
   * ✅ GET POINTS
   * Busca saldo via histórico e estatísticas via tabela de usuários.
   */
  getPoints: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.user.id;
    try {
      const db2 = await getDb();
      const result = await db2.execute(sql19`
        SELECT SUM(points_change) as total_balance 
        FROM loyalty_history 
        WHERE user_id = ${currentUserId}
      `);
      const userStats = await db2.select().from(users).where(eq42(users.id, currentUserId)).limit(1);
      const data = result[0];
      const rows = Array.isArray(data) ? data[0] : data;
      const points = Number(rows?.total_balance || 0);
      const userData = userStats[0];
      const totalSpentValue = userData?.totalSpent || userData?.total_spent || "0.00";
      return {
        current_points: points,
        loyaltyPoints: points,
        totalSpent: String(totalSpentValue)
      };
    } catch (error) {
      console.error("[Loyalty] Erro no getPoints:", error);
      return { current_points: 0, loyaltyPoints: 0, totalSpent: "0.00" };
    }
  }),
  /**
   * ✅ GET HISTORY
   */
  getHistory: protectedProcedure.input(z32.object({ limit: z32.number().default(5) }).optional()).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const limit = input?.limit ?? 5;
    try {
      const db2 = await getDb();
      const result = await db2.execute(sql19`
          SELECT * FROM loyalty_history 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC
          LIMIT ${limit}
        `);
      const rows = result[0];
      if (!Array.isArray(rows)) return [];
      return rows.map((entry) => ({
        id: entry.id,
        reason: entry.reason || "Compra Realizada",
        description: entry.description || "Pontos acumulados",
        pointsChange: Number(entry.points_change || 0),
        createdAt: entry.created_at
      }));
    } catch (error) {
      console.error("[Loyalty] Erro no getHistory:", error);
      return [];
    }
  }),
  /**
   * ✅ ROTA DE SALDO PARA O CARRINHO
   */
  getUserBalance: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.user.id;
    try {
      const db2 = await getDb();
      const result = await db2.execute(sql19`
          SELECT SUM(points_change) as total_balance 
          FROM loyalty_history 
          WHERE user_id = ${currentUserId}
        `);
      const data = result[0];
      const rows = Array.isArray(data) ? data[0] : data;
      return {
        balance: Number(rows?.total_balance || 0),
        userId: currentUserId
      };
    } catch (error) {
      return { balance: 0, userId: currentUserId };
    }
  }),
  /**
   * ✅ CONFIGURAÇÕES GERAIS (Público)
   */
  getSettings: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      const settings = await db2.select().from(loyaltySettings).limit(1);
      if (settings[0]) return settings[0];
      return { redemptionRatePoints: 100, redemptionRateMoney: "1.00", enabled: false };
    } catch (error) {
      return { redemptionRatePoints: 100, redemptionRateMoney: "1.00", enabled: false };
    }
  }),
  // Mantido por compatibilidade com outras partes do site
  getCustomerHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db2 = await getDb();
    const result = await db2.execute(sql19`SELECT * FROM loyalty_history WHERE user_id = ${userId} ORDER BY created_at DESC`);
    const rows = result[0];
    if (!Array.isArray(rows)) return [];
    return rows.map((entry) => ({ ...entry, points: Number(entry.points_change || 0), date: entry.created_at }));
  }),
  getCustomerSummary: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const result = await db2.execute(sql19`SELECT SUM(points_change) as total_balance FROM loyalty_history WHERE user_id = ${ctx.user.id}`);
    const data = result[0];
    const rows = Array.isArray(data) ? data[0] : data;
    const points = Number(rows?.total_balance || 0);
    return { current_points: points, balance: points, points, userId: ctx.user.id };
  })
});

// server/routers/storefront/checkout/index.ts
import { z as z33 } from "zod";
init_db();
init_schema();
import { TRPCError as TRPCError26 } from "@trpc/server";
import { eq as eq47 } from "drizzle-orm";

// server/routers/storefront/checkout/loyalty.ts
init_schema();
async function loadLoyaltyConfig(tx) {
  const [cfg] = await tx.select().from(loyaltySettings).limit(1);
  if (!cfg) {
    return {
      raw: null,
      enabled: false,
      earnPointsPerReal: 0,
      redeemPointsPerReal: 0,
      maxDiscountAllowed: 0,
      minCartToRedeem: 0
    };
  }
  const enabled = Number(cfg.enabled ?? 0) === 1;
  const earnPointsPerReal = Number(cfg.conversion_rate_money || 0) > 0 ? Number(cfg.conversion_rate_points || 0) / Number(cfg.conversion_rate_money) : 0;
  const redeemPointsPerReal = Number(cfg.redemption_rate_money || 0) > 0 ? Number(cfg.redemption_rate_points || 0) / Number(cfg.redemption_rate_money) : 0;
  return {
    raw: cfg,
    enabled,
    earnPointsPerReal,
    redeemPointsPerReal,
    maxDiscountAllowed: Number(cfg.max_discount_amount || cfg.maxDiscountAllowed || 0),
    minCartToRedeem: Number(cfg.min_cart_amount || cfg.minCartToRedeem || 0)
  };
}
function computeLoyalty(params) {
  const { cfg, details, useLoyaltyPoints, finalNet } = params;
  const {
    enabled,
    redeemPointsPerReal,
    earnPointsPerReal,
    maxDiscountAllowed,
    minCartToRedeem
  } = cfg;
  const loyaltyActive = enabled && !!details?.loyalty?.active && !!useLoyaltyPoints;
  let loyaltyValue = loyaltyActive ? Number(details?.loyalty?.value || 0) : 0;
  let pointsUsed = 0;
  if (loyaltyActive && loyaltyValue > 0) {
    if (minCartToRedeem > 0 && finalNet < minCartToRedeem) {
      loyaltyValue = 0;
      pointsUsed = 0;
    } else {
      if (maxDiscountAllowed > 0 && loyaltyValue > maxDiscountAllowed) {
        loyaltyValue = maxDiscountAllowed;
      }
      pointsUsed = Math.round(loyaltyValue * redeemPointsPerReal);
    }
  }
  const pointsEarned = enabled && earnPointsPerReal > 0 ? Math.max(0, Math.floor(finalNet * earnPointsPerReal)) : 0;
  return {
    loyaltyValue: Number(loyaltyValue.toFixed(2)),
    // Valor em R$ abatido
    pointsUsed,
    // Qtd de pontos retirados do saldo
    pointsEarned
    // Qtd de pontos que o cliente ganhará
  };
}

// server/routers/storefront/checkout/snapshot.ts
init_schema();
import { TRPCError as TRPCError24 } from "@trpc/server";
import { eq as eq43, and as and17 } from "drizzle-orm";
function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
async function loadCartAndSnapshot(tx, userId, cartId) {
  let cartQuery = tx.select().from(carts);
  if (cartId) {
    cartQuery.where(eq43(carts.id, cartId));
  } else if (userId) {
    cartQuery.where(and17(
      eq43(carts.userId, userId),
      eq43(carts.status, "active")
    ));
  } else {
    throw new TRPCError24({ code: "BAD_REQUEST", message: "Carrinho n\xE3o identificado." });
  }
  const [cart] = await cartQuery.limit(1);
  if (!cart) throw new TRPCError24({ code: "NOT_FOUND", message: "Carrinho expirou." });
  let totals = { subtotal: 0, shipping: 0, autoDiscount: 0, couponDiscount: 0, loyaltyDiscount: 0, total: 0 };
  if (cart.discountsJson) {
    try {
      const parsed = typeof cart.discountsJson === "string" ? JSON.parse(cart.discountsJson) : cart.discountsJson;
      if (parsed.totals) {
        totals = {
          subtotal: num(parsed.totals.subtotal),
          shipping: num(parsed.totals.shipping || cart.shippingValue),
          autoDiscount: num(parsed.totals.autoDiscount),
          couponDiscount: num(parsed.totals.couponDiscount),
          loyaltyDiscount: num(parsed.totals.loyaltyDiscount || 0),
          // ✅ Adicionado Loyalty
          total: num(parsed.totals.total || parsed.totals.final)
        };
      }
    } catch (e) {
      console.error("Erro parse totals", e);
    }
  }
  const items = await tx.select({
    id: cartItems.id,
    dishId: cartItems.dishId,
    packageId: cartItems.packageId,
    quantity: cartItems.quantity,
    unitPrice: cartItems.unitPrice,
    // ✅ CAMPOS ESSENCIAIS ADICIONADOS:
    options: cartItems.options,
    appliedNutrition: cartItems.appliedNutrition,
    // Dados de pratos e pacotes (para fallback)
    dishName: dishes.name,
    packageName: packages.name,
    dishPrice: dishes.price,
    packagePrice: packages.price
  }).from(cartItems).leftJoin(dishes, eq43(cartItems.dishId, dishes.id)).leftJoin(packages, eq43(cartItems.packageId, packages.id)).where(eq43(cartItems.cartId, cart.id));
  if (!items.length) throw new TRPCError24({ code: "BAD_REQUEST", message: "Carrinho vazio." });
  const normalizedItems = items.map((item) => {
    let opts = {};
    try {
      opts = typeof item.options === "string" ? JSON.parse(item.options) : item.options || {};
    } catch (e) {
      opts = {};
    }
    const finalName = opts.dishName || opts.packageName || item.dishName || item.packageName || "Item";
    let finalUnitPrice = num(item.unitPrice || opts.totalUnitPrice || item.dishPrice || item.packagePrice);
    return {
      ...item,
      name: finalName,
      // Nome garantido
      options: opts,
      // Objeto pronto para o createOrderWithItems
      unitPrice: finalUnitPrice,
      totalItemPrice: Number((finalUnitPrice * num(item.quantity)).toFixed(2))
    };
  });
  return {
    cart,
    items: normalizedItems,
    totals: {
      ...totals,
      // ✅ Soma correta de todos os descontos (Progressivo + Cupom + Fidelidade)
      totalDiscounts: Number((totals.autoDiscount + totals.couponDiscount + totals.loyaltyDiscount).toFixed(2))
    },
    details: {
      couponCode: cart.couponCode,
      autoDiscountName: cart.autoDiscountName || "Desconto Progressivo"
    }
  };
}

// server/routers/storefront/checkout/address.ts
init_schema();
import { TRPCError as TRPCError25 } from "@trpc/server";
import { eq as eq44, and as and18 } from "drizzle-orm";
var addresses = userAddresses;
async function loadAddressSnapshot(tx, opts, userId) {
  if (opts.shippingType === "pickup") {
    return {
      type: "pickup",
      text: "Retirada no Local / Balc\xE3o",
      zipCode: null
    };
  }
  if (!opts.addressId) {
    throw new TRPCError25({
      code: "BAD_REQUEST",
      message: "Endere\xE7o de entrega n\xE3o selecionado."
    });
  }
  const filters = [eq44(addresses.id, opts.addressId)];
  if (userId) {
    filters.push(eq44(addresses.userId, userId));
  }
  const [addr] = await tx.select().from(addresses).where(and18(...filters)).limit(1);
  if (!addr) {
    throw new TRPCError25({
      code: "NOT_FOUND",
      message: "Endere\xE7o n\xE3o encontrado ou acesso negado."
    });
  }
  return {
    type: "delivery",
    id: addr.id,
    // Texto formatado para exibição rápida em relatórios e notas fiscais
    text: `${addr.street}, ${addr.number}${addr.complement ? ` (${addr.complement})` : ""} - ${addr.neighborhood}, ${addr.city}/${addr.state}`,
    zipCode: addr.zipCode,
    city: addr.city,
    state: addr.state,
    number: addr.number,
    neighborhood: addr.neighborhood,
    street: addr.street,
    complement: addr.complement
  };
}

// server/routers/storefront/checkout/orders.ts
init_schema();
init_encryption();
import { eq as eq45 } from "drizzle-orm";
import crypto9 from "crypto";
function generateFriendlyOrderId() {
  const date = /* @__PURE__ */ new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = crypto9.randomBytes(2).toString("hex").toUpperCase();
  return `GS-${year}${month}-${random}`;
}
function computeFinalNet(subtotal, shipping, discounts) {
  return Math.max(0, Number((subtotal + shipping - discounts).toFixed(2)));
}
function safeDecrypt4(value) {
  if (!value || typeof value !== "string") return String(value || "");
  if (value.split(":").length === 3) {
    try {
      const decrypted = decrypt(value);
      return decrypted || value;
    } catch (e) {
      return value;
    }
  }
  return value;
}
async function createOrderWithItems(params) {
  const {
    tx,
    userId,
    input,
    shippingCost,
    totals,
    details,
    addressSnap,
    payMethod,
    cartItemsJoined,
    pointsUsed,
    pointsEarned,
    finalNet
  } = params;
  const newOrderId = generateFriendlyOrderId();
  let addr = addressSnap;
  if (typeof addressSnap === "string" && addressSnap.trim().startsWith("{")) {
    try {
      addr = JSON.parse(addressSnap);
    } catch (e) {
      addr = {};
    }
  }
  const street = safeDecrypt4(addr?.street || addr?.address || addr?.text || (input.shippingType === "pickup" ? "Retirada" : ""));
  const number = safeDecrypt4(addr?.number);
  const neighborhood = safeDecrypt4(addr?.neighborhood);
  const complement = safeDecrypt4(addr?.complement);
  const city = safeDecrypt4(addr?.city);
  const state = safeDecrypt4(addr?.state);
  const zip = safeDecrypt4(addr?.zipCode || addr?.zip);
  await tx.insert(orders).values({
    id: newOrderId,
    userId: userId ? String(userId) : null,
    status: "pending",
    subtotal: Number(totals.subtotal || 0).toFixed(2),
    shippingCost: Number(shippingCost || 0).toFixed(2),
    totalDiscount: Number(totals.totalDiscounts || 0).toFixed(2),
    total: Number(finalNet || 0).toFixed(2),
    paymentMethod: payMethod?.name || "N\xE3o informado",
    paymentStatus: "pending",
    shippingType: input.shippingType,
    shippingAddress: street,
    shippingAddressNumber: number,
    shippingAddressComplement: complement,
    shippingNeighborhood: neighborhood,
    shippingCity: city,
    shippingState: state,
    shippingZipCode: zip,
    customerName: input.customerName,
    customerDocument: input.customerDocument,
    customerPhone: input.customerPhone,
    loyaltyPointsUsed: Number(pointsUsed || 0),
    loyaltyPointsEarned: Number(pointsEarned || 0),
    discountsSnapshot: JSON.stringify({ ...details, totals }),
    notes: input.notes || ""
  });
  if (cartItemsJoined && cartItemsJoined.length > 0) {
    const itemsToInsert = cartItemsJoined.map((row) => {
      const cItem = row.cart_items || row.cartItems || row;
      let opts = {};
      try {
        opts = typeof cItem.options === "string" ? JSON.parse(cItem.options) : cItem.options || {};
      } catch (e) {
        opts = {};
      }
      const displayName = opts.dishName || opts.packageName || cItem.name || "Item";
      const unitPrice = Number(cItem.unitPrice || 0);
      const qty = Number(cItem.quantity || 1);
      return {
        id: `ITM-${crypto9.randomBytes(3).toString("hex").toUpperCase()}`,
        orderId: newOrderId,
        dishId: cItem.dishId ? String(cItem.dishId) : null,
        packageId: cItem.packageId ? String(cItem.packageId) : null,
        dishName: displayName,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        totalPrice: (unitPrice * qty).toFixed(2),
        // ✅ CORREÇÃO: Salva no campo 'options' (JSON completo)
        options: JSON.stringify(opts),
        // ✅ LEGADO: Salva acompanhamentos em texto se for prato individual
        accompaniments: opts.selectedAccompaniments ? JSON.stringify(opts.selectedAccompaniments) : "[]",
        appliedNutrition: cItem.appliedNutrition ? typeof cItem.appliedNutrition === "string" ? cItem.appliedNutrition : JSON.stringify(cItem.appliedNutrition) : null
      };
    });
    await tx.insert(orderItems).values(itemsToInsert);
  }
  return newOrderId;
}
async function cleanupCart(tx, cartId) {
  if (!cartId) return;
  await tx.delete(cartItems).where(eq45(cartItems.cartId, cartId));
  await tx.update(carts).set({
    status: "completed",
    discountsJson: null,
    couponCode: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq45(carts.id, cartId));
}

// server/routers/storefront/checkout/index.ts
init_encryption();

// server/routers/storefront/checkout/payment.ts
init_db();
init_schema();
import { eq as eq46, and as and19, like as like8, or as or9, asc as asc14 } from "drizzle-orm";
var paymentRouter = router({
  /**
   * ✅ Busca métodos de pagamento GERAIS (Crédito, Débito, Pix, Dinheiro)
   * Filtramos para não trazer os Vales aqui, pois eles aparecem na sub-seção
   */
  getMethods: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      const methods = await db2.select().from(paymentMethods).where(
        and19(
          eq46(paymentMethods.isActive, true)
          // Apenas ativos
          // Opcional: Filtra para não trazer os Vales na lista principal se quiser
          // ou traz tudo e o frontend decide. Vamos trazer tudo ordenado.
        )
      ).orderBy(asc14(paymentMethods.displayOrder));
      const mainMethods = methods.filter((m) => {
        const nameLower = m.name.toLowerCase();
        return !nameLower.includes("alelo") && !nameLower.includes("sodexo") && !nameLower.includes("ticket") && !nameLower.includes("vr refei\xE7\xE3o");
      });
      return mainMethods.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description || "",
        icon: m.icon || null
      }));
    } catch (error) {
      console.error("Erro ao buscar m\xE9todos:", error);
      return [];
    }
  }),
  /**
   * ✅ Busca APENAS as bandeiras de VA/VR
   * Baseado no nome ou descrição contendo palavras-chave
   */
  getFoodCardBrands: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      const brands = await db2.select().from(paymentMethods).where(
        and19(
          eq46(paymentMethods.isActive, true),
          or9(
            like8(paymentMethods.name, "%Alimenta\xE7\xE3o%"),
            like8(paymentMethods.name, "%Refei\xE7\xE3o%"),
            like8(paymentMethods.name, "%Alelo%"),
            like8(paymentMethods.name, "%Sodexo%"),
            like8(paymentMethods.name, "%Ticket%"),
            like8(paymentMethods.name, "%Ben%"),
            like8(paymentMethods.name, "%VR%")
          )
        )
      ).orderBy(asc14(paymentMethods.displayOrder));
      return brands.map((b) => {
        const fullName = (b.name + " " + (b.description || "")).toLowerCase();
        let type = "va";
        if (fullName.includes("refei\xE7\xE3o") || fullName.includes("vr")) {
          type = "vr";
        }
        return {
          id: b.id,
          // Usa o brand_name se existir, senão usa o name normal
          name: b.brandName || b.name,
          // Usa o brand_logo_url se existir, senão o icon normal
          logoUrl: b.brandLogoUrl || b.icon,
          type
          // 'va' ou 'vr'
        };
      });
    } catch (error) {
      console.error("Erro ao buscar bandeiras:", error);
      return [];
    }
  })
});

// server/routers/storefront/checkout/index.ts
function safeDecrypt5(value) {
  if (!value || typeof value !== "string") return String(value || "");
  if (value.split(":").length === 3) {
    const result = decrypt(value);
    return result !== null ? result : value;
  }
  return value.split(/([, \-]+)/).map((part) => {
    if (part.split(":").length === 3) {
      const d = decrypt(part);
      return d !== null ? d : part;
    }
    return part;
  }).join("");
}
var checkoutRouter = router({
  // ✅ AQUI ESTAVA FALTANDO: Conecta o roteador de pagamento
  // Isso faz o 'trpc.checkout.payment.getMethods' funcionar no frontend
  payment: paymentRouter,
  // --- MUTATION DE FINALIZAR PEDIDO ---
  placeOrder: protectedProcedure.input(z33.object({
    id: z33.string().min(1),
    // ID do Carrinho
    paymentMethodId: z33.preprocess(
      (val) => val === null || val === void 0 || val === "" ? void 0 : String(val),
      z33.string().min(1, "Selecione um m\xE9todo de pagamento")
    ),
    shippingType: z33.enum(["delivery", "pickup"]),
    addressId: z33.preprocess(
      (val) => !val || val === "NaN" || val === "" ? null : String(val),
      z33.string().nullable()
    ).optional(),
    notes: z33.string().optional().nullable(),
    customerDocument: z33.string().min(11, "CPF inv\xE1lido"),
    customerName: z33.string().min(1, "Nome \xE9 obrigat\xF3rio"),
    customerPhone: z33.string().min(10, "Telefone inv\xE1lido"),
    shippingCost: z33.number().default(0),
    useLoyaltyPoints: z33.boolean().default(false)
  })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    const cartId = input.id;
    try {
      return await db2.transaction(async (tx) => {
        const loyaltyCfg = await loadLoyaltyConfig(tx);
        const { cart, totals, items } = await loadCartAndSnapshot(tx, userId, cartId);
        if (!cart) throw new TRPCError26({ code: "NOT_FOUND", message: "Carrinho vazio." });
        const rawAddressSnap = await loadAddressSnapshot(tx, {
          shippingType: input.shippingType,
          addressId: input.addressId ?? null
        }, userId);
        let addressSnap = rawAddressSnap;
        if (addressSnap && typeof addressSnap === "object") {
          addressSnap = {
            ...addressSnap,
            street: safeDecrypt5(addressSnap.street || addressSnap.address || addressSnap.text),
            neighborhood: safeDecrypt5(addressSnap.neighborhood),
            number: safeDecrypt5(addressSnap.number),
            complement: safeDecrypt5(addressSnap.complement),
            city: safeDecrypt5(addressSnap.city),
            state: safeDecrypt5(addressSnap.state)
          };
        }
        const subtotal = Number(totals.subtotal || 0);
        const shippingCost = Number(input.shippingCost || 0);
        const discountsTotal = Number(totals.totalDiscounts || 0);
        const finalNet = computeFinalNet(subtotal, shippingCost, discountsTotal);
        const discountsData = cart.discountsJson ? JSON.parse(cart.discountsJson) : {};
        const { pointsUsed, pointsEarned } = computeLoyalty({
          cfg: loyaltyCfg,
          details: discountsData,
          useLoyaltyPoints: input.useLoyaltyPoints,
          finalNet
        });
        const payMethod = await tx.select().from(paymentMethods).where(eq47(paymentMethods.id, String(input.paymentMethodId))).limit(1).then((r) => r[0]);
        if (!payMethod) throw new TRPCError26({ code: "BAD_REQUEST", message: "Pagamento inv\xE1lido." });
        const orderId = await createOrderWithItems({
          tx,
          userId,
          input,
          shippingCost,
          totals,
          details: { couponCode: cart.couponCode, autoDiscountName: discountsData.autoDiscountName },
          addressSnap,
          payMethod,
          cartItemsJoined: items,
          pointsUsed,
          pointsEarned,
          finalNet
        });
        await cleanupCart(tx, cartId);
        try {
          const [userAuth] = await tx.select({ email: authUsers.email }).from(authUsers).where(eq47(authUsers.id, userId)).limit(1);
          if (userAuth?.email) {
            const { mailer: mailer2 } = await Promise.resolve().then(() => (init_mailer(), mailer_exports));
            const emailItems = items.map((i) => {
              let displayDetails = "";
              let displayName = i.productName || i.name || "Produto";
              try {
                const opts = typeof i.options === "string" ? JSON.parse(i.options) : i.options;
                if (opts && typeof opts === "object") {
                  if (opts._type === "multi") {
                    displayName = `\u{1F4E6} ${opts.packageName || displayName}`;
                    if (Array.isArray(opts.meals)) {
                      displayDetails = opts.meals.map((meal, idx) => {
                        const accs = meal.selectedAccompaniments?.map((a) => a.name).join(", ") || "Sem acomp.";
                        return `<div style="margin-bottom:4px;"><strong>${idx + 1}. ${meal.dishName}</strong><br><span style="font-size:11px;color:#666;">+ ${accs}</span></div>`;
                      }).join("");
                    }
                  } else if (opts._type === "single") {
                    if (opts.selectedSize?.name) displayName += ` (${opts.selectedSize.name})`;
                    if (Array.isArray(opts.selectedAccompaniments) && opts.selectedAccompaniments.length > 0) {
                      const accs = opts.selectedAccompaniments.map((a) => `+ ${a.name}`).join("<br>");
                      displayDetails = `<span style="color:#059669;font-size:11px;">${accs}</span>`;
                    }
                  }
                }
              } catch (e) {
                displayDetails = "Item Padr\xE3o";
              }
              const qty = i.quantity || 1;
              const price = Number(i.unitPrice || 0);
              const totalLine = (price * qty).toFixed(2);
              return {
                name: displayName,
                details: `<div style="margin-top:2px;">${displayDetails}<div style="font-weight:bold;font-size:12px;margin-top:4px;">Qtd: ${qty} x R$ ${price.toFixed(2)} = R$ ${totalLine}</div></div>`
              };
            });
            let addressStr = "Retirada no Local";
            if (addressSnap && input.shippingType === "delivery") {
              addressStr = `${addressSnap.street}, ${addressSnap.number}<br>${addressSnap.neighborhood} - ${addressSnap.city}/${addressSnap.state}`;
            }
            await mailer2.sendOrderConfirmation(userAuth.email, {
              id: orderId,
              customerName: input.customerName,
              items: emailItems,
              address: addressStr,
              financials: {
                subtotal: `R$ ${subtotal.toFixed(2)}`,
                shipping: `R$ ${shippingCost.toFixed(2)}`,
                discount: `R$ ${discountsTotal.toFixed(2)}`,
                total: `R$ ${finalNet.toFixed(2)}`
              }
            });
          }
        } catch (emailErr) {
          console.error("\u26A0\uFE0F Falha ao enviar e-mail:", emailErr);
        }
        return { success: true, orderId, total: finalNet, pointsEarned };
      });
    } catch (error) {
      if (error instanceof TRPCError26) throw error;
      throw new TRPCError26({ code: "INTERNAL_SERVER_ERROR", message: "Erro no checkout." });
    }
  })
});

// server/routers/_app.ts
var appRouter = router({
  // 🏢 Área Administrativa (Acessível via trpc.admin...)
  admin: adminRouter,
  // 🛒 Gestão de Carrinho
  cart: cartRouter,
  cartItems: cartItemsRouter,
  // 🔐 Autenticação e Perfil
  auth: authRouter,
  profile: profileRouter,
  // 🌍 Rotas Públicas e Catálogo
  public: publicRouter,
  products: productsRouter,
  // 🏪 Configurações da Loja e Endereços
  store: storeRouter,
  addresses: addressesRouter,
  // 📦 Planos e Assinaturas
  packages: packagesRouter,
  // 💳 Financeiro, Pedidos e Checkout
  paymentMethods: paymentMethodsRouter,
  orders: ordersRouter,
  checkout: checkoutRouter,
  // 📍 Marketing e Fidelidade
  discounts: discountsRouter,
  loyalty: loyaltyRouter
});

// server/_core/context.ts
init_db();
var createContext = async ({
  req,
  res
}) => {
  const db2 = await getDb();
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "unknown";
  const guestId = req.headers["x-guest-id"] || req.headers["x-session-id"] || null;
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  let user = null;
  let session = null;
  if (sessionId) {
    const validSession = await lucia.validateSession(sessionId);
    if (validSession.session && validSession.session.fresh) {
      const sessionCookie = lucia.createSessionCookie(validSession.session.id);
      res.appendHeader("Set-Cookie", sessionCookie.serialize());
    }
    if (!validSession.session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      res.appendHeader("Set-Cookie", sessionCookie.serialize());
    }
    user = validSession.user;
    session = validSession.session;
  }
  return {
    // Ferramentas
    db: db2,
    req,
    res,
    // Auditoria
    ip,
    userAgent,
    // Autenticação (Login Real)
    session,
    // Objeto de sessão do Lucia (ou null)
    user,
    // Objeto de usuário do Lucia (ou null)
    userId: user?.id ?? null,
    // Atalho para o ID do usuário
    isAdmin: user?.role === "admin",
    // Visitante (Login Anônimo)
    // ✅ Isso é o que o Cart Router vai usar quando user for null
    guestId
  };
};

// server/_core/index.ts
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"]
  })
);
var UPLOADS_PATH = path2.join(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));
app.get("/", (req, res) => res.send("\u{1F680} Backend Gourmet Online"));
try {
  const procedures = appRouter._def.procedures || appRouter._def.record || {};
  const rootKeys = Object.keys(procedures);
  console.log("\u{1F4C2} Rotas registradas no tRPC:", rootKeys);
} catch (e) {
  console.log("\u26A0\uFE0F N\xE3o foi poss\xEDvel listar as rotas automaticamente, mas o roteador foi carregado.");
}
console.log("--------------------------------------------------\n");
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    // ✅ CORREÇÃO (Erro 7031): Tipagem explícita para evitar o erro de 'any' implícito
    onError: ({ path: path3, error }) => {
      if (error.code === "NOT_FOUND") {
        console.error(`\u{1F6A8} [tRPC 404] Rota n\xE3o encontrada: "${path3}"`);
      } else {
        console.error(`\u274C [tRPC Error] em "${path3 || "desconhecido"}":`, error.message);
      }
    }
  })
);
var PORT = 3001;
app.listen(PORT, () => {
  console.log(`\u2705 Servidor rodando na porta ${PORT}`);
});
