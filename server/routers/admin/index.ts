import { router } from "../../_core/trpc.js";

/**
 * 1. IMPORTAÇÃO DOS ROTEADORES ADMIN
 */
import { adminAnalyticsRouter } from "./analytics.js";
import { adminSizesRouter } from "./sizes.js";
import { adminLogsRouter } from "./logs.js";
import { adminMediaRouter } from "./media.js"; 
import { adminDiscountRulesRouter } from "./discount-rules.js";
import { adminLoyaltySettingsRouter } from "./loyalty.js";
import { adminMarketingRouter } from "./marketing.js";
import { adminFinanceRouter } from "./finance.js";
import { adminCategoriesRouter } from "./categories.js";
import { adminNutritionRouter } from "./nutrition.js";
import { adminAccompanimentsRouter,  } from "./accompaniments.js";
import { adminPackagesRouter } from "./packages.js"; 
import { adminCouponsRouter } from "./coupons.js";
import { adminPaymentMethodsRouter } from "./payment-methods.js";
import { adminDishesRouter } from "./dishes.js";
import { usersAdminRouter } from "./users.js";
import { ordersAdminRouter } from "./orders.js"; // Este é o que revisamos com o JOIN e o safeDecrypt
import { adminSettingsRouter } from "./settings.js"; 
import { adminShippingRouter } from "./shipping.js";
import { adminShowcaseRouter } from "./showcase.js";
import { loyaltyAdminRouter } from "./automation.routes.js"; 
import { mailAdminRouter } from "./mail.js"; 

/**
 * 👑 AGREGADOR DE ADMIN
 * Define a estrutura de chamadas para trpc.admin.[chave]
 */
export const adminRouter = router({
  analytics: adminAnalyticsRouter,
  logs: adminLogsRouter,
  media: adminMediaRouter,
  marketing: adminMarketingRouter, 
  loyaltySettings: adminLoyaltySettingsRouter,
  coupons: adminCouponsRouter,
  discountRules: adminDiscountRulesRouter,
  finance: adminFinanceRouter,
  paymentMethods: adminPaymentMethodsRouter, 
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
  orders: ordersAdminRouter, // ✅ Aqui o trpc vincula toda a lógica de pedidos

  /**
   * ✅ ROTA DE COMUNICAÇÃO (E-MAIL)
   */
  mail: mailAdminRouter, 

  // Configurações Globais
  settings: adminSettingsRouter,
  storeSettings: adminSettingsRouter, 
  shipping: adminShippingRouter,
  
  // ❌ REMOVIDO: userName: safeDecrypt(...) 
  // Essa linha causaria erro de compilação aqui. 
  // A descriptografia deve ser feita dentro do ordersAdminRouter.
});