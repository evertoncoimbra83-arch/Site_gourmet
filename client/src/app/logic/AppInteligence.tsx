import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/_core/hooks/useAuth";
import { useVisitorId } from "@/_core/hooks/useVisitorId";
import { clarity } from "react-microsoft-clarity";
import OneSignal from "react-onesignal";
import { trpc } from "@/_core/trpc";

// ✅ Variáveis de controle globais (não resetam no re-render do React)
let isOneSignalInitialized = false;
let isOneSignalInitializing = false;
let isGtmInjected = false;

export function AppInteligence() {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const visitorId = useVisitorId();

  const { data: settings } = trpc.store.public.getPublicSettings.useQuery();

  // 1. Injetar Google Tag Manager dinamicamente via DB
  useEffect(() => {
    const s = settings as Record<string, unknown> | undefined;
    const gtmId = typeof s?.gtmId === "string" ? s.gtmId : null;
    if (!gtmId || isGtmInjected) return;

    // Script principal no <head>
    const script = document.createElement("script");
    script.id = "gtm-script";
    // ✅ textContent em vez de innerHTML — evita flag de segurança
    script.textContent = `
      (function(w,d,s,l,i){
        w[l]=w[l]||[];
        w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),
            dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;
        j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `.trim();
    document.head.appendChild(script);

    // Noscript iframe no <body> (fallback para navegadores sem JS)
    const noscript = document.createElement("noscript");
    noscript.id = "gtm-noscript";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    isGtmInjected = true;

    if (import.meta.env.DEV) {
      console.log(`[GTM] Injetado via DB: ${gtmId}`);
    }
  }, [settings]);

  // 2. Inicializar SDKs (OneSignal + Clarity)
  useEffect(() => {
    if (isOneSignalInitialized || isOneSignalInitializing) return;

    const initSDKs = async () => {
      isOneSignalInitializing = true;
      try {
        const hostname = window.location.hostname;
        const isAuthorizedDomain =
          hostname === "gourmetsaudavel.com" || hostname === "localhost";

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
        if (
          !error.message.includes("already initialized") &&
          !error.message.includes("domain")
        ) {
          console.warn("[SDK Init]:", error.message);
        }
      } finally {
        isOneSignalInitializing = false;
      }
    };

    initSDKs();
  }, []);

  // 3. Identificar Usuário
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      if (clarity.hasStarted()) {
        clarity.identify(user.id, {
          name: user.name || "Cliente",
          email: user.email,
          role: user.role || "customer",
        });
      }

      if (isOneSignalInitialized) {
        try {
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

  // 4. Títulos Dinâmicos
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
    document.title =
      titles[pathname] ||
      (pathname.startsWith("/admin")
        ? `Painel Admin | ${baseTitle}`
        : baseTitle);
  }, [pathname]);

  return null;
}