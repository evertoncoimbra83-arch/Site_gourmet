
// client/src/app/logic/routesConfig.tsx

import { lazy, LazyExoticComponent, ComponentType } from "react";
import type { AppRole } from "@shared/security/rbac";

/**
 * 1. TIPAGEM MELHORADA
 * ✅ Alterado ComponentType<unknown> para ComponentType<any> para evitar conflitos de props no lazy loading
 */
export type AllowedRoles = AppRole;

type LazyComponent = LazyExoticComponent<ComponentType<any>>;

interface RouteConfig {
  path: string;
  element: LazyComponent;
  protected?: boolean;
  role?: AllowedRoles | AllowedRoles[];
}

/**
 * ✅ ROTAS PÚBLICAS E ÁREA DO CLIENTE/PROFISSIONAL
 */
export const publicRoutes: RouteConfig[] = [
  { path: "/", element: lazy(() => import("../../pages/Home")) },
  { path: "/produtos", element: lazy(() => import("../../pages/Products")) },
  { path: "/pacotes", element: lazy(() => import("../../pages/Packages")) },
  { path: "/nutricionistas", element: lazy(() => import("../../pages/nutri/NutriPublicLanding")) },
  
  // ✅ PÁGINA EXPLICATIVA DO CLUBE (Alimentada pelo DB)
  { path: "/fidelidade", element: lazy(() => import("../../pages/loyalty/LoyaltyRulesPage")) },

  // ✅ CORREÇÃO: Import do Carrinho
  { path: "/carrinho", element: lazy(() => import("../../pages/CartPage")) },
  
  { path: "/finalizar-pedido", element: lazy(() => import("../../pages/Checkout")) },
  { path: "/sucesso", element: lazy(() => import("../../pages/SuccessPage")) },
  { path: "/perfil/*", element: lazy(() => import("../../pages/Profile")) },
  { path: "/privacidade", element: lazy(() => import("../../pages/PrivacyPolicy")) },
  { path: "/termos", element: lazy(() => import("../../pages/TermsOfUse")) },
  
  // ✅ CENTRAL DE INTELIGÊNCIA (DASHBOARD IA)
  { 
    path: "/cardapio-ia", 
    element: lazy(() => import("../../pages/AiDashboard")),
    protected: true,
    role: ["customer", "user"] 
  },

  // ✅ PÁGINA DE DIETA DO CLIENTE (Oficial - Nutricionista)
  { 
    path: "/meu-plano", 
    element: lazy(() => import("../../pages/MyPrescription")),
    protected: true,
    role: ["customer", "user"] 
  },

  // ✅ SISTEMA DE INDICAÇÃO (Convite)
  { path: "/convite/:referralCode", element: lazy(() => import("../../pages/InviteAccept")) },

  // --- Cadastro de Nutricionistas (Público) ---
  { path: "/nutri/cadastro", element: lazy(() => import("../../pages/nutri/NutriRegister")) },

  // --- Área do Nutricionista (Dashboard) ---
  { 
    path: "/nutri", 
    element: lazy(() => import("../../pages/nutri/NutriDashboardView")),
    protected: true,
    role: ["nutri", "admin"]
  },

  { 
    path: "/nutri/perfil", 
    element: lazy(() => import("../../pages/nutri/NutriProfile")),
    protected: true,
    role: "nutri" 
  },
  
  // Auth
  { path: "/primeiro-acesso", element: lazy(() => import("../../pages/auth/FirstAccess")) },
  { path: "/lembrar-senha", element: lazy(() => import("../../pages/auth/ForgotPasswordView")) },
  { path: "/nova-senha", element: lazy(() => import("../../pages/auth/ResetPasswordView")) },
];

/**
 * ✅ ROTAS ADMINISTRATIVAS
 */
export const adminRoutes: RouteConfig[] = [
  { path: "dashboard", element: lazy(() => import("../../pages/AdminDashboard")) },
  { path: "", element: lazy(() => import("../../pages/AdminDashboard")) },
  
  // Pedidos & PDV
  { path: "orders", element: lazy(() => import("../../pages/AdminOrders")) },
  { path: "orders/create", element: lazy(() => import("../../pages/adminOrders/view/AdminOrderCreate")) },
  { path: "orders/success", element: lazy(() => import("../../pages/adminOrders/view/AdminOrderSuccess")) },
  { path: "abandoned-carts", element: lazy(() => import("../../pages/AdminAbandonedCarts")) },
  { path: "pdv", element: lazy(() => import("../../pages/AdminPdv")) },
  { path: "pdv/comanda/:id", element: lazy(() => import("../../pages/AdminPdvComanda")) },
  { path: "pdv/relatorios", element: lazy(() => import("../../pages/AdminPdvRelatorios")) },
  
  // ✅ ETIQUETAS ZEBRA (Gourmet Saudável)
  // Rota do Editor Visual
  { path: "labels/editor", element: lazy(() => import("../../pages/AdminLabelEditor")) },
  { path: "labels/editor/production", element: lazy(() => import("../../pages/AdminLabelEditor")) },
  { path: "labels/editor/production/:orderId", element: lazy(() => import("../../pages/AdminLabelEditor")) },
  { path: "labels/editor/:id", element: lazy(() => import("../../pages/AdminLabelEditor")) },
  // ✅ BI & Analytics
  { path: "analytics", element: lazy(() => import("../../pages/AdminAnalytics")), role: "super_admin" },

  { 
    path: "orders/:id/print", 
    element: lazy(() => import("../../pages/adminOrders/components/orderDrawer/print/OrderPrintCenter")) 
  },

  // ✅ GESTÃO DE NUTRICIONISTAS (Admin)
  { 
    path: "nutris", 
    element: lazy(() => import("../../pages/AdminNutri")),
    role: ["super_admin", "admin"],
  },

  // Marketing - ✅ Suporte a Named Export
  { 
    path: "marketing", 
    element: lazy(() => import("../../pages/adminMarketing/view/AdminMarketingView").then(m => ({ default: m.AdminMarketingView }))),
    role: ["super_admin", "admin"],
  },  
  { path: "coupons", element: lazy(() => import("../../pages/AdminCoupons")), role: ["super_admin", "admin"] },
  { path: "offers", element: lazy(() => import("../../pages/AdminDiscountRules")), role: ["super_admin", "admin"] },
  { path: "loyalty", element: lazy(() => import("../../pages/AdminLoyalty")), role: ["super_admin", "admin"] },
  { path: "mail", element: lazy(() => import("../../pages/AdminMail")), role: ["super_admin", "admin"] },
  { path: "announcements", element: lazy(() => import("../../pages/AdminAnnouncements")), role: ["super_admin", "admin"] },

  // Catálogo
  { path: "dishes", element: lazy(() => import("../../pages/AdminDishes")), role: ["super_admin", "admin"] },
  { path: "packages", element: lazy(() => import("../../pages/adminPackages/view/AdminPackagesView")), role: ["super_admin", "admin"] }, 
  { path: "sizes-accompaniments", element: lazy(() => import("../../pages/AdminSizesAccompaniments")), role: ["super_admin", "admin"] },
  { path: "showcases", element: lazy(() => import("../../pages/AdminShowcases")), role: ["super_admin", "admin"] },

  // Gestão
  { path: "media", element: lazy(() => import("../../pages/AdminMediaManager")), role: ["super_admin", "admin"] },
  { path: "users", element: lazy(() => import("../../pages/AdminUsers")), role: "super_admin" },
  { path: "referrals", element: lazy(() => import("../../pages/adminReferral")) }, 
  { path: "payment-methods", element: lazy(() => import("../../pages/AdminPaymentMethods")), role: "super_admin" },
  { path: "shipping", element: lazy(() => import("../../pages/AdminShipping")), role: "super_admin" },
  { path: "settings", element: lazy(() => import("../../pages/AdminSettings")), role: "super_admin" },
  { path: "integration", element: lazy(() => import("../../pages/admin/IntegrationPage")), role: "super_admin" },
  { path: "theme", element: lazy(() => import("../../pages/AdminTheme")), role: "super_admin" },
  { path: "logs", element: lazy(() => import("../../pages/AdminLogs")), role: "super_admin" },
];
