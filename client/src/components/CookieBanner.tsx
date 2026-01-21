import CookieConsent from "react-cookie-consent";
import { Link } from "wouter";

export function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      cookieName="gourmet_saudavel_consent"
      
      // ✅ Configuração do Botão "Aceitar" (Principal)
      buttonText="ACEITAR TODOS"
      buttonStyle={{ 
        background: "#10b981", // Emerald-500
        color: "#fff", 
        fontSize: "11px", 
        fontWeight: "900",
        borderRadius: "12px",
        padding: "12px 24px",
        margin: "10px"
      }}
      
      // ✅ ATIVAÇÃO DO BOTÃO "REJEITAR"
      enableDeclineButton
      declineButtonText="APENAS ESSENCIAIS"
      declineButtonStyle={{
        background: "transparent",
        color: "#94a3b8", // Slate-400
        fontSize: "11px",
        fontWeight: "700",
        borderRadius: "12px",
        padding: "12px 24px",
        border: "1px solid #334155", // Borda discreta Slate-700
        margin: "10px"
      }}

      // Estilo do Banner
      style={{ 
        background: "#0f172a", // Slate-900
        color: "#f8fafc",
        padding: "16px",
        fontSize: "13px",
        alignItems: "center",
        borderTop: "3px solid #10b981", // Detalhe em Verde
        zIndex: 999,
        boxShadow: "0 -10px 25px -5px rgba(0, 0, 0, 0.3)"
      }}
      expires={150}
    >
      <div className="flex flex-col gap-1 max-w-xl">
        <div className="flex items-center gap-2">
          {/* Pequeno indicador visual de estado */}
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="font-black uppercase tracking-[0.2em] text-[10px] text-emerald-400">
            Privacidade & Cookies
          </span>
        </div>
        <p className="text-slate-400 leading-relaxed text-xs sm:text-sm mt-1">
          Utilizamos cookies para personalizar a sua experiência e analisar o tráfego. 
          Pode aceitar todos os cookies ou manter apenas os estritamente necessários para o funcionamento da loja. 
          Saiba mais na nossa{" "}
          <Link href="/perfil" className="text-emerald-400 underline hover:text-emerald-300 transition-colors">
            Política de Privacidade
          </Link>.
        </p>
      </div>
    </CookieConsent>
  );
}