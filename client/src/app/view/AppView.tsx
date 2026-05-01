// client/src/app/view/AppView.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

import { publicRoutes, adminRoutes } from "../logic/routesConfig";
import { AppInteligence } from "../logic/AppInteligence";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminLayout from "@/components/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CookieBanner } from "@/components/CookieBanner";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { useGAPageTracking } from "@/_core/hooks/useGAPageTracking";
import { useAnalytics } from "@/_core/hooks/useAnalytics";

import OrderPrintCenter from "../../pages/adminOrders/components/orderDrawer/print/OrderPrintCenter";

const LoginPage = lazy(() => import("../../pages/Login"));

type AllowedRoles = "admin" | "user" | "nutri";

interface AppRoute {
  path: string;
  element: React.ComponentType;
  protected?: boolean;
  role?: AllowedRoles | AllowedRoles[];
}

const PublicLayout = () => (
  <>
    <Header />
    <main className="min-h-[70vh]">
      <Outlet />
    </main>
    <AccessibilityWidget />
    <Footer />
  </>
);

const AdminWrapper = () => (
  <ProtectedRoute requiredRole="admin">
    <AdminLayout />
  </ProtectedRoute>
);

export function AppView() {
  const { pathname } = useLocation();
  const isAdminPath = pathname.startsWith("/admin");

  // ✅ Rastreia mudanças de rota no Google Analytics (SPA)
  // ✅ Bootstrap GA4 — injeta o script no mount da aplicação
  useAnalytics();
  useGAPageTracking();

  return (
    <>
      {/* Separamos o AppInteligence do Suspense principal. 
        Se ele fizer um fetch assíncrono (tRPC), não bloqueia a renderização do site inteiro. 
      */}
      <Suspense fallback={null}>
        <AppInteligence />
      </Suspense>

      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/admin">
            <Route
              path="pedidos/:id/imprimir"
              element={
                <ProtectedRoute requiredRole="admin">
                  <OrderPrintCenter />
                </ProtectedRoute>
              }
            />

            <Route element={<AdminWrapper />}>
              <Route index element={<Navigate to="dashboard" replace />} />

              {(adminRoutes as unknown as AppRoute[]).map((r) => (
                <Route
                  key={r.path}
                  path={r.path === "" ? undefined : r.path.replace(/^\//, "")}
                  index={r.path === ""}
                  element={<r.element />}
                />
              ))}
            </Route>
          </Route>

          <Route element={<PublicLayout />}>
            {(publicRoutes as unknown as AppRoute[]).map((r) => {
              const Component = r.element;
              const roleToPass = Array.isArray(r.role) ? r.role[0] : r.role;

              const elementToRender = r.protected ? (
                <ProtectedRoute requiredRole={roleToPass}>
                  <Component />
                </ProtectedRoute>
              ) : (
                <Component />
              );

              return (
                <Route
                  key={r.path}
                  index={r.path === "/"}
                  path={r.path === "/" ? undefined : r.path.replace(/^\//, "")}
                  element={elementToRender}
                />
              );
            })}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {!isAdminPath && pathname !== "/login" && <CookieBanner />}
      </Suspense>
    </>
  );
}