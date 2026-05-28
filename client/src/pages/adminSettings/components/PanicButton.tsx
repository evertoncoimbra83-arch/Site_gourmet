// client/src/pages/adminSettings/components/PanicButton.tsx
import React from "react";
import { trpc } from "@/_core/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { getAdminMutationErrorMessage } from "@/lib/admin-mutation-error";
import { cn } from "@/lib/utils";
import { requestStrongConfirmation, StrongConfirmationPayload } from "@/lib/strong-confirmation";

interface PublicSettings {
  emergencyMode: boolean;
}

interface ToggleResult {
  newState: boolean;
}

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
      }) => { mutate: (input: { enabled: boolean } & StrongConfirmationPayload) => void; isPending: boolean };
    };
  };
}

export function PanicButton() {
  const utils = trpc.useUtils();

  const publicApi = (trpc.public as unknown) as PublicRouter;
  const adminApi = (trpc.admin as unknown) as AdminStoreRouter;

  const { data: config, isLoading } = publicApi.getPublicSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false
  });

  const isEmergency = !!config?.emergencyMode;

  const mutation = adminApi.storeSettings.toggleEmergency.useMutation({
    onSuccess: (result) => {
      const publicUtils = (utils.public as unknown) as { getPublicSettings: { invalidate: () => void } };
      publicUtils.getPublicSettings.invalidate();

      try {
        const adminUtils = (utils.admin as unknown) as { storeSettings: { get: { invalidate: () => void } } };
        if (adminUtils?.storeSettings?.get) {
          adminUtils.storeSettings.get.invalidate();
        }
      } catch {
        // Ignora contexto órfão silenciosamente
      }

      toast(result.newState ? "Mecanismo de Emergência Ativado" : "Sistema Normalizado", {
        description: result.newState
          ? "As vendas foram suspensas em todo o sistema."
          : "A loja voltou a operar normalmente.",
      });
    },
    onError: (err) => {
      toast.error("Falha na transação", {
        description: getAdminMutationErrorMessage(err, "Falha ao alterar modo de emergencia.")
      });
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center p-8 bg-white border border-slate-200 rounded-[2rem]">
      <Loader2 className="animate-spin text-slate-400" size={18} />
    </div>
  );

  return (
    <Card className={cn(
      "rounded-[2rem] border border-slate-200 transition-all duration-500 overflow-hidden text-left bg-white",
      isEmergency
        ? "border-red-500 bg-red-50/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
        : "shadow-sm"
    )}>
      <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-center justify-between text-left">
        <div className="flex gap-4 items-center text-left">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
            isEmergency ? "bg-red-600 text-white animate-pulse" : "bg-slate-100 text-slate-400"
          )}>
            {isEmergency ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div className="text-left">
            <h3 className={cn(
              "font-black uppercase italic tracking-tighter text-left text-sm md:text-base",
              isEmergency ? "text-red-600" : "text-slate-900"
            )}>
              Kernel: {isEmergency ? "Emergency Mode" : "Shield Active"}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left mt-0.5">
              {isEmergency ? "Vendas bloqueadas pelo administrador" : "Proteção ativa e sistema online"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => {
            const confirmMsg = isEmergency 
              ? "Deseja realmente NORMALIZAR o sistema e reativar todas as vendas?" 
              : "ATENÇÃO: Deseja realmente ATIVAR o Modo de Emergência? Isso irá suspender todas as vendas imediatamente!";
            const confirmation = requestStrongConfirmation(confirmMsg);
            if (!confirmation) return toast.warning("Confirmacao forte cancelada.");
            mutation.mutate({ enabled: !isEmergency, ...confirmation });
          }}
          variant={isEmergency ? "destructive" : "default"}
          disabled={mutation.isPending}
          className={cn(
            "h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 w-full sm:w-auto shrink-0",
            isEmergency
              ? "bg-red-600 hover:bg-red-700 text-white border-none"
              : "bg-slate-900 hover:bg-slate-950 text-white"
          )}
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={14} /> : (isEmergency ? "Desativar" : "Ativar")}
        </Button>
      </CardContent>
    </Card>
  );
}
