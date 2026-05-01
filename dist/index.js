var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema/nutrition.ts
import { decimal, int, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";
var nutritionFields, ingredientExtraColumns, nutritionFactsColumns;
var init_nutrition = __esm({
  "drizzle/schema/nutrition.ts"() {
    "use strict";
    nutritionFields = {
      // Energia
      energyKcal: decimal("energy_kcal", { precision: 10, scale: 2 }).default("0.00"),
      energyKj: decimal("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
      yieldFactor: decimal("yield_factor", { precision: 10, scale: 2 }).default("1.00"),
      // Macros Principais
      proteins: decimal("proteins", { precision: 10, scale: 3 }).default("0.000"),
      carbs: decimal("carbs", { precision: 10, scale: 3 }).default("0.000"),
      fatTotal: decimal("fat_total", { precision: 10, scale: 3 }).default("0.000"),
      // Detalhamento de Gorduras
      fatSaturated: decimal("fat_saturated", { precision: 10, scale: 3 }).default("0.000"),
      fatTrans: decimal("fat_trans", { precision: 10, scale: 3 }).default("0.000"),
      // Fibras e Sódio
      fiber: decimal("fiber", { precision: 10, scale: 3 }).default("0.000"),
      sodium: decimal("sodium", { precision: 10, scale: 2 }).default("0.00")
      // armazenado em mg
    };
    ingredientExtraColumns = {
      addedSugars: decimal("added_sugars", { precision: 10, scale: 2 }).default("0.00"),
      calcium: decimal("calcium", { precision: 10, scale: 2 }).default("0.00"),
      iron: decimal("iron", { precision: 10, scale: 2 }).default("0.00")
    };
    nutritionFactsColumns = {
      id: int("id").primaryKey().autoincrement(),
      // IDs para Relações Polimórficas (Chaves Estrangeiras Flexíveis)
      ingredientId: int("ingredient_id"),
      dishId: int("dish_id"),
      compositionId: int("composition_id"),
      // Controle de Contexto Nutricional
      // BASE = Cadastro do Insumo | TOTAL = Soma do Prato | SNAPSHOT = Foto da Ficha Técnica
      entityType: mysqlEnum("entity_type", ["BASE", "TOTAL", "SNAPSHOT"]).notNull(),
      // Injeção via Spread de todos os campos definidos acima
      ...nutritionFields,
      ...ingredientExtraColumns,
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
    };
  }
});

// drizzle/schema/accompaniments.ts
import { mysqlTable, varchar, decimal as decimal2, boolean, int as int2, timestamp as timestamp2, text, longtext } from "drizzle-orm/mysql-core";
var accompanimentOptions;
var init_accompaniments = __esm({
  "drizzle/schema/accompaniments.ts"() {
    "use strict";
    init_catalog();
    accompanimentOptions = mysqlTable("accompaniment_options", {
      id: int2("id").primaryKey().autoincrement(),
      name: varchar("name", { length: 100 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      // ✅ Corrigido para CamelCase no código (JS) mapeando para snake_case (DB)
      priceModifier: decimal2("price_modifier", { precision: 10, scale: 2 }).default("0.00"),
      accompanimentCategoryId: int2("accompaniment_category_id").references(() => accompanimentCategories.id),
      isActive: boolean("is_active").notNull().default(true),
      ingredients: text("ingredients"),
      // ✅ Colunas Nutricionais revisadas para bater com o Frontend/Roteador
      energyKcal: int2("energy_kcal"),
      energyKj: decimal2("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
      proteins: decimal2("proteins", { precision: 10, scale: 2 }).default("0.00"),
      carbs: decimal2("carbs", { precision: 10, scale: 2 }).default("0.00"),
      fatTotal: decimal2("fat_total", { precision: 10, scale: 2 }).default("0.00"),
      fatSaturated: decimal2("fat_saturated", { precision: 10, scale: 2 }).default("0.00"),
      fatTrans: decimal2("fat_trans", { precision: 10, scale: 2 }).default("0.00"),
      fiber: decimal2("fiber", { precision: 10, scale: 2 }).default("0.00"),
      sodium: decimal2("sodium", { precision: 10, scale: 2 }).default("0.00"),
      calcium: decimal2("calcium", { precision: 10, scale: 2 }).default("0.00"),
      iron: decimal2("iron", { precision: 10, scale: 2 }).default("0.00"),
      showNutrition: boolean("show_nutrition").default(false),
      // ✅ Garante que o JSON de composição seja lido corretamente
      nutritionalInfo: longtext("nutritional_info"),
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/catalog.ts
import { relations } from "drizzle-orm";
import {
  mysqlTable as mysqlTable2,
  varchar as varchar2,
  text as text2,
  decimal as decimal3,
  boolean as boolean2,
  int as int3,
  timestamp as timestamp3,
  primaryKey,
  longtext as longtext2
} from "drizzle-orm/mysql-core";
var ingredients, nutritionFacts, categories, accompanimentCategories, dishes, dishSizes, accompanimentGroups, groupToOptions, dishComposition, dishesToSizes, sizeAccompanimentGroups, dishesRelations, categoriesRelations, dishCompositionRelations, dishSizesRelations, accompanimentGroupsRelations;
var init_catalog = __esm({
  "drizzle/schema/catalog.ts"() {
    "use strict";
    init_nutrition();
    init_accompaniments();
    ingredients = mysqlTable2("ingredients", {
      id: int3("id").primaryKey().autoincrement(),
      name: varchar2("name", { length: 255 }).notNull(),
      category: varchar2("category", { length: 100 }),
      source: varchar2("source", { length: 50 }).default("Manual"),
      unit: varchar2("unit", { length: 20 }).default("g"),
      updatedAt: timestamp3("updated_at").defaultNow().onUpdateNow()
    });
    nutritionFacts = mysqlTable2("nutrition_facts", nutritionFactsColumns);
    categories = mysqlTable2("categories", {
      id: int3("id").primaryKey().autoincrement(),
      name: varchar2("name", { length: 255 }).notNull(),
      slug: varchar2("slug", { length: 255 }).notNull().unique(),
      description: text2("description"),
      iconKey: varchar2("icon_key", { length: 50 }),
      // ✅ ADICIONADO: Coluna color para suportar a personalização do Drawer e do Site
      color: varchar2("color", { length: 20 }).default("slate"),
      imageUrl: varchar2("image_url", { length: 500 }),
      displayOrder: int3("display_order").default(0),
      isActive: boolean2("is_active").default(true),
      allowAccompaniments: boolean2("allow_accompaniments").default(true),
      createdAt: timestamp3("created_at").defaultNow(),
      updatedAt: timestamp3("updated_at").defaultNow().onUpdateNow()
    });
    accompanimentCategories = mysqlTable2("accompaniment_categories", {
      id: int3("id").primaryKey().autoincrement(),
      name: varchar2("name", { length: 100 }).notNull().unique(),
      iconKey: varchar2("icon_key", { length: 50 }),
      color: varchar2("color", { length: 20 }),
      displayOrder: int3("display_order").default(0),
      isActive: boolean2("is_active").default(true)
    });
    dishes = mysqlTable2("dishes", {
      id: int3("id").primaryKey().autoincrement(),
      woocommerceId: int3("woocommerce_id"),
      name: varchar2("name", { length: 255 }).notNull(),
      slug: varchar2("slug", { length: 255 }).notNull().unique(),
      description: longtext2("description"),
      imageUrl: varchar2("image_url", { length: 500 }),
      basePrice: decimal3("base_price", { precision: 10, scale: 2 }).notNull(),
      salePrice: decimal3("sale_price", { precision: 10, scale: 2 }),
      categoryId: int3("category_id").references(() => categories.id, { onDelete: "set null" }),
      isActive: boolean2("is_active").default(true),
      showNutrition: boolean2("show_nutrition").default(false),
      isVegetarian: boolean2("is_vegetarian").default(false),
      isGlutenFree: boolean2("is_gluten_free").default(false),
      isLactoseFree: boolean2("is_lactose_free").default(false),
      ingredients: text2("ingredients"),
      nutritionalInfo: longtext2("nutritional_info"),
      // Nutrição consolidada (facilitando leitura do BI e Front)
      energyKcal: decimal3("energy_kcal", { precision: 10, scale: 2 }).default("0.00"),
      energyKj: decimal3("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
      proteins: decimal3("proteins", { precision: 10, scale: 2 }).default("0.00"),
      carbs: decimal3("carbs", { precision: 10, scale: 2 }).default("0.00"),
      fatTotal: decimal3("fat_total", { precision: 10, scale: 2 }).default("0.00"),
      fatSaturated: decimal3("fat_saturated", { precision: 10, scale: 3 }).default("0.000"),
      fatTrans: decimal3("fat_trans", { precision: 10, scale: 3 }).default("0.000"),
      fiber: decimal3("fiber", { precision: 10, scale: 2 }).default("0.00"),
      sodium: decimal3("sodium", { precision: 10, scale: 2 }).default("0.00"),
      isVisible: boolean2("is_visible").default(true),
      status: varchar2("status", { length: 20 }).default("active"),
      displayOrder: int3("display_order").default(0),
      yieldFactor: decimal3("yield_factor", { precision: 10, scale: 2 }).default("1.00"),
      calcium: decimal3("calcium", { precision: 10, scale: 2 }).default("0.00"),
      iron: decimal3("iron", { precision: 10, scale: 2 }).default("0.00"),
      createdAt: timestamp3("created_at").defaultNow(),
      updatedAt: timestamp3("updated_at").defaultNow().onUpdateNow()
    });
    dishSizes = mysqlTable2("dish_sizes", {
      id: int3("id").primaryKey().autoincrement(),
      name: varchar2("name", { length: 50 }).notNull(),
      price: decimal3("price", { precision: 10, scale: 2 }).default("0.00"),
      priceModifier: decimal3("price_modifier", { precision: 10, scale: 2 }).default("0.00"),
      mainDishWeight: decimal3("main_dish_weight", { precision: 10, scale: 2 }).default("200.00"),
      displayOrder: int3("display_order").notNull().default(0),
      isActive: boolean2("is_active").notNull().default(true),
      iconKey: varchar2("icon_key", { length: 50 }).default("Box"),
      color: varchar2("color", { length: 20 }).default("slate"),
      description: text2("description"),
      groupsOrder: text2("groups_order"),
      weight: varchar2("weight", { length: 20 })
    });
    accompanimentGroups = mysqlTable2("accompaniment_groups", {
      id: int3("id").primaryKey().autoincrement(),
      name: varchar2("name", { length: 255 }).notNull(),
      slug: varchar2("slug", { length: 255 }).notNull().unique(),
      defaultGrammage: decimal3("default_grammage", { precision: 10, scale: 2 }).default("100.00"),
      itemsOrder: longtext2("items_order"),
      maxSelections: int3("max_selections").notNull().default(1),
      minSelections: int3("min_selections").notNull().default(0),
      isActive: boolean2("is_active").notNull().default(true)
    });
    groupToOptions = mysqlTable2("group_to_options", {
      id: int3("id").primaryKey().autoincrement(),
      groupId: int3("group_id").notNull().references(() => accompanimentGroups.id, { onDelete: "cascade" }),
      optionId: int3("option_id").notNull().references(() => accompanimentOptions.id, { onDelete: "cascade" })
    });
    dishComposition = mysqlTable2("dish_composition", {
      id: int3("id").primaryKey().autoincrement(),
      dishId: int3("dish_id").references(() => dishes.id, { onDelete: "cascade" }),
      accompanimentOptionId: int3("accompaniment_option_id"),
      ingredientId: int3("ingredient_id").references(() => ingredients.id),
      ingredientName: varchar2("ingredient_name", { length: 255 }),
      quantity: decimal3("quantity", { precision: 10, scale: 3 }).notNull(),
      unit: varchar2("unit", { length: 20 }).default("g"),
      energyKcal: decimal3("energy_kcal", { precision: 10, scale: 2 }).default("0.00"),
      energyKj: decimal3("energy_kj", { precision: 10, scale: 2 }).default("0.00"),
      proteins: decimal3("proteins", { precision: 10, scale: 3 }).default("0.000"),
      carbs: decimal3("carbs", { precision: 10, scale: 3 }).default("0.000"),
      fatTotal: decimal3("fat_total", { precision: 10, scale: 3 }).default("0.000"),
      fatSaturated: decimal3("fat_saturated", { precision: 10, scale: 3 }).default("0.000"),
      fatTrans: decimal3("fat_trans", { precision: 10, scale: 3 }).default("0.000"),
      fiber: decimal3("fiber", { precision: 10, scale: 3 }).default("0.000"),
      sodium: decimal3("sodium", { precision: 10, scale: 2 }).default("0.00"),
      calcium: decimal3("calcium", { precision: 10, scale: 2 }).default("0.00"),
      iron: decimal3("iron", { precision: 10, scale: 2 }).default("0.00")
    });
    dishesToSizes = mysqlTable2("dishes_to_sizes", {
      dishId: int3("dish_id").notNull().references(() => dishes.id, { onDelete: "cascade" }),
      sizeId: int3("size_id").notNull().references(() => dishSizes.id, { onDelete: "cascade" })
    }, (t2) => ({
      pk: primaryKey({ columns: [t2.dishId, t2.sizeId] })
    }));
    sizeAccompanimentGroups = mysqlTable2("size_accompaniment_groups", {
      id: int3("id").primaryKey().autoincrement(),
      sizeId: int3("size_id").notNull().references(() => dishSizes.id, { onDelete: "cascade" }),
      accompanimentGroupId: int3("accompaniment_group_id").notNull().references(() => accompanimentGroups.id, { onDelete: "cascade" }),
      minSelections: int3("min_selections"),
      maxSelections: int3("max_selections")
    });
    dishesRelations = relations(dishes, ({ one, many }) => ({
      category: one(categories, { fields: [dishes.categoryId], references: [categories.id] }),
      sizes: many(dishesToSizes),
      composition: many(dishComposition)
    }));
    categoriesRelations = relations(categories, ({ many }) => ({
      dishes: many(dishes)
    }));
    dishCompositionRelations = relations(dishComposition, ({ one }) => ({
      dish: one(dishes, { fields: [dishComposition.dishId], references: [dishes.id] }),
      ingredient: one(ingredients, { fields: [dishComposition.ingredientId], references: [ingredients.id] }),
      accompanimentOption: one(accompanimentOptions, { fields: [dishComposition.accompanimentOptionId], references: [accompanimentOptions.id] })
    }));
    dishSizesRelations = relations(dishSizes, ({ many }) => ({
      dishLinks: many(dishesToSizes),
      accompanimentGroups: many(sizeAccompanimentGroups)
    }));
    accompanimentGroupsRelations = relations(accompanimentGroups, ({ many }) => ({
      options: many(groupToOptions),
      sizeLinks: many(sizeAccompanimentGroups)
    }));
  }
});

// drizzle/schema/packages.ts
import { relations as relations2 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable3,
  varchar as varchar3,
  text as text3,
  decimal as decimal4,
  boolean as boolean3,
  int as int4,
  timestamp as timestamp4,
  json,
  longtext as longtext3
} from "drizzle-orm/mysql-core";
var packages, packageOptions, packageOptionDishes, packageOptionGroups, packageRelations, packageOptionsRelations, packageOptionDishesRelations, packageOptionGroupsRelations, accompanimentOptionsWithCategoryRelations;
var init_packages = __esm({
  "drizzle/schema/packages.ts"() {
    "use strict";
    init_orders();
    init_accompaniments();
    init_catalog();
    packages = mysqlTable3("packages", {
      id: varchar3("id", { length: 255 }).primaryKey(),
      name: varchar3("name", { length: 255 }).notNull(),
      slug: varchar3("slug", { length: 255 }).notNull().unique(),
      description: text3("description"),
      // ✅ COLUNAS PARA VITRINE PREMIUM & FILTROS
      // highlights: frases separadas por vírgula para os checks do card
      highlights: text3("highlights"),
      // category: para vincular aos filtros (Emagrecimento, Ganho de Massa, etc)
      category: varchar3("category", { length: 100 }),
      // isPopular: ativa o badge de destaque e borda esmeralda
      isPopular: boolean3("is_popular").default(false),
      price: decimal4("base_price", { precision: 10, scale: 2 }).notNull(),
      salePrice: decimal4("sale_price", { precision: 10, scale: 2 }),
      sizeId: int4("size_id").references(() => dishSizes.id, { onDelete: "set null" }),
      numberOfOptions: int4("number_of_options").default(3),
      month: varchar3("month", { length: 50 }),
      imageUrl: varchar3("image_url", { length: 500 }),
      displayOrder: int4("display_order").default(0),
      status: varchar3("status", { length: 20 }).default("active"),
      isActive: boolean3("is_active").default(true),
      config: json("config").$type(),
      createdAt: timestamp4("created_at").defaultNow(),
      updatedAt: timestamp4("updated_at").defaultNow().onUpdateNow()
    });
    packageOptions = mysqlTable3("package_options", {
      id: int4("id").primaryKey().autoincrement(),
      packageId: varchar3("package_id", { length: 255 }).notNull().references(() => packages.id, { onDelete: "cascade" }),
      name: varchar3("name", { length: 255 }).notNull(),
      optionOrder: int4("option_order").default(0),
      createdAt: timestamp4("created_at").defaultNow()
    });
    packageOptionDishes = mysqlTable3("package_option_dishes", {
      id: int4("id").primaryKey().autoincrement(),
      optionId: int4("option_id").notNull().references(() => packageOptions.id, { onDelete: "cascade" }),
      dishId: int4("dish_id").notNull().references(() => dishes.id, { onDelete: "cascade" })
    });
    packageOptionGroups = mysqlTable3("package_option_groups", {
      id: int4("id").primaryKey().autoincrement(),
      optionId: int4("option_id").notNull().references(() => packageOptions.id, { onDelete: "cascade" }),
      groupId: int4("group_id").notNull().references(() => accompanimentGroups.id, { onDelete: "cascade" }),
      itemsOrder: longtext3("items_order")
    });
    packageRelations = relations2(packages, ({ one, many }) => ({
      orderItems: many(orderItems),
      options: many(packageOptions),
      size: one(dishSizes, {
        fields: [packages.sizeId],
        references: [dishSizes.id]
      })
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
  }
});

// drizzle/schema/loyalty.ts
import { relations as relations3 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable4,
  varchar as varchar4,
  text as text4,
  decimal as decimal5,
  boolean as boolean4,
  int as int5,
  timestamp as timestamp5,
  json as json2
} from "drizzle-orm/mysql-core";
var loyaltySettings, loyaltyPoints, loyaltyHistory, loyaltyPointsRelations, loyaltyHistoryRelations;
var init_loyalty = __esm({
  "drizzle/schema/loyalty.ts"() {
    "use strict";
    init_users();
    init_orders();
    loyaltySettings = mysqlTable4("loyalty_settings", {
      // Ajustado para varchar(255) conforme seu código, mas garanta que o banco suporte
      id: varchar4("id", { length: 255 }).primaryKey(),
      enabled: boolean4("enabled").default(true),
      // --- REGRAS DE ACÚMULO (CONVERSÃO) ---
      // Relação Real -> Pontos (Ex: R$ 1,00 gasto = 1 ponto ganho)
      conversionRatePoints: int5("conversion_rate_points").default(1),
      conversionRateMoney: decimal5("conversion_rate_money", { precision: 10, scale: 2 }).default("1.00"),
      // --- REGRAS DE RESGATE (REDEMPTION) ---
      // ✅ NOVA COLUNA: Regras por Faixa (JSON)
      redemptionRules: json2("redemption_rules").$type().notNull().default([]),
      // ✅ RESGATE LINEAR (FALLBACK): Removida a duplicidade de chaves
      redemptionRatePoints: int5("redemption_rate_points").default(100),
      redemptionRateMoney: decimal5("redemption_rate_money", { precision: 10, scale: 2 }).default("1.00"),
      // --- LIMITES E TRAVAS ---
      minCartAmount: decimal5("min_cart_amount", { precision: 10, scale: 2 }).default("0.00"),
      maxDiscountAmount: decimal5("max_discount_amount", { precision: 10, scale: 2 }).default("50.00"),
      // Mensagem personalizada para valor mínimo insuficiente
      minOrderMessage: text4("min_order_message"),
      // --- BÔNUS E VALIDADE ---
      pointsPerSignup: int5("points_per_signup").default(0),
      pointsPerReview: int5("points_per_review").default(0),
      pointsExpirationDays: int5("points_expiration_days").default(365),
      updatedAt: timestamp5("updated_at").defaultNow().onUpdateNow()
    });
    loyaltyPoints = mysqlTable4("loyalty_points", {
      userId: varchar4("user_id", { length: 255 }).primaryKey().references(() => users.id, { onDelete: "cascade" }),
      availablePoints: int5("available_points").default(0).notNull(),
      totalEarned: int5("total_earned").default(0).notNull(),
      updatedAt: timestamp5("updated_at").defaultNow().onUpdateNow()
    });
    loyaltyHistory = mysqlTable4("loyalty_history", {
      id: varchar4("id", { length: 255 }).primaryKey(),
      userId: varchar4("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      orderId: varchar4("order_id", { length: 255 }).references(() => orders.id, { onDelete: "set null" }),
      pointsChange: int5("points_change").notNull(),
      type: varchar4("type", { length: 20 }).default("earned").notNull(),
      // 'earned', 'spent', 'expired', 'bonus'
      reason: varchar4("reason", { length: 255 }),
      description: text4("description"),
      createdAt: timestamp5("created_at").defaultNow()
    });
    loyaltyPointsRelations = relations3(loyaltyPoints, ({ one }) => ({
      user: one(users, { fields: [loyaltyPoints.userId], references: [users.id] })
    }));
    loyaltyHistoryRelations = relations3(loyaltyHistory, ({ one }) => ({
      user: one(users, { fields: [loyaltyHistory.userId], references: [users.id] }),
      order: one(orders, { fields: [loyaltyHistory.orderId], references: [orders.id] })
    }));
  }
});

// drizzle/schema/aiIntelligence.ts
import {
  mysqlTable as mysqlTable5,
  serial,
  text as text5,
  varchar as varchar5,
  timestamp as timestamp6,
  json as json3,
  boolean as boolean5,
  int as int6,
  decimal as decimal6,
  index
} from "drizzle-orm/mysql-core";
var nutriScansTemp, agentRuns, aiExpertLogs, aiExpertTerms, agentActions;
var init_aiIntelligence = __esm({
  "drizzle/schema/aiIntelligence.ts"() {
    "use strict";
    nutriScansTemp = mysqlTable5("nutri_scans_temp", {
      id: varchar5("id", { length: 255 }).primaryKey(),
      // ✅ userId agora é mandatório para evitar scans órfãos e permitir contador
      userId: varchar5("user_id", { length: 255 }).notNull(),
      rawText: text5("raw_text"),
      suggestedData: json3("suggested_data"),
      status: varchar5("status", { length: 50 }).default("pending"),
      sourceType: varchar5("source_type", { length: 50 }).default("ocr"),
      // Mantido para compatibilidade, mas o foco agora é histórico
      expiresAt: timestamp6("expires_at"),
      // ✅ createdAt com notNull e defaultNow para o filtro de "scans de hoje"
      createdAt: timestamp6("created_at").defaultNow().notNull()
    }, (table) => ({
      // ✅ Índices essenciais para performance do Dashboard e Contador
      userIdIdx: index("user_id_idx").on(table.userId),
      createdAtIdx: index("created_at_idx").on(table.createdAt)
    }));
    agentRuns = mysqlTable5("agent_runs", {
      id: varchar5("id", { length: 255 }).primaryKey(),
      scanId: varchar5("scan_id", { length: 255 }),
      domain: varchar5("domain", { length: 50 }).default("nutrition"),
      provider: varchar5("provider", { length: 50 }).default("google"),
      model: varchar5("model", { length: 50 }),
      promptVersion: varchar5("prompt_version", { length: 20 }),
      inputTokens: int6("input_tokens"),
      outputTokens: int6("output_tokens"),
      latencyMs: int6("latency_ms"),
      costEstimate: decimal6("cost_estimate", { precision: 10, scale: 6 }),
      rawOutput: text5("raw_output"),
      status: varchar5("status", { length: 20 }),
      errorMessage: text5("error_message"),
      createdAt: timestamp6("created_at").defaultNow()
    });
    aiExpertLogs = mysqlTable5("ai_expert_logs", {
      id: serial("id").primaryKey(),
      runId: varchar5("run_id", { length: 255 }),
      inputHash: varchar5("input_hash", { length: 64 }).unique(),
      normalizedHash: varchar5("normalized_hash", { length: 64 }),
      rawInputText: text5("raw_input_text").notNull(),
      aiSuggestedJson: json3("ai_suggested_json").notNull(),
      finalCorrectedJson: json3("final_corrected_json"),
      confidenceScore: decimal6("confidence_score", { precision: 3, scale: 2 }),
      wasCorrected: boolean5("was_corrected").default(false),
      createdAt: timestamp6("created_at").defaultNow(),
      updatedAt: timestamp6("updated_at").defaultNow().onUpdateNow()
    }, (table) => ({
      inputHashIdx: index("input_hash_idx").on(table.inputHash),
      normalizedHashIdx: index("normalized_hash_idx").on(table.normalizedHash)
    }));
    aiExpertTerms = mysqlTable5("ai_expert_terms", {
      id: serial("id").primaryKey(),
      term: varchar5("term", { length: 255 }).unique().notNull(),
      targetType: varchar5("target_type", { length: 50 }),
      targetId: varchar5("target_id", { length: 255 }),
      synonyms: json3("synonyms"),
      useCount: int6("use_count").default(1),
      isActive: boolean5("is_active").default(true),
      updatedAt: timestamp6("updated_at").defaultNow().onUpdateNow()
    });
    agentActions = mysqlTable5("agent_actions", {
      id: serial("id").primaryKey(),
      runId: varchar5("run_id", { length: 255 }),
      actionType: varchar5("action_type", { length: 50 }),
      payload: json3("payload"),
      status: varchar5("status", { length: 20 }),
      executedAt: timestamp6("executed_at"),
      approvedBy: varchar5("approved_by", { length: 255 })
    });
  }
});

// server/encryption.ts
import * as crypto2 from "crypto";
import { customType } from "drizzle-orm/mysql-core";
function getEncryptionKey() {
  let key = process.env.DB_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u274C ERRO CR\xCDTICO: DB_ENCRYPTION_KEY n\xE3o configurada!");
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
  const cleanData = input.replace(/\D/g, "").trim();
  return crypto2.createHash("sha256").update(cleanData).digest("hex");
}
function encrypt(text19) {
  if (!text19) return null;
  const t2 = String(text19).trim();
  if (!t2) return null;
  try {
    const key = getEncryptionKey();
    const iv = crypto2.randomBytes(IV_LENGTH);
    const cipher = crypto2.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(t2, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch {
    return null;
  }
}
function decrypt(data) {
  if (!data) return null;
  const text19 = Buffer.isBuffer(data) ? data.toString("utf-8") : String(data);
  const parts = text19.split(":");
  if (parts.length !== 3) return text19;
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
  } catch {
    return text19;
  }
}
var ALGORITHM, IV_LENGTH, encryptedText;
var init_encryption = __esm({
  "server/encryption.ts"() {
    "use strict";
    ALGORITHM = "aes-256-gcm";
    IV_LENGTH = 12;
    encryptedText = (columnName) => customType({
      dataType() {
        return "blob";
      },
      toDriver(value) {
        return encrypt(value);
      },
      fromDriver(value) {
        return decrypt(Buffer.isBuffer(value) ? value : String(value));
      }
    })(columnName);
  }
});

// drizzle/schema/orders.ts
import { relations as relations4 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable6,
  varchar as varchar6,
  decimal as decimal7,
  int as int7,
  timestamp as timestamp7,
  mysqlEnum as mysqlEnum2,
  text as text6,
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
    init_aiIntelligence();
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
        } catch {
          return str;
        }
      }
    });
    orders = mysqlTable6("orders", {
      id: varchar6("id", { length: 255 }).primaryKey(),
      userId: varchar6("user_id", { length: 255 }).notNull().references(() => users.id),
      originScanId: varchar6("origin_scan_id", { length: 255 }),
      status: mysqlEnum2("status", ["pending", "preparing", "shipped", "delivered", "cancelled", "completed"]).default("pending").notNull(),
      subtotal: decimal7("subtotal", { precision: 10, scale: 2 }).notNull(),
      shippingCost: decimal7("shipping_cost", { precision: 10, scale: 2 }).default("0.00").notNull(),
      totalDiscount: decimal7("total_discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
      total: decimal7("total", { precision: 10, scale: 2 }).notNull(),
      referralCode: varchar6("referral_code", { length: 50 }),
      pointsUsed: int7("points_used").default(0),
      pointsEarned: int7("points_earned").default(0),
      loyaltyDiscount: decimal7("loyalty_discount", { precision: 10, scale: 2 }).default("0.00"),
      cartId: varchar6("cart_id", { length: 36 }),
      discountsSnapshot: text6("discounts_snapshot"),
      paymentMethod: varchar6("payment_method", { length: 255 }).notNull(),
      paymentStatus: mysqlEnum2("payment_status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
      pixCopyPaste: text6("pix_copy_paste"),
      customerName: encryptedText2("customer_name"),
      customerDocument: encryptedText2("customer_document"),
      customerPhone: encryptedText2("customer_phone"),
      customerDocumentHash: varchar6("customer_document_hash", { length: 255 }),
      customerPhoneHash: varchar6("customer_phone_hash", { length: 255 }),
      shippingAddress: encryptedText2("shipping_address"),
      shippingAddressNumber: encryptedText2("shipping_address_number"),
      shippingAddressComplement: encryptedText2("shipping_address_complement"),
      shippingNeighborhood: encryptedText2("shipping_neighborhood"),
      shippingCity: varchar6("shipping_city", { length: 100 }),
      shippingState: varchar6("shipping_state", { length: 2 }),
      shippingZipCode: varchar6("shipping_zip_code", { length: 20 }),
      notes: text6("notes"),
      createdAt: timestamp7("created_at").defaultNow(),
      updatedAt: timestamp7("updated_at").defaultNow().onUpdateNow()
    });
    orderItems = mysqlTable6("order_items", {
      id: varchar6("id", { length: 255 }).primaryKey(),
      orderId: varchar6("order_id", { length: 255 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
      dishId: varchar6("dish_id", { length: 255 }).references(() => dishes.id),
      packageId: varchar6("package_id", { length: 255 }).references(() => packages.id),
      dishName: varchar6("dish_name", { length: 255 }).notNull(),
      sizeName: varchar6("size_name", { length: 100 }),
      quantity: int7("quantity").notNull(),
      unitPrice: decimal7("unit_price", { precision: 10, scale: 2 }).notNull(),
      discountAmount: decimal7("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
      totalPrice: decimal7("total_price", { precision: 10, scale: 2 }).notNull(),
      options: text6("options"),
      appliedNutrition: text6("applied_nutrition")
    });
    ordersRelations = relations4(orders, ({ one, many }) => ({
      user: one(users, { fields: [orders.userId], references: [users.id] }),
      scan: one(nutriScansTemp, { fields: [orders.originScanId], references: [nutriScansTemp.id] }),
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
  mysqlTable as mysqlTable7,
  varchar as varchar7,
  text as text7,
  decimal as decimal8,
  boolean as boolean6,
  int as int8,
  timestamp as timestamp8,
  mysqlEnum as mysqlEnum3
} from "drizzle-orm/mysql-core";
var discountRules, coupons, couponUsage, couponRelations, couponUsageRelations;
var init_marketing = __esm({
  "drizzle/schema/marketing.ts"() {
    "use strict";
    init_users();
    init_orders();
    discountRules = mysqlTable7("discount_rules", {
      id: int8("id").primaryKey().autoincrement(),
      name: varchar7("name", { length: 255 }).notNull(),
      description: varchar7("description", { length: 512 }),
      // Colunas de Quantidade (min_quantity)
      minQuantity: int8("min_quantity"),
      maxQuantity: int8("max_quantity"),
      // Mapeamento: JS 'discountType' -> DB 'type' | JS 'discountValue' -> DB 'value'
      discountType: mysqlEnum3("type", ["percentage", "fixed"]).notNull(),
      discountValue: decimal8("value", { precision: 10, scale: 2 }).notNull(),
      priority: int8("priority"),
      isActive: boolean6("is_active").default(true),
      createdAt: timestamp8("created_at").defaultNow(),
      updatedAt: timestamp8("updated_at").defaultNow().onUpdateNow()
    });
    coupons = mysqlTable7("coupons", {
      id: varchar7("id", { length: 255 }).primaryKey(),
      code: varchar7("code", { length: 50 }).notNull().unique(),
      description: text7("description"),
      // ✅ NOVAS COLUNAS PARA PERSONALIZAÇÃO VISUAL
      // bannerColor: Define a cor de fundo do card (padrão verde emerald)
      bannerColor: varchar7("banner_color", { length: 10 }).default("#10b981"),
      // logoUrl: Link para a imagem/ícone da campanha (pode ser nulo)
      logoUrl: varchar7("logo_url", { length: 255 }),
      // Mapeamento: JS 'discountType' -> DB 'discount_type'
      discountType: mysqlEnum3("discount_type", ["percentage", "fixed"]).notNull(),
      discountValue: decimal8("discount_value", { precision: 10, scale: 2 }).notNull(),
      minOrderValue: decimal8("min_order_value", { precision: 10, scale: 2 }),
      maxDiscount: decimal8("max_discount", { precision: 10, scale: 2 }),
      usageLimit: int8("usage_limit"),
      validFrom: timestamp8("valid_from"),
      validUntil: timestamp8("valid_until"),
      isActive: boolean6("is_active").default(true),
      createdAt: timestamp8("created_at").defaultNow()
    });
    couponUsage = mysqlTable7("coupon_usage", {
      id: varchar7("id", { length: 255 }).primaryKey(),
      couponId: varchar7("coupon_id", { length: 255 }).notNull().references(() => coupons.id),
      userId: varchar7("user_id", { length: 255 }).notNull().references(() => users.id),
      orderId: varchar7("order_id", { length: 255 }).references(() => orders.id),
      usedAt: timestamp8("used_at").defaultNow()
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
  mysqlTable as mysqlTable8,
  varchar as varchar8,
  text as text8,
  decimal as decimal9,
  boolean as boolean7,
  int as int9,
  timestamp as timestamp9,
  longtext as longtext4,
  serial as serial2
} from "drizzle-orm/mysql-core";
var appConfigs, storeSettings, paymentMethods, foodCardBrands, mediaLibrary, siteTheme, labelTemplates, paymentMethodRelations, mediaLibraryRelations;
var init_config = __esm({
  "drizzle/schema/config.ts"() {
    "use strict";
    init_users();
    appConfigs = mysqlTable8("app_configs", {
      configKey: varchar8("config_key", { length: 100 }).primaryKey(),
      configValue: longtext4("config_value"),
      // Usamos longtext para suportar JSON grande de parceiros
      updatedAt: timestamp9("updated_at").defaultNow().onUpdateNow()
    });
    storeSettings = mysqlTable8("store_settings", {
      id: varchar8("id", { length: 255 }).primaryKey().default("1"),
      logoUrl: varchar8("logo_url", { length: 255 }),
      favicon: varchar8("favicon", { length: 255 }),
      emergencyMode: boolean7("emergency_mode").default(false),
      generalMinOrderAmount: varchar8("general_min_order_amount", { length: 50 }).default("0.00"),
      minOrderMessage: text8("min_order_message"),
      createdAt: timestamp9("created_at").defaultNow(),
      updatedAt: timestamp9("updated_at").defaultNow().onUpdateNow(),
      siteTheme: text8("site_theme")
    });
    paymentMethods = mysqlTable8("payment_methods", {
      id: varchar8("id", { length: 255 }).primaryKey(),
      name: varchar8("name", { length: 100 }).notNull(),
      description: text8("description"),
      icon: varchar8("icon", { length: 100 }),
      isActive: boolean7("is_active").default(true),
      displayOrder: int9("display_order").default(0),
      brandName: varchar8("brand_name", { length: 100 }),
      brandLogoUrl: varchar8("brand_logo_url", { length: 255 }),
      discountPercentage: decimal9("discount_percentage", { precision: 5, scale: 2 }).default("0.00"),
      createdAt: timestamp9("created_at").defaultNow(),
      updatedAt: timestamp9("updated_at").defaultNow().onUpdateNow()
    });
    foodCardBrands = mysqlTable8("food_card_brands", {
      id: varchar8("id", { length: 255 }).primaryKey(),
      name: varchar8("name", { length: 100 }).notNull(),
      isActive: boolean7("is_active").default(true)
    });
    mediaLibrary = mysqlTable8("media_library", {
      id: varchar8("id", { length: 255 }).primaryKey(),
      url: varchar8("url", { length: 512 }).notNull(),
      fileName: varchar8("file_name", { length: 255 }).notNull(),
      mimeType: varchar8("mime_type", { length: 50 }),
      size: int9("size"),
      altText: varchar8("alt_text", { length: 255 }),
      uploadedBy: varchar8("uploaded_by", { length: 255 }).references(() => users.id),
      createdAt: timestamp9("created_at").defaultNow()
    });
    siteTheme = mysqlTable8("site_theme", {
      id: varchar8("id", { length: 255 }).primaryKey(),
      borderRadius: varchar8("border_radius", { length: 10 }).notNull().default("0.5rem"),
      primaryColor: varchar8("primary_color", { length: 20 }).notNull().default("160 8% 35%"),
      primaryForeground: varchar8("primary_foreground", { length: 20 }).notNull().default("0 0% 100%"),
      secondaryColor: varchar8("secondary_color", { length: 20 }).notNull().default("48 96% 62%"),
      secondaryForeground: varchar8("secondary_foreground", { length: 20 }).notNull().default("160 2% 22%"),
      backgroundColor: varchar8("background_color", { length: 20 }).notNull().default("0 0% 100%"),
      foregroundColor: varchar8("foreground_color", { length: 20 }).notNull().default("222 47.4% 11.2%"),
      borderColor: varchar8("border_color", { length: 20 }).notNull().default("240 5.9% 90%"),
      ringColor: varchar8("ring_color", { length: 20 }).notNull().default("160 8% 35%"),
      cardColor: varchar8("card_color", { length: 20 }).notNull().default("0 0% 100%"),
      cardForeground: varchar8("card_foreground", { length: 20 }).notNull().default("222 47.4% 11.2%"),
      inputColor: varchar8("input_color", { length: 20 }).notNull().default("240 5.9% 90%"),
      darkPrimaryColor: varchar8("dark_primary_color", { length: 20 }).notNull().default("160 8% 35%"),
      darkBackgroundColor: varchar8("dark_background_color", { length: 20 }).notNull().default("224 71.4% 4.1%"),
      headerBgColor: varchar8("header_bg_color", { length: 50 }).default("0 0% 100%"),
      footerBgColor: varchar8("footer_bg_color", { length: 50 }).default("160 8% 35%"),
      footerTextColor: varchar8("footer_text_color", { length: 50 }).default("0 0% 100%"),
      updatedAt: timestamp9("updated_at").defaultNow().onUpdateNow()
    });
    labelTemplates = mysqlTable8("label_templates", {
      id: serial2("id").primaryKey(),
      // Usamos serial para auto-incremento numérico
      name: varchar8("name", { length: 100 }).notNull(),
      // Nome ex: "Marmita Padrão"
      width: int9("width").default(100),
      // Largura em mm
      height: int9("height").default(60),
      // Altura em mm
      elements: longtext4("elements").notNull(),
      // O JSON completo dos textos/tags
      isDefault: boolean7("is_default").default(false),
      // Se será o carregado por padrão
      createdAt: timestamp9("created_at").defaultNow(),
      updatedAt: timestamp9("updated_at").defaultNow().onUpdateNow()
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
  mysqlTable as mysqlTable9,
  varchar as varchar9,
  decimal as decimal10,
  boolean as boolean8,
  int as int10,
  timestamp as timestamp10,
  mysqlEnum as mysqlEnum4,
  smallint,
  index as index2
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
    users = mysqlTable9("users", {
      id: varchar9("id", { length: 255 }).primaryKey(),
      // Índices para busca (hashes ou termos normalizados)
      nameIndex: varchar9("name_index", { length: 255 }),
      documentIndex: varchar9("document_index", { length: 255 }),
      phoneIndex: varchar9("phone_index", { length: 255 }),
      email: varchar9("email", { length: 255 }).notNull().unique(),
      name: encryptedText("name"),
      customerDocument: encryptedText("customer_document"),
      phone: encryptedText("phone"),
      phoneLast4: varchar9("phone_last4", { length: 4 }),
      role: mysqlEnum4("role", ["admin", "user", "nutri"]).default("user"),
      password: varchar9("password", { length: 255 }),
      // --- CAMPOS DE RECUPERAÇÃO DE SENHA ---
      resetToken: varchar9("reset_token", { length: 255 }),
      resetExpires: timestamp10("reset_token_expires_at"),
      needsPasswordReset: int10("needs_password_reset").default(0),
      availablePoints: int10("loyalty_balance").default(0).notNull(),
      /**
       * ✅ SISTEMA DE CRÉDITOS IA
       * aiCredits: Saldo mensal de consultas para o Gourmet AI.
       * Padrão: 2 créditos por mês.
       */
      aiCredits: int10("ai_credits").default(2).notNull(),
      // Nova coluna adicionada aqui
      referralCode: varchar9("referral_code", { length: 50 }),
      birthDate: varchar9("birth_date", { length: 255 }),
      birthYear: smallint("birth_year"),
      openId: varchar9("open_id", { length: 255 }),
      loginMethod: varchar9("login_method", { length: 50 }),
      lastSignedIn: timestamp10("last_signed_in"),
      createdAt: timestamp10("created_at").defaultNow(),
      updatedAt: timestamp10("updated_at").defaultNow().onUpdateNow()
    }, (table) => ({
      nameIdx: index2("name_search_idx").on(table.nameIndex),
      docIdx: index2("doc_search_idx").on(table.documentIndex),
      emailIdx: index2("email_idx").on(table.email),
      // Índice opcional se você for criar um admin de monitoramento de uso de IA
      aiCreditsIdx: index2("ai_credits_idx").on(table.aiCredits)
    }));
    user_profiles = mysqlTable9("user_profiles", {
      id: varchar9("id", { length: 255 }).primaryKey(),
      userId: varchar9("user_id", { length: 255 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      birthDate: encryptedText("birth_date"),
      zipCode: encryptedText("zip_code"),
      city: encryptedText("city"),
      state: encryptedText("state"),
      totalSpent: decimal10("total_spent", { precision: 15, scale: 2 }).default("0.00"),
      professional_title: varchar9("professional_title", { length: 100 }),
      createdAt: timestamp10("created_at").defaultNow(),
      updatedAt: timestamp10("updated_at").defaultNow().onUpdateNow()
    });
    userAddresses = mysqlTable9("user_addresses", {
      id: varchar9("id", { length: 255 }).primaryKey(),
      userId: varchar9("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
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
      isDefault: boolean8("is_default").default(false),
      createdAt: timestamp10("created_at").defaultNow(),
      updatedAt: timestamp10("updated_at").defaultNow().onUpdateNow()
    });
    usersRelations = relations7(users, ({ one, many }) => ({
      profile: one(user_profiles),
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
import { mysqlTable as mysqlTable10, varchar as varchar10, decimal as decimal11, timestamp as timestamp11, text as text9, boolean as boolean9, int as int11 } from "drizzle-orm/mysql-core";
var carts;
var init_cart = __esm({
  "drizzle/schema/cart.ts"() {
    "use strict";
    init_users();
    carts = mysqlTable10("carts", {
      /**
       * ✅ ID DO CARRINHO
       * UUID v4 gerado no backend.
       */
      id: varchar10("id", { length: 36 }).primaryKey().notNull(),
      /**
       * 👤 USUÁRIO LOGADO (Opcional)
       */
      userId: varchar10("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
      /**
       * 👻 VISITANTE (Opcional)
       * Armazena o UUID gerado no LocalStorage.
       */
      guestId: varchar10("guest_id", { length: 36 }),
      /**
       * 🚀 MONITORAMENTO: REFERRAL
       * "Carimba" o carrinho com o código de indicação (ex: ?ref=NUTRI01).
       * Essencial para o seu Monitor mostrar quem indicou este cliente.
       */
      referralCode: varchar10("referral_code", { length: 50 }),
      // Status da sessão (active, abandoned, completed)
      status: varchar10("status", { length: 20 }).default("active"),
      // Campo legado para sessão do Lucia
      sessionId: varchar10("session_id", { length: 255 }),
      // 💰 Valores Monetários
      shippingValue: decimal11("shipping_value", { precision: 10, scale: 2 }).default("0.00"),
      discountValue: decimal11("discount_value", { precision: 10, scale: 2 }).default("0.00"),
      // 🎟️ Cupons e Descontos
      couponCode: varchar10("coupon_code", { length: 50 }),
      couponId: int11("coupon_id"),
      /**
       * ✅ Uso do tipo 'boolean'
       */
      usesLoyalty: boolean9("uses_loyalty").default(false),
      // 📦 JSONs de Cache
      discountsJson: text9("discounts_json"),
      itemsSnapshotJson: text9("items_snapshot_json"),
      // Timestamps
      createdAt: timestamp11("created_at").defaultNow(),
      updatedAt: timestamp11("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/cartItems.ts
import { mysqlTable as mysqlTable11, varchar as varchar11, int as int12, decimal as decimal12, timestamp as timestamp12, json as json4, text as text10 } from "drizzle-orm/mysql-core";
var cartItems;
var init_cartItems = __esm({
  "drizzle/schema/cartItems.ts"() {
    "use strict";
    init_cart();
    init_catalog();
    init_packages();
    cartItems = mysqlTable11("cart_items", {
      id: varchar11("id", { length: 255 }).primaryKey(),
      cartId: varchar11("cart_id", { length: 255 }).notNull().references(() => carts.id, { onDelete: "cascade" }),
      dishId: varchar11("dish_id", { length: 255 }).references(() => dishes.id),
      packageId: varchar11("package_id", { length: 255 }).references(() => packages.id),
      quantity: int12("quantity").notNull().default(1),
      unitPrice: decimal12("unit_price", { precision: 10, scale: 2 }).notNull(),
      name: varchar11("name", { length: 255 }),
      imageUrl: varchar11("image_url", { length: 500 }),
      /**
       * ✅ OPTIONS COMO JSON REAL
       * Tipagem estrita para garantir que os acompanhamentos não sumam.
       */
      options: json4("options").$type(),
      /**
       * ✅ APPLIED NUTRITION COMO JSON REAL
       * Snapshot para etiquetas e histórico nutricional.
       */
      appliedNutrition: json4("applied_nutrition").$type(),
      /**
       * ⚠️ CAMPO LEGADO
       * Mantido apenas para compatibilidade, mas a recomendação é usar o JSON 'options'.
       */
      accompaniments: text10("accompaniments"),
      createdAt: timestamp12("created_at").defaultNow()
    });
  }
});

// drizzle/schema/media.ts
import { mysqlTable as mysqlTable12, varchar as varchar12, timestamp as timestamp13, bigint } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
var media;
var init_media = __esm({
  "drizzle/schema/media.ts"() {
    "use strict";
    media = mysqlTable12("media", {
      // ✅ ID Robusto
      id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
      // ✅ URL Completa do Cloudinary (Ex: https://res.cloudinary.com/...)
      url: varchar12("url", { length: 512 }).notNull(),
      // ✅ Nome original para busca (Ex: strogonoff-de-frango)
      originalFilename: varchar12("original_filename", { length: 255 }).notNull(),
      // ✅ Tipo (image/webp, image/jpeg)
      mimeType: varchar12("mime_type", { length: 50 }),
      /**
       * ✅ IMPORTANTE: O public_id do Cloudinary (Ex: pratos/imagem_123)
       * Precisamos dele exato para poder deletar o arquivo da nuvem depois.
       */
      filePath: varchar12("file_path", { length: 255 }).notNull(),
      /**
       * ✅ COLUNA CRUCIAL: Pasta de Organização
       * É através desta coluna que o MediaPickerModal faz o filtro:
       * (item.folder === currentFolder)
       */
      folder: varchar12("folder", { length: 100 }).notNull().default("geral"),
      // ✅ Timestamp de auditoria
      createdAt: timestamp13("created_at").default(sql`CURRENT_TIMESTAMP`)
    });
  }
});

// drizzle/schema/sessions.ts
import { mysqlTable as mysqlTable13, varchar as varchar13, datetime, text as text11 } from "drizzle-orm/mysql-core";
var sessions;
var init_sessions = __esm({
  "drizzle/schema/sessions.ts"() {
    "use strict";
    init_users();
    sessions = mysqlTable13("sessions", {
      /**
       * ✅ ID DA SESSÃO
       * O Lucia Auth exige que este campo seja uma String (VARCHAR).
       */
      id: varchar13("id", { length: 255 }).primaryKey(),
      /**
       * 🚩 USER ID
       * Aponta para a tabela 'users'. 
       */
      userId: varchar13("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      /**
       * 🏷️ VÍNCULO DE INDICAÇÃO (REFERRAL)
       * Armazena o código capturado da URL (?ref=...) para esta sessão específica.
       * Isso garante que a atribuição de venda seja precisa.
       */
      referralCode: varchar13("referral_code", { length: 100 }),
      /**
       * 🆔 GUEST ID (SESSÃO DE CONVIDADO)
       * Útil para vincular o carrinho de quem ainda não logou à sessão atual.
       */
      guestId: varchar13("guest_id", { length: 255 }),
      /**
       * ✅ EXPIRAÇÃO
       * { mode: 'date' } para compatibilidade com Lucia v3+.
       */
      expiresAt: datetime("expires_at", { fsp: 3, mode: "date" }).notNull(),
      /**
       * 🛡️ MONITORAMENTO
       */
      userAgent: text11("user_agent"),
      ipAddress: varchar13("ip_address", { length: 45 })
    });
  }
});

// drizzle/schema/shipping.ts
import {
  mysqlTable as mysqlTable14,
  int as int13,
  varchar as varchar14,
  text as text12,
  decimal as decimal13,
  timestamp as timestamp14,
  boolean as boolean10,
  longtext as longtext5
} from "drizzle-orm/mysql-core";
var geoMesh, shippingZones, shippingRules, shippingSettings;
var init_shipping = __esm({
  "drizzle/schema/shipping.ts"() {
    "use strict";
    geoMesh = mysqlTable14("geo_mesh", {
      // ✅ Padronizado: zipCode no TS, cep no DB (para consistência com addresses)
      zipCode: varchar14("cep", { length: 20 }).primaryKey(),
      neighborhood: varchar14("bairro", { length: 100 }),
      city: varchar14("cidade", { length: 100 }).default("Jundia\xED"),
      storeSlug: varchar14("store_slug", { length: 100 }).default("default"),
      lat: decimal13("lat", { precision: 10, scale: 8 }).notNull(),
      lng: decimal13("lng", { precision: 11, scale: 8 }).notNull(),
      lastSeen: timestamp14("last_seen").defaultNow().onUpdateNow()
    });
    shippingZones = mysqlTable14("shipping_zones", {
      id: int13("id").autoincrement().primaryKey(),
      name: varchar14("name", { length: 255 }).notNull(),
      storeSlug: varchar14("store_slug", { length: 100 }).default("default"),
      description: text12("description"),
      type: varchar14("type", { length: 50 }).default("zipcode"),
      // ✅ CamelCase no TS para bater com as interfaces de lógica
      polygonCoords: longtext5("polygon_coords"),
      // ✅ Padronização de nomes de colunas vs propriedades TS
      zipCodeStart: varchar14("zip_code_start", { length: 20 }).notNull(),
      zipCodeEnd: varchar14("zip_code_end", { length: 20 }).notNull(),
      shippingCost: decimal13("shipping_cost", {
        precision: 10,
        scale: 2
      }).notNull(),
      estimatedDays: int13("estimated_days"),
      isActive: boolean10("is_active").default(true),
      createdAt: timestamp14("created_at").defaultNow(),
      updatedAt: timestamp14("updated_at").defaultNow().onUpdateNow()
    });
    shippingRules = shippingZones;
    shippingSettings = mysqlTable14("shipping_settings", {
      id: int13("id").autoincrement().primaryKey(),
      pickupEnabled: boolean10("pickup_enabled").default(true),
      // ✅ Nomes de propriedades ajustados para casar com o erro do CheckoutView
      pickupLabel: varchar14("pickup_label", { length: 255 }).default("Retirada no Balc\xE3o"),
      pickupInstruction: varchar14("pickup_instruction", { length: 500 }),
      createdAt: timestamp14("created_at").defaultNow(),
      updatedAt: timestamp14("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/logs.ts
import { mysqlTable as mysqlTable15, varchar as varchar15, text as text13, timestamp as timestamp15, serial as serial3 } from "drizzle-orm/mysql-core";
var auditLogs;
var init_logs = __esm({
  "drizzle/schema/logs.ts"() {
    "use strict";
    init_users();
    auditLogs = mysqlTable15("audit_logs", {
      // ✅ SERIAL define automaticamente: INT NOT NULL AUTO_INCREMENT PRIMARY KEY
      id: serial3("id").primaryKey(),
      // Referência ao usuário (UUID do Clerk/Auth)
      userId: varchar15("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
      // Ação executada (Ex: "LOGIN", "UPDATE_PRODUCT")
      action: varchar15("action", { length: 100 }).notNull(),
      // Tabela e ID do registro afetado
      entity: varchar15("entity", { length: 100 }),
      entityId: varchar15("entity_id", { length: 255 }),
      // Valores em JSON (usamos text para compatibilidade ampla)
      oldValues: text13("old_values"),
      newValues: text13("new_values"),
      // Informações de rede
      ipAddress: varchar15("ip_address", { length: 45 }),
      userAgent: text13("user_agent"),
      createdAt: timestamp15("created_at").defaultNow().notNull()
    });
  }
});

// drizzle/schema/showcase.ts
import { mysqlTable as mysqlTable16, varchar as varchar16, int as int14, timestamp as timestamp16, boolean as boolean11, text as text14 } from "drizzle-orm/mysql-core";
var showcases;
var init_showcase = __esm({
  "drizzle/schema/showcase.ts"() {
    "use strict";
    showcases = mysqlTable16("showcases", {
      id: int14("id").primaryKey().autoincrement(),
      title: varchar16("title", { length: 255 }).notNull(),
      description: varchar16("description", { length: 500 }),
      /**
       * ✅ COLUNA ADICIONADA: items
       * Aqui vamos salvar o JSON com os IDs dos pratos (ex: "[1, 4, 12]")
       */
      items: text14("items"),
      active: boolean11("active").default(true),
      order: int14("order").default(0),
      // Para ordenar qual vitrine aparece primeiro
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/admin_orders.ts
import { mysqlTable as mysqlTable17, varchar as varchar17, decimal as decimal14, int as int15, timestamp as timestamp17, longtext as longtext6 } from "drizzle-orm/mysql-core";
import { sql as sql2 } from "drizzle-orm";
var adminOrderDrafts, adminOrderDraftItems;
var init_admin_orders = __esm({
  "drizzle/schema/admin_orders.ts"() {
    "use strict";
    adminOrderDrafts = mysqlTable17("admin_order_drafts", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      adminId: varchar17("admin_id", { length: 255 }).notNull(),
      userId: varchar17("user_id", { length: 255 }),
      shippingValue: decimal14("shipping_value", { precision: 10, scale: 2 }).default("0.00"),
      discountValue: decimal14("discount_value", { precision: 10, scale: 2 }).default("0.00"),
      status: varchar17("status", { length: 20 }).default("active"),
      metadataJson: longtext6("metadata_json"),
      discountsSnapshot: longtext6("discounts_snapshot"),
      createdAt: timestamp17("created_at").default(sql2`CURRENT_TIMESTAMP`),
      updatedAt: timestamp17("updated_at").default(sql2`CURRENT_TIMESTAMP`).onUpdateNow()
    });
    adminOrderDraftItems = mysqlTable17("admin_order_draft_items", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      draftId: varchar17("draft_id", { length: 255 }).notNull(),
      // 🔗 RELAÇÕES
      dishId: varchar17("dish_id", { length: 255 }),
      packageId: varchar17("package_id", { length: 255 }),
      name: varchar17("name", { length: 255 }),
      quantity: int15("quantity").default(1),
      unitPrice: decimal14("unit_price", { precision: 10, scale: 2 }).default("0.00"),
      // 📝 CONFIGURAÇÕES E DETALHES
      options: longtext6("options"),
      // JSON com estrutura visual (tamanho, ids, etc.)
      // ✅ ATUALIZADO: Substituímos 'accompaniments' por 'applied_nutrition'
      // Agora o Drizzle sabe onde salvar aquele JSON rico de macros que criamos
      appliedNutrition: longtext6("applied_nutrition"),
      createdAt: timestamp17("created_at").default(sql2`CURRENT_TIMESTAMP`)
    });
  }
});

// drizzle/schema/referral.ts
import { mysqlTable as mysqlTable18, varchar as varchar18, timestamp as timestamp18, text as text15, decimal as decimal15, boolean as boolean12 } from "drizzle-orm/mysql-core";
import { relations as relations8 } from "drizzle-orm";
var referrals, referralsRelations;
var init_referral = __esm({
  "drizzle/schema/referral.ts"() {
    "use strict";
    init_users();
    init_orders();
    init_cart();
    referrals = mysqlTable18("referrals", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      // O código que será usado na URL (?ref=JULIA10)
      code: varchar18("code", { length: 50 }).notNull().unique(),
      name: varchar18("name", { length: 255 }).notNull(),
      // Categoria do parceiro para filtros no Monitor
      type: varchar18("type", { length: 50 }).default("nutri"),
      // Vinculação com a conta de usuário (para o parceiro ver o próprio painel)
      userId: varchar18("user_id", { length: 255 }),
      // Configurações financeiras
      commissionRate: decimal15("commission_rate", { precision: 5, scale: 2 }).default("0.00"),
      notes: text15("notes"),
      /**
       * ✅ CAMPO DE STATUS
       * Permite pausar parcerias sem deletar os dados históricos.
       */
      isActive: boolean12("is_active").default(true),
      createdAt: timestamp18("created_at").defaultNow()
    });
    referralsRelations = relations8(referrals, ({ many, one }) => ({
      author: one(users, {
        fields: [referrals.userId],
        references: [users.id]
      }),
      attributedOrders: many(orders),
      attributedCarts: many(carts)
    }));
  }
});

// drizzle/schema/guests.ts
import { mysqlTable as mysqlTable19, varchar as varchar19, timestamp as timestamp19 } from "drizzle-orm/mysql-core";
var guests;
var init_guests = __esm({
  "drizzle/schema/guests.ts"() {
    "use strict";
    guests = mysqlTable19("guests", {
      id: varchar19("id", { length: 255 }).primaryKey(),
      // UUID vindo do LocalStorage
      referralCode: varchar19("referral_code", { length: 50 }),
      convertedUserId: varchar19("converted_user_id", { length: 255 }),
      createdAt: timestamp19("created_at").defaultNow(),
      lastActive: timestamp19("last_active").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/nutri.ts
import { relations as relations9 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable20,
  varchar as varchar20,
  boolean as boolean13,
  timestamp as timestamp20,
  text as text16,
  json as json5,
  index as index3,
  unique,
  int as int16
} from "drizzle-orm/mysql-core";
var nutriProfiles, nutriAddresses, professionalClients, professionalReviews, nutriProfilesRelations, professionalClientsRelations, nutriAddressesRelations, professionalReviewsRelations;
var init_nutri = __esm({
  "drizzle/schema/nutri.ts"() {
    "use strict";
    init_users();
    init_encryption();
    nutriProfiles = mysqlTable20("nutri_profiles", {
      id: varchar20("id", { length: 255 }).primaryKey(),
      userId: varchar20("user_id", { length: 255 }).notNull().unique().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
      crn: varchar20("crn", { length: 50 }).notNull().unique(),
      specialty: varchar20("specialty", { length: 255 }),
      website: varchar20("website", { length: 255 }),
      avatarUrl: varchar20("avatar_url", { length: 255 }),
      bio: text16("bio"),
      phone: varchar20("phone", { length: 20 }),
      referralCode: varchar20("referral_code", { length: 50 }).unique(),
      discountPercentage: int16("discount_percentage").default(0),
      isVerified: boolean13("is_verified").default(false),
      isActive: boolean13("is_active").default(true),
      createdAt: timestamp20("created_at").defaultNow(),
      updatedAt: timestamp20("updated_at").defaultNow().onUpdateNow()
    });
    nutriAddresses = mysqlTable20("nutri_addresses", {
      id: varchar20("id", { length: 255 }).primaryKey(),
      nutriId: varchar20("nutri_id", { length: 255 }).notNull().references(() => nutriProfiles.id, { onDelete: "cascade" }),
      label: varchar20("label", { length: 255 }).notNull(),
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
      isDefault: boolean13("is_default").default(false),
      createdAt: timestamp20("created_at").defaultNow(),
      updatedAt: timestamp20("updated_at").defaultNow().onUpdateNow()
    });
    professionalClients = mysqlTable20("professional_clients", {
      id: varchar20("id", { length: 255 }).primaryKey(),
      professionalId: varchar20("professional_id", { length: 255 }).notNull().references(() => nutriProfiles.id, { onDelete: "cascade" }),
      clientId: varchar20("client_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      status: varchar20("status", { length: 20 }).default("active"),
      assignedDishes: json5("assigned_dishes").$type(),
      createdAt: timestamp20("created_at").defaultNow(),
      updatedAt: timestamp20("updated_at").defaultNow().onUpdateNow()
    }, (table) => ({
      idxProfessional: index3("idx_professional").on(table.professionalId),
      idxClient: index3("idx_client").on(table.clientId),
      uniqueRelationship: unique("unique_relationship").on(table.professionalId, table.clientId)
    }));
    professionalReviews = mysqlTable20("professional_reviews", {
      id: varchar20("id", { length: 255 }).primaryKey(),
      userId: varchar20("user_id", { length: 255 }).notNull().references(() => users.id),
      dishId: varchar20("dish_id", { length: 255 }).notNull(),
      technicalInsight: text16("technical_insight"),
      nutritionalHighlights: text16("nutritional_highlights"),
      isActive: boolean13("is_active").default(true),
      createdAt: timestamp20("created_at").defaultNow()
    });
    nutriProfilesRelations = relations9(nutriProfiles, ({ one, many }) => ({
      user: one(users, { fields: [nutriProfiles.userId], references: [users.id] }),
      offices: many(nutriAddresses),
      clients: many(professionalClients)
    }));
    professionalClientsRelations = relations9(professionalClients, ({ one }) => ({
      nutri: one(nutriProfiles, { fields: [professionalClients.professionalId], references: [nutriProfiles.id] }),
      client: one(users, { fields: [professionalClients.clientId], references: [users.id] })
    }));
    nutriAddressesRelations = relations9(nutriAddresses, ({ one }) => ({
      nutri: one(nutriProfiles, { fields: [nutriAddresses.nutriId], references: [nutriProfiles.id] })
    }));
    professionalReviewsRelations = relations9(professionalReviews, ({ one }) => ({
      user: one(users, { fields: [professionalReviews.userId], references: [users.id] })
    }));
  }
});

// drizzle/schema/prescriptions.ts
import { relations as relations10 } from "drizzle-orm";
import {
  mysqlTable as mysqlTable21,
  varchar as varchar21,
  text as text17,
  int as int17,
  timestamp as timestamp21,
  longtext as longtext7,
  mysqlEnum as mysqlEnum5,
  decimal as decimal16
} from "drizzle-orm/mysql-core";
var prescriptions, prescriptionItems, prescriptionTemplates, prescriptionsRelations, prescriptionItemsRelations, prescriptionTemplatesRelations;
var init_prescriptions = __esm({
  "drizzle/schema/prescriptions.ts"() {
    "use strict";
    init_users();
    prescriptions = mysqlTable21("prescriptions", {
      id: varchar21("id", { length: 36 }).primaryKey(),
      clientId: varchar21("client_id", { length: 36 }).references(() => users.id),
      professionalId: varchar21("professional_id", { length: 36 }).notNull(),
      planName: varchar21("plan_name", { length: 100 }).notNull(),
      status: mysqlEnum5("status", ["active", "archived"]).default("active"),
      technicalInsight: text17("technical_insight"),
      totalKcalTarget: int17("total_kcal_target"),
      // ✅ MANTIDO PARA TRANSIÇÃO E BACKUP
      dietSnapshot: longtext7("diet_snapshot").$type(),
      discountPercentage: int17("discount_percentage").default(0),
      createdAt: timestamp21("created_at").defaultNow(),
      updatedAt: timestamp21("updated_at").defaultNow().onUpdateNow()
    });
    prescriptionItems = mysqlTable21("prescription_items", {
      id: varchar21("id", { length: 36 }).primaryKey(),
      prescriptionId: varchar21("prescription_id", { length: 36 }).notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
      // Se apagar o plano, apaga os itens
      // Vínculos com o Catálogo
      dishId: int17("dish_id").notNull(),
      sizeId: int17("size_id").notNull(),
      dishName: varchar21("dish_name", { length: 255 }),
      // Salva o nome para histórico
      // Estrutura na Dieta
      mealName: varchar21("meal_name", { length: 100 }).notNull(),
      // Ex: "Refeição 1"
      order: int17("order").default(0),
      // Para ordenar as refeições
      // 💰 O SEGREDO DO PREÇO IMUTÁVEL (Fim do bug do zero!)
      fixedPrice: decimal16("fixed_price", { precision: 10, scale: 2 }).notNull(),
      multiplier: decimal16("multiplier", { precision: 5, scale: 2 }).default("1.00"),
      // Acompanhamentos e Macros (JSON leve apenas para o que importa no front)
      accompanimentsJson: text17("accompaniments_json"),
      macrosJson: text17("macros_json"),
      createdAt: timestamp21("created_at").defaultNow()
    });
    prescriptionTemplates = mysqlTable21("prescription_templates", {
      id: varchar21("id", { length: 36 }).primaryKey(),
      professionalId: varchar21("professional_id", { length: 36 }).notNull(),
      name: varchar21("name", { length: 100 }).notNull(),
      description: text17("description"),
      content: text17("content"),
      // Armazena o JSON stringificado (SnapshotMeal[])
      totalKcalTarget: int17("total_kcal_target"),
      technicalInsight: text17("technical_insight"),
      createdAt: timestamp21("created_at").defaultNow()
    });
    prescriptionsRelations = relations10(prescriptions, ({ one, many }) => ({
      client: one(users, { fields: [prescriptions.clientId], references: [users.id] }),
      // ✅ Diz ao Drizzle que uma Prescrição tem Vários Itens
      items: many(prescriptionItems)
    }));
    prescriptionItemsRelations = relations10(prescriptionItems, ({ one }) => ({
      // ✅ Diz ao Drizzle a qual Prescrição este item pertence
      prescription: one(prescriptions, {
        fields: [prescriptionItems.prescriptionId],
        references: [prescriptions.id]
      })
    }));
    prescriptionTemplatesRelations = relations10(prescriptionTemplates, ({ one }) => ({
      professional: one(users, { fields: [prescriptionTemplates.professionalId], references: [users.id] })
    }));
  }
});

// drizzle/schema/analytics.ts
import { mysqlTable as mysqlTable22, int as int18, varchar as varchar22, decimal as decimal17, timestamp as timestamp22, json as json6 } from "drizzle-orm/mysql-core";
var biSalesFacts, biFinancialFacts, biDishIntelligence;
var init_analytics = __esm({
  "drizzle/schema/analytics.ts"() {
    "use strict";
    biSalesFacts = mysqlTable22("bi_sales_facts", {
      id: int18("id").primaryKey().autoincrement(),
      orderId: int18("order_id").notNull(),
      // Link com o prato de produção
      dishId: int18("dish_id"),
      // Hash para agrupar combinações (ex: "carne_moida_arroz_feijao")
      combinationHash: varchar22("combination_hash", { length: 255 }),
      itemsDetail: json6("items_detail"),
      quantity: int18("quantity").default(1),
      netRevenue: decimal17("net_revenue", { precision: 10, scale: 2 }),
      dateId: int18("date_id").notNull(),
      createdAt: timestamp22("created_at").defaultNow()
    });
    biFinancialFacts = mysqlTable22("bi_financial_facts", {
      id: int18("id").primaryKey().autoincrement(),
      orderId: int18("order_id").notNull(),
      paymentMethod: varchar22("payment_method", { length: 50 }),
      couponCode: varchar22("coupon_code", { length: 255 }),
      grossTotal: decimal17("gross_total", { precision: 10, scale: 2 }),
      deliveryFee: decimal17("delivery_fee", { precision: 10, scale: 2 }).default("0.00"),
      discountCoupon: decimal17("discount_coupon", { precision: 10, scale: 2 }).default("0.00"),
      discountLoyalty: decimal17("discount_loyalty", { precision: 10, scale: 2 }).default("0.00"),
      discountAuto: decimal17("discount_auto", { precision: 10, scale: 2 }).default("0.00"),
      netTotal: decimal17("net_total", { precision: 10, scale: 2 }),
      dateId: int18("date_id").notNull(),
      createdAt: timestamp22("created_at").defaultNow()
    });
    biDishIntelligence = mysqlTable22("bi_dish_intelligence", {
      id: int18("id").primaryKey().autoincrement(),
      // FK para o prato original (Unique para garantir 1 inteligência por prato)
      dishId: int18("dish_id").notNull().unique(),
      // Dados Nutricionais Reais (Ensinando as Personas)
      proteinGrams: decimal17("protein_grams", { precision: 10, scale: 2 }).default("0.00"),
      carbGrams: decimal17("carb_grams", { precision: 10, scale: 2 }).default("0.00"),
      fatGrams: decimal17("fat_grams", { precision: 10, scale: 2 }).default("0.00"),
      calories: int18("calories").default(0),
      // Tags de Especialista (ex: ['saciedade_alta', 'imunidade', 'mais_pedido'])
      intelligenceTags: json6("intelligence_tags"),
      // Score de Tendência Mundial/Local (-100 a 100)
      // Útil para o motor priorizar o que está "na moda" saudável
      trendScore: int18("trend_score").default(0),
      // Espaço para o seu script de aprendizado local salvar metadados extras
      marketMetadata: json6("market_metadata"),
      updatedAt: timestamp22("updated_at").defaultNow().onUpdateNow()
    });
  }
});

// drizzle/schema/packagePersonas.ts
import { mysqlTable as mysqlTable23, serial as serial4, varchar as varchar23, text as text18, json as json7, boolean as boolean14, timestamp as timestamp23, int as int19 } from "drizzle-orm/mysql-core";
var packagePersonas;
var init_packagePersonas = __esm({
  "drizzle/schema/packagePersonas.ts"() {
    "use strict";
    packagePersonas = mysqlTable23("package_personas", {
      id: serial4("id").primaryKey(),
      slug: varchar23("slug", { length: 50 }).notNull().unique(),
      // ex: 'balanced'
      label: varchar23("label", { length: 100 }).notNull(),
      // ex: 'Equilibrado'
      description: text18("description"),
      goal: varchar23("goal", { length: 50 }).notNull(),
      // balanced, high_protein, etc.
      // Armazenamos pesos e restrições como JSON para flexibilidade total
      weightsJson: json7("weights_json").notNull(),
      constraintsJson: json7("constraints_json").notNull(),
      isSystem: boolean14("is_system").default(false),
      // Impede deleção de personas base
      isActive: boolean14("is_active").default(true),
      displayOrder: int19("display_order").default(0),
      createdAt: timestamp23("created_at").defaultNow(),
      updatedAt: timestamp23("updated_at").defaultNow().onUpdateNow()
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
    init_shipping();
    init_loyalty();
    init_logs();
    init_showcase();
    init_nutrition();
    init_accompaniments();
    init_admin_orders();
    init_referral();
    init_guests();
    init_nutri();
    init_prescriptions();
    init_aiIntelligence();
    init_analytics();
    init_packagePersonas();
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accompanimentCategories: () => accompanimentCategories,
  accompanimentGroups: () => accompanimentGroups,
  accompanimentGroupsRelations: () => accompanimentGroupsRelations,
  accompanimentOptions: () => accompanimentOptions,
  accompanimentOptionsWithCategoryRelations: () => accompanimentOptionsWithCategoryRelations,
  adminOrderDraftItems: () => adminOrderDraftItems,
  adminOrderDrafts: () => adminOrderDrafts,
  agentActions: () => agentActions,
  agentRuns: () => agentRuns,
  aiExpertLogs: () => aiExpertLogs,
  aiExpertTerms: () => aiExpertTerms,
  appConfigs: () => appConfigs,
  auditLogs: () => auditLogs,
  biDishIntelligence: () => biDishIntelligence,
  biFinancialFacts: () => biFinancialFacts,
  biSalesFacts: () => biSalesFacts,
  cartItems: () => cartItems,
  carts: () => carts,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  couponRelations: () => couponRelations,
  couponUsage: () => couponUsage,
  couponUsageRelations: () => couponUsageRelations,
  coupons: () => coupons,
  discountRules: () => discountRules,
  dishComposition: () => dishComposition,
  dishCompositionRelations: () => dishCompositionRelations,
  dishSizes: () => dishSizes,
  dishSizesRelations: () => dishSizesRelations,
  dishes: () => dishes,
  dishesRelations: () => dishesRelations,
  dishesToSizes: () => dishesToSizes,
  foodCardBrands: () => foodCardBrands,
  geoMesh: () => geoMesh,
  groupToOptions: () => groupToOptions,
  guests: () => guests,
  ingredientExtraColumns: () => ingredientExtraColumns,
  ingredients: () => ingredients,
  labelTemplates: () => labelTemplates,
  loyaltyHistory: () => loyaltyHistory,
  loyaltyHistoryRelations: () => loyaltyHistoryRelations,
  loyaltyPoints: () => loyaltyPoints,
  loyaltyPointsRelations: () => loyaltyPointsRelations,
  loyaltySettings: () => loyaltySettings,
  media: () => media,
  mediaLibrary: () => mediaLibrary,
  mediaLibraryRelations: () => mediaLibraryRelations,
  nutriAddresses: () => nutriAddresses,
  nutriAddressesRelations: () => nutriAddressesRelations,
  nutriProfiles: () => nutriProfiles,
  nutriProfilesRelations: () => nutriProfilesRelations,
  nutriScansTemp: () => nutriScansTemp,
  nutritionFacts: () => nutritionFacts,
  nutritionFactsColumns: () => nutritionFactsColumns,
  nutritionFields: () => nutritionFields,
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
  packagePersonas: () => packagePersonas,
  packageRelations: () => packageRelations,
  packages: () => packages,
  paymentMethodRelations: () => paymentMethodRelations,
  paymentMethods: () => paymentMethods,
  prescriptionItems: () => prescriptionItems,
  prescriptionItemsRelations: () => prescriptionItemsRelations,
  prescriptionTemplates: () => prescriptionTemplates,
  prescriptionTemplatesRelations: () => prescriptionTemplatesRelations,
  prescriptions: () => prescriptions,
  prescriptionsRelations: () => prescriptionsRelations,
  professionalClients: () => professionalClients,
  professionalClientsRelations: () => professionalClientsRelations,
  professionalReviews: () => professionalReviews,
  professionalReviewsRelations: () => professionalReviewsRelations,
  referrals: () => referrals,
  referralsRelations: () => referralsRelations,
  sessions: () => sessions,
  shippingRules: () => shippingRules,
  shippingSettings: () => shippingSettings,
  shippingZones: () => shippingZones,
  showcases: () => showcases,
  siteTheme: () => siteTheme,
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
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 6e4,
      queueLimit: 0,
      // ✅ FIX: Força o charset UTF8MB4 na conexão para evitar caracteres corrompidos (Mojibake)
      charset: "utf8mb4",
      enableKeepAlive: true,
      keepAliveInitialDelay: 1e4
    });
  }
  dbInstance = drizzle(pool, { schema: schema_exports, mode: "default" });
  return dbInstance;
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
          } catch {
            pass = passRaw;
          }
        } else {
          pass = passRaw;
        }
        const transportOptions = {
          // @ts-ignore - Host pode vir como string do banco
          host,
          port,
          secure: port === 465,
          auth: user ? { user: String(user), pass: String(pass) } : void 0,
          tls: { rejectUnauthorized: false }
        };
        return {
          transporter: nodemailer.createTransport(transportOptions),
          from: user || "sistema@gourmetsaudavel.com.br",
          configs
        };
      },
      /**
       * 📧 E-MAIL DE BEM-VINDO
       */
      async sendWelcomeEmail(to, name) {
        const { transporter, from, configs } = await this.getTransport();
        const getVal = (key) => configs.find((c) => c.configKey === key)?.configValue;
        const masterLayout = getVal("email_master_layout") ?? void 0;
        const subjectTemplate = getVal("email_welcome_subject") || "Bem-vindo \xE0 Gourmet Saud\xE1vel, {{name}}!";
        const bodyTemplate = getVal("email_welcome_body") || `
      <div style="font-family: sans-serif; color: #334155;">
        <h2 style="color: #059669;">Seja muito bem-vindo(a), {{name}}!</h2>
        <p>Estamos muito felizes em ter voc\xEA conosco. Sua conta foi criada com sucesso.</p>
        <p>Atenciosamente,<br>Equipe Gourmet Saud\xE1vel</p>
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
      },
      /**
       * 📧 CONFIRMAÇÃO DE PEDIDO
       */
      async sendOrderConfirmation(to, order) {
        const { transporter, from, configs } = await this.getTransport();
        const getVal = (key) => configs.find((c) => c.configKey === key)?.configValue;
        const masterLayout = getVal("email_master_layout") ?? void 0;
        const subjectTemplate = getVal("email_order_subject") || "Pedido Confirmado! #{{orderId}}";
        const bodyTemplate = getVal("email_order_body") || `
      <div style="font-family: sans-serif; color: #334155;">
        <h2 style="color: #059669;">Ol\xE1 {{customerName}}, recebemos seu pedido!</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top:0; font-size: 16px;">\u{1F4E6} Itens do Pedido #{{orderId}}</h3>
          {{itemsHtml}}
        </div>
        <p>Total: {{total}}</p>
      </div>
    `;
        const itemsHtml = `
      <table style="width: 100%; border-collapse: collapse;">
        ${order.items.map((item) => `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: 700; color: #0f172a;">${item.name}</div>
              <div style="font-size: 12px; color: #64748b;">${item.details}</div>
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
      },
      /**
       * 📧 RECUPERAÇÃO DE SENHA
       */
      async sendPasswordReset(to, name, resetLink) {
        const { transporter, from, configs } = await this.getTransport();
        const getVal = (key) => configs.find((c) => c.configKey === key)?.configValue;
        const masterLayout = getVal("email_master_layout") ?? void 0;
        const subjectTemplate = getVal("email_reset_subject") || "Recupera\xE7\xE3o de Senha - Gourmet Saud\xE1vel";
        const bodyTemplate = getVal("email_reset_body") || `
      <div style="font-family: sans-serif;">
        <h2 style="color: #059669;">Recuperar Senha</h2>
        <p>Ol\xE1 {{name}}, recebemos uma solicita\xE7\xE3o para redefinir sua senha.</p>
        <p>Clique no bot\xE3o abaixo para prosseguir:</p>
        <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Alterar Minha Senha</a>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Se voc\xEA n\xE3o solicitou esta altera\xE7\xE3o, ignore este e-mail.</p>
      </div>
    `;
        const variables = { name, resetLink };
        await transporter.sendMail({
          // ✅ Remetente agora alinhado com Gourmet Saudável
          from: `"Seguran\xE7a - Gourmet Saud\xE1vel" <${from}>`,
          to,
          subject: this.parseTemplate(subjectTemplate, variables),
          html: this.parseTemplate(bodyTemplate, variables, masterLayout)
        });
        return { success: true };
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
init_schema();
import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { eq as eq2 } from "drizzle-orm";

// server/db/lib/audit.ts
init_db();
init_schema();

// server/lib/redact.ts
var FULL_REDACT = "[redacted]";
var REDACTED_KEYS = /* @__PURE__ */ new Set([
  "password",
  "token",
  "secret",
  "currentPassword",
  "newPassword",
  "customerDocument",
  "document",
  "cpf",
  "customerPhone",
  "phone",
  "mobile",
  "receiverName",
  "shippingAddress",
  "address",
  "street",
  "number",
  "complement",
  "neighborhood",
  "zipCode",
  "zip",
  "cep"
]);
function maskDigits(value, visibleStart = 0, visibleEnd = 0) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= visibleStart + visibleEnd) {
    return `${"*".repeat(Math.max(0, digits.length - visibleEnd))}${digits.slice(
      -visibleEnd
    )}`;
  }
  return `${digits.slice(0, visibleStart)}${"*".repeat(
    digits.length - visibleStart - visibleEnd
  )}${digits.slice(-visibleEnd)}`;
}
function maskCpf(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return maskDigits(digits, 3, 2);
}
function maskPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return maskDigits(digits, 2, 2);
}
function maskZipCode(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return maskDigits(digits, 2, 2);
}
function redactByKey(key, value) {
  if (value == null) return value;
  if (key === "customerDocument" || key === "document" || key === "cpf") {
    return maskCpf(value);
  }
  if (key === "customerPhone" || key === "phone" || key === "mobile") {
    return maskPhone(value);
  }
  if (key === "zipCode" || key === "zip" || key === "cep") {
    return maskZipCode(value);
  }
  return FULL_REDACT;
}
function redactSensitiveData(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }
  if (value && typeof value === "object") {
    const input = value;
    const output = {};
    for (const [key, fieldValue] of Object.entries(input)) {
      output[key] = REDACTED_KEYS.has(key) ? redactByKey(key, fieldValue) : redactSensitiveData(fieldValue);
    }
    return output;
  }
  return value;
}

// server/db/lib/audit.ts
async function logAction(ctx, action, entity, details) {
  const db2 = await getDb();
  if (!db2) return;
  try {
    const now = /* @__PURE__ */ new Date();
    now.setHours(now.getHours() - 3);
    const safeOld = details.old ? redactSensitiveData(details.old) : null;
    const safeNew = details.new ? redactSensitiveData(details.new) : null;
    const logData = {
      action,
      entity,
      entityId: details.entityId ? String(details.entityId) : "global",
      userId: String(ctx.userId || ctx.user?.id || "system"),
      oldValues: safeOld ? JSON.stringify(safeOld) : null,
      newValues: safeNew ? JSON.stringify(safeNew) : null,
      ipAddress: ctx.ip || "127.0.0.1",
      userAgent: ctx.userAgent || "Sistema",
      createdAt: now
    };
    await db2.insert(auditLogs).values(logData);
  } catch (error) {
    console.error(
      "CRITICAL_AUDIT_ERROR:",
      error instanceof Error ? error.message : error
    );
  }
}

// server/logger.ts
import pino from "pino";
var isDev = process.env.NODE_ENV !== "production";
var logger = pino({
  level: isDev ? "debug" : "info",
  // Em dev, formata o texto bonitinho. Em produção, cospe JSON de alta performance.
  transport: isDev ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss",
      ignore: "pid,hostname"
    }
  } : void 0
});

// server/_core/trpc.ts
init_encryption();
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
var procedureRateLimitStore = /* @__PURE__ */ new Map();
var isInternal = t.middleware(async ({ ctx, next }) => {
  const reqHeaders = ctx.req?.headers;
  let authHeader = null;
  if (reqHeaders) {
    if (reqHeaders instanceof Headers) {
      authHeader = reqHeaders.get("authorization");
    } else if (typeof reqHeaders === "object") {
      const headerValue = reqHeaders["authorization"];
      authHeader = typeof headerValue === "string" ? headerValue : null;
    }
  }
  const token = authHeader?.replace("Bearer ", "");
  const bridgeSetting = await ctx.db.query.appConfigs.findFirst({
    where: eq2(appConfigs.configKey, "BRIDGE_TOKEN")
  });
  const internalToken = bridgeSetting?.configValue ? decrypt(bridgeSetting.configValue) || bridgeSetting.configValue : null;
  if (!internalToken || !token || token !== internalToken) {
    logger.warn(
      { path: "internal_bridge" },
      "Tentativa de acesso com token de integracao invalido"
    );
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Token de integra\xE7\xE3o inv\xE1lido ou n\xE3o fornecido."
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: { id: "system-ai", role: "admin" },
      isInternal: true
    }
  });
});
var isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sess\xE3o expirada ou n\xE3o autenticada."
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session
    }
  });
});
function requireRoles(allowedRoles) {
  return t.middleware(({ ctx, next, path: path5 }) => {
    if (!ctx.user || !ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Sess\xE3o expirada ou n\xE3o autenticada."
      });
    }
    if (!allowedRoles.includes(ctx.user.role)) {
      logger.warn(
        {
          path: path5,
          userId: ctx.user.id,
          role: ctx.user.role,
          allowedRoles
        },
        "Tentativa de acesso negado por role"
      );
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Voc\xEA n\xE3o tem permiss\xE3o para acessar este recurso."
      });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        session: ctx.session,
        isAdmin: ctx.user.role === "admin"
      }
    });
  });
}
function getRateLimitActorKey(ctx) {
  const userId = ctx.user?.id ? `user:${ctx.user.id}` : null;
  const guestId = ctx.guestId ? `guest:${ctx.guestId}` : null;
  const forwarded = ctx.req?.headers?.["x-forwarded-for"];
  const ipFromHeader = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : null;
  const socketIp = ctx.req?.socket?.remoteAddress || null;
  const ip = ipFromHeader || socketIp || "unknown";
  return userId || guestId || `ip:${ip}`;
}
function createRateLimitMiddleware(config) {
  return t.middleware(({ ctx, next, path: path5 }) => {
    const actorKey = getRateLimitActorKey(ctx);
    const now = Date.now();
    const key = `${config.keyPrefix}:${path5}:${actorKey}`;
    const existing = procedureRateLimitStore.get(key);
    if (!existing || existing.resetAt <= now) {
      procedureRateLimitStore.set(key, {
        count: 1,
        resetAt: now + config.windowMs
      });
      return next();
    }
    if (existing.count >= config.limit) {
      logger.warn(
        {
          path: path5,
          actorKey,
          limit: config.limit,
          windowMs: config.windowMs
        },
        "Rate limit de procedure excedido"
      );
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Muitas tentativas. Tente novamente em instantes."
      });
    }
    existing.count += 1;
    procedureRateLimitStore.set(key, existing);
    return next();
  });
}
var auditMiddleware = t.middleware(async (opts) => {
  const { ctx, path: path5, type, next } = opts;
  const rawInput = opts.rawInput;
  const result = await next();
  if (type === "mutation" && result.ok && ctx.user) {
    const silentPaths = ["admin.logs.list", "admin.auth.session"];
    if (!silentPaths.includes(path5)) {
      let safeInput = null;
      if (rawInput && typeof rawInput === "object") {
        const inputObj = { ...rawInput };
        const sensitiveKeys = [
          "password",
          "token",
          "secret",
          "currentPassword",
          "newPassword"
        ];
        for (const key of sensitiveKeys) {
          if (key in inputObj) delete inputObj[key];
        }
        safeInput = redactSensitiveData(inputObj);
      } else {
        safeInput = redactSensitiveData(rawInput);
      }
      const entity = path5.split(".")[1] || "system";
      const actionName = `AUTO_${path5.toUpperCase().replace(/\./g, "_")}`;
      const responseMessage = result.data && typeof result.data === "object" ? result.data.message || "Sucesso" : "Sucesso";
      void logAction(
        { ...ctx, user: { id: ctx.user.id } },
        actionName,
        entity,
        {
          new: {
            input: safeInput,
            response: responseMessage
          }
        }
      ).catch((err) => {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        logger.error({ err: msg, path: path5 }, "Erro ao salvar auditoria autom\xE1tica");
      });
    }
  }
  return result;
});
var protectedProcedure = t.procedure.use(isAuthed);
var adminProcedure = t.procedure.use(requireRoles(["admin"])).use(auditMiddleware);
var nutriProcedure = t.procedure.use(requireRoles(["admin", "nutri"])).use(auditMiddleware);
var internalProcedure = t.procedure.use(isInternal);

// server/routers/admin/index.ts
import { z as z35 } from "zod";

// server/routers/admin/analytics.ts
import { z } from "zod";
init_db();
init_schema();
init_analytics();
import { sql as sql3, gte, desc, inArray, and, gt, asc } from "drizzle-orm";
import { TRPCError as TRPCError2 } from "@trpc/server";

// server/workers/queues/biQueue.ts
import {
  Queue,
  Worker
} from "bullmq";

// server/lib/redis.ts
import { Redis } from "ioredis";
var redisUrl = process.env.REDIS_URL;
var redisHost = process.env.REDIS_HOST || "localhost";
var redisPort = Number(process.env.REDIS_PORT) || 6379;
var REDIS_OPTS = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 8e3,
  retryStrategy: (times) => {
    if (times > 15) return null;
    return Math.min(times * 500, 1e4);
  }
};
var redisConnection = redisUrl ? new Redis(redisUrl, REDIS_OPTS) : new Redis({ host: redisHost, port: redisPort, ...REDIS_OPTS });
var connectAttempt = null;
var lastRedisErrorLogAt = 0;
var lastRedisWarnLogAt = 0;
function shouldLog(lastAt, cooldownMs) {
  return Date.now() - lastAt > cooldownMs;
}
function waitForRedisReady(timeoutMs = 8e3) {
  if (redisConnection.status === "ready") return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const cleanup = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      redisConnection.off("ready", onReady);
      redisConnection.off("close", onCloseOrEnd);
      redisConnection.off("end", onCloseOrEnd);
      resolve(ok);
    };
    const onReady = () => cleanup(true);
    const onCloseOrEnd = () => cleanup(false);
    const timer = setTimeout(() => {
      cleanup(redisConnection.status === "ready");
    }, timeoutMs);
    redisConnection.once("ready", onReady);
    redisConnection.once("close", onCloseOrEnd);
    redisConnection.once("end", onCloseOrEnd);
  });
}
function isRedisReady() {
  return redisConnection.status === "ready";
}
async function ensureRedisReady(context = "runtime") {
  if (isRedisReady()) return true;
  if (connectAttempt) {
    return connectAttempt;
  }
  connectAttempt = (async () => {
    try {
      const status = redisConnection.status;
      if (status === "end") {
        return false;
      }
      if (status === "wait" || status === "close") {
        await redisConnection.connect();
      }
      const ready = await waitForRedisReady();
      if (!ready && shouldLog(lastRedisWarnLogAt, 1e4)) {
        lastRedisWarnLogAt = Date.now();
        console.warn(
          `[Redis] Not ready yet (${context}). status=${redisConnection.status}`
        );
      }
      return ready;
    } catch (err) {
      if (shouldLog(lastRedisErrorLogAt, 1e4)) {
        lastRedisErrorLogAt = Date.now();
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Redis] Connect failed (${context}): ${message}`);
      }
      return false;
    } finally {
      connectAttempt = null;
    }
  })();
  return connectAttempt;
}
redisConnection.on("error", (err) => {
  if (!shouldLog(lastRedisErrorLogAt, 1e4)) return;
  lastRedisErrorLogAt = Date.now();
  console.error("[Redis] Connection error:", err.message);
});

// server/workers/queues/biQueue.ts
init_db();
init_schema();
init_analytics();
import { eq as eq3 } from "drizzle-orm";

// server/lib/safe-parse.ts
function safeJsonParse(value, fallback) {
  if (value === null || value === void 0) return fallback;
  if (typeof value === "object") {
    return value;
  }
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
}
function safeNumber(value, fallback = 0) {
  if (value === null || value === void 0 || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function safeInteger(value, fallback = 0) {
  const parsed = safeNumber(value, Number.NaN);
  return Number.isInteger(parsed) ? parsed : fallback;
}
function safeString(value, fallback = "", maxLength) {
  if (value === null || value === void 0) return fallback;
  const normalized = String(value).trim();
  if (!normalized) return fallback;
  return typeof maxLength === "number" && maxLength > 0 ? normalized.slice(0, maxLength) : normalized;
}

// server/workers/queues/biQueue.ts
var BI_QUEUE_NAME = "bi-analytics-queue";
var REDIS_WARN_COOLDOWN_MS = 1e4;
var WORKER_RETRY_MS = 5e3;
var connection = redisConnection;
var biQueue = new Queue(BI_QUEUE_NAME, {
  connection
});
var biWorker = null;
var workerBootTimer = null;
var queueErrorBound = false;
var lastQueueWarnAt = 0;
var lastWorkerWarnAt = 0;
function shouldLog2(lastAt, cooldownMs) {
  return Date.now() - lastAt > cooldownMs;
}
function warnQueue(message) {
  if (!shouldLog2(lastQueueWarnAt, REDIS_WARN_COOLDOWN_MS)) return;
  lastQueueWarnAt = Date.now();
  logger.warn(`[BI Queue] ${message}`);
}
function warnWorker(message) {
  if (!shouldLog2(lastWorkerWarnAt, REDIS_WARN_COOLDOWN_MS)) return;
  lastWorkerWarnAt = Date.now();
  logger.warn(`[BI Worker] ${message}`);
}
function scheduleWorkerBootstrap() {
  if (workerBootTimer || biWorker) return;
  workerBootTimer = setTimeout(() => {
    workerBootTimer = null;
    void ensureBIWorkerRunning();
  }, WORKER_RETRY_MS);
}
function getNumericOrderId(orderId) {
  const onlyNumbers = orderId.replace(/\D/g, "");
  if (onlyNumbers.length > 0 && onlyNumbers.length < 10) return safeInteger(onlyNumbers);
  let hash5 = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash5 = (hash5 << 5) - hash5 + orderId.charCodeAt(i);
    hash5 |= 0;
  }
  return Math.abs(hash5);
}
async function processAnalyticsJob(job) {
  const { orderId } = job.data;
  const db2 = await getDb();
  logger.info(`[BI Worker] Processing order: ${orderId}`);
  try {
    const [order] = await db2.select().from(orders).where(eq3(orders.id, orderId));
    if (!order) {
      logger.warn(`[BI Worker] Order not found: ${orderId}`);
      return;
    }
    const orderItems2 = await db2.select().from(orderItems).where(eq3(orderItems.orderId, orderId));
    const biOrderId = getNumericOrderId(order.id);
    const dateObj = order.createdAt ? new Date(order.createdAt) : /* @__PURE__ */ new Date();
    const dateId = safeInteger(dateObj.toISOString().split("T")[0].replace(/-/g, ""));
    let discountCoupon = "0.00";
    let discountLoyalty = String(order.loyaltyDiscount || "0.00");
    let discountAuto = "0.00";
    let deliveryFee = String(order.shippingCost || "0.00");
    let paymentMethod = order.paymentMethod || "Nao Informado";
    let couponCode = null;
    const snap = safeJsonParse(order.discountsSnapshot, {});
    if (snap && typeof snap === "object") {
      couponCode = snap.couponCode || null;
      paymentMethod = snap.paymentMethodName || paymentMethod;
      if (snap.totals) {
        discountCoupon = String(snap.totals.couponDiscount || "0.00");
        discountLoyalty = String(snap.totals.loyaltyDiscount || "0.00");
        discountAuto = String(snap.totals.autoDiscount || "0.00");
        deliveryFee = String(snap.totals.shipping || deliveryFee);
      }
    }
    await db2.delete(biFinancialFacts).where(eq3(biFinancialFacts.orderId, biOrderId));
    await db2.insert(biFinancialFacts).values({
      orderId: biOrderId,
      paymentMethod,
      grossTotal: String(order.subtotal || "0.00"),
      deliveryFee,
      discountCoupon,
      discountLoyalty,
      discountAuto,
      netTotal: String(order.total || "0.00"),
      couponCode,
      dateId
    });
    await db2.delete(biSalesFacts).where(eq3(biSalesFacts.orderId, biOrderId));
    for (const item of orderItems2) {
      const options = safeJsonParse(item.options, {});
      if ((options?.isPackage || options?._type === "package_custom") && Array.isArray(options.meals) && options.meals.length > 0) {
        for (const meal of options.meals) {
          await db2.insert(biSalesFacts).values({
            orderId: biOrderId,
            dishId: safeNumber(meal.dishId),
            combinationHash: `pkg_${options.packageName || "custom"}_dish_${meal.dishId || 0}`,
            itemsDetail: [
              {
                name: meal.dishName || meal.label || "Marmita do Pacote",
                accompaniments: meal.accompaniments || meal.selectedAccompaniments || []
              }
            ],
            quantity: safeNumber(item.quantity, 1),
            netRevenue: String(
              (safeNumber(item.totalPrice) / options.meals.length).toFixed(2)
            ),
            dateId
          });
        }
      } else {
        await db2.insert(biSalesFacts).values({
          orderId: biOrderId,
          dishId: safeNumber(item.dishId),
          combinationHash: `dish_${item.dishId || 0}`,
          itemsDetail: [
            {
              name: item.dishName || "Prato Avulso",
              accompaniments: options?.selectedAccompaniments || options?.accompaniments || []
            }
          ],
          quantity: safeNumber(item.quantity, 1),
          netRevenue: String(item.totalPrice || "0.00"),
          dateId
        });
      }
    }
    logger.info(`[BI Worker] Processed successfully: ${orderId}`);
  } catch (fatalError) {
    const err = fatalError;
    logger.error({ err }, `[BI Worker] Fatal processing error for ${orderId}: ${err.message}`);
    throw fatalError;
  }
}
async function ensureBIWorkerRunning() {
  if (biWorker) return true;
  const ready = isRedisReady() || await ensureRedisReady("bi-worker-bootstrap");
  if (!ready) {
    warnWorker(`Redis not ready. Worker bootstrap postponed. status=${redisConnection.status}`);
    scheduleWorkerBootstrap();
    return false;
  }
  if (!queueErrorBound) {
    queueErrorBound = true;
    biQueue.on("error", (err) => {
      warnQueue(`Redis error: ${err.message}`);
    });
  }
  biWorker = new Worker(BI_QUEUE_NAME, processAnalyticsJob, {
    connection
  });
  biWorker.on("error", (err) => {
    warnWorker(`Redis error: ${err.message}`);
  });
  logger.info("[BI Worker] Worker online and waiting for jobs.");
  return true;
}
async function enqueueBIAnalyticsJob(orderId, options) {
  const ready = isRedisReady() || await ensureRedisReady("bi-queue-enqueue");
  if (!ready) {
    warnQueue(
      `Redis not ready. BI job skipped for order ${orderId}. status=${redisConnection.status}`
    );
    scheduleWorkerBootstrap();
    return false;
  }
  await ensureBIWorkerRunning();
  try {
    await biQueue.add("process-analytics", { orderId }, options);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warnQueue(`Failed to enqueue order ${orderId}: ${message}`);
    return false;
  }
}
void ensureBIWorkerRunning();

// server/routers/admin/analytics.ts
var adminAnalyticsRouter = router({
  /**
   * 📊 Retorna os dados consolidados do Dashboard de BI
   */
  getDashboardStats: adminProcedure.input(z.object({
    period: z.enum(["7d", "30d", "90d", "all"]).default("30d")
  }).optional()).query(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
    const days = input?.period === "7d" ? 7 : input?.period === "90d" ? 90 : 30;
    const now = /* @__PURE__ */ new Date();
    const dateLimit = input?.period === "all" ? 0 : safeInteger(new Date(now.getTime() - days * 24 * 60 * 60 * 1e3).toISOString().split("T")[0].replace(/-/g, ""));
    try {
      const financials = await db2.select({
        grossRevenue: sql3`CAST(SUM(${biFinancialFacts.grossTotal}) AS DECIMAL(10,2))`,
        netRevenue: sql3`CAST(SUM(${biFinancialFacts.netTotal}) AS DECIMAL(10,2))`,
        coupon: sql3`CAST(SUM(${biFinancialFacts.discountCoupon}) AS DECIMAL(10,2))`,
        loyalty: sql3`CAST(SUM(${biFinancialFacts.discountLoyalty}) AS DECIMAL(10,2))`,
        auto: sql3`CAST(SUM(${biFinancialFacts.discountAuto}) AS DECIMAL(10,2))`,
        totalDiscounts: sql3`CAST(SUM(
              COALESCE(${biFinancialFacts.discountCoupon}, 0) + 
              COALESCE(${biFinancialFacts.discountLoyalty}, 0) + 
              COALESCE(${biFinancialFacts.discountAuto}, 0)
            ) AS DECIMAL(10,2))`
      }).from(biFinancialFacts).where(dateLimit > 0 ? gte(biFinancialFacts.dateId, dateLimit) : void 0);
      const fin = financials[0] || { grossRevenue: 0, netRevenue: 0, coupon: 0, loyalty: 0, auto: 0, totalDiscounts: 0 };
      const timeline = await db2.select({
        dateId: biFinancialFacts.dateId,
        Faturamento: sql3`CAST(SUM(${biFinancialFacts.netTotal}) AS DECIMAL(10,2))`
      }).from(biFinancialFacts).where(dateLimit > 0 ? gte(biFinancialFacts.dateId, dateLimit) : void 0).groupBy(biFinancialFacts.dateId).orderBy(biFinancialFacts.dateId);
      const topDishes = await db2.select({
        dishId: biSalesFacts.dishId,
        name: sql3`COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${biSalesFacts.itemsDetail}, '$[0].name')), CONCAT('Prato ', ${biSalesFacts.dishId}))`,
        count: sql3`SUM(${biSalesFacts.quantity})`
      }).from(biSalesFacts).where(dateLimit > 0 ? gte(biSalesFacts.dateId, dateLimit) : void 0).groupBy(biSalesFacts.dishId).orderBy(desc(sql3`SUM(${biSalesFacts.quantity})`)).limit(10);
      const topAccs = await db2.execute(sql3`
          SELECT name, SUM(count) as count FROM (
            SELECT jt.accName as name, SUM(quantity) as count
            FROM bi_sales_facts,
            JSON_TABLE(items_detail, '$[*].accompaniments[*]' COLUMNS (accName VARCHAR(255) PATH '$.name')) AS jt
            WHERE date_id >= ${dateLimit} AND jt.accName IS NOT NULL
            GROUP BY jt.accName
            UNION ALL
            SELECT jt2.accName as name, SUM(quantity) as count
            FROM bi_sales_facts,
            JSON_TABLE(items_detail, '$[*].meals[*].accompaniments[*]' COLUMNS (accName VARCHAR(255) PATH '$.name')) AS jt2
            WHERE date_id >= ${dateLimit} AND jt2.accName IS NOT NULL
            GROUP BY jt2.accName
          ) AS consolidated_accs
          GROUP BY name ORDER BY count DESC LIMIT 10
        `);
      const accRows = topAccs[0];
      const topCouponsQuery = await db2.execute(sql3`
          SELECT coupon_code as name, SUM(discount_coupon) as value, COUNT(*) as usage_count
          FROM bi_financial_facts
          WHERE date_id >= ${dateLimit} AND coupon_code IS NOT NULL AND coupon_code != ''
          GROUP BY coupon_code ORDER BY value DESC LIMIT 5
        `);
      const couponRows = topCouponsQuery[0];
      const paymentMethodsQuery = await db2.execute(sql3`
          SELECT payment_method as name, SUM(net_total) as value, COUNT(*) as count
          FROM bi_financial_facts
          WHERE date_id >= ${dateLimit} AND payment_method IS NOT NULL
          GROUP BY payment_method ORDER BY value DESC
        `);
      const paymentRows = paymentMethodsQuery[0];
      const dateLimitObj = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
      const customers = await db2.select({ total: sql3`count(*)` }).from(users).where(input?.period === "all" ? void 0 : gte(users.createdAt, dateLimitObj));
      const totalOrders = await db2.select({ count: sql3`count(*)` }).from(biFinancialFacts).where(dateLimit > 0 ? gte(biFinancialFacts.dateId, dateLimit) : void 0);
      const ordersCount = safeNumber(totalOrders[0]?.count);
      return {
        financials: {
          grossRevenue: safeNumber(fin.grossRevenue),
          netRevenue: safeNumber(fin.netRevenue)
        },
        discountBreakdown: [
          { name: "Cupons", value: safeNumber(fin.coupon) },
          { name: "Fidelidade", value: safeNumber(fin.loyalty) },
          { name: "Qtd/Autom\xE1tico", value: safeNumber(fin.auto) }
        ],
        totalGivenDiscounts: safeNumber(fin.totalDiscounts),
        chartData: timeline.map((t2) => {
          const s = String(t2.dateId);
          return { date: `${s.slice(6, 8)}/${s.slice(4, 6)}`, Faturamento: safeNumber(t2.Faturamento) };
        }),
        paymentMethods: paymentRows.map((p) => ({
          name: String(p.name),
          value: safeNumber(p.value),
          count: safeNumber(p.count)
        })),
        topDishes: topDishes.map((d) => ({ dishId: safeNumber(d.dishId), name: d.name, count: safeNumber(d.count) })),
        topAccompaniments: accRows.map((a) => ({ name: String(a.name), count: safeNumber(a.count) })),
        topCoupons: couponRows.map((c) => ({
          coupon: String(c.name),
          usage_count: safeNumber(c.usage_count),
          total_discounted: safeNumber(c.value)
        })),
        newCustomers: safeNumber(customers[0]?.total),
        avgTicket: ordersCount > 0 ? safeNumber(fin.netRevenue) / ordersCount : 0,
        topDishesInPackages: []
      };
    } catch (error) {
      logger.error({ err: error }, "Erro no Dashboard de BI");
      throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao carregar analytics." });
    }
  }),
  /**
   * 🔄 Sincronização por Lotes (Batch Sync)
   */
  syncHistory: adminProcedure.input(z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(500).default(100)
  }).optional()).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
    const validStatuses = ["shipped", "delivered", "completed"];
    const batchLimit = input?.limit ?? 100;
    const batch = await db2.select({ id: orders.id }).from(orders).where(
      and(
        // @ts-expect-error - Drizzle às vezes reclama de Enums mesmo com 'as const'
        inArray(orders.status, validStatuses),
        input?.cursor ? gt(orders.id, input.cursor) : void 0
      )
    ).orderBy(asc(orders.id)).limit(batchLimit);
    if (batch.length === 0) {
      return { success: true, processed: 0, nextCursor: null, hasMore: false };
    }
    logger.info(`\u{1F680} BI: Enfileirando lote de ${batch.length} pedidos.`);
    const workerReady = await ensureBIWorkerRunning();
    if (!workerReady) {
      logger.warn("BI syncHistory skipped: Redis/worker not ready.");
      return {
        success: false,
        processed: 0,
        skipped: batch.length,
        nextCursor: null,
        hasMore: true
      };
    }
    let skipped = 0;
    for (const order of batch) {
      const queued = await enqueueBIAnalyticsJob(order.id, {
        removeOnComplete: true,
        attempts: 2,
        jobId: `sync-${order.id}`,
        priority: 10
      });
      if (!queued) skipped += 1;
    }
    const nextCursor = batch[batch.length - 1].id;
    return {
      success: true,
      processed: batch.length - skipped,
      skipped,
      nextCursor,
      hasMore: batch.length === batchLimit
    };
  })
});

// server/routers/admin/logs.ts
init_db();
init_schema();
init_encryption();
import { z as z2 } from "zod";
import { desc as desc2, eq as eq4 } from "drizzle-orm";
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
    if (!db2) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indispon\xEDvel."
      });
    }
    try {
      const rows = await db2.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues
      }).from(auditLogs).leftJoin(users, eq4(auditLogs.userId, users.id)).orderBy(desc2(auditLogs.createdAt)).limit(input.limit).offset(input.offset);
      return rows.map((row) => {
        const parseLogValues = (val) => {
          if (!val) return null;
          if (typeof val === "object" && !Buffer.isBuffer(val)) {
            return val;
          }
          try {
            const str = Buffer.isBuffer(val) ? val.toString("utf8") : String(val);
            return JSON.parse(str);
          } catch {
            return { info: "Dados em formato incompat\xEDvel ou texto puro" };
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
          // ✅ Descriptografia do nome do executor da ação
          user: row.userName ? { name: unseal(row.userName), email: row.userEmail } : { name: "Sistema", email: "Autom\xE1tico" },
          createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : (/* @__PURE__ */ new Date()).toISOString()
        };
      });
    } catch (err) {
      console.error("Erro ao processar logs de auditoria:", err);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao carregar trilha de auditoria para o painel."
      });
    }
  })
});

// server/routers/admin/health.ts
import { sql as sql4 } from "drizzle-orm";
var healthRouter = router({
  checkStatus: adminProcedure.query(async ({ ctx }) => {
    const start = Date.now();
    let dbStatus = "online";
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await ctx.db.execute(sql4`SELECT 1`);
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = "offline";
    }
    let redisStatus = "online";
    let redisLatency = 0;
    try {
      const redisStart = Date.now();
      await redisConnection.ping();
      redisLatency = Date.now() - redisStart;
    } catch {
      redisStatus = "offline";
    }
    return {
      status: dbStatus === "online" && redisStatus === "online" ? "healthy" : "critical",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      totalLatency: Date.now() - start,
      components: [
        { id: "database", name: "MySQL Server (.10)", status: dbStatus, latency: dbLatency },
        { id: "redis", name: "Redis Cache (.10)", status: redisStatus, latency: redisLatency },
        { id: "api", name: "Node.js Engine (.6)", status: "online", latency: 0 }
      ]
    };
  })
});

// server/_core/env.ts
var nodeEnv = process.env.NODE_ENV || "development";
var appEnv = process.env.APP_ENV || "";
var corsOrigin = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "";
var redisUrl2 = process.env.REDIS_URL || "";
var isProdNode = nodeEnv === "production";
var isProductionLike = isProdNode || appEnv === "production" || process.env.VERCEL_ENV === "production" || process.env.RAILWAY_ENVIRONMENT === "production";
var warn = (key, required = false) => {
  const val = process.env[key];
  if (!val) {
    const level = required && isProductionLike ? "[critical]" : "[warn]";
    console.warn(`[ENV] ${level} Missing env var: ${key}`);
  }
  return val ?? "";
};
var get = (key, fallback = "") => {
  return process.env[key] ?? fallback;
};
var isStrongSecret = (val, minLength = 32) => val.trim().length >= minLength;
var isIpv4 = (host) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
var isPrivateIpv4 = (host) => {
  if (!isIpv4(host)) return false;
  const [a, b] = host.split(".").map((n) => Number(n));
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  return false;
};
var LOCAL_REDIS_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1", "redis"]);
function parseRedisUrl(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    return {
      hostname,
      hasAuth: Boolean(url.password),
      isLocal: LOCAL_REDIS_HOSTS.has(hostname),
      isIpv4: isIpv4(hostname),
      isPrivateIpv4: isPrivateIpv4(hostname)
    };
  } catch {
    return null;
  }
}
var parsedRedis = parseRedisUrl(redisUrl2);
var sessionSecret = get("SESSION_SECRET");
var jwtSecret = get("JWT_SECRET");
var hasStrongSessionSecret = isStrongSecret(sessionSecret);
var hasStrongJwtSecret = isStrongSecret(jwtSecret);
var ENV = {
  appId: get("VITE_APP_ID"),
  cookieSecret: process.env.SESSION_SECRET || warn("JWT_SECRET", true),
  databaseUrl: warn("DATABASE_URL", true),
  redisUrl: redisUrl2,
  corsOrigin,
  nodeEnv,
  appEnv,
  oAuthServerUrl: get("OAUTH_SERVER_URL"),
  ownerOpenId: get("OWNER_OPEN_ID"),
  isProduction: isProdNode,
  isProductionLike,
  forgeApiUrl: get("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: get("BUILT_IN_FORGE_API_KEY"),
  dbEncryptionKey: warn("DB_ENCRYPTION_KEY", true),
  isPM2: Boolean(process.env.pm_id),
  hasRedis: Boolean(redisUrl2),
  redisIsLocal: Boolean(parsedRedis?.isLocal),
  redisHasAuth: Boolean(parsedRedis?.hasAuth),
  redisIsPrivateIp: Boolean(parsedRedis?.isIpv4 && parsedRedis?.isPrivateIpv4),
  redisIsPublicIp: Boolean(parsedRedis?.isIpv4 && !parsedRedis?.isPrivateIpv4),
  hasStrongSessionSecret,
  hasStrongJwtSecret,
  secretsAreStrong: hasStrongSessionSecret && hasStrongJwtSecret
};

// server/security/rateLimit.ts
import rateLimit from "express-rate-limit";
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "";
  if (rawIp.startsWith("::ffff:")) {
    return rawIp.replace("::ffff:", "");
  }
  return rawIp;
}
function isLocalRequest(req) {
  const clientIp = getClientIp(req);
  return clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost" || clientIp === "";
}
var skipLocalhost = (req) => isLocalRequest(req);
var globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 2e3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhost,
  message: {
    status: 429,
    message: "Muitas requisicoes. Acalme o apetite e tente novamente em 15 minutos."
  }
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 50,
  skip: skipLocalhost,
  message: {
    status: 429,
    message: "Muitas tentativas de login. Por seguranca, tente novamente mais tarde."
  }
});
var checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  max: 50,
  skip: skipLocalhost,
  message: {
    status: 429,
    message: "Limite de pedidos atingido. Se houver um problema, contacte o suporte."
  }
});

// server/lib/upload-security.ts
import crypto3 from "crypto";
import { TRPCError as TRPCError4 } from "@trpc/server";
var MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
var ALLOWED_MIME_TYPES = /* @__PURE__ */ new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);
var DANGEROUS_EXTENSIONS = /* @__PURE__ */ new Set([
  "svg",
  "html",
  "htm",
  "js",
  "mjs",
  "cjs",
  "exe",
  "bat",
  "cmd",
  "ps1",
  "php",
  "sh"
]);
function detectMimeFromBuffer(buffer) {
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return "image/jpeg";
  }
  if (buffer.length >= 8 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71 && buffer[4] === 13 && buffer[5] === 10 && buffer[6] === 26 && buffer[7] === 10) {
    return "image/png";
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString("ascii");
    if (header === "GIF87a" || header === "GIF89a") {
      return "image/gif";
    }
  }
  return null;
}
function sanitizeMediaFolder(folder) {
  const normalized = (folder || "geral").toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 40);
  return normalized || "geral";
}
function validateAndDecodeImageUpload(input) {
  const extension = input.filename.split(".").pop()?.toLowerCase() || "";
  if (DANGEROUS_EXTENSIONS.has(extension)) {
    throw new TRPCError4({
      code: "BAD_REQUEST",
      message: "Tipo de arquivo n\xE3o permitido."
    });
  }
  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw new TRPCError4({
      code: "BAD_REQUEST",
      message: "Formato de m\xEDdia n\xE3o permitido."
    });
  }
  const buffer = Buffer.from(input.base64Data, "base64");
  if (!buffer.length) {
    throw new TRPCError4({
      code: "BAD_REQUEST",
      message: "Arquivo inv\xE1lido ou vazio."
    });
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new TRPCError4({
      code: "BAD_REQUEST",
      message: "Arquivo excede o limite de 5MB."
    });
  }
  const detectedMime = detectMimeFromBuffer(buffer);
  if (!detectedMime || detectedMime !== input.mimeType) {
    throw new TRPCError4({
      code: "BAD_REQUEST",
      message: "Conte\xFAdo do arquivo n\xE3o confere com o MIME informado."
    });
  }
  return {
    buffer,
    mimeType: detectedMime,
    size: buffer.length
  };
}
function buildSafeMediaFilename(mimeType) {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "gif";
  return `${Date.now()}-${crypto3.randomBytes(8).toString("hex")}.${extension}`;
}

// server/routers/admin/security.ts
function isIpv42(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}
function isPrivateIpv42(host) {
  if (!isIpv42(host)) return false;
  const [a, b] = host.split(".").map((n) => Number(n));
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  return false;
}
function parseRedisUrl2(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    return {
      hostname,
      isIpv4: isIpv42(hostname),
      isPrivateIpv4: isPrivateIpv42(hostname)
    };
  } catch {
    return null;
  }
}
function getRedisAuthCheck() {
  const redisInfo = parseRedisUrl2(ENV.redisUrl);
  const host = redisInfo?.hostname || "";
  const hasRedis = ENV.hasRedis;
  const hasAuth = ENV.redisHasAuth;
  const isLocal = ENV.redisIsLocal;
  const isPrivateIp = Boolean(redisInfo?.isIpv4 && redisInfo?.isPrivateIpv4);
  const isPublicIp = Boolean(redisInfo?.isIpv4 && !redisInfo?.isPrivateIpv4);
  const isProduction = ENV.isProductionLike;
  if (!hasRedis) {
    return {
      id: "redis_auth_policy",
      title: "Autentica\xE7\xE3o do Redis",
      status: false,
      risk: "critical",
      message: "Redis n\xE3o configurado."
    };
  }
  if (hasAuth) {
    return {
      id: "redis_auth_policy",
      title: "Autentica\xE7\xE3o do Redis",
      status: true,
      risk: "secure",
      message: "Redis com autentica\xE7\xE3o ativa."
    };
  }
  if (isPublicIp) {
    return {
      id: "redis_auth_policy",
      title: "Autentica\xE7\xE3o do Redis",
      status: false,
      risk: "critical",
      message: "Redis em IP p\xFAblico sem senha."
    };
  }
  if (isLocal) {
    return {
      id: "redis_auth_policy",
      title: "Autentica\xE7\xE3o do Redis",
      status: true,
      risk: "secure",
      message: "Redis local sem senha (aceit\xE1vel para desenvolvimento/ambiente local)."
    };
  }
  if (isPrivateIp) {
    return {
      id: "redis_auth_policy",
      title: "Autentica\xE7\xE3o do Redis",
      status: !isProduction,
      risk: isProduction ? "critical" : "attention",
      message: isProduction ? "Redis privado sem senha em ambiente produtivo." : "Redis privado sem senha (revisar antes de produ\xE7\xE3o)."
    };
  }
  return {
    id: "redis_auth_policy",
    title: "Autentica\xE7\xE3o do Redis",
    status: false,
    risk: isProduction ? "critical" : "attention",
    message: host.length > 0 ? "Redis externo sem senha." : "N\xE3o foi poss\xEDvel validar host do Redis."
  };
}
function getSecretsCheck() {
  const hasSession = ENV.hasStrongSessionSecret;
  const hasJwt = ENV.hasStrongJwtSecret;
  if (hasSession && hasJwt) {
    return {
      id: "auth_secrets_strength",
      title: "SESSION_SECRET/JWT_SECRET fortes",
      status: true,
      risk: "secure",
      message: "Segredos com tamanho recomendado (>= 32)."
    };
  }
  if (hasSession || hasJwt) {
    return {
      id: "auth_secrets_strength",
      title: "SESSION_SECRET/JWT_SECRET fortes",
      status: true,
      risk: "attention",
      message: "Apenas um segredo forte detectado. Recomenda-se ambos."
    };
  }
  return {
    id: "auth_secrets_strength",
    title: "SESSION_SECRET/JWT_SECRET fortes",
    status: false,
    risk: "critical",
    message: "Nenhum segredo forte detectado (m\xEDnimo recomendado: 32)."
  };
}
function getCorsCheck() {
  const cors2 = ENV.corsOrigin.trim();
  const wildcard = cors2 === "*" || cors2 === "";
  if (ENV.isProductionLike) {
    return {
      id: "cors_origin_policy",
      title: "Pol\xEDtica de CORS",
      status: !wildcard,
      risk: wildcard ? "critical" : "secure",
      message: wildcard ? "CORS com wildcard em produ\xE7\xE3o." : "CORS restrito para produ\xE7\xE3o."
    };
  }
  return {
    id: "cors_origin_policy",
    title: "Pol\xEDtica de CORS",
    status: true,
    risk: wildcard ? "attention" : "secure",
    message: wildcard ? "Wildcard esperado em ambiente local." : "CORS configurado sem wildcard."
  };
}
function getChecks() {
  const redactionProbe = redactSensitiveData({
    token: "sensitive-token",
    nested: { password: "top-secret" }
  });
  const redactionWorks = redactionProbe?.token === "[redacted]" && redactionProbe?.nested?.password === "[redacted]";
  const rateLimitActive = typeof globalLimiter === "function" && typeof authLimiter === "function" && typeof checkoutLimiter === "function" && typeof createRateLimitMiddleware === "function";
  const uploadSecurityActive = typeof validateAndDecodeImageUpload === "function" && typeof sanitizeMediaFolder === "function" && typeof buildSafeMediaFilename === "function";
  return [
    {
      id: "redis_url_exists",
      title: "REDIS_URL configurado",
      status: ENV.hasRedis,
      risk: ENV.hasRedis ? "secure" : "critical",
      message: ENV.hasRedis ? "Configura\xE7\xE3o presente." : "Vari\xE1vel ausente para fila/cache."
    },
    getRedisAuthCheck(),
    {
      id: "database_url_exists",
      title: "DATABASE_URL configurado",
      status: Boolean(ENV.databaseUrl),
      risk: ENV.databaseUrl ? "secure" : "critical",
      message: ENV.databaseUrl ? "Configura\xE7\xE3o presente." : "Vari\xE1vel ausente para conex\xE3o de banco."
    },
    getSecretsCheck(),
    {
      id: "node_env_production",
      title: "NODE_ENV consistente",
      status: ENV.nodeEnv === "production" || !ENV.isProductionLike,
      risk: ENV.nodeEnv === "production" || !ENV.isProductionLike ? "secure" : "critical",
      message: ENV.nodeEnv === "production" ? "NODE_ENV em produ\xE7\xE3o." : ENV.isProductionLike ? "Ambiente de produ\xE7\xE3o sem NODE_ENV=production." : "Ambiente n\xE3o produtivo."
    },
    getCorsCheck(),
    {
      id: "rate_limit_active",
      title: "Rate limit ativo",
      status: rateLimitActive,
      risk: rateLimitActive ? "secure" : "attention",
      message: rateLimitActive ? "Middlewares de limite carregados." : "N\xE3o foi poss\xEDvel confirmar prote\xE7\xE3o de limite."
    },
    {
      id: "upload_security_active",
      title: "Upload security ativo",
      status: uploadSecurityActive,
      risk: uploadSecurityActive ? "secure" : "critical",
      message: uploadSecurityActive ? "Valida\xE7\xE3o e sanitiza\xE7\xE3o de upload dispon\xEDveis." : "Prote\xE7\xE3o de upload n\xE3o detectada."
    },
    {
      id: "audit_redaction_active",
      title: "Reda\xE7\xE3o de auditoria ativa",
      status: redactionWorks && typeof logAction === "function",
      risk: redactionWorks ? "secure" : "critical",
      message: redactionWorks && typeof logAction === "function" ? "Campos sens\xEDveis s\xE3o mascarados." : "Reda\xE7\xE3o de dados sens\xEDveis n\xE3o confirmada."
    }
  ];
}
function summarizeOverallRisk(checks) {
  if (checks.some((c) => c.risk === "critical")) return "critical";
  if (checks.some((c) => c.risk === "attention")) return "attention";
  return "secure";
}
var securityRouter = router({
  getEnvironmentSecurityReport: adminProcedure.query(async () => {
    const checks = getChecks();
    const overallRisk = summarizeOverallRisk(checks);
    return {
      status: overallRisk,
      environment: ENV.isProductionLike ? "production" : "development",
      runtime: ENV.isPM2 ? "pm2" : "local",
      isProductionLike: ENV.isProductionLike,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      summary: overallRisk === "secure" ? "Configura\xE7\xE3o geral sem riscos cr\xEDticos." : overallRisk === "attention" ? "Existem pontos que precisam de revis\xE3o." : "Existem riscos cr\xEDticos que exigem a\xE7\xE3o imediata.",
      checks
    };
  })
});

// server/routers/admin/nutri/nutri.ts
import { z as z3 } from "zod";
init_db();
init_schema();
import { eq as eq5, inArray as inArray2, desc as desc3 } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
init_encryption();
var adminNutriRouter = router({
  /**
   * ✅ LISTAR TODOS OS NUTRICIONISTAS
   */
  listAll: adminProcedure.query(async () => {
    const db2 = await getDb();
    const rows = await db2.select({
      id: nutriProfiles.id,
      userId: nutriProfiles.userId,
      crn: nutriProfiles.crn,
      specialty: nutriProfiles.specialty,
      referralCode: nutriProfiles.referralCode,
      discountPercentage: nutriProfiles.discountPercentage,
      isVerified: nutriProfiles.isVerified,
      isActive: nutriProfiles.isActive,
      createdAt: nutriProfiles.createdAt,
      name: users.name,
      email: users.email,
      avatar: nutriProfiles.avatarUrl
    }).from(nutriProfiles).innerJoin(users, eq5(nutriProfiles.userId, users.id)).orderBy(desc3(nutriProfiles.createdAt));
    return rows.map((nutri) => ({
      ...nutri,
      name: nutri.name ? decrypt(nutri.name) : "Nome n\xE3o dispon\xEDvel",
      email: nutri.email ? decrypt(nutri.email) : "E-mail n\xE3o dispon\xEDvel"
    }));
  }),
  /**
   * ✅ BUSCAR PACIENTES VINCULADOS (Aba 'Rede')
   */
  getLinkedUsers: adminProcedure.input(z3.object({ referralCode: z3.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const rows = await db2.select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt
    }).from(users).where(eq5(users.referralCode, input.referralCode));
    return rows.map((user) => ({
      ...user,
      name: user.name ? decrypt(user.name) : "Nome n\xE3o dispon\xEDvel",
      email: user.email ? decrypt(user.email) : "E-mail n\xE3o dispon\xEDvel"
    }));
  }),
  /**
   * ✅ BUSCAR ENDEREÇOS DO NUTRI (Aba 'Endereços')
   */
  getDetails: adminProcedure.input(z3.object({ nutriId: z3.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const rows = await db2.select().from(nutriAddresses).where(eq5(nutriAddresses.nutriId, input.nutriId));
    return rows.map((addr) => ({
      ...addr,
      street: addr.street ? decrypt(addr.street) : null,
      number: addr.number ? decrypt(addr.number) : null,
      complement: addr.complement ? decrypt(addr.complement) : null,
      neighborhood: addr.neighborhood ? decrypt(addr.neighborhood) : null,
      city: addr.city ? decrypt(addr.city) : null,
      state: addr.state ? decrypt(addr.state) : null,
      zipCode: addr.zipCode ? decrypt(addr.zipCode) : null
    }));
  }),
  /**
   * ✅ ATUALIZAR DADOS
   */
  update: adminProcedure.input(z3.object({
    id: z3.string(),
    discountPercentage: z3.number().optional(),
    isVerified: z3.boolean().optional(),
    isActive: z3.boolean().optional(),
    crn: z3.string().optional(),
    specialty: z3.string().optional()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const { id, ...data } = input;
    await db2.update(nutriProfiles).set(data).where(eq5(nutriProfiles.id, id));
    return { success: true };
  }),
  /**
   * ✅ EXCLUIR
   */
  delete: adminProcedure.input(z3.object({ id: z3.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.delete(nutriProfiles).where(eq5(nutriProfiles.id, input.id));
    return { success: true };
  }),
  /**
   * ✅ SALVAR PRESCRIÇÃO
   */
  save: adminProcedure.input(z3.object({
    clientId: z3.string(),
    professionalId: z3.string(),
    planName: z3.string(),
    technicalInsight: z3.string().optional(),
    meals: z3.array(z3.object({
      name: z3.string(),
      order: z3.number(),
      dishes: z3.array(z3.object({
        dishId: z3.number(),
        sizeId: z3.number()
      }))
    }))
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const allDishIds = input.meals.flatMap((m) => m.dishes.map((d) => d.dishId));
    const allSizeIds = input.meals.flatMap((m) => m.dishes.map((d) => d.sizeId));
    if (allDishIds.length === 0) return { success: false };
    const dishesInfo = await db2.select().from(dishes).where(inArray2(dishes.id, allDishIds));
    const sizesInfo = allSizeIds.length > 0 ? await db2.select().from(dishSizes).where(inArray2(dishSizes.id, allSizeIds)) : [];
    const [nutri] = await db2.select({ discount: nutriProfiles.discountPercentage }).from(nutriProfiles).where(eq5(nutriProfiles.id, input.professionalId)).limit(1);
    const dietSnapshot = input.meals.map((meal) => ({
      mealName: meal.name,
      order: meal.order,
      dishes: meal.dishes.map((d) => {
        const dishBase = dishesInfo.find((dbase) => dbase.id === d.dishId);
        const sizeBase = sizesInfo.find((s) => s.id === d.sizeId);
        return {
          dishId: d.dishId,
          sizeId: d.sizeId,
          name: dishBase?.name || "Prato n\xE3o encontrado",
          priceAtCreation: safeNumber(sizeBase?.price),
          sizeName: sizeBase?.name || "Padr\xE3o",
          multiplier: "1.00",
          nutritionalData: {
            mainDishWeight: safeNumber(sizeBase?.mainDishWeight),
            baseMacros: {
              kcal: safeNumber(dishBase?.energyKcal),
              protein: safeNumber(dishBase?.proteins),
              carbs: safeNumber(dishBase?.carbs),
              fat: safeNumber(dishBase?.fatTotal)
            }
          }
        };
      })
    }));
    await db2.insert(prescriptions).values({
      id: uuidv4(),
      clientId: input.clientId,
      professionalId: input.professionalId,
      planName: input.planName,
      technicalInsight: input.technicalInsight,
      discountPercentage: nutri?.discount || 0,
      dietSnapshot,
      status: "active"
    });
    return { success: true };
  })
});

// server/routers/admin/media.ts
import { z as z4 } from "zod";
init_db();
init_schema();
import { desc as desc4, eq as eq6 } from "drizzle-orm";
import { TRPCError as TRPCError5 } from "@trpc/server";

// server/routers/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// server/routers/admin/media.ts
var adminMediaRouter = router({
  // --- 1. LISTAR PASTAS REAIS (DINÂMICO) ---
  listFolders: adminProcedure.query(async () => {
    try {
      const result = await cloudinary.api.root_folders();
      const cloudFolders = result.folders.map((f) => f.name);
      const defaultFolders = ["logo", "pratos", "banners", "nutris", "geral"];
      const allFolders = Array.from(/* @__PURE__ */ new Set([...defaultFolders, ...cloudFolders]));
      return allFolders;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("\u274C Erro ao listar pastas:", msg);
      return ["logo", "pratos", "banners", "nutris", "geral"];
    }
  }),
  // --- 2. SINCRONIZAR (INTELIGENTE) ---
  syncCloudinary: adminProcedure.mutation(async () => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: "Banco Offline" });
    try {
      const cloudResources = await cloudinary.api.resources({
        type: "upload",
        prefix: "",
        max_results: 500
      });
      const resources = cloudResources.resources || [];
      let newCount = 0;
      let updateCount = 0;
      for (const res of resources) {
        if (res.public_id.includes("samples/")) continue;
        const cloudPath = res.folder || "";
        let folderName = "geral";
        if (cloudPath) {
          const parts = cloudPath.split("/");
          folderName = parts[parts.length - 1].toLowerCase();
        }
        const [existing] = await db2.select().from(media).where(eq6(media.filePath, res.public_id));
        if (!existing) {
          await db2.insert(media).values({
            url: res.secure_url,
            originalFilename: res.public_id.split("/").pop() || "imagem_nuvem",
            mimeType: `image/${res.format}`,
            filePath: res.public_id,
            folder: folderName
          });
          newCount++;
        } else if (existing.folder !== folderName) {
          await db2.update(media).set({ folder: folderName }).where(eq6(media.filePath, res.public_id));
          updateCount++;
        }
      }
      return {
        success: true,
        message: `Sync conclu\xEDdo: ${newCount} novos itens, ${updateCount} movidos.`
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro no Cloudinary";
      throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: msg });
    }
  }),
  // --- 3. UPLOAD (TOTALMENTE DINÂMICO) ---
  upload: adminProcedure.use(
    createRateLimitMiddleware({
      keyPrefix: "admin-media-upload",
      limit: 20,
      windowMs: 5 * 60 * 1e3
    })
  ).input(z4.object({
    filename: z4.string(),
    mimeType: z4.string(),
    base64Data: z4.string(),
    folder: z4.string().optional().default("geral")
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    try {
      const folder = sanitizeMediaFolder(input.folder);
      const validated = validateAndDecodeImageUpload({
        base64Data: input.base64Data,
        mimeType: input.mimeType,
        filename: input.filename
      });
      const safeFilename = buildSafeMediaFilename(validated.mimeType);
      const cloudPath = `gourmet/${folder.replace("geral", "")}`.replace(/\/$/, "");
      const cloudRes = await cloudinary.uploader.upload(
        `data:${validated.mimeType};base64,${validated.buffer.toString("base64")}`,
        {
          folder: cloudPath || "gourmet",
          resource_type: "image",
          public_id: safeFilename.replace(/\.[^.]+$/, ""),
          overwrite: false
        }
      );
      await db2.insert(media).values({
        url: cloudRes.secure_url,
        originalFilename: safeFilename,
        mimeType: validated.mimeType,
        filePath: cloudRes.public_id,
        folder
      });
      return { success: true, url: cloudRes.secure_url };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro no upload";
      throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: msg });
    }
  }),
  // --- 4. LISTAGEM ---
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(media).orderBy(desc4(media.id));
  }),
  // --- 5. EXCLUSÃO ---
  delete: adminProcedure.input(z4.object({ id: z4.union([z4.string(), z4.number()]) })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const targetId = typeof input.id === "string" ? parseInt(input.id, 10) : input.id;
    const [item] = await db2.select().from(media).where(eq6(media.id, targetId));
    if (item) {
      if (item.filePath) await cloudinary.uploader.destroy(item.filePath);
      await db2.delete(media).where(eq6(media.id, targetId));
    }
    return { success: true };
  })
});

// server/routers/admin/marketing.ts
import { z as z5 } from "zod";

// server/storeSettings.ts
init_db();
init_schema();
import { eq as eq7, sql as sql5 } from "drizzle-orm";
async function getStoreSettings() {
  const db2 = await getDb();
  if (!db2) throw new Error("Banco de dados n\xE3o dispon\xEDvel");
  const [rows] = await db2.execute(sql5`SELECT * FROM store_settings WHERE id = '1' LIMIT 1`);
  const parseJsonField = (field) => {
    if (!field) return {};
    try {
      return typeof field === "string" ? JSON.parse(field) : field;
    } catch (e) {
      console.error("Erro ao parsear campo JSON:", e);
      return {};
    }
  };
  if (!rows || rows.length === 0) {
    const defaultData = {
      id: "1",
      generalMinOrderAmount: "0.00",
      emergencyMode: false,
      siteTheme: JSON.stringify({ primary: "#065f46", background: "#FBFBFC", foreground: "#0f172a" }),
      companyInfo: JSON.stringify({}),
      googleLogin: JSON.stringify({ enabled: false, clientId: "", clientSecret: "" }),
      accessibilityHighContrast: false,
      accessibilityDyslexicFont: false,
      pickupEnabled: true,
      pickupLabel: "Retirada no Balc\xE3o",
      pickupInstruction: "Apresente o n\xFAmero do pedido ao chegar."
    };
    try {
      await db2.insert(storeSettings).values(defaultData);
      return {
        ...defaultData,
        generalMinOrderAmount: 0,
        siteTheme: JSON.parse(defaultData.siteTheme),
        companyInfo: {},
        googleLogin: { enabled: false, clientId: "", clientSecret: "" }
      };
    } catch (err) {
      console.error("Erro ao criar configura\xE7\xF5es padr\xE3o:", err);
    }
  }
  const s = rows[0];
  return {
    id: String(s.id),
    generalMinOrderAmount: Number(s.general_min_order_amount || 0),
    minOrderMessage: s.min_order_message || "",
    emergencyMode: Boolean(s.emergency_mode),
    pickupEnabled: Boolean(s.pickup_enabled),
    pickupLabel: s.pickup_label || "Retirada",
    pickupInstruction: s.pickup_instruction || "",
    favicon: s.favicon || "",
    logoUrl: s.logo_url || "",
    siteTheme: parseJsonField(s.site_theme),
    companyInfo: parseJsonField(s.company_info),
    googleLogin: parseJsonField(s.google_login),
    accessibilityHighContrast: Boolean(s.accessibility_high_contrast),
    accessibilityDyslexicFont: Boolean(s.accessibility_dyslexic_font),
    successOrderMessage: s.success_order_message || "Pedido recebido com sucesso! \u{1F957}",
    email_order_subject: s.email_order_subject || "",
    email_order_body: s.email_order_body || ""
  };
}
async function updateStoreSettings(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Banco de dados n\xE3o dispon\xEDvel");
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (data.generalMinOrderAmount !== void 0) updateData.generalMinOrderAmount = String(data.generalMinOrderAmount);
  if (data.minOrderMessage !== void 0) updateData.minOrderMessage = data.minOrderMessage;
  if (data.emergencyMode !== void 0) updateData.emergencyMode = Boolean(data.emergencyMode);
  if (data.successOrderMessage !== void 0) updateData.successOrderMessage = data.successOrderMessage;
  if (data.pickupEnabled !== void 0) updateData.pickupEnabled = Boolean(data.pickupEnabled);
  if (data.pickupLabel !== void 0) updateData.pickupLabel = data.pickupLabel;
  if (data.pickupInstruction !== void 0) updateData.pickupInstruction = data.pickupInstruction;
  if (data.favicon !== void 0) updateData.favicon = data.favicon;
  if (data.logoUrl !== void 0) updateData.logoUrl = data.logoUrl;
  if (data.accessibilityHighContrast !== void 0) updateData.accessibilityHighContrast = Boolean(data.accessibilityHighContrast);
  if (data.accessibilityDyslexicFont !== void 0) updateData.accessibilityDyslexicFont = Boolean(data.accessibilityDyslexicFont);
  if (data.companyInfo) updateData.companyInfo = JSON.stringify(data.companyInfo);
  if (data.siteTheme) updateData.siteTheme = JSON.stringify(data.siteTheme);
  if (data.googleLogin) updateData.googleLogin = JSON.stringify(data.googleLogin);
  try {
    await db2.update(storeSettings).set(updateData).where(eq7(storeSettings.id, "1"));
    return { success: true };
  } catch (err) {
    console.error("Erro ao atualizar storeSettings:", err);
    throw new Error("Falha ao salvar configura\xE7\xF5es no banco.");
  }
}

// server/routers/admin/marketing.ts
import { TRPCError as TRPCError6 } from "@trpc/server";
var adminMarketingRouter = router({
  /**
   * 🔍 BUSCA AS REGRAS DE VENDA
   */
  getRules: adminProcedure.query(async () => {
    try {
      const settings = await getStoreSettings();
      return {
        generalMinOrderAmount: Number(settings?.generalMinOrderAmount || 0),
        minOrderMessage: settings?.minOrderMessage || ""
      };
    } catch {
      throw new TRPCError6({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar regras de venda."
      });
    }
  }),
  /**
   * ✅ ATUALIZAÇÃO DE REGRAS
   * Atualiza o valor mínimo e a mensagem, gerando log de auditoria.
   */
  updateRules: adminProcedure.input(z5.object({
    generalMinOrderAmount: z5.coerce.number().min(0),
    minOrderMessage: z5.string().min(1, "A mensagem \xE9 obrigat\xF3ria")
  })).mutation(async ({ ctx, input }) => {
    try {
      const oldSettings = await getStoreSettings();
      const result = await updateStoreSettings(input);
      await logAction(ctx, "UPDATE_MARKETING_RULES", "store_settings", {
        entityId: "global",
        old: {
          minAmount: oldSettings?.generalMinOrderAmount,
          message: oldSettings?.minOrderMessage
        },
        new: input
      });
      const formattedAmount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(input.generalMinOrderAmount);
      return {
        success: true,
        data: result,
        message: `Regras atualizadas! Novo pedido m\xEDnimo: ${formattedAmount}`
      };
    } catch {
      throw new TRPCError6({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao salvar e auditar novas regras."
      });
    }
  })
});

// server/routers/admin/loyalty.ts
import { z as z6 } from "zod";

// server/admin-loyalty.ts
init_db();
init_schema();
import { eq as eq8, desc as desc5, like, or, count, and as and2, sql as sql6, inArray as inArray3 } from "drizzle-orm";
import crypto4 from "crypto";
var toNum = (val) => val === null || val === void 0 ? 0 : Number(val);
async function getLoyaltyConfigs() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  let settings = await db2.select().from(loyaltySettings).limit(1);
  if (settings.length === 0) {
    const defaultId = "1";
    logger.info("Configura\xE7\xF5es de fidelidade n\xE3o encontradas. Criando padr\xF5es...");
    await db2.insert(loyaltySettings).values({
      id: defaultId,
      enabled: true,
      conversionRatePoints: 1,
      conversionRateMoney: "1.00",
      redemptionRatePoints: 100,
      redemptionRateMoney: "1.00",
      maxDiscountAmount: "50.00",
      minCartAmount: "0.00",
      pointsExpirationDays: 365,
      pointsPerSignup: 100
    });
    settings = await db2.select().from(loyaltySettings).limit(1);
  }
  const config = settings[0];
  return {
    ...config,
    id: String(config.id),
    enabled: Boolean(config.enabled),
    conversionRateMoney: toNum(config.conversionRateMoney),
    redemptionRateMoney: toNum(config.redemptionRateMoney),
    maxDiscountAmount: toNum(config.maxDiscountAmount),
    minCartAmount: toNum(config.minCartAmount)
  };
}
async function updateLoyaltyConfigs(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const updateData = { ...data };
  delete updateData.id;
  updateData.updatedAt = /* @__PURE__ */ new Date();
  await db2.update(loyaltySettings).set(updateData).where(eq8(loyaltySettings.id, "1"));
  logger.info({ updateFields: Object.keys(updateData) }, "Configura\xE7\xF5es de fidelidade atualizadas pelo administrador");
  return { success: true };
}
async function getCustomersLoyalty(params) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const offset = (params.page - 1) * params.limit;
  const conditions = [];
  if (params.search && params.search.trim() !== "" && params.search !== "undefined") {
    const term = `%${params.search}%`;
    conditions.push(
      or(
        like(users.email, term),
        sql6`name_index LIKE ${term}`
      )
    );
  }
  const whereClause = conditions.length > 0 ? and2(...conditions) : void 0;
  try {
    const dataQuery = await db2.select({
      id: users.id,
      name: users.name,
      email: users.email,
      loyaltyBalance: sql6`loyalty_balance`.mapWith(Number),
      totalSpent: sql6`COALESCE(SUM(CASE WHEN ${orders.status} = 'completed' THEN ${orders.total} ELSE 0 END), 0)`.mapWith(Number)
    }).from(users).leftJoin(orders, eq8(orders.userId, users.id)).where(whereClause).groupBy(users.id).orderBy(sql6`loyalty_balance DESC`).limit(params.limit).offset(offset);
    const [totalResult] = await db2.select({ value: count() }).from(users).where(whereClause);
    return {
      items: dataQuery || [],
      total: toNum(totalResult?.value),
      totalPages: Math.ceil(toNum(totalResult?.value) / params.limit)
    };
  } catch (error) {
    logger.error({ err: error }, "Erro ao listar saldo de fidelidade dos clientes");
    return { items: [], total: 0, totalPages: 0 };
  }
}
async function getCustomerHistory(userId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const history = await db2.select().from(loyaltyHistory).where(eq8(loyaltyHistory.userId, userId)).orderBy(desc5(loyaltyHistory.createdAt));
  return (history || []).map((item) => ({
    ...item,
    id: String(item.id),
    userId: String(item.userId),
    points: toNum(item.pointsChange)
  }));
}
async function addManualPoints(userId, points, reason) {
  const db2 = await getDb();
  if (!db2) throw new Error("Banco de dados n\xE3o dispon\xEDvel");
  const type = points > 0 ? "earned" : "burned";
  logger.info({ userId, points, reason }, "\u{1F4DD} Iniciando ajuste manual de pontos");
  try {
    return await db2.transaction(async (tx) => {
      await tx.insert(loyaltyHistory).values({
        id: crypto4.randomUUID(),
        userId,
        pointsChange: points,
        type,
        reason,
        description: reason,
        createdAt: /* @__PURE__ */ new Date()
      });
      await tx.execute(sql6`
                UPDATE users 
                SET loyalty_balance = COALESCE(loyalty_balance, 0) + ${points} 
                WHERE id = ${userId}
            `);
      logger.info({ userId, points }, "\u2705 Pontos ajustados com sucesso");
      return { success: true };
    });
  } catch (error) {
    const dbError = error;
    logger.error({ err: dbError, userId }, "\u274C Falha ao processar ajuste manual de fidelidade");
    throw new Error(`Erro ao salvar pontos: ${dbError.message}`);
  }
}
async function deleteTransactions(userId, transactionIds) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  try {
    return await db2.transaction(async (tx) => {
      logger.warn({ userId, transactionCount: transactionIds.length }, "\u26A0\uFE0F Iniciando estorno de transa\xE7\xF5es de fidelidade");
      await tx.delete(loyaltyHistory).where(
        and2(
          eq8(loyaltyHistory.userId, userId),
          inArray3(loyaltyHistory.id, transactionIds)
        )
      );
      const remainingHistory = await tx.select({
        points: loyaltyHistory.pointsChange
      }).from(loyaltyHistory).where(eq8(loyaltyHistory.userId, userId));
      const newBalance = remainingHistory.reduce((acc, curr) => acc + toNum(curr.points), 0);
      await tx.execute(sql6`
                UPDATE users 
                SET loyalty_balance = ${newBalance} 
                WHERE id = ${userId}
            `);
      logger.info({ userId, newBalance }, "\u2705 Transa\xE7\xF5es deletadas e saldo recalculado");
      return { success: true, newBalance };
    });
  } catch (error) {
    logger.error({ err: error, userId }, "Erro ao deletar transa\xE7\xF5es e recalcular saldo");
    throw new Error("Erro ao processar estorno no banco de dados.");
  }
}

// server/routers/admin/loyalty.ts
import { createDecipheriv as createDecipheriv2, scryptSync as scryptSync2 } from "crypto";
var ENCRYPTION_KEY_RAW = process.env.DB_ENCRYPTION_KEY || "fallback-key-de-seguranca";
var ALGORITHM2 = "aes-256-gcm";
function decryptManual(text19) {
  if (!text19 || typeof text19 !== "string") return null;
  if (!text19.includes(":")) return text19;
  try {
    const parts = text19.split(":");
    if (parts.length !== 3) return text19;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = scryptSync2(ENCRYPTION_KEY_RAW, "static-salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv2(ALGORITHM2, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return text19.startsWith("iv:") ? "Dados Protegidos" : text19;
  }
}
var adminLoyaltySettingsRouter = router({
  get: adminProcedure.query(async () => {
    const configs = await getLoyaltyConfigs();
    return configs || {};
  }),
  getCustomers: adminProcedure.input(z6.object({
    page: z6.number().default(1),
    limit: z6.number().default(10),
    search: z6.string().nullish()
  }).optional()).query(async ({ input }) => {
    const searchTerm = input?.search?.trim() || void 0;
    const result = await getCustomersLoyalty({
      page: input?.page ?? 1,
      limit: input?.limit ?? 10,
      search: searchTerm
    });
    if (!result || !result.items) {
      return { items: [], total: 0, totalPages: 0 };
    }
    const mappedItems = result.items.map((c) => {
      if (!c) return null;
      return {
        ...c,
        id: String(c.id),
        name: decryptManual(c.name) || c.email || "Cliente s/ Nome",
        points: Number(c.loyaltyBalance || 0),
        totalSpent: Number(c.totalSpent || 0)
      };
    }).filter((i) => i !== null);
    return {
      items: mappedItems,
      total: result.total || 0,
      totalPages: result.totalPages || 1
    };
  }),
  addManualPoints: adminProcedure.input(z6.object({
    userId: z6.string(),
    points: z6.coerce.number(),
    reason: z6.string().min(1, "O motivo \xE9 obrigat\xF3rio"),
    customerName: z6.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const result = await addManualPoints(input.userId, input.points, input.reason);
    await logAction(ctx, "LOYALTY_MANUAL_ADJUST", "loyalty", {
      entityId: input.userId,
      new: { pontos: input.points, motivo: input.reason }
    });
    const actionText = input.points >= 0 ? "Adicionados" : "Removidos";
    return {
      success: true,
      data: result,
      message: `${actionText} ${Math.abs(input.points)} pontos ${input.customerName ? `para ${input.customerName}` : "ao cliente"}.`
    };
  }),
  getCustomerHistory: adminProcedure.input(z6.object({ userId: z6.string() })).query(async ({ input }) => {
    const history = await getCustomerHistory(input.userId);
    return (history || []).map((h) => ({
      ...h,
      id: String(h.id),
      points: Number(h.points || 0),
      pointsChange: Number(h.pointsChange || 0)
    }));
  }),
  update: adminProcedure.input(z6.record(z6.unknown())).mutation(async ({ ctx, input }) => {
    const oldConfigs = await getLoyaltyConfigs();
    const result = await updateLoyaltyConfigs(input);
    await logAction(ctx, "UPDATE_LOYALTY_RULES", "loyalty", {
      entityId: "global_configs",
      old: oldConfigs || {},
      new: input
    });
    return {
      success: true,
      data: result,
      message: "Regras do Programa de Fidelidade atualizadas!"
    };
  }),
  deleteTransactions: adminProcedure.input(z6.object({
    userId: z6.string(),
    transactionIds: z6.array(z6.string())
  })).mutation(async ({ ctx, input }) => {
    const result = await deleteTransactions(input.userId, input.transactionIds);
    await logAction(ctx, "LOYALTY_BULK_DELETE", "loyalty", {
      entityId: input.userId,
      new: { count: input.transactionIds.length, transactionIds: input.transactionIds }
    });
    return {
      success: true,
      data: result,
      message: `${input.transactionIds.length} transa\xE7\xE3o(\xF5es) estornada(s) com sucesso.`
    };
  })
});

// server/routers/admin/coupons.ts
import { z as z7 } from "zod";
init_db();
init_schema();
import { eq as eq9, desc as desc6 } from "drizzle-orm";
import { TRPCError as TRPCError7 } from "@trpc/server";
var cleanDate = (val) => {
  if (!val || typeof val === "string" && val.trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};
var couponInputSchema = z7.object({
  code: z7.string().min(3).max(50).toUpperCase().trim(),
  discountType: z7.enum(["percentage", "fixed"]),
  discountValue: z7.coerce.number().positive(),
  minOrderValue: z7.coerce.number().nullish().default(0),
  maxDiscount: z7.coerce.number().nullish(),
  usageLimit: z7.coerce.number().int().nullish(),
  validFrom: z7.any().nullish(),
  validUntil: z7.any().nullish(),
  description: z7.string().nullish(),
  isActive: z7.boolean().optional().default(true),
  bannerColor: z7.string().optional().default("#10b981"),
  logoUrl: z7.string().nullish()
}).passthrough();
var adminCouponsRouter = router({
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    try {
      const result = await db2.select().from(coupons).orderBy(desc6(coupons.createdAt));
      return result.map((c) => ({
        ...c,
        id: String(c.id),
        discountValue: safeNumber(c.discountValue),
        minOrderValue: safeNumber(c.minOrderValue),
        isActive: Boolean(c.isActive)
      }));
    } catch {
      throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar cupons." });
    }
  }),
  create: adminProcedure.input(couponInputSchema).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [existing] = await db2.select().from(coupons).where(eq9(coupons.code, input.code));
    if (existing) throw new TRPCError7({ code: "CONFLICT", message: `O cupom "${input.code}" j\xE1 existe.` });
    try {
      const generatedId = String(Math.floor(Math.random() * 1e9));
      const insertData = {
        id: generatedId,
        code: input.code,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue.toFixed(2),
        minOrderValue: input.minOrderValue?.toFixed(2) || "0.00",
        maxDiscount: input.maxDiscount?.toFixed(2) || null,
        usageLimit: input.usageLimit,
        isActive: Boolean(input.isActive),
        validFrom: cleanDate(input.validFrom),
        validUntil: cleanDate(input.validUntil),
        bannerColor: input.bannerColor,
        logoUrl: input.logoUrl || null,
        createdAt: /* @__PURE__ */ new Date()
      };
      await db2.insert(coupons).values(insertData);
      await logAction(ctx, "CREATE_COUPON", "coupons", {
        entityId: input.code,
        new: { code: input.code, valor: input.discountValue }
      });
      return { success: true, message: `Cupom "${input.code}" criado!` };
    } catch (error) {
      console.error(error);
      throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR", message: "Erro t\xE9cnico ao gerar cupom." });
    }
  }),
  update: adminProcedure.input(z7.object({ id: z7.string() }).passthrough()).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const { id, ...data } = input;
    const [oldCoupon] = await db2.select().from(coupons).where(eq9(coupons.id, id));
    if (!oldCoupon) throw new TRPCError7({ code: "NOT_FOUND", message: "Cupom n\xE3o encontrado." });
    const updatePayload = {};
    const requireMoney = (value, label) => {
      const amount = safeNumber(value, Number.NaN);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new TRPCError7({ code: "BAD_REQUEST", message: `${label} inv\xC3\xA1lido.` });
      }
      return amount.toFixed(2);
    };
    if (data.code !== void 0) updatePayload.code = String(data.code).toUpperCase();
    if (data.discountValue !== void 0) updatePayload.discountValue = requireMoney(data.discountValue, "Desconto");
    if (data.isActive !== void 0) updatePayload.isActive = Boolean(data.isActive);
    if (data.description !== void 0) updatePayload.description = data.description;
    if (data.bannerColor !== void 0) updatePayload.bannerColor = data.bannerColor;
    if (data.logoUrl !== void 0) updatePayload.logoUrl = data.logoUrl;
    if (data.discountType !== void 0) updatePayload.discountType = data.discountType;
    if (data.minOrderValue !== void 0) updatePayload.minOrderValue = requireMoney(data.minOrderValue, "Pedido m\xC3\xADnimo");
    if (data.maxDiscount !== void 0) updatePayload.maxDiscount = data.maxDiscount ? requireMoney(data.maxDiscount, "Desconto m\xC3\xA1ximo") : null;
    if (data.usageLimit !== void 0) updatePayload.usageLimit = data.usageLimit;
    if (data.validFrom !== void 0) updatePayload.validFrom = cleanDate(data.validFrom);
    if (data.validUntil !== void 0) updatePayload.validUntil = cleanDate(data.validUntil);
    try {
      await db2.update(coupons).set(updatePayload).where(eq9(coupons.id, id));
      await logAction(ctx, "UPDATE_COUPON", "coupons", {
        entityId: id,
        // ✅ Agora aceito pelo Auditor (string)
        new: updatePayload
      });
      return { success: true, message: "Cupom atualizado!" };
    } catch (error) {
      console.error(error);
      throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao salvar altera\xE7\xF5es." });
    }
  }),
  delete: adminProcedure.input(z7.object({ id: z7.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    try {
      const targetId = String(input.id);
      const [coupon] = await db2.select().from(coupons).where(eq9(coupons.id, targetId));
      if (!coupon) return { success: true };
      await db2.delete(coupons).where(eq9(coupons.id, targetId));
      return { success: true, message: "Cupom removido." };
    } catch {
      throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar." });
    }
  })
});

// server/routers/admin/discount-rules.ts
import { z as z9 } from "zod";
import { TRPCError as TRPCError8 } from "@trpc/server";

// server/discountRules.ts
init_db();
init_schema2();
import { eq as eq10, desc as desc7 } from "drizzle-orm";
import { z as z8 } from "zod";
var discountRuleInput = z8.object({
  id: z8.coerce.number().optional(),
  name: z8.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  description: z8.string().max(512).optional().nullable(),
  minQuantity: z8.coerce.number().min(1),
  maxQuantity: z8.coerce.number().optional().nullable(),
  type: z8.enum(["percentage", "fixed"]),
  value: z8.coerce.number().min(0),
  priority: z8.coerce.number().optional().nullable(),
  isActive: z8.boolean().optional().default(true)
});
async function listDiscountRules() {
  const db2 = await getDb();
  if (!db2) throw new Error("Banco de dados n\xE3o inicializado");
  try {
    const rules = await db2.select().from(discountRules).orderBy(desc7(discountRules.id));
    return rules.map((rule) => ({
      ...rule,
      id: Number(rule.id),
      minQuantity: Number(rule.minQuantity),
      // ✅ MAPEAMENTO: Traduz o que vem do banco para o que o front espera
      type: rule.discountType,
      value: Number(rule.discountValue),
      isActive: Boolean(rule.isActive)
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao listar regras de desconto:", errorMessage);
    return [];
  }
}
async function createDiscountRule(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  await db2.insert(discountRules).values({
    name: data.name,
    description: data.description ?? null,
    minQuantity: data.minQuantity,
    maxQuantity: data.maxQuantity ?? null,
    discountType: data.type,
    discountValue: data.value.toString(),
    priority: data.priority ?? 0,
    isActive: data.isActive
  });
  return { success: true };
}
async function updateDiscountRule(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  await db2.update(discountRules).set({
    name: data.name,
    description: data.description ?? null,
    minQuantity: data.minQuantity,
    maxQuantity: data.maxQuantity ?? null,
    discountType: data.type,
    discountValue: data.value.toString(),
    priority: data.priority ?? 0,
    isActive: data.isActive,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq10(discountRules.id, id));
  return { success: true };
}
async function deleteDiscountRule(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  await db2.delete(discountRules).where(eq10(discountRules.id, id));
  return { success: true };
}

// server/routers/admin/discount-rules.ts
var adminDiscountRulesRouter = router({
  list: adminProcedure.query(async () => {
    try {
      return await listDiscountRules();
    } catch {
      throw new TRPCError8({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar regras de desconto."
      });
    }
  }),
  create: adminProcedure.input(discountRuleInput).mutation(async ({ input }) => {
    try {
      const result = await createDiscountRule(input);
      return {
        success: true,
        data: result,
        message: `Regra "${input.name}" criada com sucesso!`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar regra";
      throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message });
    }
  }),
  update: adminProcedure.input(
    discountRuleInput.extend({
      id: z9.coerce.number()
    })
  ).mutation(async ({ input }) => {
    try {
      const { id, ...data } = input;
      const result = await updateDiscountRule(id, data);
      return {
        success: true,
        data: result,
        message: `Regra de desconto "${input.name}" atualizada!`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar regra";
      throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message });
    }
  }),
  delete: adminProcedure.input(z9.object({
    id: z9.coerce.number(),
    name: z9.string().optional()
  })).mutation(async ({ input }) => {
    try {
      await deleteDiscountRule(input.id);
      return {
        success: true,
        message: input.name ? `Regra "${input.name}" removida.` : "Regra de desconto exclu\xEDda com sucesso."
      };
    } catch {
      throw new TRPCError8({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao excluir a regra de desconto."
      });
    }
  })
});

// server/routers/admin/automation.routes.ts
init_schema();
init_db();
import { sql as sql7 } from "drizzle-orm";
import { TRPCError as TRPCError9 } from "@trpc/server";
import { randomUUID } from "crypto";
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
    const toExpire = await tx.execute(sql7`
      SELECT user_id, SUM(points_change) as total 
      FROM loyalty_history 
      WHERE created_at < ${formattedDate} AND type = 'earned'
      GROUP BY user_id
    `);
    const rows = toExpire[0] || [];
    for (const row of rows) {
      const pointsToLose = Number(row.total);
      if (pointsToLose > 0) {
        await tx.insert(loyaltyHistory).values({
          // ✅ UUID manual para evitar erro 'id doesn't have a default value'
          id: `exp_${randomUUID().slice(0, 8)}_${row.user_id.slice(0, 8)}`,
          userId: row.user_id,
          pointsChange: -pointsToLose,
          reason: "Expira\xE7\xE3o Autom\xE1tica",
          type: "expired",
          createdAt: /* @__PURE__ */ new Date()
        });
        processedCount++;
      }
    }
  });
  return { processedCount };
}
var loyaltyAdminRouter = router({
  runManualExpiration: adminProcedure.mutation(async () => {
    try {
      const result = await runLoyaltyExpirationLogic();
      const message = result.processedCount > 0 ? `Sucesso! Pontos expirados de ${result.processedCount} clientes.` : "Processamento conclu\xEDdo. Nenhum ponto para expirar hoje.";
      return {
        success: true,
        message,
        processedUsers: result.processedCount,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      throw new TRPCError9({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao processar expira\xE7\xE3o: " + errorMessage
      });
    }
  })
});

// server/routers/admin/mail.ts
import { z as z10 } from "zod";
init_mailer();
init_schema();
init_db();
import { eq as eq11 } from "drizzle-orm";
import { TRPCError as TRPCError10 } from "@trpc/server";
var mailAdminRouter = router({
  /**
   * 📥 GET CONFIGS
   */
  getConfigs: adminProcedure.query(async () => {
    const db2 = await getDb();
    const configs = await db2.select().from(appConfigs);
    return configs.filter(
      (c) => c.configKey.startsWith("smtp_") || c.configKey.startsWith("email_")
    );
  }),
  /**
   * 💾 SAVE CONFIGS
   */
  saveConfigs: adminProcedure.input(z10.array(z10.object({
    configKey: z10.string(),
    configValue: z10.string()
  }))).mutation(async ({ input }) => {
    const db2 = await getDb();
    for (const item of input) {
      const [exists] = await db2.select().from(appConfigs).where(eq11(appConfigs.configKey, item.configKey)).limit(1);
      if (exists) {
        await db2.update(appConfigs).set({ configValue: item.configValue }).where(eq11(appConfigs.configKey, item.configKey));
      } else {
        await db2.insert(appConfigs).values({
          configKey: item.configKey,
          configValue: item.configValue
        });
      }
    }
    return {
      success: true,
      message: "Configura\xE7\xF5es de SMTP salvas com sucesso!"
    };
  }),
  /**
   * 🧪 TEST CONNECTION
   */
  testConnection: adminProcedure.input(z10.object({ to: z10.string().email() })).mutation(async ({ input }) => {
    try {
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
      return {
        success: true,
        message: `E-mail de teste enviado para ${input.to}!`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      throw new TRPCError10({
        code: "INTERNAL_SERVER_ERROR",
        message: `Falha no teste SMTP: ${errorMessage}`
      });
    }
  })
});

// server/routers/admin/referral.ts
init_db();
init_schema();
import { z as z11 } from "zod";
import { desc as desc8, sql as sql8 } from "drizzle-orm";
import { nanoid } from "nanoid";
var adminReferralRouter = router({
  // 📝 LISTAR TODOS OS PARCEIROS
  listPartners: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(referrals).orderBy(desc8(referrals.createdAt));
  }),
  // ➕ CRIAR OU ATUALIZAR PARCEIRO
  upsertPartner: adminProcedure.input(z11.object({
    id: z11.string().optional().nullable(),
    code: z11.string().min(3),
    name: z11.string(),
    type: z11.string().default("nutri"),
    commissionRate: z11.string().default("0.00"),
    isActive: z11.boolean().default(true)
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const id = input.id || nanoid();
    const code = input.code.toUpperCase();
    const payload = {
      id,
      code,
      name: input.name,
      type: input.type,
      commissionRate: input.commissionRate,
      isActive: input.isActive
    };
    await db2.insert(referrals).values(payload).onDuplicateKeyUpdate({
      set: {
        name: input.name,
        type: input.type,
        commissionRate: input.commissionRate,
        isActive: input.isActive
      }
    });
    return {
      success: true,
      message: `Parceiro "${input.name}" salvo com sucesso!`
    };
  }),
  // 📊 DASHBOARD: DESEMPENHO DOS PARCEIROS
  getPerformance: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select({
      referralCode: orders.referralCode,
      totalSales: sql8`count(${orders.id})`.mapWith(Number),
      revenue: sql8`sum(${orders.total})`.mapWith(Number)
    }).from(orders).where(sql8`${orders.referralCode} IS NOT NULL`).groupBy(orders.referralCode);
  })
});

// server/routers/admin/finance.ts
import { z as z12 } from "zod";

// server/coupon.ts
init_db();
init_schema();
import { eq as eq12, sql as sql9, desc as desc9 } from "drizzle-orm";
import crypto5 from "crypto";
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
    bannerColor: coupons.bannerColor,
    logoUrl: coupons.logoUrl,
    timesUsed: sql9`count(${couponUsage.id})`
  }).from(coupons).leftJoin(couponUsage, eq12(coupons.id, couponUsage.couponId)).groupBy(coupons.id).orderBy(desc9(coupons.createdAt));
  return results;
}
async function createCoupon(input) {
  const db2 = await getDb();
  await db2.insert(coupons).values({
    id: crypto5.randomUUID(),
    code: input.code.toUpperCase(),
    description: input.description || null,
    discountType: input.discountType,
    discountValue: input.discountValue.toString(),
    minOrderValue: input.minOrderValue ? input.minOrderValue.toString() : null,
    maxDiscount: input.maxDiscount ? input.maxDiscount.toString() : null,
    usageLimit: input.usageLimit || null,
    isActive: input.isActive ?? true,
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    bannerColor: input.bannerColor || "#10b981",
    logoUrl: input.logoUrl || null
  });
  return { success: true };
}
async function updateCoupon(id, data) {
  const db2 = await getDb();
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (data.description !== void 0) updateData.description = data.description;
  if (data.discountType !== void 0) updateData.discountType = data.discountType;
  if (data.discountValue !== void 0) updateData.discountValue = data.discountValue.toString();
  if (data.minOrderValue !== void 0) updateData.minOrderValue = data.minOrderValue?.toString();
  if (data.maxDiscount !== void 0) updateData.maxDiscount = data.maxDiscount?.toString();
  if (data.usageLimit !== void 0) updateData.usageLimit = data.usageLimit;
  if (data.isActive !== void 0) updateData.isActive = data.isActive;
  if (data.validFrom !== void 0) updateData.validFrom = data.validFrom;
  if (data.validUntil !== void 0) updateData.validUntil = data.validUntil;
  if (data.bannerColor !== void 0) updateData.bannerColor = data.bannerColor;
  if (data.logoUrl !== void 0) updateData.logoUrl = data.logoUrl;
  await db2.update(coupons).set(updateData).where(eq12(coupons.id, id));
  return { success: true };
}
async function deleteCoupon(id) {
  const db2 = await getDb();
  await db2.delete(couponUsage).where(eq12(couponUsage.couponId, id));
  await db2.delete(coupons).where(eq12(coupons.id, id));
  return { success: true };
}

// server/admin-payment-methods.ts
init_db();
init_schema();
import { eq as eq13, asc as asc2 } from "drizzle-orm";
import crypto6 from "crypto";
async function listAllPaymentMethods() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  return db2.select().from(paymentMethods).orderBy(asc2(paymentMethods.displayOrder), asc2(paymentMethods.name));
}
async function createPaymentMethod(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const newId = crypto6.randomUUID();
  await db2.insert(paymentMethods).values({
    ...data,
    id: newId
  });
  return { id: newId };
}
async function updatePaymentMethod(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  await db2.update(paymentMethods).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq13(paymentMethods.id, id));
  return { success: true };
}

// server/admin-reports.ts
init_db();
init_schema();
import { eq as eq14, desc as desc10, or as or2, sql as sql10, and as and3, gte as gte2, lte, count as count2 } from "drizzle-orm";
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
    gte2(orders.createdAt, startDate),
    lte(orders.createdAt, endDate)
  );
  const [revenueResult] = await db2.select({
    revenue: sql10`SUM(${orders.total})`,
    count: count2(orders.id)
  }).from(orders).where(
    and3(
      timeFilter,
      or2(
        eq14(orders.status, "delivered"),
        eq14(orders.status, "completed")
      )
    )
  );
  const salesByDay = await db2.select({
    date: sql10`DATE(${orders.createdAt})`,
    sales: sql10`SUM(${orders.total})`
  }).from(orders).where(timeFilter).groupBy(sql10`DATE(${orders.createdAt})`).orderBy(sql10`DATE(${orders.createdAt})`);
  const topProducts = await db2.select({
    name: dishes.name,
    quantity: sql10`SUM(${orderItems.quantity})`
  }).from(orderItems).innerJoin(dishes, eq14(orderItems.dishId, dishes.id)).innerJoin(orders, eq14(orderItems.orderId, orders.id)).where(timeFilter).groupBy(dishes.name).orderBy(sql10`SUM(${orderItems.quantity}) DESC`).limit(5);
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
    gte2(orders.createdAt, startDate),
    lte(orders.createdAt, endDate)
  );
  const results = await db2.select({
    paymentMethod: orders.paymentMethod,
    totalRevenue: sql10`SUM(${orders.total})`,
    totalOrders: count2(orders.id)
  }).from(orders).where(timeFilter).groupBy(orders.paymentMethod).orderBy(desc10(sql10`SUM(${orders.total})`));
  return results;
}

// server/media-library.ts
init_db();
init_schema();
import { eq as eq15, desc as desc11 } from "drizzle-orm";
import crypto7 from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
var UPLOADS_DIR = path.resolve(process.cwd(), "public/uploads");
function generateUniqueWebpFilename() {
  const timestamp24 = Date.now();
  const randomStr = crypto7.randomBytes(4).toString("hex");
  return `${timestamp24}-${randomStr}.webp`;
}
async function uploadImage(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = generateUniqueWebpFilename();
  const filePath = path.join(UPLOADS_DIR, filename);
  const buffer = data.file instanceof Buffer ? data.file : Buffer.from(data.file);
  await sharp(buffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(filePath);
  const fileUrl = `/uploads/${filename}`;
  const newId = crypto7.randomUUID();
  await db2.insert(mediaLibrary).values({
    id: newId,
    url: fileUrl,
    fileName: filename,
    mimeType: "image/webp",
    size: data.fileSize,
    altText: data.altText || "",
    uploadedBy: data.uploadedBy
  });
  const [newItem] = await db2.select().from(mediaLibrary).where(eq15(mediaLibrary.id, newId)).limit(1);
  if (!newItem) throw new Error("Erro ao recuperar item inserido");
  return newItem;
}
async function listMediaLibrary() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  return await db2.select().from(mediaLibrary).orderBy(desc11(mediaLibrary.createdAt));
}

// server/routers/admin/finance.ts
var adminCouponsRouter2 = router({
  list: adminProcedure.query(async () => await listCoupons()),
  create: adminProcedure.input(z12.object({
    code: z12.string().min(1).toUpperCase(),
    description: z12.string().nullish(),
    discountType: z12.enum(["percentage", "fixed"]),
    discount_value: z12.number().positive(),
    minOrderValue: z12.number().nullish(),
    maxDiscount: z12.number().nullish(),
    usageLimit: z12.number().int().nullish(),
    validFrom: z12.coerce.date().nullish(),
    validUntil: z12.coerce.date().nullish(),
    isActive: z12.boolean().optional().default(true)
  })).mutation(async ({ input }) => {
    const { discount_value, ...rest } = input;
    const payload = {
      ...rest,
      discountValue: discount_value
    };
    const result = await createCoupon(payload);
    return {
      success: true,
      data: result,
      message: `Cupom "${input.code}" criado com sucesso!`
    };
  }),
  update: adminProcedure.input(z12.object({
    id: z12.union([z12.string(), z12.number()]),
    code: z12.string().optional(),
    isActive: z12.boolean().optional()
  }).passthrough()).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const stringId = String(id);
    const result = await updateCoupon(stringId, data);
    return {
      success: true,
      data: result,
      message: `Configura\xE7\xF5es do cupom ${input.code || ""} atualizadas!`
    };
  }),
  delete: adminProcedure.input(z12.object({ id: z12.union([z12.string(), z12.number()]), code: z12.string().optional() })).mutation(async ({ input }) => {
    const stringId = String(input.id);
    await deleteCoupon(stringId);
    return {
      success: true,
      message: input.code ? `Cupom "${input.code}" removido.` : "Cupom exclu\xEDdo com sucesso."
    };
  })
});
var adminPaymentMethodsRouter = router({
  listAll: adminProcedure.query(async () => await listAllPaymentMethods()),
  create: adminProcedure.input(z12.object({
    name: z12.string(),
    type: z12.enum(["card", "cash", "meal_card", "pix"])
  }).passthrough()).mutation(async ({ input }) => {
    const result = await createPaymentMethod(input);
    return {
      success: true,
      data: result,
      message: `M\xE9todo de pagamento "${input.name}" adicionado!`
    };
  }),
  update: adminProcedure.input(z12.object({
    id: z12.union([z12.string(), z12.number()]),
    name: z12.string().optional(),
    isActive: z12.boolean().optional()
  }).passthrough()).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const stringId = String(id);
    await updatePaymentMethod(stringId, data);
    return {
      success: true,
      message: `Forma de pagamento "${input.name || ""}" atualizada.`
    };
  })
});
var adminReportsRouter = router({
  getDashboardSummary: adminProcedure.input(z12.object({ timeframe: z12.enum(["day", "week", "month"]) })).query(async ({ input }) => await getDashboardSummary(input.timeframe)),
  getPaymentMethodReport: adminProcedure.input(z12.object({
    startDate: z12.coerce.date(),
    endDate: z12.coerce.date()
  })).query(async ({ input }) => await getPaymentMethodReport(input.startDate, input.endDate))
});
var adminMediaRouter2 = router({
  list: adminProcedure.query(async () => await listMediaLibrary()),
  upload: adminProcedure.input(z12.object({ filename: z12.string(), mimeType: z12.string(), base64Data: z12.string() })).mutation(async ({ input, ctx }) => {
    const fileBuffer = Buffer.from(input.base64Data, "base64");
    const authorId = ctx.user?.id || "system";
    const result = await uploadImage({
      file: fileBuffer,
      originalFilename: input.filename,
      mimeType: input.mimeType,
      uploadedBy: authorId,
      fileSize: fileBuffer.length
    });
    return {
      success: true,
      data: result,
      message: `Upload de "${input.filename}" conclu\xEDdo!`
    };
  })
});
var adminFinanceRouter = router({
  coupons: adminCouponsRouter2,
  payments: adminPaymentMethodsRouter,
  reports: adminReportsRouter,
  media: adminMediaRouter2
});

// server/routers/admin/payment-methods.ts
import { z as z13 } from "zod";
init_db();
init_schema();
import { eq as eq16, asc as asc3 } from "drizzle-orm";
var adminPaymentMethodsRouter2 = router({
  // --- LISTAGEM ---
  listAll: adminProcedure.query(async () => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database not available");
    return await db2.select().from(paymentMethods).orderBy(asc3(paymentMethods.name));
  }),
  /**
   * ✅ CRIAÇÃO
   */
  create: adminProcedure.input(z13.object({
    name: z13.string().min(1),
    isActive: z13.boolean().optional().default(true),
    brand_name: z13.string().optional().nullable(),
    brand_logo_url: z13.string().optional().nullable(),
    description: z13.string().optional().nullable(),
    icon: z13.string().optional().nullable(),
    discount_percentage: z13.coerce.number().optional().default(0)
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const payload = {
      name: input.name,
      isActive: input.isActive,
      brandName: input.brand_name,
      brandLogoUrl: input.brand_logo_url,
      description: input.description,
      icon: input.icon,
      discountPercentage: String(input.discount_percentage),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const [res] = await db2.insert(paymentMethods).values(payload);
    return {
      success: true,
      id: res.insertId,
      message: `M\xE9todo "${input.name}" cadastrado!`
    };
  }),
  /**
   * ✅ ATUALIZAÇÃO
   */
  update: adminProcedure.input(z13.object({
    id: z13.coerce.number(),
    name: z13.string().optional().nullable(),
    description: z13.string().optional().nullable(),
    brandName: z13.string().optional().nullable(),
    brand_name: z13.string().optional().nullable(),
    brandLogoUrl: z13.string().optional().nullable(),
    brand_logo_url: z13.string().optional().nullable(),
    icon: z13.string().optional().nullable(),
    discountPercentage: z13.coerce.number().optional().nullable(),
    discount_percentage: z13.coerce.number().optional().nullable(),
    isActive: z13.boolean().optional().nullable()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const updateData = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (input.name !== void 0) updateData.name = input.name;
    if (input.description !== void 0) updateData.description = input.description;
    const brandName = input.brandName ?? input.brand_name;
    if (brandName !== void 0) updateData.brandName = brandName;
    const brandLogo = input.brandLogoUrl ?? input.brand_logo_url;
    if (brandLogo !== void 0) updateData.brandLogoUrl = brandLogo;
    if (input.icon !== void 0) updateData.icon = input.icon;
    const discount = input.discountPercentage ?? input.discount_percentage;
    if (discount !== void 0) updateData.discountPercentage = String(discount);
    if (input.isActive !== void 0) updateData.isActive = input.isActive;
    await db2.update(paymentMethods).set(updateData).where(eq16(paymentMethods.id, String(input.id)));
    return {
      success: true,
      message: "M\xE9todo atualizado com sucesso!"
    };
  }),
  /**
   * ✅ EXCLUSÃO
   */
  delete: adminProcedure.input(z13.object({ id: z13.coerce.number(), name: z13.string().optional() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.delete(paymentMethods).where(eq16(paymentMethods.id, String(input.id)));
    return {
      success: true,
      message: input.name ? `"${input.name}" removido.` : "Exclu\xEDdo com sucesso."
    };
  })
});

// server/routers/admin/ingredients.ts
init_db();
init_schema();
import { z as z14 } from "zod";
import { TRPCError as TRPCError11 } from "@trpc/server";
import { eq as eq17, and as and4, asc as asc4, like as like2, sql as sql11 } from "drizzle-orm";
var toDecimal = (val, precision = 2) => {
  if (val === void 0 || val === null || val === "") return "0.00";
  const num = typeof val === "string" ? parseFloat(val.replace(",", ".")) : Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(precision);
};
var ingredientSchema = z14.object({
  id: z14.number().optional(),
  name: z14.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  category: z14.string().optional().default("Geral"),
  unit: z14.string().optional().default("g"),
  yieldFactor: z14.coerce.number().default(1),
  energyKcal: z14.coerce.number().default(0),
  energyKj: z14.coerce.number().default(0),
  proteins: z14.coerce.number().default(0),
  carbs: z14.coerce.number().default(0),
  addedSugars: z14.coerce.number().default(0),
  fatTotal: z14.coerce.number().default(0),
  fatSaturated: z14.coerce.number().default(0),
  fatTrans: z14.coerce.number().default(0),
  fiber: z14.coerce.number().default(0),
  sodium: z14.coerce.number().default(0),
  calcium: z14.coerce.number().default(0),
  iron: z14.coerce.number().default(0)
});
var ingredientsRouter = router({
  /**
   * 1. LISTAGEM
   */
  list: adminProcedure.input(z14.object({ search: z14.string().optional() }).optional()).query(async ({ input }) => {
    const db2 = await getDb();
    return await db2.select({
      id: ingredients.id,
      name: ingredients.name,
      unit: ingredients.unit,
      category: ingredients.category,
      yieldFactor: nutritionFacts.yieldFactor,
      energyKcal: nutritionFacts.energyKcal,
      energyKj: nutritionFacts.energyKj,
      proteins: nutritionFacts.proteins,
      carbs: nutritionFacts.carbs,
      addedSugars: nutritionFacts.addedSugars,
      fatTotal: nutritionFacts.fatTotal,
      fatSaturated: nutritionFacts.fatSaturated,
      fatTrans: nutritionFacts.fatTrans,
      fiber: nutritionFacts.fiber,
      sodium: nutritionFacts.sodium,
      calcium: nutritionFacts.calcium,
      iron: nutritionFacts.iron
    }).from(ingredients).leftJoin(
      nutritionFacts,
      and4(eq17(nutritionFacts.ingredientId, ingredients.id), eq17(nutritionFacts.entityType, "BASE"))
    ).where(input?.search ? like2(ingredients.name, `%${input.search}%`) : void 0).orderBy(asc4(ingredients.name));
  }),
  /**
   * 2. SALVAR (CREATE / UPDATE)
   */
  create: adminProcedure.input(ingredientSchema).mutation(async ({ input }) => {
    const db2 = await getDb();
    return await db2.transaction(async (tx) => {
      let ingId = input.id;
      const payloadIngredients = {
        name: input.name,
        category: input.category,
        unit: input.unit
      };
      if (ingId) {
        await tx.update(ingredients).set(payloadIngredients).where(eq17(ingredients.id, ingId));
      } else {
        const [res] = await tx.insert(ingredients).values(payloadIngredients);
        ingId = res.insertId;
      }
      await tx.delete(nutritionFacts).where(
        and4(eq17(nutritionFacts.ingredientId, ingId), eq17(nutritionFacts.entityType, "BASE"))
      );
      const nutritionData = {
        ingredientId: ingId,
        entityType: "BASE",
        energyKcal: toDecimal(input.energyKcal),
        energyKj: toDecimal(input.energyKj),
        yieldFactor: toDecimal(input.yieldFactor),
        proteins: toDecimal(input.proteins, 3),
        carbs: toDecimal(input.carbs, 3),
        fatTotal: toDecimal(input.fatTotal, 3),
        fatSaturated: toDecimal(input.fatSaturated, 3),
        fatTrans: toDecimal(input.fatTrans, 3),
        fiber: toDecimal(input.fiber, 3),
        sodium: toDecimal(input.sodium),
        addedSugars: toDecimal(input.addedSugars),
        calcium: toDecimal(input.calcium),
        iron: toDecimal(input.iron)
      };
      await tx.insert(nutritionFacts).values(nutritionData);
      const action = input.id ? "atualizado" : "cadastrado";
      return {
        success: true,
        id: ingId,
        message: `Insumo "${input.name}" ${action} com sucesso!`
      };
    });
  }),
  /**
   * 3. BUSCA EXTERNA (OpenFoodFacts)
   */
  searchExternal: adminProcedure.input(z14.object({ name: z14.string() })).query(async ({ input }) => {
    try {
      let searchTerm = input.name;
      if (searchTerm.includes("fatsecret.com.br")) {
        const parts = decodeURIComponent(searchTerm).split("/").filter(Boolean);
        const slug = parts[parts.length - 2] === "100g" ? parts[parts.length - 3] : parts[parts.length - 1];
        searchTerm = slug.replace(/-/g, " ");
      }
      const isBarcode = /^\d+$/.test(searchTerm);
      const url = isBarcode ? `https://br.openfoodfacts.org/api/v0/product/${searchTerm}.json` : `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&action=process&json=1&page_size=24`;
      const response = await fetch(url);
      const data = await response.json();
      const products = isBarcode ? data.product ? [data.product] : [] : data.products || [];
      return products.map((p) => ({
        name: p.product_name || searchTerm,
        brand: p.brands || "Marca Externa",
        image: p.image_thumb_url || null,
        energyKcal: toDecimal(p.nutriments?.["energy-kcal_100g"] || 0),
        energyKj: toDecimal(p.nutriments?.["energy-kj_100g"] || 0),
        proteins: toDecimal(p.nutriments?.proteins_100g || 0, 3),
        carbs: toDecimal(p.nutriments?.carbohydrates_100g || 0, 3),
        fatTotal: toDecimal(p.nutriments?.fat_100g || 0, 3),
        fatSaturated: toDecimal(p.nutriments?.["saturated-fat_100g"] || 0, 3),
        fiber: toDecimal(p.nutriments?.fiber_100g || 0, 3),
        sodium: toDecimal(Number(p.nutriments?.sodium_100g || 0) * 1e3, 2),
        calcium: toDecimal(p.nutriments?.calcium_100g || 0),
        iron: toDecimal(p.nutriments?.iron_100g || 0)
      }));
    } catch {
      return [];
    }
  }),
  /**
   * 4. EXCLUSÃO
   */
  delete: adminProcedure.input(z14.object({ id: z14.number(), name: z14.string().optional() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const [usage] = await db2.select({ count: sql11`count(*)` }).from(dishComposition).where(eq17(dishComposition.ingredientId, input.id));
    if (Number(usage?.count || 0) > 0) {
      throw new TRPCError11({
        code: "CONFLICT",
        message: `Insumo em uso: Este item est\xE1 vinculado a uma ou mais fichas t\xE9cnicas.`
      });
    }
    await db2.transaction(async (tx) => {
      await tx.delete(nutritionFacts).where(eq17(nutritionFacts.ingredientId, input.id));
      await tx.delete(ingredients).where(eq17(ingredients.id, input.id));
    });
    return {
      success: true,
      message: input.name ? `Insumo "${input.name}" removido.` : "Insumo removido com sucesso."
    };
  })
});

// server/routers/admin/dishComposition.ts
init_db();
init_schema();
import { z as z15 } from "zod";
import { eq as eq18 } from "drizzle-orm";
import { TRPCError as TRPCError12 } from "@trpc/server";
var dishCompositionRouter = router({
  /**
   * ✅ BUSCA A COMPOSIÇÃO
   */
  getComposition: adminProcedure.input(z15.object({
    dishId: z15.number().optional(),
    accompanimentOptionId: z15.number().optional()
  })).query(async ({ input }) => {
    const db2 = await getDb();
    if (!input.dishId && !input.accompanimentOptionId) {
      throw new TRPCError12({
        code: "BAD_REQUEST",
        message: "\xC9 necess\xE1rio informar dishId ou accompanimentOptionId."
      });
    }
    const whereClause = input.dishId ? eq18(dishComposition.dishId, input.dishId) : eq18(dishComposition.accompanimentOptionId, input.accompanimentOptionId);
    return await db2.select().from(dishComposition).where(whereClause);
  }),
  /**
   * ✅ SALVA A COMPOSIÇÃO
   */
  save: adminProcedure.input(z15.object({
    dishId: z15.number().optional(),
    accompanimentOptionId: z15.number().optional(),
    items: z15.array(z15.object({
      ingredientId: z15.number(),
      quantity: z15.number().or(z15.string()),
      ingredientName: z15.string().optional(),
      energyKcal: z15.number().or(z15.string()).optional(),
      proteins: z15.number().or(z15.string()).optional(),
      carbs: z15.number().or(z15.string()).optional(),
      fatTotal: z15.number().or(z15.string()).optional(),
      sodium: z15.number().or(z15.string()).optional()
    }).passthrough())
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "Database offline" });
    return await db2.transaction(async (tx) => {
      if (input.dishId) {
        await tx.delete(dishComposition).where(eq18(dishComposition.dishId, input.dishId));
      } else if (input.accompanimentOptionId) {
        await tx.delete(dishComposition).where(eq18(dishComposition.accompanimentOptionId, input.accompanimentOptionId));
      }
      if (input.items.length === 0) {
        return {
          success: true,
          message: "Ficha t\xE9cnica removida com sucesso."
        };
      }
      const totals = { kcal: 0, pro: 0, carb: 0, fat: 0, fib: 0, sod: 0 };
      const inserts = [];
      for (const item of input.items) {
        const details = item;
        const qty = Number(item.quantity);
        const rowKcal = Number(item.energyKcal || 0);
        const rowPro = Number(item.proteins || 0);
        const rowCarb = Number(item.carbs || 0);
        const rowFat = Number(item.fatTotal || 0);
        const rowSod = Number(item.sodium || 0);
        const rowFib = Number(details.fiber || 0);
        if (input.dishId) {
          totals.kcal += rowKcal;
          totals.pro += rowPro;
          totals.carb += rowCarb;
          totals.fat += rowFat;
          totals.fib += rowFib;
          totals.sod += rowSod;
        }
        inserts.push({
          dishId: input.dishId || null,
          accompanimentOptionId: input.accompanimentOptionId || null,
          ingredientId: item.ingredientId,
          ingredientName: item.ingredientName || "Item",
          quantity: String(qty),
          energyKcal: String(rowKcal.toFixed(2)),
          proteins: String(rowPro.toFixed(3)),
          carbs: String(rowCarb.toFixed(3)),
          fatTotal: String(rowFat.toFixed(3)),
          sodium: String(rowSod.toFixed(2)),
          fiber: String(rowFib.toFixed(3)),
          fatSaturated: String(Number(details.fatSaturated || 0).toFixed(3)),
          // ✅ Resolvido
          fatTrans: String(Number(details.fatTrans || 0).toFixed(3)),
          // ✅ Resolvido
          calcium: String(Number(details.calcium || 0).toFixed(2)),
          // ✅ Resolvido
          iron: String(Number(details.iron || 0).toFixed(2))
          // ✅ Resolvido
        });
      }
      if (inserts.length > 0) {
        await tx.insert(dishComposition).values(inserts);
      }
      if (input.dishId) {
        await tx.update(dishes).set({
          energyKcal: String(totals.kcal.toFixed(2)),
          proteins: String(totals.pro.toFixed(2)),
          carbs: String(totals.carb.toFixed(2)),
          fatTotal: String(totals.fat.toFixed(2)),
          fiber: String(totals.fib.toFixed(2)),
          sodium: String(totals.sod.toFixed(2)),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq18(dishes.id, input.dishId));
      }
      const target = input.dishId ? "do prato" : "do acompanhamento";
      return {
        success: true,
        message: `Ficha t\xE9cnica salva! Valores nutricionais ${target} atualizados.`
      };
    });
  })
});

// server/routers/admin/dishes.ts
import { z as z16 } from "zod";
import { TRPCError as TRPCError14 } from "@trpc/server";

// server/admin-dishes/logic/admin-dishes-queries.ts
init_db();
import { and as and5, asc as asc5, count as count3, desc as desc12, eq as eq19, like as like3, sql as sql12 } from "drizzle-orm";

// server/admin-dishes/logic/admin-dishes-types.ts
function mapDishRowToAdmin(row) {
  if (!row) return {};
  const toDec = (val) => {
    if (val === null || val === void 0 || val === "") return "0.00";
    return safeNumber(val).toFixed(2);
  };
  return {
    ...row,
    id: safeNumber(row.id),
    price: safeNumber(row.price),
    salePrice: row.salePrice ? safeNumber(row.salePrice) : null,
    categoryId: row.categoryId ? safeNumber(row.categoryId) : null,
    isActive: row.isActive === 1 || row.isActive === true || String(row.isActive) === "true",
    categoryName: row.categoryName ?? "Sem Categoria",
    energyKcal: safeNumber(row.energyKcal ?? row.energy_kcal ?? row.calories),
    energyKj: safeNumber(row.energyKj ?? row.energy_kj),
    proteins: toDec(row.proteins ?? row.protein),
    carbs: toDec(row.carbs ?? row.carbohydrates),
    fatTotal: toDec(row.fatTotal ?? row.fat_total ?? row.fats),
    fatSaturated: toDec(row.fatSaturated ?? row.fat_saturated),
    fatTrans: toDec(row.fatTrans ?? row.fat_trans),
    fiber: toDec(row.fiber ?? row.fiber_alimentar),
    sodium: toDec(row.sodium ?? row.sodio),
    showNutrition: Boolean(row.showNutrition),
    isVegetarian: Boolean(row.isVegetarian),
    isGlutenFree: Boolean(row.isGlutenFree),
    isLactoseFree: Boolean(row.isLactoseFree)
  };
}
function generateSlug(name) {
  const base = name || "dish";
  const cleanName = base.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
  return `${cleanName}-${Math.random().toString(36).substring(2, 5)}`;
}

// server/admin-dishes/logic/admin-dishes-queries.ts
init_schema();
async function getLocalCategories() {
  const db2 = await getDb();
  return await db2.select().from(categories).orderBy(asc5(categories.displayOrder));
}
async function searchIngredients(query) {
  const db2 = await getDb();
  if (!query || query.length < 2) return [];
  try {
    const results = await db2.select({
      id: ingredients.id,
      name: ingredients.name,
      category: ingredients.category,
      unit: ingredients.unit,
      yieldFactor: sql12`ingredients.yield_factor`,
      energyKcal: nutritionFacts.energyKcal,
      energyKj: nutritionFacts.energyKj,
      proteins: nutritionFacts.proteins,
      carbs: nutritionFacts.carbs,
      fatTotal: nutritionFacts.fatTotal,
      sodium: nutritionFacts.sodium
    }).from(ingredients).leftJoin(
      nutritionFacts,
      and5(
        eq19(nutritionFacts.ingredientId, ingredients.id),
        eq19(nutritionFacts.entityType, "BASE")
      )
    ).where(like3(ingredients.name, `%${query}%`)).limit(15);
    return results.map((ing) => ({
      ...ing,
      yieldFactor: Number(ing.yieldFactor || 1),
      energyKcal: Number(ing.energyKcal || 0),
      energyKj: Number(ing.energyKj || 0),
      proteins: Number(ing.proteins || 0),
      carbs: Number(ing.carbs || 0),
      fatTotal: Number(ing.fatTotal || 0),
      sodium: Number(ing.sodium || 0)
    }));
  } catch {
    return [];
  }
}
async function getDishById(id) {
  const db2 = await getDb();
  const dishId = Number(id);
  try {
    const rows = await db2.select({
      id: dishes.id,
      name: dishes.name,
      slug: dishes.slug,
      description: dishes.description,
      imageUrl: dishes.imageUrl,
      price: dishes.basePrice,
      salePrice: dishes.salePrice,
      categoryId: dishes.categoryId,
      isActive: dishes.isActive,
      ingredients: dishes.ingredients,
      show_nutrition: dishes.showNutrition,
      isVegetarian: sql12`COALESCE(dishes.is_vegetarian, 0)`,
      isGlutenFree: sql12`COALESCE(dishes.is_gluten_free, 0)`,
      isLactoseFree: sql12`COALESCE(dishes.is_lactose_free, 0)`,
      categoryName: categories.name
    }).from(dishes).leftJoin(categories, eq19(dishes.categoryId, categories.id)).where(eq19(dishes.id, dishId)).limit(1);
    const row = rows[0];
    if (!row) return null;
    const mappedBase = mapDishRowToAdmin(row) || {};
    const nutrition = await db2.select().from(nutritionFacts).where(and5(eq19(nutritionFacts.dishId, dishId), eq19(nutritionFacts.entityType, "TOTAL"))).limit(1);
    const compositionItems = await db2.select().from(dishComposition).where(eq19(dishComposition.dishId, dishId));
    const enrichedComposition = await Promise.all((compositionItems || []).map(async (item) => {
      if (item.ingredientId) {
        const [data] = await db2.select({
          name: ingredients.name,
          yieldFactor: sql12`ingredients.yield_factor`,
          energyKcal: nutritionFacts.energyKcal,
          energyKj: nutritionFacts.energyKj,
          proteins: nutritionFacts.proteins,
          carbs: nutritionFacts.carbs,
          fatTotal: nutritionFacts.fatTotal,
          fiber: nutritionFacts.fiber,
          sodium: nutritionFacts.sodium
        }).from(ingredients).leftJoin(
          nutritionFacts,
          and5(
            eq19(nutritionFacts.ingredientId, ingredients.id),
            eq19(nutritionFacts.entityType, "BASE")
          )
        ).where(eq19(ingredients.id, item.ingredientId)).limit(1);
        return {
          ...item,
          ingredientName: data?.name || item.ingredientName || "Item desconhecido",
          yieldFactor: Number(data?.yieldFactor || 1),
          energyKcal: Number(data?.energyKcal || 0),
          energyKj: Number(data?.energyKj || 0),
          proteins: Number(data?.proteins || 0),
          carbs: Number(data?.carbs || 0),
          fatTotal: Number(data?.fatTotal || 0),
          fiber: Number(data?.fiber || 0),
          sodium: Number(data?.sodium || 0)
        };
      }
      return item;
    }));
    const rawSizes = await db2.select({
      id: dishSizes.id,
      name: dishSizes.name,
      priceModifier: dishSizes.priceModifier,
      isActive: dishSizes.isActive
    }).from(dishSizes).innerJoin(dishesToSizes, eq19(dishSizes.id, dishesToSizes.sizeId)).where(eq19(dishesToSizes.dishId, dishId));
    return {
      ...mappedBase,
      energyKcal: Number(nutrition[0]?.energyKcal || 0),
      energyKj: Number(nutrition[0]?.energyKj || 0),
      proteins: Number(nutrition[0]?.proteins || 0),
      carbs: Number(nutrition[0]?.carbs || 0),
      fatTotal: Number(nutrition[0]?.fatTotal || 0),
      fiber: Number(nutrition[0]?.fiber || 0),
      sodium: Number(nutrition[0]?.sodium || 0),
      sizes: rawSizes || [],
      composition: enrichedComposition.map((c) => ({
        ...c,
        name: c.ingredientName || "Sem nome",
        quantity: Number(c.quantity || 0)
      }))
    };
  } catch (error) {
    throw new Error(`Erro ao carregar prato: ${error instanceof Error ? error.message : "Desconhecido"}`);
  }
}
async function getPaginatedDishes(params) {
  const db2 = await getDb();
  const offset = (params.page - 1) * params.limit;
  const conditions = [];
  if (params.search) conditions.push(like3(dishes.name, `%${params.search}%`));
  if (params.categoryId) conditions.push(eq19(dishes.categoryId, params.categoryId));
  if (!params.showInactive) conditions.push(eq19(dishes.isActive, true));
  const whereExpr = conditions.length ? and5(...conditions) : void 0;
  const [totalResult] = await db2.select({ value: count3() }).from(dishes).where(whereExpr);
  const rows = await db2.select({
    id: dishes.id,
    name: dishes.name,
    price: dishes.basePrice,
    salePrice: dishes.salePrice,
    categoryId: dishes.categoryId,
    isActive: dishes.isActive,
    imageUrl: dishes.imageUrl,
    categoryName: categories.name,
    // Preenchimento de campos obrigatórios da interface para evitar bugs no map
    slug: sql12`''`,
    description: sql12`''`,
    ingredients: sql12`''`,
    show_nutrition: sql12`false`,
    isVegetarian: sql12`0`,
    isGlutenFree: sql12`0`,
    isLactoseFree: sql12`0`
  }).from(dishes).leftJoin(categories, eq19(dishes.categoryId, categories.id)).where(whereExpr).orderBy(desc12(dishes.id)).limit(params.limit).offset(offset);
  const dataWithSizes = await Promise.all(rows.map(async (row) => {
    const linkedSizes = await db2.select({ id: dishSizes.id }).from(dishesToSizes).innerJoin(dishSizes, eq19(dishesToSizes.sizeId, dishSizes.id)).where(eq19(dishesToSizes.dishId, row.id));
    const mapped = mapDishRowToAdmin(row) || {};
    return { ...mapped, sizes: linkedSizes };
  }));
  return { data: dataWithSizes, total: Number(totalResult?.value ?? 0) };
}
async function listAllSizes() {
  const db2 = await getDb();
  return await db2.select({
    id: dishSizes.id,
    name: dishSizes.name,
    price: dishSizes.price,
    priceModifier: dishSizes.priceModifier,
    mainDishWeight: dishSizes.mainDishWeight,
    displayOrder: dishSizes.displayOrder,
    isActive: dishSizes.isActive,
    iconKey: dishSizes.iconKey,
    color: dishSizes.color,
    description: dishSizes.description,
    groupsOrder: dishSizes.groupsOrder,
    weight: dishSizes.weight
  }).from(dishSizes).where(eq19(dishSizes.isActive, true)).orderBy(asc5(dishSizes.name));
}

// server/admin-dishes/logic/admin-dishes-mutations.ts
init_db();
init_schema();
import { and as and6, eq as eq20 } from "drizzle-orm";
import { TRPCError as TRPCError13 } from "@trpc/server";
var toDecimal2 = (val, precision = 2) => {
  if (val === void 0 || val === null || val === "") return "0.00";
  const normalized = typeof val === "string" ? val.replace(",", ".") : val;
  const num = safeNumber(normalized, Number.NaN);
  return Number.isFinite(num) ? num.toFixed(precision) : "0.00";
};
var getSafeId = (item) => {
  if (!item) return null;
  const id = item.ingredientId || item.id || item.originalId;
  const num = safeInteger(id, 0);
  return num === 0 ? null : num;
};
function requireIntegerId(value, label) {
  const id = safeInteger(value, Number.NaN);
  if (!Number.isFinite(id) || id <= 0) {
    throw new TRPCError13({ code: "BAD_REQUEST", message: `${label} inv\xC3\xA1lido.` });
  }
  return id;
}
function requirePrice(value, label) {
  const normalized = typeof value === "string" ? value.replace(",", ".") : value;
  const price = safeNumber(normalized, Number.NaN);
  if (!Number.isFinite(price) || price < 0) {
    throw new TRPCError13({ code: "BAD_REQUEST", message: `${label} inv\xC3\xA1lido.` });
  }
  return price.toFixed(2);
}
async function createDish(data) {
  const db2 = await getDb();
  const slug = data.slug || generateSlug(data.name);
  const [result] = await db2.insert(dishes).values({
    name: data.name || "Novo Prato",
    slug,
    description: data.description || null,
    imageUrl: data.imageUrl || null,
    basePrice: requirePrice(data.price, "Pre\xC3\xA7o"),
    salePrice: data.salePrice ? requirePrice(data.salePrice, "Pre\xC3\xA7o promocional") : null,
    categoryId: data.categoryId ? requireIntegerId(data.categoryId, "Categoria") : null,
    isActive: data.isActive ?? true,
    showNutrition: data.show_nutrition ?? data.showNutrition ?? false,
    isVegetarian: data.isVegetarian ?? false,
    isGlutenFree: data.isGlutenFree ?? false,
    isLactoseFree: data.isLactoseFree ?? false,
    ingredients: data.ingredients || null,
    // Snapshot Nutricional (Colunas Individuais)
    energyKcal: toDecimal2(data.energyKcal),
    energyKj: toDecimal2(data.energyKj),
    proteins: toDecimal2(data.proteins),
    carbs: toDecimal2(data.carbs),
    fatTotal: toDecimal2(data.fatTotal),
    fatSaturated: toDecimal2(data.fatSaturated, 3),
    fatTrans: toDecimal2(data.fatTrans, 3),
    fiber: toDecimal2(data.fiber),
    sodium: toDecimal2(data.sodium),
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
    // nutritionalInfo é deixado como null/default
  });
  return { success: true, id: result.insertId };
}
async function updateDish(id, data) {
  const db2 = await getDb();
  const dishId = requireIntegerId(id, "Prato");
  return await db2.transaction(async (tx) => {
    const dishPayload = {
      name: data.name,
      slug: data.slug || generateSlug(data.name),
      description: data.description,
      imageUrl: data.imageUrl,
      ingredients: data.ingredients,
      basePrice: requirePrice(data.price, "Pre\xC3\xA7o"),
      salePrice: data.salePrice ? requirePrice(data.salePrice, "Pre\xC3\xA7o promocional") : null,
      categoryId: data.categoryId ? requireIntegerId(data.categoryId, "Categoria") : null,
      isActive: data.isActive ?? true,
      showNutrition: data.show_nutrition ?? data.showNutrition ?? false,
      isVegetarian: data.isVegetarian ?? false,
      isGlutenFree: data.isGlutenFree ?? false,
      isLactoseFree: data.isLactoseFree ?? false,
      // ✅ ATUALIZAÇÃO DAS COLUNAS (FONTE DA VERDADE)
      energyKcal: toDecimal2(data.energyKcal),
      energyKj: toDecimal2(data.energyKj),
      proteins: toDecimal2(data.proteins),
      carbs: toDecimal2(data.carbs),
      fatTotal: toDecimal2(data.fatTotal),
      fatSaturated: toDecimal2(data.fatSaturated, 3),
      fatTrans: toDecimal2(data.fatTrans, 3),
      fiber: toDecimal2(data.fiber),
      sodium: toDecimal2(data.sodium),
      calcium: toDecimal2(data.calcium),
      iron: toDecimal2(data.iron),
      yieldFactor: toDecimal2(data.yieldFactor || 1),
      // ⚰️ MATANDO O LEGADO
      // Definimos como null para forçar o uso das colunas individuais no sistema
      nutritionalInfo: null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await tx.update(dishes).set(dishPayload).where(eq20(dishes.id, dishId));
    if (data.composition && Array.isArray(data.composition)) {
      await tx.delete(dishComposition).where(eq20(dishComposition.dishId, dishId));
      await tx.delete(nutritionFacts).where(
        and6(eq20(nutritionFacts.dishId, dishId), eq20(nutritionFacts.entityType, "TOTAL"))
      );
      for (const item of data.composition) {
        const safeIngId = getSafeId(item);
        if (!safeIngId) continue;
        const [compRes] = await tx.insert(dishComposition).values({
          dishId,
          ingredientId: safeIngId,
          ingredientName: item.ingredientName || item.name || "Ingrediente",
          quantity: toDecimal2(item.quantity, 3)
        });
        await tx.insert(nutritionFacts).values({
          compositionId: compRes.insertId,
          entityType: "SNAPSHOT",
          energyKcal: toDecimal2(item.energyKcal),
          proteins: toDecimal2(item.proteins, 3),
          carbs: toDecimal2(item.carbs, 3),
          fatTotal: toDecimal2(item.fatTotal, 3)
        });
      }
      await tx.insert(nutritionFacts).values({
        dishId,
        entityType: "TOTAL",
        energyKcal: toDecimal2(data.energyKcal),
        energyKj: toDecimal2(data.energyKj),
        proteins: toDecimal2(data.proteins, 3),
        carbs: toDecimal2(data.carbs, 3),
        fatTotal: toDecimal2(data.fatTotal, 3),
        fatSaturated: toDecimal2(data.fatSaturated, 3),
        fatTrans: toDecimal2(data.fatTrans, 3),
        fiber: toDecimal2(data.fiber, 3),
        sodium: toDecimal2(data.sodium),
        calcium: toDecimal2(data.calcium),
        iron: toDecimal2(data.iron)
      });
    }
    return { success: true };
  });
}
async function deleteDish(id) {
  const db2 = await getDb();
  const dishId = requireIntegerId(id, "Prato");
  return await db2.transaction(async (tx) => {
    await tx.delete(nutritionFacts).where(eq20(nutritionFacts.dishId, dishId));
    await tx.delete(dishComposition).where(eq20(dishComposition.dishId, dishId));
    await tx.delete(dishesToSizes).where(eq20(dishesToSizes.dishId, dishId));
    await tx.delete(dishes).where(eq20(dishes.id, dishId));
    return { success: true };
  });
}
async function toggleSizeLink(dishId, sizeId) {
  const db2 = await getDb();
  const dId = requireIntegerId(dishId, "Prato");
  const sId = requireIntegerId(sizeId, "Tamanho");
  const existing = await db2.select().from(dishesToSizes).where(and6(eq20(dishesToSizes.dishId, dId), eq20(dishesToSizes.sizeId, sId))).limit(1);
  if (existing.length > 0) {
    await db2.delete(dishesToSizes).where(and6(eq20(dishesToSizes.dishId, dId), eq20(dishesToSizes.sizeId, sId)));
    return { success: true, isLinked: false };
  } else {
    await db2.insert(dishesToSizes).values({ dishId: dId, sizeId: sId });
    return { success: true, isLinked: true };
  }
}

// server/routers/admin/dishes.ts
init_db();
init_schema();
import { eq as eq21 } from "drizzle-orm";
var adminDishesRouter = router({
  listCategories: adminProcedure.query(async () => {
    return await getLocalCategories();
  }),
  listSizes: adminProcedure.query(async () => {
    return await listAllSizes();
  }),
  list: adminProcedure.input(z16.object({
    page: z16.number().default(1),
    perPage: z16.number().default(10),
    search: z16.string().optional(),
    categoryId: z16.number().optional(),
    showInactive: z16.boolean().optional()
  })).query(async ({ input }) => {
    return await getPaginatedDishes({
      page: input.page,
      limit: input.perPage,
      search: input.search,
      categoryId: input.categoryId,
      showInactive: input.showInactive
    });
  }),
  getById: adminProcedure.input(z16.number()).query(async ({ input }) => {
    const dish = await getDishById(input);
    if (!dish) {
      throw new TRPCError14({
        code: "NOT_FOUND",
        message: "Prato n\xE3o encontrado."
      });
    }
    return dish;
  }),
  searchIngredients: adminProcedure.input(z16.object({
    query: z16.string()
  })).query(async ({ input }) => {
    return await searchIngredients(input.query);
  }),
  toggleActive: adminProcedure.input(z16.object({
    id: z16.number(),
    name: z16.string().optional(),
    isActive: z16.boolean()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.update(dishes).set({ isActive: input.isActive }).where(eq21(dishes.id, input.id));
    return {
      success: true,
      message: input.isActive ? `Prato "${input.name || "item"}" ativado para venda!` : `Prato "${input.name || "item"}" pausado no card\xE1pio.`
    };
  }),
  /**
   * ✅ CRIAÇÃO (Sem 'any')
   */
  create: adminProcedure.input(z16.object({
    name: z16.string().min(1, "Nome \xE9 obrigat\xF3rio"),
    categoryId: z16.number().optional(),
    imageUrl: z16.string().optional(),
    price: z16.number().default(0),
    energyKj: z16.any().optional(),
    energyKcal: z16.any().optional(),
    proteins: z16.any().optional(),
    carbs: z16.any().optional(),
    fatTotal: z16.any().optional(),
    composition: z16.array(z16.any()).optional()
  }).passthrough()).mutation(async ({ input }) => {
    const result = await createDish(input);
    return {
      success: true,
      data: result,
      message: `Prato "${input.name}" cadastrado com sucesso!`
    };
  }),
  /**
   * ✅ ATUALIZAÇÃO (Sem 'any')
   */
  update: adminProcedure.input(z16.object({
    id: z16.number(),
    name: z16.string().optional(),
    price: z16.number().optional(),
    imageUrl: z16.string().optional(),
    categoryId: z16.number().optional(),
    energyKj: z16.any().optional(),
    energyKcal: z16.any().optional(),
    proteins: z16.any().optional(),
    carbs: z16.any().optional(),
    fatTotal: z16.any().optional()
  }).passthrough()).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const result = await updateDish(id, data);
    return {
      success: true,
      data: result,
      message: `Altera\xE7\xF5es em "${input.name || "Prato"}" salvas!`
    };
  }),
  delete: adminProcedure.input(z16.union([
    z16.number(),
    z16.object({ id: z16.number(), name: z16.string().optional() })
  ])).mutation(async ({ input }) => {
    const id = typeof input === "number" ? input : input.id;
    const name = typeof input === "object" ? input.name : null;
    await deleteDish(id);
    return {
      success: true,
      message: name ? `Prato "${name}" removido permanentemente.` : "Prato removido com sucesso."
    };
  }),
  toggleSizeLink: adminProcedure.input(z16.object({ dishId: z16.number(), sizeId: z16.number() })).mutation(async ({ input }) => {
    await toggleSizeLink(input.dishId, input.sizeId);
    return {
      success: true,
      message: "Disponibilidade de tamanho atualizada para este prato."
    };
  })
});

// server/routers/admin/categories.ts
init_db();
init_schema();
import { z as z17 } from "zod";
import { eq as eq22, asc as asc6 } from "drizzle-orm";
import { TRPCError as TRPCError15 } from "@trpc/server";
var adminCategoriesRouter = router({
  // Lista todas as categorias
  list: adminProcedure.input(z17.object({ onlyActive: z17.boolean().optional() }).optional()).query(async ({ input }) => {
    try {
      const db2 = await getDb();
      const whereClause = input?.onlyActive ? eq22(categories.isActive, true) : void 0;
      const results = await db2.select().from(categories).where(whereClause).orderBy(asc6(categories.displayOrder), asc6(categories.name));
      return results || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new TRPCError15({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao listar categorias."
      });
    }
  }),
  // Cria ou Atualiza uma categoria (Upsert)
  upsert: adminProcedure.input(z17.object({
    id: z17.number().optional(),
    name: z17.string().min(1, "O nome da categoria \xE9 obrigat\xF3rio"),
    iconKey: z17.string().optional().nullable(),
    color: z17.string().optional().nullable(),
    isActive: z17.boolean().default(true),
    displayOrder: z17.number().optional().default(0)
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const slug = input.name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    const data = {
      name: input.name,
      slug,
      iconKey: input.iconKey,
      color: input.color || "slate",
      isActive: input.isActive,
      displayOrder: input.displayOrder,
      updatedAt: /* @__PURE__ */ new Date()
    };
    try {
      if (input.id) {
        await db2.update(categories).set(data).where(eq22(categories.id, input.id));
        return { success: true };
      } else {
        await db2.insert(categories).values({
          ...data,
          createdAt: /* @__PURE__ */ new Date()
        });
        return { success: true };
      }
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
        throw new TRPCError15({
          code: "CONFLICT",
          message: "J\xE1 existe uma categoria com este nome ou slug."
        });
      }
      throw new TRPCError15({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao processar categoria"
      });
    }
  }),
  // Remove uma categoria
  delete: adminProcedure.input(z17.object({ id: z17.number(), name: z17.string().optional() })).mutation(async ({ input }) => {
    try {
      const db2 = await getDb();
      await db2.delete(categories).where(eq22(categories.id, input.id));
      return {
        success: true,
        message: input.name ? `Categoria "${input.name}" removida.` : "Removida com sucesso."
      };
    } catch {
      throw new TRPCError15({
        code: "INTERNAL_SERVER_ERROR",
        message: "N\xE3o foi poss\xEDvel excluir. Verifique se existem produtos vinculados."
      });
    }
  })
});

// server/routers/admin/reviews.ts
init_db();
init_schema();
import { z as z18 } from "zod";
import { nanoid as nanoid2 } from "nanoid";
var adminReviewsRouter = router({
  saveReview: adminProcedure.input(z18.object({
    dishId: z18.string(),
    userId: z18.string(),
    // ID da Nutri
    technicalInsight: z18.string(),
    nutritionalHighlights: z18.string()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.insert(professionalReviews).values({
      id: nanoid2(),
      ...input,
      isActive: true
    });
    return { success: true };
  })
});

// server/routers/admin/sizes.ts
init_db();
init_schema();
import { z as z19 } from "zod";
import { eq as eq23, and as and7 } from "drizzle-orm";
var adminSizesRouter = router({
  // 1. LISTAR TODOS OS TAMANHOS
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    const result = await db2.select().from(dishSizes).orderBy(dishSizes.displayOrder);
    return result.map((size) => ({
      ...size,
      groupsOrder: typeof size.groupsOrder === "string" ? JSON.parse(size.groupsOrder) : size.groupsOrder || []
    }));
  }),
  // 2. BUSCAR VÍNCULOS
  getAccompanimentGroups: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(sizeAccompanimentGroups);
  }),
  /**
   * ✅ SALVAR (CRIAR OU EDITAR)
   */
  upsert: adminProcedure.input(z19.object({
    id: z19.number().optional(),
    name: z19.string().min(1).optional(),
    price: z19.coerce.string().optional(),
    priceModifier: z19.coerce.string().optional(),
    iconKey: z19.string().optional().nullable(),
    color: z19.string().optional().nullable(),
    isActive: z19.boolean().optional(),
    description: z19.string().optional().nullable(),
    weight: z19.string().optional().nullable(),
    mainDishWeight: z19.coerce.number().optional().nullable(),
    groupsOrder: z19.array(z19.number()).optional().nullable(),
    displayOrder: z19.number().optional()
  }).passthrough()).mutation(async ({ input }) => {
    const db2 = await getDb();
    const { id, groupsOrder, displayOrder, ...data } = input;
    const payload = {
      name: data.name ?? "",
      iconKey: data.iconKey ?? "Box",
      color: data.color ?? "slate",
      isActive: data.isActive ?? true,
      description: data.description,
      weight: data.weight,
      mainDishWeight: String(data.mainDishWeight || "200.00"),
      price: String(data.price || "0.00"),
      priceModifier: String(data.priceModifier || "0.00"),
      groupsOrder: JSON.stringify(groupsOrder || []),
      displayOrder: displayOrder ?? 0
    };
    if (id) {
      await db2.update(dishSizes).set(payload).where(eq23(dishSizes.id, id));
      return {
        success: true,
        id,
        message: `Tamanho "${data.name}" atualizado com sucesso!`
      };
    }
    const [res] = await db2.insert(dishSizes).values(payload);
    return {
      success: true,
      id: res.insertId,
      message: `Novo tamanho "${data.name}" criado!`
    };
  }),
  /**
   * ✅ DELETAR
   */
  delete: adminProcedure.input(z19.object({ id: z19.number(), name: z19.string().optional() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.transaction(async (tx) => {
      await tx.delete(sizeAccompanimentGroups).where(eq23(sizeAccompanimentGroups.sizeId, input.id));
      await tx.delete(dishesToSizes).where(eq23(dishesToSizes.sizeId, input.id));
      await tx.delete(dishSizes).where(eq23(dishSizes.id, input.id));
    });
    return {
      success: true,
      message: input.name ? `Tamanho "${input.name}" removido.` : "Tamanho exclu\xEDdo do sistema."
    };
  }),
  /**
   * ✅ REORDENAR (A ROTA QUE ESTAVA FALTANDO!)
   */
  reorder: adminProcedure.input(z19.object({ ids: z19.array(z19.number()) })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.transaction(async (tx) => {
      for (let i = 0; i < input.ids.length; i++) {
        await tx.update(dishSizes).set({ displayOrder: i }).where(eq23(dishSizes.id, input.ids[i]));
      }
    });
    return { success: true, message: "Ordem dos tamanhos atualizada!" };
  }),
  /**
   * ✅ VÍNCULOS (TOGGLE LINK + AUTO SYNC)
   */
  toggleLink: adminProcedure.input(z19.object({
    sizeId: z19.number(),
    accompanimentGroupId: z19.number()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    return await db2.transaction(async (tx) => {
      const existing = await tx.select().from(sizeAccompanimentGroups).where(and7(
        eq23(sizeAccompanimentGroups.sizeId, input.sizeId),
        eq23(sizeAccompanimentGroups.accompanimentGroupId, input.accompanimentGroupId)
      )).limit(1);
      let linked = false;
      if (existing.length > 0) {
        await tx.delete(sizeAccompanimentGroups).where(and7(
          eq23(sizeAccompanimentGroups.sizeId, input.sizeId),
          eq23(sizeAccompanimentGroups.accompanimentGroupId, input.accompanimentGroupId)
        ));
      } else {
        await tx.insert(sizeAccompanimentGroups).values({
          sizeId: input.sizeId,
          accompanimentGroupId: input.accompanimentGroupId
        });
        linked = true;
      }
      const currentLinks = await tx.select({ id: sizeAccompanimentGroups.accompanimentGroupId }).from(sizeAccompanimentGroups).where(eq23(sizeAccompanimentGroups.sizeId, input.sizeId));
      const newOrder = currentLinks.map((l) => l.id);
      await tx.update(dishSizes).set({ groupsOrder: JSON.stringify(newOrder) }).where(eq23(dishSizes.id, input.sizeId));
      return {
        success: true,
        message: linked ? "Grupo de acompanhamento vinculado!" : "V\xEDnculo removido e lista sincronizada."
      };
    });
  })
});

// server/routers/admin/groups.ts
init_db();
init_schema();
import { z as z20 } from "zod";
import { eq as eq24, asc as asc7 } from "drizzle-orm";
function createSlug(text19) {
  return text19.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var adminGroupsRouter = router({
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(accompanimentGroups).orderBy(asc7(accompanimentGroups.name));
  }),
  upsert: adminProcedure.input(z20.object({
    id: z20.number().optional(),
    name: z20.string().min(1, "O nome do grupo \xE9 obrigat\xF3rio"),
    isActive: z20.boolean().optional(),
    minSelections: z20.coerce.number().optional().default(0),
    maxSelections: z20.coerce.number().optional().default(1),
    defaultGrammage: z20.coerce.number().optional().default(100),
    // ✅ Removido displayOrder daqui pois o Schema não possui essa coluna
    itemsOrder: z20.array(z20.object({
      id: z20.number().optional(),
      group_id: z20.number().optional()
    })).optional().nullable()
  }).passthrough()).mutation(async ({ input }) => {
    const db2 = await getDb();
    const { id, itemsOrder, ...data } = input;
    const baseSlug = createSlug(data.name);
    const uniqueSlug = id ? baseSlug : `${baseSlug}-${Date.now()}`;
    const payload = {
      name: data.name,
      slug: uniqueSlug,
      isActive: data.isActive ?? true,
      minSelections: data.minSelections,
      maxSelections: data.maxSelections,
      defaultGrammage: String(data.defaultGrammage || "100.00"),
      itemsOrder: itemsOrder ? JSON.stringify(itemsOrder) : "[]"
      // ✅ Removido displayOrder daqui para satisfazer o TypeScript (TS2353)
    };
    return await db2.transaction(async (tx) => {
      let finalId;
      if (id) {
        await tx.update(accompanimentGroups).set(payload).where(eq24(accompanimentGroups.id, id));
        finalId = id;
      } else {
        const [res] = await tx.insert(accompanimentGroups).values(payload);
        finalId = res.insertId;
      }
      if (finalId) {
        await tx.delete(groupToOptions).where(eq24(groupToOptions.groupId, finalId));
        if (itemsOrder && itemsOrder.length > 0) {
          const inserts = itemsOrder.map((item) => ({
            groupId: finalId,
            optionId: Number(item.group_id || item.id)
          })).filter((i) => i.optionId > 0);
          if (inserts.length > 0) {
            await tx.insert(groupToOptions).values(inserts);
          }
        }
      }
      const message = id ? `Grupo "${data.name}" atualizado!` : `Novo grupo "${data.name}" criado com sucesso!`;
      return { success: true, id: finalId, message };
    });
  }),
  delete: adminProcedure.input(z20.object({ id: z20.number(), name: z20.string().optional() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    return await db2.transaction(async (tx) => {
      await tx.delete(sizeAccompanimentGroups).where(eq24(sizeAccompanimentGroups.accompanimentGroupId, input.id));
      await tx.delete(groupToOptions).where(eq24(groupToOptions.groupId, input.id));
      await tx.delete(accompanimentGroups).where(eq24(accompanimentGroups.id, input.id));
      return {
        success: true,
        message: input.name ? `Grupo "${input.name}" exclu\xEDdo.` : "Grupo removido."
      };
    });
  })
});

// server/routers/admin/accompaniments/options.ts
import { z as z21 } from "zod";
init_schema();

// server/accompaniments.ts
init_db();
init_schema();
import { eq as eq25, sql as sql13 } from "drizzle-orm";
async function getAccsWithNutrition() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  return await db2.select({
    id: accompanimentOptions.id,
    name: accompanimentOptions.name,
    isActive: accompanimentOptions.isActive,
    showNutrition: accompanimentOptions.showNutrition,
    priceModifier: accompanimentOptions.priceModifier,
    // ID da Categoria (Pode ser null)
    accompanimentCategoryId: accompanimentOptions.accompanimentCategoryId,
    // ✅ Fallbacks seguros para campos de Join (evita erro de undefined no front)
    categoryName: sql13`COALESCE(${accompanimentCategories.name}, 'Sem Categoria')`,
    iconKey: sql13`COALESCE(${accompanimentCategories.iconKey}, NULL)`,
    categoryColor: sql13`COALESCE(${accompanimentCategories.color}, '#CBD5E1')`,
    // Nutrientes
    energyKcal: accompanimentOptions.energyKcal,
    energyKj: accompanimentOptions.energyKj,
    proteins: accompanimentOptions.proteins,
    carbs: accompanimentOptions.carbs,
    fatTotal: accompanimentOptions.fatTotal,
    fatSaturated: accompanimentOptions.fatSaturated,
    fatTrans: accompanimentOptions.fatTrans,
    sodium: accompanimentOptions.sodium,
    fiber: accompanimentOptions.fiber,
    calcium: accompanimentOptions.calcium,
    iron: accompanimentOptions.iron,
    ingredients: accompanimentOptions.ingredients,
    // Ficha Técnica (JSON/String)
    nutritionalInfo: accompanimentOptions.nutritionalInfo,
    // Placeholder para vínculos de grupos
    linkedGroupIds: sql13`'[]'`
  }).from(accompanimentOptions).leftJoin(
    accompanimentCategories,
    eq25(accompanimentOptions.accompanimentCategoryId, accompanimentCategories.id)
  ).orderBy(accompanimentOptions.name);
}

// server/routers/admin/accompaniments/options.ts
import { eq as eq26 } from "drizzle-orm";
import { TRPCError as TRPCError16 } from "@trpc/server";
var generateSlug2 = (text19) => text19.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
var adminOptionsRouter = router({
  listAll: adminProcedure.query(async () => {
    return await getAccsWithNutrition();
  }),
  upsert: adminProcedure.input(z21.object({
    id: z21.number().optional(),
    name: z21.string().min(1, "O nome \xE9 obrigat\xF3rio"),
    accompanimentCategoryId: z21.number().nullable().optional(),
    energyKcal: z21.unknown().optional(),
    energyKj: z21.unknown().optional(),
    proteins: z21.unknown().optional(),
    carbs: z21.unknown().optional(),
    fatTotal: z21.unknown().optional(),
    fatSaturated: z21.unknown().optional(),
    fatTrans: z21.unknown().optional(),
    fiber: z21.unknown().optional(),
    sodium: z21.unknown().optional(),
    calcium: z21.unknown().optional(),
    iron: z21.unknown().optional(),
    ingredients: z21.string().optional().nullable(),
    composition: z21.unknown().optional(),
    isActive: z21.boolean().optional(),
    showNutrition: z21.boolean().optional(),
    priceModifier: z21.unknown().optional()
  }).passthrough()).mutation(async ({ ctx, input }) => {
    const { id, composition, ...data } = input;
    const toNum3 = (val) => {
      const normalized = typeof val === "string" ? val.replace(",", ".") : val;
      return safeNumber(normalized);
    };
    const toDec = (val) => {
      const normalized = typeof val === "string" ? val.replace(",", ".") : val;
      const p = safeNumber(normalized, Number.NaN);
      return Number.isFinite(p) ? p.toFixed(2) : "0.00";
    };
    const toRequiredDec = (val, label) => {
      const normalized = typeof val === "string" ? val.replace(",", ".") : val;
      const p = safeNumber(normalized, Number.NaN);
      if (!Number.isFinite(p)) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: `${label} inv\xC3\xA1lido.` });
      }
      return p.toFixed(2);
    };
    const nutritionalInfoString = typeof composition === "string" ? composition : JSON.stringify(composition || []);
    const payload = {
      name: data.name,
      slug: generateSlug2(data.name),
      accompanimentCategoryId: data.accompanimentCategoryId,
      energyKcal: Math.round(toNum3(data.energyKcal)),
      energyKj: toDec(data.energyKj),
      proteins: toDec(data.proteins),
      carbs: toDec(data.carbs),
      fatTotal: toDec(data.fatTotal),
      fatSaturated: toDec(data.fatSaturated),
      fatTrans: toDec(data.fatTrans),
      fiber: toDec(data.fiber),
      sodium: toDec(data.sodium),
      calcium: toDec(data.calcium),
      iron: toDec(data.iron),
      ingredients: data.ingredients || "",
      nutritionalInfo: nutritionalInfoString,
      isActive: data.isActive ?? true,
      showNutrition: data.showNutrition ?? false,
      priceModifier: toRequiredDec(data.priceModifier || 0, "Pre\xC3\xA7o adicional"),
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (id) {
      await ctx.db.update(accompanimentOptions).set(payload).where(eq26(accompanimentOptions.id, id));
      return {
        success: true,
        id,
        message: `Acompanhamento "${data.name}" atualizado!`
      };
    } else {
      const [result] = await ctx.db.insert(accompanimentOptions).values({
        ...payload,
        createdAt: /* @__PURE__ */ new Date()
      });
      return {
        success: true,
        id: result.insertId,
        message: `"${data.name}" adicionado aos acompanhamentos.`
      };
    }
  }),
  delete: adminProcedure.input(z21.object({ id: z21.number(), name: z21.string().optional() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(groupToOptions).where(eq26(groupToOptions.optionId, input.id));
    await ctx.db.delete(accompanimentOptions).where(eq26(accompanimentOptions.id, input.id));
    return {
      success: true,
      message: input.name ? `"${input.name}" removido com sucesso.` : "Item exclu\xEDdo."
    };
  })
});

// server/routers/admin/accompaniments/categories.ts
import { z as z22 } from "zod";
init_schema();
import { eq as eq27 } from "drizzle-orm";
var accompanimentCategoriesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(accompanimentCategories).orderBy(accompanimentCategories.displayOrder);
  }),
  upsert: adminProcedure.input(z22.object({
    id: z22.number().optional(),
    name: z22.string().min(1, "O nome \xE9 obrigat\xF3rio"),
    iconKey: z22.string().nullable().optional(),
    color: z22.string().nullable().optional(),
    isActive: z22.boolean().optional(),
    displayOrder: z22.number().optional()
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    const payload = {
      name: data.name,
      iconKey: data.iconKey,
      color: data.color,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0
    };
    if (id) {
      await ctx.db.update(accompanimentCategories).set(payload).where(eq27(accompanimentCategories.id, id));
      return {
        success: true,
        id,
        message: `Categoria "${data.name}" atualizada!`
      };
    }
    const [result] = await ctx.db.insert(accompanimentCategories).values(payload);
    return {
      success: true,
      id: result.insertId,
      message: `Nova categoria "${data.name}" criada com sucesso!`
    };
  })
});

// server/routers/admin/packages.ts
import { z as z23 } from "zod";
import { TRPCError as TRPCError17 } from "@trpc/server";
init_db();
init_schema();
import { eq as eq28, desc as desc13, asc as asc8 } from "drizzle-orm";
var packageConfigSchema = z23.object({
  slots: z23.array(z23.object({
    name: z23.string(),
    sizeId: z23.union([z23.string(), z23.number()]).nullable().optional(),
    dishIds: z23.array(z23.union([z23.string(), z23.number()])),
    groups: z23.array(z23.object({
      id: z23.union([z23.string(), z23.number()]),
      customLabel: z23.string().default("Acompanhamento"),
      optionIds: z23.array(z23.union([z23.string(), z23.number()])).optional().default([])
    }))
  }))
});
var parseConfig = (config) => {
  if (!config) return { slots: [] };
  return safeJsonParse(config, { slots: [] });
};
var requireMoneyString = (value, label) => {
  const amount = safeNumber(value, Number.NaN);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new TRPCError17({ code: "BAD_REQUEST", message: `${label} inv\xC3\xA1lido.` });
  }
  return amount.toFixed(2);
};
var adminPackagesRouter = router({
  // 1. LISTAGEM
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    const result = await db2.select().from(packages).orderBy(asc8(packages.displayOrder), desc13(packages.createdAt));
    return result.map((pkg) => ({
      ...pkg,
      id: String(pkg.id),
      base_price: pkg.price ? safeNumber(pkg.price) : 0,
      sale_price: pkg.salePrice ? safeNumber(pkg.salePrice) : null,
      image_url: pkg.imageUrl || "",
      size_id: pkg.sizeId,
      number_of_options: pkg.numberOfOptions || 0,
      display_order: pkg.displayOrder || 0,
      config: parseConfig(pkg.config),
      highlights: pkg.highlights || "",
      category: pkg.category || "",
      is_popular: Boolean(pkg.isPopular)
    }));
  }),
  // 2. TAMANHOS
  getAvailableSizes: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select({
      id: dishSizes.id,
      name: dishSizes.name,
      defaultMainWeight: dishSizes.mainDishWeight
    }).from(dishSizes).where(eq28(dishSizes.isActive, true)).orderBy(asc8(dishSizes.displayOrder));
  }),
  // ✅ 3. PRATOS — agora inclui sizeIds via join com dishes_to_sizes
  getDishes: adminProcedure.query(async () => {
    const db2 = await getDb();
    const dishRows = await db2.select({
      id: dishes.id,
      name: dishes.name,
      basePrice: dishes.basePrice,
      categoryId: dishes.categoryId,
      categoryName: categories.name,
      isVegetarian: dishes.isVegetarian,
      isGlutenFree: dishes.isGlutenFree,
      isLactoseFree: dishes.isLactoseFree,
      proteins: dishes.proteins,
      carbs: dishes.carbs,
      energyKcal: dishes.energyKcal,
      fatTotal: dishes.fatTotal,
      fiber: dishes.fiber,
      sodium: dishes.sodium
    }).from(dishes).leftJoin(categories, eq28(dishes.categoryId, categories.id)).where(eq28(dishes.isActive, true)).orderBy(asc8(dishes.name));
    const sizeLinks = await db2.select({
      dishId: dishesToSizes.dishId,
      sizeId: dishesToSizes.sizeId
    }).from(dishesToSizes);
    const sizeMap = /* @__PURE__ */ new Map();
    for (const link of sizeLinks) {
      const key = link.dishId;
      if (!sizeMap.has(key)) sizeMap.set(key, []);
      sizeMap.get(key).push(String(link.sizeId));
    }
    return dishRows.map((d) => ({
      id: String(d.id),
      name: d.name,
      basePrice: safeNumber(d.basePrice),
      categoryId: d.categoryId ? String(d.categoryId) : null,
      categoryName: d.categoryName || "Sem Categoria",
      // ✅ sizeIds: array com os tamanhos disponíveis para este prato
      sizeIds: sizeMap.get(d.id) ?? [],
      isVegetarian: Boolean(d.isVegetarian),
      isGlutenFree: Boolean(d.isGlutenFree),
      isLactoseFree: Boolean(d.isLactoseFree),
      proteins: safeNumber(d.proteins),
      carbs: safeNumber(d.carbs),
      energyKcal: safeNumber(d.energyKcal),
      fatTotal: safeNumber(d.fatTotal),
      fiber: safeNumber(d.fiber),
      sodium: safeNumber(d.sodium)
    }));
  }),
  // 4. ACOMPANHAMENTOS
  getAllAccompanimentOptions: adminProcedure.query(async () => {
    const db2 = await getDb();
    const result = await db2.select().from(accompanimentOptions).where(eq28(accompanimentOptions.isActive, true)).orderBy(asc8(accompanimentOptions.name));
    return result.map((opt) => ({
      id: String(opt.id),
      name: opt.name,
      // @ts-ignore
      price: safeNumber(opt.basePrice ?? opt.price)
    }));
  }),
  // 5. STATUS
  updateStatus: adminProcedure.input(z23.object({
    id: z23.union([z23.string(), z23.number()]),
    status: z23.enum(["active", "hidden"])
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const targetId = String(input.id);
    await db2.update(packages).set({ status: input.status, isActive: input.status === "active" }).where(eq28(packages.id, targetId));
    await logAction(ctx, "UPDATE_PACKAGE_STATUS", "packages", {
      entityId: targetId,
      new: { status: input.status }
    });
    return { success: true };
  }),
  // 6. CREATE
  create: adminProcedure.input(z23.object({
    name: z23.string().min(1),
    slug: z23.string().min(1),
    description: z23.string().optional().nullable(),
    highlights: z23.string().optional().nullable(),
    category: z23.string().optional().nullable(),
    is_popular: z23.boolean().optional().default(false),
    image_url: z23.string().optional().nullable(),
    base_price: z23.coerce.string(),
    sale_price: z23.coerce.string().optional().nullable(),
    display_order: z23.coerce.number().optional().default(0),
    number_of_options: z23.coerce.number(),
    isActive: z23.boolean().optional().default(true),
    size_id: z23.coerce.number().min(1),
    config: packageConfigSchema
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    try {
      const valuesToInsert = {
        name: input.name,
        slug: input.slug,
        price: requireMoneyString(input.base_price, "Pre\xC3\xA7o"),
        description: input.description || "",
        highlights: input.highlights || "",
        category: input.category || "",
        isPopular: input.is_popular,
        imageUrl: input.image_url || "",
        salePrice: input.sale_price ? requireMoneyString(input.sale_price, "Pre\xC3\xA7o promocional") : null,
        displayOrder: input.display_order,
        numberOfOptions: input.number_of_options,
        isActive: input.isActive,
        sizeId: input.size_id,
        status: input.isActive ? "active" : "hidden",
        // @ts-ignore
        config: input.config,
        id: ""
      };
      const [result] = await db2.insert(packages).values(valuesToInsert);
      const newId = result.insertId;
      await logAction(ctx, "CREATE_PACKAGE", "packages", {
        entityId: String(newId),
        new: { name: input.name }
      });
      return { success: true, id: newId };
    } catch (error) {
      const err = error;
      throw new TRPCError17({ code: "INTERNAL_SERVER_ERROR", message: err.sqlMessage || "Erro ao salvar." });
    }
  }),
  // 7. UPDATE
  update: adminProcedure.input(z23.object({
    id: z23.union([z23.string(), z23.number()]),
    name: z23.string().min(1),
    slug: z23.string().min(1),
    description: z23.string().optional().nullable(),
    highlights: z23.string().optional().nullable(),
    category: z23.string().optional().nullable(),
    is_popular: z23.boolean().optional(),
    image_url: z23.string().optional().nullable(),
    base_price: z23.coerce.string(),
    sale_price: z23.coerce.string().optional().nullable(),
    display_order: z23.coerce.number().optional(),
    number_of_options: z23.coerce.number(),
    isActive: z23.boolean().optional(),
    size_id: z23.coerce.number().min(1),
    config: packageConfigSchema
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const { id, ...data } = input;
    const targetId = String(id);
    try {
      await db2.update(packages).set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        highlights: data.highlights,
        category: data.category,
        isPopular: data.is_popular,
        imageUrl: data.image_url,
        price: requireMoneyString(data.base_price, "Pre\xC3\xA7o"),
        salePrice: data.sale_price ? requireMoneyString(data.sale_price, "Pre\xC3\xA7o promocional") : null,
        displayOrder: data.display_order,
        numberOfOptions: data.number_of_options,
        isActive: data.isActive,
        sizeId: data.size_id,
        status: data.isActive ? "active" : "hidden",
        // @ts-ignore
        config: data.config
      }).where(eq28(packages.id, targetId));
      await logAction(ctx, "UPDATE_PACKAGE", "packages", {
        entityId: targetId,
        new: { name: data.name }
      });
      return { success: true };
    } catch (error) {
      const err = error;
      throw new TRPCError17({ code: "BAD_REQUEST", message: err.sqlMessage || "Erro ao atualizar." });
    }
  }),
  // 8. DELETE
  delete: adminProcedure.input(z23.object({ id: z23.union([z23.string(), z23.number()]) })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.delete(packages).where(eq28(packages.id, String(input.id)));
    return { success: true };
  })
});

// server/routers/admin/showcase.ts
import { z as z24 } from "zod";
init_db();
init_schema();
import { eq as eq29, asc as asc9 } from "drizzle-orm";
import { TRPCError as TRPCError18 } from "@trpc/server";
var adminShowcaseRouter = router({
  /**
   * 📋 LISTAGEM ADMIN
   */
  list: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(showcases).orderBy(asc9(showcases.order));
  }),
  /**
   * 🔄 UPSERT (Cria ou Atualiza)
   */
  upsert: adminProcedure.input(z24.object({
    id: z24.number().optional(),
    title: z24.string().min(1, "O t\xEDtulo da vitrine \xE9 obrigat\xF3rio"),
    description: z24.string().nullable().optional().transform((v) => v ?? ""),
    /**
     * ✅ NOVO CAMPO: items
     * Recebe array de números do front e salva como string JSON no banco
     */
    items: z24.array(z24.number()).optional().default([]).transform((v) => JSON.stringify(v)),
    active: z24.boolean().default(true),
    order: z24.number().int().default(0)
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const { id, ...data } = input;
    if (id) {
      const [exists] = await db2.select().from(showcases).where(eq29(showcases.id, id)).limit(1);
      if (!exists) {
        throw new TRPCError18({ code: "NOT_FOUND", message: "Vitrine n\xE3o encontrada." });
      }
      await db2.update(showcases).set(data).where(eq29(showcases.id, id));
      await logAction(ctx, "UPDATE_SHOWCASE", "showcase", {
        entityId: String(id),
        new: data
      });
      return { success: true, id, message: `Vitrine "${input.title}" atualizada!` };
    } else {
      const [result] = await db2.insert(showcases).values(data);
      const mysqlResult = result;
      const newId = mysqlResult.insertId || 0;
      await logAction(ctx, "CREATE_SHOWCASE", "showcase", {
        entityId: String(newId),
        new: data
      });
      return { success: true, id: newId, message: `Vitrine "${input.title}" criada!` };
    }
  }),
  /**
   * 🗑️ EXCLUSÃO
   */
  delete: adminProcedure.input(z24.object({
    id: z24.number(),
    title: z24.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [exists] = await db2.select().from(showcases).where(eq29(showcases.id, input.id)).limit(1);
    if (!exists) {
      throw new TRPCError18({ code: "NOT_FOUND", message: "Vitrine n\xE3o encontrada." });
    }
    await db2.delete(showcases).where(eq29(showcases.id, input.id));
    await logAction(ctx, "DELETE_SHOWCASE", "showcase", {
      entityId: String(input.id),
      old: { title: exists.title }
    });
    return {
      success: true,
      message: input.title ? `Vitrine "${input.title}" removida.` : "Vitrine exclu\xEDda."
    };
  })
});

// server/routers/admin/users.ts
import { z as z25 } from "zod";
import { eq as eq30, sql as sql14, sum, or as or3, like as like4, asc as asc10, and as and8, desc as desc14 } from "drizzle-orm";
init_db();
init_encryption();
import { TRPCError as TRPCError19 } from "@trpc/server";
init_schema();
import { v4 as uuidv42 } from "uuid";
import { hash } from "@node-rs/argon2";
import crypto8 from "node:crypto";
function unseal2(val) {
  if (val === null || val === void 0) return "";
  const str = String(val).trim();
  if (!str) return "";
  try {
    if (str.split(":").length !== 3) return str;
    const decoded = decrypt(str);
    return decoded || "";
  } catch {
    return "";
  }
}
function normalizeForSearch(text19) {
  if (!text19) return "";
  return text19.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}
var mapUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    name: unseal2(u.name),
    phone: unseal2(u.phone),
    customerDocument: unseal2(u.customerDocument),
    needsPasswordReset: Number(u.needsPasswordReset ?? 0)
  };
};
var usersAdminRouter = router({
  list: adminProcedure.input(z25.object({
    page: z25.number().default(1),
    limit: z25.number().default(20),
    search: z25.string().nullish()
  })).query(async ({ input }) => {
    const db2 = await getDb();
    const { page, limit, search } = input;
    const offset = (page - 1) * limit;
    let searchCondition = void 0;
    if (search && search.trim().length >= 2) {
      const term = search.trim();
      const termNorm = normalizeForSearch(term);
      const cleanDigits = normalizeDigits(term);
      const digitHash = cleanDigits.length >= 3 ? piiHash(cleanDigits) : null;
      searchCondition = or3(
        like4(users.email, `%${term.toLowerCase()}%`),
        like4(users.nameIndex, `%${termNorm}%`),
        eq30(users.id, term),
        digitHash ? eq30(users.documentIndex, digitHash) : void 0,
        digitHash ? eq30(users.phoneIndex, digitHash) : void 0
      );
    }
    const [userList, totalResult] = await Promise.all([
      db2.select({
        user: users,
        address: userAddresses
      }).from(users).leftJoin(userAddresses, and8(eq30(users.id, userAddresses.userId), eq30(userAddresses.isDefault, true))).where(searchCondition).limit(limit).offset(offset).orderBy(asc10(users.nameIndex)),
      db2.select({ count: sql14`count(*)` }).from(users).where(searchCondition).limit(1).offset(0)
    ]);
    const items = userList.map(({ user, address }) => {
      const base = mapUser(user);
      if (!base) return null;
      let mappedAddress = null;
      if (address) {
        mappedAddress = {
          shipping_address: unseal2(address.street),
          shipping_address_number: unseal2(address.number),
          shipping_neighborhood: unseal2(address.neighborhood),
          shipping_address_complement: unseal2(address.complement),
          shipping_zip_code: unseal2(address.zipCode),
          shipping_city: unseal2(address.city),
          shipping_state: unseal2(address.state)
        };
      }
      return {
        ...base,
        address: mappedAddress,
        availablePoints: Number(user.availablePoints || 0)
      };
    }).filter((u) => u !== null);
    return { items, total: Number(totalResult[0]?.count || 0), page, limit };
  }),
  getDetails: adminProcedure.input(z25.object({ id: z25.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const [data] = await db2.select({
      user: users,
      city: user_profiles.city,
      state: user_profiles.state
    }).from(users).leftJoin(user_profiles, eq30(users.id, user_profiles.userId)).where(eq30(users.id, input.id)).limit(1);
    if (!data) throw new TRPCError19({ code: "NOT_FOUND", message: "Usu\xE1rio n\xE3o encontrado" });
    const userBase = mapUser(data.user);
    const spentResult = await db2.select({ total: sum(orders.total) }).from(orders).where(eq30(orders.userId, input.id));
    const recentOrders = await db2.select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt
    }).from(orders).where(eq30(orders.userId, input.id)).orderBy(desc14(orders.createdAt)).limit(10);
    return {
      ...userBase,
      city: unseal2(data.city),
      state: unseal2(data.state),
      stats: {
        totalSpent: String(spentResult[0]?.total || "0.00"),
        loyaltyPointsAvailable: Number(data.user.availablePoints || 0)
      },
      recentOrders
    };
  }),
  addAddress: adminProcedure.input(z25.object({
    userId: z25.string().min(1),
    street: z25.string().min(1),
    number: z25.string().min(1),
    neighborhood: z25.string().optional(),
    complement: z25.string().optional(),
    city: z25.string().min(1),
    state: z25.string().length(2),
    zipCode: z25.string().min(8),
    label: z25.string().optional().default("Endere\xE7o Admin")
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [targetUser] = await db2.select({ id: users.id }).from(users).where(eq30(users.id, input.userId)).limit(1);
    if (!targetUser) throw new TRPCError19({ code: "NOT_FOUND", message: "Usu\xE1rio alvo n\xE3o encontrado." });
    const id = uuidv42();
    const payload = {
      id,
      userId: input.userId,
      label: encrypt(input.label),
      street: encrypt(input.street),
      number: encrypt(input.number),
      neighborhood: input.neighborhood ? encrypt(input.neighborhood) : null,
      complement: input.complement ? encrypt(input.complement) : null,
      city: encrypt(input.city),
      state: encrypt(input.state),
      zipCode: encrypt(normalizeDigits(input.zipCode)),
      isDefault: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    await db2.insert(userAddresses).values(payload);
    await logAction(ctx, "ADD_ADDRESS", "user_addresses", {
      entityId: id,
      new: { userId: input.userId }
    });
    return { success: true, message: "Endere\xE7o cadastrado com sucesso!" };
  }),
  create: adminProcedure.input(z25.object({
    name: z25.string().min(1),
    email: z25.string().email().transform((v) => v.toLowerCase().trim()),
    customerDocument: z25.string().nullish(),
    phone: z25.string().nullish(),
    role: z25.enum(["admin", "user", "nutri"]).default("user")
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const [exists] = await db2.select().from(users).where(eq30(users.email, input.email)).limit(1);
    if (exists) throw new TRPCError19({ code: "CONFLICT", message: "Este e-mail j\xE1 est\xE1 em uso." });
    const id = uuidv42();
    const cleanCpf = normalizeDigits(input.customerDocument);
    const cleanPhone = normalizeDigits(input.phone);
    const tempPassword = crypto8.randomBytes(16).toString("hex");
    const hashedPassword = await hash(tempPassword);
    await db2.transaction(async (tx) => {
      await tx.insert(users).values({
        id,
        email: input.email,
        password: hashedPassword,
        name: encrypt(input.name),
        customerDocument: encrypt(cleanCpf),
        phone: encrypt(cleanPhone),
        nameIndex: normalizeForSearch(input.name),
        documentIndex: piiHash(cleanCpf),
        phoneIndex: piiHash(cleanPhone),
        role: input.role,
        availablePoints: 0,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        needsPasswordReset: 1
      });
      await tx.insert(user_profiles).values({
        id: uuidv42(),
        userId: id,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
    });
    await logAction(ctx, "CREATE_USER", "users", { entityId: id });
    return { success: true, id, message: `Usu\xE1rio cadastrado com sucesso!` };
  }),
  update: adminProcedure.input(z25.object({
    id: z25.string().min(1),
    name: z25.string().optional(),
    phone: z25.string().optional().nullable(),
    customerDocument: z25.string().optional().nullable(),
    role: z25.enum(["admin", "user", "nutri"]).optional(),
    email: z25.string().email().optional().transform((v) => v?.toLowerCase().trim()),
    needsPasswordReset: z25.coerce.number().optional().nullable()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const { id, ...data } = input;
    const updateData = { updatedAt: /* @__PURE__ */ new Date() };
    if (data.name) {
      updateData.name = encrypt(data.name);
      updateData.nameIndex = normalizeForSearch(data.name);
    }
    if (data.phone !== void 0) {
      const cleanPhone = normalizeDigits(data.phone);
      updateData.phone = encrypt(cleanPhone);
      updateData.phoneIndex = piiHash(cleanPhone);
    }
    if (data.customerDocument !== void 0) {
      const cleanCpf = normalizeDigits(data.customerDocument);
      updateData.customerDocument = encrypt(cleanCpf);
      updateData.documentIndex = piiHash(cleanCpf);
    }
    if (data.role) updateData.role = data.role;
    if (data.email) updateData.email = data.email;
    if (data.needsPasswordReset !== void 0) {
      updateData.needsPasswordReset = data.needsPasswordReset;
    }
    const result = await db2.update(users).set(updateData).where(eq30(users.id, id));
    if (result[0]?.affectedRows === 0) throw new TRPCError19({ code: "NOT_FOUND" });
    await logAction(ctx, "UPDATE_USER", "users", { entityId: id });
    return { success: true, message: "Perfil atualizado!" };
  }),
  delete: adminProcedure.input(z25.object({ id: z25.string().min(1) })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    await db2.transaction(async (tx) => {
      await tx.delete(userAddresses).where(eq30(userAddresses.userId, input.id));
      await tx.delete(loyaltyHistory).where(eq30(loyaltyHistory.userId, input.id));
      await tx.delete(user_profiles).where(eq30(user_profiles.userId, input.id));
      const result = await tx.delete(users).where(eq30(users.id, input.id));
      if (result[0]?.affectedRows === 0) throw new TRPCError19({ code: "NOT_FOUND" });
    });
    await logAction(ctx, "DELETE_USER", "users", { entityId: input.id });
    return { success: true, message: "Usu\xE1rio removido permanentemente!" };
  }),
  setPassword: adminProcedure.input(z25.object({ userId: z25.string().min(1), password: z25.string().min(6) })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const hashedPassword = await hash(input.password);
    const result = await db2.update(users).set({
      password: hashedPassword,
      needsPasswordReset: 0
    }).where(eq30(users.id, input.userId));
    if (result[0]?.affectedRows === 0) throw new TRPCError19({ code: "NOT_FOUND" });
    await logAction(ctx, "SET_PASSWORD", "users", { entityId: input.userId });
    return { success: true, message: "Senha atualizada pelo administrador." };
  })
});

// server/routers/admin/labels.ts
import { z as z26 } from "zod";
init_db();
init_schema();
import { inArray as inArray4, eq as eq31, sql as sql15 } from "drizzle-orm";
import { TRPCError as TRPCError20 } from "@trpc/server";

// server/utils/label-compiler.ts
function compileToZPL(elementsJson, data) {
  const elements = JSON.parse(elementsJson);
  let zpl = "^XA^CI28";
  elements.forEach((el) => {
    const rawValue = el.field ? data[el.field] : el.staticText;
    const content = String(rawValue || "");
    const multiplier = 8;
    switch (el.type) {
      case "text":
        zpl += `^FO${el.x * multiplier},${el.y * multiplier}^CF0,${el.fontSize || 20}^FD${content}^FS`;
        break;
      case "barcode":
        zpl += `^FO${el.x * multiplier},${el.y * multiplier}^BY2^BCN,${el.height || 60},Y,N,N^FD${content}^FS`;
        break;
      case "line":
        zpl += `^FO${el.x * multiplier},${el.y * multiplier}^GB${(el.width || 10) * multiplier},${(el.height || 1) * multiplier},1^FS`;
        break;
    }
  });
  zpl += "^XZ";
  return zpl;
}

// server/routers/admin/labels.ts
var adminLabelsRouter = router({
  /**
   * 1. Busca todos os templates de etiquetas salvos
   */
  getTemplates: adminProcedure.query(async () => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError20({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
    return await db2.select().from(labelTemplates);
  }),
  /**
   * 2. Busca pedidos que precisam de impressão (Fila de Produção)
   */
  getPending: adminProcedure.query(async () => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError20({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
    const validStatuses = [
      "pending",
      "preparing",
      "shipped",
      "delivered",
      "cancelled",
      "completed"
    ];
    try {
      return await db2.select({
        id: orders.id,
        customerName: orders.customerName,
        status: orders.status,
        createdAt: orders.createdAt,
        // ✅ Subquery para somar as marmitas sem depender de colunas inexistentes
        totalItems: sql15`(SELECT SUM(quantity) FROM order_items WHERE order_id = ${orders.id})`.mapWith(Number)
      }).from(orders).where(
        inArray4(orders.status, validStatuses)
      ).orderBy(sql15`${orders.createdAt} DESC`);
    } catch (err) {
      console.error("Erro ao buscar fila de etiquetas:", err);
      throw new TRPCError20({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao carregar fila." });
    }
  }),
  /**
   * 📄 3. Gera o ZPL em lote para os pedidos selecionados
   */
  generateBatchZPL: adminProcedure.input(z26.object({
    orderIds: z26.array(z26.string().min(1)),
    templateId: z26.number()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError20({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
    const [template] = await db2.select().from(labelTemplates).where(eq31(labelTemplates.id, input.templateId)).limit(1);
    if (!template) throw new TRPCError20({ code: "NOT_FOUND", message: "Template n\xE3o encontrado" });
    const orders2 = await db2.select().from(orders).where(inArray4(orders.id, input.orderIds));
    if (orders2.length === 0) throw new TRPCError20({ code: "NOT_FOUND", message: "Pedidos n\xE3o encontrados" });
    let fullZPL = "";
    for (const order of orders2) {
      const items = await db2.select({
        orderItem: orderItems,
        dish: dishes
      }).from(orderItems).leftJoin(dishes, eq31(orderItems.dishId, dishes.id)).where(eq31(orderItems.orderId, order.id));
      const totalItemsInOrder = items.reduce((acc, i) => acc + (i.orderItem.quantity || 1), 0);
      let currentLabelIndex = 1;
      for (const item of items) {
        const qty = item.orderItem.quantity || 1;
        const labelData = {
          dishName: item.orderItem.dishName || "Marmita Gourmet",
          customerName: order.customerName || "Cliente",
          ingredients: item.dish?.ingredients || "Consultar site.",
          kcal: String(item.dish?.energyKcal || 0),
          carbs: String(item.dish?.carbs || 0),
          prots: String(item.dish?.proteins || 0),
          fats: String(item.dish?.fatTotal || 0),
          orderId: order.id,
          itemIndex: currentLabelIndex,
          totalItems: totalItemsInOrder
        };
        for (let i = 0; i < qty; i++) {
          fullZPL += compileToZPL(template.elements, labelData) + "\n";
          currentLabelIndex++;
        }
      }
    }
    return { success: true, zplCode: fullZPL, count: orders2.length };
  }),
  /**
   * 4. CRUD: Salva ou Atualiza Layouts do Studio
   */
  upsertTemplate: adminProcedure.input(z26.object({
    id: z26.number().optional(),
    name: z26.string().min(1),
    width: z26.number(),
    height: z26.number(),
    elements: z26.string(),
    isDefault: z26.boolean().optional()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError20({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
    const values = {
      name: input.name,
      width: input.width,
      height: input.height,
      elements: input.elements,
      isDefault: input.isDefault ?? false
    };
    try {
      if (input.id) {
        await db2.update(labelTemplates).set(values).where(eq31(labelTemplates.id, input.id));
        return { id: input.id, updated: true };
      }
      const [res] = await db2.insert(labelTemplates).values(values);
      return { id: res.insertId, updated: false };
    } catch (err) {
      console.error("Erro no upsert:", err);
      throw new TRPCError20({ code: "BAD_REQUEST", message: "Erro ao salvar template." });
    }
  }),
  deleteTemplate: adminProcedure.input(z26.object({ id: z26.number() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError20({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
    try {
      await db2.delete(labelTemplates).where(eq31(labelTemplates.id, input.id));
      return { success: true };
    } catch (err) {
      console.error("Erro ao excluir template:", err);
      throw new TRPCError20({ code: "BAD_REQUEST", message: "Erro ao excluir template." });
    }
  })
});

// server/routers/admin/adminStoreSettingsRouter.ts
import { z as z27 } from "zod";
init_db();
init_schema();
init_encryption();
import { eq as eq32, sql as sql16 } from "drizzle-orm";
import { TRPCError as TRPCError21 } from "@trpc/server";

// server/backup.ts
import { execSync } from "child_process";
async function generateDatabaseBackup() {
  const containerName = "gourmet_db";
  const dbName = "gourmet_saudavel";
  try {
    const command = `docker exec ${containerName} /usr/bin/mysqldump -u root --password=root ${dbName}`;
    const output = execSync(command, {
      maxBuffer: 1024 * 1024 * 64,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    });
    return output;
  } catch (error) {
    const processError = error;
    const stderr = processError.stderr?.toString() || "";
    const message = processError.message || "";
    if (stderr.includes("Unknown database")) {
      throw new Error(`O banco '${dbName}' n\xE3o existe no container.`);
    }
    if (stderr.includes("Access denied")) {
      throw new Error("Senha do banco incorreta no script de backup.");
    }
    throw new Error(`Erro no Docker: ${stderr || message}`);
  }
}

// server/routers/admin/adminStoreSettingsRouter.ts
async function forceSaveAppConfig(db2, key, value) {
  try {
    const rawValue = value === void 0 || value === null ? "" : String(value);
    let finalValue = rawValue;
    const sensitiveKeys = ["gemini_api_key", "google_login_config", "smtp_pass", "ga_service_account"];
    if (sensitiveKeys.includes(key) && rawValue.length > 0 && !rawValue.includes(":")) {
      finalValue = encrypt(rawValue) || rawValue;
    }
    await db2.execute(sql16`
      INSERT INTO app_configs (config_key, config_value, updated_at) 
      VALUES (${key}, ${finalValue}, NOW()) 
      ON DUPLICATE KEY UPDATE config_value = ${finalValue}, updated_at = NOW()
    `);
  } catch (error) {
    logger.error({ key, error }, "Falha ao salvar configura\xE7\xE3o em app_configs");
    throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao gravar configura\xE7\xE3o." });
  }
}
var saveSettingsLogic = adminProcedure.input(z27.record(z27.unknown())).mutation(async ({ ctx, input }) => {
  const db2 = await getDb();
  if (!db2) throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
  const dataInput = input;
  try {
    const configsToSave = [
      { key: "success_order_message", val: dataInput.success_order_message ?? dataInput.successOrderMessage ?? void 0 },
      { key: "partners_json", val: dataInput.partners_json ?? dataInput.partnersJson ?? void 0 },
      { key: "label_design_elements", val: dataInput.label_design_elements ?? dataInput.labelDesignElements },
      { key: "accessibility_vlibras_active", val: String(dataInput.accessibility?.vLibrasActive ?? dataInput.vLibrasActive ?? "false") },
      { key: "accessibility_high_contrast", val: String(dataInput.accessibility?.highContrastActive ?? dataInput.highContrastActive ?? "false") },
      { key: "favicon_url", val: dataInput.favicon ?? void 0 },
      { key: "gemini_api_key", val: dataInput.geminiApiKey },
      { key: "google_login_config", val: dataInput.googleLoginConfig },
      { key: "google_analytics_id", val: dataInput.googleAnalyticsId },
      { key: "ga_service_account", val: dataInput.gaServiceAccount },
      { key: "ga4_property_id", val: dataInput.ga4PropertyId }
    ];
    for (const config of configsToSave) {
      if (config.val !== void 0) {
        await forceSaveAppConfig(db2, config.key, config.val);
      }
    }
    const storeUpdate = { updatedAt: /* @__PURE__ */ new Date() };
    if (dataInput.logoUrl !== void 0) storeUpdate.logoUrl = dataInput.logoUrl;
    if (dataInput.generalMinOrderAmount !== void 0) storeUpdate.generalMinOrderAmount = String(dataInput.generalMinOrderAmount);
    if (dataInput.minOrderMessage !== void 0) storeUpdate.minOrderMessage = dataInput.minOrderMessage;
    if (Object.keys(storeUpdate).length > 1) {
      await db2.update(storeSettings).set(storeUpdate).where(eq32(storeSettings.id, "1"));
    }
    await logAction(ctx, "UPDATE_SETTINGS_UNIFIED", "settings", { entityId: "global" });
    return { success: true, message: "Configura\xE7\xF5es sincronizadas com sucesso!" };
  } catch (err) {
    logger.error({ err }, "Erro ao salvar configura\xE7\xF5es globais");
    throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao processar a grava\xE7\xE3o dos dados." });
  }
});
var adminStoreSettingsRouter = router({
  /**
   * ✅ LEITURA GLOBAL
   * Descriptografa segredos para exibição segura no painel Admin.
   */
  get: adminProcedure.query(async () => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR" });
    const generalSettings = await getStoreSettings();
    const extraConfigs = await db2.select().from(appConfigs);
    const [shipData] = await db2.select().from(shippingSettings).limit(1);
    const getRaw = (key) => extraConfigs.find((r) => r.configKey === key)?.configValue || "";
    const getSecret = (key) => {
      const val = getRaw(key);
      if (!val) return "";
      if (val.split(":").length === 3) {
        return decrypt(val) || val;
      }
      return val;
    };
    return {
      ...generalSettings,
      favicon: getRaw("favicon_url") || generalSettings.favicon || "",
      success_order_message: getRaw("success_order_message") || "",
      partners_json: getRaw("partners_json") || "[]",
      label_design_elements: getRaw("label_design_elements") || null,
      pickupEnabled: Boolean(shipData?.pickupEnabled ?? false),
      pickupLabel: shipData?.pickupLabel || "Retirada no Local",
      pickupInstruction: shipData?.pickupInstruction || "",
      geminiApiKey: getSecret("gemini_api_key"),
      googleLoginConfig: getSecret("google_login_config"),
      googleAnalyticsId: getRaw("google_analytics_id"),
      gaServiceAccount: getSecret("ga_service_account"),
      ga4PropertyId: getRaw("ga4_property_id"),
      accessibility: {
        vLibrasActive: getRaw("accessibility_vlibras_active") === "true",
        highContrastActive: getRaw("accessibility_high_contrast") === "true"
      }
    };
  }),
  /**
   * ✅ LEITURA POR CHAVE
   */
  getByKey: adminProcedure.input(z27.object({
    key: z27.string().optional(),
    configKey: z27.string().optional()
  })).query(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR" });
    const targetKey = input.key || input.configKey;
    if (!targetKey) return { value: "" };
    const [config] = await db2.select().from(appConfigs).where(eq32(appConfigs.configKey, targetKey)).limit(1);
    let val = config?.configValue || "";
    if (val && val.split(":").length === 3) {
      val = decrypt(val) || val;
    }
    return {
      value: val,
      configValue: val
    };
  }),
  saveConfig: adminProcedure.input(z27.object({
    key: z27.string().optional(),
    value: z27.string().optional(),
    configKey: z27.string().optional(),
    configValue: z27.string().optional()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR" });
    const targetKey = input.key || input.configKey;
    const targetValue = input.value || input.configValue;
    if (!targetKey) throw new TRPCError21({ code: "BAD_REQUEST", message: "Chave \xE9 obrigat\xF3ria." });
    await forceSaveAppConfig(db2, targetKey, targetValue || "");
    return { success: true };
  }),
  upsert: saveSettingsLogic,
  update: saveSettingsLogic,
  saveCompanyInfo: saveSettingsLogic,
  /**
   * ✅ DOWNLOAD DE BACKUP
   */
  downloadBackup: adminProcedure.mutation(async () => {
    const sqlContent = await generateDatabaseBackup();
    return {
      sql: sqlContent,
      filename: `backup_gourmet_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.sql`
    };
  }),
  // ✅ Lista todas as tabelas do banco — usado pelo InfrastructureCard
  listTables: adminProcedure.query(async () => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError21({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
    const result = await db2.execute(sql16`SHOW TABLES`);
    const rows = result;
    return rows.map((row) => Object.values(row)[0]);
  })
});

// server/routers/admin/orders/ordersAdminRouter.ts
import { z as z28 } from "zod";

// server/routers/admin/orders/AdminOrderDraftService.ts
init_db();
init_schema();
import { eq as eq33, and as and9, sql as sql17, like as like5 } from "drizzle-orm";
import { v4 as uuidv43 } from "uuid";

// server/routers/admin/orders/AdminOrderHelpers.ts
init_encryption();
import crypto9 from "crypto";
var unseal3 = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  try {
    if (str.split(":").length === 3) {
      const decrypted = decrypt(str);
      return decrypted ?? str;
    }
    return str;
  } catch {
    return str;
  }
};
function generateFriendlyOrderId() {
  const date = /* @__PURE__ */ new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = crypto9.randomBytes(2).toString("hex").slice(0, 3).toUpperCase();
  return `GS-${year}${month}-${random}`;
}
var processDraftMetadata = (metadataJson) => {
  try {
    const data = safeJsonParse(metadataJson, {});
    const fieldsToRemove = [
      "paymentMethod",
      "notes",
      "deliveryMode",
      "couponCode",
      "couponValue",
      "loyaltyPointsUsed",
      "loyaltyValue",
      "discountSource",
      "currentStep",
      "discountValue",
      "shippingValue",
      "paymentDiscountValue"
    ];
    fieldsToRemove.forEach((field) => delete data[field]);
    const encryptFields = (obj, fields) => {
      if (!obj) return;
      fields.forEach((f) => {
        if (obj[f]) obj[f] = encrypt(String(obj[f]));
      });
    };
    if (data.customer) encryptFields(data.customer, ["name", "phone"]);
    if (data.address) {
      encryptFields(data.address, [
        "shipping_address",
        "shipping_address_number",
        "shipping_neighborhood",
        "shipping_address_complement",
        "zipCode",
        "shipping_city",
        "shipping_state"
      ]);
    }
    return JSON.stringify(data);
  } catch (error) {
    console.error("Erro ao processar metadata do rascunho:", error);
    return metadataJson;
  }
};

// server/routers/admin/orders/AdminOrderDraftService.ts
import { TRPCError as TRPCError22 } from "@trpc/server";
var AdminOrderDraftService = {
  async init(adminId) {
    const db2 = await getDb();
    const [existing] = await db2.select().from(adminOrderDrafts).where(and9(eq33(adminOrderDrafts.adminId, adminId), eq33(adminOrderDrafts.status, "active"))).limit(1);
    if (existing) return { id: existing.id, isExisting: true };
    const newId = uuidv43();
    await db2.insert(adminOrderDrafts).values({
      id: newId,
      adminId,
      status: "active",
      shippingValue: "0.00",
      discountValue: "0.00",
      updatedAt: /* @__PURE__ */ new Date()
    });
    return { id: newId, isExisting: false };
  },
  async update(input) {
    const db2 = await getDb();
    const rawData = safeJsonParse(input.metadataJson, {});
    const totalDiscount = (safeNumber(rawData.couponValue) + safeNumber(rawData.loyaltyValue) + safeNumber(rawData.paymentDiscountValue)).toFixed(2);
    await db2.update(adminOrderDrafts).set({
      userId: input.userId,
      shippingValue: input.shippingValue !== void 0 ? safeNumber(input.shippingValue).toFixed(2) : void 0,
      discountValue: totalDiscount,
      metadataJson: processDraftMetadata(input.metadataJson || "{}"),
      discountsSnapshot: JSON.stringify(rawData),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq33(adminOrderDrafts.id, input.draftId));
    return { success: true };
  },
  async getDraft(adminId) {
    const db2 = await getDb();
    const [draft] = await db2.select().from(adminOrderDrafts).where(and9(eq33(adminOrderDrafts.adminId, adminId), eq33(adminOrderDrafts.status, "active"))).limit(1);
    if (!draft) return null;
    const items = await db2.select().from(adminOrderDraftItems).where(eq33(adminOrderDraftItems.draftId, draft.id));
    const meta = safeJsonParse(draft.metadataJson, {});
    if (meta.customer) {
      meta.customer.name = unseal3(meta.customer.name || "");
      meta.customer.phone = unseal3(meta.customer.phone || "");
    }
    if (meta.address) {
      const address = meta.address;
      meta.address = {
        shipping_address: unseal3(meta.address.shipping_address || ""),
        shipping_address_number: unseal3(meta.address.shipping_address_number || ""),
        shipping_neighborhood: unseal3(meta.address.shipping_neighborhood || ""),
        shipping_address_complement: unseal3(meta.address.shipping_address_complement || ""),
        zipCode: unseal3(meta.address.zipCode || meta.address.shipping_zip_code || ""),
        // ✅ Padronizado para zipCode
        shipping_city: unseal3(meta.address.shipping_city || ""),
        shipping_state: unseal3(meta.address.shipping_state || "")
      };
    }
    return {
      ...draft,
      metadataJson: JSON.stringify({
        ...meta,
        discountValue: safeNumber(draft.discountValue),
        shippingValue: safeNumber(draft.shippingValue)
      }),
      items: items.map((it) => ({ ...it, unitPrice: safeNumber(it.unitPrice) }))
    };
  },
  async updateItem(itemId, data) {
    const db2 = await getDb();
    const updatePayload = {};
    if (data.quantity !== void 0) updatePayload.quantity = data.quantity;
    if (data.unitPrice !== void 0) updatePayload.unitPrice = String(safeNumber(data.unitPrice).toFixed(2));
    if (Object.keys(updatePayload).length === 0) return { success: false };
    await db2.update(adminOrderDraftItems).set(updatePayload).where(eq33(adminOrderDraftItems.id, itemId));
    return { success: true };
  },
  async applyLoyalty(draftId, pointsRequested) {
    const db2 = await getDb();
    const [settings] = await db2.select().from(loyaltySettings).limit(1);
    const [draft] = await db2.select().from(adminOrderDrafts).where(eq33(adminOrderDrafts.id, draftId)).limit(1);
    if (!draft) throw new TRPCError22({ code: "NOT_FOUND", message: "Rascunho n\xE3o encontrado." });
    if (!settings?.enabled) throw new TRPCError22({ code: "BAD_REQUEST", message: "Programa de fidelidade desativado." });
    const items = await db2.select().from(adminOrderDraftItems).where(eq33(adminOrderDraftItems.draftId, draftId));
    const subtotal = items.reduce((acc, it) => acc + safeNumber(it.unitPrice) * (it.quantity || 0), 0);
    const ptsToUse = Math.max(0, safeNumber(pointsRequested));
    const ratePoints = safeNumber(settings.redemptionRatePoints, 100);
    const rateMoney = safeNumber(settings.redemptionRateMoney, 1);
    const pointValueUnit = rateMoney / ratePoints;
    const discountAmount = safeNumber((ptsToUse * pointValueUnit).toFixed(2));
    if (discountAmount > subtotal) {
      throw new TRPCError22({ code: "BAD_REQUEST", message: "Desconto de pontos n\xE3o pode ser maior que o total dos itens." });
    }
    const meta = safeJsonParse(draft.metadataJson, {});
    const currentCouponValue = safeNumber(meta.couponValue);
    const currentPaymentDiscount = safeNumber(meta.paymentDiscountValue);
    const totalDiscountSum = (currentCouponValue + discountAmount + currentPaymentDiscount).toFixed(2);
    const updatedMeta = {
      ...meta,
      loyaltyPointsUsed: ptsToUse,
      loyaltyValue: discountAmount,
      discountSource: "loyalty"
    };
    await db2.update(adminOrderDrafts).set({
      metadataJson: JSON.stringify(updatedMeta),
      discountValue: totalDiscountSum,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq33(adminOrderDrafts.id, draftId));
    return { success: true, discountAmount, pointsUsed: ptsToUse };
  },
  async removeLoyalty(draftId) {
    const db2 = await getDb();
    const [draft] = await db2.select().from(adminOrderDrafts).where(eq33(adminOrderDrafts.id, draftId)).limit(1);
    if (!draft) return { success: false };
    const meta = safeJsonParse(draft.metadataJson, {});
    const { ...rest } = meta;
    delete rest.loyaltyPointsUsed;
    delete rest.loyaltyValue;
    const currentCouponValue = safeNumber(meta.couponValue);
    const currentPaymentDiscount = safeNumber(meta.paymentDiscountValue);
    await db2.update(adminOrderDrafts).set({
      metadataJson: JSON.stringify({ ...rest, loyaltyPointsUsed: 0, loyaltyValue: 0 }),
      discountValue: (currentCouponValue + currentPaymentDiscount).toFixed(2),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq33(adminOrderDrafts.id, draftId));
    return { success: true };
  },
  async addItem(input) {
    const db2 = await getDb();
    const finalOptions = input.options || "{}";
    await db2.insert(adminOrderDraftItems).values({
      id: uuidv43(),
      draftId: input.draftId,
      dishId: input.dishId ? String(input.dishId) : null,
      packageId: input.packageId ? String(input.packageId) : null,
      name: input.name,
      unitPrice: String(safeNumber(input.unitPrice).toFixed(2)),
      quantity: input.quantity || 1,
      options: finalOptions,
      appliedNutrition: input.applied_nutrition || null
    });
    return { success: true };
  },
  async removeItem(itemId) {
    const db2 = await getDb();
    await db2.delete(adminOrderDraftItems).where(eq33(adminOrderDraftItems.id, itemId));
    return { success: true };
  },
  async cancelSession(draftId) {
    const db2 = await getDb();
    await db2.transaction(async (tx) => {
      await tx.delete(adminOrderDraftItems).where(eq33(adminOrderDraftItems.draftId, draftId));
      await tx.delete(adminOrderDrafts).where(eq33(adminOrderDrafts.id, draftId));
    });
    return { success: true };
  },
  async applyCoupon(draftId, code) {
    const db2 = await getDb();
    const [coupon] = await db2.select().from(coupons).where(eq33(coupons.code, code.toUpperCase().trim())).limit(1);
    if (!coupon) throw new TRPCError22({ code: "NOT_FOUND", message: "Cupom n\xE3o encontrado." });
    if (!coupon.isActive) throw new TRPCError22({ code: "BAD_REQUEST", message: "Cupom inativo." });
    const [draft] = await db2.select().from(adminOrderDrafts).where(eq33(adminOrderDrafts.id, draftId)).limit(1);
    if (!draft) throw new TRPCError22({ code: "NOT_FOUND", message: "Rascunho n\xE3o encontrado." });
    const meta = safeJsonParse(draft.metadataJson, {});
    const updatedMeta = { ...meta, couponCode: coupon.code, discountSource: "coupon" };
    await db2.update(adminOrderDrafts).set({ metadataJson: JSON.stringify(updatedMeta), updatedAt: /* @__PURE__ */ new Date() }).where(eq33(adminOrderDrafts.id, draftId));
    return {
      success: true,
      coupon: { code: coupon.code, type: coupon.discountType, value: safeNumber(coupon.discountValue) }
    };
  },
  async listPackages(input) {
    const db2 = await getDb();
    const offset = (input.page - 1) * input.perPage;
    const whereClause = and9(
      eq33(packages.status, "active"),
      input.search ? like5(packages.name, `%${input.search}%`) : void 0
    );
    const data = await db2.select().from(packages).where(whereClause).limit(input.perPage).offset(offset);
    const [totalRes] = await db2.select({ count: sql17`count(*)` }).from(packages).where(whereClause);
    return {
      data: data.map((p) => ({ ...p, price: safeNumber(p.price) })),
      total: safeNumber(totalRes?.count)
    };
  }
};

// server/routers/admin/orders/AdminOrderFinalizeService.ts
init_db();
init_encryption();
init_schema();
import { eq as eq34, sql as sql18 } from "drizzle-orm";
import { TRPCError as TRPCError23 } from "@trpc/server";
var AdminOrderFinalizeService = {
  async finalize(draftId) {
    const db2 = await getDb();
    const [draft] = await db2.select().from(adminOrderDrafts).where(eq34(adminOrderDrafts.id, draftId)).limit(1);
    const items = await db2.select().from(adminOrderDraftItems).where(eq34(adminOrderDraftItems.draftId, draftId));
    if (!draft || !items.length) {
      throw new TRPCError23({ code: "BAD_REQUEST", message: "Carrinho vazio ou n\xE3o encontrado." });
    }
    const meta = safeJsonParse(draft.metadataJson, {});
    const snap = safeJsonParse(draft.discountsSnapshot, {});
    const addr = meta.address || {};
    const editingOrderId = typeof meta.editingOrderId === "string" ? meta.editingOrderId : "";
    const paymentStatus = meta.paymentStatus === "paid" ? "paid" : "pending";
    const notes = typeof meta.notes === "string" ? meta.notes : "";
    const orderDate = typeof meta.orderDate === "string" || typeof meta.orderDate === "number" ? meta.orderDate : null;
    const subtotal = items.reduce((acc, it) => acc + safeNumber(it.unitPrice) * (it.quantity || 1), 0);
    const orderId = generateFriendlyOrderId();
    await db2.transaction(async (tx) => {
      if (editingOrderId) {
        await tx.update(orders).set({
          status: "cancelled",
          notes: sql18`CONCAT(COALESCE(${orders.notes}, ''), ' | Substituído pelo: ', ${orderId})`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq34(orders.id, editingOrderId));
      }
      const newOrder = {
        id: orderId,
        userId: draft.userId || "admin_system",
        status: paymentStatus === "paid" ? "preparing" : "pending",
        // ✅ REMOVIDO: 'origin' (não existe no schema)
        paymentMethod: String(meta.paymentMethod || snap.paymentMethodName || "Presencial"),
        paymentStatus,
        notes,
        subtotal: subtotal.toFixed(2),
        total: (subtotal + safeNumber(draft.shippingValue) - safeNumber(draft.discountValue)).toFixed(2),
        shippingCost: safeNumber(draft.shippingValue).toFixed(2),
        totalDiscount: safeNumber(draft.discountValue).toFixed(2),
        customerName: encrypt(unseal3(meta.customer?.name || "") || "Cliente PDV"),
        customerPhone: encrypt(unseal3(meta.customer?.phone || "") || ""),
        shippingAddress: encrypt(unseal3(addr.shipping_address || "") || "Venda Presencial"),
        shippingAddressNumber: encrypt(unseal3(addr.shipping_address_number || "") || ""),
        shippingAddressComplement: encrypt(unseal3(addr.shipping_address_complement || "") || ""),
        shippingNeighborhood: encrypt(unseal3(addr.shipping_neighborhood || "") || ""),
        shippingCity: unseal3(addr.shipping_city || ""),
        shippingState: unseal3(addr.shipping_state || ""),
        shippingZipCode: unseal3(addr.zipCode || addr.shipping_zip_code || ""),
        discountsSnapshot: draft.discountsSnapshot,
        createdAt: orderDate ? new Date(orderDate) : /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      await tx.insert(orders).values(newOrder);
      for (const it of items) {
        const qty = it.quantity ?? 1;
        const newItem = {
          id: it.id,
          orderId,
          dishId: it.dishId,
          packageId: it.packageId,
          dishName: encrypt(it.name || "Item") || "Item",
          unitPrice: String(it.unitPrice),
          quantity: qty,
          options: it.options,
          appliedNutrition: it.appliedNutrition,
          totalPrice: (safeNumber(it.unitPrice) * qty).toFixed(2)
        };
        await tx.insert(orderItems).values(newItem);
      }
      if (draft.userId) {
        const pointsUsed = safeNumber(meta.loyaltyPointsUsed);
        const pointsEarned = Math.floor(subtotal);
        await tx.execute(sql18`
          UPDATE users 
          SET loyalty_balance = GREATEST(COALESCE(loyalty_balance, 0) - ${pointsUsed} + ${pointsEarned}, 0)
          WHERE id = ${draft.userId}
        `);
      }
      await tx.delete(adminOrderDraftItems).where(eq34(adminOrderDraftItems.draftId, draftId));
      await tx.delete(adminOrderDrafts).where(eq34(adminOrderDrafts.id, draftId));
    });
    return { success: true, orderId };
  }
};

// server/routers/admin/orders/OrderManagerService.ts
init_db();
init_schema();
import { eq as eq35, and as and10, sql as sql19, isNull, lt, desc as desc15, inArray as inArray5 } from "drizzle-orm";
import { randomUUID as randomUUID2 } from "crypto";
function getNumericOrderId2(orderId) {
  const onlyNumbers = orderId.replace(/\D/g, "");
  if (onlyNumbers.length > 0 && onlyNumbers.length < 10) return safeNumber(onlyNumbers);
  let hash5 = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash5 = (hash5 << 5) - hash5 + orderId.charCodeAt(i);
    hash5 |= 0;
  }
  return Math.abs(hash5);
}
var OrderManagerService = {
  /**
   * 📋 LISTAGEM DE PEDIDOS COM DESCRIPTOGRAFIA
   */
  async listOrders(input) {
    const db2 = await getDb();
    const offset = (input.page - 1) * input.perPage;
    const data = await db2.select().from(orders).limit(input.perPage).offset(offset).orderBy(desc15(orders.createdAt));
    const [totalRes] = await db2.select({
      count: sql19`count(*)`
    }).from(orders);
    return {
      data: data.map((order) => ({
        ...order,
        customerName: unseal3(order.customerName),
        customerPhone: unseal3(order.customerPhone)
      })),
      total: safeNumber(totalRes?.count)
    };
  },
  /**
   * 🔍 DETALHES COMPLETOS DO PEDIDO (INCLUINDO INGREDIENTES)
   */
  async getById(id) {
    const db2 = await getDb();
    const [order] = await db2.select().from(orders).where(eq35(orders.id, id)).limit(1);
    if (!order) return null;
    const itemsData = await db2.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      dishId: orderItems.dishId,
      name: orderItems.dishName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      options: orderItems.options,
      appliedNutrition: orderItems.appliedNutrition,
      mainDishIngredients: sql19`(SELECT ingredients FROM dishes WHERE dishes.id = ${orderItems.dishId} LIMIT 1)`
    }).from(orderItems).where(eq35(orderItems.orderId, id));
    const accompanimentIds = /* @__PURE__ */ new Set();
    itemsData.forEach((item) => {
      try {
        const opts = typeof item.options === "string" ? safeJsonParse(item.options, {}) : safeJsonParse(item.options, {});
        if (opts?.accompaniments && Array.isArray(opts.accompaniments)) {
          opts.accompaniments.forEach((acc) => {
            if (acc.id) accompanimentIds.add(safeNumber(acc.id));
          });
        }
      } catch {
      }
    });
    const accompMap = /* @__PURE__ */ new Map();
    if (accompanimentIds.size > 0) {
      const accompData = await db2.select({
        id: accompanimentOptions.id,
        name: accompanimentOptions.name,
        ingredients: accompanimentOptions.ingredients
      }).from(accompanimentOptions).where(inArray5(accompanimentOptions.id, Array.from(accompanimentIds)));
      accompData.forEach((acc) => {
        const text19 = acc.ingredients ? `${acc.name} (${acc.ingredients})` : acc.name;
        accompMap.set(acc.id, text19);
      });
    }
    return {
      ...order,
      customerName: unseal3(order.customerName),
      customerPhone: unseal3(order.customerPhone),
      items: itemsData.map((item) => {
        let accompText = "";
        try {
          const opts = typeof item.options === "string" ? safeJsonParse(item.options, {}) : safeJsonParse(item.options, {});
          if (opts?.accompaniments && Array.isArray(opts.accompaniments)) {
            accompText = opts.accompaniments.map((acc) => accompMap.get(safeNumber(acc.id))).filter((val) => Boolean(val)).join(", ");
          }
        } catch {
        }
        return {
          ...item,
          ingredients: item.mainDishIngredients || "",
          accompaniments_ingredients: accompText || "",
          applied_nutrition: item.appliedNutrition
        };
      })
    };
  },
  /**
   * 🔄 ATUALIZAR STATUS E DISPARAR ANALYTICS
   */
  async updateStatus(id, status) {
    const db2 = await getDb();
    const result = await db2.update(orders).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq35(orders.id, id));
    if (status === "completed" || status === "concluded") {
      try {
        await enqueueBIAnalyticsJob(id, {
          removeOnComplete: true,
          attempts: 3,
          backoff: 5e3
        });
      } catch (err) {
        console.error("[BI-ANALYTICS] Erro ao disparar fila:", err);
      }
    }
    if (status === "cancelled") {
      const numericId = getNumericOrderId2(id.replace("#", ""));
      if (!isNaN(numericId)) {
        await db2.delete(biSalesFacts).where(eq35(biSalesFacts.orderId, numericId));
        await db2.delete(biFinancialFacts).where(eq35(biFinancialFacts.orderId, numericId));
      }
    }
    return result;
  },
  /**
   * ❌ EXCLUSÃO DE PEDIDO COM ESTORNO DE PONTOS E LIMPEZA DE BI
   */
  async delete(id) {
    const db2 = await getDb();
    const cleanId = id.replace("#", "");
    const numericId = getNumericOrderId2(cleanId);
    return await db2.transaction(async (tx) => {
      const historyEntries = await tx.select().from(loyaltyHistory).where(eq35(loyaltyHistory.orderId, cleanId));
      for (const entry of historyEntries) {
        const refundAmount = -safeNumber(entry.pointsChange);
        if (refundAmount === 0) continue;
        await tx.insert(loyaltyHistory).values({
          id: randomUUID2(),
          userId: entry.userId,
          orderId: cleanId,
          pointsChange: refundAmount,
          type: refundAmount > 0 ? "refund_redeem" : "refund_earned",
          reason: "Pedido Exclu\xEDdo (Admin)",
          description: `Estorno autom\xE1tico: Pedido #${cleanId} removido`,
          createdAt: /* @__PURE__ */ new Date()
        });
        await tx.update(users).set({ availablePoints: sql19`${users.availablePoints} + ${refundAmount}` }).where(eq35(users.id, entry.userId));
      }
      if (!isNaN(numericId)) {
        await tx.delete(biSalesFacts).where(eq35(biSalesFacts.orderId, numericId));
        await tx.delete(biFinancialFacts).where(eq35(biFinancialFacts.orderId, numericId));
      }
      await tx.delete(orderItems).where(eq35(orderItems.orderId, cleanId));
      await tx.delete(orders).where(eq35(orders.id, cleanId));
      return { success: true };
    });
  },
  /**
   * 🛒 BUSCA CARRINHOS ABANDONADOS COM ITENS
   */
  async getAbandonedCarts() {
    const db2 = await getDb();
    const result = await db2.select({
      id: carts.id,
      customerName: users.name,
      customerPhone: users.phone,
      updatedAt: carts.updatedAt,
      subtotal: sql19`SUM(${cartItems.unitPrice} * ${cartItems.quantity})`,
      itemCount: sql19`COUNT(${cartItems.id})`
    }).from(carts).leftJoin(users, eq35(carts.userId, users.id)).innerJoin(cartItems, eq35(cartItems.cartId, carts.id)).where(eq35(carts.status, "active")).groupBy(carts.id).orderBy(desc15(carts.updatedAt)).limit(50);
    return result.map((cart) => ({
      ...cart,
      customerName: unseal3(cart.customerName) || "Visitante An\xF4nimo",
      customerPhone: unseal3(cart.customerPhone),
      total: safeNumber(cart.subtotal)
    }));
  },
  /**
   * 🔍 1. LISTA CARRINHOS ANTIGOS E VAZIOS
   * Usado pelo .query() no router para renderizar o painel sem dar erro.
   */
  async getEmptyOldCarts() {
    const db2 = await getDb();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3);
    return db2.select({ id: carts.id }).from(carts).leftJoin(cartItems, eq35(cartItems.cartId, carts.id)).where(and10(
      isNull(cartItems.id),
      eq35(carts.status, "active"),
      lt(carts.updatedAt, oneDayAgo)
    )).groupBy(carts.id).limit(500);
  },
  /**
   * 🧹 2. DELETA CARRINHOS ANTIGOS E VAZIOS
   * Usado pelo .mutation() no router quando você clica em "Limpar"
   */
  async clearEmptyOldCarts() {
    const db2 = await getDb();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3);
    await db2.delete(carts).where(
      and10(
        eq35(carts.status, "active"),
        lt(carts.updatedAt, oneDayAgo),
        sql19`NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_items.cart_id = ${carts.id})`
      )
    );
    return { success: true };
  },
  /**
   * 🗑️ EXCLUSÃO EM MASSA DE CARRINHOS
   */
  async bulkDeleteCarts(ids) {
    if (!ids.length) return { success: true, count: 0 };
    const db2 = await getDb();
    await db2.delete(carts).where(inArray5(carts.id, ids));
    return { success: true, count: ids.length };
  }
};

// server/routers/admin/orders/services/PagSeguroService.ts
import axios from "axios";
var PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN;
var API_URL = "https://api.pagseguro.com/checkouts";
var PagSeguroService = {
  async createPaymentLink(order) {
    const payload = {
      reference_id: order.id,
      customer: {
        name: order.customerName,
        // Lembre-se de descriptografar antes de enviar
        phone: { number: order.customerPhone.replace(/\D/g, "") }
      },
      items: [
        {
          reference_id: "PEDIDO_" + order.id,
          name: "Pedido Gourmet Saud\xE1vel",
          quantity: 1,
          unit_amount: Math.round(safeNumber(order.total) * 100)
          // PagSeguro usa centavos (inteiro)
        }
      ],
      payment_methods: [
        { type: "CREDIT_CARD" },
        { type: "PIX" },
        { type: "BOLETO" }
      ],
      redirect_url: "https://gourmetsaudavel.com/meus-pedidos"
    };
    const response = await axios.post(API_URL, payload, {
      headers: {
        "Authorization": `Bearer ${PAGSEGURO_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    return response.data.links.find((l) => l.rel === "PAY")?.href;
  }
};

// server/routers/admin/orders/ordersAdminRouter.ts
init_encryption();
init_db();
init_schema();
import { eq as eq36, sql as sql20, desc as desc16 } from "drizzle-orm";
import { TRPCError as TRPCError24 } from "@trpc/server";
var ordersAdminRouter = router({
  /**
   * 📋 LISTAGEM DE PEDIDOS
   */
  list: adminProcedure.input(z28.object({
    search: z28.string().optional(),
    status: z28.string().optional(),
    page: z28.number().default(1),
    perPage: z28.number().default(10)
  })).query(async ({ input }) => {
    const result = await OrderManagerService.listOrders(input);
    return {
      orders: result.data,
      meta: {
        totalItems: result.total,
        totalPages: Math.ceil(result.total / input.perPage),
        currentPage: input.page
      }
    };
  }),
  /**
   * 🔍 DETALHES DO PEDIDO
   */
  getById: adminProcedure.input(z28.object({ orderId: z28.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const [order] = await db2.select().from(orders).where(eq36(orders.id, input.orderId)).limit(1);
    if (!order) throw new TRPCError24({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado." });
    const items = await db2.select().from(orderItems).where(eq36(orderItems.orderId, input.orderId));
    return {
      ...order,
      items: items.map((it) => ({ ...it, unitPrice: safeNumber(it.unitPrice) }))
    };
  }),
  /**
   * 🔄 ATUALIZAR STATUS
   */
  updateStatus: adminProcedure.input(z28.object({
    id: z28.string(),
    status: z28.string()
  })).mutation(async ({ input }) => {
    await OrderManagerService.updateStatus(input.id, input.status);
    return { success: true };
  }),
  /**
   * 🛒 CARRINHOS ABANDONADOS
   */
  getAbandonedCarts: adminProcedure.input(z28.object({
    page: z28.number().default(1),
    perPage: z28.number().default(10)
  }).optional()).query(async ({ input }) => {
    const db2 = await getDb();
    const page = input?.page || 1;
    const perPage = input?.perPage || 10;
    const offset = (page - 1) * perPage;
    const abandonedCarts = await db2.select({
      id: carts.id,
      userId: carts.userId,
      updatedAt: carts.updatedAt,
      customerName: users.name,
      customerEmail: users.email,
      itemCount: sql20`count(${cartItems.id})`
    }).from(carts).innerJoin(users, eq36(carts.userId, users.id)).leftJoin(cartItems, eq36(carts.id, cartItems.cartId)).where(sql20`${carts.updatedAt} < NOW() - INTERVAL 2 HOUR`).groupBy(carts.id, users.id).limit(perPage).offset(offset).orderBy(desc16(carts.updatedAt));
    return {
      carts: abandonedCarts.map((c) => ({
        ...c,
        customerName: c.customerName ? decrypt(c.customerName) || "Cliente" : "Cliente",
        customerEmail: c.customerEmail || "E-mail indispon\xEDvel"
      }))
    };
  }),
  /**
   * 📝 EDITAR PEDIDO
   */
  editOrder: adminProcedure.input(z28.object({ orderId: z28.string() })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    const adminId = ctx.user.id;
    const [orderResult] = await db2.select({ order: orders, customerName: users.name }).from(orders).leftJoin(users, eq36(users.id, orders.userId)).where(eq36(orders.id, input.orderId)).limit(1);
    if (!orderResult) throw new TRPCError24({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado." });
    const { order, customerName } = orderResult;
    const customerCleanName = customerName ? decrypt(customerName) || "Cliente" : "Cliente";
    let snap = {};
    if (order.discountsSnapshot) {
      try {
        const rawSnap = decrypt(order.discountsSnapshot);
        snap = safeJsonParse(rawSnap, {});
      } catch {
        snap = {};
      }
    }
    const items = await db2.select().from(orderItems).where(eq36(orderItems.orderId, input.orderId));
    const session = await AdminOrderDraftService.init(adminId);
    const pdvDraftId = session.id;
    await db2.delete(adminOrderDraftItems).where(eq36(adminOrderDraftItems.draftId, pdvDraftId));
    const snapTotals = snap.totals || {};
    await AdminOrderDraftService.update({
      draftId: pdvDraftId,
      userId: order.userId ? String(order.userId) : void 0,
      shippingValue: safeNumber(order.shippingCost),
      metadataJson: JSON.stringify({
        customer: order.userId ? { id: String(order.userId), name: customerCleanName } : null,
        address: {
          shipping_address: order.shippingAddress,
          shipping_address_number: order.shippingAddressNumber,
          shipping_neighborhood: order.shippingNeighborhood,
          shipping_city: order.shippingCity,
          shipping_state: order.shippingState,
          zipCode: order.shippingZipCode
        },
        deliveryMode: order.shippingCity ? "delivery" : "pickup",
        notes: order.notes || "",
        couponCode: snap.couponCode || null,
        couponValue: safeNumber(snapTotals.couponDiscount),
        loyaltyValue: safeNumber(snap.loyaltyValue),
        loyaltyPointsUsed: safeNumber(snap.pointsUsed),
        discountValue: safeNumber(order.totalDiscount),
        editingOrderId: order.id,
        discountsSnapshot: JSON.stringify(snap)
      })
    });
    for (const item of items) {
      await AdminOrderDraftService.addItem({
        draftId: pdvDraftId,
        dishId: item.dishId ? safeNumber(item.dishId) : void 0,
        packageId: item.packageId ? safeNumber(item.packageId) : void 0,
        name: item.dishName || "Item do Pedido",
        unitPrice: safeNumber(item.unitPrice),
        quantity: safeNumber(item.quantity),
        options: typeof item.options === "string" ? item.options : JSON.stringify(item.options || {}),
        applied_nutrition: item.appliedNutrition ? String(item.appliedNutrition) : void 0
      });
    }
    return { success: true, newDraftId: pdvDraftId };
  }),
  /**
   * ➕ ADICIONAR ITEM AO RASCUNHO
   */
  addItem: adminProcedure.input(z28.object({
    draftId: z28.string(),
    dishId: z28.coerce.number().nullish(),
    packageId: z28.coerce.number().nullish(),
    name: z28.string(),
    unitPrice: z28.number(),
    quantity: z28.number().default(1),
    options: z28.string().optional(),
    applied_nutrition: z28.string().optional()
  })).mutation(({ input }) => AdminOrderDraftService.addItem({
    ...input,
    dishId: input.dishId ?? void 0,
    packageId: input.packageId ?? void 0
  })),
  /**
   * 🏁 FINALIZAR PEDIDO MANUAL
   */
  placeOrder: adminProcedure.input(z28.object({ draftId: z28.string() })).mutation(({ input }) => AdminOrderFinalizeService.finalize(input.draftId)),
  /**
   * 💳 GERAR LINK DE PAGAMENTO
   */
  generatePaymentLink: adminProcedure.input(z28.object({ orderId: z28.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const [order] = await db2.select().from(orders).where(eq36(orders.id, input.orderId)).limit(1);
    if (!order) throw new TRPCError24({ code: "NOT_FOUND" });
    const orderForPayment = {
      ...order,
      customerName: order.customerName || "Cliente"
    };
    const link = await PagSeguroService.createPaymentLink(
      orderForPayment
    );
    if (!link) throw new TRPCError24({ code: "BAD_GATEWAY", message: "Erro ao gerar link de pagamento." });
    return { link };
  }),
  /**
   * 🔍 LISTAGEM DE CARRINHOS ANTIGOS (Usado pelo useQuery no Front para ler/contar)
   */
  getEmptyOldCarts: adminProcedure.query(async () => {
    return await OrderManagerService.getEmptyOldCarts();
  }),
  /**
   * 🧹 LIMPEZA DE CARRINHOS ANTIGOS (Usado pelo useMutation no Front no botão Limpar)
   */
  clearEmptyOldCarts: adminProcedure.mutation(async () => {
    return await OrderManagerService.clearEmptyOldCarts();
  }),
  /**
   * ❌ EXCLUIR PEDIDO
   */
  deleteOrder: adminProcedure.input(z28.object({ id: z28.string() })).mutation(async ({ input }) => {
    await OrderManagerService.delete(input.id);
    return { success: true };
  })
});

// server/routers/admin/shipping/shippingRules.ts
import { z as z29 } from "zod";
init_db();
init_schema();
import { eq as eq37, asc as asc11, or as or4, notLike, isNull as isNull2, and as and11, like as like6 } from "drizzle-orm";
var shippingRuleSchema = z29.object({
  id: z29.number().optional(),
  name: z29.string().min(1),
  price: z29.coerce.number().min(0),
  active: z29.boolean().default(true),
  type: z29.enum(["zipcode", "polygon", "circle"]),
  cepStart: z29.string().optional().nullable(),
  cepEnd: z29.string().optional().nullable(),
  polygonCoords: z29.string().optional().nullable(),
  storeSlug: z29.string().optional().default("default")
});
var shippingRulesRouter = router({
  getSettings: adminProcedure.query(async () => {
    const db2 = await getDb();
    const [s] = await db2.select().from(shippingSettings).limit(1);
    return s || {
      pickupEnabled: false,
      pickupLabel: "Retirada no Balc\xE3o",
      pickupInstruction: ""
    };
  }),
  updateSettings: adminProcedure.input(z29.object({
    pickupEnabled: z29.boolean().optional(),
    pickupLabel: z29.string().optional(),
    pickupInstruction: z29.string().optional()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const existing = await db2.select().from(shippingSettings).limit(1);
    if (existing.length === 0) {
      await db2.insert(shippingSettings).values({
        pickupEnabled: input.pickupEnabled ?? false,
        pickupLabel: input.pickupLabel ?? "Retirada no Balc\xE3o",
        pickupInstruction: input.pickupInstruction ?? ""
      });
    } else {
      await db2.update(shippingSettings).set({ ...input, updatedAt: /* @__PURE__ */ new Date() }).where(eq37(shippingSettings.id, existing[0].id));
    }
    return { success: true };
  }),
  /**
   * ✅ BUSCA REGRAS (Flexível: Loja Selecionada + Default)
   */
  getRules: adminProcedure.input(z29.object({ storeSlug: z29.string().optional().default("default") })).query(async ({ input }) => {
    const db2 = await getDb();
    return await db2.select({
      id: shippingZones.id,
      name: shippingZones.name,
      description: shippingZones.description,
      type: shippingZones.type,
      zipCodeStart: shippingZones.zipCodeStart,
      zipCodeEnd: shippingZones.zipCodeEnd,
      shippingCost: shippingZones.shippingCost,
      polygonCoords: shippingZones.polygonCoords,
      isActive: shippingZones.isActive,
      estimatedDays: shippingZones.estimatedDays,
      storeSlug: shippingZones.storeSlug
    }).from(shippingZones).where(
      and11(
        // 🟢 Filtro de Unidade: Carrega a selecionada OU registros 'default'
        or4(
          eq37(shippingZones.storeSlug, input.storeSlug),
          eq37(shippingZones.storeSlug, "default"),
          isNull2(shippingZones.storeSlug)
        ),
        // Filtro de Descrição: Evita poluir com CEPs individuais do radar
        or4(
          eq37(shippingZones.description, "Regra Mestra"),
          isNull2(shippingZones.description),
          notLike(shippingZones.description, "via pol\xEDgono:%")
        )
      )
    ).orderBy(asc11(shippingZones.name));
  }),
  /**
   * ✅ UPSERT: Cria ou Atualiza
   */
  createRule: adminProcedure.input(shippingRuleSchema).mutation(async ({ input }) => {
    const db2 = await getDb();
    const payload = {
      name: input.name,
      type: input.type,
      shippingCost: String(input.price),
      isActive: input.active,
      zipCodeStart: input.type === "zipcode" ? input.cepStart || "00000000" : "00000000",
      zipCodeEnd: input.type === "zipcode" ? input.cepEnd || "99999999" : "99999999",
      polygonCoords: input.polygonCoords,
      description: "Regra Mestra",
      storeSlug: input.storeSlug
    };
    if (input.id) {
      await db2.update(shippingZones).set({ ...payload, updatedAt: /* @__PURE__ */ new Date() }).where(eq37(shippingZones.id, input.id));
    } else {
      await db2.insert(shippingZones).values(payload);
    }
    return { success: true };
  }),
  deleteRule: adminProcedure.input(z29.object({ id: z29.number() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const [rule] = await db2.select().from(shippingZones).where(eq37(shippingZones.id, input.id)).limit(1);
    if (!rule) return { success: false, error: "Regra n\xE3o encontrada" };
    await db2.delete(shippingZones).where(eq37(shippingZones.id, input.id));
    await db2.delete(shippingZones).where(like6(shippingZones.description, `via pol\xEDgono: ${rule.name}%`));
    return { success: true };
  })
});

// server/routers/admin/shipping/shippingMesh.ts
import { z as z30 } from "zod";
init_db();
init_schema();
init_encryption();
import { eq as eq38, sql as sql21, like as like7, and as and12, inArray as inArray6 } from "drizzle-orm";
function calculateDistance(p1, p2) {
  const R = 6371e3;
  const dLat = (Number(p2.lat) - Number(p1.lat)) * Math.PI / 180;
  const dLon = (Number(p2.lng) - Number(p1.lng)) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Number(p1.lat) * Math.PI / 180) * Math.cos(Number(p2.lat) * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function isPointInPolygon(point, polygon) {
  let inside = false;
  const { lat, lng } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i].lat), yi = Number(polygon[i].lng);
    const xj = Number(polygon[j].lat), yj = Number(polygon[j].lng);
    const intersect = yi > lng !== yj > lng && lat < (xj - xi) * (lng - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
async function processCityScan(storeSlug, cidade) {
  const db2 = await getDb();
  const queryBase = sql21`SELECT * FROM base_ceps WHERE cidade = ${cidade}`;
  const resultBase = await db2.execute(queryBase);
  const rawRows = resultBase[0] || resultBase;
  const cepsDaCidade = Array.isArray(rawRows) ? rawRows : [];
  if (cepsDaCidade.length === 0) return { totalLidos: 0, totalNaMalha: 0 };
  const rules = await db2.select().from(shippingZones).where(and12(eq38(shippingZones.storeSlug, storeSlug), eq38(shippingZones.isActive, true)));
  const cepsParaInserir = [];
  for (const item of cepsDaCidade) {
    const point = { lat: Number(item.lat), lng: Number(item.lng) };
    if (!point.lat || !point.lng) continue;
    for (const rule of rules) {
      if (!rule.polygonCoords) continue;
      const geoData = typeof rule.polygonCoords === "string" ? JSON.parse(rule.polygonCoords) : rule.polygonCoords;
      let isInside = false;
      if (rule.type === "circle" && geoData.center) {
        isInside = calculateDistance(point, geoData.center) <= Number(geoData.radius);
      } else if (rule.type === "polygon" && Array.isArray(geoData)) {
        isInside = isPointInPolygon(point, geoData);
      }
      if (isInside) {
        cepsParaInserir.push({
          zipCode: String(item.cep).replace(/\D/g, ""),
          city: item.cidade,
          neighborhood: item.bairro || "N\xE3o Informado",
          lat: String(item.lat),
          lng: String(item.lng),
          price: String(rule.shippingCost || 0),
          storeSlug,
          lastSeen: /* @__PURE__ */ new Date()
        });
        break;
      }
    }
  }
  await db2.transaction(async (tx) => {
    await tx.execute(sql21`DELETE FROM geo_mesh WHERE store_slug = ${storeSlug} AND city = ${cidade}`);
    if (cepsParaInserir.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < cepsParaInserir.length; i += chunkSize) {
        await tx.insert(geoMesh).values(cepsParaInserir.slice(i, i + chunkSize));
      }
    }
  });
  return { totalLidos: cepsDaCidade.length, totalNaMalha: cepsParaInserir.length };
}
var shippingMeshRouter = router({
  bindOperativeCity: adminProcedure.input(z30.object({
    rows: z30.array(z30.object({
      cep: z30.string(),
      cidade: z30.string(),
      bairro: z30.string().optional(),
      lat: z30.string().or(z30.number()),
      lng: z30.string().or(z30.number())
    }))
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    let count6 = 0;
    await db2.transaction(async (tx) => {
      for (const item of input.rows) {
        const cleanLat = parseFloat(String(item.lat)).toFixed(6);
        const cleanLng = parseFloat(String(item.lng)).toFixed(6);
        if (isNaN(Number(cleanLat)) || isNaN(Number(cleanLng))) continue;
        await tx.execute(sql21`
            INSERT INTO base_ceps (cep, cidade, bairro, lat, lng) 
            VALUES (${item.cep.replace(/\D/g, "")}, ${item.cidade}, ${item.bairro || "Centro"}, ${cleanLat}, ${cleanLng})
            ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng)
          `);
        count6++;
      }
    });
    return { success: true, count: count6 };
  }),
  deleteImportedCity: adminProcedure.input(z30.object({ cidade: z30.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.execute(sql21`DELETE FROM base_ceps WHERE cidade = ${input.cidade}`);
    await db2.execute(sql21`DELETE FROM geo_mesh WHERE city = ${input.cidade}`);
    return { success: true };
  }),
  getImportedCities: adminProcedure.query(async () => {
    const db2 = await getDb();
    const result = await db2.execute(sql21`SELECT DISTINCT cidade FROM base_ceps ORDER BY cidade ASC`);
    const rows = result[0] || result;
    return rows.map((row) => row.cidade);
  }),
  /**
   * 🔄 SINCRONIZAÇÃO TOTAL (Cidades x Desenhos)
   */
  syncMeshWithRules: adminProcedure.mutation(async () => {
    const db2 = await getDb();
    const storeConfigs = await db2.select().from(appConfigs).where(like7(appConfigs.configKey, "store_address_%"));
    let total = 0;
    const resultCities = await db2.execute(sql21`SELECT DISTINCT cidade FROM base_ceps`);
    const cepsCities = resultCities[0] || resultCities;
    for (const config of storeConfigs) {
      try {
        const slug = config.configKey.replace("store_address_", "");
        for (const row of cepsCities) {
          const res = await processCityScan(slug, row.cidade);
          total += res.totalNaMalha;
        }
      } catch (err) {
        logger.error({ err }, "Erro ao sincronizar unidade de malha log\xEDstica");
      }
    }
    return { insertedCount: total };
  }),
  listStores: adminProcedure.query(async () => {
    const db2 = await getDb();
    const configs = await db2.select().from(appConfigs).where(like7(appConfigs.configKey, "store_address_%"));
    return configs.map((config) => {
      try {
        const slug = config.configKey.replace("store_address_", "");
        const decrypted = decrypt(config.configValue || "");
        const parsed = JSON.parse(decrypted || "{}");
        return { slug, name: parsed.companyName || slug.toUpperCase() };
      } catch {
        return null;
      }
    }).filter(Boolean);
  }),
  getStoreBase: adminProcedure.input(z30.object({ storeSlug: z30.string().default("default") })).query(async ({ input }) => {
    const db2 = await getDb();
    const configs = await db2.select().from(appConfigs).where(inArray6(appConfigs.configKey, [`store_address_${input.storeSlug}`, `store_pickup_${input.storeSlug}`]));
    const result = {
      companyName: "",
      address: "",
      lat: 0,
      lng: 0,
      allowedCities: [],
      pickupEnabled: false,
      pickupLabel: "",
      pickupInstruction: "",
      minOrderValue: 0,
      minOrderMessage: ""
    };
    for (const config of configs) {
      try {
        const decrypted = decrypt(config.configValue || "");
        const parsed = JSON.parse(decrypted || "{}");
        if (config.configKey.includes("address")) {
          Object.assign(result, parsed);
        } else {
          result.pickupEnabled = !!parsed.pickupEnabled;
          result.pickupLabel = parsed.pickupLabel || "";
          result.pickupInstruction = parsed.pickupInstruction || "";
        }
      } catch {
      }
    }
    return result;
  }),
  updateStoreLocation: adminProcedure.input(z30.object({
    storeSlug: z30.string(),
    companyName: z30.string(),
    address: z30.string().optional().default(""),
    lat: z30.number().optional().default(0),
    lng: z30.number().optional().default(0),
    allowedCities: z30.array(z30.string()).optional().default([]),
    pickupEnabled: z30.boolean(),
    pickupLabel: z30.string(),
    pickupInstruction: z30.string(),
    minOrderValue: z30.number().optional().default(0),
    minOrderMessage: z30.string().optional().default("")
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const addressData = {
      companyName: input.companyName,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      allowedCities: input.allowedCities,
      minOrderValue: input.minOrderValue,
      minOrderMessage: input.minOrderMessage
    };
    const encryptedAddress = encrypt(JSON.stringify(addressData));
    const pickupData = {
      pickupEnabled: input.pickupEnabled,
      pickupLabel: input.pickupLabel,
      pickupInstruction: input.pickupInstruction
    };
    const encryptedPickup = encrypt(JSON.stringify(pickupData));
    await db2.transaction(async (tx) => {
      await tx.insert(appConfigs).values({ configKey: `store_address_${input.storeSlug}`, configValue: encryptedAddress }).onDuplicateKeyUpdate({ set: { configValue: encryptedAddress, updatedAt: /* @__PURE__ */ new Date() } });
      await tx.insert(appConfigs).values({ configKey: `store_pickup_${input.storeSlug}`, configValue: encryptedPickup }).onDuplicateKeyUpdate({ set: { configValue: encryptedPickup, updatedAt: /* @__PURE__ */ new Date() } });
    });
    return { success: true };
  }),
  getMesh: adminProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select().from(geoMesh).limit(1e3);
  })
});

// server/routers/admin/api.ts
import { randomBytes as randomBytes2 } from "node:crypto";
init_schema();
init_analytics();
init_encryption();
import { z as z31 } from "zod";
import { desc as desc17, eq as eq39, gte as gte3, lte as lte2, and as and13, sql as sql22, count as count4, sum as sum2 } from "drizzle-orm";
function createIntegrationToken() {
  return `gia_${randomBytes2(24).toString("hex")}`;
}
function parseDateRange(input) {
  const start = input.start ? new Date(input.start) : (() => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();
  const end = input.end ? new Date(input.end) : /* @__PURE__ */ new Date();
  return { start, end };
}
var dateRangeInput = z31.object({
  start: z31.string().optional(),
  // ISO date, ex: "2024-01-01"
  end: z31.string().optional()
}).optional();
var adminApiRouter = router({
  // ══════════════════════════════════════════════════════════════
  // 🔑 TOKEN — geração pelo admin, leitura pelo sistema interno
  // ══════════════════════════════════════════════════════════════
  generateToken: adminProcedure.mutation(async ({ ctx }) => {
    const token = createIntegrationToken();
    const encryptedToken = encrypt(token) || token;
    await ctx.db.insert(appConfigs).values({ configKey: "BRIDGE_TOKEN", configValue: encryptedToken }).onDuplicateKeyUpdate({ set: { configValue: encryptedToken, updatedAt: /* @__PURE__ */ new Date() } });
    return {
      token,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      message: "Nova chave do GourmetIA Bridge gerada. Atualize o servi\xE7o externo para usar o token atual."
    };
  }),
  // ══════════════════════════════════════════════════════════════
  // 📦 CATÁLOGO — leitura pelo app Python
  // ══════════════════════════════════════════════════════════════
  /**
   * GET /trpc/admin.api.catalog
   * Retorna cardápio completo com macros e categorias.
   * Fonte principal para o SmartGenerator Python.
   */
  catalog: internalProcedure.query(async ({ ctx }) => {
    const dishRows = await ctx.db.select({
      id: dishes.id,
      name: dishes.name,
      categoryId: dishes.categoryId,
      category: categories.name,
      price: dishes.basePrice,
      isActive: dishes.isActive,
      energyKcal: dishes.energyKcal,
      proteins: dishes.proteins,
      carbs: dishes.carbs,
      fatTotal: dishes.fatTotal,
      fiber: dishes.fiber,
      sodium: dishes.sodium
    }).from(dishes).leftJoin(categories, eq39(dishes.categoryId, categories.id)).where(eq39(dishes.isActive, true)).orderBy(dishes.name);
    return dishRows.map((d) => ({
      ...d,
      id: Number(d.id),
      categoryId: d.categoryId ? Number(d.categoryId) : null,
      price: Number(d.price ?? 0),
      energyKcal: Number(d.energyKcal ?? 0),
      proteins: Number(d.proteins ?? 0),
      carbs: Number(d.carbs ?? 0),
      fatTotal: Number(d.fatTotal ?? 0),
      fiber: Number(d.fiber ?? 0),
      sodium: Number(d.sodium ?? 0)
    }));
  }),
  /**
   * GET /trpc/admin.api.packages
   * Retorna pacotes ativos com estrutura de slots.
   */
  packages: internalProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select({
      id: packages.id,
      name: packages.name,
      price: packages.price,
      salePrice: packages.salePrice,
      isActive: packages.isActive,
      numberOfOptions: packages.numberOfOptions,
      config: packages.config
    }).from(packages).where(eq39(packages.isActive, true)).orderBy(packages.name);
    return rows.map((p) => ({
      ...p,
      price: Number(p.price ?? 0),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      config: typeof p.config === "string" ? JSON.parse(p.config) : p.config
    }));
  }),
  // ══════════════════════════════════════════════════════════════
  // 📊 VENDAS — BI de pedidos para o app Python
  // ══════════════════════════════════════════════════════════════
  /**
   * GET /trpc/admin.api.salesSummary
   * Resumo de vendas por período: total, ticket médio, quantidade.
   */
  salesSummary: internalProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { start, end } = parseDateRange(input ?? {});
    const [result] = await ctx.db.select({
      totalOrders: count4(orders.id),
      totalRevenue: sum2(orders.total),
      totalDiscount: sum2(orders.totalDiscount),
      totalShipping: sum2(orders.shippingCost)
    }).from(orders).where(
      and13(
        gte3(orders.createdAt, start),
        lte2(orders.createdAt, end),
        sql22`${orders.status} NOT IN ('cancelled')`
      )
    );
    const totalRev = Number(result.totalRevenue ?? 0);
    const totalOrd = Number(result.totalOrders ?? 0);
    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      totalOrders: totalOrd,
      totalRevenue: totalRev,
      totalDiscount: Number(result.totalDiscount ?? 0),
      totalShipping: Number(result.totalShipping ?? 0),
      averageTicket: totalOrd > 0 ? +(totalRev / totalOrd).toFixed(2) : 0
    };
  }),
  /**
   * GET /trpc/admin.api.salesByDay
   * Vendas agrupadas por dia — ideal para gráfico de série temporal.
   */
  salesByDay: internalProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { start, end } = parseDateRange(input ?? {});
    const rows = await ctx.db.select({
      day: sql22`DATE(${orders.createdAt})`,
      orders: count4(orders.id),
      revenue: sum2(orders.total)
    }).from(orders).where(
      and13(
        gte3(orders.createdAt, start),
        lte2(orders.createdAt, end),
        sql22`${orders.status} NOT IN ('cancelled')`
      )
    ).groupBy(sql22`DATE(${orders.createdAt})`).orderBy(sql22`DATE(${orders.createdAt})`);
    return rows.map((r) => ({
      day: r.day,
      orders: Number(r.orders),
      revenue: Number(r.revenue ?? 0)
    }));
  }),
  /**
   * GET /trpc/admin.api.topDishes
   * Pratos mais vendidos no período com receita gerada.
   */
  topDishes: internalProcedure.input(z31.object({
    start: z31.string().optional(),
    end: z31.string().optional(),
    limit: z31.number().min(1).max(100).default(20)
  }).optional()).query(async ({ ctx, input }) => {
    const { start, end } = parseDateRange(input ?? {});
    const limit = input?.limit ?? 20;
    const rows = await ctx.db.select({
      dishId: orderItems.dishId,
      dishName: dishes.name,
      quantity: sum2(orderItems.quantity),
      revenue: sum2(orderItems.totalPrice)
    }).from(orderItems).leftJoin(orders, eq39(orderItems.orderId, orders.id)).leftJoin(dishes, eq39(orderItems.dishId, sql22`CAST(${dishes.id} AS CHAR)`)).where(
      and13(
        gte3(orders.createdAt, start),
        lte2(orders.createdAt, end),
        sql22`${orders.status} NOT IN ('cancelled')`
      )
    ).groupBy(orderItems.dishId, dishes.name).orderBy(desc17(sum2(orderItems.quantity))).limit(limit);
    return rows.map((r) => ({
      dishId: r.dishId,
      dishName: r.dishName ?? "Prato removido",
      quantity: Number(r.quantity ?? 0),
      revenue: Number(r.revenue ?? 0)
    }));
  }),
  /**
   * GET /trpc/admin.api.paymentMix
   * Distribuição de métodos de pagamento no período.
   */
  paymentMix: internalProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { start, end } = parseDateRange(input ?? {});
    const rows = await ctx.db.select({
      method: orders.paymentMethod,
      orders: count4(orders.id),
      revenue: sum2(orders.total)
    }).from(orders).where(
      and13(
        gte3(orders.createdAt, start),
        lte2(orders.createdAt, end),
        sql22`${orders.status} NOT IN ('cancelled')`
      )
    ).groupBy(orders.paymentMethod).orderBy(desc17(count4(orders.id)));
    return rows.map((r) => ({
      method: r.method,
      orders: Number(r.orders),
      revenue: Number(r.revenue ?? 0)
    }));
  }),
  // ══════════════════════════════════════════════════════════════
  // 💰 FINANCEIRO — margens, descontos, fidelidade
  // ══════════════════════════════════════════════════════════════
  /**
   * GET /trpc/admin.api.financialSummary
   * Consolidado financeiro: bruto, descontos por tipo, líquido.
   * Usa bi_financial_facts se populada, senão cai em orders direto.
   */
  financialSummary: internalProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { start, end } = parseDateRange(input ?? {});
    const [biFacts] = await ctx.db.select({
      grossTotal: sum2(biFinancialFacts.grossTotal),
      deliveryFee: sum2(biFinancialFacts.deliveryFee),
      discountCoupon: sum2(biFinancialFacts.discountCoupon),
      discountLoyalty: sum2(biFinancialFacts.discountLoyalty),
      discountAuto: sum2(biFinancialFacts.discountAuto),
      netTotal: sum2(biFinancialFacts.netTotal),
      orderCount: count4(biFinancialFacts.orderId)
    }).from(biFinancialFacts).where(
      and13(
        gte3(biFinancialFacts.createdAt, start),
        lte2(biFinancialFacts.createdAt, end)
      )
    );
    if (!biFacts.orderCount || Number(biFacts.orderCount) === 0) {
      const [fallback] = await ctx.db.select({
        grossTotal: sum2(orders.subtotal),
        netTotal: sum2(orders.total),
        discount: sum2(orders.totalDiscount),
        shipping: sum2(orders.shippingCost),
        loyalty: sum2(orders.loyaltyDiscount),
        orderCount: count4(orders.id)
      }).from(orders).where(
        and13(
          gte3(orders.createdAt, start),
          lte2(orders.createdAt, end),
          sql22`${orders.status} NOT IN ('cancelled')`
        )
      );
      return {
        source: "orders",
        period: { start: start.toISOString(), end: end.toISOString() },
        grossTotal: Number(fallback.grossTotal ?? 0),
        netTotal: Number(fallback.netTotal ?? 0),
        totalDiscount: Number(fallback.discount ?? 0),
        discountLoyalty: Number(fallback.loyalty ?? 0),
        deliveryFee: Number(fallback.shipping ?? 0),
        orderCount: Number(fallback.orderCount ?? 0)
      };
    }
    return {
      source: "bi_facts",
      period: { start: start.toISOString(), end: end.toISOString() },
      grossTotal: Number(biFacts.grossTotal ?? 0),
      netTotal: Number(biFacts.netTotal ?? 0),
      deliveryFee: Number(biFacts.deliveryFee ?? 0),
      discountCoupon: Number(biFacts.discountCoupon ?? 0),
      discountLoyalty: Number(biFacts.discountLoyalty ?? 0),
      discountAuto: Number(biFacts.discountAuto ?? 0),
      totalDiscount: Number(biFacts.discountCoupon ?? 0) + Number(biFacts.discountLoyalty ?? 0) + Number(biFacts.discountAuto ?? 0),
      orderCount: Number(biFacts.orderCount ?? 0)
    };
  }),
  // ══════════════════════════════════════════════════════════════
  // 👥 CLIENTES — comportamento e retenção
  // ══════════════════════════════════════════════════════════════
  /**
   * GET /trpc/admin.api.customerStats
   * Total de clientes, novos no período, recorrentes.
   */
  customerStats: internalProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { start, end } = parseDateRange(input ?? {});
    const [total] = await ctx.db.select({ count: count4(users.id) }).from(users);
    const [newUsers] = await ctx.db.select({ count: count4(users.id) }).from(users).where(
      and13(
        gte3(users.createdAt, start),
        lte2(users.createdAt, end)
      )
    );
    const [buyers] = await ctx.db.select({ count: sql22`COUNT(DISTINCT ${orders.userId})` }).from(orders).where(
      and13(
        gte3(orders.createdAt, start),
        lte2(orders.createdAt, end),
        sql22`${orders.status} NOT IN ('cancelled')`
      )
    );
    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      totalCustomers: Number(total.count),
      newInPeriod: Number(newUsers.count),
      buyersInPeriod: Number(buyers.count)
    };
  }),
  /**
   * GET /trpc/admin.api.loyaltySummary
   * Resumo do programa de fidelidade: pontos emitidos, resgatados, expirados.
   */
  loyaltySummary: internalProcedure.input(dateRangeInput).query(async ({ ctx, input }) => {
    const { start, end } = parseDateRange(input ?? {});
    const rows = await ctx.db.select({
      type: loyaltyHistory.type,
      total: sum2(loyaltyHistory.pointsChange),
      count: count4(loyaltyHistory.id)
    }).from(loyaltyHistory).where(
      and13(
        gte3(loyaltyHistory.createdAt, start),
        lte2(loyaltyHistory.createdAt, end)
      )
    ).groupBy(loyaltyHistory.type);
    const byType = {};
    for (const r of rows) {
      byType[r.type ?? "unknown"] = {
        points: Number(r.total ?? 0),
        transactions: Number(r.count ?? 0)
      };
    }
    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      earned: byType["earned"] ?? { points: 0, transactions: 0 },
      burned: byType["burned"] ?? { points: 0, transactions: 0 },
      expired: byType["expired"] ?? { points: 0, transactions: 0 },
      manual: byType["manual"] ?? { points: 0, transactions: 0 }
    };
  }),
  // ══════════════════════════════════════════════════════════════
  // 🧠 INTELIGÊNCIA — escrever resultados do Python de volta
  // ══════════════════════════════════════════════════════════════
  /**
   * POST /trpc/admin.api.writeDishIntelligence
   * O app Python envia scores calculados por prato para persistir.
   * O SmartGenerator pode ler esse score no processo de seleção.
   */
  writeDishIntelligence: internalProcedure.input(z31.array(z31.object({
    dishId: z31.number(),
    proteinGrams: z31.number().optional(),
    carbGrams: z31.number().optional(),
    fatGrams: z31.number().optional(),
    popularityScore: z31.number().min(0).max(10).optional(),
    avgRating: z31.number().min(0).max(5).optional(),
    salesVelocity: z31.number().optional(),
    // unidades/semana
    recommendedPersonas: z31.array(z31.string()).optional()
  }))).mutation(async ({ ctx, input }) => {
    let upserted = 0;
    for (const item of input) {
      await ctx.db.insert(biDishIntelligence).values({
        dishId: item.dishId,
        proteinGrams: String(item.proteinGrams ?? 0),
        carbGrams: String(item.carbGrams ?? 0),
        fatGrams: String(item.fatGrams ?? 0),
        popularityScore: String(item.popularityScore ?? 5),
        avgRating: String(item.avgRating ?? 0),
        salesVelocity: String(item.salesVelocity ?? 0)
      }).onDuplicateKeyUpdate({
        set: {
          proteinGrams: sql22`VALUES(protein_grams)`,
          carbGrams: sql22`VALUES(carb_grams)`,
          fatGrams: sql22`VALUES(fat_grams)`,
          popularityScore: sql22`VALUES(popularity_score)`,
          avgRating: sql22`VALUES(avg_rating)`,
          salesVelocity: sql22`VALUES(sales_velocity)`
        }
      });
      upserted++;
    }
    return { success: true, upserted };
  })
});

// server/routers/admin/backups.ts
import { TRPCError as TRPCError25 } from "@trpc/server";
import { createWriteStream } from "node:fs";
import {
  createReadStream,
  existsSync,
  promises as fs2
} from "node:fs";
import path2 from "node:path";
import { spawn } from "node:child_process";
import { z as z32 } from "zod";

// server/auth.ts
init_db();
init_schema();
import { Lucia } from "lucia";
import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { eq as eq40, and as and14, isNull as isNull3, or as or5 } from "drizzle-orm";
init_encryption();
var db = await getDb();
if (!db) {
  throw new Error("N\xE3o foi poss\xEDvel inicializar o banco de dados no m\xF3dulo de autentica\xE7\xE3o.");
}
var adapter = new DrizzleMySQLAdapter(db, sessions, users);
function normalizeJson(value) {
  if (value === null || value === void 0) return null;
  if (typeof value === "string") {
    try {
      return normalizeJson(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (typeof value === "object") {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = normalizeJson(value[key]);
      return acc;
    }, {});
  }
  return value;
}
function sameCartConfiguration(a, b) {
  return JSON.stringify(normalizeJson(a)) === JSON.stringify(normalizeJson(b));
}
var lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  },
  getUserAttributes: (attributes) => {
    let cleanName = attributes.name || "";
    if (cleanName && cleanName.includes(":")) {
      try {
        cleanName = decrypt(cleanName) || cleanName;
      } catch {
      }
    }
    return {
      email: attributes.email,
      name: cleanName,
      role: attributes.role ?? "user",
      referralCode: attributes.referralCode ?? null,
      needsPasswordReset: Number(attributes.needsPasswordReset) === 1 || attributes.needsPasswordReset === true
    };
  },
  getSessionAttributes: (attributes) => {
    return {
      referralCode: attributes.referralCode ?? null,
      guestId: attributes.guestId ?? null
    };
  }
});
async function promoteCart(guestSessionId, userId) {
  if (!guestSessionId || ["undefined", "null", ""].includes(String(guestSessionId))) return;
  const userIdStr = String(userId);
  try {
    const guestCheck = await db.query.guests.findFirst({
      where: eq40(guests.id, guestSessionId),
      columns: { id: true, convertedUserId: true, referralCode: true }
    });
    if (!guestCheck) return;
    if (guestCheck.convertedUserId && String(guestCheck.convertedUserId) !== userIdStr) {
      return;
    }
    await db.transaction(async (tx) => {
      if (guestCheck.referralCode) {
        await tx.update(users).set({ referralCode: guestCheck.referralCode }).where(and14(eq40(users.id, userIdStr), isNull3(users.referralCode)));
      }
      const userCart = await tx.query.carts.findFirst({
        where: and14(eq40(carts.userId, userIdStr), eq40(carts.status, "active"))
      });
      const guestCart = await tx.query.carts.findFirst({
        where: and14(
          or5(eq40(carts.guestId, guestSessionId), eq40(carts.sessionId, guestSessionId)),
          eq40(carts.status, "active")
        )
      });
      if (!guestCart) return;
      if (userCart && userCart.id !== guestCart.id) {
        const guestItems = await tx.select().from(cartItems).where(eq40(cartItems.cartId, guestCart.id));
        const userItems = await tx.select().from(cartItems).where(eq40(cartItems.cartId, userCart.id));
        for (const item of guestItems) {
          const duplicate = userItems.find(
            (candidate) => String(candidate.dishId ?? "") === String(item.dishId ?? "") && String(candidate.packageId ?? "") === String(item.packageId ?? "") && sameCartConfiguration(candidate.options, item.options)
          );
          if (duplicate) {
            const newQty = (duplicate.quantity || 0) + (item.quantity || 0);
            await tx.update(cartItems).set({ quantity: newQty }).where(eq40(cartItems.id, duplicate.id));
            duplicate.quantity = newQty;
            await tx.delete(cartItems).where(eq40(cartItems.id, item.id));
          } else {
            await tx.update(cartItems).set({ cartId: userCart.id }).where(eq40(cartItems.id, item.id));
            userItems.push({ ...item, cartId: userCart.id });
          }
        }
        await tx.delete(carts).where(eq40(carts.id, guestCart.id));
      } else if (!userCart) {
        await tx.update(carts).set({ userId: userIdStr, guestId: null, sessionId: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq40(carts.id, guestCart.id));
      }
      await tx.update(guests).set({ convertedUserId: userIdStr, lastActive: /* @__PURE__ */ new Date() }).where(eq40(guests.id, guestSessionId));
    });
    logger.info({ userId: userIdStr, guestId: guestSessionId }, "Promo\xE7\xE3o de carrinho conclu\xEDda");
  } catch (error) {
    const dbError = error;
    if (dbError.errno === 1020 || dbError.code === "ER_CHECKREAD") {
      return;
    }
    logger.error(
      { err: dbError.message, guestId: guestSessionId, userId: userIdStr },
      "Erro ao promover carrinho"
    );
  }
}

// server/routers/admin/backups.ts
var BACKUP_DIR = "/var/backups";
var BACKUP_FILE_REGEX = /^[a-zA-Z0-9._-]+\.sql\.gz$/;
var createBackupRateLimit = createRateLimitMiddleware({
  keyPrefix: "admin.backups.create",
  limit: 1,
  windowMs: 3e4
});
var backupCreationInProgress = false;
var lastBackupCreatedAt = 0;
function sanitizeFilename(filename) {
  return BACKUP_FILE_REGEX.test(filename) ? filename : null;
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
function resolveBackupPath(filename) {
  const safeFilename = sanitizeFilename(filename);
  if (!safeFilename) {
    throw new TRPCError25({
      code: "BAD_REQUEST",
      message: "Nome de arquivo inv\xE1lido."
    });
  }
  const resolvedPath = path2.resolve(BACKUP_DIR, safeFilename);
  const resolvedDir = path2.resolve(BACKUP_DIR);
  const expectedPrefix = `${resolvedDir}${path2.sep}`;
  if (resolvedPath !== path2.join(resolvedDir, safeFilename) && !resolvedPath.startsWith(expectedPrefix)) {
    throw new TRPCError25({
      code: "BAD_REQUEST",
      message: "Arquivo fora do diret\xF3rio permitido."
    });
  }
  if (resolvedPath !== resolvedDir && !resolvedPath.startsWith(expectedPrefix)) {
    throw new TRPCError25({
      code: "BAD_REQUEST",
      message: "Arquivo fora do diret\xF3rio permitido."
    });
  }
  return resolvedPath;
}
async function ensureBackupDirectory() {
  await fs2.mkdir(BACKUP_DIR, { recursive: true });
}
async function toBackupMetadata(filename) {
  const stat = await fs2.stat(resolveBackupPath(filename));
  return {
    filename,
    sizeBytes: stat.size,
    sizeFormatted: formatBytes(stat.size),
    modifiedAt: stat.mtime
  };
}
async function listBackupFiles() {
  await ensureBackupDirectory();
  const entries = await fs2.readdir(BACKUP_DIR, { withFileTypes: true });
  const backups = await Promise.all(
    entries.filter((entry) => entry.isFile()).map(async (entry) => {
      const safeFilename = sanitizeFilename(entry.name);
      if (!safeFilename) return null;
      try {
        return await toBackupMetadata(safeFilename);
      } catch {
        return null;
      }
    })
  );
  return backups.filter((item) => item !== null).sort(
    (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()
  );
}
function getDatabaseCredentials() {
  const databaseUrl = process.env.DATABASE_URL;
  let parsedUrl = null;
  if (databaseUrl) {
    try {
      parsedUrl = new URL(databaseUrl);
    } catch {
      logger.warn("DATABASE_URL inv\xE1lida para gera\xE7\xE3o de backup manual.");
    }
  }
  const host = process.env.DB_HOST || parsedUrl?.hostname || "127.0.0.1";
  const port = process.env.DB_PORT || parsedUrl?.port || "3306";
  const user = process.env.DB_USER || parsedUrl?.username || "";
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || parsedUrl?.password || "";
  const database = process.env.DB_NAME || parsedUrl?.pathname.replace(/^\//, "") || "gourmet_saudavel";
  if (!user || !password || !database) {
    throw new TRPCError25({
      code: "INTERNAL_SERVER_ERROR",
      message: "Configura\xE7\xE3o de banco incompleta para backup."
    });
  }
  return { host, port, user, password, database };
}
function buildTimestamp() {
  const now = /* @__PURE__ */ new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join("-") + "_" + [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join("-");
}
function sanitizeProcessMessage(message, password) {
  const trimmed = message.trim();
  if (!trimmed) return "";
  return trimmed.replaceAll(password, "[redacted]");
}
async function createBackupArchive(targetPath, credentials) {
  await ensureBackupDirectory();
  return await new Promise((resolve, reject) => {
    const dump = spawn(
      "mysqldump",
      [
        "-h",
        credentials.host,
        "-P",
        credentials.port,
        "-u",
        credentials.user,
        credentials.database
      ],
      {
        env: {
          ...process.env,
          MYSQL_PWD: credentials.password
        },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    const gzip = spawn("gzip", ["-c"], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    const output = createWriteStream(targetPath, { flags: "wx" });
    let dumpClosed = false;
    let gzipClosed = false;
    let outputFinished = false;
    let dumpCode = null;
    let gzipCode = null;
    let dumpStderr = "";
    let gzipStderr = "";
    let settled = false;
    const finalize = (error) => {
      if (settled) return;
      settled = true;
      dump.stdout?.unpipe();
      gzip.stdout?.unpipe();
      output.close();
      if (error) {
        try {
          dump.kill("SIGTERM");
        } catch {
        }
        try {
          gzip.kill("SIGTERM");
        } catch {
        }
        void fs2.rm(targetPath, { force: true }).finally(() => reject(error));
        return;
      }
      resolve();
    };
    const tryResolve = () => {
      if (!dumpClosed || !gzipClosed || !outputFinished) return;
      if (dumpCode !== 0) {
        finalize(
          new Error(
            sanitizeProcessMessage(dumpStderr, credentials.password) || "mysqldump falhou."
          )
        );
        return;
      }
      if (gzipCode !== 0) {
        finalize(
          new Error(
            sanitizeProcessMessage(gzipStderr, credentials.password) || "gzip falhou."
          )
        );
        return;
      }
      finalize();
    };
    dump.on("error", () => {
      finalize(new Error("Falha ao iniciar mysqldump."));
    });
    gzip.on("error", () => {
      finalize(new Error("Falha ao iniciar gzip."));
    });
    output.on("error", () => {
      finalize(new Error("Falha ao escrever arquivo de backup."));
    });
    dump.stderr.on("data", (chunk) => {
      dumpStderr += chunk.toString("utf8");
    });
    gzip.stderr.on("data", (chunk) => {
      gzipStderr += chunk.toString("utf8");
    });
    dump.stdout.pipe(gzip.stdin);
    gzip.stdout.pipe(output);
    output.on("finish", () => {
      outputFinished = true;
      tryResolve();
    });
    dump.on("close", (code) => {
      dumpClosed = true;
      dumpCode = code;
      if (code !== 0) {
        gzip.kill("SIGTERM");
      }
      tryResolve();
    });
    gzip.on("close", (code) => {
      gzipClosed = true;
      gzipCode = code;
      tryResolve();
    });
  });
}
async function requireAdminRequest(req) {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  if (!sessionId) return null;
  const { session, user } = await lucia.validateSession(sessionId);
  if (!session || !user || user.role !== "admin") {
    return null;
  }
  return { session, user };
}
async function handleAdminBackupDownload(req, res) {
  try {
    const auth = await requireAdminRequest(req);
    if (!auth) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    const safeFilename = sanitizeFilename(req.params.filename || "");
    if (!safeFilename) {
      return res.status(400).json({ error: "Arquivo inv\xE1lido." });
    }
    const filePath = resolveBackupPath(safeFilename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "Backup n\xE3o encontrado." });
    }
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`
    );
    return createReadStream(filePath).pipe(res);
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : "unknown" },
      "Falha ao servir download de backup."
    );
    return res.status(500).json({ error: "Erro ao baixar backup." });
  }
}
var backupsAdminRouter = router({
  list: adminProcedure.query(async () => {
    return listBackupFiles();
  }),
  create: adminProcedure.use(createBackupRateLimit).mutation(async () => {
    const now = Date.now();
    if (backupCreationInProgress) {
      throw new TRPCError25({
        code: "TOO_MANY_REQUESTS",
        message: "J\xE1 existe um backup manual em execu\xE7\xE3o."
      });
    }
    if (now - lastBackupCreatedAt < 15e3) {
      throw new TRPCError25({
        code: "TOO_MANY_REQUESTS",
        message: "Aguarde alguns segundos antes de gerar outro backup."
      });
    }
    backupCreationInProgress = true;
    try {
      const credentials = getDatabaseCredentials();
      const filename = `manual_${buildTimestamp()}.sql.gz`;
      const targetPath = resolveBackupPath(filename);
      await createBackupArchive(targetPath, credentials);
      lastBackupCreatedAt = Date.now();
      const metadata = await toBackupMetadata(filename);
      logger.info(
        { filename: metadata.filename, sizeBytes: metadata.sizeBytes },
        "Backup manual criado com sucesso."
      );
      return metadata;
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error.message : "unknown" },
        "Falha ao gerar backup manual."
      );
      throw new TRPCError25({
        code: "INTERNAL_SERVER_ERROR",
        message: "N\xE3o foi poss\xEDvel gerar o backup manual."
      });
    } finally {
      backupCreationInProgress = false;
    }
  }),
  delete: adminProcedure.input(
    z32.object({
      filename: z32.string().min(1)
    })
  ).mutation(async ({ input }) => {
    const safeFilename = sanitizeFilename(input.filename);
    if (!safeFilename) {
      throw new TRPCError25({
        code: "BAD_REQUEST",
        message: "Nome de arquivo inv\xE1lido."
      });
    }
    const backups = await listBackupFiles();
    if (backups.length > 0 && backups[0]?.filename === safeFilename) {
      throw new TRPCError25({
        code: "BAD_REQUEST",
        message: "N\xE3o \xE9 permitido excluir o backup mais recente."
      });
    }
    const filePath = resolveBackupPath(safeFilename);
    await fs2.rm(filePath, { force: true });
    return { success: true, filename: safeFilename };
  })
});

// server/routers/admin/ga4Analytics.ts
import { z as z33 } from "zod";
import { TRPCError as TRPCError26 } from "@trpc/server";
import { GoogleAuth } from "google-auth-library";
var GA4_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
async function getGA4Credentials() {
  try {
    const propertyId = "250001647";
    const serviceAccountJson = `
    {
      "type": "service_account",
      "project_id": "...",
      "private_key_id": "...",
      "private_key": "...",
      "client_email": "bi-analytics@gourmetbi.iam.gserviceaccount.com",
      "client_id": "...",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "...",
      "universe_domain": "googleapis.com"
    }
    `;
    if (!serviceAccountJson || serviceAccountJson.trim() === "" || propertyId === "250001647") {
      return null;
    }
    const credentials = JSON.parse(serviceAccountJson);
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"]
    });
    return { propertyId, auth };
  } catch (err) {
    logger.error({ err }, "\u274C [GA4 TESTE HARDCODED] Erro Cr\xEDtico ao carregar credenciais");
    return null;
  }
}
async function ga4Request(auth, propertyId, body) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const res = await fetch(
    `${GA4_API_BASE}/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token}`
      },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GA4 API error ${res.status}: ${error}`);
  }
  return res.json();
}
function parseRows(data, dimensionKey) {
  const rows = data.rows || [];
  return rows.map((row) => {
    const dims = row.dimensionValues || [];
    const mets = row.metricValues || [];
    return {
      dimension: dimensionKey ? dims[0]?.value : void 0,
      value: Number(mets[0]?.value || 0),
      secondary: mets[1] ? Number(mets[1].value || 0) : void 0
    };
  });
}
var ga4AnalyticsRouter = router({
  // Verifica status completo: Service Account + Measurement ID
  checkConnection: adminProcedure.query(async () => {
    const creds = await getGA4Credentials();
    const measurementId = "G-W52VV00WRZ";
    const measurementIdValid = true;
    let apiWorking = false;
    if (creds) {
      try {
        const { auth, propertyId } = creds;
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        const res = await fetch(
          `${GA4_API_BASE}/properties/${propertyId}:runReport`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.token}` },
            body: JSON.stringify({
              dateRanges: [{ startDate: "1daysAgo", endDate: "today" }],
              metrics: [{ name: "sessions" }],
              limit: 1
            })
          }
        );
        apiWorking = res.ok;
      } catch (error) {
        logger.error({ error }, "\u274C [GA4 TESTE HARDCODED] Falha na chamada da API");
        apiWorking = false;
      }
    }
    return {
      connected: !!creds,
      apiWorking,
      measurementId,
      measurementIdValid,
      propertyId: creds ? creds.propertyId : null
    };
  }),
  // Resumo geral: sessões, usuários, pageviews
  getSummary: adminProcedure.input(z33.object({ days: z33.number().default(30) })).query(async ({ input }) => {
    const creds = await getGA4Credentials();
    if (!creds) throw new TRPCError26({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 n\xE3o configuradas." });
    const { auth, propertyId } = creds;
    const startDate = `${input.days}daysAgo`;
    const data = await ga4Request(auth, propertyId, {
      dateRanges: [{ startDate, endDate: "today" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" }
      ]
    });
    const row = data.rows?.[0]?.metricValues || [];
    return {
      sessions: Number(row[0]?.value || 0),
      users: Number(row[1]?.value || 0),
      pageviews: Number(row[2]?.value || 0),
      bounceRate: Number((Number(row[3]?.value || 0) * 100).toFixed(1)),
      avgSessionDuration: Number(Number(row[4]?.value || 0).toFixed(0))
    };
  }),
  // Usuários ativos agora (tempo real)
  getActiveUsers: adminProcedure.query(async () => {
    const creds = await getGA4Credentials();
    if (!creds) throw new TRPCError26({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 n\xE3o configuradas." });
    const { auth, propertyId } = creds;
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const res = await fetch(
      `${GA4_API_BASE}/properties/${propertyId}:runRealtimeReport`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.token}`
        },
        body: JSON.stringify({
          metrics: [{ name: "activeUsers" }],
          dimensions: [{ name: "unifiedScreenName" }]
        })
      }
    );
    if (!res.ok) {
      const errBody = await res.text();
      logger.warn({ status: res.status, body: errBody.slice(0, 300) }, "[GA4] Realtime API error \u2014 retornando vazio");
      return { total: 0, pages: [] };
    }
    const data = await res.json();
    const rows = (data.rows || []).map((row) => {
      const dims = row.dimensionValues || [];
      const mets = row.metricValues || [];
      return {
        page: dims[0]?.value || "(not set)",
        users: Number(mets[0]?.value || 0)
      };
    });
    const total = rows.reduce((acc, r) => acc + r.users, 0);
    return { total, pages: rows.slice(0, 10) };
  }),
  // Páginas mais visitadas
  getTopPages: adminProcedure.input(z33.object({ days: z33.number().default(30) })).query(async ({ input }) => {
    const creds = await getGA4Credentials();
    if (!creds) throw new TRPCError26({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 n\xE3o configuradas." });
    const { auth, propertyId } = creds;
    const data = await ga4Request(auth, propertyId, {
      dateRanges: [{ startDate: `${input.days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10
    });
    return parseRows(data, "pagePath").map((r) => ({
      page: String(r.dimension),
      views: r.value,
      users: r.secondary || 0
    }));
  }),
  // Origens de tráfego
  getTrafficSources: adminProcedure.input(z33.object({ days: z33.number().default(30) })).query(async ({ input }) => {
    const creds = await getGA4Credentials();
    if (!creds) throw new TRPCError26({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 n\xE3o configuradas." });
    const { auth, propertyId } = creds;
    const data = await ga4Request(auth, propertyId, {
      dateRanges: [{ startDate: `${input.days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8
    });
    return parseRows(data, "channel").map((r) => ({
      channel: String(r.dimension),
      sessions: r.value
    }));
  }),
  // Sessões por dia (gráfico de linha)
  getSessionsOverTime: adminProcedure.input(z33.object({ days: z33.number().default(30) })).query(async ({ input }) => {
    const creds = await getGA4Credentials();
    if (!creds) throw new TRPCError26({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 n\xE3o configuradas." });
    const { auth, propertyId } = creds;
    const data = await ga4Request(auth, propertyId, {
      dateRanges: [{ startDate: `${input.days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ dimension: { dimensionName: "date" } }]
    });
    return parseRows(data, "date").map((r) => ({
      date: String(r.dimension).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      sessions: r.value,
      users: r.secondary || 0
    }));
  })
});

// server/api/admin/bi-sync.ts
init_schema2();
import { and as and15, asc as asc12, gte as gte4, inArray as inArray7, lte as lte3 } from "drizzle-orm";
import { z as z34 } from "zod";
init_db();
async function syncHistoricalData(startDate, endDate, _ids) {
  const db2 = await getDb();
  console.log(`[BI SYNC] Iniciando varredura: ${startDate} ate ${endDate}`);
  try {
    const rawOrders = await db2.select().from(orders).where(
      and15(
        gte4(orders.createdAt, new Date(startDate)),
        lte3(orders.createdAt, new Date(endDate)),
        inArray7(orders.status, ["completed", "delivered", "shipped"])
      )
    ).orderBy(asc12(orders.createdAt));
    if (rawOrders.length === 0) {
      console.log("[BI SYNC] Nenhum pedido encontrado no periodo.");
      return { processed: 0 };
    }
    const workerReady = await ensureBIWorkerRunning();
    if (!workerReady) {
      console.warn("[BI SYNC] Redis/worker indisponivel. Pedidos marcados como skipped.");
      return { processed: 0, skipped: rawOrders.length };
    }
    let count6 = 0;
    let skipped = 0;
    for (const order of rawOrders) {
      try {
        const queued = await enqueueBIAnalyticsJob(order.id, {
          removeOnComplete: true,
          attempts: 2,
          jobId: `sync-${order.id}`,
          priority: 10
        });
        if (queued) count6 += 1;
        else skipped += 1;
      } catch (err) {
        console.error(`Erro ao enfileirar pedido ${order.id}:`, err);
      }
    }
    console.log(
      `[BI SYNC] Sincronizacao concluida: ${count6} enfileirados, ${skipped} ignorados.`
    );
    return { processed: count6, skipped };
  } catch (error) {
    console.error("Erro critico na varredura de BI:", error);
    throw error;
  }
}
var biSyncRouter = router({
  run: adminProcedure.input(
    z34.object({
      ids: z34.array(z34.string()).optional(),
      start: z34.string(),
      end: z34.string()
    })
  ).mutation(async ({ input }) => {
    return syncHistoricalData(input.start, input.end, input.ids);
  })
});

// server/routers/admin/index.ts
var adminRouter = router({
  health: healthRouter,
  security: securityRouter,
  backups: backupsAdminRouter,
  ga4: ga4AnalyticsRouter,
  // ✅ BI & DATA SYNC
  // Resolve o "Property syncBI does not exist" e prepara o terreno para o Dashboard
  syncBI: adminProcedure.input(z35.object({
    ids: z35.array(z35.string()).optional(),
    start: z35.string(),
    end: z35.string()
  })).mutation(async ({ input }) => {
    return await syncHistoricalData(input.start, input.end, input.ids);
  }),
  // 📈 ANALYTICS, BI & LOGS
  analytics: adminAnalyticsRouter,
  logs: adminLogsRouter,
  // 🥗 CONTEÚDO, MARKETING & NUTRI
  nutri: adminNutriRouter,
  nutris: adminNutriRouter,
  referral: adminReferralRouter,
  marketing: adminMarketingRouter,
  media: adminMediaRouter,
  mail: mailAdminRouter,
  // 🎫 FIDELIDADE & PROMOÇÕES
  loyaltySettings: adminLoyaltySettingsRouter,
  loyalty: loyaltyAdminRouter,
  coupons: adminCouponsRouter,
  discountRules: adminDiscountRulesRouter,
  // 💰 FINANCEIRO & PAGAMENTOS
  finance: adminFinanceRouter,
  paymentMethods: adminPaymentMethodsRouter2,
  // 🍳 CARDÁPIO & COZINHA (Operação Real)
  ingredients: ingredientsRouter,
  dishComposition: dishCompositionRouter,
  dishes: adminDishesRouter,
  categories: adminCategoriesRouter,
  reviews: adminReviewsRouter,
  // 🍱 ACOMPANHAMENTOS
  accompaniments: router({
    categories: accompanimentCategoriesRouter,
    dishSizes: adminSizesRouter,
    groups: adminGroupsRouter,
    options: adminOptionsRouter
  }),
  // 📦 COMERCIAL & EXPEDIÇÃO
  packages: adminPackagesRouter,
  showcase: adminShowcaseRouter,
  showcases: adminShowcaseRouter,
  labels: adminLabelsRouter,
  // 🚚 LOGÍSTICA & FRETE
  shipping: router({
    rules: shippingRulesRouter,
    mesh: shippingMeshRouter
  }),
  shippingRules: shippingRulesRouter,
  shippingMesh: shippingMeshRouter,
  // 👤 USUÁRIOS & PEDIDOS
  users: usersAdminRouter,
  usersAdmin: usersAdminRouter,
  orders: ordersAdminRouter,
  ordersAdmin: ordersAdminRouter,
  // ⚙️ CONFIGURAÇÕES DE SISTEMA
  storeSettings: adminStoreSettingsRouter,
  settings: adminStoreSettingsRouter,
  api: adminApiRouter
});

// server/routers/admin/theme.js
import { z as z36 } from "zod";
init_db();
init_schema();
import { eq as eq41 } from "drizzle-orm";
var adminThemeRouter = router({
  get: adminProcedure.query(async () => {
    const db2 = await getDb();
    const [settings] = await db2.select().from(storeSettings).where(eq41(storeSettings.id, "1")).limit(1);
    if (!settings?.siteTheme) return null;
    try {
      return typeof settings.siteTheme === "string" ? JSON.parse(settings.siteTheme) : settings.siteTheme;
    } catch {
      return null;
    }
  }),
  // ✅ CORREÇÃO: Nomeado como 'save' e aceitando o objeto dinâmico do frontend
  save: adminProcedure.input(z36.record(z36.string(), z36.any())).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.update(storeSettings).set({
      siteTheme: input,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq41(storeSettings.id, "1"));
    return {
      success: true,
      message: "Identidade visual atualizada com sucesso!"
    };
  })
});

// server/routers/media.ts
import { z as z37 } from "zod";
var mediaRouter = router({
  getImagesByFolder: publicProcedure.input(z37.object({ folder: z37.string().min(1).max(100) })).query(async ({ input }) => {
    try {
      const folderPrefix = input.folder.startsWith("gourmet") ? input.folder.replace(/[^a-zA-Z0-9/_-]/g, "") : `gourmet/${sanitizeMediaFolder(input.folder)}`.replace(/\/$/, "");
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: folderPrefix,
        max_results: 100
      });
      return result.resources.map((resource) => ({
        id: resource.public_id,
        url: resource.secure_url,
        name: resource.display_name || resource.public_id.split("/").pop() || "imagem",
        format: resource.format
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro Cloudinary public:", errorMessage);
      throw new Error("N\xE3o foi poss\xEDvel carregar as imagens desta pasta.");
    }
  })
});

// server/routers/storefront/index.ts
init_db();
init_schema();
import { eq as eq77 } from "drizzle-orm";

// server/routers/storefront/auth/index.ts
init_db();
init_schema();
init_encryption();
import { z as z38 } from "zod";
import { eq as eq44 } from "drizzle-orm";

// server/routers/storefront/auth/auth.procedures.ts
init_schema();
init_db();
import { hash as hash2, verify } from "@node-rs/argon2";
import { eq as eq43 } from "drizzle-orm";
import { TRPCError as TRPCError28 } from "@trpc/server";
import crypto10 from "node:crypto";
init_encryption();

// server/routers/storefront/auth/auth.logic.ts
init_schema();
init_encryption();
import { TRPCError as TRPCError27 } from "@trpc/server";
import { sql as sql23, eq as eq42 } from "drizzle-orm";
function isValidCPF(cpf) {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;
  const digits = clean.split("").map(Number);
  const calculateCheckDigit = (count6) => {
    const sum4 = digits.slice(0, count6 - 1).reduce((acc, digit, idx) => acc + digit * (count6 - idx), 0);
    const remainder = sum4 * 10 % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return calculateCheckDigit(10) === digits[9] && calculateCheckDigit(11) === digits[10];
}
async function checkDuplicity(db2, data) {
  const emailLower = data.email.toLowerCase().trim();
  const [emailExists] = await db2.select().from(users).where(sql23`${users.email} = ${emailLower} COLLATE utf8mb4_unicode_ci`).limit(1);
  if (emailExists) {
    throw new TRPCError27({
      code: "BAD_REQUEST",
      message: "Este e-mail j\xE1 est\xE1 em uso."
    });
  }
  const cleanCpf = data.cpf.replace(/\D/g, "");
  const docHash = piiHash(cleanCpf);
  if (!docHash) {
    throw new TRPCError27({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao processar dados de seguran\xE7a."
    });
  }
  const [cpfExists] = await db2.select().from(users).where(sql23`${users.documentIndex} = ${docHash} COLLATE utf8mb4_unicode_ci`).limit(1);
  if (cpfExists) {
    throw new TRPCError27({
      code: "BAD_REQUEST",
      message: "Este CPF j\xE1 possui uma conta ativa."
    });
  }
  if (data.phone) {
    const cleanPhone = data.phone.replace(/\D/g, "");
    const phoneHash = piiHash(cleanPhone);
    if (phoneHash) {
      const [phoneExists] = await db2.select().from(users).where(sql23`${users.phoneIndex} = ${phoneHash} COLLATE utf8mb4_unicode_ci`).limit(1);
      if (phoneExists) {
        throw new TRPCError27({
          code: "BAD_REQUEST",
          message: "Este WhatsApp j\xE1 est\xE1 em uso por outra conta."
        });
      }
    }
  }
}

// server/routers/storefront/auth/auth.procedures.ts
function normalizeForSearch2(text19) {
  return text19.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
var loginProcedure = async ({ input, ctx }) => {
  const db2 = await getDb();
  const identifier = input.identifier.trim().toLowerCase();
  const [result] = await db2.select({
    id: users.id,
    email: users.email,
    password: users.password,
    needsReset: users.needsPasswordReset
  }).from(users).where(eq43(users.email, identifier)).limit(1);
  if (!result || !result.password) {
    throw new TRPCError28({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
  }
  if (Number(result.needsReset) === 1) {
    return { success: false, status: "MIGRATION_REQUIRED", email: result.email };
  }
  if (!input.password) {
    throw new TRPCError28({ code: "BAD_REQUEST", message: "Senha \xE9 obrigat\xF3ria." });
  }
  const valid = await verify(result.password, input.password);
  if (!valid) throw new TRPCError28({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
  const session = await lucia.createSession(result.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  if (!input.rememberMe) {
    sessionCookie.attributes.maxAge = void 0;
    sessionCookie.attributes.expires = void 0;
  }
  if (ctx.res) {
    if (typeof ctx.res.appendHeader === "function") {
      ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
    } else {
      ctx.res.append("Set-Cookie", sessionCookie.serialize());
    }
  }
  await promoteCart(ctx.guestId || input.guestSessionId, result.id);
  return { success: true, status: "SUCCESS" };
};
var registerProcedure = async ({ input, ctx }) => {
  const db2 = await getDb();
  if (!isValidCPF(input.cpf)) {
    throw new TRPCError28({ code: "BAD_REQUEST", message: "CPF inv\xE1lido." });
  }
  await checkDuplicity(db2, {
    email: input.email,
    cpf: input.cpf,
    phone: input.whatsapp || void 0
  });
  const unifiedId = crypto10.randomUUID();
  const hashedPassword = await hash2(input.password);
  const cleanCpf = input.cpf.replace(/\D/g, "");
  const cleanPhone = input.whatsapp ? normalizeDigits(input.whatsapp) : null;
  try {
    await db2.transaction(async (tx) => {
      const targetGuestId = ctx.guestId || input.guestSessionId;
      let foundReferral = null;
      if (targetGuestId) {
        const guestData = await tx.query.guests.findFirst({
          where: eq43(guests.id, targetGuestId)
        });
        if (guestData) foundReferral = guestData.referralCode || null;
      }
      await tx.insert(users).values({
        id: unifiedId,
        email: input.email.toLowerCase(),
        password: hashedPassword,
        name: encrypt(input.name.trim()),
        customerDocument: encrypt(cleanCpf),
        phone: cleanPhone ? encrypt(cleanPhone) : null,
        documentIndex: piiHash(cleanCpf),
        phoneIndex: cleanPhone ? piiHash(cleanPhone) : null,
        nameIndex: normalizeForSearch2(input.name),
        role: "user",
        needsPasswordReset: 0,
        referralCode: foundReferral,
        availablePoints: 0,
        aiCredits: 2
      });
    });
    const session = await lucia.createSession(unifiedId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    sessionCookie.attributes.maxAge = void 0;
    sessionCookie.attributes.expires = void 0;
    if (ctx.res) {
      if (typeof ctx.res.appendHeader === "function") {
        ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
      } else {
        ctx.res.append("Set-Cookie", sessionCookie.serialize());
      }
    }
    await promoteCart(input.guestSessionId || ctx.guestId, unifiedId);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao realizar cadastro.";
    throw new TRPCError28({ code: "INTERNAL_SERVER_ERROR", message: msg });
  }
};
var requestPasswordResetProcedure = async ({ input }) => {
  const db2 = await getDb();
  const email = input.email.toLowerCase().trim();
  const [user] = await db2.select().from(users).where(eq43(users.email, email)).limit(1);
  if (!user) return { success: true, message: "Link enviado." };
  let firstName = "Cliente";
  if (user.name) {
    try {
      const fullDecryptedName = decrypt(user.name);
      if (fullDecryptedName) {
        firstName = fullDecryptedName.split(" ")[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      }
    } catch (err) {
      console.error("Erro ao descriptografar nome:", err);
    }
  }
  const token = crypto10.randomBytes(32).toString("hex");
  const expires = /* @__PURE__ */ new Date();
  expires.setHours(expires.getHours() + 2);
  await db2.update(users).set({
    resetToken: token,
    resetExpires: expires
  }).where(eq43(users.id, user.id));
  const resetLink = `${process.env.VITE_APP_URL || "http://localhost:5173"}/primeiro-acesso?token=${token}`;
  try {
    const { mailer: mailer2 } = await Promise.resolve().then(() => (init_mailer(), mailer_exports));
    await mailer2.sendPasswordReset(user.email, firstName, resetLink);
  } catch {
    console.warn("\u26A0\uFE0F Mailer offline. Link gerado:", resetLink);
  }
  return { success: true, message: "Link enviado." };
};
var resetPasswordProcedure = async ({
  input,
  ctx
}) => {
  const db2 = await getDb();
  const now = /* @__PURE__ */ new Date();
  const [user] = await db2.select().from(users).where(eq43(users.resetToken, input.token)).limit(1);
  if (!user || !user.resetExpires || new Date(user.resetExpires) < now) {
    throw new TRPCError28({ code: "BAD_REQUEST", message: "Link inv\xE1lido ou expirado." });
  }
  const hashedPassword = await hash2(input.password);
  await db2.update(users).set({
    password: hashedPassword,
    needsPasswordReset: 0,
    resetToken: null,
    resetExpires: null
  }).where(eq43(users.id, user.id));
  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  sessionCookie.attributes.maxAge = void 0;
  sessionCookie.attributes.expires = void 0;
  if (ctx.res) {
    if (typeof ctx.res.appendHeader === "function") {
      ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
    } else {
      ctx.res.append("Set-Cookie", sessionCookie.serialize());
    }
  }
  await promoteCart(ctx.guestId, user.id);
  return { success: true };
};
var logoutProcedure = async ({ ctx }) => {
  if (ctx.session) {
    await lucia.invalidateSession(ctx.session.id);
  }
  const sessionCookie = lucia.createBlankSessionCookie();
  if (ctx.res) {
    if (typeof ctx.res.appendHeader === "function") {
      ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());
    } else {
      ctx.res.append("Set-Cookie", sessionCookie.serialize());
    }
  }
  return { success: true };
};

// server/routers/storefront/auth/index.ts
var authRouter = router({
  /**
   * 🔍 VERIFICA SE USUÁRIO EXISTE
   */
  checkUserExists: publicProcedure.input(z38.object({
    email: z38.string().email("E-mail inv\xE1lido"),
    document: z38.string().optional().nullish()
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    const cleanEmail = input.email.toLowerCase().trim();
    const [existingUser] = await db2.select({ id: users.id }).from(users).where(eq44(users.email, cleanEmail)).limit(1);
    return {
      exists: !!existingUser
    };
  }),
  /**
   * 📝 REGISTRO
   */
  register: publicProcedure.use(
    createRateLimitMiddleware({
      keyPrefix: "auth-register",
      limit: 10,
      windowMs: 15 * 60 * 1e3
    })
  ).input(z38.object({
    name: z38.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z38.string().email("E-mail inv\xE1lido").transform((v) => v.toLowerCase().trim()),
    password: z38.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    cpf: z38.string().min(11, "CPF inv\xE1lido"),
    whatsapp: z38.string().optional().nullish(),
    guestSessionId: z38.string().optional().nullish()
  })).mutation(async ({ input, ctx }) => {
    return registerProcedure({ input, ctx });
  }),
  /**
   * 🔑 LOGIN
   * ✅ Sincronizado com o Frontend: inclusão de rememberMe
   */
  login: publicProcedure.use(
    createRateLimitMiddleware({
      keyPrefix: "auth-login",
      limit: 10,
      windowMs: 15 * 60 * 1e3
    })
  ).input(z38.object({
    identifier: z38.string().min(1, "E-mail ou CPF \xE9 obrigat\xF3rio").trim(),
    password: z38.string().optional().nullish(),
    guestSessionId: z38.string().optional().nullish(),
    rememberMe: z38.boolean().optional()
  })).mutation(async ({ input, ctx }) => {
    const result = await loginProcedure({ input, ctx });
    return result;
  }),
  /**
   * 🚪 LOGOUT
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    return logoutProcedure({ ctx });
  }),
  /**
   * 📧 SOLICITAR RECUPERAÇÃO DE SENHA
   */
  requestPasswordReset: publicProcedure.use(
    createRateLimitMiddleware({
      keyPrefix: "auth-reset-request",
      limit: 8,
      windowMs: 15 * 60 * 1e3
    })
  ).input(z38.object({
    email: z38.string().email("E-mail inv\xE1lido").transform((v) => v.toLowerCase().trim())
  })).mutation(async ({ input }) => {
    return requestPasswordResetProcedure({ input });
  }),
  /**
   * 🔄 EXECUÇÃO DA TROCA DE SENHA
   */
  resetPassword: publicProcedure.input(z38.object({
    token: z38.string().min(1, "Token obrigat\xF3rio"),
    password: z38.string().min(6, "Senha muito curta")
  })).mutation(async ({ input, ctx }) => {
    return resetPasswordProcedure({ input, ctx });
  }),
  /**
   * 👤 ME (Validação de Sessão e Perfil)
   * ✅ Resolvendo o erro NOT_FOUND e garantindo descriptografia dos dados sensíveis
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) return null;
    try {
      const db2 = await getDb();
      const [profile] = await db2.select().from(users).where(eq44(users.id, ctx.user.id)).limit(1);
      if (!profile) return null;
      return {
        ...ctx.user,
        name: profile.name ? decrypt(profile.name) : null,
        customerDocument: profile.customerDocument ? decrypt(profile.customerDocument) : null,
        phone: profile.phone ? decrypt(profile.phone) : null,
        availablePoints: Number(profile.availablePoints || 0),
        aiCredits: Number(profile.aiCredits ?? 0),
        needsPasswordReset: profile.needsPasswordReset === 1,
        email: profile.email,
        role: profile.role
      };
    } catch (error) {
      console.error("\u274C Erro em auth.me:", error);
      return ctx.user;
    }
  })
});

// server/routers/storefront/profile.ts
import { z as z39 } from "zod";
import { TRPCError as TRPCError29 } from "@trpc/server";
import { eq as eq45, desc as desc18 } from "drizzle-orm";
import { hash as hash3, verify as verify2 } from "@node-rs/argon2";
init_db();
init_encryption();
init_schema();
import crypto11 from "crypto";
function unseal4(val) {
  if (!val || typeof val !== "string") return "";
  const str = val;
  try {
    if (str.split(":").length !== 3) return str;
    const decoded = decrypt(str);
    return decoded || str;
  } catch {
    return str;
  }
}
var profileRouter = router({
  /**
   * 👤 GET: Perfil Completo
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const targetId = ctx.user.id;
    const [row] = await db2.select().from(users).where(eq45(users.id, targetId)).limit(1);
    if (!row) {
      throw new TRPCError29({ code: "NOT_FOUND", message: "Perfil n\xE3o encontrado." });
    }
    let finalDoc = unseal4(row.customerDocument);
    if (!finalDoc || finalDoc.length < 5) {
      const [lastOrder] = await db2.select({ doc: orders.customerDocument }).from(orders).where(eq45(orders.userId, targetId)).orderBy(desc18(orders.createdAt)).limit(1);
      if (lastOrder?.doc) finalDoc = unseal4(lastOrder.doc);
    }
    return {
      id: row.id,
      name: unseal4(row.name) || "Cliente",
      email: row.email,
      document: finalDoc,
      phone: unseal4(row.phone),
      birthDate: row.birthDate ? String(row.birthDate).split("T")[0] : null,
      birthYear: row.birthYear ? Number(row.birthYear) : null,
      hasPassword: !!row.password,
      referralCode: row.referralCode || null
    };
  }),
  /**
   * 📝 UPDATE: Dados Cadastrais
   */
  update: protectedProcedure.input(z39.object({
    name: z39.string().min(2, "Nome muito curto").optional(),
    cpf: z39.string().optional(),
    phone: z39.string().optional(),
    birthDate: z39.string().optional().nullable(),
    birthYear: z39.number().optional().nullable(),
    referralCode: z39.string().optional().nullable()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const targetId = ctx.user.id;
    const updateData = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (input.name?.trim()) {
      updateData.name = encrypt(input.name.trim());
      updateData.nameIndex = input.name.trim().toLowerCase();
    }
    if (input.cpf) {
      const cleanCpf = normalizeDigits(input.cpf);
      if (cleanCpf.length === 11) {
        updateData.customerDocument = encrypt(cleanCpf);
        updateData.documentIndex = piiHash(cleanCpf);
      }
    }
    if (input.phone) {
      const cleanPhone = normalizeDigits(input.phone);
      if (cleanPhone.length >= 10) {
        updateData.phone = encrypt(cleanPhone);
        updateData.phoneIndex = piiHash(cleanPhone);
      }
    }
    if (input.birthDate) {
      const dateOnly = input.birthDate.split("T")[0];
      updateData.birthDate = dateOnly;
      updateData.birthYear = input.birthYear || Number(dateOnly.split("-")[0]);
    }
    if (input.referralCode !== void 0) {
      updateData.referralCode = input.referralCode?.trim() || null;
    }
    try {
      await db2.update(users).set(updateData).where(eq45(users.id, targetId));
      await logAction(ctx, "UPDATE_PROFILE", "users", { entityId: targetId });
      return {
        success: true,
        message: "Seus dados foram atualizados!"
      };
    } catch {
      throw new TRPCError29({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao salvar dados. Verifique se o CPF j\xE1 est\xE1 em uso."
      });
    }
  }),
  /**
   * 🔑 CHANGE PASSWORD
   */
  changePassword: protectedProcedure.input(z39.object({
    currentPassword: z39.string().optional(),
    newPassword: z39.string().min(6, "A nova senha deve ter no m\xEDnimo 6 caracteres")
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const targetId = ctx.user.id;
    const [userRow] = await db2.select({ password: users.password }).from(users).where(eq45(users.id, targetId)).limit(1);
    if (userRow?.password) {
      if (!input.currentPassword) {
        throw new TRPCError29({
          code: "BAD_REQUEST",
          message: "Para sua seguran\xE7a, digite a senha atual."
        });
      }
      const isMatch = await verify2(userRow.password, input.currentPassword);
      if (!isMatch) {
        throw new TRPCError29({ code: "UNAUTHORIZED", message: "A senha atual est\xE1 incorreta." });
      }
    }
    const hashedNewPassword = await hash3(input.newPassword);
    await db2.update(users).set({
      password: hashedNewPassword,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq45(users.id, targetId));
    await logAction(ctx, "CHANGE_PASSWORD", "users", { entityId: targetId });
    return { success: true, message: "Senha alterada com sucesso! \u{1F6E1}\uFE0F" };
  }),
  /**
   * 📍 ADDRESSES (GET)
   */
  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const rows = await db2.select().from(userAddresses).where(eq45(userAddresses.userId, ctx.user.id)).orderBy(desc18(userAddresses.isDefault), desc18(userAddresses.createdAt));
    return rows.map((addr) => ({
      ...addr,
      label: unseal4(addr.label),
      street: unseal4(addr.street),
      number: unseal4(addr.number),
      neighborhood: unseal4(addr.neighborhood),
      city: unseal4(addr.city),
      state: unseal4(addr.state),
      zipCode: unseal4(addr.zipCode),
      complement: unseal4(addr.complement),
      isDefault: Boolean(addr.isDefault)
    }));
  }),
  /**
   * ➕ ADD ADDRESS
   */
  addAddress: protectedProcedure.input(z39.object({
    label: z39.string().min(1),
    zipCode: z39.string().min(8),
    street: z39.string().min(1),
    number: z39.string().min(1),
    neighborhood: z39.string().min(1),
    city: z39.string().min(1),
    state: z39.string().length(2),
    complement: z39.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    const [existing] = await db2.select({ id: userAddresses.id }).from(userAddresses).where(eq45(userAddresses.userId, userId)).limit(1);
    const isDefault = !existing;
    const cleanZip = normalizeDigits(input.zipCode);
    await db2.insert(userAddresses).values({
      id: crypto11.randomUUID(),
      userId,
      label: encrypt(input.label),
      zipCode: encrypt(cleanZip),
      street: encrypt(input.street),
      number: encrypt(input.number),
      neighborhood: encrypt(input.neighborhood),
      city: encrypt(input.city),
      state: encrypt(input.state),
      complement: input.complement ? encrypt(input.complement) : null,
      isDefault,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
    return { success: true, message: "Endere\xE7o cadastrado!" };
  })
});

// server/routers/storefront/nutri/index.ts
import { z as z44 } from "zod";

// server/routers/storefront/nutri/procedures/profile.ts
import { z as z40 } from "zod";
init_db();
init_schema();
init_encryption();
import { eq as eq46 } from "drizzle-orm";
import { v4 as uuidv44 } from "uuid";
var profileProcedures = {
  /**
   * BUSCA O PERFIL COMPLETO (Sincronizado com a tabela nutri_profiles)
   */
  getPublicProfile: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const [profile] = await db2.select().from(nutriProfiles).where(eq46(nutriProfiles.userId, ctx.user.id)).limit(1);
    if (!profile) return null;
    const [userData] = await db2.select({ name: users.name }).from(users).where(eq46(users.id, ctx.user.id)).limit(1);
    const addresses = await db2.select().from(userAddresses).where(eq46(userAddresses.userId, ctx.user.id));
    return {
      ...profile,
      user: {
        name: userData?.name ? decrypt(userData.name) : ""
      },
      offices: addresses.map((addr) => ({
        id: addr.id,
        label: addr.label ? decrypt(addr.label) : "",
        street: addr.street ? decrypt(addr.street) : "",
        number: addr.number ? decrypt(addr.number) : "",
        city: addr.city ? decrypt(addr.city) : "",
        zipCode: addr.zipCode ? decrypt(addr.zipCode) : ""
      }))
    };
  }),
  /**
   * ATUALIZAÇÃO COMPLETA
   */
  updateProfile: protectedProcedure.input(z40.object({
    name: z40.string().min(3),
    crn: z40.string().min(4),
    referralCode: z40.string().min(3).transform((val) => val.toLowerCase().replace(/\s+/g, "")),
    specialty: z40.string().nullable().optional(),
    bio: z40.string().nullable().optional(),
    website: z40.string().nullable().optional(),
    avatarUrl: z40.string().nullable().optional(),
    offices: z40.array(z40.object({
      label: z40.string(),
      zipCode: z40.string(),
      street: z40.string(),
      number: z40.string(),
      city: z40.string()
    })).optional()
  })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    return await db2.transaction(async (tx) => {
      await tx.update(users).set({ name: encrypt(input.name) }).where(eq46(users.id, ctx.user.id));
      await tx.update(nutriProfiles).set({
        referralCode: input.referralCode,
        crn: input.crn,
        specialty: input.specialty,
        bio: input.bio,
        website: input.website,
        avatarUrl: input.avatarUrl,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq46(nutriProfiles.userId, ctx.user.id));
      if (input.offices) {
        await tx.delete(userAddresses).where(eq46(userAddresses.userId, ctx.user.id));
        if (input.offices.length > 0) {
          const newOffices = input.offices.map((o) => ({
            id: uuidv44(),
            userId: ctx.user.id,
            label: encrypt(o.label),
            zipCode: encrypt(o.zipCode),
            street: encrypt(o.street),
            number: encrypt(o.number),
            city: encrypt(o.city),
            state: encrypt(""),
            neighborhood: encrypt("")
          }));
          await tx.insert(userAddresses).values(newOffices);
        }
      }
      return { success: true, message: "Dados atualizados com sucesso!" };
    });
  })
};

// server/routers/storefront/nutri/procedures/clients.ts
init_db();
init_schema();
init_encryption();
import { eq as eq47, desc as desc19, inArray as inArray8 } from "drizzle-orm";
import { TRPCError as TRPCError30 } from "@trpc/server";
var clientProcedures = {
  /**
   * Obtém a lista de pacientes vinculados ao nutricionista logado
   * Retorna até as últimas prescrições para preencher os slots da UI.
   */
  getMyClients: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db2 = await getDb();
      const profile = await db2.query.nutriProfiles.findFirst({
        where: eq47(nutriProfiles.userId, ctx.user.id)
      });
      if (!profile?.referralCode) return [];
      const nutriCode = profile.referralCode.trim();
      const clientRows = await db2.query.users.findMany({
        where: eq47(users.referralCode, nutriCode)
      });
      if (!clientRows.length) return [];
      const clientIds = clientRows.map((c) => c.id);
      const allPrescriptions = await db2.select({
        id: prescriptions.id,
        clientId: prescriptions.clientId,
        // Se o filtro falhar, troque para prescriptions.userId
        planName: prescriptions.planName,
        totalKcalTarget: prescriptions.totalKcalTarget,
        createdAt: prescriptions.createdAt,
        status: prescriptions.status
      }).from(prescriptions).where(inArray8(prescriptions.clientId, clientIds)).orderBy(desc19(prescriptions.createdAt));
      return clientRows.map((row) => {
        let clientDisplayName = "Paciente";
        try {
          const decryptedName = decrypt(row.name);
          clientDisplayName = decryptedName || row.email.split("@")[0];
        } catch {
          clientDisplayName = row.email?.split("@")[0] || "Usu\xE1rio";
        }
        const clientPrescriptions = allPrescriptions.filter((p) => String(p.clientId) === String(row.id)).slice(0, 4);
        return {
          id: row.id,
          // ID para a key do map no front
          client: {
            id: row.id,
            name: clientDisplayName,
            email: row.email
          },
          prescriptions: clientPrescriptions
          // Array de dietas
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("\u{1F534} ERRO getMyClients:", errorMessage);
      throw new TRPCError30({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar lista de pacientes."
      });
    }
  })
};

// server/routers/storefront/nutri/procedures/prescription.ts
import { z as z41 } from "zod";
init_db();
init_schema();
import { eq as eq48, desc as desc20 } from "drizzle-orm";
import { TRPCError as TRPCError31 } from "@trpc/server";
import { v4 as uuidv45 } from "uuid";
var safeNum = (val, fallback = 0) => {
  return safeNumber(val, fallback);
};
var prescriptionProcedures = {
  /**
   * BUSCA CATÁLOGO COMPLETO (Builder)
   */
  getAvailableCatalog: protectedProcedure.query(async () => {
    const db2 = await getDb();
    const allDishes = await db2.select({
      id: dishes.id,
      name: dishes.name,
      imageUrl: dishes.imageUrl,
      categoryName: categories.name,
      energyKcal: dishes.energyKcal,
      proteins: dishes.proteins,
      carbs: dishes.carbs,
      fatTotal: dishes.fatTotal,
      base_price: dishes.basePrice
    }).from(dishes).leftJoin(categories, eq48(dishes.categoryId, categories.id)).where(eq48(dishes.isActive, true));
    const sizesWithGroups = await db2.select({
      dishId: dishesToSizes.dishId,
      sizeId: dishSizes.id,
      sizeName: dishSizes.name,
      weight: dishSizes.weight,
      mainDishWeight: dishSizes.mainDishWeight,
      price_modifier: dishSizes.priceModifier,
      groupId: accompanimentGroups.id,
      groupName: accompanimentGroups.name,
      maxSelections: accompanimentGroups.maxSelections
    }).from(dishSizes).innerJoin(dishesToSizes, eq48(dishSizes.id, dishesToSizes.sizeId)).leftJoin(sizeAccompanimentGroups, eq48(dishSizes.id, sizeAccompanimentGroups.sizeId)).leftJoin(accompanimentGroups, eq48(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id)).where(eq48(dishSizes.isActive, true));
    const allOptions = await db2.select({
      optionId: accompanimentOptions.id,
      optionName: accompanimentOptions.name,
      groupId: groupToOptions.groupId,
      energyKcal: accompanimentOptions.energyKcal,
      proteins: accompanimentOptions.proteins,
      carbs: accompanimentOptions.carbs,
      fatTotal: accompanimentOptions.fatTotal
    }).from(accompanimentOptions).innerJoin(groupToOptions, eq48(accompanimentOptions.id, groupToOptions.optionId)).where(eq48(accompanimentOptions.isActive, true));
    return allDishes.map((dish) => {
      const dishSizesRaw = sizesWithGroups.filter((s) => s.dishId === dish.id);
      const uniqueSizeIds = Array.from(new Set(dishSizesRaw.map((s) => s.sizeId)));
      const availableSizes = uniqueSizeIds.map((sId) => {
        const sizeInfo = dishSizesRaw.find((s) => s.sizeId === sId);
        return {
          id: sizeInfo.sizeId,
          name: sizeInfo.sizeName,
          weight: sizeInfo.weight,
          mainDishWeight: sizeInfo.mainDishWeight,
          price_modifier: sizeInfo.price_modifier || "1.00",
          accompanimentGroups: dishSizesRaw.filter((s) => s.sizeId === sId && s.groupId).map((g) => ({
            id: g.groupId,
            name: g.groupName,
            maxSelections: g.maxSelections,
            options: allOptions.filter((opt) => opt.groupId === g.groupId).map((opt) => ({
              id: opt.optionId,
              name: opt.optionName,
              energyKcal: opt.energyKcal,
              proteins: opt.proteins,
              carbs: opt.carbs,
              fatTotal: opt.fatTotal
            }))
          }))
        };
      });
      return { ...dish, availableSizes };
    });
  }),
  /**
   * BUSCA TODOS OS ACOMPANHAMENTOS (Builder)
   */
  getAvailableAccompaniments: protectedProcedure.query(async () => {
    const db2 = await getDb();
    return await db2.select({
      id: accompanimentOptions.id,
      name: accompanimentOptions.name,
      energyKcal: accompanimentOptions.energyKcal,
      proteins: accompanimentOptions.proteins,
      carbs: accompanimentOptions.carbs,
      fatTotal: accompanimentOptions.fatTotal
    }).from(accompanimentOptions).where(eq48(accompanimentOptions.isActive, true));
  }),
  /**
   * ATRIBUI A PRESCRIÇÃO AO CLIENTE
   */
  assignPrescription: protectedProcedure.input(z41.object({
    clientId: z41.string(),
    prescription: z41.custom()
  })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    const { clientId, prescription } = input;
    const profile = await db2.query.nutriProfiles.findFirst({
      where: eq48(nutriProfiles.userId, ctx.user.id)
    });
    if (!profile) throw new TRPCError31({ code: "UNAUTHORIZED", message: "Perfil Nutri n\xE3o encontrado." });
    const allDbAccs = await db2.select().from(accompanimentOptions);
    return await db2.transaction(async (tx) => {
      let pId = prescription.id;
      const typedDietSnapshot = prescription.meals.map((meal, mealIndex) => {
        const mealOptions = meal.dishes || meal.groups?.flatMap((group) => group.options) || [];
        return {
          mealName: meal.name || meal.mealName || "",
          order: mealIndex,
          notes: meal.notes,
          dishes: mealOptions.map((dish) => ({
            dishId: safeNum(dish.dishId),
            sizeId: safeNum(dish.sizeId),
            name: String(dish.name),
            priceAtCreation: safeNum(dish.priceAtCreation ?? dish.price),
            multiplier: dish.multiplier ?? 1,
            nutritionalData: {
              mainDishWeight: safeNum(dish.nutritionalData?.mainDishWeight),
              baseMacros: {
                kcal: safeNum(dish.nutritionalData?.baseMacros?.kcal),
                protein: safeNum(dish.nutritionalData?.baseMacros?.protein),
                carbs: safeNum(dish.nutritionalData?.baseMacros?.carbs),
                fat: safeNum(dish.nutritionalData?.baseMacros?.fat)
              }
            }
          }))
        };
      });
      if (pId && pId !== "NEW") {
        await tx.update(prescriptions).set({
          planName: prescription.planName || "Plano Alimentar",
          technicalInsight: prescription.technicalInsight || "",
          totalKcalTarget: safeNum(prescription.totalKcalTarget),
          dietSnapshot: typedDietSnapshot,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq48(prescriptions.id, pId));
      } else {
        pId = uuidv45();
        await tx.insert(prescriptions).values({
          id: pId,
          clientId,
          professionalId: profile.id,
          planName: prescription.planName || "Plano Alimentar",
          technicalInsight: prescription.technicalInsight || "",
          totalKcalTarget: safeNum(prescription.totalKcalTarget),
          discountPercentage: safeNum(profile.discountPercentage),
          dietSnapshot: typedDietSnapshot,
          status: "active"
        });
      }
      await tx.delete(prescriptionItems).where(eq48(prescriptionItems.prescriptionId, pId));
      const itemsToInsert = prescription.meals.flatMap((meal, mIdx) => {
        const dishesInMeal = meal.groups?.flatMap((g) => g.options) || meal.dishes || [];
        return dishesInMeal.map((dish) => {
          const baseMacros = dish.nutritionalData?.baseMacros || dish.macros || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
          let totalKcal = safeNum(baseMacros.kcal);
          let totalProtein = safeNum(baseMacros.protein);
          let totalCarbs = safeNum(baseMacros.carbs);
          let totalFat = safeNum(baseMacros.fat);
          const selectedAccsRaw = dish.allowedAccompaniments || [];
          const enrichedAccs = selectedAccsRaw.map((acc) => {
            const dbAcc = allDbAccs.find((a) => Number(a.id) === Number(acc.id));
            if (dbAcc) {
              totalKcal += safeNum(dbAcc.energyKcal);
              totalProtein += safeNum(dbAcc.proteins);
              totalCarbs += safeNum(dbAcc.carbs);
              totalFat += safeNum(dbAcc.fatTotal);
            }
            return {
              ...acc,
              energyKcal: dbAcc?.energyKcal || 0,
              proteins: dbAcc?.proteins || 0,
              carbs: dbAcc?.carbs || 0,
              fatTotal: dbAcc?.fatTotal || 0
            };
          });
          const finalMacros = {
            kcal: totalKcal,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat
          };
          return {
            id: uuidv45(),
            prescriptionId: pId,
            dishId: safeNum(dish.dishId),
            sizeId: safeNum(dish.sizeId),
            dishName: dish.name || "Prato",
            mealName: meal.name || meal.mealName || `Refei\xE7\xE3o ${mIdx + 1}`,
            order: mIdx,
            fixedPrice: String(safeNum(dish.priceAtCreation || dish.price)),
            multiplier: String(safeNum(dish.multiplier, 1)),
            accompanimentsJson: JSON.stringify(enrichedAccs),
            macrosJson: JSON.stringify(finalMacros)
          };
        });
      });
      if (itemsToInsert.length > 0) {
        await tx.insert(prescriptionItems).values(itemsToInsert);
      }
      return { success: true, id: pId };
    });
  }),
  /**
   * DASHBOARD DO PACIENTE (Leitura via Itens Espelho)
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const allPrescs = await db2.select().from(prescriptions).where(eq48(prescriptions.clientId, ctx.user.id)).orderBy(desc20(prescriptions.updatedAt));
    if (!allPrescs.length) return [];
    return await Promise.all(allPrescs.map(async (presc) => {
      const items = await db2.select().from(prescriptionItems).where(eq48(prescriptionItems.prescriptionId, presc.id)).orderBy(prescriptionItems.order);
      const mealMap = /* @__PURE__ */ new Map();
      items.forEach((item) => {
        const mName = item.mealName;
        if (!mealMap.has(mName)) {
          mealMap.set(mName, { mealName: mName, order: item.order ?? 0, dishes: [] });
        }
        const accs = safeJsonParse(item.accompanimentsJson, []);
        const macros = safeJsonParse(item.macrosJson, {});
        mealMap.get(mName).dishes.push({
          dishId: item.dishId,
          sizeId: item.sizeId,
          name: item.dishName || "Prato",
          priceAtCreation: safeNumber(item.fixedPrice),
          multiplier: item.multiplier || "1.00",
          allowedAccompaniments: accs,
          nutritionalData: {
            baseMacros: macros,
            allowedAccompaniments: accs
          }
        });
      });
      return { ...presc, meals: Array.from(mealMap.values()) };
    }));
  }),
  /**
   * APAGAR PRESCRIÇÃO
   */
  deletePrescription: protectedProcedure.input(z41.object({ id: z41.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.delete(prescriptions).where(eq48(prescriptions.id, input.id));
    return { success: true };
  }),
  /**
   * DETALHES DA PRESCRIÇÃO
   */
  getPrescriptionDetails: protectedProcedure.input(z41.object({ clientId: z41.string(), prescriptionId: z41.string().optional() })).query(async ({ input }) => {
    const db2 = await getDb();
    const queryWhere = input.prescriptionId ? eq48(prescriptions.id, input.prescriptionId) : eq48(prescriptions.clientId, input.clientId);
    const allPrescs = await db2.select().from(prescriptions).where(queryWhere).orderBy(desc20(prescriptions.createdAt));
    return Promise.all(allPrescs.map(async (presc) => {
      const items = await db2.select().from(prescriptionItems).where(eq48(prescriptionItems.prescriptionId, presc.id));
      const mealMap = /* @__PURE__ */ new Map();
      items.forEach((item) => {
        if (!mealMap.has(item.mealName)) {
          mealMap.set(item.mealName, {
            mealName: item.mealName,
            order: item.order ?? 0,
            groups: [{ name: "Op\xE7\xF5es da Semana", options: [] }]
          });
        }
        const accs = safeJsonParse(item.accompanimentsJson, []);
        const macros = safeJsonParse(item.macrosJson, {});
        mealMap.get(item.mealName).groups[0].options.push({
          ...item,
          dishId: item.dishId,
          name: item.dishName,
          priceAtCreation: safeNumber(item.fixedPrice),
          multiplier: item.multiplier,
          allowedAccompaniments: accs,
          nutritionalData: { baseMacros: macros, allowedAccompaniments: accs }
        });
      });
      return { ...presc, meals: Array.from(mealMap.values()) };
    }));
  })
};

// server/routers/storefront/nutri/procedures/nutri_templates.ts
import { z as z42 } from "zod";
import { v4 as uuidv46 } from "uuid";
import { eq as eq49, desc as desc21 } from "drizzle-orm";
init_db();
init_schema();
var safeNum2 = (val, fallback = 0) => {
  return safeNumber(val, fallback);
};
var templateProcedures = {
  /**
   * SALVA UM MODELO DE DIETA (TEMPLATE)
   */
  saveTemplate: protectedProcedure.input(z42.object({
    id: z42.string().optional().nullable(),
    name: z42.string().min(3, "O nome precisa de ao menos 3 caracteres"),
    description: z42.string().optional().nullable(),
    data: z42.object({
      meals: z42.array(z42.unknown()),
      totalKcalTarget: z42.number().optional(),
      technicalInsight: z42.string().optional(),
      macros: z42.record(z42.string(), z42.number()).optional()
    })
  })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    const mealsData = input.data.meals || [];
    const allDbAccs = await db2.select().from(accompanimentOptions);
    const dietSnapshot = mealsData.map((m, mIdx) => {
      const meal = m;
      const flattenedDishes = (meal.groups || []).flatMap(
        (group) => (group.options || []).map((opt) => {
          const rawMacros = opt.nutritionalData?.baseMacros || opt.macros || {};
          let tKcal = safeNum2(rawMacros.kcal || rawMacros.energyKcal);
          let tProt = safeNum2(rawMacros.protein || rawMacros.proteins);
          let tCarb = safeNum2(rawMacros.carbs);
          let tFat = safeNum2(rawMacros.fat || rawMacros.fatTotal);
          const selectedAccsRaw = opt.allowedAccompaniments || [];
          const enrichedAccs = selectedAccsRaw.map((acc) => {
            const dbAcc = allDbAccs.find((a) => Number(a.id) === Number(acc.id));
            if (dbAcc) {
              tKcal += safeNum2(dbAcc.energyKcal);
              tProt += safeNum2(dbAcc.proteins);
              tCarb += safeNum2(dbAcc.carbs);
              tFat += safeNum2(dbAcc.fatTotal);
            }
            return {
              ...acc,
              energyKcal: dbAcc?.energyKcal || 0,
              proteins: dbAcc?.proteins || 0,
              carbs: dbAcc?.carbs || 0,
              fatTotal: dbAcc?.fatTotal || 0
            };
          });
          const safeSizeId = safeNum2(opt.sizeId || opt.nutritionalData?.sizeId);
          return {
            dishId: safeNum2(opt.dishId),
            sizeId: safeSizeId,
            name: opt.name,
            groupName: group.name,
            priceAtCreation: safeNum2(opt.priceAtCreation || opt.price),
            multiplier: String(opt.multiplier || "1.00"),
            nutritionalData: {
              sizeId: safeSizeId,
              mainDishWeight: safeNum2(opt.mainDishWeight || opt.nutritionalData?.mainDishWeight),
              baseMacros: { kcal: tKcal, protein: tProt, carbs: tCarb, fat: tFat },
              allowedAccompaniments: enrichedAccs
            },
            allowedAccompaniments: enrichedAccs
          };
        })
      );
      return {
        mealName: meal.name || meal.mealName || "Refei\xE7\xE3o",
        order: mIdx,
        notes: meal.notes || "",
        dishes: flattenedDishes
      };
    });
    const values = {
      professionalId: ctx.user.id,
      name: input.name,
      description: input.description,
      totalKcalTarget: safeNum2(input.data.totalKcalTarget),
      technicalInsight: input.data.technicalInsight || "",
      content: JSON.stringify(dietSnapshot),
      nutritionalInfo: JSON.stringify(input.data.macros || {})
    };
    if (input.id && input.id !== "NEW") {
      await db2.update(prescriptionTemplates).set(values).where(eq49(prescriptionTemplates.id, input.id));
      return { success: true, id: input.id, action: "updated" };
    } else {
      const newId = uuidv46();
      await db2.insert(prescriptionTemplates).values({
        id: newId,
        ...values
      });
      return { success: true, id: newId, action: "created" };
    }
  }),
  getMyTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const results = await db2.query.prescriptionTemplates.findMany({
      where: eq49(prescriptionTemplates.professionalId, ctx.user.id),
      orderBy: [desc21(prescriptionTemplates.createdAt)]
    });
    return results.map((t2) => {
      let parsedMeals = [];
      try {
        parsedMeals = safeJsonParse(t2.content, []);
      } catch {
        console.error(`\u{1F534} Erro JSON no template ${t2.id}`);
      }
      return { ...t2, meals: parsedMeals };
    });
  }),
  deleteTemplate: protectedProcedure.input(z42.object({ templateId: z42.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    await db2.delete(prescriptionTemplates).where(eq49(prescriptionTemplates.id, input.templateId));
    return { success: true };
  })
};

// server/routers/storefront/nutri/myPrescription.ts
import { z as z43 } from "zod";
init_db();
init_schema();
import { eq as eq50, desc as desc22, and as and16, gt as gt2 } from "drizzle-orm";

// shared/domain/prescription/logic.ts
function calculatePrescriptionItemPrice(originalPrice, discountPercentage) {
  const discount = originalPrice * (discountPercentage / 100);
  return Number((originalPrice - discount).toFixed(2));
}

// server/routers/storefront/nutri/myPrescription.ts
var myPrescriptionProcedures = {
  getMyPrescription: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    const allPrescs = await db2.select().from(prescriptions).where(eq50(prescriptions.clientId, userId)).orderBy(desc22(prescriptions.updatedAt));
    const aiScans = await db2.select().from(nutriScansTemp).where(
      and16(
        eq50(nutriScansTemp.userId, userId),
        gt2(nutriScansTemp.expiresAt, /* @__PURE__ */ new Date())
      )
    ).orderBy(desc22(nutriScansTemp.createdAt));
    const processedOfficial = await Promise.all(allPrescs.map(async (presc) => {
      const items = await db2.select().from(prescriptionItems).where(eq50(prescriptionItems.prescriptionId, presc.id)).orderBy(prescriptionItems.order);
      const meals = {};
      items.forEach((item) => {
        const mName = item.mealName || "Refei\xE7\xE3o";
        if (!meals[mName]) {
          meals[mName] = { mealName: mName, order: item.order ?? 0, dishes: [] };
        }
        const originalPrice = safeNumber(item.fixedPrice);
        const discount = safeNumber(presc.discountPercentage);
        const itemData = item;
        meals[mName].dishes.push({
          id: String(item.dishId),
          name: item.dishName || "Prato",
          qty: 1,
          price: calculatePrescriptionItemPrice(originalPrice, discount),
          categoryId: String(itemData.categoryId || 0),
          sizeId: Number(item.sizeId)
        });
      });
      return {
        id: presc.id,
        planName: presc.planName || "Plano Alimentar",
        technicalInsight: presc.technicalInsight || "",
        discountPercentage: safeNumber(presc.discountPercentage),
        meals: Object.values(meals).sort((a, b) => a.order - b.order),
        type: "official",
        createdAt: presc.createdAt
      };
    }));
    const processedAI = aiScans.map((scan) => {
      const rawData = safeJsonParse(scan.suggestedData, []);
      const meals = (Array.isArray(rawData) ? rawData : []).map((m, idx) => ({
        mealName: m.name || m.mealName || `Refei\xE7\xE3o ${idx + 1}`,
        notes: m.notes || "",
        dishes: (m.dishes || m.groups?.flatMap((g) => g.options) || []).map((d) => ({
          id: String(d.dishId),
          name: d.name || "Prato Sugerido",
          qty: 1,
          price: safeNumber(d.priceAtCreation),
          categoryId: "0",
          sizeId: d.sizeId ? safeNumber(d.sizeId) : void 0
        }))
      }));
      return {
        id: scan.id,
        planName: "An\xE1lise via Scanner AI",
        technicalInsight: "Plano gerado automaticamente a partir da sua foto/texto.",
        discountPercentage: 0,
        meals,
        type: "ai_scan",
        createdAt: scan.createdAt
      };
    });
    return [...processedAI, ...processedOfficial].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }),
  deleteScan: protectedProcedure.input(z43.object({ id: z43.string() })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    await db2.delete(nutriScansTemp).where(
      and16(
        eq50(nutriScansTemp.id, input.id),
        eq50(nutriScansTemp.userId, ctx.user.id)
      )
    );
    return { success: true };
  })
};

// server/routers/storefront/nutri/index.ts
init_db();
init_schema();
init_encryption();
import { TRPCError as TRPCError32 } from "@trpc/server";
import { eq as eq51, desc as desc23, and as and17 } from "drizzle-orm";
import { hash as hash4 } from "@node-rs/argon2";
import crypto12 from "crypto";
var nutriRouter = router({
  // ✅ Injeção de procedimentos modulares
  ...profileProcedures,
  ...clientProcedures,
  ...templateProcedures,
  ...prescriptionProcedures,
  ...myPrescriptionProcedures,
  /**
   * ✅ REGISTRO DE NUTRICIONISTA (Blindado)
   * Realiza o cadastro de usuário, perfil profissional e endereços de consultório.
   */
  registerPublicProfile: publicProcedure.input(z44.object({
    name: z44.string().min(3),
    email: z44.string().email(),
    password: z44.string().min(6),
    document: z44.string(),
    phone: z44.string(),
    crn: z44.string().min(4),
    specialty: z44.string().optional(),
    bio: z44.string().optional(),
    offices: z44.array(z44.object({
      label: z44.string(),
      zipCode: z44.string(),
      street: z44.string(),
      number: z44.string(),
      neighborhood: z44.string(),
      city: z44.string(),
      state: z44.string(),
      complement: z44.string().optional(),
      isDefault: z44.boolean()
    }))
  })).mutation(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError32({ code: "INTERNAL_SERVER_ERROR", message: "Database offline" });
    try {
      const hashedPassword = await hash4(input.password.trim());
      const userId = crypto12.randomUUID();
      await db2.insert(users).values({
        id: userId,
        name: encrypt(input.name.trim()),
        email: input.email.toLowerCase().trim(),
        password: hashedPassword,
        role: "nutri",
        updatedAt: /* @__PURE__ */ new Date()
      });
      await db2.insert(nutriProfiles).values({
        id: crypto12.randomUUID(),
        userId,
        crn: input.crn.trim(),
        specialty: input.specialty || "Geral",
        bio: input.bio || "",
        referralCode: input.name.split(" ")[0].toLowerCase() + Math.floor(1e3 + Math.random() * 9e3),
        isActive: true
      });
      if (input.offices && input.offices.length > 0) {
        const officesToInsert = input.offices.map((off) => ({
          id: crypto12.randomUUID(),
          userId,
          label: encrypt(off.label),
          zipCode: encrypt(off.zipCode),
          street: encrypt(off.street),
          number: encrypt(off.number),
          neighborhood: encrypt(off.neighborhood),
          city: encrypt(off.city),
          state: encrypt(off.state),
          complement: off.complement ? encrypt(off.complement) : null,
          isDefault: off.isDefault,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }));
        await db2.insert(userAddresses).values(officesToInsert);
      }
      return { success: true, userId };
    } catch (error) {
      const dbError = error;
      if (dbError.message?.includes("Duplicate entry") || dbError.code === "ER_DUP_ENTRY") {
        throw new TRPCError32({
          code: "CONFLICT",
          message: "Este e-mail ou documento j\xE1 est\xE1 registrado no sistema."
        });
      }
      console.error("\u274C Erro Cr\xEDtico no Registro de Nutri:", dbError);
      throw new TRPCError32({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ocorreu um erro ao processar o seu cadastro."
      });
    }
  }),
  /**
   * ✅ DASHBOARD DE SCANS (Privado)
   * Retorna os últimos scans de IA realizados pelo nutricionista logado.
   */
  getNutriScans: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const scans = await db2.select().from(nutriScansTemp).where(eq51(nutriScansTemp.userId, ctx.user.id)).orderBy(desc23(nutriScansTemp.createdAt)).limit(10);
    return scans.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      suggestedData: s.suggestedData
    }));
  }),
  /**
   * ✅ BUSCA RESULTADO ESPECÍFICO DE IA
   * Valida se a análise pertence ao usuário que está solicitando.
   */
  getScanResult: protectedProcedure.input(z44.object({ id: z44.string() })).query(async ({ input, ctx }) => {
    const db2 = await getDb();
    const [result] = await db2.select().from(nutriScansTemp).where(
      and17(
        eq51(nutriScansTemp.id, input.id),
        eq51(nutriScansTemp.userId, ctx.user.id)
      )
    ).limit(1);
    if (!result) throw new TRPCError32({ code: "NOT_FOUND", message: "An\xE1lise n\xE3o encontrada." });
    return result;
  }),
  /**
   * ✅ LIMPEZA DE SCANS EXPIRADOS
   */
  clearExpiredScans: protectedProcedure.mutation(async () => {
    return { success: true };
  })
});

// server/routers/storefront/ai/aiRouter.ts
import { z as z45 } from "zod";
init_db();
init_schema();
import { TRPCError as TRPCError34 } from "@trpc/server";
import { eq as eq53, desc as desc24, and as and18, sql as sql25 } from "drizzle-orm";
import crypto14 from "crypto";

// server/queues/nutriQueue.ts
import { Queue as Queue2 } from "bullmq";
var redisUrl3 = process.env.REDIS_URL;
var redisConfig = redisUrl3 ? {
  url: redisUrl3,
  maxRetriesPerRequest: null
} : {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null
};
var NUTRI_QUEUE_NAME = "nutri-prescription-process";
var nutriQueue = new Queue2(NUTRI_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5e3
    },
    removeOnComplete: true
  }
});
async function addPrescriptionToQueue(data) {
  return await nutriQueue.add("analyze-prescription", data);
}

// server/routers/storefront/ai/AiExpertService.ts
init_db();
init_schema();
import { sql as sql24, eq as eq52, or as or6 } from "drizzle-orm";
import crypto13 from "crypto";

// server/lib/ai-safety.ts
import { TRPCError as TRPCError33 } from "@trpc/server";
var MAX_AI_TEXT_LENGTH = 12e3;
var MAX_AI_FILE_BASE64_LENGTH = 8 * 1024 * 1024;
var BUSINESS_GUARDRAILS = [
  "pre\xE7o",
  "price",
  "discount",
  "desconto",
  "cupom",
  "coupon",
  "pedido",
  "order",
  "catalog",
  "cat\xE1logo"
];
function sanitizeTextForStorage(value, maxLength = MAX_AI_TEXT_LENGTH) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
function validateAiTextInput(value) {
  const sanitized = sanitizeTextForStorage(value, MAX_AI_TEXT_LENGTH);
  if (!sanitized) {
    throw new TRPCError33({
      code: "BAD_REQUEST",
      message: "Texto de entrada \xE9 obrigat\xF3rio."
    });
  }
  return sanitized;
}
function validateAiFileBase64(value) {
  if (!value) return void 0;
  const trimmed = value.trim();
  if (!trimmed) return void 0;
  if (trimmed.length > MAX_AI_FILE_BASE64_LENGTH) {
    throw new TRPCError33({
      code: "BAD_REQUEST",
      message: "Arquivo enviado para IA excede o limite permitido."
    });
  }
  return trimmed;
}
function assertBusinessGuardrails(text19) {
  const lower = text19.toLowerCase();
  const hits = BUSINESS_GUARDRAILS.filter((term) => lower.includes(term));
  if (hits.length >= 3) {
    throw new TRPCError33({
      code: "BAD_REQUEST",
      message: "Entrada de IA cont\xE9m instru\xE7\xF5es incompat\xEDveis com este fluxo."
    });
  }
}
function isJsonObjectLike(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function ensureSafeAiResult(value) {
  if (value == null) return [];
  if (!Array.isArray(value) && !isJsonObjectLike(value)) {
    throw new Error("Resultado de IA inv\xE1lido para persist\xEAncia.");
  }
  return value;
}

// server/routers/storefront/ai/AiExpertService.ts
var normalizeText = (text19) => {
  return text19.trim().toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s+/g, " ");
};
var AiExpertService = {
  /**
   * 🔍 1. AUTO-CONSULTA (Cache de Inteligência)
   * Busca se a IA já resolveu uma entrada similar no passado.
   */
  async findKnowledge(rawInput) {
    const db2 = await getDb();
    if (!db2 || !rawInput) return null;
    const inputStr = sanitizeTextForStorage(String(rawInput));
    const normalizedInput = normalizeText(inputStr);
    const inputHash = crypto13.createHash("sha256").update(inputStr).digest("hex");
    const normalizedHash = crypto13.createHash("sha256").update(normalizedInput).digest("hex");
    try {
      const [existing] = await db2.select().from(aiExpertLogs).where(
        or6(
          eq52(aiExpertLogs.inputHash, inputHash),
          eq52(aiExpertLogs.normalizedHash, normalizedHash)
        )
      ).limit(1);
      if (existing) {
        const data = existing.finalCorrectedJson || existing.aiSuggestedJson;
        if (!data) return null;
        return ensureSafeAiResult(
          typeof data === "string" ? JSON.parse(data) : data
        );
      }
    } catch (error) {
      console.error("\u274C [AiExpert] Falha na busca de conhecimento pr\xE9vio:", error);
    }
    return null;
  },
  /**
   * 🚀 2. TELEMETRIA (agent_runs)
   * Grava dados de performance e custo de cada chamada de IA.
   */
  async recordRun(data) {
    const db2 = await getDb();
    if (!db2) return;
    try {
      await db2.insert(agentRuns).values({
        id: data.id || crypto13.randomUUID(),
        scanId: data.scanId,
        domain: data.domain || "nutrition",
        provider: data.provider || "google",
        model: data.model || "gemini-1.5-flash",
        promptVersion: data.promptVersion || "2.0.0",
        inputTokens: data.inputTokens || 0,
        outputTokens: data.outputTokens || 0,
        latencyMs: data.latencyMs || 0,
        costEstimate: String(data.costEstimate || "0.000000"),
        rawOutput: sanitizeTextForStorage(data.rawOutput || "", 4e3),
        status: data.status || "success",
        errorMessage: data.errorMessage || null
      });
    } catch (error) {
      console.error("\u274C [AiExpert] Erro ao gravar telemetria da execu\xE7\xE3o:", error);
    }
  },
  /**
   * 🧠 3. MEMÓRIA DE LONGO PRAZO (ai_expert_logs)
   * Salva o aprendizado da IA e correções manuais para treinar o cache.
   */
  async recordExpertise(data) {
    const db2 = await getDb();
    if (!db2) return;
    const inputStr = sanitizeTextForStorage(String(data.rawInput || ""));
    const normalizedInput = normalizeText(inputStr);
    const wasCorrected = JSON.stringify(data.aiJson) !== JSON.stringify(data.finalJson);
    const inputHash = crypto13.createHash("sha256").update(inputStr).digest("hex");
    const normalizedHash = crypto13.createHash("sha256").update(normalizedInput).digest("hex");
    try {
      await db2.insert(aiExpertLogs).values({
        runId: data.runId,
        inputHash,
        normalizedHash,
        rawInputText: inputStr,
        aiSuggestedJson: ensureSafeAiResult(data.aiJson || {}),
        finalCorrectedJson: data.finalJson ? ensureSafeAiResult(data.finalJson) : null,
        confidenceScore: String(data.confidenceScore || (wasCorrected ? "1.00" : "0.80")),
        wasCorrected
      }).onDuplicateKeyUpdate({
        set: {
          finalCorrectedJson: data.finalJson ? ensureSafeAiResult(data.finalJson) : null,
          wasCorrected,
          runId: data.runId,
          updatedAt: sql24`CURRENT_TIMESTAMP()`
        }
      });
    } catch (error) {
      console.error("\u274C [AiExpert] Erro ao persistir expertise aprendida:", error);
    }
  },
  /**
   * 🎓 4. BASE DE CONHECIMENTO TÉCNICO
   * Retorna os termos técnicos mapeados para serem usados como Contexto da IA.
   */
  async getExpertKnowledgeBase() {
    const db2 = await getDb();
    if (!db2) return "";
    try {
      const terms = await db2.select().from(aiExpertTerms).where(eq52(aiExpertTerms.isActive, true));
      if (!terms || terms.length === 0) return "Nenhum termo t\xE9cnico mapeado ainda.";
      return terms.map((t2) => {
        if (!t2) return "";
        let syns = "";
        if (t2.synonyms) {
          try {
            const parsedSyns = typeof t2.synonyms === "string" ? JSON.parse(t2.synonyms) : t2.synonyms;
            syns = ` (ou: ${JSON.stringify(parsedSyns)})`;
          } catch {
            syns = "";
          }
        }
        const type = (t2.targetType || "UNKNOWN").toUpperCase();
        const id = t2.targetId || "0";
        const termName = t2.term || "Indefinido";
        return `- "${termName}"${syns} mapeia para ${type} ID: ${id}`;
      }).filter((line) => line !== "").join("\n");
    } catch (error) {
      console.error("\u274C [AiExpert] Erro ao construir Knowledge Base:", error);
      return "";
    }
  }
};

// server/routers/storefront/ai/aiRouter.ts
var aiRouter = router({
  /**
   * 🎫 BUSCAR SALDO DE CRÉDITOS
   */
  getAiStatus: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const [user] = await db2.select({ aiCredits: users.aiCredits, role: users.role }).from(users).where(eq53(users.id, ctx.user.id));
    return {
      credits: user?.aiCredits ?? 0,
      isAdmin: user?.role === "admin"
    };
  }),
  /**
   * 🔍 LISTAR SCANS DO USUÁRIO
   */
  getUserScans: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    return await db2.select({
      id: nutriScansTemp.id,
      status: nutriScansTemp.status,
      createdAt: nutriScansTemp.createdAt,
      rawText: nutriScansTemp.rawText
    }).from(nutriScansTemp).where(eq53(nutriScansTemp.userId, userId)).orderBy(desc24(nutriScansTemp.createdAt)).limit(50);
  }),
  /**
   * 🚀 DISPARADOR DE INTELIGÊNCIA (Com consumo de Token)
   */
  enqueueTask: protectedProcedure.use(
    createRateLimitMiddleware({
      keyPrefix: "ai-enqueue",
      limit: 8,
      windowMs: 10 * 60 * 1e3
    })
  ).input(z45.object({
    domain: z45.enum(["nutrition", "inventory", "support", "logistics"]),
    payload: z45.object({
      rawText: z45.string().min(1, "Texto de entrada \xE9 obrigat\xF3rio"),
      fileBase64: z45.string().optional()
    })
  })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    const taskId = crypto14.randomUUID();
    const [user] = await db2.select({ aiCredits: users.aiCredits, role: users.role }).from(users).where(eq53(users.id, userId));
    const isAdmin = user?.role === "admin";
    const hasCredits = (user?.aiCredits ?? 0) > 0;
    if (!isAdmin && !hasCredits) {
      throw new TRPCError34({
        code: "FORBIDDEN",
        message: "Seus cr\xE9ditos de IA deste m\xEAs acabaram. Eles renovam no dia 1\xBA."
      });
    }
    if (!isAdmin) {
      await db2.update(users).set({ aiCredits: sql25`ai_credits - 1` }).where(eq53(users.id, userId));
    }
    const rawText = validateAiTextInput(input.payload.rawText);
    const fileBase64 = validateAiFileBase64(input.payload.fileBase64);
    assertBusinessGuardrails(rawText);
    if (!fileBase64) {
      const cachedData = await AiExpertService.findKnowledge(rawText);
      if (cachedData) {
        const safeCachedData = ensureSafeAiResult(cachedData);
        await db2.insert(nutriScansTemp).values({
          id: taskId,
          userId,
          rawText: sanitizeTextForStorage(rawText),
          suggestedData: safeCachedData,
          status: "completed"
        });
        return { success: true, taskId, cached: true };
      }
    }
    await db2.insert(nutriScansTemp).values({
      id: taskId,
      userId,
      rawText: sanitizeTextForStorage(rawText),
      status: "pending"
    });
    await addPrescriptionToQueue({
      scanId: taskId,
      rawText,
      userId
    });
    return { success: true, taskId, cached: false };
  }),
  /**
   * 🗄️ DELETAR REGISTRO (Restrito a Admin)
   */
  archiveAndDeleteScan: protectedProcedure.input(z45.object({ id: z45.string() })).mutation(async ({ input, ctx }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    const [user] = await db2.select({ role: users.role }).from(users).where(eq53(users.id, userId));
    if (user?.role !== "admin") {
      throw new TRPCError34({
        code: "UNAUTHORIZED",
        message: "Apenas administradores podem remover registros do hist\xF3rico de IA."
      });
    }
    const [scan] = await db2.select().from(nutriScansTemp).where(and18(
      eq53(nutriScansTemp.id, input.id),
      eq53(nutriScansTemp.userId, userId)
    )).limit(1);
    if (scan) {
      await AiExpertService.recordExpertise({
        runId: `rejection_${input.id}`,
        rawInput: scan.rawText || "Remo\xE7\xE3o manual",
        aiJson: scan.suggestedData,
        finalJson: null,
        confidenceScore: 0.05
      });
      await db2.delete(nutriScansTemp).where(eq53(nutriScansTemp.id, input.id));
    }
    return { success: true };
  }),
  // Mantive o checkStatus igual, pois ele já tem validação de posse (userId)
  checkStatus: protectedProcedure.input(z45.object({
    scanId: z45.string().optional(),
    runId: z45.string().optional()
  })).query(async ({ input, ctx }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    if (input.scanId) {
      const [result] = await db2.select().from(nutriScansTemp).where(and18(
        eq53(nutriScansTemp.id, input.scanId),
        eq53(nutriScansTemp.userId, userId)
      )).limit(1);
      if (!result) throw new TRPCError34({ code: "NOT_FOUND", message: "An\xE1lise n\xE3o encontrada." });
      return { status: result.status, data: ensureSafeAiResult(result.suggestedData) };
    }
    if (input.runId) {
      const [run] = await db2.select().from(agentRuns).where(eq53(agentRuns.id, input.runId)).limit(1);
      return { status: run?.status || "not_found", error: run?.errorMessage };
    }
    throw new TRPCError34({ code: "BAD_REQUEST", message: "ID inv\xE1lido." });
  })
});

// server/routers/storefront/support/supportRouter.ts
import { z as z46 } from "zod";

// server/support/faq.ts
var SUPPORT_CONFIG = {
  supportHours: "08:00\u201314:00",
  deliverySla: "24 a 48 horas",
  // 👉 Troque pelo seu link wa.me
  whatsappUrl: "https://wa.me/551145265941?text=" + encodeURIComponent("Ol\xE1! Tenho uma d\xFAvida e preciso de ajuda com meu pedido no site.")
};
var FAQ_TOPICS = [
  {
    id: "delivery_time",
    title: "Prazo de entrega",
    keywords: ["entrega", "prazo", "chega", "quanto tempo", "demora", "24", "48"],
    answer: `O prazo m\xE9dio de entrega \xE9 ${SUPPORT_CONFIG.deliverySla}.`
  },
  {
    id: "support_hours",
    title: "Hor\xE1rio de atendimento",
    keywords: ["atendimento", "horario", "hor\xE1rio", "suporte", "funciona", "abre"],
    answer: `Nosso suporte funciona das ${SUPPORT_CONFIG.supportHours}.`,
    ctas: [{ label: "Falar no WhatsApp", href: SUPPORT_CONFIG.whatsappUrl }]
  },
  {
    id: "payment_methods",
    title: "Formas de pagamento",
    keywords: ["pagamento", "pagar", "pix", "cartao", "cart\xE3o", "credito", "d\xE9bito"],
    answer: "Aceitamos as formas de pagamento dispon\xEDveis no checkout. Se algo n\xE3o aparecer para voc\xEA, me diga qual forma deseja usar que eu te oriento.",
    ctas: [{ label: "Falar no WhatsApp", href: SUPPORT_CONFIG.whatsappUrl }]
  },
  {
    id: "delivery_area",
    title: "\xC1rea atendida",
    keywords: ["area", "\xE1rea", "atende", "bairro", "cep", "campinas", "regiao", "regi\xE3o"],
    answer: "A \xE1rea atendida \xE9 validada no checkout (com base no seu CEP). Se voc\xEA me disser seu bairro/CEP, o suporte consegue confirmar rapidinho.",
    ctas: [{ label: "Confirmar no WhatsApp", href: SUPPORT_CONFIG.whatsappUrl }]
  },
  {
    id: "order_help",
    title: "Ajuda com pedido",
    keywords: ["pedido", "comprar", "finalizar", "checkout", "carrinho", "erro"],
    answer: "Se voc\xEA teve algum problema ao finalizar o pedido, me diga em qual etapa travou (carrinho, endere\xE7o, pagamento) e qual mensagem apareceu.",
    ctas: [{ label: "Falar com suporte", href: SUPPORT_CONFIG.whatsappUrl }]
  }
];

// server/support/faqEngine.ts
function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}
function answerFromFaq(message) {
  const text19 = normalize(message);
  if (!text19) return { score: 0 };
  let best = { score: 0 };
  for (const topic of FAQ_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      const nkw = normalize(kw);
      if (!nkw) continue;
      if (text19.includes(nkw)) score += 1;
    }
    if (score > best.score) best = { topic, score };
  }
  return best;
}

// server/routers/storefront/support/supportRouter.ts
var inputSchema = z46.object({
  sessionId: z46.string().optional(),
  message: z46.string().min(1).max(800)
});
var supportRouter = router({
  chat: publicProcedure.input(inputSchema).mutation(async ({ input }) => {
    const sessionId = input.sessionId ?? crypto.randomUUID();
    const { topic, score } = answerFromFaq(input.message);
    if (topic && score >= 1) {
      return {
        sessionId,
        answer: topic.answer,
        ctas: topic.ctas ?? [],
        topicId: topic.id
      };
    }
    return {
      sessionId,
      answer: "N\xE3o consegui identificar exatamente o assunto. Voc\xEA quer falar com o suporte no WhatsApp? Se preferir, me diga: entrega, pagamento, \xE1rea atendida ou pedido.",
      ctas: [{ label: "Falar no WhatsApp", href: SUPPORT_CONFIG.whatsappUrl }],
      topicId: "unknown"
    };
  })
});

// server/routers/storefront/addresses.ts
init_schema();
import { z as z47 } from "zod";
import { and as and20, desc as desc25, eq as eq55 } from "drizzle-orm";
import { generateIdFromEntropySize as generateIdFromEntropySize2 } from "lucia";
init_db();
init_encryption();

// server/services/shippingService.ts
init_db();
init_schema();
init_encryption();
import { sql as sql26, eq as eq54, and as and19 } from "drizzle-orm";
var normalizeText2 = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
async function fetchExternalGeo(cep) {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    let lat = "0";
    let lng = "0";
    try {
      const fullAddr = `${data.logradouro}, ${data.localidade} - ${data.uf}`;
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddr)}&limit=1`,
        { headers: { "User-Agent": "GourmetSaudavel-Server-Validator" } }
      );
      const geoData = await geoRes.json();
      if (geoData && geoData[0]) {
        lat = geoData[0].lat;
        lng = geoData[0].lon;
      }
    } catch {
      console.warn(
        `Aviso: Nao foi possivel obter coordenadas para o CEP ${cep}, usando 0,0.`
      );
    }
    return {
      city: data.localidade,
      neighborhood: data.bairro || "Nao Informado",
      lat,
      lng
    };
  } catch {
    return null;
  }
}
async function globalShippingValidator(cep, storeSlug = "jundiai") {
  const db2 = await getDb();
  const cleanCep = cep.replace(/\D/g, "");
  const config = await db2.query.appConfigs.findFirst({
    where: eq54(appConfigs.configKey, `store_address_${storeSlug}`)
  });
  const decryptedValue = config?.configValue ? decrypt(config.configValue) : "{}";
  const settings = safeJsonParse(decryptedValue, {});
  const allowedCities = Array.isArray(settings.allowedCities) ? settings.allowedCities.map((city) => safeString(city)).filter(Boolean) : [];
  const minOrderValue = safeNumber(settings.minOrderValue, 0);
  const minOrderMessage = safeString(
    settings.minOrderMessage,
    "Valor minimo nao atingido para entrega."
  );
  const resultMesh = await db2.execute(sql26`
    SELECT * FROM geo_mesh 
    WHERE cep = ${cleanCep} AND store_slug = ${storeSlug} 
    LIMIT 1
  `);
  const rows = resultMesh[0] || resultMesh;
  const meshRecord = rows.length > 0 ? rows[0] : null;
  if (meshRecord) {
    const finalCost = meshRecord.price ?? meshRecord.shipping_cost ?? 0;
    return {
      isValid: true,
      cityAllowed: true,
      shippingCost: safeNumber(finalCost),
      source: "mesh",
      minOrderValue,
      minOrderMessage
    };
  }
  const geoInfo = await fetchExternalGeo(cleanCep);
  if (!geoInfo) {
    return {
      isValid: false,
      cityAllowed: false,
      shippingCost: 0,
      source: "not_found",
      minOrderValue,
      minOrderMessage
    };
  }
  const isCityAllowed = allowedCities.some(
    (city) => normalizeText2(city) === normalizeText2(geoInfo.city)
  );
  if (!isCityAllowed) {
    return {
      isValid: false,
      cityAllowed: false,
      shippingCost: 0,
      source: "city_denied",
      minOrderValue,
      minOrderMessage
    };
  }
  const rules = await db2.query.shippingZones.findMany({
    where: and19(eq54(shippingZones.storeSlug, storeSlug), eq54(shippingZones.isActive, true))
  });
  const precoPadrao = rules.length > 0 ? safeNumber(rules[0].shippingCost, 0) : 0;
  try {
    const bairroSeguro = geoInfo.neighborhood && geoInfo.neighborhood.trim() !== "" ? geoInfo.neighborhood : "Nao Informado";
    const cidadeSegura = geoInfo.city || "Desconhecida";
    await db2.execute(sql26`
      INSERT INTO geo_mesh (
        cep, bairro, cidade, store_slug, lat, lng, price, last_seen
      ) VALUES (
        ${cleanCep}, 
        ${bairroSeguro}, 
        ${cidadeSegura}, 
        ${storeSlug}, 
        ${geoInfo.lat}, 
        ${geoInfo.lng}, 
        ${precoPadrao}, 
        NOW()
      )
      ON DUPLICATE KEY UPDATE 
        price = VALUES(price),
        lat = VALUES(lat),
        lng = VALUES(lng),
        bairro = VALUES(bairro),
        last_seen = NOW()
    `);
  } catch (insertError) {
    console.error("[ShippingService] Falha ao guardar na geo_mesh:", insertError);
  }
  return {
    isValid: true,
    cityAllowed: true,
    shippingCost: precoPadrao,
    source: "city_bypass",
    minOrderValue,
    minOrderMessage
  };
}

// server/routers/storefront/addresses.ts
var addressIdSchema = z47.string().min(1);
var addressInputSchema = z47.object({
  label: z47.string().trim().optional().nullable(),
  street: z47.string().trim().min(1, "Rua \xE9 obrigat\xF3ria."),
  number: z47.string().trim().min(1, "N\xFAmero \xE9 obrigat\xF3rio."),
  complement: z47.string().trim().optional().nullable(),
  neighborhood: z47.string().trim().min(1, "Bairro \xE9 obrigat\xF3rio."),
  city: z47.string().trim().min(1, "Cidade \xE9 obrigat\xF3ria."),
  state: z47.string().trim().transform((value) => value.toUpperCase()).refine((value) => /^[A-Z]{2}$/.test(value), "UF inv\xE1lida."),
  zipCode: z47.string().transform((value) => normalizeDigits(value)).refine((value) => value.length === 8, "CEP inv\xE1lido."),
  phone: z47.string().transform((value) => normalizeDigits(value)).refine(
    (value) => value.length === 0 || value.length === 10 || value.length === 11,
    "Telefone inv\xE1lido."
  ).optional().nullable(),
  isDefault: z47.boolean().optional()
});
function safeDecrypt(value) {
  if (value == null) return "";
  try {
    const raw = value instanceof Buffer ? value.toString("utf8") : String(value);
    if (raw.split(":").length !== 3) return raw;
    return decrypt(raw) || raw;
  } catch {
    return String(value);
  }
}
function toFront(addr) {
  return {
    ...addr,
    id: String(addr.id),
    label: safeDecrypt(addr.label) || "Endere\xE7o",
    street: safeDecrypt(addr.street),
    number: safeDecrypt(addr.number) || "S/N",
    complement: safeDecrypt(addr.complement) || "",
    neighborhood: safeDecrypt(addr.neighborhood) || "",
    city: safeDecrypt(addr.city) || "",
    state: safeDecrypt(addr.state) || "",
    zipCode: safeDecrypt(addr.zipCode),
    phone: safeDecrypt(addr.phone) || "",
    isDefault: !!addr.isDefault
  };
}
function buildInsertValues(userId, input, id) {
  return {
    id,
    userId,
    label: encrypt(input.label || "Endere\xE7o"),
    street: encrypt(input.street),
    number: encrypt(input.number),
    complement: encrypt(input.complement || ""),
    neighborhood: encrypt(input.neighborhood),
    city: encrypt(input.city),
    state: encrypt(input.state),
    zipCode: encrypt(input.zipCode),
    phone: encrypt(input.phone || ""),
    isDefault: !!input.isDefault
  };
}
var addressesRouter = router({
  validateZipZone: publicProcedure.input(
    z47.object({
      zipCode: z47.string().optional().nullable(),
      addressId: addressIdSchema.optional().nullable(),
      storeSlug: z47.string().optional().default("jundiai")
    })
  ).query(async ({ ctx, input }) => {
    const db2 = await getDb();
    let zipToValidate = normalizeDigits(input.zipCode || "");
    if (input.addressId && input.addressId !== "undefined") {
      const currentUserId = ctx.user?.id ? String(ctx.user.id) : null;
      if (currentUserId) {
        const [addr] = await db2.select({ zipCode: userAddresses.zipCode }).from(userAddresses).where(
          and20(
            eq55(userAddresses.id, input.addressId),
            eq55(userAddresses.userId, currentUserId)
          )
        ).limit(1);
        if (!addr) {
          return {
            isValid: false,
            message: "Endere\xE7o inv\xE1lido ou n\xE3o autorizado."
          };
        }
        zipToValidate = normalizeDigits(safeDecrypt(addr.zipCode));
      }
    }
    if (zipToValidate.length !== 8) {
      return { isValid: false, message: "CEP inv\xE1lido ou n\xE3o informado." };
    }
    return globalShippingValidator(zipToValidate, input.storeSlug);
  }),
  create: protectedProcedure.input(addressInputSchema).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    if (input.isDefault) {
      await db2.update(userAddresses).set({ isDefault: false }).where(eq55(userAddresses.userId, userId));
    }
    const id = generateIdFromEntropySize2(15);
    const insertValues = buildInsertValues(userId, input, id);
    await db2.insert(userAddresses).values(insertValues);
    void logAction(
      { ...ctx, user: { id: userId } },
      "CREATE_ADDRESS",
      "user_addresses",
      { entityId: id }
    );
    return { success: true, id };
  }),
  update: protectedProcedure.input(addressInputSchema.partial().extend({ id: addressIdSchema })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    const userId = ctx.user.id;
    const { id, ...rawData } = input;
    const [existing] = await db2.select().from(userAddresses).where(and20(eq55(userAddresses.id, id), eq55(userAddresses.userId, userId))).limit(1);
    if (!existing) {
      throw new Error("Endere\xE7o n\xE3o encontrado.");
    }
    if (rawData.isDefault) {
      await db2.update(userAddresses).set({ isDefault: false }).where(eq55(userAddresses.userId, userId));
    }
    const data = rawData;
    await db2.update(userAddresses).set({
      label: data.label !== void 0 ? encrypt(data.label || "Endere\xE7o") : existing.label,
      street: data.street !== void 0 ? encrypt(data.street) : existing.street,
      number: data.number !== void 0 ? encrypt(data.number) : existing.number,
      complement: data.complement !== void 0 ? encrypt(data.complement || "") : existing.complement,
      neighborhood: data.neighborhood !== void 0 ? encrypt(data.neighborhood) : existing.neighborhood,
      city: data.city !== void 0 ? encrypt(data.city) : existing.city,
      state: data.state !== void 0 ? encrypt(data.state) : existing.state,
      zipCode: data.zipCode !== void 0 ? encrypt(data.zipCode) : existing.zipCode,
      phone: data.phone !== void 0 ? encrypt(data.phone || "") : existing.phone,
      isDefault: data.isDefault !== void 0 ? !!data.isDefault : !!existing.isDefault
    }).where(and20(eq55(userAddresses.id, id), eq55(userAddresses.userId, userId)));
    void logAction(
      { ...ctx, user: { id: userId } },
      "UPDATE_ADDRESS",
      "user_addresses",
      { entityId: id }
    );
    return { success: true };
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    const rows = await db2.select().from(userAddresses).where(eq55(userAddresses.userId, ctx.user.id)).orderBy(desc25(userAddresses.isDefault));
    return rows.map(toFront);
  }),
  getStoreSettings: publicProcedure.query(async () => {
    const db2 = await getDb();
    const [store] = await db2.select().from(storeSettings).limit(1);
    const [shipping] = await db2.select().from(shippingSettings).limit(1);
    return {
      generalMinOrderAmount: store?.generalMinOrderAmount || "0.00",
      pickupEnabled: !!shipping?.pickupEnabled,
      pickupLabel: shipping?.pickupLabel || "Retirada Gourmet Saud\xE1vel",
      pickupInstruction: shipping?.pickupInstruction || "Segunda a Sexta, das 09h \xE0s 18h.",
      minOrderMessage: store?.minOrderMessage || "O valor m\xEDnimo para entrega n\xE3o foi atingido."
    };
  }),
  delete: protectedProcedure.input(z47.object({ id: addressIdSchema })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    await db2.delete(userAddresses).where(
      and20(
        eq55(userAddresses.id, input.id),
        eq55(userAddresses.userId, ctx.user.id)
      )
    );
    return { success: true };
  })
});

// server/routers/storefront/cart/index.ts
import { z as z50 } from "zod";
init_schema();
import { eq as eq63, and as and26, or as or10, desc as desc29 } from "drizzle-orm";
import crypto16 from "crypto";
import { TRPCError as TRPCError39 } from "@trpc/server";

// server/routers/storefront/cart/items.ts
import { z as z48 } from "zod";
init_schema();
import { eq as eq61, and as and24, or as or9, desc as desc28 } from "drizzle-orm";
import crypto15 from "crypto";
import { TRPCError as TRPCError37 } from "@trpc/server";

// server/routers/storefront/cart/logic.ts
init_schema();
import { asc as asc16, eq as eq60 } from "drizzle-orm";

// server/loyalty.ts
init_db();
init_schema();
import { eq as eq56, desc as desc26, like as like8, or as or7, count as count5, and as and21, sum as sum3, sql as sql27 } from "drizzle-orm";
async function getLoyaltySettings() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const settings = await db2.select().from(loyaltySettings).limit(1);
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
      pointsPerSignup: 100
      // ✅ CORREÇÃO: Removido 'pointsPerReview' pois não existe no Schema
    });
    return (await db2.select().from(loyaltySettings).limit(1))[0];
  }
  return settings[0];
}
async function getUserPoints(userId) {
  const db2 = await getDb();
  if (!db2) return { current_points: 0, lifetime_points: 0 };
  try {
    const history = await db2.select().from(loyaltyHistory).where(eq56(loyaltyHistory.userId, userId));
    let current = 0;
    let lifetime = 0;
    history.forEach((row) => {
      const p = safeNumber(row.pointsChange, 0);
      current += p;
      if (p > 0) lifetime += p;
    });
    return {
      current_points: current,
      lifetime_points: lifetime,
      points: current,
      balance: current,
      total: current
    };
  } catch {
    return { current_points: 0, lifetime_points: 0 };
  }
}

// shared/domain/cart/pricing.ts
function calculatePricing(items, rules = []) {
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const activeRules = rules.map((r) => ({
    id: Number(r.id),
    name: r.name ?? "Desconto",
    minQuantity: Number(r.minQuantity || 0),
    discountValue: Number(r.discountValue || r.discount_value || 0),
    isActive: Boolean(r.isActive)
  })).filter((r) => r.isActive).sort((a, b) => a.minQuantity - b.minQuantity);
  const currentRule = [...activeRules].reverse().find((r) => itemCount >= r.minQuantity) || null;
  const discounts = currentRule ? subtotal * (currentRule.discountValue / 100) : 0;
  return {
    subtotal,
    discounts,
    total: subtotal - discounts,
    appliedRule: currentRule
  };
}

// server/routers/storefront/cart/logic.ts
import { TRPCError as TRPCError36 } from "@trpc/server";

// server/orders/logic/recalculateOrder.ts
init_db();
init_schema();
import { TRPCError as TRPCError35 } from "@trpc/server";
import { and as and23, asc as asc15, desc as desc27, eq as eq59, or as or8 } from "drizzle-orm";

// server/dishes.ts
init_db();
import { eq as eq57, and as and22, asc as asc13 } from "drizzle-orm";
init_catalog();
async function getDishDetails(dishId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  try {
    const dishRows = await db2.select({
      id: dishes.id,
      name: dishes.name,
      slug: dishes.slug,
      description: dishes.description,
      imageUrl: dishes.imageUrl,
      price: dishes.basePrice,
      salePrice: dishes.salePrice,
      categoryId: dishes.categoryId,
      isActive: dishes.isActive,
      show_nutrition: dishes.showNutrition,
      ingredients: dishes.ingredients,
      energyKcal: dishes.energyKcal,
      energyKj: dishes.energyKj,
      proteins: dishes.proteins,
      carbs: dishes.carbs,
      fatTotal: dishes.fatTotal,
      sodium: dishes.sodium,
      fiber: dishes.fiber,
      calcium: dishes.calcium,
      iron: dishes.iron
    }).from(dishes).where(eq57(dishes.id, dishId)).limit(1);
    if (!dishRows || dishRows.length === 0) {
      return null;
    }
    const rawDish = dishRows[0];
    const sizes = await db2.select({
      id: dishSizes.id,
      name: dishSizes.name,
      price: dishSizes.price,
      priceModifier: dishSizes.priceModifier,
      mainDishWeight: dishSizes.mainDishWeight,
      isActive: dishSizes.isActive,
      displayOrder: dishSizes.displayOrder
    }).from(dishSizes).innerJoin(dishesToSizes, eq57(dishSizes.id, dishesToSizes.sizeId)).where(and22(eq57(dishesToSizes.dishId, dishId), eq57(dishSizes.isActive, true))).orderBy(asc13(dishSizes.displayOrder));
    const allOptions = await getAccsWithNutrition() || [];
    const sizesWithGroups = await Promise.all(
      (sizes || []).map(async (size) => {
        const rawGroups = await db2.select({
          pivot: sizeAccompanimentGroups,
          group: accompanimentGroups
        }).from(sizeAccompanimentGroups).innerJoin(accompanimentGroups, eq57(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id)).where(and22(
          eq57(sizeAccompanimentGroups.sizeId, size.id),
          eq57(accompanimentGroups.isActive, true)
        ));
        const groupsWithOptions = (rawGroups || []).map((row) => {
          const { group, pivot } = row;
          if (!group || !pivot) return null;
          let itemsConfig = [];
          try {
            itemsConfig = typeof group.itemsOrder === "string" ? JSON.parse(group.itemsOrder) : group.itemsOrder || [];
          } catch {
            itemsConfig = [];
          }
          const relevantOptions = (Array.isArray(itemsConfig) ? itemsConfig : []).map((config) => {
            const c = config;
            const optId = c?.optionId || c?.id || c?.group_id || c;
            const masterOpt = allOptions.find((opt) => Number(opt.id) === Number(optId));
            if (!masterOpt) return null;
            return {
              ...masterOpt,
              id: Number(masterOpt.id),
              priceModifier: Number(c?.priceModifier || c?.price_modifier || masterOpt.priceModifier || 0),
              energyKcal: Number(masterOpt.energyKcal || 0),
              proteins: Number(masterOpt.proteins || 0),
              carbs: Number(masterOpt.carbs || 0),
              fatTotal: Number(masterOpt.fatTotal || 0),
              sodium: Number(masterOpt.sodium || 0),
              fiber: Number(masterOpt.fiber || 0),
              calcium: Number(masterOpt.calcium || 0),
              iron: Number(masterOpt.iron || 0)
            };
          }).filter(Boolean);
          return {
            id: pivot.id,
            groupId: group.id,
            name: group.name,
            defaultGrammage: Number(group.defaultGrammage || 100),
            minSelections: Number(pivot.minSelections ?? group.minSelections ?? 0),
            maxSelections: Number(pivot.maxSelections ?? group.maxSelections ?? 1),
            options: relevantOptions
          };
        }).filter(Boolean);
        return {
          ...size,
          id: Number(size.id),
          price: Number(size.price || 0),
          priceModifier: Number(size.priceModifier || 0),
          mainDishWeight: Number(size.mainDishWeight || 200),
          accompanimentGroups: groupsWithOptions
        };
      })
    );
    const finalNutrition = {
      kcal: Math.round(Number(rawDish.energyKcal || 0)),
      kj: Math.round(Number(rawDish.energyKj || Number(rawDish.energyKcal) * 4.184 || 0)),
      proteins: Number(rawDish.proteins || 0),
      carbs: Number(rawDish.carbs || 0),
      fats: Number(rawDish.fatTotal || 0),
      sodium: Number(rawDish.sodium || 0),
      fiber: Number(rawDish.fiber || 0),
      calcium: Number(rawDish.calcium || 0),
      iron: Number(rawDish.iron || 0)
    };
    return {
      ...rawDish,
      id: Number(rawDish.id),
      slug: rawDish.slug || String(rawDish.id),
      categoryId: rawDish.categoryId ? Number(rawDish.categoryId) : null,
      price: Number(rawDish.price || 0),
      salePrice: rawDish.salePrice ? Number(rawDish.salePrice) : null,
      showNutrition: !!rawDish.show_nutrition,
      ingredients: rawDish.ingredients || "",
      energyKcal: Number(rawDish.energyKcal || 0),
      proteins: Number(rawDish.proteins || 0),
      carbs: Number(rawDish.carbs || 0),
      fatTotal: Number(rawDish.fatTotal || 0),
      sodium: Number(rawDish.sodium || 0),
      fiber: Number(rawDish.fiber || 0),
      calcium: Number(rawDish.calcium || 0),
      iron: Number(rawDish.iron || 0),
      nutritional_info: finalNutrition,
      sizes: sizesWithGroups
    };
  } catch {
    throw new Error(`Falha ao carregar o prato.`);
  }
}

// server/packages.ts
init_db();
init_packages();
init_schema();
import { eq as eq58, inArray as inArray9, asc as asc14, sql as sql28 } from "drizzle-orm";
var toNum2 = (val) => {
  if (val === null || val === void 0) return 0;
  if (typeof val === "string") {
    return safeNumber(val.replace(",", "."));
  }
  return typeof val === "number" ? val : 0;
};
function formatOption(opt, grammage, priceModifier) {
  return {
    id: safeInteger(opt.id),
    name: opt.name,
    ingredients: opt.ingredients || "",
    priceModifier: toNum2(priceModifier || opt.priceModifier || 0),
    defaultGrammage: grammage,
    nutritional_info: {
      kcal: toNum2(opt.kcal),
      proteins: toNum2(opt.proteins),
      carbs: toNum2(opt.carbs),
      fats: toNum2(opt.fats),
      sodium: toNum2(opt.sodium),
      fiber: toNum2(opt.fiber)
    }
  };
}
async function getPackageById(idInput) {
  const db2 = await getDb();
  if (!db2) throw new Error("Base de dados n\xE3o dispon\xEDvel");
  const id = String(idInput);
  try {
    const results = await db2.select({
      package: {
        id: packages.id,
        name: packages.name,
        price: packages.price,
        salePrice: packages.salePrice,
        imageUrl: packages.imageUrl,
        config: packages.config,
        sizeId: packages.sizeId
      },
      size: {
        id: dishSizes.id,
        name: dishSizes.name,
        weight: sql28`main_dish_weight`,
        proteinWeight: sql28`main_dish_weight`
      }
    }).from(packages).leftJoin(dishSizes, eq58(packages.sizeId, dishSizes.id)).where(eq58(packages.id, id)).limit(1);
    const row = results[0];
    if (!row || !row.package) return null;
    const { package: pkg, size } = row;
    let config = { slots: [] };
    config = safeJsonParse(pkg.config, { slots: [] });
    const slots = Array.isArray(config?.slots) ? config.slots : [];
    const allDishIds = [];
    slots.forEach((slot) => {
      (slot.dishIds || []).forEach((dishId) => {
        const n = safeInteger(dishId, Number.NaN);
        if (Number.isFinite(n) && n > 0) allDishIds.push(n);
      });
    });
    const uniqueDishIds = [...new Set(allDishIds)];
    let allFetchedDishes = [];
    if (uniqueDishIds.length > 0) {
      allFetchedDishes = await db2.select({
        id: dishes.id,
        name: dishes.name,
        price: dishes.basePrice,
        ingredients: sql28`dishes.ingredients`,
        kcal: sql28`COALESCE(energy_kcal, 0)`,
        proteins: sql28`COALESCE(proteins, 0)`,
        carbs: sql28`COALESCE(carbs, 0)`,
        fats: sql28`COALESCE(fat_total, 0)`,
        sodium: sql28`COALESCE(sodium, 0)`,
        fiber: sql28`COALESCE(fiber, 0)`
      }).from(dishes).where(inArray9(dishes.id, uniqueDishIds));
    }
    const hasAnyGroups = slots.some((s) => Array.isArray(s.groups) && s.groups.length > 0);
    let allFetchedGroups = [];
    let allFetchedOptions = [];
    const allowedAccompaniments = [];
    if (hasAnyGroups) {
      const groupsRaw = await db2.select({
        id: accompanimentGroups.id,
        name: accompanimentGroups.name,
        minSelections: accompanimentGroups.minSelections,
        maxSelections: accompanimentGroups.maxSelections,
        defaultGrammage: sql28`COALESCE(default_grammage, 100)`,
        itemsOrder: accompanimentGroups.itemsOrder
      }).from(accompanimentGroups);
      allFetchedOptions = await db2.select({
        id: accompanimentOptions.id,
        name: accompanimentOptions.name,
        ingredients: sql28`accompaniment_options.ingredients`,
        groupsConfig: sql28`groups_config`,
        accompanimentCategoryId: accompanimentOptions.accompanimentCategoryId,
        priceModifier: sql28`price_modifier`,
        kcal: sql28`COALESCE(energy_kcal, 0)`,
        proteins: sql28`COALESCE(proteins, 0)`,
        carbs: sql28`COALESCE(carbs, 0)`,
        fats: sql28`COALESCE(fat_total, 0)`,
        sodium: sql28`COALESCE(sodium, 0)`,
        fiber: sql28`COALESCE(fiber, 0)`
      }).from(accompanimentOptions).where(eq58(accompanimentOptions.isActive, true));
      allFetchedGroups = groupsRaw.map((group) => {
        let itemsFromOrder = [];
        try {
          itemsFromOrder = safeJsonParse(group.itemsOrder, []);
        } catch {
          itemsFromOrder = [];
        }
        const grammage = toNum2(group.defaultGrammage);
        const groupOptions = itemsFromOrder.length > 0 ? itemsFromOrder.map((conf) => {
          const opt = allFetchedOptions.find((o) => safeInteger(o.id) === safeInteger(conf.id || conf.group_id));
          if (!opt) return null;
          const formatted = formatOption(opt, grammage, conf.price_modifier);
          allowedAccompaniments.push(formatted);
          return formatted;
        }).filter(Boolean) : allFetchedOptions.map((opt) => {
          const configs = safeJsonParse(opt.groupsConfig, []);
          const link = Array.isArray(configs) ? configs.find((c) => safeInteger(c.group_id) === safeInteger(group.id)) : void 0;
          if (!link) return null;
          const formatted = formatOption(opt, grammage, link.price_modifier);
          allowedAccompaniments.push(formatted);
          return formatted;
        }).filter(Boolean);
        return {
          id: safeInteger(group.id),
          name: group.name,
          minSelections: safeInteger(group.minSelections),
          maxSelections: safeInteger(group.maxSelections, 1),
          defaultGrammage: grammage,
          options: groupOptions
        };
      });
    }
    const optionToGroupId = /* @__PURE__ */ new Map();
    allFetchedGroups.forEach((group) => {
      (group.options || []).forEach((opt) => {
        const optId = safeInteger(opt.id, Number.NaN);
        const gId = safeInteger(group.id, Number.NaN);
        if (Number.isFinite(optId) && Number.isFinite(gId) && !optionToGroupId.has(optId)) {
          optionToGroupId.set(optId, gId);
        }
      });
    });
    const formattedOptions = slots.map((slot, index4) => {
      const slotDishIds = (slot.dishIds || []).map((dishId) => safeInteger(dishId, Number.NaN)).filter(Number.isFinite);
      const slotGroups = slot.groups || [];
      const accompanimentGroupsForSlot = slotGroups.map((groupConfig) => {
        const rawId = String(groupConfig.id);
        const numericId = safeInteger(groupConfig.id, Number.NaN);
        const hasOptionIds = Array.isArray(groupConfig.optionIds) && groupConfig.optionIds.length > 0;
        const dbGroup = allFetchedGroups.find((g) => safeInteger(g.id) === numericId);
        if (Number.isFinite(numericId) && dbGroup) {
          return {
            ...dbGroup,
            // Preserve user's custom label if set
            name: groupConfig.customLabel || dbGroup.name
          };
        }
        if (hasOptionIds) {
          const selectedOptionIds = groupConfig.optionIds.map((optId) => safeInteger(optId, Number.NaN)).filter(Number.isFinite);
          const options = selectedOptionIds.map((optId) => allFetchedOptions.find((o) => safeInteger(o.id) === optId)).filter(Boolean).map((opt) => {
            const parentGroupId = optionToGroupId.get(safeInteger(opt.id));
            const parentGroup = parentGroupId ? allFetchedGroups.find((g) => safeInteger(g.id) === parentGroupId) : null;
            const grammage = toNum2(parentGroup?.defaultGrammage || 100);
            const formatted = formatOption(opt, grammage);
            if (!allowedAccompaniments.some((a) => safeInteger(a.id) === safeInteger(opt.id))) {
              allowedAccompaniments.push(formatted);
            }
            return formatted;
          });
          return {
            // Use the UUID as ID so the client can match it back
            id: rawId,
            name: groupConfig.customLabel || "Acompanhamento",
            minSelections: 0,
            maxSelections: 1,
            defaultGrammage: 100,
            options
          };
        }
        const resolvedGroupId = optionToGroupId.get(numericId);
        const fallbackGroup = resolvedGroupId ? allFetchedGroups.find((g) => safeInteger(g.id) === resolvedGroupId) : null;
        if (fallbackGroup) {
          return { ...fallbackGroup, name: groupConfig.customLabel || fallbackGroup.name };
        }
        return null;
      }).filter(Boolean);
      return {
        mealIndex: index4,
        label: slot.name || `Refei\xE7\xE3o ${index4 + 1}`,
        dishes: allFetchedDishes.filter((d) => slotDishIds.includes(safeInteger(d.id))).map((d) => ({
          id: safeInteger(d.id),
          name: d.name,
          price: toNum2(d.price),
          nutritional_info: {
            kcal: toNum2(d.kcal),
            proteins: toNum2(d.proteins),
            carbs: toNum2(d.carbs),
            fats: toNum2(d.fats),
            sodium: toNum2(d.sodium),
            fiber: toNum2(d.fiber)
          }
        })),
        accompanimentGroups: accompanimentGroupsForSlot
      };
    });
    const uniqueAllowedAccs = allowedAccompaniments.filter(
      (v, i, a) => a.findIndex((t2) => safeInteger(t2.id) === safeInteger(v.id)) === i
    );
    return {
      id: String(pkg.id),
      name: pkg.name,
      price: toNum2(pkg.price),
      salePrice: toNum2(pkg.salePrice),
      imageUrl: pkg.imageUrl,
      allowedAccompaniments: uniqueAllowedAccs,
      size: size ? { ...size, weight: toNum2(size.weight), proteinWeight: toNum2(size.proteinWeight) } : null,
      options: formattedOptions
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Erro ao processar pacote: ${msg}`);
  }
}
async function getAllPackages() {
  const db2 = await getDb();
  if (!db2) return [];
  try {
    const result = await db2.select({
      package: {
        id: packages.id,
        name: packages.name,
        price: packages.price,
        salePrice: packages.salePrice,
        imageUrl: packages.imageUrl,
        isActive: packages.isActive,
        numberOfOptions: packages.numberOfOptions
      },
      sizeName: dishSizes.name
    }).from(packages).leftJoin(dishSizes, eq58(packages.sizeId, dishSizes.id)).where(eq58(packages.isActive, true)).orderBy(asc14(packages.name));
    return (result || []).map((r) => ({
      ...r.package,
      id: String(r.package.id),
      price: toNum2(r.package.price),
      salePrice: toNum2(r.package.salePrice),
      sizeName: r.sizeName || "Padr\xE3o"
    }));
  } catch {
    return [];
  }
}

// shared/domain/math/pricing.ts
function calculateItemUnitPrice(basePrice, options, isPackage = false) {
  if (isPackage) {
    return Number(basePrice) || 0;
  }
  const base = Number(basePrice) || 0;
  const size = options?.size;
  const sizeModifier = Number(size?.price_modifier || 0);
  const sizeDiff = Number(size?.priceDiff || 0);
  const priceAfterSize = base * (1 + sizeModifier / 100) + sizeDiff;
  let accsTotal = 0;
  const accList = options?.accompaniments;
  if (Array.isArray(accList)) {
    accsTotal = accList.reduce((sum4, acc) => {
      const val = Number(acc?.price || acc?.price_modifier || acc?.priceModifier || 0);
      const type = String(acc?.type || acc?.priceModifierType || "fixed").toLowerCase();
      if (type === "percentage") {
        return sum4 + priceAfterSize * (val / 100);
      }
      return sum4 + val;
    }, 0);
  }
  const total = priceAfterSize + accsTotal;
  return Number(total.toFixed(2));
}

// server/orders/logic/recalculateOrder.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function toNumber(value, fallback = 0) {
  return safeNumber(value, fallback);
}
function toNullableId(value) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}
function toMeaningfulString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
function parseRecord(value) {
  if (isRecord(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};
  const parsed = safeJsonParse(value, {});
  return isRecord(parsed) ? parsed : {};
}
function parseSelectedAccs(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    result.push({
      id: typeof entry.id === "string" || typeof entry.id === "number" ? entry.id : void 0,
      name: toMeaningfulString(entry.name) || void 0,
      label: toMeaningfulString(entry.label) || void 0,
      weight: typeof entry.weight === "number" || typeof entry.weight === "string" ? entry.weight : void 0,
      groupId: typeof entry.groupId === "string" || typeof entry.groupId === "number" ? entry.groupId : void 0,
      groupName: toMeaningfulString(entry.groupName) || void 0
    });
  }
  return result;
}
function parseSelectedMeals(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    result.push({
      label: toMeaningfulString(entry.label) || void 0,
      dishId: typeof entry.dishId === "string" || typeof entry.dishId === "number" ? entry.dishId : void 0,
      dishName: toMeaningfulString(entry.dishName) || void 0,
      accompaniments: parseSelectedAccs(entry.accompaniments),
      selectedAccompaniments: parseSelectedAccs(entry.selectedAccompaniments),
      selectedAccs: parseSelectedAccs(entry.selectedAccs)
    });
  }
  return result;
}
function pickSelectedAccs(options) {
  return parseSelectedAccs(options.selectedAccs) || parseSelectedAccs(options.selectedAccompaniments) || parseSelectedAccs(options.accompaniments);
}
function getSelectedAccsFromMeal(meal) {
  if (meal.accompaniments && meal.accompaniments.length > 0) return meal.accompaniments;
  if (meal.selectedAccompaniments && meal.selectedAccompaniments.length > 0) {
    return meal.selectedAccompaniments;
  }
  return meal.selectedAccs || [];
}
function roundMoney(value) {
  return safeNumber(value.toFixed(2));
}
function getDishBasePrice(dish) {
  const basePrice = toNumber(dish.salePrice || dish.price || dish.basePrice);
  const fallbackPrice = toNumber(dish.price || dish.basePrice);
  return basePrice > 0 ? basePrice : fallbackPrice;
}
function getPackageBasePrice(pkg) {
  const salePrice = toNumber(pkg.salePrice);
  const basePrice = toNumber(pkg.price);
  return salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
}
function matchGroupForAcc(groups, accId, providedGroupId) {
  if (providedGroupId !== void 0) {
    const exact = groups.find((group) => {
      const groupId = group.groupId ?? group.id;
      if (String(groupId) !== String(providedGroupId)) return false;
      const options = Array.isArray(group.options) ? group.options : [];
      return options.some((option) => toNumber(option.id) === accId);
    });
    if (exact) return exact;
  }
  return groups.find((group) => {
    const options = Array.isArray(group.options) ? group.options : [];
    return options.some((option) => toNumber(option.id) === accId);
  });
}
function ensureGroupSelections(groups, counts, contextName) {
  for (const group of groups) {
    const groupId = String(group.groupId ?? group.id);
    const count6 = counts.get(groupId) || 0;
    const minSelections = toNumber(group.minSelections);
    const maxSelections = Math.max(1, toNumber(group.maxSelections, 1));
    if (count6 < minSelections) {
      throw new TRPCError35({
        code: "BAD_REQUEST",
        message: `${contextName}: faltam sele\xE7\xF5es obrigat\xF3rias em ${String(group.name || "acompanhamentos")}.`
      });
    }
    if (count6 > maxSelections) {
      throw new TRPCError35({
        code: "BAD_REQUEST",
        message: `${contextName}: limite excedido em ${String(group.name || "acompanhamentos")}.`
      });
    }
  }
}
async function recalculateSingleItem(quantity, dishId, options, appliedNutrition) {
  const parsedDishId = toNumber(dishId, NaN);
  if (!Number.isFinite(parsedDishId)) {
    throw new TRPCError35({ code: "BAD_REQUEST", message: "Prato inv\xC3\xA1lido ou inativo." });
  }
  const dish = await getDishDetails(parsedDishId);
  if (!dish || dish.isActive === false) {
    throw new TRPCError35({ code: "BAD_REQUEST", message: "Prato inv\xE1lido ou inativo." });
  }
  const sizes = Array.isArray(dish.sizes) ? dish.sizes : [];
  const selectedSizeId = toNullableId(options.selectedSizeId ?? options.sizeId);
  if (!selectedSizeId) {
    throw new TRPCError35({
      code: "BAD_REQUEST",
      message: `Selecione o tamanho de ${String(dish.name || "seu prato")}.`
    });
  }
  const selectedSize = sizes.find((size) => String(size.id) === selectedSizeId) || null;
  if (!selectedSize) {
    throw new TRPCError35({
      code: "BAD_REQUEST",
      message: `Tamanho inv\xE1lido para ${String(dish.name || "o prato")}.`
    });
  }
  const groups = Array.isArray(selectedSize.accompanimentGroups) ? selectedSize.accompanimentGroups : [];
  const selectedAccs = pickSelectedAccs(options);
  const authoritativeAccs = [];
  const counts = /* @__PURE__ */ new Map();
  for (const selectedAcc of selectedAccs) {
    const accId = toNumber(selectedAcc.id, NaN);
    if (!Number.isFinite(accId)) {
      throw new TRPCError35({
        code: "BAD_REQUEST",
        message: `Acompanhamento inv\xE1lido em ${String(dish.name || "seu prato")}.`
      });
    }
    const matchedGroup = matchGroupForAcc(groups, accId, selectedAcc.groupId);
    if (!matchedGroup) {
      throw new TRPCError35({
        code: "BAD_REQUEST",
        message: `Acompanhamento n\xE3o permitido para ${String(dish.name || "este prato")}.`
      });
    }
    const matchedOption = (Array.isArray(matchedGroup.options) ? matchedGroup.options : []).find(
      (option) => toNumber(option.id, NaN) === accId
    );
    if (!matchedOption) {
      throw new TRPCError35({
        code: "BAD_REQUEST",
        message: `Acompanhamento inv\xE1lido para ${String(dish.name || "este prato")}.`
      });
    }
    const groupId = String(matchedGroup.groupId ?? matchedGroup.id);
    counts.set(groupId, (counts.get(groupId) || 0) + 1);
    authoritativeAccs.push({
      id: accId,
      name: String(matchedOption.name || selectedAcc.name || selectedAcc.label || "Acompanhamento"),
      weight: selectedAcc.weight ?? matchedGroup.defaultGrammage ?? 100,
      groupId: matchedGroup.groupId ?? matchedGroup.id,
      groupName: String(matchedGroup.name || selectedAcc.groupName || ""),
      priceModifier: toNumber(matchedOption.priceModifier)
    });
  }
  ensureGroupSelections(groups, counts, String(dish.name || "Prato"));
  const unitPrice = roundMoney(
    calculateItemUnitPrice(getDishBasePrice(dish), {
      size: { price_modifier: toNumber(selectedSize.priceModifier) },
      accompaniments: authoritativeAccs.map((acc) => ({
        priceModifier: toNumber(acc.priceModifier)
      }))
    })
  );
  return {
    id: "",
    dishId,
    packageId: null,
    quantity,
    unitPrice,
    totalPrice: roundMoney(unitPrice * quantity),
    name: String(dish.name || "Prato"),
    options: {
      _type: "single",
      dishId,
      dishName: String(dish.name || "Prato"),
      selectedSizeId,
      selectedSizeName: String(selectedSize.name || options.selectedSizeName || "Padr\xE3o"),
      selectedAccs: authoritativeAccs
    },
    appliedNutrition
  };
}
async function recalculatePackageItem(quantity, packageId, options, appliedNutrition) {
  const pkg = await getPackageById(packageId);
  if (!pkg) {
    throw new TRPCError35({ code: "BAD_REQUEST", message: "Pacote inv\xE1lido ou inativo." });
  }
  const slotDefinitions = Array.isArray(pkg.options) ? pkg.options : [];
  const selectedMeals = parseSelectedMeals(options.meals || options.items);
  if (selectedMeals.length !== slotDefinitions.length) {
    throw new TRPCError35({
      code: "BAD_REQUEST",
      message: `Pacote ${String(pkg.name || "")} est\xE1 incompleto.`
    });
  }
  const authoritativeMeals = [];
  slotDefinitions.forEach((slot, index4) => {
    const meal = selectedMeals[index4];
    if (!meal) {
      throw new TRPCError35({
        code: "BAD_REQUEST",
        message: `Pacote ${String(pkg.name || "")} est\xE1 incompleto.`
      });
    }
    const selectedDishId = toNullableId(meal.dishId);
    const allowedDishes = Array.isArray(slot.dishes) ? slot.dishes : [];
    const matchedDish = allowedDishes.find((dish) => String(dish.id) === selectedDishId) || null;
    if (!matchedDish || !selectedDishId) {
      throw new TRPCError35({
        code: "BAD_REQUEST",
        message: `Sele\xE7\xE3o inv\xE1lida em ${String(slot.label || `Marmita ${index4 + 1}`)}.`
      });
    }
    const groups = Array.isArray(slot.accompanimentGroups) ? slot.accompanimentGroups : [];
    const selectedAccs = getSelectedAccsFromMeal(meal);
    const authoritativeAccs = [];
    const counts = /* @__PURE__ */ new Map();
    for (const selectedAcc of selectedAccs) {
      const accId = toNumber(selectedAcc.id, NaN);
      if (!Number.isFinite(accId)) {
        throw new TRPCError35({
          code: "BAD_REQUEST",
          message: `Acompanhamento inv\xE1lido em ${String(slot.label || `Marmita ${index4 + 1}`)}.`
        });
      }
      const matchedGroup = matchGroupForAcc(groups, accId, selectedAcc.groupId);
      if (!matchedGroup) {
        throw new TRPCError35({
          code: "BAD_REQUEST",
          message: `Acompanhamento n\xE3o permitido em ${String(slot.label || `Marmita ${index4 + 1}`)}.`
        });
      }
      const matchedOption = (Array.isArray(matchedGroup.options) ? matchedGroup.options : []).find(
        (option) => toNumber(option.id, NaN) === accId
      );
      if (!matchedOption) {
        throw new TRPCError35({
          code: "BAD_REQUEST",
          message: `Acompanhamento inv\xE1lido em ${String(slot.label || `Marmita ${index4 + 1}`)}.`
        });
      }
      const groupId = String(matchedGroup.groupId ?? matchedGroup.id);
      counts.set(groupId, (counts.get(groupId) || 0) + 1);
      authoritativeAccs.push({
        id: accId,
        name: String(matchedOption.name || selectedAcc.name || selectedAcc.label || "Acompanhamento"),
        weight: selectedAcc.weight ?? matchedGroup.defaultGrammage ?? 100,
        groupId: matchedGroup.groupId ?? matchedGroup.id,
        groupName: String(matchedGroup.name || selectedAcc.groupName || "")
      });
    }
    ensureGroupSelections(
      groups,
      counts,
      String(slot.label || `Marmita ${index4 + 1}`)
    );
    authoritativeMeals.push({
      label: String(slot.label || meal.label || `Marmita ${index4 + 1}`),
      dishId: selectedDishId,
      dishName: String(matchedDish.name || meal.dishName || "Marmita"),
      accompaniments: authoritativeAccs
    });
  });
  const unitPrice = roundMoney(getPackageBasePrice(pkg));
  const packageSizeName = toMeaningfulString(options.sizeName) || `${slotDefinitions.length} Marmitas`;
  return {
    id: "",
    dishId: null,
    packageId,
    quantity,
    unitPrice,
    totalPrice: roundMoney(unitPrice * quantity),
    name: String(pkg.name || "Pacote"),
    options: {
      _type: "package_custom",
      packageId,
      packageName: String(pkg.name || "Pacote"),
      sizeName: packageSizeName,
      meals: authoritativeMeals
    },
    appliedNutrition
  };
}
async function calculateCouponDiscount(db2, couponCode, subtotal, autoDiscount) {
  if (!couponCode) {
    return { discount: 0, couponId: null };
  }
  const [dbCoupon] = await db2.select().from(coupons).where(eq59(coupons.code, couponCode)).limit(1);
  if (!dbCoupon || !dbCoupon.isActive) {
    return { discount: 0, couponId: null };
  }
  const now = /* @__PURE__ */ new Date();
  if (dbCoupon.validFrom && new Date(dbCoupon.validFrom) > now || dbCoupon.validUntil && new Date(dbCoupon.validUntil) < now) {
    return { discount: 0, couponId: null };
  }
  const minRequired = toNumber(dbCoupon.minOrderValue);
  if (subtotal < minRequired) {
    return { discount: 0, couponId: null };
  }
  const baseCalc = Math.max(0, subtotal - autoDiscount);
  const discountValue = toNumber(dbCoupon.discountValue);
  const isPercentage = String(dbCoupon.discountType || "").toLowerCase().includes("percent");
  let discount = isPercentage ? baseCalc * (discountValue / 100) : discountValue;
  const maxDiscount = toNumber(dbCoupon.maxDiscount, Infinity);
  if (Number.isFinite(maxDiscount) && maxDiscount > 0 && discount > maxDiscount) {
    discount = maxDiscount;
  }
  return {
    discount: roundMoney(Math.min(discount, baseCalc)),
    couponId: typeof dbCoupon.id === "number" ? dbCoupon.id : toNumber(dbCoupon.id, 0) || null
  };
}
async function calculateLoyaltyDiscount(db2, userId, useLoyaltyPoints, remainder) {
  if (!useLoyaltyPoints) {
    return { loyaltyDiscount: 0, pointsUsed: 0 };
  }
  const [cfg] = await db2.select().from(loyaltySettings).limit(1);
  const [user] = await db2.select({ availablePoints: users.availablePoints }).from(users).where(eq59(users.id, userId)).limit(1);
  const enabled = cfg?.enabled === true || String(cfg?.enabled) === "1" || toNumber(cfg?.enabled) === 1;
  if (!enabled || !user || toNumber(user.availablePoints) <= 0) {
    return { loyaltyDiscount: 0, pointsUsed: 0 };
  }
  const redemptionRatePoints = Math.max(1, toNumber(cfg?.redemptionRatePoints, 100));
  const redemptionRateMoney = Math.max(0, toNumber(cfg?.redemptionRateMoney, 1));
  const minCartToRedeem = toNumber(cfg?.minCartAmount);
  if (remainder <= 0 || minCartToRedeem > 0 && remainder < minCartToRedeem) {
    return { loyaltyDiscount: 0, pointsUsed: 0 };
  }
  const rawRules = cfg?.redemptionRules;
  const rules = Array.isArray(rawRules) ? rawRules : typeof rawRules === "string" ? JSON.parse(rawRules) : [];
  let tierCeiling = remainder;
  if (rules.length > 0) {
    const sorted = [...rules].sort((a, b) => toNumber(b.minOrderValue) - toNumber(a.minOrderValue));
    const matched = sorted.find((r) => remainder >= toNumber(r.minOrderValue));
    tierCeiling = matched ? toNumber(matched.maxDiscount) : 0;
  }
  if (tierCeiling <= 0) return { loyaltyDiscount: 0, pointsUsed: 0 };
  const availablePoints = toNumber(user.availablePoints);
  const pointsWorthMoney = redemptionRatePoints > 0 ? availablePoints / redemptionRatePoints * redemptionRateMoney : 0;
  const ceiling = tierCeiling;
  const loyaltyDiscount = roundMoney(Math.min(pointsWorthMoney, remainder, ceiling));
  const pointsUsed = redemptionRateMoney > 0 ? Math.round(loyaltyDiscount / redemptionRateMoney * redemptionRatePoints) : 0;
  return { loyaltyDiscount, pointsUsed };
}
async function calculatePointsEarned(db2, finalNet) {
  const [cfg] = await db2.select().from(loyaltySettings).limit(1);
  const enabled = cfg?.enabled === true || String(cfg?.enabled) === "1" || toNumber(cfg?.enabled) === 1;
  if (!enabled) return 0;
  const earnPts = toNumber(cfg?.conversionRatePoints);
  const earnMoney = toNumber(cfg?.conversionRateMoney, 1);
  const earnPointsPerReal = earnMoney > 0 ? earnPts / earnMoney : 0;
  return earnPointsPerReal > 0 ? Math.floor(finalNet * earnPointsPerReal) : 0;
}
async function recalculateCartItem(params) {
  const quantity = Math.max(1, toNumber(params.quantity, 1));
  const options = parseRecord(params.options);
  const dishId = toNullableId(params.dishId ?? options.dishId);
  const packageId = toNullableId(params.packageId ?? options.packageId);
  if (packageId) {
    return recalculatePackageItem(quantity, packageId, options, params.appliedNutrition);
  }
  if (dishId) {
    return recalculateSingleItem(quantity, dishId, options, params.appliedNutrition);
  }
  throw new TRPCError35({
    code: "BAD_REQUEST",
    message: "Item do carrinho sem produto ou pacote v\xE1lido."
  });
}
async function recalculateCheckoutFromCart(params) {
  const db2 = await getDb();
  const [cart] = await db2.select({
    id: carts.id,
    couponCode: carts.couponCode,
    couponId: carts.couponId,
    usesLoyalty: carts.usesLoyalty,
    userId: carts.userId
  }).from(carts).where(
    and23(
      eq59(carts.id, params.cartId),
      eq59(carts.userId, params.userId),
      or8(eq59(carts.status, "active"), eq59(carts.status, "open"))
    )
  ).orderBy(desc27(carts.updatedAt)).limit(1);
  if (!cart) {
    throw new TRPCError35({ code: "NOT_FOUND", message: "Carrinho n\xE3o encontrado." });
  }
  const rawItems = await db2.select().from(cartItems).where(eq59(cartItems.cartId, cart.id)).orderBy(asc15(cartItems.createdAt));
  if (rawItems.length === 0) {
    throw new TRPCError35({ code: "BAD_REQUEST", message: "Seu carrinho est\xE1 vazio." });
  }
  const items = await Promise.all(
    rawItems.map(async (item) => {
      const recalculated = await recalculateCartItem({
        dishId: toNullableId(item.dishId),
        packageId: toNullableId(item.packageId),
        quantity: toNumber(item.quantity, 1),
        options: item.options || {},
        appliedNutrition: item.appliedNutrition
      });
      return {
        ...recalculated,
        id: String(item.id)
      };
    })
  );
  const [selectedPaymentMethod] = await db2.select().from(paymentMethods).where(eq59(paymentMethods.id, params.paymentMethodId)).limit(1);
  if (!selectedPaymentMethod) {
    throw new TRPCError35({ code: "BAD_REQUEST", message: "M\xE9todo de pagamento inv\xE1lido." });
  }
  const rulesRaw = await db2.select().from(discountRules).where(eq59(discountRules.isActive, true)).orderBy(asc15(discountRules.minQuantity));
  const pricing = calculatePricing(
    items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.unitPrice,
      quantity: item.quantity
    })),
    rulesRaw
  );
  const subtotal = roundMoney(pricing.subtotal);
  const autoDiscount = roundMoney(pricing.discounts);
  const autoDiscountName = pricing.appliedRule?.name || null;
  const couponResult = await calculateCouponDiscount(
    db2,
    cart.couponCode || null,
    subtotal,
    autoDiscount
  );
  const couponDiscount = couponResult.discount;
  const paymentDiscount = roundMoney(
    subtotal * (toNumber(selectedPaymentMethod.discountPercentage) / 100)
  );
  const loyaltyBase = Math.max(0, subtotal - autoDiscount - couponDiscount);
  const { loyaltyDiscount, pointsUsed } = await calculateLoyaltyDiscount(
    db2,
    params.userId,
    params.useLoyaltyPoints,
    loyaltyBase
  );
  const shippingCost = roundMoney(params.shippingCost);
  const totalDiscounts = roundMoney(
    autoDiscount + couponDiscount + loyaltyDiscount + paymentDiscount
  );
  const total = roundMoney(Math.max(0, subtotal + shippingCost - totalDiscounts));
  const pointsEarned = await calculatePointsEarned(db2, total);
  return {
    cart: {
      id: cart.id,
      couponCode: cart.couponCode || null,
      couponId: couponResult.couponId,
      usesLoyalty: Boolean(cart.usesLoyalty)
    },
    items,
    subtotal,
    autoDiscount,
    autoDiscountName,
    couponDiscount,
    loyaltyDiscount,
    paymentDiscount,
    shippingCost,
    totalDiscounts,
    total,
    pointsUsed,
    pointsEarned,
    paymentMethodName: selectedPaymentMethod.name
  };
}

// server/routers/storefront/cart/logic.ts
function safeFloat(val) {
  if (val === null || val === void 0 || val === "") return 0;
  if (typeof val === "number") return val;
  let str = String(val).trim().replace("R$", "").trim();
  if (str.includes(",")) str = str.replace(/\./g, "").replace(",", ".");
  const num = Number(str);
  return Number.isNaN(num) ? 0 : num;
}
function roundMoney2(value) {
  return safeNumber(value.toFixed(2));
}
function isSameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
async function syncCartState(db2, cartId, userId) {
  try {
    const [cartData] = await db2.select({
      id: carts.id,
      userId: carts.userId,
      couponCode: carts.couponCode,
      couponId: carts.couponId,
      usesLoyalty: carts.usesLoyalty,
      shippingValue: carts.shippingValue,
      couponBannerColor: coupons.bannerColor,
      couponLogoUrl: coupons.logoUrl,
      couponDescription: coupons.description
    }).from(carts).leftJoin(coupons, eq60(carts.couponId, coupons.id)).where(eq60(carts.id, cartId)).limit(1);
    if (!cartData) return null;
    const activeUserId = userId || cartData.userId || null;
    const itemsRaw = await db2.select().from(cartItems).where(eq60(cartItems.cartId, cartId)).orderBy(asc16(cartItems.createdAt));
    const validItems = [];
    const removedInvalidItems = [];
    for (const item of itemsRaw) {
      try {
        const authoritativeItem = await recalculateCartItem({
          dishId: item.dishId,
          packageId: item.packageId,
          quantity: safeNumber(item.quantity, 1),
          options: item.options || {},
          appliedNutrition: item.appliedNutrition
        });
        const authoritativeOptions = authoritativeItem.options;
        const authoritativeUnitPrice = roundMoney2(authoritativeItem.unitPrice);
        const authoritativeName = authoritativeItem.name;
        const needsUpdate = roundMoney2(safeFloat(item.unitPrice)) !== authoritativeUnitPrice || String(item.name || "") !== authoritativeName || !isSameJson(item.options || {}, authoritativeOptions);
        if (needsUpdate) {
          await db2.update(cartItems).set({
            unitPrice: authoritativeUnitPrice.toFixed(2),
            name: authoritativeName,
            options: authoritativeOptions
          }).where(eq60(cartItems.id, item.id));
        }
        validItems.push({
          ...item,
          unitPrice: authoritativeUnitPrice.toFixed(2),
          name: authoritativeName,
          options: authoritativeOptions,
          totalItemPrice: roundMoney2(authoritativeUnitPrice * safeNumber(item.quantity, 1))
        });
      } catch (error) {
        const shouldRemove = error instanceof TRPCError36 && (error.code === "BAD_REQUEST" || error.code === "NOT_FOUND");
        if (!shouldRemove) throw error;
        await db2.delete(cartItems).where(eq60(cartItems.id, item.id));
        removedInvalidItems.push(String(item.id));
      }
    }
    if (validItems.length === 0) {
      const emptyTotals = {
        subtotal: 0,
        shipping: safeFloat(cartData.shippingValue),
        autoDiscount: 0,
        couponDiscount: 0,
        loyaltyDiscount: 0,
        totalDiscounts: 0,
        total: safeFloat(cartData.shippingValue),
        couponCode: cartData.couponCode || null,
        couponError: null
      };
      await db2.update(carts).set({
        discountsJson: JSON.stringify({
          totals: emptyTotals,
          autoDiscountName: null,
          couponError: null,
          removedInvalidItems
        }),
        discountValue: "0.00",
        userId: activeUserId,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq60(carts.id, cartId));
      return {
        cartId,
        totals: emptyTotals,
        items: [],
        usesLoyalty: !!cartData.usesLoyalty,
        autoDiscountName: null,
        couponBannerColor: cartData.couponBannerColor,
        couponLogoUrl: cartData.couponLogoUrl,
        couponDescription: cartData.couponDescription,
        couponError: null,
        removedInvalidItems
      };
    }
    const rulesRaw = await db2.select().from(discountRules).where(eq60(discountRules.isActive, true)).orderBy(asc16(discountRules.minQuantity));
    const domainItems = validItems.map((item) => ({
      id: String(item.id),
      price: safeFloat(item.unitPrice),
      quantity: safeNumber(item.quantity, 1),
      name: item.name || ""
    }));
    const pricingResult = calculatePricing(domainItems, rulesRaw);
    const subtotal = roundMoney2(pricingResult.subtotal);
    const autoDiscount = roundMoney2(pricingResult.discounts);
    const autoDiscountName = pricingResult.appliedRule?.name || null;
    let couponDiscount = 0;
    let couponError = null;
    if (cartData.couponCode) {
      const [dbCoupon] = await db2.select().from(coupons).where(eq60(coupons.code, cartData.couponCode)).limit(1);
      if (!dbCoupon) {
        couponError = "Cupom inv\xE1lido ou expirado.";
      } else {
        const minRequired = safeFloat(dbCoupon.minOrderValue);
        if (subtotal < minRequired) {
          couponError = `Faltam R$ ${(minRequired - subtotal).toFixed(2).replace(".", ",")} para ativar este cupom.`;
        } else {
          const discountValue = safeFloat(dbCoupon.discountValue);
          const isPercent = String(dbCoupon.discountType).toLowerCase().includes("percent");
          const baseCalc = Math.max(0, subtotal - autoDiscount);
          couponDiscount = isPercent ? baseCalc * (discountValue / 100) : discountValue;
          const maxDiscount = safeFloat(dbCoupon.maxDiscount);
          if (maxDiscount > 0 && couponDiscount > maxDiscount) couponDiscount = maxDiscount;
          if (couponDiscount > baseCalc) couponDiscount = baseCalc;
          couponDiscount = roundMoney2(couponDiscount);
        }
      }
    }
    let loyaltyDiscount = 0;
    if (cartData.usesLoyalty && activeUserId) {
      try {
        const loyaltyData = await getUserPoints(activeUserId);
        const points = safeNumber(loyaltyData?.current_points || loyaltyData?.points, 0);
        const [settings] = await db2.select().from(loyaltySettings).limit(1);
        if (settings?.enabled && points > 0) {
          const pointsWorthMoney = points / safeFloat(settings.redemptionRatePoints) * safeFloat(settings.redemptionRateMoney);
          const remainder = Math.max(0, subtotal - autoDiscount - couponDiscount);
          loyaltyDiscount = Math.min(
            pointsWorthMoney,
            remainder,
            safeFloat(settings.maxDiscountAmount)
          );
          loyaltyDiscount = roundMoney2(loyaltyDiscount);
        }
      } catch (error) {
        console.error("Erro ao recalcular fidelidade do carrinho:", error);
      }
    }
    const shipping = roundMoney2(safeFloat(cartData.shippingValue));
    const totalDiscounts = roundMoney2(autoDiscount + couponDiscount + loyaltyDiscount);
    const finalTotal = roundMoney2(Math.max(0, subtotal + shipping - totalDiscounts));
    const totals = {
      subtotal,
      shipping,
      autoDiscount,
      couponDiscount,
      loyaltyDiscount,
      totalDiscounts,
      total: finalTotal,
      couponCode: cartData.couponCode || null,
      couponError
    };
    const styling = {
      couponBannerColor: cartData.couponBannerColor || null,
      couponLogoUrl: cartData.couponLogoUrl || null,
      couponDescription: cartData.couponDescription || (cartData.couponCode ? "Cupom aplicado" : null)
    };
    await db2.update(carts).set({
      discountsJson: JSON.stringify({
        totals,
        autoDiscountName,
        couponError,
        ...styling,
        removedInvalidItems
      }),
      discountValue: totals.totalDiscounts.toFixed(2),
      userId: activeUserId,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq60(carts.id, cartId));
    return {
      cartId,
      totals,
      items: validItems,
      usesLoyalty: !!cartData.usesLoyalty,
      autoDiscountName,
      couponBannerColor: cartData.couponBannerColor,
      couponLogoUrl: cartData.couponLogoUrl,
      couponDescription: cartData.couponDescription,
      couponError,
      removedInvalidItems
    };
  } catch (error) {
    console.error("Erro cr\xEDtico syncCartState:", error);
    return null;
  }
}

// shared/domain/packages/validator.ts
function validatePackageIntegrity(selection) {
  const { itemsCount, maxItems, minItems } = selection;
  if (itemsCount < minItems) {
    const missing = minItems - itemsCount;
    return {
      isValid: false,
      remaining: missing,
      isOverLimit: false,
      status: "pending",
      message: `Faltam ${missing} item(s) para completar seu kit.`
    };
  }
  if (itemsCount > maxItems) {
    const extra = itemsCount - maxItems;
    return {
      isValid: false,
      remaining: 0,
      isOverLimit: true,
      status: "error",
      message: `Voc\xEA excedeu o limite do kit em ${extra} item(s).`
    };
  }
  return {
    isValid: true,
    remaining: 0,
    isOverLimit: false,
    status: "complete",
    message: "Kit montado com sucesso! \u{1F389}"
  };
}

// shared/domain/nutrition/nutrition.ts
function mapToDatabaseNutrition(data) {
  return {
    energy_kcal: data.energyKcal,
    energy_kj: data.energyKj,
    proteins: data.proteins,
    carbs: data.carbs,
    fat_total: data.fatTotal,
    fat_saturated: data.fatSaturated,
    fat_trans: data.fatTrans,
    fiber: data.fiber,
    sodium: data.sodium,
    added_sugars: data.addedSugars,
    calcium: data.calcium,
    iron: data.iron,
    yield_weight: data.yieldWeight
  };
}

// server/routers/storefront/cart/items.ts
var safeFloat2 = (v) => {
  return safeNumber(v);
};
function assertCartOwnership(cart, userId, guestId) {
  if (!cart) {
    throw new TRPCError37({ code: "NOT_FOUND", message: "Carrinho n\xE3o encontrado." });
  }
  const ownsAsUser = !!userId && cart.userId === userId;
  const ownsAsGuest = !userId && !!guestId && cart.guestId === guestId;
  if (!ownsAsUser && !ownsAsGuest) {
    throw new TRPCError37({ code: "FORBIDDEN", message: "Carrinho n\xE3o pertence \xE0 sess\xE3o atual." });
  }
}
var cartItemsRouter = router({
  /**
   * ✅ ADICIONAR ITEM (DISH OU PACKAGE)
   */
  addItem: publicProcedure.use(
    createRateLimitMiddleware({
      keyPrefix: "cart-add-item",
      limit: 40,
      windowMs: 5 * 60 * 1e3
    })
  ).input(z48.object({
    dishId: z48.union([z48.string(), z48.number()]).optional().nullable(),
    packageId: z48.union([z48.string(), z48.number()]).optional().nullable(),
    quantity: z48.number().min(1),
    totalUnitPrice: z48.number().optional().nullable(),
    optionsPayload: z48.record(z48.unknown()).optional().nullable(),
    nutritionPayload: z48.union([z48.record(z48.unknown()), z48.array(z48.unknown())]).optional().nullable(),
    cartId: z48.string().optional().nullable(),
    guestSessionId: z48.string().optional().nullable()
  })).mutation(async ({ input, ctx }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId || input.guestSessionId;
    if (!userId && !guestId) {
      throw new TRPCError37({ code: "UNAUTHORIZED", message: "Sess\xE3o expirada ou inv\xE1lida." });
    }
    const optionsClean = input.optionsPayload ? { ...input.optionsPayload } : {};
    const rawNutrition = input.nutritionPayload ?? optionsClean?.appliedNutrition ?? null;
    if (optionsClean.appliedNutrition) delete optionsClean.appliedNutrition;
    let rawDishId = input.dishId;
    let rawPackageId = input.packageId;
    if (!rawDishId && !rawPackageId) {
      if (optionsClean.dishId) rawDishId = optionsClean.dishId;
      if (optionsClean.packageId) rawPackageId = optionsClean.packageId;
    }
    const isPackage = !!(rawPackageId || optionsClean.isPackage);
    const finalDishId = !isPackage && rawDishId ? String(rawDishId) : null;
    const finalPackageId = isPackage && rawPackageId ? String(rawPackageId) : null;
    let baseItem = null;
    if (finalPackageId) {
      const [pkg] = await db2.select().from(packages).where(eq61(packages.id, finalPackageId)).limit(1);
      if (pkg) {
        const pkgRef = pkg;
        const basePriceValue = safeFloat2(pkgRef.price ?? pkgRef.basePrice ?? pkgRef.base_price ?? 0);
        const salePriceValue = safeFloat2(pkgRef.salePrice ?? pkgRef.sale_price ?? 0);
        const finalPrice = salePriceValue > 0 && salePriceValue < basePriceValue ? salePriceValue : basePriceValue;
        baseItem = {
          name: pkg.name,
          price: finalPrice,
          imageUrl: pkg.imageUrl ?? null,
          minItems: safeInteger(pkg.numberOfOptions, 0),
          maxItems: safeInteger(pkg.numberOfOptions, 0)
        };
      }
    } else if (finalDishId) {
      const dishId = safeInteger(finalDishId, Number.NaN);
      if (!Number.isFinite(dishId)) {
        throw new TRPCError37({ code: "BAD_REQUEST", message: "Produto inv\xC3\xA1lido." });
      }
      const [dish] = await db2.select().from(dishes).where(eq61(dishes.id, dishId)).limit(1);
      if (dish) {
        const dishRef = dish;
        const basePrice = safeFloat2(dishRef.price ?? dishRef.basePrice ?? 0);
        const salePrice = safeFloat2(dishRef.salePrice ?? 0);
        const finalPrice = salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
        baseItem = {
          name: dish.name ?? "",
          price: finalPrice,
          imageUrl: dish.imageUrl ?? null,
          minItems: 0,
          maxItems: 0
        };
      }
    }
    if (!baseItem) {
      throw new TRPCError37({ code: "NOT_FOUND", message: "Produto n\xE3o localizado no cat\xE1logo." });
    }
    if (isPackage && finalPackageId) {
      const selectedMeals = optionsClean.meals || optionsClean.items || [];
      const validation = validatePackageIntegrity({
        packageId: finalPackageId,
        itemsCount: selectedMeals.length,
        minItems: baseItem.minItems,
        maxItems: baseItem.maxItems
      });
      if (!validation.isValid) {
        throw new TRPCError37({ code: "BAD_REQUEST", message: validation.message });
      }
    }
    const sessionCondition = userId ? eq61(carts.userId, userId) : eq61(carts.guestId, guestId);
    const [existing] = await db2.select().from(carts).where(
      and24(
        sessionCondition,
        or9(eq61(carts.status, "open"), eq61(carts.status, "active")),
        input.cartId ? eq61(carts.id, input.cartId) : void 0
      )
    ).orderBy(desc28(carts.updatedAt)).limit(1);
    let currentCartId;
    if (existing) {
      currentCartId = String(existing.id);
    } else {
      currentCartId = crypto15.randomUUID();
      await db2.insert(carts).values({
        id: currentCartId,
        userId,
        guestId: userId ? null : guestId,
        status: "active"
      });
    }
    const authoritativeItem = await recalculateCartItem({
      dishId: finalDishId,
      packageId: finalPackageId,
      quantity: input.quantity,
      options: optionsClean,
      appliedNutrition: rawNutrition
    });
    const finalUnitPrice = authoritativeItem.unitPrice;
    const itemName = authoritativeItem.name;
    let finalNutrition = null;
    if (rawNutrition) {
      const kcal = safeFloat2(rawNutrition.energyKcal ?? rawNutrition.energy_kcal ?? 0);
      if (kcal > 0) {
        const itemsTrace = rawNutrition.itemsTrace ?? null;
        const mappedDbNutrition = mapToDatabaseNutrition(rawNutrition);
        finalNutrition = {
          ...mappedDbNutrition
        };
        if (itemsTrace) {
          finalNutrition.itemsTrace = itemsTrace;
        }
      }
    }
    const newItem = {
      id: crypto15.randomUUID(),
      cartId: currentCartId,
      dishId: finalDishId,
      packageId: finalPackageId,
      quantity: input.quantity,
      unitPrice: String(finalUnitPrice),
      name: itemName,
      imageUrl: baseItem.imageUrl,
      options: Object.keys(authoritativeItem.options).length > 0 ? authoritativeItem.options : null,
      // Conversão final para o tipo do Drizzle (AppliedNutrition)
      appliedNutrition: finalNutrition
    };
    await db2.insert(cartItems).values(newItem);
    const newState = await syncCartState(db2, currentCartId, userId || void 0);
    return { ...newState, success: true, message: `${itemName} adicionado!` };
  }),
  /**
   * ✅ REMOVER ITEM
   */
  removeItem: publicProcedure.input(z48.object({ cartItemId: z48.string() })).mutation(async ({ input, ctx }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId || null;
    const [item] = await db2.select().from(cartItems).where(eq61(cartItems.id, input.cartItemId)).limit(1);
    if (!item) throw new TRPCError37({ code: "NOT_FOUND", message: "Item n\xE3o encontrado." });
    const currentCartId = item.cartId;
    const [cart] = await db2.select().from(carts).where(eq61(carts.id, currentCartId)).limit(1);
    assertCartOwnership(cart, userId, guestId);
    await db2.delete(cartItems).where(eq61(cartItems.id, input.cartItemId));
    const newState = await syncCartState(db2, currentCartId, userId);
    return { ...newState, success: true };
  }),
  /**
   * ✅ ATUALIZAR QUANTIDADE
   */
  updateQuantity: publicProcedure.input(z48.object({
    cartItemId: z48.string(),
    quantity: z48.number().min(1)
  })).mutation(async ({ input, ctx }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId || null;
    const [item] = await db2.select().from(cartItems).where(eq61(cartItems.id, input.cartItemId)).limit(1);
    if (!item) throw new TRPCError37({ code: "NOT_FOUND", message: "Item n\xE3o encontrado." });
    const [cart] = await db2.select().from(carts).where(eq61(carts.id, item.cartId)).limit(1);
    assertCartOwnership(cart, userId, guestId);
    await db2.update(cartItems).set({ quantity: input.quantity }).where(eq61(cartItems.id, input.cartItemId));
    const newState = await syncCartState(db2, item.cartId, userId);
    return { ...newState, success: true };
  })
});

// server/routers/storefront/cart/rewards.ts
import { z as z49 } from "zod";
init_schema();
import { eq as eq62, and as and25 } from "drizzle-orm";
init_db();
import { TRPCError as TRPCError38 } from "@trpc/server";
async function assertCartOwnership2(db2, cartId, userId, guestId) {
  if (!db2) throw new Error("Database unavailable");
  const [cart] = await db2.select().from(carts).where(eq62(carts.id, cartId)).limit(1);
  if (!cart) {
    throw new TRPCError38({ code: "NOT_FOUND", message: "Carrinho n\xE3o encontrado." });
  }
  const ownsAsUser = !!userId && cart.userId === userId;
  const ownsAsGuest = !userId && !!guestId && cart.guestId === guestId;
  if (!ownsAsUser && !ownsAsGuest) {
    throw new TRPCError38({ code: "FORBIDDEN", message: "Carrinho n\xE3o pertence \xE0 sess\xE3o atual." });
  }
}
var cartRewardsRouter = router({
  /**
   * ✅ APLICAR CUPOM
   */
  applyCoupon: publicProcedure.input(z49.object({
    cartId: z49.string().uuid(),
    code: z49.string().min(1)
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database unavailable");
    const targetUserId = ctx.user?.id ? String(ctx.user.id) : null;
    const targetGuestId = ctx.guestId ? String(ctx.guestId) : null;
    await assertCartOwnership2(db2, input.cartId, targetUserId, targetGuestId);
    const [coupon] = await db2.select().from(coupons).where(
      and25(
        eq62(coupons.code, input.code.toUpperCase().trim()),
        eq62(coupons.isActive, true)
      )
    ).limit(1);
    if (!coupon) {
      throw new TRPCError38({
        code: "NOT_FOUND",
        message: "Cupom inv\xE1lido ou expirado."
      });
    }
    const updateData = {
      couponCode: coupon.code,
      couponId: coupon.id,
      // Agora aceita string ou number sem erro
      discountValue: Number(coupon.discountValue || 0),
      discount_type: coupon.discountType
    };
    await db2.update(carts).set(updateData).where(eq62(carts.id, input.cartId));
    const newState = await syncCartState(db2, input.cartId, targetUserId || void 0);
    return {
      ...newState,
      success: true,
      message: `Cupom "${coupon.code}" aplicado com sucesso!`
    };
  }),
  /**
   * ✅ REMOVER CUPOM
   */
  removeCoupon: publicProcedure.input(z49.object({ cartId: z49.string().uuid() })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database unavailable");
    const targetUserId = ctx.user?.id ? String(ctx.user.id) : null;
    const targetGuestId = ctx.guestId ? String(ctx.guestId) : null;
    await assertCartOwnership2(db2, input.cartId, targetUserId, targetGuestId);
    const updateData = {
      couponCode: null,
      couponId: null,
      discountValue: 0,
      discount_type: "fixed"
    };
    await db2.update(carts).set(updateData).where(eq62(carts.id, input.cartId));
    const newState = await syncCartState(db2, input.cartId, targetUserId || void 0);
    return {
      ...newState,
      success: true,
      message: "Cupom removido do carrinho."
    };
  }),
  /**
   * ✅ ALTERNAR FIDELIDADE
   */
  toggleLoyalty: publicProcedure.input(z49.object({
    cartId: z49.string().uuid(),
    active: z49.boolean()
  })).mutation(async ({ ctx, input }) => {
    const db2 = await getDb();
    if (!db2) throw new Error("Database unavailable");
    const targetUserId = ctx.user?.id ? String(ctx.user.id) : null;
    const targetGuestId = ctx.guestId ? String(ctx.guestId) : null;
    await assertCartOwnership2(db2, input.cartId, targetUserId, targetGuestId);
    const updateData = {
      usesLoyalty: input.active,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await db2.update(carts).set(updateData).where(eq62(carts.id, input.cartId));
    const newState = await syncCartState(db2, input.cartId, targetUserId || void 0);
    return {
      ...newState,
      success: true,
      message: input.active ? "Seu saldo de pontos foi aplicado como desconto!" : "Desconto de pontos removido."
    };
  })
});

// server/routers/storefront/cart/index.ts
var cartRouter = router({
  items: cartItemsRouter,
  applyCoupon: cartRewardsRouter.applyCoupon,
  removeCoupon: cartRewardsRouter.removeCoupon,
  toggleLoyalty: publicProcedure.input(z50.object({
    cartId: z50.string().optional(),
    active: z50.boolean()
  })).mutation(async ({ ctx, input }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId ? String(ctx.guestId) : null;
    const searchCondition = userId ? eq63(carts.userId, userId) : guestId ? eq63(carts.guestId, guestId) : null;
    if (!searchCondition) {
      throw new TRPCError39({ code: "UNAUTHORIZED", message: "Sess\xE3o inv\xE1lida" });
    }
    const [cart] = await db2.select().from(carts).where(
      and26(
        or10(eq63(carts.status, "active"), eq63(carts.status, "open")),
        searchCondition,
        input.cartId ? eq63(carts.id, input.cartId) : void 0
      )
    ).orderBy(desc29(carts.updatedAt)).limit(1);
    if (!cart) {
      throw new TRPCError39({ code: "NOT_FOUND", message: "Carrinho n\xE3o encontrado" });
    }
    await db2.update(carts).set({
      usesLoyalty: input.active,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq63(carts.id, cart.id));
    return await syncCartState(db2, cart.id, userId || void 0);
  }),
  getSummary: publicProcedure.query(async ({ ctx }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId ? String(ctx.guestId) : null;
    if (!userId && !guestId) return null;
    if (userId && guestId) {
      try {
        await promoteCart(guestId, userId);
      } catch (mergeErr) {
        console.warn("[Cart] merge race condition ignorada:", mergeErr);
      }
    }
    const searchCondition = userId ? eq63(carts.userId, userId) : eq63(carts.guestId, guestId);
    let [cart] = await db2.select().from(carts).where(
      and26(
        or10(eq63(carts.status, "active"), eq63(carts.status, "open")),
        searchCondition
      )
    ).orderBy(desc29(carts.updatedAt)).limit(1);
    if (!cart) {
      const newCartId = crypto16.randomUUID();
      const now = /* @__PURE__ */ new Date();
      await db2.insert(carts).values({
        id: newCartId,
        userId,
        guestId: userId ? null : guestId,
        sessionId: guestId,
        // Mantendo rastro da sessão original
        status: "active",
        createdAt: now,
        updatedAt: now
      });
      const [newCart] = await db2.select().from(carts).where(eq63(carts.id, newCartId)).limit(1);
      cart = newCart;
    }
    if (!cart) throw new TRPCError39({ code: "INTERNAL_SERVER_ERROR" });
    const result = await syncCartState(db2, cart.id, userId || void 0);
    return {
      ...result,
      cartId: cart.id,
      usesLoyalty: !!cart.usesLoyalty
      // Garante booleano puro
    };
  }),
  getOrCreateCart: publicProcedure.mutation(async ({ ctx }) => {
    const db2 = ctx.db;
    const userId = ctx.user?.id ? String(ctx.user.id) : null;
    const guestId = ctx.guestId ? String(ctx.guestId) : null;
    if (!userId && !guestId) {
      throw new TRPCError39({ code: "BAD_REQUEST", message: "Sess\xE3o n\xE3o identificada." });
    }
    if (userId && guestId) {
      try {
        await promoteCart(guestId, userId);
      } catch (mergeErr) {
        console.warn("[Cart] merge race condition ignorada:", mergeErr);
      }
    }
    const searchCondition = userId ? eq63(carts.userId, userId) : eq63(carts.guestId, guestId);
    const [cart] = await db2.select().from(carts).where(
      and26(or10(eq63(carts.status, "active"), eq63(carts.status, "open")), searchCondition)
    ).orderBy(desc29(carts.updatedAt)).limit(1);
    if (!cart) {
      const newCartId = crypto16.randomUUID();
      await db2.insert(carts).values({
        id: newCartId,
        userId,
        guestId: userId ? null : guestId,
        sessionId: guestId,
        status: "active"
      });
      return { cartId: newCartId };
    }
    return { cartId: cart.id };
  })
});

// server/routers/storefront/checkout/index.ts
import { TRPCError as TRPCError41 } from "@trpc/server";
import { and as and29, eq as eq67, sql as sql30 } from "drizzle-orm";
import { randomUUID as randomUUID3 } from "crypto";
import { z as z51 } from "zod";
init_db();
init_encryption();
init_schema();

// server/routers/storefront/checkout/address.ts
init_encryption();
init_schema();
import { TRPCError as TRPCError40 } from "@trpc/server";
import { eq as eq64, sql as sql29 } from "drizzle-orm";
import axios2 from "axios";
function isPointInCircle(point, center, radiusMeters) {
  const earthRadius = 6371e3;
  const phi1 = point.lat * Math.PI / 180;
  const phi2 = center.lat * Math.PI / 180;
  const deltaPhi = (center.lat - point.lat) * Math.PI / 180;
  const deltaLambda = (center.lng - point.lng) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c <= radiusMeters;
}
function isPointInPolygon2(point, polygon) {
  const { lat: x, lng: y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function safeDecrypt2(value) {
  if (!value) return "";
  const raw = String(value);
  if (raw.split(":").length !== 3) return raw.trim();
  try {
    return (decrypt(raw) || raw).trim();
  } catch {
    return raw.trim();
  }
}
function parseCoordinate(value) {
  if (!value) return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}
function toNumber2(value, fallback = 0) {
  return safeNumber(value, fallback);
}
function requireAddressField(value, fieldLabel) {
  const normalized = value.trim();
  if (!normalized) {
    throw new TRPCError40({
      code: "BAD_REQUEST",
      message: `Endere\xE7o incompleto: ${fieldLabel} \xE9 obrigat\xF3rio.`
    });
  }
  return normalized;
}
function normalizeState(value) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new TRPCError40({
      code: "BAD_REQUEST",
      message: "Endere\xE7o inv\xE1lido: UF deve ter 2 letras."
    });
  }
  return normalized;
}
function buildAddressData(addr) {
  const street = requireAddressField(safeDecrypt2(addr.street), "rua");
  const number = requireAddressField(safeDecrypt2(addr.number), "n\xFAmero");
  const neighborhood = requireAddressField(
    safeDecrypt2(addr.neighborhood),
    "bairro"
  );
  const city = requireAddressField(safeDecrypt2(addr.city), "cidade");
  const state = normalizeState(safeDecrypt2(addr.state));
  const zipCode = normalizeDigits(safeDecrypt2(addr.zipCode));
  if (zipCode.length !== 8) {
    throw new TRPCError40({
      code: "BAD_REQUEST",
      message: "Endere\xE7o inv\xE1lido: CEP deve conter 8 d\xEDgitos."
    });
  }
  return {
    id: addr.id,
    street,
    number,
    neighborhood,
    city,
    state,
    zipCode,
    complement: safeDecrypt2(addr.complement),
    lat: parseCoordinate(addr.lat),
    lng: parseCoordinate(addr.lng)
  };
}
function parseGeoPoint(value) {
  if (!value || typeof value !== "object") return null;
  const record = value;
  const lat = safeNumber(record.lat, Number.NaN);
  const lng = safeNumber(record.lng, Number.NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
function buildReturn(data, rule) {
  return {
    type: "delivery",
    id: data.id,
    text: `${data.street}, ${data.number}${data.complement ? ` (${data.complement})` : ""} - ${data.neighborhood}, ${data.city}/${data.state}`,
    zipCode: data.zipCode,
    city: data.city,
    state: data.state,
    number: data.number,
    neighborhood: data.neighborhood,
    street: data.street,
    complement: data.complement,
    price: toNumber2(rule.shippingCost)
  };
}
async function loadAddressSnapshot(tx, opts) {
  if (opts.shippingType === "pickup") {
    return {
      type: "pickup",
      text: "Retirada no Local / Balc\xE3o",
      zipCode: null,
      price: 0
    };
  }
  if (!opts.addressId || opts.addressId === "undefined") {
    throw new TRPCError40({
      code: "BAD_REQUEST",
      message: "ID do endere\xE7o inv\xE1lido ou n\xE3o informado."
    });
  }
  const activeRules = await tx.select().from(shippingZones).where(eq64(shippingZones.isActive, true));
  const [addr] = await tx.select().from(userAddresses).where(eq64(userAddresses.id, opts.addressId)).limit(1);
  if (!addr) {
    throw new TRPCError40({
      code: "NOT_FOUND",
      message: "Endere\xE7o n\xE3o localizado."
    });
  }
  const finalAddressData = buildAddressData(addr);
  const cleanZip = finalAddressData.zipCode;
  const zipRule = activeRules.find((rule) => {
    if (rule.type !== "zipcode") return false;
    return cleanZip >= rule.zipCodeStart && cleanZip <= rule.zipCodeEnd;
  });
  if (zipRule) {
    return buildReturn(finalAddressData, zipRule);
  }
  let lat = finalAddressData.lat;
  let lng = finalAddressData.lng;
  if (lat == null || lng == null) {
    try {
      const query = `${finalAddressData.street}, ${finalAddressData.number}, ${finalAddressData.city}, Brasil`;
      const response = await axios2.get("https://nominatim.openstreetmap.org/search", {
        params: { q: query, format: "json", limit: 1 },
        headers: { "User-Agent": "Gourmet-Saudavel-Checkout-Bot" },
        timeout: 4e3
      });
      const firstMatch = Array.isArray(response.data) ? response.data[0] : null;
      if (firstMatch) {
        lat = safeNumber(firstMatch.lat, Number.NaN);
        lng = safeNumber(firstMatch.lon, Number.NaN);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          await tx.execute(
            sql29`UPDATE user_addresses SET lat = ${String(lat)}, lng = ${String(lng)} WHERE id = ${finalAddressData.id}`
          );
        }
      }
    } catch {
      console.error("[AddressSnapshot] Falha na geocodifica\xE7\xE3o Nominatim");
    }
  }
  if (lat != null && lng != null) {
    const clientPoint = { lat, lng };
    for (const rule of activeRules) {
      if (!rule.polygonCoords) continue;
      const geoData = safeJsonParse(rule.polygonCoords, null);
      if (rule.type === "circle") {
        const geoRecord = geoData && typeof geoData === "object" ? geoData : null;
        const center = parseGeoPoint(geoRecord?.center);
        const radius = safeNumber(geoRecord?.radius, Number.NaN);
        if (center && Number.isFinite(radius)) {
          if (isPointInCircle(clientPoint, center, radius)) {
            return buildReturn(finalAddressData, rule);
          }
        }
      }
      if (rule.type === "polygon" && Array.isArray(geoData)) {
        const polygon = geoData.map(parseGeoPoint).filter((point) => point !== null);
        if (polygon.length > 2 && isPointInPolygon2(clientPoint, polygon)) {
          return buildReturn(finalAddressData, rule);
        }
      }
    }
  }
  throw new TRPCError40({
    code: "FORBIDDEN",
    message: `Infelizmente nossa log\xEDstica ainda n\xE3o atende a regi\xE3o do CEP ${finalAddressData.zipCode}.`
  });
}

// server/routers/storefront/checkout/orders.ts
init_schema();
init_encryption();
import { and as and27, eq as eq65, inArray as inArray10, lte as lte4, or as or11 } from "drizzle-orm";
import crypto17 from "crypto";
function generateFriendlyOrderId2() {
  const date = /* @__PURE__ */ new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = crypto17.randomBytes(2).toString("hex").toUpperCase();
  return `GS-${year}${month}-${random}`;
}
function safeDecrypt3(value) {
  if (!value || typeof value !== "string") return String(value ?? "");
  if (value.includes(":")) {
    try {
      const decrypted = decrypt(value);
      return decrypted || value;
    } catch {
      return value;
    }
  }
  return value;
}
function safeJsonParseRecord(value) {
  if (!value) return {};
  const parsed = safeJsonParse(value, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}
function toNumber3(v, fallback = 0) {
  return safeNumber(v, fallback);
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
    verifiedItems,
    pointsUsed,
    pointsEarned,
    finalNet
  } = params;
  const newOrderId = generateFriendlyOrderId2();
  const street = safeDecrypt3(addressSnap.street || addressSnap.address || addressSnap.text || (input.shippingType === "pickup" ? "Retirada" : ""));
  const number = safeDecrypt3(addressSnap.number);
  const neighborhood = safeDecrypt3(addressSnap.neighborhood);
  const complement = safeDecrypt3(addressSnap.complement);
  const city = safeDecrypt3(addressSnap.city);
  const state = safeDecrypt3(addressSnap.state);
  const zip = safeDecrypt3(addressSnap.zipCode || addressSnap.zip);
  const orderValues = {
    id: newOrderId,
    userId,
    status: "pending",
    subtotal: toNumber3(totals.subtotal).toFixed(2),
    shippingCost: toNumber3(shippingCost).toFixed(2),
    totalDiscount: toNumber3(totals.totalDiscounts).toFixed(2),
    total: toNumber3(finalNet).toFixed(2),
    paymentMethod: payMethod?.name || "N\xE3o informado",
    paymentStatus: "pending",
    // ✅ Campos de endereço são BLOB/Encrypted no DB, usamos encrypt()
    shippingAddress: encrypt(street),
    shippingAddressNumber: encrypt(number),
    shippingAddressComplement: encrypt(complement),
    shippingNeighborhood: encrypt(neighborhood),
    shippingCity: city,
    shippingState: state,
    shippingZipCode: zip,
    customerName: encrypt(input.customerName),
    customerDocument: encrypt(input.customerDocument),
    customerPhone: encrypt(input.customerPhone),
    discountsSnapshot: JSON.stringify({ ...details, totals }),
    notes: input.notes || ""
  };
  await tx.insert(orders).values(orderValues);
  if (userId) {
    try {
      const historyEntries = [];
      if (pointsUsed > 0) {
        historyEntries.push({
          id: crypto17.randomUUID(),
          userId,
          pointsChange: -Math.abs(pointsUsed),
          type: "redeemed",
          reason: "order_redemption",
          orderId: newOrderId
        });
      }
      if (pointsEarned > 0) {
        historyEntries.push({
          id: crypto17.randomUUID(),
          userId,
          pointsChange: Math.abs(pointsEarned),
          type: "earned",
          reason: "order_cashback",
          orderId: newOrderId
        });
      }
      if (historyEntries.length > 0) {
        await tx.insert(loyaltyHistory).values(historyEntries);
      }
    } catch (err) {
      console.error(`Erro fidelidade ${newOrderId}:`, err);
    }
  }
  if (verifiedItems?.length) {
    const itemsToInsert = verifiedItems.map((cItem) => {
      const opts = safeJsonParseRecord(cItem.options);
      const unitPrice = toNumber3(cItem.unitPrice);
      const qty = Math.max(1, toNumber3(cItem.quantity, 1));
      const totalPrice = toNumber3(cItem.totalPrice, unitPrice * qty);
      const dishName = typeof opts.dishName === "string" && opts.dishName || typeof opts.packageName === "string" && opts.packageName || cItem.name || "Item";
      return {
        id: `ITM-${crypto17.randomBytes(3).toString("hex").toUpperCase()}`,
        orderId: newOrderId,
        dishId: cItem.dishId ? String(cItem.dishId) : null,
        packageId: cItem.packageId ? String(cItem.packageId) : null,
        dishName,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        options: JSON.stringify(opts),
        appliedNutrition: cItem.appliedNutrition ? typeof cItem.appliedNutrition === "string" ? cItem.appliedNutrition : JSON.stringify(cItem.appliedNutrition) : null
      };
    });
    await tx.insert(orderItems).values(itemsToInsert);
  }
  return newOrderId;
}
async function cleanupCheckoutCarts(tx, params) {
  const cartIds = /* @__PURE__ */ new Set([params.cartId]);
  const ownerConditions = [eq65(carts.userId, params.userId)];
  if (params.guestId) {
    ownerConditions.push(eq65(carts.guestId, params.guestId));
    ownerConditions.push(eq65(carts.sessionId, params.guestId));
  }
  const activeCarts = await tx.select({ id: carts.id }).from(carts).where(
    and27(
      or11(eq65(carts.status, "active"), eq65(carts.status, "open")),
      or11(...ownerConditions),
      lte4(carts.updatedAt, params.closedBefore)
    )
  );
  for (const cart of activeCarts) {
    cartIds.add(String(cart.id));
  }
  const ids = Array.from(cartIds);
  if (ids.length === 0) return;
  await tx.delete(cartItems).where(inArray10(cartItems.cartId, ids));
  await tx.update(carts).set({
    status: "completed",
    discountsJson: null,
    couponCode: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(inArray10(carts.id, ids));
}

// server/routers/storefront/checkout/payment.ts
init_db();
init_schema();
import { eq as eq66, and as and28, like as like9, or as or12, asc as asc17 } from "drizzle-orm";
var paymentRouter = router({
  /**
   * ✅ getMethods: Busca métodos GERAIS
   */
  getMethods: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      if (!db2) return [];
      const methods = await db2.select().from(paymentMethods).where(eq66(paymentMethods.isActive, true)).orderBy(asc17(paymentMethods.displayOrder));
      const mainMethods = methods.filter((m) => {
        const nameLower = (m.name || "").toLowerCase();
        return !nameLower.includes("alelo") && !nameLower.includes("sodexo") && !nameLower.includes("ticket") && !nameLower.includes("vr refei\xE7\xE3o") && !nameLower.includes("ben ");
      });
      return mainMethods.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description || "",
        icon: m.icon || null
      }));
    } catch {
      return [];
    }
  }),
  /**
   * ✅ getFoodCardBrands: Busca bandeiras de VA/VR
   */
  getFoodCardBrands: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      if (!db2) return [];
      const brands = await db2.select().from(paymentMethods).where(
        and28(
          eq66(paymentMethods.isActive, true),
          or12(
            like9(paymentMethods.name, "%Alimenta\xE7\xE3o%"),
            like9(paymentMethods.name, "%Refei\xE7\xE3o%"),
            like9(paymentMethods.name, "%Alelo%"),
            like9(paymentMethods.name, "%Sodexo%"),
            like9(paymentMethods.name, "%Ticket%"),
            like9(paymentMethods.name, "%Ben %"),
            like9(paymentMethods.name, "%VR%"),
            like9(paymentMethods.name, "%Caju%"),
            like9(paymentMethods.name, "%Flash%")
          )
        )
      ).orderBy(asc17(paymentMethods.displayOrder));
      return brands.map((b) => {
        const fullName = (b.name + " " + (b.description || "")).toLowerCase();
        let type = "va";
        if (fullName.includes("refei\xE7\xE3o") || fullName.includes("vr")) {
          type = "vr";
        }
        const brand = b;
        return {
          id: b.id,
          name: brand.brandName || b.name,
          logoUrl: brand.brandLogoUrl || b.icon,
          type
        };
      });
    } catch {
      return [];
    }
  })
});

// server/routers/storefront/checkout/index.ts
function ensureCustomerName(name) {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw new TRPCError41({
      code: "BAD_REQUEST",
      message: "O nome do cliente \xE9 obrigat\xF3rio."
    });
  }
  return trimmed;
}
function ensureValidCpf(value) {
  const cleanCpf = normalizeDigits(value);
  if (!isValidCPF(cleanCpf)) {
    throw new TRPCError41({
      code: "BAD_REQUEST",
      message: "O CPF informado \xE9 inv\xE1lido."
    });
  }
  return cleanCpf;
}
function ensureValidPhone(value) {
  const cleanPhone = normalizeDigits(value);
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    throw new TRPCError41({
      code: "BAD_REQUEST",
      message: "O telefone informado \xE9 inv\xE1lido."
    });
  }
  return cleanPhone;
}
var checkoutRouter = router({
  payment: paymentRouter,
  placeOrder: protectedProcedure.use(
    createRateLimitMiddleware({
      keyPrefix: "checkout-place-order",
      limit: 12,
      windowMs: 10 * 60 * 1e3
    })
  ).input(
    z51.object({
      id: z51.string().min(1),
      paymentMethodId: z51.preprocess(
        (value) => String(value || ""),
        z51.string().min(1)
      ),
      shippingType: z51.enum(["delivery", "pickup"]),
      addressId: z51.string().nullable().optional(),
      notes: z51.string().optional().nullable(),
      customerDocument: z51.string().min(11, "CPF incompleto"),
      customerName: z51.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      customerPhone: z51.string().min(10, "Telefone inv\xE1lido"),
      useLoyaltyPoints: z51.boolean().default(false),
      loyaltyDiscount: z51.number().optional(),
      discountAmount: z51.number().optional(),
      shippingCost: z51.number().optional(),
      totalAmount: z51.number().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const cleanCpf = ensureValidCpf(input.customerDocument);
    const cleanPhone = ensureValidPhone(input.customerPhone);
    const cleanCustomerName = ensureCustomerName(input.customerName);
    const db2 = await getDb();
    const cartId = input.id;
    const userId = ctx.user.id;
    const checkoutClosedBefore = /* @__PURE__ */ new Date();
    try {
      return await db2.transaction(async (tx) => {
        const castTx = tx;
        const finalAddressId = input.addressId ?? null;
        if (input.shippingType === "delivery") {
          if (!finalAddressId || finalAddressId === "guest") {
            throw new TRPCError41({
              code: "BAD_REQUEST",
              message: "ID de endere\xE7o inv\xE1lido para entrega."
            });
          }
          const [existingAddress] = await tx.select({ id: userAddresses.id }).from(userAddresses).where(
            and29(
              eq67(userAddresses.id, finalAddressId),
              eq67(userAddresses.userId, userId)
            )
          ).limit(1);
          if (!existingAddress) {
            throw new TRPCError41({
              code: "FORBIDDEN",
              message: "Endere\xE7o n\xE3o localizado ou n\xE3o pertence \xE0 sua conta."
            });
          }
        }
        const addressSnapRaw = await loadAddressSnapshot(castTx, {
          shippingType: input.shippingType,
          addressId: finalAddressId
        });
        const realShippingCost = Number(addressSnapRaw.price || 0);
        const checkout = await recalculateCheckoutFromCart({
          userId,
          cartId,
          shippingCost: realShippingCost,
          paymentMethodId: String(input.paymentMethodId),
          useLoyaltyPoints: input.useLoyaltyPoints
        });
        const payMethod = await tx.select().from(paymentMethods).where(eq67(paymentMethods.id, String(input.paymentMethodId))).limit(1).then((rows) => rows[0]);
        const orderId = await createOrderWithItems({
          tx: castTx,
          userId,
          input: {
            shippingType: input.shippingType,
            customerName: cleanCustomerName,
            customerDocument: cleanCpf,
            customerPhone: cleanPhone,
            notes: input.notes
          },
          shippingCost: checkout.shippingCost,
          totals: {
            subtotal: checkout.subtotal,
            totalDiscounts: checkout.totalDiscounts,
            loyaltyDiscount: checkout.loyaltyDiscount
          },
          details: {
            couponCode: checkout.cart.couponCode,
            autoDiscountName: checkout.autoDiscountName,
            loyaltyValue: checkout.loyaltyDiscount,
            paymentDiscount: checkout.paymentDiscount,
            paymentMethodName: checkout.paymentMethodName,
            finalNetCalculated: checkout.total
          },
          addressSnap: {
            ...addressSnapRaw,
            zipCode: addressSnapRaw.zipCode ?? void 0
          },
          payMethod,
          verifiedItems: checkout.items,
          pointsUsed: checkout.pointsUsed,
          pointsEarned: checkout.pointsEarned,
          finalNet: checkout.total
        });
        const cleanOrderId = String(orderId).replace(/[#\s]/g, "");
        if (checkout.pointsUsed > 0 || checkout.pointsEarned > 0) {
          const [userProfile] = await tx.select().from(users).where(eq67(users.id, userId)).limit(1);
          const currentBalance = Number(userProfile?.availablePoints || 0);
          if (checkout.pointsUsed > 0) {
            const finalPointsToRedeem = Math.min(
              checkout.pointsUsed,
              currentBalance
            );
            await tx.insert(loyaltyHistory).values({
              id: randomUUID3(),
              userId,
              orderId: cleanOrderId,
              pointsChange: -finalPointsToRedeem,
              type: "redeemed",
              reason: "Resgate em Pedido"
            });
            await tx.update(users).set({
              availablePoints: sql30`${users.availablePoints} - ${finalPointsToRedeem}`
            }).where(eq67(users.id, userId));
          }
          if (checkout.pointsEarned > 0) {
            await tx.insert(loyaltyHistory).values({
              id: randomUUID3(),
              userId,
              orderId: cleanOrderId,
              pointsChange: checkout.pointsEarned,
              type: "earned",
              reason: "Compra Gourmet Saud\xE1vel"
            });
            await tx.update(users).set({
              availablePoints: sql30`${users.availablePoints} + ${checkout.pointsEarned}`
            }).where(eq67(users.id, userId));
          }
        }
        await tx.update(users).set({
          name: encrypt(cleanCustomerName),
          customerDocument: encrypt(cleanCpf),
          documentIndex: piiHash(cleanCpf),
          phone: encrypt(cleanPhone),
          phoneIndex: piiHash(cleanPhone),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq67(users.id, userId));
        await cleanupCheckoutCarts(castTx, {
          cartId,
          userId,
          guestId: ctx.guestId,
          closedBefore: checkoutClosedBefore
        });
        return {
          success: true,
          orderId: cleanOrderId,
          message: "Pedido criado com sucesso!"
        };
      });
    } catch (error) {
      if (error instanceof TRPCError41) throw error;
      throw new TRPCError41({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Falha cr\xEDtica no processamento do pedido."
      });
    }
  })
});

// server/routers/storefront/orders.ts
import { z as z52 } from "zod";
import { TRPCError as TRPCError42 } from "@trpc/server";
init_db();
init_schema();
import { eq as eq68, inArray as inArray11, desc as desc30 } from "drizzle-orm";
function safeJsonParse2(value) {
  if (!value) return {};
  if (typeof value !== "string") {
    return value && typeof value === "object" ? value : {};
  }
  try {
    const parsed = safeJsonParse(value, {});
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    console.error("\u274C Erro ao parsear JSON no backend:", e);
    return {};
  }
}
async function fetchOrderWithItems(db2, orderId) {
  const [order] = await db2.select().from(orders).where(eq68(orders.id, orderId)).limit(1);
  if (!order) throw new TRPCError42({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado." });
  const itemsRaw = await db2.select().from(orderItems).where(eq68(orderItems.orderId, order.id));
  const items = itemsRaw.map((i) => ({
    ...i,
    dishId: i.dishId ? Number(i.dishId) : null,
    packageId: i.packageId ? Number(i.packageId) : null,
    quantity: safeNumber(i.quantity, 1),
    unitPrice: safeNumber(i.unitPrice),
    totalPrice: safeNumber(i.totalPrice),
    options: safeJsonParse2(i.options),
    appliedNutrition: safeJsonParse2(i.appliedNutrition)
  }));
  return {
    ...order,
    total: safeNumber(order.total),
    subtotal: safeNumber(order.subtotal),
    shippingCost: safeNumber(order.shippingCost),
    totalDiscount: safeNumber(order.totalDiscount),
    pointsEarned: safeNumber(order.pointsEarned),
    pointsUsed: safeNumber(order.pointsUsed),
    items
  };
}
var ordersRouter = router({
  /**
   * 📋 Lista pedidos do usuário logado (Protegido)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError42({ code: "INTERNAL_SERVER_ERROR", message: "Banco indispon\xEDvel" });
    const userId = String(ctx.user.id);
    const baseOrders = await db2.select().from(orders).where(eq68(orders.userId, userId)).orderBy(desc30(orders.createdAt)).limit(50);
    if (baseOrders.length === 0) return [];
    const orderIds = baseOrders.map((o) => o.id);
    const allItemsRaw = await db2.select().from(orderItems).where(inArray11(orderItems.orderId, orderIds));
    return baseOrders.map((o) => {
      const orderItemsFiltered = allItemsRaw.filter((item) => item.orderId === o.id).map((item) => ({
        ...item,
        dishId: item.dishId ? Number(item.dishId) : null,
        packageId: item.packageId ? Number(item.packageId) : null,
        quantity: safeNumber(item.quantity, 1),
        unitPrice: safeNumber(item.unitPrice),
        totalPrice: safeNumber(item.totalPrice),
        options: safeJsonParse2(item.options),
        appliedNutrition: safeJsonParse2(item.appliedNutrition)
      }));
      return {
        ...o,
        // ✅ CORREÇÃO CODEX: Coerção total aplicada no list para manter consistência com o fetch individual
        total: safeNumber(o.total),
        subtotal: safeNumber(o.subtotal),
        shippingCost: safeNumber(o.shippingCost),
        totalDiscount: safeNumber(o.totalDiscount),
        pointsEarned: safeNumber(o.pointsEarned),
        pointsUsed: safeNumber(o.pointsUsed),
        items: orderItemsFiltered
      };
    });
  }),
  getPublicDetail: publicProcedure.input(z52.object({ orderId: z52.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError42({ code: "INTERNAL_SERVER_ERROR" });
    return await fetchOrderWithItems(db2, input.orderId);
  }),
  getById: protectedProcedure.input(z52.object({ id: z52.string() })).query(async ({ input, ctx }) => {
    const db2 = await getDb();
    if (!db2) throw new TRPCError42({ code: "INTERNAL_SERVER_ERROR" });
    const order = await fetchOrderWithItems(db2, input.id);
    if (String(order.userId) !== String(ctx.user.id)) {
      throw new TRPCError42({ code: "FORBIDDEN", message: "Pedido n\xC3\xA3o pertence ao usu\xC3\xA1rio." });
    }
    return order;
  })
});

// server/routers/storefront/products.ts
import { z as z53 } from "zod";
import { TRPCError as TRPCError43 } from "@trpc/server";
init_db();
init_schema();
import { eq as eq69, and as and30, asc as asc18, like as like10 } from "drizzle-orm";
var normalizeDish = (dish) => {
  if (!dish) return null;
  const toNum3 = (val) => {
    return safeNumber(val);
  };
  const d = dish;
  const rawCatId = d.categoryId ?? d.category_id ?? d.categoryIdRaw;
  const showNutrition = Boolean(d.showNutrition ?? d.show_nutrition ?? d.show_nutritional_info);
  return {
    id: safeInteger(d.id),
    name: d.name || "Sem nome",
    slug: d.slug || String(d.id),
    description: d.description || "",
    imageUrl: d.imageUrl || d.image_url || null,
    price: toNum3(d.basePrice || d.base_price || d.price || 0),
    salePrice: d.salePrice || d.sale_price ? toNum3(d.salePrice || d.sale_price) : null,
    categoryId: rawCatId ? safeInteger(rawCatId) : null,
    isActive: !!(d.isActive ?? d.is_active),
    displayOrder: toNum3(d.displayOrder ?? d.display_order ?? 0),
    showNutrition,
    energyKcal: toNum3(d.energyKcal ?? d.energy_kcal ?? 0),
    energyKj: toNum3(d.energyKj ?? d.energy_kj ?? 0),
    proteins: toNum3(d.proteins ?? 0),
    carbs: toNum3(d.carbs ?? 0),
    fatTotal: toNum3(d.fatTotal ?? d.fat_total ?? 0),
    fatSaturated: toNum3(d.fatSaturated ?? d.fat_saturated ?? 0),
    fatTrans: toNum3(d.fatTrans ?? d.fat_trans ?? 0),
    fiber: toNum3(d.fiber ?? 0),
    sodium: toNum3(d.sodium ?? 0),
    calcium: toNum3(d.calcium ?? 0),
    iron: toNum3(d.iron ?? 0),
    ingredients: d.ingredients || "",
    nutrition: {
      kcal: Math.round(toNum3(d.energyKcal ?? d.energy_kcal ?? 0)),
      proteins: toNum3(d.proteins ?? 0),
      carbs: toNum3(d.carbs ?? 0),
      fats: toNum3(d.fatTotal ?? d.fat_total ?? 0),
      fiber: toNum3(d.fiber ?? 0),
      sodium: toNum3(d.sodium ?? 0)
    }
  };
};
var productsRouter = router({
  /**
   * 1. LISTAGEM DE PRODUTOS (Vitrine)
   */
  list: publicProcedure.input(z53.object({
    page: z53.number().default(1),
    perPage: z53.number().default(100),
    search: z53.string().nullish(),
    category: z53.union([z53.number(), z53.string()]).nullish()
  }).optional()).query(async ({ input }) => {
    const db2 = await getDb();
    const page = input?.page || 1;
    const perPage = input?.perPage || 100;
    const search = input?.search;
    const category = input?.category;
    const offset = (page - 1) * perPage;
    const conditions = [eq69(dishes.isActive, true)];
    if (search) {
      conditions.push(like10(dishes.name, `%${search}%`));
    }
    if (category && category !== "all") {
      const catId = safeInteger(category, Number.NaN);
      if (Number.isFinite(catId)) conditions.push(eq69(dishes.categoryId, catId));
    }
    const rows = await db2.select({
      dish: dishes,
      categoryName: categories.name
    }).from(dishes).leftJoin(categories, eq69(dishes.categoryId, categories.id)).where(and30(...conditions)).limit(perPage).offset(offset).orderBy(asc18(dishes.displayOrder));
    return rows.map((row) => {
      const normalized = normalizeDish(row.dish);
      return normalized ? { ...normalized, categoryName: row.categoryName } : null;
    }).filter((item) => item !== null);
  }),
  /**
   * 2. DETALHE DO PRODUTO (Busca por ID)
   */
  getById: publicProcedure.input(z53.object({ id: z53.number() })).query(async ({ input }) => {
    const db2 = await getDb();
    const [row] = await db2.select().from(dishes).where(and30(eq69(dishes.id, input.id), eq69(dishes.isActive, true))).limit(1);
    if (!row) throw new TRPCError43({ code: "NOT_FOUND", message: "Produto n\xE3o encontrado." });
    const normalizedDish = normalizeDish(row);
    const sizesData = await db2.select({
      id: dishSizes.id,
      name: dishSizes.name,
      priceModifier: dishSizes.priceModifier,
      mainDishWeight: dishSizes.mainDishWeight
    }).from(dishSizes).innerJoin(dishesToSizes, eq69(dishSizes.id, dishesToSizes.sizeId)).where(eq69(dishesToSizes.dishId, input.id));
    const sizesWithDetails = await Promise.all(sizesData.map(async (size) => {
      const groups = await db2.select({
        id: accompanimentGroups.id,
        name: accompanimentGroups.name,
        minSelections: sizeAccompanimentGroups.minSelections,
        maxSelections: sizeAccompanimentGroups.maxSelections
      }).from(sizeAccompanimentGroups).innerJoin(accompanimentGroups, eq69(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id)).where(and30(
        eq69(sizeAccompanimentGroups.sizeId, size.id),
        eq69(accompanimentGroups.isActive, true)
      ));
      const groupsWithExtras = await Promise.all(groups.map(async (group) => {
        const options = await db2.select({
          id: accompanimentOptions.id,
          name: accompanimentOptions.name,
          priceModifier: accompanimentOptions.priceModifier,
          energyKcal: accompanimentOptions.energyKcal,
          proteins: accompanimentOptions.proteins,
          carbs: accompanimentOptions.carbs,
          fatTotal: accompanimentOptions.fatTotal
        }).from(accompanimentOptions).innerJoin(groupToOptions, eq69(accompanimentOptions.id, groupToOptions.optionId)).where(eq69(groupToOptions.groupId, group.id));
        return {
          ...group,
          options: options.map((opt) => ({
            ...opt,
            priceModifier: safeNumber(opt.priceModifier)
          }))
        };
      }));
      return {
        ...size,
        priceModifier: safeNumber(size.priceModifier),
        accompanimentGroups: groupsWithExtras
      };
    }));
    return {
      ...normalizedDish,
      sizes: sizesWithDetails
    };
  })
});

// server/routers/storefront/packages.ts
import { z as z54 } from "zod";
init_db();
init_schema();
import { eq as eq70, sql as sql31 } from "drizzle-orm";
var packagesRouter = router({
  /**
   * 📦 LIST: Lista todos os pacotes/kits ativos para a vitrine
   */
  list: publicProcedure.query(async () => {
    try {
      const result = await getAllPackages();
      if (!result) return [];
      return result.map((pkg) => ({
        ...pkg,
        // Garante que o frontend receba booleano para isPopular (MySQL retorna 0/1)
        isPopular: pkg.isPopular === true || pkg.isPopular === 1 || pkg.is_popular === 1
        // Highlights e Category já vão como string/null para o frontend lidar no PackageCard
      }));
    } catch (error) {
      console.error("Erro ao listar pacotes no storefront:", error);
      return [];
    }
  }),
  /**
   * 🔍 GET BY ID: Detalhes do pacote e seus Slots para o Wizard
   */
  getById: publicProcedure.input(z54.object({ id: z54.string() })).query(async ({ input }) => {
    try {
      const result = await getPackageById(input.id);
      if (!result) return null;
      return {
        ...result,
        // ✅ Tratamento dos novos campos também no detalhe (caso precise no drawer)
        isPopular: result.isPopular === true || result.isPopular === 1 || result.is_popular === 1,
        options: (result.options || []).map((slot) => ({
          ...slot,
          dishes: (slot.dishes || []).map((dish) => ({
            ...dish,
            ingredients: dish.ingredients || dish.nutritional_info?.ingredients || ""
          }))
        }))
      };
    } catch (error) {
      console.error(`Erro ao buscar pacote ${input.id}:`, error);
      return null;
    }
  }),
  /**
   * 📏 GET AVAILABLE SIZES: Busca os tamanhos configurados (P, M, G)
   */
  getAvailableSizes: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      if (!db2) return [];
      const result = await db2.select({
        id: dishSizes.id,
        name: dishSizes.name,
        mainDishWeight: sql31`CAST(COALESCE(${dishSizes.mainDishWeight}, 0) AS UNSIGNED)`,
        isActive: dishSizes.isActive
      }).from(dishSizes).where(eq70(dishSizes.isActive, true));
      return result || [];
    } catch {
      return [];
    }
  }),
  /**
   * 🥗 LIST ALL DISHES: Busca pratos para preencher os slots dos kits
   */
  listAllDishes: publicProcedure.query(async () => {
    try {
      const db2 = await getDb();
      if (!db2) return [];
      const dishesRaw = await db2.select().from(dishes).where(eq70(dishes.isActive, true));
      return dishesRaw.map((dish) => {
        const rawNutri = dish.nutritionalInfo || dish.nutritional_info || dish.nutrition;
        let nutInfo = {};
        if (typeof rawNutri === "string") {
          nutInfo = safeJsonParse(rawNutri, {});
        } else {
          nutInfo = rawNutri || {};
        }
        return {
          ...dish,
          id: safeInteger(dish.id),
          price: safeNumber(dish.price),
          nutritional_info: {
            ...nutInfo,
            ingredients: dish.ingredients || nutInfo.ingredients || ""
          },
          accompaniments: dish.accompaniments || []
        };
      });
    } catch {
      return [];
    }
  })
});

// server/routers/storefront/sizes.ts
import { z as z55 } from "zod";

// server/admin-sizes.ts
init_db();
init_schema();
import { asc as asc19, eq as eq71, and as and31 } from "drizzle-orm";
import { TRPCError as TRPCError44 } from "@trpc/server";
function toPriceString(price) {
  if (price === void 0 || price === null || price === "") return "0.00";
  const normalized = typeof price === "string" ? price.replace(",", ".") : price;
  const num = safeNumber(normalized, Number.NaN);
  if (!Number.isFinite(num) || num < 0) {
    throw new TRPCError44({ code: "BAD_REQUEST", message: "Valor monet\xC3\xA1rio inv\xC3\xA1lido." });
  }
  return num.toFixed(2);
}
function ensureValidJson(data) {
  if (!data) return [];
  if (typeof data === "string") {
    const parsed = safeJsonParse(data, []);
    return Array.isArray(parsed) ? parsed : [];
  }
  return Array.isArray(data) ? data : [];
}
async function getAllDishSizes() {
  const db2 = await getDb();
  const result = await db2.select().from(dishSizes).orderBy(asc19(dishSizes.displayOrder));
  return result.map((size) => ({
    ...size,
    id: safeInteger(size.id),
    isActive: Boolean(size.isActive),
    priceModifier: size.priceModifier || "0.00",
    mainDishWeight: size.mainDishWeight || "200.00",
    groupsOrder: ensureValidJson(size.groupsOrder)
  }));
}
async function upsertDishSize(data) {
  const db2 = await getDb();
  const id = data.id ? safeInteger(data.id, Number.NaN) : null;
  if (data.id && !Number.isFinite(id)) {
    throw new TRPCError44({ code: "BAD_REQUEST", message: "ID do tamanho inv\xC3\xA1lido." });
  }
  const payload = {
    name: data.name,
    weight: data.weight || null,
    price: toPriceString(data.price),
    priceModifier: toPriceString(data.priceModifier),
    mainDishWeight: toPriceString(data.mainDishWeight || 200),
    iconKey: data.iconKey || "Box",
    color: data.color || "slate",
    isActive: Boolean(data.isActive),
    description: data.description || null,
    groupsOrder: JSON.stringify(ensureValidJson(data.groupsOrder)),
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (id) {
    await db2.update(dishSizes).set(payload).where(eq71(dishSizes.id, id));
    return { success: true, id };
  } else {
    const insertPayload = {
      ...payload,
      displayOrder: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    const [res] = await db2.insert(dishSizes).values(insertPayload);
    const insertId = res?.insertId || (Array.isArray(res) ? res[0]?.insertId : null);
    return { success: true, id: insertId };
  }
}
async function deleteDishSize(id) {
  const db2 = await getDb();
  return await db2.transaction(async (tx) => {
    await tx.delete(sizeAccompanimentGroups).where(eq71(sizeAccompanimentGroups.sizeId, id));
    await tx.delete(dishesToSizes).where(eq71(dishesToSizes.sizeId, id));
    return await tx.delete(dishSizes).where(eq71(dishSizes.id, id));
  });
}
async function toggleSizeGroupLink(sizeId, groupId) {
  const db2 = await getDb();
  const [existing] = await db2.select().from(sizeAccompanimentGroups).where(and31(
    eq71(sizeAccompanimentGroups.sizeId, sizeId),
    eq71(sizeAccompanimentGroups.accompanimentGroupId, groupId)
  )).limit(1);
  if (existing) {
    await db2.delete(sizeAccompanimentGroups).where(and31(
      eq71(sizeAccompanimentGroups.sizeId, sizeId),
      eq71(sizeAccompanimentGroups.accompanimentGroupId, groupId)
    ));
  } else {
    await db2.insert(sizeAccompanimentGroups).values({
      sizeId,
      accompanimentGroupId: groupId
    });
  }
  const currentGroups = await db2.select({ id: sizeAccompanimentGroups.accompanimentGroupId }).from(sizeAccompanimentGroups).where(eq71(sizeAccompanimentGroups.sizeId, sizeId));
  const newOrder = currentGroups.map((g) => g.id);
  await db2.update(dishSizes).set({ groupsOrder: JSON.stringify(newOrder) }).where(eq71(dishSizes.id, sizeId));
  return { success: true, linked: !existing };
}

// server/routers/storefront/sizes.ts
var sizesRouter = router({
  // 1. TAMANHOS (DISH SIZES)
  /**
   * Lista todos os tamanhos (P, M, G) para a vitrine ou admin
   */
  list: publicProcedure.query(async () => {
    return await getAllDishSizes();
  }),
  /**
   * Cria ou Atualiza um tamanho (Usa sua função upsert)
   */
  upsert: adminProcedure.input(z55.object({
    id: z55.number().optional().nullable(),
    name: z55.string().min(1, "Nome \xE9 obrigat\xF3rio"),
    priceModifier: z55.union([z55.string(), z55.number()]).default("0.00"),
    mainDishWeight: z55.union([z55.string(), z55.number()]).default(200),
    isActive: z55.boolean().default(true),
    groupsOrder: z55.array(z55.number()).optional()
  }).passthrough()).mutation(async ({ input }) => {
    const result = await upsertDishSize(input);
    return {
      ...result,
      success: true,
      message: input.id ? "Tamanho atualizado!" : "Novo tamanho criado com sucesso! \u{1F4CF}"
    };
  }),
  /**
   * Remove um tamanho e seus vínculos (Transação garantida)
   */
  delete: adminProcedure.input(z55.object({ id: z55.number() })).mutation(async ({ input }) => {
    await deleteDishSize(input.id);
    return {
      success: true,
      message: "Tamanho removido com sucesso."
    };
  }),
  // 2. ACOMPANHAMENTOS E NUTRIÇÃO
  /**
   * Busca as opções de acompanhamento com dados nutricionais completos
   */
  listOptionsWithNutrition: adminProcedure.query(async () => {
    return await getAccsWithNutrition();
  }),
  // 3. VÍNCULOS (Link entre Tamanho e Grupo)
  /**
   * Liga ou desliga um grupo de um tamanho específico
   */
  toggleLink: adminProcedure.input(z55.object({
    sizeId: z55.number(),
    groupId: z55.number()
  })).mutation(async ({ input }) => {
    const result = await toggleSizeGroupLink(input.sizeId, input.groupId);
    return {
      ...result,
      message: result.linked ? "Grupo vinculado! \u{1F517}" : "V\xEDnculo removido."
    };
  })
});

// server/routers/storefront/coupons.ts
import { z as z56 } from "zod";
init_db();
init_schema();
import { eq as eq72, and as and32, gte as gte5, lte as lte5, or as or13, isNull as isNull4 } from "drizzle-orm";
import { TRPCError as TRPCError45 } from "@trpc/server";
var couponsRouter = router({
  /**
   * 🎟️ VALIDAR: Usado para verificar a existência e regras do cupom.
   * Feedback: O Interceptor Global cuidará do erro caso o cupom falhe.
   */
  validate: publicProcedure.input(z56.object({ code: z56.string().toUpperCase().trim() })).query(async ({ input }) => {
    const db2 = await getDb();
    const now = /* @__PURE__ */ new Date();
    const [coupon] = await db2.select().from(coupons).where(
      and32(
        eq72(coupons.code, input.code),
        eq72(coupons.isActive, true),
        // Validação de janela temporal (ou nulo para cupons vitalícios)
        or13(isNull4(coupons.validFrom), lte5(coupons.validFrom, now)),
        or13(isNull4(coupons.validUntil), gte5(coupons.validUntil, now))
      )
    ).limit(1);
    if (!coupon) {
      throw new TRPCError45({
        code: "NOT_FOUND",
        message: "Este cupom n\xE3o \xE9 v\xE1lido, expirou ou n\xE3o existe."
      });
    }
    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue || 0),
      minOrderValue: Number(coupon.minOrderValue || 0),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      description: coupon.description || ""
    };
  })
});

// server/routers/storefront/discounts.ts
init_db();
init_schema();
import { eq as eq73, asc as asc20 } from "drizzle-orm";
var fetchRulesLogic = async () => {
  const db2 = await getDb();
  if (!db2) return [];
  try {
    const rules = await db2.select().from(discountRules).where(eq73(discountRules.isActive, true)).orderBy(asc20(discountRules.minQuantity));
    return rules.map((rule) => ({
      ...rule,
      // Normalização de tipos para o Frontend (Numbers puros)
      discountValue: Number(rule.discountValue || 0),
      minQuantity: Number(rule.minQuantity || 0),
      // Adicionamos um rótulo amigável caso o banco não tenha (ex: "5% OFF")
      label: rule.name || `${Number(rule.discountValue)}% OFF`
    }));
  } catch {
    return [];
  }
};
var discountsRouter = router({
  /**
   * 🛒 getDiscountRules
   * Essencial para o componente de progresso no carrinho.
   */
  getDiscountRules: publicProcedure.query(async () => {
    return await fetchRulesLogic();
  }),
  /**
   * 🔄 getActiveRules (Compatibilidade)
   */
  getActiveRules: publicProcedure.query(async () => {
    return await fetchRulesLogic();
  })
});

// server/routers/storefront/loyalty.ts
init_db();
init_schema();
import { sql as sql32, eq as eq74 } from "drizzle-orm";
import { z as z57 } from "zod";
var loyaltyRouter = router({
  /**
   * ✅ GET POINTS
   */
  getPoints: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    try {
      const db2 = await getDb();
      const [balanceQuery] = await db2.execute(sql32`
        SELECT COALESCE(SUM(points_change), 0) as total_balance 
        FROM loyalty_history 
        WHERE user_id = ${userId}
      `);
      const [userRow] = await db2.select().from(users).where(eq74(users.id, userId)).limit(1);
      const rows = Array.isArray(balanceQuery) ? balanceQuery : [balanceQuery];
      const firstRow = rows[0];
      const points = Number(firstRow?.total_balance || 0);
      const userData = userRow;
      const totalSpent = userData?.totalSpent || userData?.total_spent || "0.00";
      return {
        current_points: points,
        loyaltyPoints: points,
        totalSpent: String(totalSpent),
        tier: userData?.loyaltyTier || "Bronze"
      };
    } catch (error) {
      logger.error({ err: error, userId }, "Erro ao buscar pontos do usu\xE1rio");
      return { current_points: 0, loyaltyPoints: 0, totalSpent: "0.00" };
    }
  }),
  /**
   * ✅ GET HISTORY
   */
  getHistory: protectedProcedure.input(z57.object({ limit: z57.number().default(5) }).optional()).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const limit = input?.limit ?? 5;
    try {
      const db2 = await getDb();
      const [rows] = await db2.execute(sql32`
          SELECT id, reason, description, points_change, created_at 
          FROM loyalty_history 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC
          LIMIT ${limit}
        `);
      if (!Array.isArray(rows)) return [];
      return rows.map((entry) => {
        const e = entry;
        return {
          id: e.id,
          reason: e.reason || "Compra Realizada",
          description: e.description || "Pontos acumulados",
          pointsChange: Number(e.points_change || 0),
          createdAt: e.created_at
        };
      });
    } catch (error) {
      logger.error({ err: error, userId }, "Erro ao buscar hist\xF3rico de fidelidade");
      return [];
    }
  }),
  /**
   * ✅ GET SETTINGS (Público)
   */
  getSettings: publicProcedure.query(async () => {
    try {
      const settings = await getLoyaltySettings();
      const rules = settings?.redemption_rules || settings?.redemptionRules;
      if (!settings || !rules || Array.isArray(rules) && rules.length === 0) {
        logger.warn("\u26A0\uFE0F getSettings retornou regras vazias ou incompletas.");
      }
      return settings;
    } catch (error) {
      logger.error({ err: error }, "Erro cr\xEDtico ao buscar configura\xE7\xF5es no loyaltyRouter");
      return {
        redemptionRatePoints: 100,
        redemptionRateMoney: "1.00",
        enabled: false,
        conversionRateMoney: "1.00",
        conversionRatePoints: 1,
        redemptionRules: []
      };
    }
  }),
  /**
   * 🔄 COMPATIBILIDADE E DEBUG DE SALDO
   */
  getCustomerSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db2 = await getDb();
      const [result] = await db2.execute(sql32`
        SELECT COALESCE(SUM(points_change), 0) as total_balance 
        FROM loyalty_history 
        WHERE user_id = ${ctx.user.id}
      `);
      const rows = Array.isArray(result) ? result : [result];
      const points = Number(rows[0]?.total_balance || 0);
      return {
        current_points: points,
        balance: points,
        points,
        userId: ctx.user.id
      };
    } catch (error) {
      logger.error({ err: error }, "Erro no customer summary");
      return { current_points: 0, balance: 0, points: 0, userId: ctx.user.id };
    }
  }),
  getUserBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    logger.debug({ userId }, "Verificando saldo do usu\xE1rio via getUserBalance");
    try {
      const db2 = await getDb();
      const [result] = await db2.execute(sql32`
        SELECT COALESCE(SUM(points_change), 0) as total_balance 
        FROM loyalty_history 
        WHERE user_id = ${userId}
      `);
      const rows = Array.isArray(result) ? result : [result];
      const balance = Number(rows[0]?.total_balance || 0);
      return { balance, userId };
    } catch (error) {
      logger.error({ err: error }, "Erro ao buscar balance");
      return { balance: 0, userId };
    }
  })
});

// server/routers/storefront/public.ts
init_db();
import { z as z59 } from "zod";
import { eq as eq76, asc as asc22, and as and33, like as like11, inArray as inArray12 } from "drizzle-orm";
init_encryption();
import axios3 from "axios";
init_schema();
init_schema();

// server/routers/storefront/paymentMethods.ts
init_db();
init_schema();
import { z as z58 } from "zod";
import { eq as eq75, asc as asc21 } from "drizzle-orm";
import { TRPCError as TRPCError46 } from "@trpc/server";
function toSlug(input) {
  const base = String(input ?? "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  return base || "metodo_pagamento";
}
function toMoneyString(v) {
  if (v === null || v === void 0 || v === "") return "0.00";
  const n = Number(v);
  if (Number.isFinite(n)) return n.toFixed(2);
  const n2 = Number(String(v).replace(",", "."));
  return Number.isFinite(n2) ? n2.toFixed(2) : "0.00";
}
var paymentMethodSchema = z58.object({
  name: z58.string().min(1, "O nome \xE9 obrigat\xF3rio"),
  isActive: z58.boolean().optional().default(true),
  discountPercentage: z58.coerce.number().min(0).max(100).optional().default(0),
  displayOrder: z58.coerce.number().int().optional().default(0),
  description: z58.string().optional().nullable(),
  icon: z58.string().optional().nullable(),
  slug: z58.string().optional(),
  instructions: z58.string().optional().nullable()
});
var paymentMethodsRouter = router({
  list: publicProcedure.query(async () => {
    const db2 = await getDb();
    try {
      return await db2.select().from(paymentMethods).where(eq75(paymentMethods.isActive, true)).orderBy(asc21(paymentMethods.displayOrder), asc21(paymentMethods.name));
    } catch {
      throw new TRPCError46({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar pagamentos"
      });
    }
  }),
  get: publicProcedure.input(z58.object({ id: z58.coerce.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const [method] = await db2.select().from(paymentMethods).where(eq75(paymentMethods.id, input.id)).limit(1);
    if (!method)
      throw new TRPCError46({ code: "NOT_FOUND", message: "M\xE9todo n\xE3o encontrado." });
    return method;
  }),
  create: adminProcedure.input(paymentMethodSchema).mutation(async ({ input }) => {
    const db2 = await getDb();
    try {
      const slug = toSlug(input.slug ?? input.name);
      const insertData = {
        name: input.name,
        isActive: input.isActive,
        displayOrder: input.displayOrder,
        description: input.description,
        icon: input.icon,
        instructions: input.instructions,
        slug,
        discountPercentage: toMoneyString(input.discountPercentage),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      await db2.insert(paymentMethods).values(insertData);
      return { success: true, message: "M\xE9todo criado com sucesso!" };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao criar.";
      throw new TRPCError46({ code: "BAD_REQUEST", message: msg });
    }
  }),
  update: adminProcedure.input(paymentMethodSchema.partial().extend({ id: z58.coerce.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    try {
      const { id, ...data } = input;
      const updateData = {
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (data.slug !== void 0) updateData.slug = toSlug(data.slug);
      if (data.discountPercentage !== void 0) {
        updateData.discountPercentage = toMoneyString(data.discountPercentage);
      }
      if (data.displayOrder !== void 0) {
        updateData.displayOrder = Number.isFinite(Number(data.displayOrder)) ? Number(data.displayOrder) : 0;
      }
      await db2.update(paymentMethods).set(updateData).where(eq75(paymentMethods.id, id));
      return { success: true, message: "Atualizado com sucesso." };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao atualizar.";
      throw new TRPCError46({ code: "BAD_REQUEST", message: msg });
    }
  }),
  delete: adminProcedure.input(z58.object({ id: z58.coerce.string() })).mutation(async ({ input }) => {
    const db2 = await getDb();
    try {
      await db2.delete(paymentMethods).where(eq75(paymentMethods.id, input.id));
      return { success: true, message: "Removido com sucesso." };
    } catch {
      throw new TRPCError46({
        code: "CONFLICT",
        message: "Erro ao excluir (poss\xEDvel v\xEDnculo com pedidos)."
      });
    }
  })
});

// server/routers/storefront/public.ts
async function fetchAllStoreSettings() {
  try {
    const db2 = await getDb();
    const general = await getStoreSettings() || {};
    const [shipping] = await db2.select().from(shippingSettings).limit(1);
    const configKeys = [
      "accessibility_high_contrast",
      "accessibility_dyslexic_font",
      "accessibility_vlibras_active",
      "accessibility_font_scale",
      "success_order_message",
      "partners_json",
      "company_social_info",
      "favicon_url",
      "google_analytics_id"
      // ✅ necessário para o useAnalytics
    ];
    const extraConfigs = await db2.select().from(appConfigs).where(inArray12(appConfigs.configKey, configKeys));
    const getVal = (k) => extraConfigs.find((r) => r.configKey === k)?.configValue;
    const rawSocial = getVal("company_social_info");
    let socialData = null;
    if (rawSocial) {
      try {
        const decrypted = decrypt(rawSocial);
        socialData = safeJsonParse(
          decrypted || rawSocial,
          null
        );
      } catch {
        socialData = null;
      }
    }
    return {
      ...general,
      favicon: getVal("favicon_url") || general.favicon || "/favicon.ico",
      googleAnalyticsId: getVal("google_analytics_id") || null,
      pickupEnabled: shipping?.pickupEnabled ?? general.pickupEnabled ?? true,
      pickupLabel: shipping?.pickupLabel ?? general.pickupLabel ?? "Retirada no Local",
      pickupInstruction: shipping?.pickupInstruction ?? general.pickupInstruction ?? "Apresente o n\xFAmero do pedido no balc\xE3o.",
      success_order_message: getVal("success_order_message") || "Pedido recebido com sucesso! \u{1F957}",
      partners_json: getVal("partners_json") || "[]",
      company_social_info: socialData,
      accessibility: {
        highContrast: getVal("accessibility_high_contrast") === "true",
        dyslexicFont: getVal("accessibility_dyslexic_font") === "true",
        vLibrasActive: getVal("accessibility_vlibras_active") === "true",
        fontScale: safeNumber(getVal("accessibility_font_scale"), 1)
      }
    };
  } catch (err) {
    console.error("Erro ao carregar Store Settings:", err);
    return { id: "1", emergencyMode: false, accessibility: { fontScale: 1 } };
  }
}
var normalizeDish2 = (dish) => {
  if (!dish || typeof dish !== "object") return null;
  const d = dish;
  const toNum3 = (val) => {
    return safeNumber(val);
  };
  let info = {};
  const rawInfo = d.nutritionalInfo || d.nutritional_info;
  if (rawInfo) {
    info = safeJsonParse(rawInfo, {});
  }
  return {
    id: safeInteger(d.id),
    name: d.name || "Prato sem nome",
    slug: d.slug || String(d.id),
    price: toNum3(d.price || d.basePrice || 0),
    salePrice: d.salePrice ? toNum3(d.salePrice) : null,
    imageUrl: d.imageUrl || d.image_url || null,
    description: d.description || "",
    categoryId: d.categoryId ?? d.category_id ? safeInteger(d.categoryId ?? d.category_id) : null,
    isActive: !!(d.isActive ?? d.is_active),
    displayOrder: toNum3(d.displayOrder ?? 0),
    show_nutrition: !!(d.show_nutrition || d.showNutrition),
    nutritional_info: {
      kcal: Math.round(toNum3(info?.kcal || d.energyKcal || 0)),
      proteins: toNum3(info?.proteins || d.proteins || 0),
      carbs: toNum3(info?.carbs || info?.carbohydrates || d.carbs || 0),
      fats: toNum3(info?.fats || d.fatTotal || 0)
    }
  };
};
var publicRouter = router({
  paymentMethods: paymentMethodsRouter,
  referral: router({
    bindCode: publicProcedure.input(z59.object({ code: z59.string().min(1), sessionId: z59.string().min(1) })).mutation(async ({ input }) => {
      const db2 = await getDb();
      const normalizedCode = input.code.toLowerCase().replace(/\s+/g, "");
      const [partner] = await db2.select().from(referrals).where(and33(eq76(referrals.code, normalizedCode), eq76(referrals.isActive, true))).limit(1);
      if (!partner) return { success: false, message: "C\xF3digo inv\xE1lido." };
      await db2.update(sessions).set({ referralCode: normalizedCode }).where(eq76(sessions.id, input.sessionId));
      return { success: true, appliedCode: normalizedCode, partnerName: partner.name };
    })
  }),
  getProfessionalReviews: publicProcedure.input(z59.object({ dishId: z59.string() })).query(async ({ input }) => {
    const db2 = await getDb();
    const rawReviews = await db2.select({
      id: professionalReviews.id,
      insight: professionalReviews.technicalInsight,
      highlights: professionalReviews.nutritionalHighlights,
      authorNameEncrypted: users.name,
      authorTitle: user_profiles.professional_title
    }).from(professionalReviews).innerJoin(users, eq76(professionalReviews.userId, users.id)).innerJoin(user_profiles, eq76(users.id, user_profiles.userId)).where(and33(eq76(professionalReviews.dishId, input.dishId), eq76(professionalReviews.isActive, true)));
    return rawReviews.map((review) => ({
      id: review.id,
      insight: review.insight,
      highlights: review.highlights,
      authorName: decrypt(review.authorNameEncrypted || "") || "Especialista Gourmet Saud\xE1vel",
      authorTitle: review.authorTitle || "Nutricionista"
    }));
  }),
  dishes: router({
    categories: publicProcedure.query(async () => {
      const db2 = await getDb();
      return await db2.select().from(categories).where(eq76(categories.isActive, true)).orderBy(asc22(categories.displayOrder));
    }),
    getById: publicProcedure.input(z59.object({ id: z59.number() })).query(async ({ input }) => {
      const details = await getDishDetails(input.id);
      if (!details) return null;
      const normalized = normalizeDish2(details);
      if (!normalized) return null;
      const d = details;
      return {
        ...normalized,
        nutritionalInfo: normalized.nutritional_info,
        ingredients: String(d.ingredients || ""),
        sizes: d.sizes || [],
        accompaniments: d.accompaniments || []
      };
    }),
    list: publicProcedure.input(z59.object({
      page: z59.number().default(1),
      perPage: z59.number().default(100),
      search: z59.string().nullish(),
      category: z59.union([z59.number(), z59.string()]).nullish()
    }).optional()).query(async ({ input }) => {
      const db2 = await getDb();
      const dishesTable = dishes;
      const conditions = [eq76(dishesTable.isActive, true)];
      if (input?.search) conditions.push(like11(dishesTable.name, `%${input.search}%`));
      if (input?.category && input.category !== "all") {
        const catId = safeInteger(input.category, Number.NaN);
        if (Number.isFinite(catId)) conditions.push(eq76(dishesTable.categoryId, catId));
      }
      const rows = await db2.select().from(dishesTable).where(and33(...conditions)).orderBy(asc22(dishesTable.displayOrder));
      return rows.map(normalizeDish2).filter(Boolean);
    })
  }),
  getStoreSettings: publicProcedure.query(async () => {
    return await fetchAllStoreSettings();
  }),
  getPublicSettings: publicProcedure.query(async () => {
    return await fetchAllStoreSettings();
  }),
  /**
   * 🖼️ BUSCA DE VITRINES (Showcases) - Dinâmico
   * ✅ Resolvido: Agora filtra os pratos reais salvos no banco.
   */
  getShowcases: publicProcedure.query(async () => {
    const db2 = await getDb();
    const activeShowcases = await db2.select().from(showcases).where(eq76(showcases.active, true)).orderBy(asc22(showcases.order));
    if (activeShowcases.length === 0) return [];
    const activeDishesRows = await db2.select().from(dishes).where(eq76(dishes.isActive, true)).orderBy(asc22(dishes.displayOrder));
    const normalizedDishes = activeDishesRows.map(normalizeDish2).filter(Boolean);
    return activeShowcases.map((sc) => {
      let dishIds = [];
      dishIds = safeJsonParse(sc.items || "[]", []).map((id) => safeInteger(id, Number.NaN)).filter(Number.isFinite);
      const filteredItems = normalizedDishes.filter(
        (dish) => dishIds.includes(dish.id)
      );
      return {
        id: sc.id,
        title: sc.title,
        items: filteredItems
      };
    });
  }),
  getCep: publicProcedure.input(z59.object({ cep: z59.string().min(8) })).query(async ({ input }) => {
    const cleanCep = input.cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return null;
    try {
      const { data } = await axios3.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { timeout: 4e3 });
      if (data.erro) return null;
      return { street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf };
    } catch {
      return null;
    }
  })
});

// server/routers/storefront/index.ts
var storefrontRouter = router({
  /**
   * ✅ CONFIGURAÇÕES PÚBLICAS (Analytics & SEO)
   * Permite que o AppInteligence busque o GAID sem autenticação.
   */
  settings: router({
    getPublicSettings: publicProcedure.query(async () => {
      const db2 = await getDb();
      if (!db2) return { googleAnalyticsId: null };
      const [config] = await db2.select().from(appConfigs).where(eq77(appConfigs.configKey, "google_analytics_id")).limit(1);
      return {
        googleAnalyticsId: config?.configValue || null
      };
    })
  }),
  /**
   * ✅ COMPATIBILIDADE DE VITRINES (Aliasing)
   * Injeta os procedimentos de publicRouter na raiz do Storefront.
   */
  ...publicRouter._def.procedures,
  /**
   * 🔓 NAMESPACE PÚBLICA
   */
  public: publicRouter,
  // 👤 AUTENTICAÇÃO E PERFIL
  auth: authRouter,
  profile: profileRouter,
  // 🥗 LOGÍSTICA E ENDEREÇOS
  addresses: addressesRouter,
  // 🛍️ FLUXO DE COMPRA (Cart, Checkout, Orders)
  cart: cartRouter,
  checkout: checkoutRouter,
  orders: ordersRouter,
  // 🍳 CATALOGO E PRODUTOS
  products: productsRouter,
  packages: packagesRouter,
  sizes: sizesRouter,
  // 🎫 BENEFÍCIOS (Cupons, Descontos, Fidelidade)
  coupons: couponsRouter,
  discounts: discountsRouter,
  loyalty: loyaltyRouter,
  // 🤖 SERVIÇOS ADICIONAIS
  nutri: nutriRouter,
  ai: aiRouter,
  support: supportRouter
});

// server/api/admin/bi-export.ts
import { z as z60 } from "zod";

// server/logic/bi-exporter.ts
init_db();
init_schema2();
import { and as and34, gte as gte6, lte as lte6, inArray as inArray13, asc as asc23 } from "drizzle-orm";
async function getHistoricalOrdersForBI(startDate, endDate) {
  const db2 = await getDb();
  try {
    const historicalOrders = await db2.select().from(orders).where(
      and34(
        gte6(orders.createdAt, new Date(startDate)),
        lte6(orders.createdAt, new Date(endDate)),
        inArray13(orders.status, ["completed", "delivered", "shipped"])
      )
    ).orderBy(asc23(orders.createdAt));
    if (historicalOrders.length === 0) return [];
    const orderIds = historicalOrders.map((o) => o.id);
    const items = await db2.select().from(orderItems).where(inArray13(orderItems.orderId, orderIds));
    return historicalOrders.map((order) => {
      const filteredItems = items.filter((i) => i.orderId === order.id);
      return {
        financial: {
          order_id: order.id,
          payment_method: order.paymentMethod,
          gross_total: order.subtotal,
          net_total: order.total,
          delivery_fee: order.shippingCost,
          discount_total: order.totalDiscount,
          created_at: order.createdAt,
          status: order.status
        },
        sales: filteredItems.map((item) => ({
          order_id: order.id,
          dish_id: item.dishId,
          dish_name: item.dishName ?? "Prato n\xE3o identificado",
          quantity: item.quantity,
          unit_price: item.unitPrice,
          created_at: order.createdAt
        }))
      };
    });
  } catch (error) {
    console.error("\u274C Erro na exporta\xE7\xE3o hist\xF3rica para BI:", error);
    throw new Error("Falha ao gerar dados para o BI.");
  }
}

// server/api/admin/bi-export.ts
var biExportRouter = router({
  run: adminProcedure.input(
    z60.object({
      start: z60.string(),
      end: z60.string()
    })
  ).query(async ({ input }) => {
    return getHistoricalOrdersForBI(input.start, input.end);
  })
});

// server/api/routers/dishes.ts
init_db();
init_schema();
import { and as and35, asc as asc24, eq as eq78, like as like12 } from "drizzle-orm";
import { z as z61 } from "zod";
var listInputSchema = z61.object({
  page: z61.number().default(1),
  perPage: z61.number().default(100),
  search: z61.string().nullish(),
  category: z61.union([z61.number(), z61.string()]).nullish()
}).optional();
async function getInventoryData() {
  const db2 = await getDb();
  const [allDishes, allAccompaniments] = await Promise.all([
    db2.query.dishes.findMany({
      with: {
        category: true,
        composition: {
          with: {
            ingredient: true,
            accompanimentOption: true
          }
        }
      },
      where: eq78(dishes.isActive, true)
    }),
    db2.query.accompanimentOptions.findMany({
      where: eq78(accompanimentOptions.isActive, true)
    })
  ]);
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    dishes: allDishes,
    accompaniments: allAccompaniments
  };
}
async function listPublicDishes(input) {
  const db2 = await getDb();
  const page = input?.page || 1;
  const perPage = input?.perPage || 100;
  const offset = (page - 1) * perPage;
  const conditions = [eq78(dishes.isActive, true)];
  if (input?.search) {
    conditions.push(like12(dishes.name, `%${input.search}%`));
  }
  if (input?.category && input.category !== "all") {
    const categoryId = Number(input.category);
    if (!Number.isNaN(categoryId)) {
      conditions.push(eq78(dishes.categoryId, categoryId));
    }
  }
  return db2.select().from(dishes).where(and35(...conditions)).orderBy(asc24(dishes.displayOrder)).limit(perPage).offset(offset);
}
var dishesRouter = router({
  list: publicProcedure.input(listInputSchema).query(async ({ input }) => {
    return listPublicDishes(input);
  }),
  getInventory: internalProcedure.query(async () => {
    return getInventoryData();
  })
});

// server/api/routers/integration.ts
init_schema();
import { asc as asc25, desc as desc31, eq as eq79, inArray as inArray14 } from "drizzle-orm";
var integrationRouter = router({
  /**
   * 1. INTELIGÊNCIA DE CLIENTES (CRM & LTV)
   * Agora restrito a colunas essenciais para evitar vazamento de dados sensíveis.
   */
  getCustomers: internalProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
        aiCredits: true,
        availablePoints: true,
        createdAt: true,
        name: true,
        // Descriptografado via fromDriver
        phone: true
      },
      with: {
        profile: {
          columns: { totalSpent: true }
        },
        orders: {
          columns: { total: true, status: true }
        }
      },
      limit: 1e3
    });
    return result.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      aiCredits: user.aiCredits,
      loyaltyPoints: user.availablePoints,
      totalSpent: user.profile?.totalSpent || "0.00",
      orderCount: user.orders.length,
      createdAt: user.createdAt
    }));
  }),
  /**
   * 2. CATÁLOGO E COMPOSIÇÃO TÉCNICA
   * Mantendo nomes canônicos do schema (camelCase) conforme sugestão do Codex.
   */
  getInventory: internalProcedure.query(async ({ ctx }) => {
    const [allDishes, allAccompaniments] = await Promise.all([
      ctx.db.query.dishes.findMany({
        columns: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
          energyKcal: true,
          proteins: true,
          carbs: true,
          fatTotal: true,
          sodium: true
        },
        with: {
          category: { columns: { name: true } },
          composition: {
            columns: { quantity: true, unit: true, ingredientName: true },
            with: { ingredient: { columns: { name: true } } }
          }
        },
        where: eq79(dishes.isActive, true),
        orderBy: [asc25(dishes.name)]
      }),
      ctx.db.query.accompanimentOptions.findMany({
        columns: {
          id: true,
          name: true,
          priceModifier: true,
          energyKcal: true,
          proteins: true,
          ingredients: true
        },
        where: eq79(accompanimentOptions.isActive, true)
      })
    ]);
    return { dishes: allDishes, accompaniments: allAccompaniments };
  }),
  /**
   * 3. PERFORMANCE DE VENDAS
   * Normalização de colunas para reduzir o payload do tráfego interno.
   */
  getSalesData: internalProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.orders.findMany({
      columns: {
        id: true,
        userId: true,
        status: true,
        subtotal: true,
        shippingCost: true,
        totalDiscount: true,
        total: true,
        referralCode: true,
        paymentMethod: true,
        shippingCity: true,
        shippingZipCode: true,
        createdAt: true
      },
      with: {
        items: {
          columns: {
            dishName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            options: true
            // Texto cru para parse no Python
          }
        }
      },
      where: inArray14(orders.paymentStatus, ["paid"]),
      orderBy: [desc31(orders.createdAt)],
      limit: 200
    });
    return result;
  }),
  /**
   * 4. LOGÍSTICA E GEOMESH
   * Sem aliases: fidelidade total ao schema Drizzle.
   */
  getShippingIntelligence: internalProcedure.query(async ({ ctx }) => {
    const [zones, mesh] = await Promise.all([
      ctx.db.query.shippingZones.findMany({
        where: eq79(shippingZones.isActive, true)
      }),
      ctx.db.query.geoMesh.findMany({
        columns: { zipCode: true, neighborhood: true, lat: true, lng: true },
        limit: 1e3
      })
    ]);
    return { shippingZones: zones, geoMesh: mesh };
  })
});

// server/api/root.ts
var appRouter = router({
  store: storefrontRouter,
  admin: router({
    ...adminRouter._def.record,
    biSync: biSyncRouter,
    biExport: biExportRouter
  }),
  adminTheme: adminThemeRouter,
  media: mediaRouter,
  public: storefrontRouter,
  auth: authRouter,
  addresses: addressesRouter,
  cart: cartRouter,
  checkout: checkoutRouter,
  orders: ordersRouter,
  nutri: nutriRouter,
  ai: aiRouter,
  loyalty: loyaltyRouter,
  products: productsRouter,
  profile: profileRouter,
  packages: packagesRouter,
  discounts: discountsRouter,
  ordersAdmin: ordersAdminRouter,
  usersAdmin: usersAdminRouter,
  shipping: adminRouter,
  settings: adminRouter,
  referral: adminRouter,
  integration: integrationRouter,
  dishes: dishesRouter
});

// server/_core/context.ts
init_db();
init_schema();
import { eq as eq80, and as and36, isNull as isNull5 } from "drizzle-orm";
async function createContext({ req, res }) {
  const db2 = await getDb();
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  const { session, user } = sessionId ? await lucia.validateSession(sessionId) : { session: null, user: null };
  const guestId = req.headers["x-guest-id"];
  const referralCode = req.headers["x-referral-code"] || req.headers["referral"];
  if (guestId) {
    try {
      await db2.insert(guests).values({
        id: guestId,
        referralCode: referralCode || null,
        lastActive: /* @__PURE__ */ new Date()
      }).onDuplicateKeyUpdate({
        set: {
          referralCode: referralCode || void 0,
          lastActive: /* @__PURE__ */ new Date()
        }
      });
      if (user) {
        promoteCart(guestId, user.id).catch((err) => {
          console.error("\u274C [Context] Erro ao promover carrinho:", err);
        });
        if (referralCode) {
          const cleanReferral = referralCode.toLowerCase().trim();
          await db2.update(users).set({ referralCode: cleanReferral }).where(
            and36(
              eq80(users.id, user.id),
              // Só vincula se o usuário ainda for um "órfão"
              isNull5(users.referralCode)
            )
          ).then((result) => {
            const parsedResult = result;
            const affected = parsedResult[0]?.affectedRows || 0;
            if (affected > 0) {
              console.log(`\x1B[32m%s\x1B[0m`, `\u2705 [Referral Success] Usu\xE1rio ${user.id} agora \xE9 indicado de: ${cleanReferral}`);
            }
          }).catch((err) => console.error("\u274C Erro ao vincular referral ao user:", err));
        }
      }
    } catch (err) {
      console.error("\u274C [DB ERROR] Falha ao sincronizar guest/referral:", err);
    }
  }
  try {
    if (session && session.fresh) {
      const newCookie = lucia.createSessionCookie(session.id);
      newCookie.attributes.maxAge = void 0;
      newCookie.attributes.expires = void 0;
      if (typeof res.appendHeader === "function") {
        res.appendHeader("Set-Cookie", newCookie.serialize());
      } else {
        res.append("Set-Cookie", newCookie.serialize());
      }
    } else if (!session && sessionId) {
      const blankCookie = lucia.createBlankSessionCookie();
      if (typeof res.appendHeader === "function") {
        res.appendHeader("Set-Cookie", blankCookie.serialize());
      } else {
        res.append("Set-Cookie", blankCookie.serialize());
      }
    }
  } catch (cookieErr) {
    console.error("\u26A0\uFE0F [Cookie] Erro ao manipular headers de sess\xE3o:", cookieErr);
  }
  return { req, res, user, session, guestId: guestId || null, db: db2 };
}

// server/_core/index.ts
import path4 from "path";
import fs3 from "fs";

// server/workers/nutriWorker.ts
import { Worker as Worker2 } from "bullmq";
init_db();
init_schema();
init_encryption();
import { eq as eq81 } from "drizzle-orm";
import crypto19 from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// server/workers/helpers/buildNutriAiCatalog.ts
function buildNutriAiCatalog(dbDishes, dishSizesRaw, allOptions) {
  return {
    dishes: dbDishes.map((dish) => {
      const rows = dishSizesRaw.filter((s) => String(s.dishId) === String(dish.id));
      const uniqueSizeIds = [...new Set(rows.map((r) => String(r.sizeId)))];
      const availableSizes = uniqueSizeIds.map((sizeId) => {
        const sizeRows = rows.filter((r) => String(r.sizeId) === sizeId);
        const sizeInfo = sizeRows[0];
        const uniqueGroupIds = [
          ...new Set(
            sizeRows.filter((r) => r.groupId != null).map((r) => String(r.groupId))
          )
        ];
        const accompanimentGroups2 = uniqueGroupIds.map((groupId) => {
          const groupRow = sizeRows.find((r) => String(r.groupId) === groupId);
          return {
            id: groupRow?.groupId,
            name: groupRow?.groupName || "Acompanhamentos",
            minSelections: safeNumber(groupRow?.minSelections),
            maxSelections: safeNumber(groupRow?.maxSelections, 1),
            isRequired: Boolean(groupRow?.isRequired || false),
            options: allOptions.filter((opt) => String(opt.groupId) === groupId).map((opt) => ({
              id: opt.id,
              name: opt.name,
              energyKcal: safeNumber(opt.energyKcal),
              proteins: safeNumber(opt.proteins),
              carbs: safeNumber(opt.carbs),
              fatTotal: safeNumber(opt.fatTotal),
              priceModifier: safeNumber(opt.priceModifier)
            }))
          };
        });
        return {
          id: sizeInfo.sizeId,
          name: sizeInfo.sizeName,
          weight: safeNumber(sizeInfo.weight),
          mainDishWeight: safeNumber(sizeInfo.mainDishWeight || sizeInfo.weight),
          price: safeNumber(sizeInfo.price),
          isDefault: Boolean(sizeInfo.isDefault || false),
          accompanimentGroups: accompanimentGroups2
        };
      });
      return {
        id: dish.id,
        name: dish.name,
        description: dish.description || "",
        energyKcal: safeNumber(dish.energyKcal),
        proteins: safeNumber(dish.proteins),
        carbs: safeNumber(dish.carbs),
        fatTotal: safeNumber(dish.fatTotal),
        availableSizes
      };
    })
  };
}

// server/workers/helpers/normalizeAiPrescriptionResult.ts
import crypto18 from "crypto";
function toStr(v) {
  return String(v ?? "");
}
function findDish(catalog, dishId) {
  return catalog.dishes.find((d) => toStr(d.id) === toStr(dishId));
}
function findDefaultSize(dish) {
  return dish.availableSizes.find((s) => s.isDefault) || dish.availableSizes[0];
}
function findSize(dish, sizeId) {
  return dish.availableSizes.find((s) => toStr(s.id) === toStr(sizeId)) || findDefaultSize(dish);
}
function normalizeSelectedAccs(size, selectedAccompaniments) {
  const inputAccs = Array.isArray(selectedAccompaniments) ? selectedAccompaniments : [];
  const normalized = [];
  const weight = safeNumber(size.mainDishWeight || size.weight);
  for (const group of size.accompanimentGroups || []) {
    const requestedForGroup = inputAccs.filter(
      (a) => toStr(a.groupId || a.categoryId) === toStr(group.id)
    );
    const validRequested = requestedForGroup.map((acc) => {
      const found = group.options.find((o) => toStr(o.id) === toStr(acc.optionId));
      if (!found) return null;
      return {
        groupId: group.id,
        optionId: found.id,
        name: found.name,
        extraPrice: safeNumber(found.priceModifier || acc.extraPrice)
      };
    }).filter((item) => item !== null);
    let effectiveMin = safeNumber(group.minSelections);
    let effectiveMax = safeNumber(group.maxSelections, 1);
    if (weight > 200) {
      effectiveMin = Math.max(effectiveMin, 2);
      effectiveMax = Math.max(effectiveMax, 2);
    }
    let finalGroupSelections = validRequested.slice(0, effectiveMax);
    if (finalGroupSelections.length < effectiveMin) {
      const missing = effectiveMin - finalGroupSelections.length;
      const existingIds = new Set(finalGroupSelections.map((x) => toStr(x.optionId)));
      const fallback = group.options.filter((o) => !existingIds.has(toStr(o.id))).slice(0, missing).map((o) => ({
        groupId: group.id,
        optionId: o.id,
        name: o.name,
        extraPrice: safeNumber(o.priceModifier)
      }));
      finalGroupSelections = [...finalGroupSelections, ...fallback].slice(0, effectiveMax);
    }
    normalized.push(...finalGroupSelections);
  }
  return normalized;
}
function normalizeOption(option, catalog) {
  const dish = findDish(catalog, option.dishId);
  if (!dish) return null;
  const size = findSize(dish, option.sizeId);
  if (!size) return null;
  const selectedAccs = normalizeSelectedAccs(size, option.selectedAccompaniments);
  const basePrice = safeNumber(size.price);
  const extrasPrice = selectedAccs.reduce((sum4, acc) => sum4 + acc.extraPrice, 0);
  const finalPrice = basePrice + extrasPrice;
  return {
    id: option.id || `opt-${crypto18.randomUUID?.() || Math.random().toString(36).slice(2)}`,
    dishId: dish.id,
    sizeId: size.id,
    name: dish.name,
    sizeName: size.name,
    priceAtCreation: finalPrice,
    selectedAccompaniments: selectedAccs,
    availableSizes: dish.availableSizes,
    nutritionalData: {
      mainDishWeight: safeNumber(size.mainDishWeight || size.weight),
      baseMacros: {
        kcal: safeNumber(dish.energyKcal),
        protein: safeNumber(dish.proteins),
        carbs: safeNumber(dish.carbs),
        fat: safeNumber(dish.fatTotal)
      }
    },
    macros: {
      kcal: safeNumber(dish.energyKcal),
      protein: safeNumber(dish.proteins),
      carbs: safeNumber(dish.carbs),
      fat: safeNumber(dish.fatTotal)
    }
  };
}
function normalizeAiPrescriptionResult(aiResult, catalog) {
  const meals = Array.isArray(aiResult) ? aiResult : [];
  return meals.map((meal, mealIndex) => {
    const rawGroups = Array.isArray(meal?.groups) ? meal.groups : [];
    const groups = rawGroups.map((group, groupIndex) => {
      const rawOptions = Array.isArray(group?.options) ? group.options : [];
      const options = rawOptions.map((opt) => normalizeOption(opt, catalog)).filter((opt) => opt !== null);
      if (!options.length) return null;
      return {
        id: String(group?.id || `group-${mealIndex + 1}-${groupIndex + 1}`),
        name: String(group?.name || "Escolhas da Dieta"),
        isRequired: Boolean(group?.isRequired ?? true),
        options
      };
    }).filter((g) => g !== null);
    if (!groups.length) return null;
    return {
      id: String(meal?.id || `meal-${mealIndex + 1}`),
      name: String(meal?.name || `Refei\xE7\xE3o ${mealIndex + 1}`),
      notes: String(meal?.notes || ""),
      groups
    };
  }).filter((m) => m !== null);
}

// server/routers/storefront/ai/prompts/nutriPrompt.ts
var generateNutriPrompt = (catalogJson, userContent, expertKnowledgeJson) => {
  return `
Voc\xEA \xE9 o Engenheiro de Dietas Senior da Gourmet Saud\xE1vel. Sua miss\xE3o \xE9 converter prescri\xE7\xF5es nutricionais em objetos JSON de configura\xE7\xE3o de pedido, garantindo variedade, precis\xE3o cl\xEDnica e respeito total \xE0 estrutura do cat\xE1logo.

--- \u{1F9E0} SUA MEM\xD3RIA T\xC9CNICA (CONHECIMENTO PR\xC9VIO) ---
Priorize estas associa\xE7\xF5es aprendidas com especialistas:
${expertKnowledgeJson || "Nenhum termo t\xE9cnico mapeado ainda. Use seu julgamento cl\xEDnico baseado no cat\xE1logo."}

--- \u{1F4DC} REGRAS DE OURO (TOLER\xC2NCIA ZERO) ---
1. FIDELIDADE ABSOLUTA AO CAT\xC1LOGO: Use APENAS "dishId", "sizeId", "groupId" e "optionId" existentes no CAT\xC1LOGO abaixo. NUNCA invente IDs ou ingredientes.
2. TRAVA DE TAMANHOS: Selecione obrigatoriamente um "sizeId" que perten\xE7a \xE0 lista de tamanhos do prato escolhido no cat\xE1logo.
3. TRAVA DE ACOMPANHAMENTOS: Selecione acompanhamentos ("optionId") APENAS se estiverem nos grupos ("groupId") permitidos para o prato e tamanho selecionados.
4. ATEN\xC7\xC3O \xC0S REFEI\xC7\xD5ES: Se o usu\xE1rio pedir m\xFAltiplas refei\xE7\xF5es (ex: "Almo\xE7o e Jantar"), gere um objeto separado para CADA refei\xE7\xE3o no array principal.

5. \u2705 VARIEDADE OBRIGAT\xD3RIA (6 A 8 OP\xC7\xD5ES POR REFEI\xC7\xC3O): 
   Para CADA refei\xE7\xE3o criada, voc\xEA DEVE gerar entre 6 e 8 op\xE7\xF5es de pratos diferentes no array "options". 
   - Explore o cat\xE1logo para oferecer prote\xEDnas variadas (Carne, Frango, Peixe e Veggie).
   - N\xE3o repita o mesmo prato com tamanhos diferentes; cada uma das 6-8 op\xE7\xF5es deve ser um prato (dishId) diferente, se o cat\xE1logo permitir.

6. REGRA DE GRAMATURA (>200g): Se o tamanho escolhido for MAIOR que 200g, voc\xEA DEVE selecionar no m\xEDnimo 2 acompanhamentos diferentes (respeitando as regras de grupo do prato).
7. JUSTIFICATIVA CL\xCDNICA: No campo "notes", explique tecnicamente por que esse conjunto diversificado de op\xE7\xF5es atende \xE0 prescri\xE7\xE3o.
8. FORMATO ESTRITO: Sa\xEDda em JSON PURO. Proibido Markdown ou textos explicativos fora do JSON. Comece com [ e termine com ].

--- \u{1F4E4} FORMATO DE SA\xCDDA (EXEMPLO PARA 1 REFEI\xC7\xC3O) ---
[
  {
    "id": "uuid-v4",
    "name": "Almo\xE7o",
    "notes": "Explica\xE7\xE3o t\xE9cnica aqui...",
    "groups": [
      {
        "id": "uuid-v4",
        "name": "Escolhas Sugeridas",
        "options": [
          { "id": "uuid-1", "dishId": 10, "sizeId": 100, "name": "Prato 1", "priceAtCreation": 0, "selectedAccompaniments": [...] },
          { "id": "uuid-2", "dishId": 11, "sizeId": 101, "name": "Prato 2", "priceAtCreation": 0, "selectedAccompaniments": [...] },
          { "id": "uuid-3", "dishId": 12, "sizeId": 102, "name": "Prato 3", "priceAtCreation": 0, "selectedAccompaniments": [...] },
          { "id": "uuid-4", "dishId": 13, "sizeId": 103, "name": "Prato 4", "priceAtCreation": 0, "selectedAccompaniments": [...] },
          { "id": "uuid-5", "dishId": 14, "sizeId": 104, "name": "Prato 5", "priceAtCreation": 0, "selectedAccompaniments": [...] },
          { "id": "uuid-6", "dishId": 15, "sizeId": 105, "name": "Prato 6", "priceAtCreation": 0, "selectedAccompaniments": [...] }
        ]
      }
    ]
  }
]

--- \u{1F4E6} CAT\xC1LOGO T\xC9CNICO ---
${catalogJson}

--- \u{1F4DD} CONTE\xDADO PARA PROCESSAR ---
${userContent}
`;
};

// server/workers/nutriWorker.ts
var redisUrl4 = process.env.REDIS_URL;
var redisConfig2 = redisUrl4 ? {
  url: redisUrl4,
  maxRetriesPerRequest: null
} : {
  host: process.env.REDIS_HOST || "localhost",
  port: safeNumber(process.env.REDIS_PORT, 6379),
  maxRetriesPerRequest: null
};
var nutriWorker = new Worker2(
  NUTRI_QUEUE_NAME,
  async (job) => {
    const { scanId, rawText } = job.data;
    const runId = crypto19.randomUUID();
    const startTime = Date.now();
    console.log(`
[DEBUG] \u{1F680} --- IN\xCDCIO DO JOB ---`);
    console.log(`[DEBUG] \u{1F194} Scan ID: ${scanId}`);
    try {
      const db2 = await getDb();
      if (!db2) throw new Error("Database connection failed");
      const setting = await db2.select().from(appConfigs).where(eq81(appConfigs.configKey, "gemini_api_key")).limit(1);
      let activeApiKey = process.env.GEMINI_API_KEY;
      if (setting[0]?.configValue) {
        const decryptedKey = decrypt(setting[0].configValue);
        activeApiKey = decryptedKey || setting[0].configValue;
      }
      if (!activeApiKey) throw new Error("API Key n\xE3o encontrada");
      console.log(`[DEBUG] \u{1F50D} Verificando acesso aos modelos do Google...`);
      try {
        const checkResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${activeApiKey}`
        );
        const checkData = await checkResponse.json();
        if (checkData.models) {
          const availableModels = checkData.models.map((m) => m.name.replace("models/", "")).join(", ");
          console.log(`[DEBUG] \u{1F4CB} Modelos liberados para esta chave:`);
          console.log(availableModels);
        } else {
          console.log(`[DEBUG] \u26A0\uFE0F Erro ao listar modelos:`, checkData);
        }
      } catch (checkErr) {
        const message = checkErr instanceof Error ? checkErr.message : "Erro desconhecido";
        console.log(`[DEBUG] \u26A0\uFE0F Falha na requisi\xE7\xE3o de debug:`, message);
      }
      console.log(`[DEBUG] \u{1F4E6} Coletando dados do cat\xE1logo...`);
      const dbDishes = await db2.select().from(dishes).where(eq81(dishes.isActive, true));
      const dishSizesRaw = await db2.select({
        dishId: dishesToSizes.dishId,
        sizeId: dishSizes.id,
        sizeName: dishSizes.name,
        weight: dishSizes.weight,
        mainDishWeight: dishSizes.mainDishWeight,
        price: dishSizes.price,
        groupId: accompanimentGroups.id,
        groupName: accompanimentGroups.name,
        minSelections: sizeAccompanimentGroups.minSelections,
        maxSelections: sizeAccompanimentGroups.maxSelections
      }).from(dishesToSizes).innerJoin(dishSizes, eq81(dishesToSizes.sizeId, dishSizes.id)).leftJoin(
        sizeAccompanimentGroups,
        eq81(dishSizes.id, sizeAccompanimentGroups.sizeId)
      ).leftJoin(
        accompanimentGroups,
        eq81(
          sizeAccompanimentGroups.accompanimentGroupId,
          accompanimentGroups.id
        )
      ).where(eq81(dishSizes.isActive, true));
      const allOptions = await db2.select({
        id: accompanimentOptions.id,
        groupId: groupToOptions.groupId,
        name: accompanimentOptions.name,
        energyKcal: accompanimentOptions.energyKcal,
        proteins: accompanimentOptions.proteins,
        carbs: accompanimentOptions.carbs,
        fatTotal: accompanimentOptions.fatTotal,
        priceModifier: accompanimentOptions.priceModifier
      }).from(accompanimentOptions).innerJoin(
        groupToOptions,
        eq81(accompanimentOptions.id, groupToOptions.optionId)
      ).where(eq81(accompanimentOptions.isActive, true));
      console.log(`[DEBUG] \u{1F9E0} Coletando termos aprendidos...`);
      const learnedTermsRaw = await db2.select().from(aiExpertTerms).where(eq81(aiExpertTerms.isActive, true));
      const learnedTerms = learnedTermsRaw.map((t2) => ({
        term: t2.term || "",
        targetId: t2.targetId || "",
        type: t2.targetType || "UNKNOWN",
        synonyms: t2.synonyms || []
      }));
      const expertKnowledgeJson = JSON.stringify(learnedTerms);
      const catalogTree = buildNutriAiCatalog(
        dbDishes,
        dishSizesRaw,
        allOptions
      );
      const catalogJson = JSON.stringify(catalogTree.dishes || []);
      const genAI = new GoogleGenerativeAI(activeApiKey);
      const modelName = "gemini-2.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = generateNutriPrompt(
        catalogJson,
        sanitizeTextForStorage(rawText),
        expertKnowledgeJson
      );
      console.log(
        `[DEBUG] \u{1F916} Chamando Gemini com o modelo: ${modelName}...`
      );
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();
      const cleanJson = sanitizeTextForStorage(
        aiText.replace(/```json|```/g, "").trim(),
        12e3
      );
      const rawAiData = safeJsonParse(cleanJson, {});
      console.log(`[DEBUG] \u{1F6E1}\uFE0F Normalizando dados...`);
      const suggestedData = ensureSafeAiResult(
        normalizeAiPrescriptionResult(
          rawAiData,
          catalogTree
        )
      );
      const latency = Date.now() - startTime;
      await db2.insert(agentRuns).values({
        id: runId,
        scanId,
        domain: "nutrition",
        model: modelName,
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        latencyMs: latency,
        rawOutput: sanitizeTextForStorage(aiText, 4e3),
        status: "success"
      });
      await db2.update(nutriScansTemp).set({
        suggestedData: suggestedData || {},
        status: "completed"
      }).where(eq81(nutriScansTemp.id, scanId));
      console.log(`[DEBUG] \u2705 Finalizado: ${scanId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      console.error(`
[DEBUG] \u274C FALHA NO JOB:`, errorMessage);
      const db2 = await getDb();
      if (db2 && scanId) {
        await db2.update(nutriScansTemp).set({ status: "failed" }).where(eq81(nutriScansTemp.id, scanId));
        await db2.insert(agentRuns).values({
          id: runId,
          scanId,
          status: "failed",
          errorMessage
        }).catch(() => {
        });
      }
      throw err;
    }
  },
  { connection: redisConfig2, concurrency: 1 }
);
nutriWorker.on("error", (err) => {
  console.warn(`[Nutri Worker] Erro Redis: ${err.message}`);
});

// server/_core/security-middleware.ts
var CSRF_TTL_SECONDS = 24 * 60 * 60;
function setupSecurityHeaders(app2) {
  app2.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    if (process.env.NODE_ENV === "development") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; connect-src * ws: wss:; worker-src * blob:;"
      );
    } else {
      const productionCSP = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' 
          https://www.googletagmanager.com 
          https://www.google-analytics.com 
          https://cdn.onesignal.com 
          https://api.onesignal.com 
          https://*.onesignal.com 
          https://www.google.com 
          blob:;
        style-src 'self' 'unsafe-inline' 
          https://fonts.googleapis.com 
          https://fonts.cdnfonts.com;
        font-src 'self' data: 
          https://fonts.gstatic.com 
          https://fonts.googleapis.com 
          https://fonts.cdnfonts.com;
        img-src 'self' data: https: http://localhost:3001;
        connect-src 'self' https: wss: 
          https://www.google-analytics.com 
          https://analytics.google.com
          https://stats.g.doubleclick.net
          https://api.onesignal.com 
          https://*.onesignal.com;
        worker-src 'self' blob:;
        frame-ancestors 'self';
        base-uri 'self';
        form-action 'self';
      `.replace(/\s+/g, " ").trim();
      res.setHeader("Content-Security-Policy", productionCSP);
    }
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=()"
    );
    next();
  });
}
function setupSecurityLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const clientIp = getClientIp2(req);
      if (res.statusCode >= 500) {
        logger.error(
          { method: req.method, path: req.path, status: res.statusCode, ip: clientIp, durationMs: duration },
          "[SECURITY] Erro de servidor detectado"
        );
        return;
      }
      if (isLocalRequest2(req)) return;
      const isSecurityRelevant = res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429;
      if (isSecurityRelevant) {
        logger.warn(
          { method: req.method, path: req.path, status: res.statusCode, ip: clientIp, durationMs: duration },
          "[SECURITY] Requisicao bloqueada"
        );
      }
    });
    next();
  });
}
function getClientIp2(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "unknown";
  return rawIp.startsWith("::ffff:") ? rawIp.replace("::ffff:", "") : rawIp;
}
function isLocalRequest2(req) {
  const clientIp = getClientIp2(req);
  return clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost";
}

// server/_core/maintenance-middleware.ts
import path3 from "path";
var ALLOWED_IPS = /* @__PURE__ */ new Set([
  "127.0.0.1",
  "::1",
  ...process.env.MAINTENANCE_ALLOWED_IPS?.split(",").map((s) => s.trim()) ?? []
]);
var BYPASS_PATHS = ["/trpc/public.health", "/uploads/"];
var cachedMaintenanceState = null;
var lastChecked = 0;
var CACHE_TTL_MS = 1e4;
async function isMaintenanceActive() {
  if (process.env.MAINTENANCE_MODE === "true") return true;
  const now = Date.now();
  if (cachedMaintenanceState !== null && now - lastChecked < CACHE_TTL_MS) {
    return cachedMaintenanceState;
  }
  try {
    const val = await redisConnection.get("maintenance:active");
    cachedMaintenanceState = val === "1" || val === "true";
    lastChecked = now;
    return cachedMaintenanceState;
  } catch {
    return false;
  }
}
function setupMaintenanceMode(app2, distPath2) {
  app2.use(async (req, res, next) => {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
    if (ALLOWED_IPS.has(clientIp)) return next();
    if (BYPASS_PATHS.some((p) => req.path.startsWith(p))) return next();
    const active = await isMaintenanceActive();
    if (!active) return next();
    logger.info({ path: req.path, ip: clientIp }, "[MAINTENANCE] Requisi\xE7\xE3o bloqueada \u2014 modo manuten\xE7\xE3o ativo");
    if (req.path.startsWith("/trpc") || req.headers.accept?.includes("application/json")) {
      return res.status(503).json({
        error: "SERVICE_UNAVAILABLE",
        message: "Sistema em manuten\xE7\xE3o. Tente novamente em alguns minutos."
      });
    }
    const maintenancePage = path3.join(distPath2, "maintenance.html");
    return res.status(503).sendFile(maintenancePage, (err) => {
      if (err) {
        res.status(503).send("<h1>Em manuten\xE7\xE3o. Volte em breve!</h1>");
      }
    });
  });
}

// server/_core/index.ts
var app = express();
app.set("trust proxy", 1);
logger.info(`\u{1F680} Iniciando servidor em: ${(/* @__PURE__ */ new Date()).toLocaleString()}`);
logger.debug({ cwd: process.cwd() }, "Informa\xE7\xF5es do ambiente de execu\xE7\xE3o");
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: false,
    // já gerenciado pelo setupSecurityHeaders abaixo
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
setupSecurityHeaders(app);
setupSecurityLogging(app);
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://gourmetsaudavel.com",
      "https://www.gourmetsaudavel.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-guest-id",
      "x-referral-code"
    ]
  })
);
app.use(globalLimiter);
app.use("/trpc/auth", authLimiter);
app.use("/trpc/checkout", checkoutLimiter);
var UPLOADS_PATH = path4.join(process.cwd(), "public", "uploads");
if (!fs3.existsSync(UPLOADS_PATH)) {
  fs3.mkdirSync(UPLOADS_PATH, { recursive: true });
  logger.info({ path: UPLOADS_PATH }, "Pasta de uploads criada com sucesso");
}
app.use("/uploads", express.static(UPLOADS_PATH));
app.get("/api/admin/backups/:filename", handleAdminBackupDownload);
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: (opts) => {
      const gId = opts.req.headers["x-guest-id"];
      const rRef = opts.req.headers["x-referral-code"];
      if (gId || rRef) {
        logger.debug({ guestId: gId, referral: rRef }, "Headers de auditoria capturados");
      }
      logger.info(
        {
          method: opts.req.method,
          path: opts.req.path,
          ip: opts.req.ip
        },
        "[tRPC Call]"
      );
      return createContext(opts);
    },
    onError: ({ path: path5, error }) => {
      logger.error(
        {
          path: path5,
          message: error.message,
          code: error.code
        },
        `\u274C Erro na execu\xE7\xE3o do tRPC`
      );
    }
  })
);
var distPath = path4.join(process.cwd(), "dist", "public");
if (fs3.existsSync(distPath)) {
  logger.info({ staticPath: distPath }, "Servindo Frontend est\xE1tico");
  setupMaintenanceMode(app, distPath);
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/trpc") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path4.join(distPath, "index.html"));
  });
} else {
  logger.warn("Modo Desenvolvimento: Pasta 'dist' n\xE3o encontrada. Frontend n\xE3o ser\xE1 servido pelo Node.");
  app.get("/", (req, res) => {
    res.send("Backend Online - Rodando em modo de desenvolvimento.");
  });
}
var PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`\u2705 [READY] Servidor rodando na porta ${PORT}`);
  logger.info(`\u{1F517} Endpoint: http://localhost:${PORT}/trpc`);
  logger.info(`\u{1F9E0} [AI AGENT] Worker de Nutri\xE7\xE3o ativo e aguardando tarefas...`);
});
