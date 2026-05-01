// client/src/pages/aiDashboard/logic/useAiDashboardLogic.ts

import { trpc } from "@/_core/trpc";
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { useAuth } from "@/_core/hooks/useAuth"; 

export function useAiDashboardLogic() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { user } = useAuth(); 

  // 1. Busca o saldo real de créditos de IA no banco de dados
  // ✅ ESSENCIAL: É isso que vai travar o botão de scan na View
  const aiStatusQuery = trpc.ai.getAiStatus.useQuery(undefined, {
    staleTime: 1000 * 60 * 2, // 2 minutos de cache para o saldo
  });

  // 2. Busca histórico de scans do usuário
  const scansQuery = trpc.ai.getUserScans.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, 
  });

  // 3. Mutation para arquivar/deletar (Apenas Admin)
  const deleteMutation = trpc.ai.archiveAndDeleteScan.useMutation({
    onMutate: () => {
      toast.loading("Removendo registro...", { id: "delete-scan" });
    },
    onSuccess: () => {
      toast.success("Registro removido com sucesso.", { id: "delete-scan" });
      utils.ai.getUserScans.invalidate();
      utils.nutri.getDashboard.invalidate(); 
    },
    onError: (err) => {
      toast.error(`Erro ao remover: ${err.message}`, { id: "delete-scan" });
    }
  });

  const handleOpenScan = (taskId: string) => {
    navigate(`/resultado-scanner?taskId=${taskId}`);
  };

  /**
   * 🛡️ Função de Delete com trava de segurança (Admin Only)
   */
  const handleDeleteScan = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (user?.role !== "admin") {
      toast.error("Apenas administradores podem remover mapeamentos históricos.");
      return;
    }

    if (confirm("Tem certeza que deseja arquivar e remover esta análise permanentemente?")) {
      deleteMutation.mutate({ id });
    }
  };

  return {
    // Dados de Histórico
    scans: scansQuery.data || [],
    isLoading: scansQuery.isLoading || aiStatusQuery.isLoading,
    
    // ✅ Dados de Créditos/Tokens
    credits: aiStatusQuery.data?.credits ?? 0,
    isAdmin: aiStatusQuery.data?.isAdmin ?? (user?.role === "admin"),
    
    // Ações
    isDeleting: deleteMutation.isPending,
    handleOpenScan,
    handleDeleteScan,
    navigate,
    
    userRole: user?.role
  };
}