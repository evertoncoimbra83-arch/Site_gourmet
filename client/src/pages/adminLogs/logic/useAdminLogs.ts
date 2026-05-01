// src/pages/adminLogs/logic/useAdminLogs.ts
import { trpc } from "@/_core/trpc";
import { useMemo, useState } from "react";

/**
 * Interface para garantir tipagem segura dentro do hook
 */
export interface AdminLog {
  id: number | string;
  action: string;
  createdAt: string | Date;
  ipAddress: string | null;
  user: {
    name: string | null;
    email: string | null;
  } | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

export function useAdminLogs(limit = 100) {
  const utils = trpc.useUtils();
  
  // ✅ Estado para controlar qual log está sendo inspecionado no painel lateral
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

  // 📡 Query principal para buscar os logs da base
  const { data: logs, isLoading, isRefetching } = trpc.admin.logs.list.useQuery(
    { limit },
    {
      staleTime: 1000 * 60, // 1 minuto de cache antes de considerar 'velho'
      retry: false,
    }
  );

  /**
   * ✅ DASHBOARD STATS: Processamento memoizado para performance.
   * Transforma os dados brutos em indicadores para o Header da View.
   */
  const stats = useMemo(() => {
    if (!logs) return { auth: 0, updates: 0, security: 0, total: 0 };
    
    return {
      auth: logs.filter((l) => l.action.includes("AUTH") || l.action.includes("LOGIN")).length,
      updates: logs.filter((l) => l.action.includes("UPDATE") || l.action.includes("SAVE")).length,
      security: logs.filter((l) => l.action.includes("PASSWORD") || l.action.includes("PERMISSION")).length,
      total: logs.length,
    };
  }, [logs]);

  /**
   * ✅ ACTIONS: Encapsulamento de funções de manipulação de dados
   */
  const actions = {
    // Atualiza a lista manualmente (Refresh button)
    refresh: () => {
      utils.admin.logs.list.invalidate();
    },
    
    // Seleciona um log para ver o "Antes e Depois" no painel lateral
    selectLog: (log: AdminLog) => {
      setSelectedLog(log);
    },
    
    // Limpa a seleção (fecha o painel lateral)
    clearSelection: () => {
      setSelectedLog(null);
    }
  };

  return {
    // Dados e Estados de carregamento
    logs: (logs as AdminLog[]) || [],
    isLoading,
    isRefetching,
    
    // Indicadores do mini dashboard
    stats,
    
    // Estado de UI
    state: {
      selectedLog
    },
    
    // Funções disparáveis
    actions
  };
}