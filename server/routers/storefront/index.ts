import { router } from "../../_core/trpc.js";

/**
 * 🏠 AGREGADOR DO STOREFRONT (Área do Cliente)
 * Este arquivo organiza as rotas que o site do cliente consome.
 */

import { authRouter } from "./auth.js"; 
import { cartRouter } from "./cart/index.js";
import { couponsRouter } from "./coupons.js"; 
import { discountsRouter } from "./discounts.js"; 
import { loyaltyRouter } from "./loyalty.js"; 
import { ordersRouter } from "./orders.js"; 
import { packagesRouter } from "./packages.js";
import { paymentMethodsRouter } from "./paymentMethods.js"; 
import { productsRouter } from "./products.js"; 
import { profileRouter } from "./profile.js";
import { publicRouter } from "./public.js"; 
import { storeRouter } from "./store.js"; 
import { sizesRouter } from "./sizes.js";

export const storefrontRouter = router({
  // 🔐 Identidade e Acesso
  // trpc.auth | trpc.profile
  auth: authRouter,
  profile: profileRouter,

  // 🛒 Fluxo de Compra
  // trpc.cart
  cart: cartRouter,

  // 🌍 Configurações Globais e Institucional
  // trpc.public (Limpas de 'dishes' para evitar Duplicate Key)
  // trpc.store (Temas e Banners)
  public: publicRouter, 
  store: storeRouter,

  // 🍽️ Catálogo de Produtos e Categorias
  // ✅ CORREÇÃO: Usamos 'products' para resolver o 404 de "products.categories"
  // ✅ IMPORTANTE: Certifique-se que o arquivo public.js NÃO possui a chave 'dishes'
  products: productsRouter, 

  // 📦 Personalização e Kits
  packages: packagesRouter,
  sizes: sizesRouter,

  // 📍 Marketing e Retenção
  coupons: couponsRouter,
  discounts: discountsRouter,
  loyalty: loyaltyRouter,

  // 💳 Pós-Venda
  orders: ordersRouter,
  paymentMethods: paymentMethodsRouter,
});