// src/pages/profile/components/OrderTab/OrdersTabLoyalty.tsx (ou o caminho correto do seu arquivo)

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  User,
  AlertCircle,
  Coins,
  Loader2,
  Trash2 // ✅ Importado o ícone da lixeira
} from "lucide-react"; 
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- INTERFACES ---

interface Customer {
  id: number | string;
  name: string;
  email: string;
}

interface LoyaltyTransaction {
  id?: number | string;
  points_change?: number;
  pointsChange?: number;
  reason: string;
  description?: string;
  created_at: string | Date;
  type?: string;
}

interface LoyaltyHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  history: LoyaltyTransaction[];
  isLoading?: boolean;
  onApply?: () => void;
  manualPoints?: number;
  setManualPoints?: (val: number) => void;
  manualReason?: string;
  setManualReason?: (val: string) => void;
  isPending?: boolean;
  onDelete?: (id: number | string) => void; // ✅ Prop adicionada para exclusão (Admin)
}

export function LoyaltyHistoryDrawer({
  open,
  onClose,
  customer,
  history = [],
  isLoading,
  onApply,
  manualPoints,
  setManualPoints,
  manualReason,
  setManualReason,
  isPending,
  onDelete // ✅ Recebendo a prop
}: LoyaltyHistoryDrawerProps) {
  
  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg border-l border-slate-100 p-0 overflow-hidden flex flex-col bg-white">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                <History size={20} />
              </div>
              <div>
                <SheetTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                  Extrato de Pontos
                </SheetTitle>
                <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Histórico detalhado do cliente
                </SheetDescription>
              </div>
            </div>

            {customer && (
              <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-slate-900 truncate">{customer.name}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{customer.email}</p>
                  </div>
                </div>
              </div>
            )}
          </SheetHeader>
        </div>

        {/* AJUSTE MANUAL */}
        <div className="p-6 bg-white border-b border-slate-50">
           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Ajuste Manual de Saldo</Label>
           <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                 <div className="col-span-1">
                    <Input 
                      type="number" 
                      placeholder="PTS" 
                      value={manualPoints ?? ""}
                      onChange={(e) => setManualPoints?.(Number(e.target.value))}
                      className="h-11 rounded-xl font-bold" 
                    />
                 </div>
                 <div className="col-span-2">
                    <Input 
                      placeholder="Motivo (ex: Brinde)" 
                      value={manualReason ?? ""}
                      onChange={(e) => setManualReason?.(e.target.value)}
                      className="h-11 rounded-xl text-xs font-medium" 
                    />
                 </div>
              </div>
              
              <Button 
                onClick={onApply} 
                disabled={isPending || !manualPoints}
                className="w-full h-11 bg-slate-900 text-white hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={14}/>
                    Processando...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2" size={14}/>
                    Aplicar Ajuste
                  </>
                )}
              </Button>
           </div>
        </div>

        {/* LISTA DE TRANSAÇÕES */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Movimentações Recentes</h3>
            <Badge variant="outline" className="rounded-full text-[9px] font-black border-slate-100">
              {safeHistory.length} registros
            </Badge>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-emerald-500" size={24} />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Carregando histórico...</p>
            </div>
          ) : safeHistory.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-[2rem] flex flex-col items-center gap-3">
              <AlertCircle size={32} className="text-slate-200" />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeHistory.map((item, idx) => {
                const isPositive = (item.points_change ?? 0) > 0 || (item.pointsChange ?? 0) > 0;
                const points = Math.abs(item.points_change || item.pointsChange || 0);

                return (
                  <div key={item.id || idx} className="group relative flex items-start gap-4 p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-emerald-100 transition-all">
                    <div className={cn(
                      "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border",
                      isPositive 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2 mb-0.5">
                        <p className="text-[11px] font-black uppercase text-slate-800 truncate leading-tight mt-0.5">
                          {item.reason || 'Movimentação de Pontos'}
                        </p>
                        {/* ✅ Container flex para os pontos e botão de excluir */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "text-xs font-black italic",
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {isPositive ? '+' : '-'}{points}
                          </span>
                          
                          {/* ✅ Botão de excluir só aparece se onDelete foi passado */}
                          {onDelete && item.id && (
                            <button
                              onClick={() => onDelete(item.id!)}
                              className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Excluir registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {item.description && (
                        <p className="text-[10px] text-slate-400 font-medium leading-tight mb-2 italic">
                          &quot;{item.description}&quot;
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1.5">
                         <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                            <Calendar size={10} />
                            {item.created_at ? format(new Date(item.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}
                         </div>
                         {item.type && (
                            <Badge className="h-4 text-[8px] font-black uppercase bg-slate-200 text-slate-500 rounded border-none">
                               {item.type}
                            </Badge>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}