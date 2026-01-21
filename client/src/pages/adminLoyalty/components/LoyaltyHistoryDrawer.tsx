import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { History, PlusCircle, Loader2, Coins, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoyaltyHistoryDrawer({ 
  open, 
  onClose, 
  customer, 
  history, 
  isLoading, 
  manualPoints, 
  setManualPoints, 
  manualReason, 
  setManualReason, 
  onApply, 
  isPending 
}: any) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-none bg-[#F8FAFC] flex flex-col h-screen outline-none">
        
        {/* HEADER TIPO PAINEL */}
        <div className="p-8 md:p-10 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <History size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Extrato de Fidelidade</span>
          </div>
          <SheetTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic leading-none">
            {customer?.name || "Cliente"}
          </SheetTitle>
          <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 flex items-center gap-2">
            <span className="text-emerald-600">ID:</span> {customer?.email}
          </SheetDescription>
        </div>

        {/* ÁREA DE AJUSTE MANUAL (DESTAQUE) */}
        <div className="p-8 md:p-10 bg-emerald-50/30 border-b border-emerald-100/50 shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <PlusCircle size={16} className="text-emerald-600" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Lançamento Manual</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Pontos</Label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  className="h-14 rounded-2xl bg-white border-none shadow-sm font-black text-xl text-center text-emerald-600 focus:ring-2 focus:ring-emerald-500/10" 
                  value={manualPoints || ""} 
                  onChange={e => setManualPoints(Number(e.target.value))} 
                />
              </div>
              <div className="md:col-span-8 space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Motivo / Descrição</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ex: Bônus de cortesia..." 
                    className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold text-xs uppercase tracking-tight flex-1 focus:ring-2 focus:ring-emerald-500/10" 
                    value={manualReason} 
                    onChange={e => setManualReason(e.target.value)} 
                  />
                  <Button 
                    onClick={onApply} 
                    disabled={isPending || !manualPoints || !manualReason} 
                    className="h-14 px-6 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                  >
                    {isPending ? <Loader2 className="animate-spin" size={18}/> : "Lançar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE MOVIMENTAÇÕES */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 pb-32">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Histórico Recente</span>
            <div className="h-px flex-1 bg-slate-100 ml-4"></div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando transações...</p>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item: any, idx: number) => {
                const isPositive = (item.points || 0) > 0;
                return (
                  <div key={idx} className="group bg-white rounded-3xl p-6 border border-slate-50 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                      )}>
                        {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 uppercase italic tracking-tighter text-sm">
                          {item.description || item.reason}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-tight">
                            {new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "text-lg font-black italic tracking-tighter",
                      isPositive ? "text-emerald-600" : "text-red-500"
                    )}>
                      {isPositive ? "+" : ""}{item.points} <span className="text-[10px] not-italic ml-0.5">PTS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center px-10">
              <Coins className="text-slate-100 mb-4" size={48} />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Sem movimentações registradas para este membro.</p>
            </div>
          )}
        </div>

        {/* RODAPÉ FIXO */}
        <div className="p-8 md:p-10 bg-white border-t border-slate-100 shrink-0">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase text-slate-400 hover:bg-slate-50 transition-all"
          >
            Fechar Extrato
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}