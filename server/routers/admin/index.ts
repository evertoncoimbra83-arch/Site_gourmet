// server/routers/admin/index.ts
import { router, adminProcedure } from "../../_core/trpc.js"; 
import { z } from "zod";

// IMPORTAÇÕES DE ROTAS EXISTENTES
import { adminAnalyticsRouter } from "./analytics.js";
import { adminLogsRouter } from "./logs.js";
import { healthRouter } from "./health.js";
import { securityRouter } from "./security.js";
import { adminNutriRouter } from "./nutri/nutri.js"; 
import { adminMediaRouter } from "./media.js"; 
import { adminMarketingRouter } from "./marketing.js"; 
import { adminLoyaltySettingsRouter } from "./loyalty.js";
import { adminCouponsRouter } from "./coupons.js";
import { adminDiscountRulesRouter } from "./discount-rules.js";
import { loyaltyAdminRouter } from "./automation.routes.js"; 
import { mailAdminRouter } from "./mail.js"; 
import { adminReferralRouter } from "./referral.js"; 
import { adminFinanceRouter } from "./finance.js";
import { adminPaymentMethodsRouter } from "./payment-methods.js"; 
import { ingredientsRouter } from "./ingredients.js";
import { dishCompositionRouter } from "./dishComposition.js";
import { adminDishesRouter } from "./dishes.js";
import { adminCategoriesRouter } from "./categories.js";
import { adminReviewsRouter } from "./reviews.js";
import { adminSizesRouter } from "./sizes.js"; 
import { adminGroupsRouter } from "./groups.js";
import { adminOptionsRouter } from "./accompaniments/options.js";
import { accompanimentCategoriesRouter } from "./accompaniments/categories.js";
import { adminPackagesRouter } from "./packages.js"; 
import { adminShowcaseRouter } from "./showcase.js"; 
import { usersAdminRouter } from "./users.js"; 
import { adminLabelsRouter } from "./labels.js"; 
import { adminStoreSettingsRouter } from "./adminStoreSettingsRouter.js"; 
import { ordersAdminRouter } from "./orders/ordersAdminRouter.js";
import { shippingRulesRouter } from "./shipping/shippingRules.js";
import { shippingMeshRouter } from "./shipping/shippingMesh.js";
import { adminApiRouter } from "./api.js";
import { backupsAdminRouter } from "./backups.js";
import { ga4AnalyticsRouter } from "./ga4Analytics.js";

// IMPORTAÇÃO DA NOVA LÓGICA DE BI
import { syncHistoricalData } from "../../api/admin/bi-sync.js";

/**
 * 👑 AGREGADOR DE ADMIN
 * Revisado para compatibilidade total e suporte ao Painel de BI
 */
export const adminRouter = router({
  health: healthRouter, 
  security: securityRouter,
  backups: backupsAdminRouter,
  ga4: ga4AnalyticsRouter,

  // ✅ BI & DATA SYNC
  // Resolve o "Property syncBI does not exist" e prepara o terreno para o Dashboard
  syncBI: adminProcedure
    .input(z.object({
      ids: z.array(z.string()).optional(), 
      start: z.string(),                   
      end: z.string(),                     
    }))
    .mutation(async ({ input }) => {
      // Sincroniza dados históricos para as tabelas bi_facts
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
  paymentMethods: adminPaymentMethodsRouter, 

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
    options: adminOptionsRouter,
  }),

  // 📦 COMERCIAL & EXPEDIÇÃO
  packages: adminPackagesRouter,
  showcase: adminShowcaseRouter, 
  showcases: adminShowcaseRouter, 
  labels: adminLabelsRouter, 

  // 🚚 LOGÍSTICA & FRETE
  shipping: router({ 
    rules: shippingRulesRouter,
    mesh: shippingMeshRouter,
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
  api: adminApiRouter,
});

export type AdminRouter = typeof adminRouter;