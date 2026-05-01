// client/src/components/CookieBanner.tsx
// ✅ onAccept: habilita Analytics (seta flag no localStorage)
// ✅ onDecline: desabilita Analytics (remove flag)
// ✅ Link corrigido para /privacidade (rota real do projeto)

import React from "react";
import CookieConsent from "react-cookie-consent";
import { Link } from "react-router-dom";

// Chave usada por useAnalytics.ts para verificar o consentimento
export const ANALYTICS_CONSENT_KEY = "gourmet_analytics_consent";

function handleAccept() {
  localStorage.setItem(ANALYTICS_CONSENT_KEY, "true");
  // Se o gtag já foi carregado (analytics dinâmico), atualiza consentimento
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
    });
  }
}

function handleDecline() {
  localStorage.setItem(ANALYTICS_CONSENT_KEY, "false");
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
    });
  }
}

export function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      cookieName="gourmet_saudavel_consent"
      onAccept={handleAccept}
      onDecline={handleDecline}
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "20px",
        fontSize: "13px",
        alignItems: "center",
        borderTop: "1px solid rgba(16, 185, 129, 0.3)",
        zIndex: 9999,
        boxShadow: "0 -20px 50px -10px rgba(0, 0, 0, 0.5)",
        flexWrap: "wrap",
      }}
      buttonText="ACEITAR TODOS"
      buttonStyle={{
        background: "#10b981",
        color: "#fff",
        fontSize: "10px",
        fontWeight: "900",
        borderRadius: "14px",
        padding: "14px 28px",
        margin: "8px",
        letterSpacing: "0.1em",
        transition: "all 0.2s ease",
      }}
      enableDeclineButton
      declineButtonText="APENAS ESSENCIAIS"
      declineButtonStyle={{
        background: "rgba(255,255,255,0.05)",
        color: "#94a3b8",
        fontSize: "10px",
        fontWeight: "700",
        borderRadius: "14px",
        padding: "14px 28px",
        border: "1px solid rgba(255,255,255,0.1)",
        margin: "8px",
        letterSpacing: "0.05em",
      }}
      contentStyle={{ margin: "0px", flex: "1 0 300px" }}
      expires={150}
    >
      <div className="flex flex-col gap-1 max-w-xl animate-in fade-in duration-1000">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="font-black uppercase tracking-[0.2em] text-[10px] text-emerald-400">
            Privacidade & Cookies
          </span>
        </div>

        <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs mt-1 font-medium">
          Personalizamos sua experiência para que sua jornada saudável seja única.
          Ao continuar, você aceita nossa{" "}
          <Link to="/privacidade" className="text-emerald-400 underline hover:text-emerald-300 transition-colors">
            Política de Privacidade
          </Link>
          . &quot;Apenas Essenciais&quot; desativa rastreamento analítico.
        </p>
      </div>
    </CookieConsent>
  );
}