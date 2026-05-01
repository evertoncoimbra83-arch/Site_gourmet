import React from "react"; // ✅ Adicionado para escopo JSX
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ArrowUpRight, ArrowDownLeft, History } from "lucide-react";
import { cn } from "@/lib/utils";

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

const formatDate = (date: string | Date | undefined) => 
  date ? new Date(date).toLocaleDateString("pt-BR") : "-";

export function LoyaltyTab({ loyalty, history }: { loyalty: LoyaltyData, history: LoyaltyHistoryEntry[] }) {
  const totalPoints = 
    loyalty?.points ?? 
    loyalty?.balance ?? 
    loyalty?.loyaltyBalance ?? 
    loyalty?.totalPoints ?? 
    0;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
      
      {/* CARD DE SALDO - ESTILO PREMIUM DISCRETO */}
      <Card className="lg:col-span-1 rounded-3xl md:rounded-4xl bg-slate-900 border-none shadow-2xl shadow-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full -mr-16 -mt-16" />
        
        <CardContent className="p-6 md:p-10 flex flex-col items-center text-center relative z-10">
          <div className="bg-[#D4AF37]/10 p-3 md:p-4 rounded-2xl mb-4 md:mb-6 border border-[#D4AF37]/20">
            <Star className="h-6 w-6 md:h-8 md:w-8 text-[#D4AF37] fill-[#D4AF37]/20" />
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">
              Saldo Disponível
            </p>
            <h3 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter flex items-baseline justify-center gap-2">
              {totalPoints}
              <span className="text-xs md:text-sm text-[#D4AF37] not-italic tracking-widest uppercase">pts</span>
            </h3>
          </div>

          <div className="mt-6 md:mt-8 pt-6 border-t border-white/5 w-full">
            <p className="text-[9px] md:text-[10px] text-slate-400 font-medium leading-relaxed">
              Use seus pontos para obter descontos exclusivos <br className="hidden md:block" /> em seus próximos pedidos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* HISTÓRICO DE MOVIMENTAÇÕES */}
      {/* ✅ Atualizado md:rounded-4xl conforme sugestão do Tailwind */}
      <Card className="lg:col-span-2 rounded-3xl md:rounded-4xl border-slate-100 shadow-sm overflow-hidden bg-white flex flex-col">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 shrink-0">
          <CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
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
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-[11px] md:text-[13px] uppercase tracking-tighter italic truncate">
                          {entry.description || entry.reason || (isEarned ? "Crédito de Pontos" : "Resgate")}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {formatDate(entry.createdAt || entry.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "font-black text-xs md:text-sm italic tabular-nums shrink-0 ml-4 px-3 py-1 rounded-lg border",
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