// client/src/pages/adminSettings/components/LoyaltyAutomationCard.tsx
import React from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

export function LoyaltyAutomationCard() {
  const mutation = trpc.admin.loyalty.runManualExpiration.useMutation({
    onSuccess: (data: { processedUsers: number }) => {
      toast.success(`Sucesso! ${data.processedUsers} usuários afetados pelo fechamento.`);
    },
    onError: (err: { message: string }) => {
      toast.error("Erro na automação: " + err.message);
    }
  });

  return (
    <Card className="p-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 text-left w-full">
      <div className="flex items-center justify-between text-left gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 text-left">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Clock size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-black uppercase italic tracking-tighter text-slate-900 leading-none text-left text-sm md:text-base">Rotinas de Fidelidade</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">Cron Job: 03:00 AM</p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-100 bg-emerald-50/30 text-emerald-600 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 shrink-0">
          Automático Ativo
        </Badge>
      </div>

      <div className="p-5 bg-slate-50/80 rounded-[2rem] border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4 text-left w-full">
        <div className="flex items-center gap-4 text-left w-full lg:w-auto">
          <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center shadow-xs border border-slate-100 shrink-0">
            <ShieldCheck className="text-emerald-500" size={20} />
          </div>
          <div className="space-y-0.5 text-left">
            <p className="text-[11px] font-black uppercase text-slate-700 text-left">Vencimento de Pontos</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase max-w-[240px] text-left leading-relaxed">
              Remove pontos expirados que ultrapassaram o limite de validade.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full lg:w-auto h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest shadow-xs transition-all active:scale-95 shrink-0"
        >
          {mutation.isPending ? (
            <Loader2 className="animate-spin mr-2" size={14} />
          ) : (
            <Play size={12} className="mr-2 fill-current" />
          )}
          Executar Agora
        </Button>
      </div>
    </Card>
  );
}