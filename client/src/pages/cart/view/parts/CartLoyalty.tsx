import React from "react";
import { useCartLoyalty } from "@/_core/hooks/useCartLoyalty";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Star, Sparkles, Loader2, Gift, AlertCircle, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CartLoyalty() {
  const { 
    points, 
    isActive, 
    canUse, 
    reason, 
    potentialDiscount, 
    toggle, 
    isLoading, 
    money 
  } = useCartLoyalty();

  if (points <= 0 && !isActive) return null;

  return (
    <Card 
      onClick={canUse ? toggle : undefined}
      className={cn(
        "relative border-2 rounded-[2.5rem] overflow-hidden transition-all duration-500 mb-8 select-none shadow-xl",
        isActive 
          ? "border-emerald-500 bg-white shadow-emerald-200/40" 
          : "border-slate-100 bg-gradient-to-br from-white to-slate-50/50 hover:border-amber-200 shadow-slate-200/50",
        !canUse && !isActive && "opacity-80 grayscale-[0.2]",
        isLoading && "pointer-events-none"
      )}
    >
      {/* Glow Effect Background */}
      {isActive && (
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[40px] rounded-full" />
      )}

      <CardContent className="p-6 sm:p-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className={cn(
              "h-16 w-16 rounded-[1.2rem] flex items-center justify-center transition-all duration-700 shadow-lg",
              isActive 
                ? "bg-emerald-500 scale-105 rotate-0 shadow-emerald-500/30" 
                : "bg-slate-900 -rotate-6 shadow-slate-900/20"
            )}>
              {isActive ? (
                <Gift size={28} className="text-white animate-bounce" />
              ) : (
                <Coins size={28} className="text-amber-400" />
              )}
            </div>
            
            <div className={cn(
              "absolute -bottom-1 -right-1 h-8 w-8 rounded-full flex items-center justify-center border-4 border-white transition-all duration-500 shadow-sm",
              isActive ? "bg-emerald-100 scale-110" : "bg-slate-800"
            )}>
              {isLoading ? (
                <Loader2 size={14} className={cn("animate-spin", isActive ? "text-emerald-500" : "text-white")} />
              ) : (
                <Sparkles size={14} className={cn(isActive ? "text-emerald-600 fill-emerald-600" : "text-amber-400 fill-amber-400")} />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Fidelidade VIP</span>
              {canUse && !isActive && (
                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Economize</span>
              )}
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">
              {points} <span className="text-slate-400 font-medium not-italic text-sm ml-0.5">pts</span>
            </h3>
            
            <div className="flex items-center gap-1.5 mt-1.5">
              {!canUse && !isActive ? (
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  <AlertCircle size={12} strokeWidth={3} />
                  <p className="text-[10px] font-black uppercase tracking-tight">{reason}</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <p className={cn(
                    "text-xs font-bold transition-colors",
                    isActive ? "text-emerald-600" : "text-slate-500"
                  )}>
                    {isActive ? "Saldo aplicado com sucesso!" : `Valem ${money(potentialDiscount)} de desconto`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3" onClick={(e) => e.stopPropagation()}>
          <Switch 
            checked={isActive} 
            disabled={!canUse || isLoading} 
            onCheckedChange={toggle} 
            className="data-[state=checked]:bg-emerald-500 shadow-sm scale-125" 
          />
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.15em] transition-colors", 
            isActive ? "text-emerald-600" : "text-slate-400"
          )}>
            {isActive ? "Ativo" : "Usar"}
          </span>
        </div>
      </CardContent>
      
      {isActive && potentialDiscount > 0 && (
        <div className="bg-emerald-500 px-8 py-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
            <p className="text-[11px] font-black text-white uppercase tracking-widest">Desconto Fidelidade</p>
          </div>
          <p className="text-base font-black text-white italic tracking-tighter">-{money(potentialDiscount)}</p>
        </div>
      )}
    </Card>
  );
}