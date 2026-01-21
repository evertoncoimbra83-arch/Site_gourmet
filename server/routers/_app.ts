import { router } from "./../_core/trpc.js";
import { adminRouter } from "./admin/index.js";

// Importações dos roteadores do cliente
import { cartRouter } from "./storefront/cart/index.js";
import { authRouter } from "./storefront/auth.js";
import { publicRouter } from "./storefront/public.js";
import { storeRouter } from "./storefront/store.js";
import { addressesRouter } from "./storefront/addresses.js";
import { paymentMethodsRouter } from "./storefront/paymentMethods.js";
import { productsRouter } from "./storefront/products.js";
import { ordersRouter } from "./storefront/orders.js";
import { profileRouter } from "./storefront/profile.js";
import { packagesRouter } from "./storefront/packages.js";
import { discountsRouter } from "./storefront/discounts.js";
import { loyaltyRouter } from "./storefront/loyalty.js";
import { checkoutRouter } from "./storefront/checkout/index.js"; 
import { cartItemsRouter } from "./storefront/cart/items.js"; 

/**
 * 🚀 ROOT ROUTER (Mestre)
 * Este é o ponto de entrada de todas as chamadas tRPC do seu sistema.
 */
export const appRouter = router({
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
  loyalty: loyaltyRouter,
});

export type AppRouter = typeof appRouter;