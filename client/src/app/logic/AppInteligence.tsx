import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/_core/hooks/useAuth";
import { useVisitorId } from "@/_core/hooks/useVisitorId";
import { clarity } from "react-microsoft-clarity";
import OneSignal from "react-onesignal";

// ✅ Variáveis de controle globais (não resetam no re-render do React)
let isOneSignalInitialized = false;
let isOneSignalInitializing = false;

export function AppInteligence() {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const visitorId = useVisitorId();

  // 1. Inicializar SDKs
  useEffect(() => {
    // Se já inicializou ou está em processo, não faz nada
    if (isOneSignalInitialized || isOneSignalInitializing) return;

    const initSDKs = async () => {
      isOneSignalInitializing = true;
      try {
        const hostname = window.location.hostname;
        const isAuthorizedDomain = hostname === "gourmetsaudavel.com" || hostname === "localhost";

        if (isAuthorizedDomain) {
          await OneSignal.init({
            appId: "a3c426a1-fd0a-4fda-9c13-e32b6705442a",
            allowLocalhostAsSecureOrigin: true,
          });
          isOneSignalInitialized = true;
        }

        if (!clarity.hasStarted()) {
          clarity.init("vfh49ngyny");
        }
      } catch (e: unknown) {
        const error = e as Error;
        // Silencia erros de inicialização dupla ou domínio no localhost
        if (!error.message.includes("already initialized") && !error.message.includes("domain")) {
          console.warn("[SDK Init]:", error.message);
        }
      } finally {
        isOneSignalInitializing = false;
      }
    };

    initSDKs();
  }, []);

  // 2. Identificar Usuário (Com proteção para OneSignal)
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      // Clarity (Sempre funciona)
      if (clarity.hasStarted()) {
        clarity.identify(user.id, {
          name: user.name || "Cliente",
          email: user.email,
          role: user.role || "customer",
        });
      }

      // OneSignal - ✅ Só tenta login se estiver inicializado e se o método existir
      if (isOneSignalInitialized) {
        try {
          // O OneSignal v5+ às vezes falha se chamado muito rápido
          OneSignal.login(user.id).catch(() => {
            /* Silencia erro de login manager interno */
          });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // Ignora erros de "Cannot read properties of undefined (reading 'tt')"
        }
      }
    }

    if (visitorId && clarity.hasStarted()) {
      clarity.setTag("deviceId", visitorId);
    }
  }, [user, isAuthenticated, visitorId]);

  // 3. Títulos Dinâmicos
  useEffect(() => {
    const baseTitle = "Gourmet Saudável";
    const titles: Record<string, string> = {
      "/": `${baseTitle} | Comida de Verdade`,
      "/produtos": `Cardápio | ${baseTitle}`,
      "/carrinho": `Meu Carrinho | ${baseTitle}`,
      "/checkout": `Finalizar Pedido | ${baseTitle}`,
      "/pacotes": `Nossos Pacotes | ${baseTitle}`,
      "/entrar": `Entrar | ${baseTitle}`,
      "/primeiro-acesso": `Primeiro Acesso | ${baseTitle}`,
    };
    document.title = titles[pathname] || (pathname.startsWith("/admin") ? `Painel Admin | ${baseTitle}` : baseTitle);
  }, [pathname]);

  return null;
}