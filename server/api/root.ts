//server/api/root.ts
import { router } from "../_core/trpc.js";

import { adminRouter } from "../routers/admin/index.js";
import { adminThemeRouter } from "../routers/admin/theme.js";
import { ordersAdminRouter } from "../routers/admin/orders/ordersAdminRouter.js";
import { usersAdminRouter } from "../routers/admin/users.js";
import { mediaRouter } from "../routers/media.js";
import { storefrontRouter } from "../routers/storefront/index.js";
import { addressesRouter } from "../routers/storefront/addresses.js";
import { aiRouter } from "../routers/storefront/ai/aiRouter.js";
import { authRouter } from "../routers/storefront/auth/index.js";
import { cartRouter } from "../routers/storefront/cart/index.js";
import { checkoutRouter } from "../routers/storefront/checkout/index.js";
import { discountsRouter } from "../routers/storefront/discounts.js";
import { loyaltyRouter } from "../routers/storefront/loyalty.js";
import { nutriRouter } from "../routers/storefront/nutri/index.js";
import { ordersRouter } from "../routers/storefront/orders.js";
import { packagesRouter } from "../routers/storefront/packages.js";
import { productsRouter } from "../routers/storefront/products.js";
import { profileRouter } from "../routers/storefront/profile.js";
import { storefrontAnnouncementsRouter } from "../routers/storefront/announcements.js";
import { adminBirthdaysRouter } from "../routers/admin/birthdays.js";

import { biExportRouter } from "./admin/bi-export.js";
import { biSyncRouter } from "./admin/bi-sync.js";
import { dishesRouter } from "./routers/dishes.js";
import { integrationRouter } from "./routers/integration.js";

export const appRouter = router({
  store: storefrontRouter,
  admin: router({
    ...adminRouter._def.record,
    biSync: biSyncRouter,
    biExport: biExportRouter,
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
  announcements: storefrontAnnouncementsRouter,
  birthdays: adminBirthdaysRouter,

  ordersAdmin: ordersAdminRouter,
  usersAdmin: usersAdminRouter,
  shipping: adminRouter,
  settings: adminRouter,
  referral: adminRouter,

  integration: integrationRouter,
  dishes: dishesRouter,
});

export type AppRouter = typeof appRouter;
