import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";
// ✅ IMPORTANTE: Importar o helper do TanStack Query
import { keepPreviousData } from "@tanstack/react-query";

export const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Preparando",
  completed: "Concluído",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export function useAdminOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // IDs costumam ser strings (UUID) ou number. Deixei string | null para cobrir ambos.
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const limit = 20;
  const utils = trpc.useUtils();

  // 1. QUERY DE LISTAGEM
  const ordersQuery = trpc.admin.orders.list.useQuery(
    {
      page,
      limit,
      search: search.length >= 3 ? search : undefined,
    },
    {
      // ✅ CORREÇÃO: Substitui 'keepPreviousData: true' por isso:
      placeholderData: keepPreviousData,
    }
  );

  // 2. MUTAÇÃO: ATUALIZAR STATUS
  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.orders.list.invalidate();
      if (selectedOrderId) {
        utils.admin.orders.getById.invalidate({ id: selectedOrderId });
      }
      toast.success("Status atualizado!");
    },
    onError: (err) => toast.error("Erro ao atualizar status: " + err.message),
  });

  // 3. MUTAÇÃO: ATUALIZAR PEDIDO (Edição completa)
  // Casting 'as any' para evitar erro caso o backend ainda não tenha atualizado o tipo
  const updateOrder = (trpc.admin.orders as any).updateOrder?.useMutation({
    onSuccess: () => {
      utils.admin.orders.list.invalidate();
      if (selectedOrderId) {
        utils.admin.orders.getById.invalidate({ id: selectedOrderId });
      }
      toast.success("Pedido atualizado!");
    },
    onError: (err: any) => toast.error("Erro ao salvar: " + err.message),
  });

  // 4. MUTAÇÃO: DELETAR PEDIDO
  const deleteOrder = trpc.admin.orders.delete.useMutation({
    onSuccess: () => {
      utils.admin.orders.list.invalidate();
      if (selectedOrderId) setSelectedOrderId(null);
      toast.success("Pedido removido.");
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message),
  });

  const handleSetSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return {
    orders: ordersQuery.data?.orders || [],
    meta: ordersQuery.data?.meta || { totalItems: 0, totalPages: 0, currentPage: 1 },
    
    state: {
      isLoading: ordersQuery.isLoading,
      isFetching: ordersQuery.isFetching,
      search,
      page,
      selectedOrderId,
    },
    actions: {
      setSearch: handleSetSearch,
      setPage,
      setSelectedOrderId,
    },
    mutations: {
      updateStatus,
      deleteOrder,
      updateOrder, 
    },
  };
}