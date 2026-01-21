import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/components/ui/use-toast";

export function useAdminUsers() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // IDs no seu sistema são Strings (CuidId)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const utils = trpc.useUtils();
  const debouncedSearch = useDebounce(searchTerm, 500);

  const limit = 20;

  // 1. Listagem Principal (Usada tanto para a tabela quanto para buscas)
  // ✅ Este é o procedimento que o OrderDetailsDrawer deve usar
  const { data, isLoading } = trpc.admin.users.list.useQuery({ 
    page, 
    limit, 
    // Garante que a busca só dispare com 3 ou mais caracteres
    search: debouncedSearch && debouncedSearch.length >= 3 ? debouncedSearch : undefined 
  }, {
    // Mantém os dados na tela enquanto carrega a próxima página (melhora UX)
    placeholderData: (previousData) => previousData,
  });

  // 2. Detalhes do Usuário
  const { 
    data: userDetails, 
    isLoading: isLoadingDetails 
  } = trpc.admin.users.getDetails.useQuery(
    { id: String(selectedUserId!) }, 
    { 
      enabled: !!selectedUserId,
    }
  );

  // 3. Mutação de Deleção
  // ✅ Ajustado para usar a sintaxe correta do seu router
  const deleteMutation = (trpc.admin.users as any).delete?.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido");
      utils.admin.users.list.invalidate();
      setSelectedUserId(null);
    },
    onError: (err: any) => toast.error("Erro: " + err.message)
  });

  // 4. Mutação de Atualização
  const updateMutation = trpc.admin.users.update.useMutation({
    onSuccess: () => {
      toast.success("Dados atualizados!");
      utils.admin.users.list.invalidate();
      if (selectedUserId) {
        utils.admin.users.getDetails.invalidate({ id: selectedUserId });
      }
    },
    onError: (err) => toast.error("Erro: " + err.message)
  });

  return {
    state: { 
      page, 
      searchTerm, 
      selectedUserId, 
      isCreateDialogOpen, 
      isLoading: isLoading || updateMutation.isPending, 
      isLoadingDetails 
    },
    actions: { 
      setPage, 
      setSearchTerm, 
      setSelectedUserId, 
      setIsCreateDialogOpen 
    },
    data: { 
      users: data?.items || [], 
      totalCount: data?.total || 0,
      userDetails,
      limit
    },
    mutations: { 
      deleteUser: deleteMutation, 
      updateUser: updateMutation
    }
  };
}