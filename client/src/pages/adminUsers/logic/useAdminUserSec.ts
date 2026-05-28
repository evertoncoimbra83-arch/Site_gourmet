// e:/IA/projects/Site_React/client/src/pages/adminUsers/logic/useAdminUserSec.ts

import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { useToast } from "@/components/ui/use-toast";

// ✅ FIX 20: Interface para evitar o uso de 'any' na checagem do banco
interface UserSecurityDetails {
  needsPasswordReset?: number | boolean;
  [key: string]: unknown;
}

export function useAdminUserSec(userId: string | number | null) {
  const [pw, setPw] = useState("");
  const [forceReset, setForceReset] = useState(false); // ✅ Novo estado para o Toggle
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // 1. Busca os detalhes para sincronizar o estado inicial do Toggle
  const { data: userDetails } = trpc.admin.users.getDetails.useQuery(
    { id: String(userId || "") },
    { enabled: !!userId }
  );

  // 2. Sincroniza o valor do banco com o estado local
  useEffect(() => {
    if (userDetails) {
      // ✅ FIX 20: Cast para a interface local em vez do tipo proibido
      const details = userDetails as UserSecurityDetails;
      const needsReset = details.needsPasswordReset;
      setForceReset(needsReset === 1 || needsReset === true);
    }
  }, [userDetails]);

  // 3. Mutation para Redefinir Senha
  const setPwMut = trpc.admin.users.setPassword.useMutation({
    onSuccess: () => {
      toast("Sucesso: A senha do usuário foi redefinida.");
      setPw("");
      if (userId) {
        utils.admin.users.getDetails.invalidate({ id: String(userId) });
        utils.admin.users.list.invalidate();
      }
    },
    onError: (err) => {
      toast(`Erro: ${err.message || "Falha ao conectar com o servidor."}`);
    }
  });

  // 4. ✅ NOVA Mutation para Atualizar o Status de Reset
  const updateMut = trpc.admin.users.update.useMutation({
    onSuccess: () => {
      toast("Configuração de segurança atualizada.");
      if (userId) utils.admin.users.getDetails.invalidate({ id: String(userId) });
    },
    onError: (err) => {
      setForceReset(!forceReset); // Reverte o visual em caso de erro
      toast(`Erro: ${err.message}`);
    }
  });

  const handleSubmit = () => {
    if (!userId) {
      toast("Erro: ID do usuário não encontrado.");
      return;
    }
    if (pw.trim().length < 8) {
      toast("Erro: A senha deve ter no minimo 8 caracteres.");
      return;
    }
    setPwMut.mutate({ 
      userId: String(userId), 
      password: pw 
    });
  };

  // 5. ✅ Função para tratar a mudança do Toggle
  const handleToggleReset = (checked: boolean) => {
    if (!userId) return;
    setForceReset(checked);
    
    // ✅ FIX 74: Removida a diretiva inutilizada e aplicado o cast via Parameters
    updateMut.mutate({
      id: String(userId),
      needsPasswordReset: checked ? 1 : 0
    } as Parameters<typeof updateMut.mutate>[0]);
  };

  return {
    pw,
    setPw,
    forceReset,           // ✅ Exportando para o componente
    handleToggleReset,    // ✅ Exportando para o componente
    isUpdatingReset: updateMut.isPending, // ✅ Para desabilitar o Switch enquanto salva
    isLoading: setPwMut.isPending,
    handleSubmit
  };
}

