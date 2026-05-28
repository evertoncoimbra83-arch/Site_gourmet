import React from "react"; // ✅ Adicionado para escopo JSX
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ArrowUpRight, ArrowDownLeft, History, Info, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "../utils/orderHelpers";

// ✅ Interfaces para evitar o uso de 'any'
interface LoyaltyData {
  points?: number;
  balance?: number;
  loyaltyBalance?: number;
  totalPoints?: number;
}

interface LoyaltyHistoryEntry {
  pointsChange?: number | string;
  points?: number | string;
  amount?: number | string;
  description?: string;
  reason?: string;
  createdAt?: string | Date;
  date?: string | Date;
}

interface RedemptionRule {
  minOrderValue?: number;
  min_order_value?: number;
  maxDiscount?: number;
  max_discount?: number;
}

const formatDate = (date: string | Date | undefined) => 
  date ? new Date(date).toLocaleDateString("pt-BR") : "-";

export function LoyaltyTab({ 
  loyalty, 
  history, 
  settings 
}: { 
  loyalty: LoyaltyData; 
  history: LoyaltyHistoryEntry[]; 
  settings?: Record<string, any> | null;
}) {
  const totalPoints = 
    loyalty?.points ?? 
    loyalty?.balance ?? 
    loyalty?.loyaltyBalance ?? 
    loyalty?.totalPoints ?? 
    0;

  // Parâmetros de fidelidade dinâmicos do backend
  const redemptionRatePoints = Math.max(1, Number(settings?.redemptionRatePoints) || 100);
  const redemptionRateMoney = Math.max(0, Number(settings?.redemptionRateMoney) || 1);
  const conversionRateMoney = Number(settings?.conversionRateMoney) || 1;
  const conversionRatePoints = Number(settings?.conversionRatePoints) || 1;
  const maxDiscountAmount = Number(settings?.maxDiscountAmount) || 0;
  const minCartAmount = Number(settings?.minCartAmount) || 0;

  const cashbackValue = (totalPoints / redemptionRatePoints) * redemptionRateMoney;

  const redemptionRules = React.useMemo((): RedemptionRule[] => {
    const rawRules = settings?.redemptionRules || settings?.redemption_rules;
    if (!rawRules) return [];
    try {
      return (typeof rawRules === "string" ? JSON.parse(rawRules) : rawRules) as RedemptionRule[];
    } catch {
      return [];
    }
  }, [settings]);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
      
      <div className="lg:col-span-1 flex flex-col gap-4">
        {/* CARD DE SALDO - ESTILO PREMIUM DISCRETO */}
        <Card className="rounded-3xl md:rounded-4xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden relative text-white flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <CardContent className="p-6 md:p-10 flex flex-col items-center text-center relative z-10 flex-1 justify-center">
            <div className="bg-[#D4AF37]/10 p-3 md:p-4 rounded-3xl mb-4 md:mb-6 border border-[#D4AF37]/20">
              <Star className="h-6 w-6 md:h-8 md:w-8 text-[#D4AF37] fill-[#D4AF37]/20" />
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-widest">
                Saldo Disponível
              </p>
              <h3 className="text-5xl md:text-6xl font-black text-white tracking-tighter flex items-baseline justify-center gap-1.5">
                {totalPoints}
                <span className="text-xs md:text-sm text-[#D4AF37] not-italic tracking-widest uppercase">pts</span>
              </h3>
              {cashbackValue > 0 && (
                <div className="inline-flex bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mt-3">
                  Equivale a {formatCurrency(cashbackValue)} de desconto
                </div>
              )}
            </div>

            <div className="mt-6 md:mt-8 pt-6 border-t border-white/5 w-full text-left space-y-4">
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                <span className="font-bold text-slate-200 uppercase block mb-1">✨ Como acumular:</span>
                Cada {formatCurrency(conversionRateMoney)} em compras acumuladas geram {conversionRatePoints} ponto(s) de fidelidade.
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                <span className="font-bold text-slate-200 uppercase block mb-1">🎁 Como resgatar:</span>
                A cada {redemptionRatePoints} pontos resgatados, ganhe {formatCurrency(redemptionRateMoney)} de desconto no carrinho.
              </p>
              {(maxDiscountAmount > 0 || minCartAmount > 0) && (
                <div className="pt-2 border-t border-white/5 space-y-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                  {minCartAmount > 0 && <div>Compra mínima para uso: {formatCurrency(minCartAmount)}</div>}
                  {maxDiscountAmount > 0 && <div>Desconto máximo permitido: {formatCurrency(maxDiscountAmount)}</div>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* REGRAS POR FAIXA */}
        {redemptionRules.length > 0 && (
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white p-5 text-left space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-widest flex items-center gap-1.5">
              <Tag size={14} className="text-emerald-600" />
              Faixas de Desconto Disponíveis
            </h4>
            <div className="space-y-2.5">
              {redemptionRules.map((rule, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-[10px] uppercase tracking-tight">
                  <span className="text-slate-500">Acima de {formatCurrency(rule.minOrderValue || rule.min_order_value)}</span>
                  <span className="text-emerald-600 font-black">Até {formatCurrency(rule.maxDiscount || rule.max_discount)} OFF</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* HISTÓRICO DE MOVIMENTAÇÕES */}
      {/* ✅ Atualizado md:rounded-4xl conforme sugestão do Tailwind */}
      <Card className="lg:col-span-2 rounded-3xl md:rounded-4xl border-slate-100 shadow-sm overflow-hidden bg-white flex flex-col">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 shrink-0 text-left">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <History className="h-3.5 w-3.5 text-[#D4AF37]" />
               Extrato de Fidelidade
            </div>
            {history?.length > 0 && (
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {history.length} operações
              </span>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 overflow-hidden">
          {!history || history.length === 0 ? (
            <div className="p-12 md:p-20 text-center flex flex-col items-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Star className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                Nenhuma movimentação registrada.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-100 lg:max-h-95 overflow-y-auto custom-scrollbar">
              {history.map((entry, i) => {
                const pts = Number(entry.pointsChange || entry.points || entry.amount || 0);
                const isEarned = pts > 0;

                return (
                  <div key={i} className="p-4 md:p-5 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className={cn(
                        "p-2 md:p-2.5 rounded-xl md:rounded-2xl shrink-0 transition-transform group-hover:scale-110",
                        isEarned ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                      )}>
                        {isEarned ? (
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-bold text-slate-700 text-sm tracking-tight truncate">
                          {entry.description || entry.reason || (isEarned ? "Crédito de Pontos" : "Resgate")}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatDate(entry.createdAt || entry.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "font-bold text-xs md:text-sm tabular-nums shrink-0 ml-4 px-3 py-1 rounded-lg border",
                      isEarned 
                        ? "text-emerald-600 bg-emerald-50/30 border-emerald-100" 
                        : "text-rose-500 bg-rose-50/30 border-rose-100"
                    )}>
                      {isEarned ? '+' : ''}{pts} 
                      <span className="text-[9px] md:text-[10px] uppercase ml-1 not-italic opacity-70">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}