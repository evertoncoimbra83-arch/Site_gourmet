// e:/IA/projects/Site_React/client/src/pages/adminUsers/components/UserTabs/SecurityTab.tsx

import React, { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; 
import { Lock, ShieldAlert, Loader2, KeyRound } from "lucide-react";

// ✅ FIX 24: Interface para evitar o uso de 'any' e tipar o campo de reset
interface UserSecurityDetails {
  needsPasswordReset?: number | boolean;
  [key: string]: unknown;
}

export function SecurityTab({ userId }: { userId: string | null }) {
  const [pw, setPw] = useState("");
  const [forceReset, setForceReset] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // 1. Busca os detalhes atuais
  const { data: userDetails } = trpc.admin.users.getDetails.useQuery(
    { id: userId || "" },
    { enabled: !!userId }
  );

  // 2. Sincroniza o toggle com tipagem segura
  useEffect(() => {
    if (userDetails) {
      const details = userDetails as UserSecurityDetails;
      const needsReset = details.needsPasswordReset;
      setForceReset(needsReset === 1 || needsReset === true);
    }
  }, [userDetails]);

  // 3. Mutation para Redefinir Senha
  const setPwMut = trpc.admin.users.setPassword.useMutation({
    onSuccess: () => {
      toast("Sucesso: A senha foi redefinida.");
      setPw("");
      if (userId) utils.admin.users.getDetails.invalidate({ id: userId });
    },
    onError: (err) => toast(`Erro: ${err.message}`)
  });

  // 4. Mutation para Alternar o "Forçar Troca de Senha"
  const updateMut = trpc.admin.users.update.useMutation({
    onSuccess: () => {
      toast("Configuração atualizada com sucesso.");
      if (userId) utils.admin.users.getDetails.invalidate({ id: userId });
    },
    onError: (err) => {
      setForceReset(!forceReset); 
      toast(`Erro ao atualizar: ${err.message}`);
    }
  });

  const handlePasswordReset = () => {
    if (!userId || pw.length < 6) return;
    setPwMut.mutate({ userId, password: pw });
  };

  const handleToggleReset = (checked: boolean) => {
    if (!userId) return;
    setForceReset(checked);
    
    // ✅ FIX 64: Removido @ts-expect-error pois agora o campo está tipado no cast
    updateMut.mutate({ 
      id: userId, 
      needsPasswordReset: checked ? 1 : 0 
    } as Parameters<typeof updateMut.mutate>[0]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
        <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
          <ShieldAlert size={20} />
        </div>
        <div className="text-left">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1 leading-none">Zona Crítica</h4>
          <p className="text-[11px] font-bold text-amber-700/80 leading-tight uppercase mt-2">
            A alteração de senha desconectará o usuário de todas as sessões.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <KeyRound size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-tight text-slate-900 leading-none">Forçar Troca de Senha</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Exigir nova senha no próximo login</p>
            </div>
          </div>
          <Switch 
            checked={forceReset}
            onCheckedChange={handleToggleReset}
            disabled={updateMut.isPending}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nova Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <Input 
                type="password"
                placeholder="••••••••"
                className="h-16 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-4 focus-visible:ring-slate-100 transition-all outline-none"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handlePasswordReset}
            disabled={setPwMut.isPending || pw.length < 6}
            className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all disabled:opacity-30"
          >
            {setPwMut.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar Nova Senha"}
          </Button>
        </div>
      </div>
    </div>
  );
}