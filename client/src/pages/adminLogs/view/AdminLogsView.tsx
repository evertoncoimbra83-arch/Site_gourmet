// client/src/pages/adminLogs/view/AdminLogsView.tsx
import React from "react";
import { useAdminLogs } from "../logic/useAdminLogs";
import { LogChangeDetail } from "../components/LogChangeDetail";
import { LogInspector } from "../components/LogInspector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User as UserIcon, Activity, Loader2, Globe, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Movido da flat page AdminLogs.tsx para cá (era a única diferença visual relevante)
function getActionBadge(action: string) {
  const act = action.toUpperCase();
  if (act.includes("AUTH"))      return <Badge className="bg-blue-500 border-none hover:bg-blue-600">AUTENTICAÇÃO</Badge>;
  if (act.includes("PASSWORD"))  return <Badge className="bg-amber-500 border-none hover:bg-amber-600">SEGURANÇA</Badge>;
  if (act.includes("ORDER"))     return <Badge className="bg-emerald-500 border-none hover:bg-emerald-600">PEDIDO</Badge>;
  if (act.includes("MARKETING")) return <Badge className="bg-orange-500 border-none hover:bg-orange-600">MARKETING</Badge>;
  return (
    <Badge variant="outline" className="text-[10px] uppercase font-bold">
      {action.replace("AUTO_LOG_", "").replace(/_/g, " ")}
    </Badge>
  );
}

export function AdminLogsView() {
  // ✅ limit=50 alinhado com o que a flat page usava
  const { logs, isLoading, isRefetching, stats, state, actions } = useAdminLogs(50);

  if (isLoading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Sincronizando Histórico...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-slate-200">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
              Auditoria <span className="text-slate-300">do</span> Sistema
            </h2>
          </div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest ml-12">
            Rastreamento de integridade e ações administrativas
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <Activity size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase text-slate-400">Total: {stats.total}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            disabled={isRefetching}
            onClick={() => actions.refresh()}
            className="h-11 w-11 rounded-xl border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
          >
            <RefreshCcw size={18} className={cn(isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none hover:bg-transparent h-16">
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 pl-8">Data/Hora</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Usuário</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Ação</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Origem (IP)</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 pr-8">Mudanças Efetuadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => actions.selectLog(log)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-all border-slate-50 group"
                >
                  <TableCell className="pl-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 leading-none tracking-tighter">
                        {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase">
                        {new Date(log.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-colors">
                        <UserIcon size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 leading-none">{log.user?.name || "Sistema"}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{log.user?.email || "Ação Automatizada"}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{getActionBadge(log.action)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Globe size={12} className="text-slate-300" />
                      <span className="text-[10px] font-mono font-bold tracking-tight">
                        {log.ipAddress || "Interno"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="pr-8">
                    <LogChangeDetail
                      action={log.action}
                      oldValues={log.oldValues}
                      newValues={log.newValues}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Activity className="text-slate-100" size={80} />
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Nenhum registro encontrado na base.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* INSPETOR LATERAL */}
      <LogInspector
        log={state.selectedLog}
        onClose={() => actions.clearSelection()}
      />
    </div>
  );
}