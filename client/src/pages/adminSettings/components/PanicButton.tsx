import React from "react"; // ✅ Adicionado para escopo JSX
import { trpc } from "@/_core/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast"; // ✅ Ajustado para Sonner (padrão do sistema)

// --- INTERFACES ---

interface PublicSettings {
  emergencyMode: boolean;
}

interface ToggleResult {
  newState: boolean;
}

// Tipagem segura para evitar 'as any' nos roteadores tRPC
interface PublicRouter {
  getPublicSettings: { 
    useQuery: (input: undefined, opts?: object) => { data?: PublicSettings; isLoading: boolean } 
  };
}

interface AdminStoreRouter {
  storeSettings: {
    toggleEmergency: {
      useMutation: (opts: { 
        onSuccess: (data: ToggleResult) => void; 
        onError: (err: { message: string }) => void 
      }) => { mutate: (newState: boolean) => void; isPending: boolean };
    };
  };
}

export function PanicButton() {
  const utils = trpc.useUtils();
  
  // ✅ Cast via unknown para segurança total contra ESLint
  const publicApi = (trpc.public as unknown) as PublicRouter;
  const adminApi = (trpc.admin as unknown) as AdminStoreRouter;

  const { data: config, isLoading } = publicApi.getPublicSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false
  });
  
  const isEmergency = !!config?.emergencyMode;
  
  const mutation = adminApi.storeSettings.toggleEmergency.useMutation({
    onSuccess: (result) => {
      // ✅ Invalidação segura
      const publicUtils = (utils.public as unknown) as { getPublicSettings: { invalidate: () => void } };
      publicUtils.getPublicSettings.invalidate();
      
      try {
        const adminUtils = (utils.admin as unknown) as { storeSettings: { get: { invalidate: () => void } } };
        if (adminUtils?.storeSettings?.get) {
           adminUtils.storeSettings.get.invalidate();
        }
      } catch {
        // Ignora se não houver contexto de admin
      }

      toast(result.newState ? "Mecanismo de Emergência Ativado" : "Sistema Normalizado", {
        description: result.newState 
          ? "As vendas foram suspensas em todo o sistema." 
          : "A loja voltou a operar normalmente.",
      });
    },
    onError: (err) => {
      toast.error("Falha na transação", {
        description: err.message
      });
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center p-8 text-left">
      <Loader2 className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <Card className={`rounded-[2rem] border-2 transition-all duration-500 overflow-hidden text-left ${
      isEmergency 
        ? "bg-red-50 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]" 
        : "bg-white border-slate-100 shadow-sm"
    }`}>
      <CardContent className="p-6 flex items-center justify-between text-left">
        <div className="flex gap-4 items-center text-left">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
            isEmergency ? "bg-red-600 text-white animate-pulse" : "bg-slate-100 text-slate-400"
          }`}>
            {isEmergency ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div className="text-left">
            <h3 className={`font-black uppercase italic tracking-tighter text-left ${isEmergency ? "text-red-600" : "text-slate-900"}`}>
              Kernel: {isEmergency ? "Emergency Mode" : "Shield Active"}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
              {isEmergency ? "Vendas bloqueadas pelo administrador" : "Proteção ativa e sistema online"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => mutation.mutate(!isEmergency)}
          variant={isEmergency ? "destructive" : "default"}
          disabled={mutation.isPending}
          className={`h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${
            isEmergency 
              ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20 text-white" 
              : "bg-slate-900 hover:bg-black text-white"
          }`}
        >
          {mutation.isPending ? <Loader2 className="animate-spin" /> : (isEmergency ? "Desativar" : "Ativar")}
        </Button>
      </CardContent>
    </Card>
  );
}