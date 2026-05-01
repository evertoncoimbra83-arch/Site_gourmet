import { useState, useCallback } from "react";
import { trpc } from "@/_core/trpc";
import { keepPreviousData } from "@tanstack/react-query";
import { appToast as toast } from "@/lib/app-toast";

export const statusLabels: Record<string, string> = {
  pending: "Pendente",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  completed: "Concluído",
};

interface OrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface OrderListResponse {
  // ✅ FIX: Uso de 'unknown' em vez de 'any' para satisfazer o ESLint
  orders: unknown[]; 
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

export function useAdminOrders() {
  const utils = trpc.useUtils();
  
  // Caminho correto conforme seu backend
  const ordersApi = trpc.admin.ordersAdmin;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});

  const limit = 20;

  // 1. 📋 QUERY DE LISTAGEM
  const ordersQuery = ordersApi.list.useQuery(
    {
      page,
      perPage: limit,
      search: search.trim().length >= 2 ? search.trim() : undefined,
      status: filters.status || undefined,
    },
    {
      placeholderData: keepPreviousData,
      refetchInterval: 30000, 
    }
  );

  // 2. 🔍 QUERY DE DETALHES
  const orderDetailsQuery = ordersApi.getById.useQuery(
    { orderId: selectedOrderId as string },
    { 
      enabled: !!selectedOrderId,
      staleTime: 1000 * 60 * 5,
    }
  );

  /**
   * ✅ MUTATIONS COM REFRESH AUTOMÁTICO
   */
  const updateStatus = ordersApi.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      // Força a atualização da lista e do contador do dashboard
      utils.admin.ordersAdmin.list.invalidate(undefined, { refetchType: 'all' });
      if (selectedOrderId) {
        utils.admin.ordersAdmin.getById.invalidate({ orderId: selectedOrderId });
      }
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message)
  });

  const deleteOrder = ordersApi.deleteOrder.useMutation({
    onMutate: async () => {
      // Cancela buscas em andamento para evitar sobrescrever a UI durante a exclusão
      await utils.admin.ordersAdmin.list.cancel();
    },
    onSuccess: () => {
      toast.success("Pedido removido.");
      setSelectedOrderId(null);
    },
    onSettled: async () => {
      // Garante que a lista suma da tela imediatamente buscando dados novos
      await utils.admin.ordersAdmin.list.invalidate(undefined, { refetchType: 'all' });
      await utils.admin.analytics.getDashboardStats.invalidate();
    },
    onError: (err) => toast.error("Erro ao deletar: " + err.message)
  });

  /**
   * ✅ ACTIONS
   */
  const handleSetSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1); 
  }, []);

  const handleSetFilters = useCallback((newFilters: OrderFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const queryData = ordersQuery.data as OrderListResponse | undefined;

  return {
    orders: queryData?.orders || [],
    meta: queryData?.meta || { totalItems: 0, totalPages: 0, currentPage: 1 },
    selectedOrder: orderDetailsQuery.data, 

    state: {
      isLoading: ordersQuery.isLoading,
      isDetailsLoading: orderDetailsQuery.isLoading,
      isFetching: ordersQuery.isFetching,
      search,
      page,
      filters,
      selectedOrderId,
    },
    actions: {
      setSearch: handleSetSearch,
      setPage,
      setFilters: handleSetFilters,
      clearFilters: () => {
        setFilters({});
        setPage(1);
      },
      setSelectedOrderId,
      refetch: () => ordersQuery.refetch(),
    },
    mutations: {
      updateStatus,
      deleteOrder
    },
  };
}