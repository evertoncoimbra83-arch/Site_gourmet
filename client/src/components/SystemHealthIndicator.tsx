import React from "react"; // ✅ Removido useMemo não utilizado
import { trpc } from "@/_core/trpc";
import { Database, Server, AlertCircle, CheckCircle2 } from "lucide-react";

export function SystemHealthIndicator() {
  // ✅ Busca o status do backend a cada 30 segundos
  const { data, isLoading, error } = trpc.admin.health.checkStatus.useQuery(undefined, {
    refetchInterval: 30000, 
    retry: 1,
  });

  const isDbOnline = data?.components?.find(c => c.id === "database")?.status === "online";

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-left">
      {/* Indicador de API */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex h-2 w-2">
           <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLoading ? 'bg-slate-400' : 'bg-emerald-400'}`}></span>
           <span className={`relative inline-flex rounded-full h-2 w-2 ${isLoading ? 'bg-slate-500' : 'bg-emerald-500'}`}></span>
        </div>
        <Server size={14} className="text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">API</span>
      </div>

      <div className="h-3 w-px bg-slate-200" />

      {/* Indicador de Banco de Dados */}
      <div className="flex items-center gap-1.5">
        {isDbOnline ? (
          <CheckCircle2 size={14} className="text-emerald-500" />
        ) : (
          <AlertCircle size={14} className="text-red-500 animate-pulse" />
        )}
        <Database size={14} className="text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DB</span>
      </div>

      {/* Mensagem de Erro Crítico */}
      {error && (
        <span className="text-[9px] text-red-500 font-black uppercase tracking-tighter animate-bounce">
          Offline
        </span>
      )}
    </div>
  );
}