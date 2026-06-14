// client/src/pages/adminAnalytics/logic/useAdminAnalytics.ts

import { useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { keepPreviousData } from "@tanstack/react-query"; // ✅ Melhor forma de reter dados antigos
import { usePeriod, type SelectedPeriod } from "./usePeriod";

// ========================================================
// 🛡️ TIPAGENS ESTRITAS
// ========================================================

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export interface AnalyticsData {
  financials: {
    netRevenue: number;
    grossRevenue: number;
  };
  avgTicket: number;
  totalGivenDiscounts: number;
  newCustomers: number;
  chartData: {
    date: string;
    Faturamento: number;
    Pedidos: number;
    Ticket: number;
    Clientes: number;
    Descontos: number;
  }[];
  topDishes: { dishId: number; name: string; count: number }[];
  topAccompaniments: { name: string; count: number }[]; 
  paymentMethods: { name: string; value: number; count: number }[];
  discountBreakdown: { name: string; value: number }[];
  topCoupons: { 
    coupon: string; 
    usage_count: number; 
    total_discounted: number 
  }[];
  topDishesInPackages: { dishId: number; name: string; count: number }[];
  metadata?: {
    periodLabel: string;
    startDate: string;
    endDate: string;
    timezone: string;
  };
}

import { formatters } from "../utils/formatters";
export { formatters };

// ========================================================
// 🧠 HOOK DE LÓGICA
// ========================================================

export function useAdminAnalytics() {
  const utils = trpc.useUtils();
  const [period, setPeriod] = usePeriod();

  // 1. Busca de dados via tRPC
  const { data, isLoading, isPlaceholderData, refetch } = trpc.admin.analytics.getDashboardStats.useQuery(
    { 
      preset: period.preset,
      startDate: period.startDate,
      endDate: period.endDate,
    },
    { 
      staleTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData, // ✅ Substitui o hack do @ts-expect-error
    }
  );

  // 2. Mutação de Sincronização
  const syncMutation = trpc.admin.analytics.syncHistory.useMutation({
    onMutate: () => {
      toast.loading("Sincronizando histórico de vendas...", { id: "sync-bi" });
    },
    onSuccess: (res) => {
      toast.success(`BI Atualizado! ${res.processed} pedidos enviados para fila.`, { id: "sync-bi" });
      utils.admin.analytics.getDashboardStats.invalidate();
    },
    onError: (err) => {
      // O tRPC já entrega o err.message nativamente sem precisar de hack
      toast.error("Erro na sincronização: " + err.message, { id: "sync-bi" });
    }
  });

  // ✅ Cast limpo, garantindo que a view sempre receba a interface correta
  const stats = useMemo(() => data as AnalyticsData | undefined, [data]);

  return {
    stats, 
    isLoading,
    isPlaceholderData,
    refetch,
    
    period,
    setPeriod,
    
    syncHistory: () => syncMutation.mutate(),
    isSyncing: syncMutation.isPending,
    
    formatters
  };
}