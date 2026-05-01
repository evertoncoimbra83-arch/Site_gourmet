import React, { useMemo } from "react";
import { useCartPageLogic } from "../../logic/useCartPageLogic";
import { useLoyaltyValidator, LoyaltySettings } from "@/_core/hooks/loyalty/useLoyaltyValidator";
import { Switch } from "@/components/ui/switch";
import { Gift, AlertCircle, Coins, Loader2, ArrowRight, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function CartLoyalty() {
  const { 
    loyaltySettings,
    loyaltyPoints, 
    usesLoyalty, 
    toggleLoyalty, 
    isLoading, 
    money,
    totals
  } = useCartPageLogic();

  const settings = useMemo((): LoyaltySettings | undefined => { 
    if (!loyaltySettings) return undefined;
    return loyaltySettings as unknown as LoyaltySettings;
  }, [loyaltySettings]);

  const validation = useLoyaltyValidator(
    Number(totals?.subtotal || 0), 
    Number(loyaltyPoints || 0), 
    settings
  );

  const subtotal = Number(totals?.subtotal || 0);
  const currentDiscount = Number(totals?.loyaltyDiscount || 0);
  const isProgramDisabled = settings?.enabled === false;

  // Lógica de interface baseada no resultado do Validador
  const getStatusContent = () => {
    // 1. Bloqueado (Falta valor mínimo ou sem pontos)
    if (!validation.isValid) {
      return {
        label: validation.message,
        blocked: true,
        icon: <AlertCircle size={12} />
      };
    }

    // 2. Upsell (Tem pontos, já liberou a 1ª faixa, mas pode melhorar o desconto)
    if (validation.nextTier && !usesLoyalty) {
      return {
        label: "Desconto liberado!",
        reason: `Adicione + ${money(validation.nextTier.minOrderValue - subtotal)} para liberar até ${money(validation.nextTier.maxDiscount)}`,
        blocked: false,
        icon: <TrendingUp size={12} className="text-emerald-500" />
      };
    }

    // 3. Pronto para usar / Já em uso
    return {
      label: usesLoyalty ? "Benefício aplicado" : "Cashback disponível",
      // Exibe a regra do teto global ou da faixa atingida
      reason: usesLoyalty ? "Tudo certo na sua sacola!" : "Você atingiu o limite desta faixa.",
      blocked: false,
      icon: null
    };
  };

  const status = getStatusContent();

  if (isProgramDisabled && !usesLoyalty) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border-2 transition-all duration-500",
      usesLoyalty 
        ? "border-transparent bg-linear-to-br from-white via-emerald-50/80 to-white shadow-2xl shadow-emerald-500/30" 
        : status.blocked
          ? "border-slate-100 bg-slate-50/50 opacity-75" 
          : "border-slate-100 bg-white hover:border-emerald-200 shadow-sm"
    )}>
      
      {usesLoyalty && (
        <div className="absolute inset-0 border-2 border-transparent bg-linear-to-r from-emerald-400/30 to-teal-400/30 rounded-3xl pointer-events-none" />
      )}

      <div className="p-4 md:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn(
            "h-14 w-14 rounded-3xl flex items-center justify-center shrink-0 relative overflow-hidden transition-all duration-500 shadow-inner",
            usesLoyalty 
              ? "bg-linear-to-br from-emerald-500 to-teal-600 ring-4 ring-emerald-100 shadow-emerald-500/30" 
              : "bg-linear-to-br from-slate-800 to-slate-900"
          )}>
            {isLoading ? (
              <Loader2 className="animate-spin text-white" size={26} />
            ) : usesLoyalty ? (
              <Gift size={26} className="text-white" />
            ) : (
              <Coins size={26} className="text-amber-400" />
            )}
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-3xl font-black text-slate-900 tracking-tighter">
                {loyaltyPoints}
              </span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">pts</span>
            </div>

            {/* 🔥 NOVO: Mensagem Clara e Atrativa (Só aparece se não estiver bloqueado e o switch estiver desligado) */}
            {!status.blocked && validation.discount > 0 && !usesLoyalty && (
  <p className="text-[11px] font-black text-emerald-600 mt-1 uppercase tracking-tight">
    Usando <span className="text-slate-900 mx-0.5">{Math.floor(validation.pointsToDeduct || 0)} pts</span> você ganha <span className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded-md ml-0.5">{money(validation.discount || 0)} OFF</span>
  </p>
)}

            <div className="mt-1">
              <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                status.blocked ? "text-amber-600" : usesLoyalty ? "text-emerald-600" : "text-slate-500"
              )}>
                {status.icon}
                {status.blocked ? status.label : status.reason}
              </div>
              
              <a 
                href="/fidelidade" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <Info size={10} />
                Como funciona o clube?
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200/60 pl-4 shrink-0 z-10">
          <div className="flex flex-col items-center gap-1">
            <Switch 
              checked={!!usesLoyalty} 
              disabled={isLoading || status.blocked} 
              onCheckedChange={toggleLoyalty} 
              className="data-[state=checked]:bg-emerald-500 scale-110 cursor-pointer shadow-sm"
            />
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em]", 
              usesLoyalty ? "text-emerald-600" : "text-slate-400"
            )}>
              {isLoading ? "..." : usesLoyalty ? "Ativo" : "Usar"}
            </span>
          </div>
        </div>
      </div>

      {usesLoyalty && currentDiscount > 0 && (
        <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-5 py-3 flex items-center justify-between text-white font-black relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest opacity-90">Desconto Clube</span>
            <ArrowRight size={14} className="opacity-50" />
          </div>
          <span className="text-xl italic tracking-tighter">-{money(currentDiscount)}</span>
        </div>
      )}
    </div>
  );
}