import React, { Suspense, lazy } from "react";
import { Route, Switch, useLocation } from "wouter";
// ✅ Importamos o SEU novo componente Toaster (Zustand + Framer Motion)
import { Toaster } from "@/components/ui/toaster"; 
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { CookieBanner } from "./components/CookieBanner";

import { trpc, trpcClient } from "./_core/trpc";
import { useAccessibility } from "./_core/hooks/useAccessibility"; 
import { AccessibilityWidget } from "./components/AccessibilityWidget"; 

import { CartProvider } from "./_core/CartContext";
import { ThemeProvider } from "./components/ThemeProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Loader2, AlertTriangle, MessageCircle } from "lucide-react";
import { useAuth } from "./_core/hooks/useAuth";

// --- Páginas Públicas ---
const Home = lazy(() => import("./pages/Home"));
const Produtos = lazy(() => import("./pages/Products"));
const Pacotes = lazy(() => import("./pages/Packages"));
const Carrinho = lazy(() => import("./pages/CartPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Perfil = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DevLogin = lazy(() => import("./pages/DevLogin"));
const Sucesso = lazy(() => import("./pages/SuccessPage"));

// ✅ VIEWS DE AUTENTICAÇÃO
const EsqueciSenha = lazy(() => import("./pages/auth/ForgotPasswordView").then(module => ({ default: module.ForgotPasswordView })));
const ResetarSenha = lazy(() => import("./pages/auth/ResetPasswordView").then(module => ({ default: module.ResetPasswordView })));

// --- Admin ---
const AdminDash = lazy(() => import("./pages/AdminDashboard"));
const AdminPedidos = lazy(() => import("./pages/AdminOrders"));
const AdminProdutos = lazy(() => import("./pages/AdminDishes"));
const AdminUsuarios = lazy(() => import("./pages/AdminUsers"));
const AdminConfig = lazy(() => import("./pages/AdminSettings"));
const AdminCupons = lazy(() => import("./pages/AdminCoupons"));
const AdminTamanhos = lazy(() => import("./pages/AdminSizesAccompaniments"));
const AdminPacotes = lazy(() => import("./pages/AdminPackages"));
const AdminMedia = lazy(() => import("./pages/AdminMediaManager"));
const AdminRegrasDesconto = lazy(() => import("./pages/AdminDiscountRules"));
const AdminPagamentos = lazy(() => import("./pages/AdminPaymentMethods"));
const AdminFidelidade = lazy(() => import("./pages/AdminLoyalty"));
const AdminAparencia = lazy(() => import("./pages/AdminAppearance"));
const AdminShowcases = lazy(() => import("./pages/AdminShowcases"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const AdminMigration = lazy(() => import("./pages/AdminMigration").then(m => ({ default: m.AdminMigration })));
const AdminLogin = lazy(() => import("./pages/adminLogin/AdminLogin"));
const AdminMarketing = lazy(() => import("./pages/adminMarketing/view/AdminMarketingView").then(m => ({ default: m.AdminMarketingView })));
const AdminFrete = lazy(() => import("./pages/adminShipping/view/AdminShippingView").then((m) => ({ default: m.AdminShippingView })));
const AdminMail = lazy(() => import("./pages/adminMail/view/AdminMailView").then(m => ({ default: m.AdminMailView })));

/**
 * 🛠️ TELA DE MANUTENÇÃO
 */
function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-red-100 rounded-full scale-150 animate-ping opacity-20" />
          <div className="relative bg-red-50 p-6 rounded-[2.5rem] text-red-600 shadow-xl shadow-red-100">
            <AlertTriangle size={48} />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            Pausa <span className="text-red-600">Necessária</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed">
            Estamos ajustando nossos temperos digitais. Voltamos em instantes!
          </p>
        </div>
        <div className="flex justify-center gap-4 pt-4">
           <a href="https://wa.me/5511999999999" target="_blank" className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100">
             <MessageCircle size={16} /> WhatsApp
           </a>
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function MaintenanceInterceptor({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const { data: settings } = trpc.public.getStoreSettings.useQuery(undefined, {
    refetchInterval: 120000, 
    retry: false,
    staleTime: 1000 * 60 * 5
  });

  const isEmergency = settings?.emergencyMode;
  const isAdminPath = location.startsWith("/admin");
  const isUserAdmin = user?.role === "admin";

  if (isEmergency && !isAdminPath && !isUserAdmin) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}

const LayoutPublico = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main className="min-h-[70vh]">{children}</main>
    <AccessibilityWidget /> 
    <Footer />
  </>
);

const RotaAdmin = ({ path, component: Component }: { path: string; component: any }) => (
  <Route path={path}>
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>}>
          <Component />
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  </Route>
);

function AccessibilityManager() {
  useAccessibility(); 
  return null;
}

export default function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <CartProvider>
                <TooltipProvider>
                  <AccessibilityManager />
                  
                  <MaintenanceInterceptor>
                    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#FBFBFC]"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>}>
                      <Switch>
                        {/* Rotas Públicas */}
                        <Route path="/"><LayoutPublico><Home /></LayoutPublico></Route>
                        <Route path="/produtos"><LayoutPublico><Produtos /></LayoutPublico></Route>
                        <Route path="/packages"><LayoutPublico><Pacotes /></LayoutPublico></Route>
                        <Route path="/carrinho"><LayoutPublico><Carrinho /></LayoutPublico></Route>
                        <Route path="/checkout"><LayoutPublico><Checkout /></LayoutPublico></Route>
                        <Route path="/sucesso"><LayoutPublico><Sucesso /></LayoutPublico></Route>
                        <Route path="/meus-pedidos"><LayoutPublico><Perfil /></LayoutPublico></Route>
                        <Route path="/perfil"><LayoutPublico><Perfil /></LayoutPublico></Route>
                        <Route path="/login"><Login /></Route>
                        <Route path="/dev-login"><LayoutPublico><DevLogin /></LayoutPublico></Route>

                        <Route path="/forgot-password"><LayoutPublico><EsqueciSenha /></LayoutPublico></Route>
                        <Route path="/reset-password"><LayoutPublico><ResetarSenha /></LayoutPublico></Route>

                        <Route path="/admin/login"><AdminLogin /></Route>

                        {/* Rotas Admin */}
                        <RotaAdmin path="/admin" component={AdminDash} />
                        <RotaAdmin path="/admin/orders" component={AdminPedidos} />
                        <RotaAdmin path="/admin/dishes" component={AdminProdutos} />
                        <RotaAdmin path="/admin/marketing" component={AdminMarketing} />
                        <RotaAdmin path="/admin/users" component={AdminUsuarios} />
                        <RotaAdmin path="/admin/coupons" component={AdminCupons} />
                        <RotaAdmin path="/admin/mail" component={AdminMail} />
                        <RotaAdmin path="/admin/settings" component={AdminConfig} />
                        <RotaAdmin path="/admin/shipping" component={AdminFrete} />
                        <RotaAdmin path="/admin/sizes-accompaniments" component={AdminTamanhos} />
                        <RotaAdmin path="/admin/packages" component={AdminPacotes} />
                        <RotaAdmin path="/admin/media" component={AdminMedia} />
                        <RotaAdmin path="/admin/discount-rules" component={AdminRegrasDesconto} />
                        <RotaAdmin path="/admin/payment-methods" component={AdminPagamentos} />
                        <RotaAdmin path="/admin/loyalty" component={AdminFidelidade} />
                        <RotaAdmin path="/admin/appearance" component={AdminAparencia} />
                        <RotaAdmin path="/admin/showcases" component={AdminShowcases} />
                        <RotaAdmin path="/admin/logs" component={AdminLogs} />
                        <RotaAdmin path="/admin/migration" component={AdminMigration} />

                        <Route><NotFound /></Route>
                      </Switch>
                    </Suspense>
                  </MaintenanceInterceptor>

                  {/* ✅ TOASTER: Está na posição correta, fora do Switch e dentro do Provider */}
                  <Toaster />

                  {!isAdminRoute && <CookieBanner />}
                </TooltipProvider>
              </CartProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}