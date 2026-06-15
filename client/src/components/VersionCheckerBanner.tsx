import React, { useEffect } from "react";
import { useAppVersionChecker } from "@/_core/hooks/useAppVersionChecker";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { appToast } from "@/lib/app-toast";

export function VersionCheckerBanner() {
  const { hasNewVersion, isCheckoutRoute, updateVersion } = useAppVersionChecker();

  useEffect(() => {
    if (hasNewVersion && isCheckoutRoute) {
      const warned = sessionStorage.getItem("checkout_version_warned");
      if (!warned) {
        sessionStorage.setItem("checkout_version_warned", "true");
        appToast.warning(
          "Uma nova versão está disponível. O sistema será atualizado após a conclusão do seu pedido."
        );
      }
    }
  }, [hasNewVersion, isCheckoutRoute]);

  // If there is no new version, render nothing
  if (!hasNewVersion) return null;

  const isAdmin = window.location.pathname.startsWith("/admin");

  // On checkout/payment routes, we do not render the banners (they only see the discrete toast once)
  if (isCheckoutRoute) {
    return null;
  }

  // If on Admin routes, show a fixed top banner
  if (isAdmin) {
    return (
      <div className="bg-slate-900 text-white py-3 px-6 flex items-center justify-between gap-4 border-b border-slate-800 animate-in slide-in-from-top duration-300 z-[9999] relative">
        <div className="flex items-center gap-2.5">
          <AlertCircle size={16} className="text-amber-400 shrink-0 animate-pulse" />
          <p className="text-xs font-black uppercase tracking-wider">
            Nova versão disponível do painel administrativo.
          </p>
        </div>
        <Button
          size="sm"
          onClick={updateVersion}
          className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <RefreshCw size={12} />
          Atualizar sistema agora
        </Button>
      </div>
    );
  }

  // For regular public routes, render a beautiful card in the corner
  return (
    <div
      data-testid="version-banner"
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-white border border-slate-100 rounded-4xl p-5 shadow-2xl z-[9999] animate-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4 text-left"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-2xl shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">Atualização Disponível</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Uma nova versão está disponível com melhorias no cardápio.
          </p>
        </div>
      </div>
      <Button
        onClick={updateVersion}
        className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
      >
        <RefreshCw size={12} />
        Atualizar Agora
      </Button>
    </div>
  );
}
export default VersionCheckerBanner;
