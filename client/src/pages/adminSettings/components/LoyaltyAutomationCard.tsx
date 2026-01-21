import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function LoyaltyAutomationCard() {
  const utils = trpc.useUtils();
  
  const mutation = trpc.admin.loyalty.runManualExpiration.useMutation({
    onSuccess: (data: { processedUsers: number }) => { // ✅ Tipado explicitamente
      toast.success(`Sucesso! ${data.processedUsers} usuários afetados.`);
      // Tente invalidar o caminho correto de listagem se existir
      // utils.admin.loyalty.list.invalidate(); 
    },
    onError: (err: { message: string }) => { // ✅ Tipado explicitamente
      toast.error("Erro na automação: " + err.message);
    }
  });

  return (
    <Card className="p-8 bg-white rounded-[2.5rem] border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-black uppercase italic tracking-tighter text-slate-900 leading-none">Rotinas de Fidelidade</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cron Job: 03:00 AM</p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-100 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
          Automático Ativo
        </Badge>
      </div>

      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="text-emerald-500" size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase text-slate-700">Vencimento de Pontos</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase max-w-[200px]">
              Remove pontos que ultrapassaram o limite de dias.
            </p>
          </div>
        </div>

        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full md:w-auto h-12 px-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
        >
          {mutation.isPending ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : (
            <Play size={14} className="mr-2 fill-current" />
          )}
          Executar Agora
        </Button>
      </div>
    </Card>
  );
}