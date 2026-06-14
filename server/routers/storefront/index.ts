import { router, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { appConfigs } from "../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";

import { authRouter } from "./auth/index.js"; 
import { profileRouter } from "./profile.js";
import { nutriRouter } from "./nutri/index.js";
import { aiRouter } from "./ai/aiRouter.js"; 
import { supportRouter } from "./support/supportRouter.js";
import { addressesRouter } from "./addresses.js"; 
import { cartRouter } from "./cart/index.js";
import { checkoutRouter } from "./checkout/index.js";
import { ordersRouter } from "./orders.js";
import { productsRouter } from "./products.js";
import { packagesRouter } from "./packages.js";
import { sizesRouter } from "./sizes.js";
import { couponsRouter } from "./coupons.js";
import { discountsRouter } from "./discounts.js";
import { loyaltyRouter } from "./loyalty.js";
import { storefrontAnnouncementsRouter } from "./announcements.js";

import { publicRouter } from "./public.js";

/**
 * 🛒 ROTEADOR AGREGADOR DO STOREFRONT
 * Revisado para compatibilidade total com o Frontend da Gourmet Saudável
 */
export const storefrontRouter = router({
  /**
   * ✅ CONFIGURAÇÕES PÚBLICAS (Analytics & SEO)
   * Permite que o AppInteligence busque o GAID sem autenticação.
   */
  settings: router({
    getPublicSettings: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { googleAnalyticsId: null };

      const [config] = await db.select()
        .from(appConfigs)
        .where(eq(appConfigs.configKey, 'google_analytics_id'))
        .limit(1);

      return {
        googleAnalyticsId: config?.configValue || null,
      };
    }),
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
  announcements: storefrontAnnouncementsRouter,

  // 🤖 SERVIÇOS ADICIONAIS
  nutri: nutriRouter, 
  ai: aiRouter, 
  support: supportRouter,
});

export type StorefrontRouter = typeof storefrontRouter;
