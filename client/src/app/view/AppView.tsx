// client/src/app/view/AppView.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import { publicRoutes, adminRoutes } from "../logic/routesConfig";
import { AppInteligence } from "../logic/AppInteligence";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminLayout from "@/components/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CookieBanner } from "@/components/CookieBanner";
import { VersionCheckerBanner } from "@/components/VersionCheckerBanner";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { useGAPageTracking } from "@/_core/hooks/useGAPageTracking";
import { useAnalytics } from "@/_core/hooks/useAnalytics";
import { useAccessibility } from "@/_core/hooks/useAccessibility";
import { useBrandTheme } from "@/_core/hooks/useBrandTheme";
import { useCouponDeepLink } from "@/_core/hooks/useCouponDeepLink";
import type { AppRole } from "@shared/security/rbac";

const LoginPage = lazy(() => import("../../pages/Login"));

type AllowedRoles = AppRole;

interface AppRoute {
  path: string;
  element: React.ComponentType;
  protected?: boolean;
  role?: AllowedRoles | AllowedRoles[];
}

const PublicLayout = () => {
  useBrandTheme();
  return (
    <>
      <Header />
      <main className="min-h-[70vh]">
        <Outlet />
      </main>
      <AccessibilityWidget />
      <Footer />
    </>
  );
};

const AdminWrapper = () => (
  <ProtectedRoute requiredRole="admin">
    <AdminLayout />
  </ProtectedRoute>
);

const RedirectToPrint = () => {
  const { id } = useParams();
  return <Navigate to={`/admin/orders/${id}/print`} replace />;
};

export function AppView() {
  const { pathname } = useLocation();
  const isAdminPath = pathname.startsWith("/admin");

  // ✅ Rastreia mudanças de rota no Google Analytics (SPA)
  // ✅ Bootstrap GA4 — injeta o script no mount da aplicação
  useAnalytics();
  useGAPageTracking();
  useAccessibility();
  useCouponDeepLink();

  return (
    <>
      {/* Separamos o AppInteligence do Suspense principal.
        Se ele fizer um fetch assíncrono (tRPC), não bloqueia a renderização do site inteiro.
      */}
      <Suspense fallback={null}>
        <AppInteligence />
      </Suspense>

      <VersionCheckerBanner />

      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/admin">
            <Route
              path="pedidos/:id/imprimir"
              element={<RedirectToPrint />}
            />

            <Route element={<AdminWrapper />}>
              <Route index element={<Navigate to="dashboard" replace />} />

              {(adminRoutes as unknown as AppRoute[]).map((r) => (
                <Route
                  key={r.path}
                  path={r.path === "" ? undefined : r.path.replace(/^\//, "")}
                  index={r.path === ""}
                  element={
                    r.role ? (
                      <ProtectedRoute requiredRole={r.role}>
                        <r.element />
                      </ProtectedRoute>
                    ) : (
                      <r.element />
                    )
                  }
                />
              ))}
            </Route>
          </Route>

          <Route element={<PublicLayout />}>
            {(publicRoutes as unknown as AppRoute[]).map((r) => {
              const Component = r.element;
              const elementToRender = r.protected ? (
                <ProtectedRoute requiredRole={r.role}>
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
