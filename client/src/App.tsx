import React, { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "./_core/CartContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AppView } from "./app/view/AppView";
import { captureReferralCode } from "@/lib/guest";
import { removeQueryParams } from "@shared/utils/coupon";

// ✅ Gerenciamento de Autenticação e Modais Globais
import { AuthProvider } from "./_core/context";
import { AuthDrawer } from "./pages/auth/AuthDrawer";

// ✅ Componentes de Navegação Mobile (Tab Bar e Carrinho Flutuante)
import { MobileBottomNav } from "./_core/shared/MobileBottomNav";
import { FloatingCartFooter } from "./_core/shared/FloatingCartFooter";

export default function App() {

  // 🛡️ Monitoramento de Referência/Indicação
  useEffect(() => {
    const code = captureReferralCode();
    if (code) {
      // O código é salvo no localStorage/Cookie pelo captureReferralCode.
      // O tRPC enviará automaticamente via headers no arquivo trpc.ts.
      const cleanedSearch = removeQueryParams(window.location.search, ["ref"]);
      const newUrl = window.location.pathname + (cleanedSearch ? `?${cleanedSearch}` : "") + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  return (
    /**
     * 1. ErrorBoundary: Protege o app contra "telas brancas".
     */
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">

          <AuthProvider>
            <CartProvider>
              <TooltipProvider>

                {/* 2. Notificações flutuantes (Toasts) */}
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  toastOptions={{
                    className: "font-bold uppercase tracking-tight rounded-2xl",
                  }}
                />

                {/* 3. AppView: Contém o Roteamento (Páginas), Header e Footer */}
                <AppView />

                {/* 4. UI Global Flutuante (Mobile First) */}
                {/* O FloatingCartFooter aparece quando há itens na sacola */}
                <FloatingCartFooter />

                {/* O MobileBottomNav é a barra de menu fixa no rodapé */}
                <MobileBottomNav />

                {/* 5. AuthDrawer: Modal lateral de login global */}
                <AuthDrawer />

              </TooltipProvider>
            </CartProvider>
          </AuthProvider>

        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}