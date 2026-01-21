import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const formatDate = (date: any) => 
  date ? new Date(date).toLocaleDateString("pt-BR") : "-";

export function LoyaltyTab({ loyalty, history }: { loyalty: any, history: any[] }) {
  // ✅ REVISÃO CRÍTICA: O tRPC muitas vezes encapsula o retorno em um objeto 'data'
  // Tentamos todas as combinações possíveis para não vir zerado
  const totalPoints = 
    loyalty?.points ?? 
    loyalty?.balance ?? 
    loyalty?.loyaltyBalance ?? 
    loyalty?.totalPoints ?? 
    0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
      
      {/* CARD DE SALDO TOTAL */}
      <Card className="md:col-span-1 rounded-4xl bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center min-h-62.5 shadow-xl shadow-slate-200 border-none">
          <div className="bg-[#D4AF37]/20 p-4 rounded-full mb-4 ring-8 ring-[#D4AF37]/5">
            <Star className="h-8 w-8 text-[#D4AF37] fill-[#D4AF37]" />
          </div>
          
          {/* O valor dos pontos com animação de leitura rápida */}
          <div className="flex flex-col items-center">
            <h3 className="text-7xl font-black mb-1 italic tracking-tighter text-[#D4AF37]">
              {totalPoints}
            </h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Pontos Acumulados
            </p>
          </div>
      </Card>

      {/* HISTÓRICO DE MOVIMENTAÇÕES */}
      <Card className="md:col-span-2 rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            Extrato de Fidelidade
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!history || history.length === 0 ? (
            <div className="p-20 text-center">
              <Star className="h-10 w-10 text-slate-100 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                Você ainda não possui movimentações.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-100 overflow-y-auto">
              {history.map((entry: any, i: number) => {
                // ✅ MAPEAMENTO DE PONTOS: Garante que pontos positivos ou negativos apareçam
                const pts = Number(entry.pointsChange || entry.points || entry.amount || 0);
                const isEarned = pts > 0;

                return (
                  <div key={i} className="p-5 flex justify-between items-center hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-xl",
                        isEarned ? "bg-green-50" : "bg-red-50"
                      )}>
                        {isEarned ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-[12px] uppercase tracking-tighter italic">
                          {entry.description || entry.reason || (isEarned ? "Crédito de Pontos" : "Resgate de Pontos")}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                          {formatDate(entry.createdAt || entry.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "font-black text-sm italic tabular-nums",
                      isEarned ? "text-green-600" : "text-red-500"
                    )}>
                      {isEarned ? '+' : ''}{pts} 
                      <span className="text-[10px] uppercase ml-1">pts</span>
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