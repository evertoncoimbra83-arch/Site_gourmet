import { trpc } from "@/_core/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function PanicButton() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.admin.storeSettings.get.useQuery();
  
  // Debug visual do que chegou do banco
  const isEmergency = !!(config as any)?.emergencyMode;
  
  const mutation = trpc.admin.storeSettings.toggleEmergency.useMutation({
    onSuccess: (result) => {
      console.log("✅ [FRONT] Sucesso! Servidor respondeu:", result);
      
      utils.admin.storeSettings.get.invalidate();
      if (utils.public?.shipping?.getSettings) {
        utils.public.shipping.getSettings.invalidate();
      }
      toast.success("Comando enviado com sucesso.");
    },
    onError: (err) => {
      console.error("❌ [FRONT] Erro no envio:", err);
      toast.error("Erro: " + err.message);
    }
  });

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <Card className={`border-2 ${isEmergency ? "bg-red-50 border-red-500" : "bg-slate-50"}`}>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex gap-4 items-center">
          {isEmergency ? <AlertTriangle className="text-red-600" /> : <ShieldCheck />}
          <div>
            <h3 className="font-bold">MODO PÂNICO: {isEmergency ? "ATIVADO" : "DESATIVADO"}</h3>
            <p className="text-xs text-slate-500">Valor lido do DB: {String(isEmergency)}</p>
          </div>
        </div>

        <Button
          onClick={() => {
            const valorParaEnviar = !isEmergency;
            
   
            mutation.mutate(valorParaEnviar);
          }}
          variant={isEmergency ? "destructive" : "default"}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Enviando..." : (isEmergency ? "DESATIVAR" : "ATIVAR")}
        </Button>
      </CardContent>
    </Card>
  );
}