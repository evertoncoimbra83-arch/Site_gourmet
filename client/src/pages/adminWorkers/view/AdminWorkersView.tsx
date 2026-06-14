import React from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/_core/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ServerCog,
  Loader2,
  RefreshCcw,
  Check,
  Copy,
  Activity,
  Cpu,
  AlertTriangle,
  Clock,
  Database,
  ShieldAlert,
  SearchX
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- HELPERS ---
function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Nunca";
  const date = new Date(value);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function RequestIdButton({ requestId }: { requestId?: string }) {
  const [copied, setCopied] = React.useState(false);
  if (!requestId) return <span className="text-slate-400 font-mono text-[10px]">sem-id</span>;

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
      <span className="truncate max-w-24" title={requestId}>
        {requestId.substring(0, 8)}...
      </span>
      <button
        onClick={copy}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        title="Copiar requestId"
      >
        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      </button>
    </div>
  );
}

export function AdminWorkersView() {
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false);

  // 1. Query tRPC autenticada para detalhes do worker.
  const {
    data: workerHealth,
    isLoading: isWorkerHealthLoading,
    isRefetching: isWorkerHealthRefetching,
    refetch: refetchWorkerHealth,
  } = trpc.admin.worker.health.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // 2. Query REST para /health/ready (com status de banco de dados e redis)
  const {
    data: readyHealth,
    isLoading: isReadyHealthLoading,
    isRefetching: isReadyHealthRefetching,
    refetch: refetchReadyHealth,
  } = useQuery({
    queryKey: ["readyHealthRest"],
    queryFn: async () => {
      const res = await fetch("/health/ready");
      if (!res.ok && res.status !== 503) {
        throw new Error("Falha ao ler prontidão geral");
      }
      return res.json();
    },
    refetchInterval: 30000, // Refresh moderado (30 segundos)
  });

  // 3. Query tRPC para admin.worker.incidents (limite de 20 incidentes)
  const incidentsQuery = trpc.admin.worker.incidents.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 }
  );

  const handleRefreshAll = async () => {
    setIsManualRefreshing(true);
    await Promise.all([
      refetchWorkerHealth(),
      refetchReadyHealth(),
      incidentsQuery.refetch(),
    ]);
    setIsManualRefreshing(false);
  };

  const isAnyLoading = isWorkerHealthLoading || isReadyHealthLoading || incidentsQuery.isLoading;
  const isAnyRefetching = isWorkerHealthRefetching || isReadyHealthRefetching || incidentsQuery.isRefetching || isManualRefreshing;

  if (isAnyLoading) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4 p-12">
        <Loader2 className="size-10 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Sincronizando Painel
        </p>
      </div>
    );
  }

  const workerInfo = workerHealth || null;
  const workerAlive = workerInfo?.workerAlive ?? false;
  const queueStats = workerInfo?.queueStats || {
    "nutri-prescription-process": { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
    "bi-analytics-queue": { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
  };

  // Mapeamentos de Status
  const redisStatus = readyHealth?.checks?.redis === "ok" ? "ONLINE" : "OFFLINE";
  const dbStatus = readyHealth?.checks?.database === "ok" ? "ONLINE" : "OFFLINE";
  const apiStatus = readyHealth?.status ? "ONLINE" : "OFFLINE";

  let statusBadgeColor = "bg-rose-500";
  let statusText = "Desconectado";
  if (workerAlive) {
    statusBadgeColor = "bg-emerald-500";
    statusText = "Online";
  } else if (workerInfo?.lastHeartbeat) {
    statusBadgeColor = "bg-amber-500";
    statusText = "Ausente / Degradado";
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* HEADER */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <ServerCog size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Monitoramento do Sistema</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Painel de <span className="text-emerald-600">Workers</span><span className="text-emerald-600">.</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm italic max-w-2xl">
              Supervisão operacional de filas BullMQ, status do motor e logs de incidentes do Redis.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isAnyRefetching}
            className="h-12 px-6 rounded-2xl border-slate-200/80 shadow-sm gap-2 text-[10px] font-black uppercase tracking-wider bg-white shrink-0"
          >
            <RefreshCcw size={14} className={cn(isAnyRefetching && "animate-spin")} />
            {isAnyRefetching ? "Atualizando..." : "Sincronizar"}
          </Button>
        </div>
      </header>

      {/* SEÇÃO 1 & 4: STATUS GERAL E SAÚDE OPERACIONAL */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Geral */}
        <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3 text-slate-700">
              <Cpu size={20} className="text-emerald-600" />
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-950">
                Estado do Motor (Worker)
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", statusBadgeColor)} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                {statusText}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span>Status Geral:</span>
              <Badge
                className={cn(
                  "rounded-xl uppercase text-[9px] font-black tracking-wider px-2 py-0.5",
                  workerAlive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {workerAlive ? "Saudável" : "Inoperante"}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span>Último Heartbeat:</span>
              <span className="font-mono text-slate-900">{formatDate(workerInfo?.lastHeartbeat)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Tempo desde último pulso:</span>
              <span className="text-slate-950">
                {workerInfo?.ageSeconds !== null && workerInfo?.ageSeconds !== undefined
                  ? `${workerInfo.ageSeconds} segundos atrás`
                  : "Nenhum dado recebido"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Saúde Operacional */}
        <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3 text-slate-700">
              <Activity size={20} className="text-emerald-600" />
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-950">
                Saúde Operacional (Infra)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span>Servidor de API:</span>
              <Badge className={cn("rounded-xl px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200")}>
                {apiStatus}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span>Banco de Dados (MySQL):</span>
              <Badge
                className={cn(
                  "rounded-xl px-2 py-0.5 text-[9px] font-black tracking-wider uppercase",
                  dbStatus === "ONLINE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {dbStatus}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Servidor Redis:</span>
              <Badge
                className={cn(
                  "rounded-xl px-2 py-0.5 text-[9px] font-black tracking-wider uppercase",
                  redisStatus === "ONLINE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {redisStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 2: ESTATÍSTICAS DE FILAS (Nutri & BI) */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Fila Nutri */}
        <QueueCard
          title="Fila Nutrição (AI)"
          description="nutri-prescription-process"
          stats={queueStats["nutri-prescription-process"]}
        />

        {/* Fila BI */}
        <QueueCard
          title="Fila BI Analytics"
          description="bi-analytics-queue"
          stats={queueStats["bi-analytics-queue"]}
        />
      </div>

      {/* SEÇÃO 3: INCIDENTES RECENTES */}
      <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-emerald-600" />
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
                Incidentes Recentes
              </CardTitle>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Histórico em Redis dos últimos 20 alertas ou falhas operacionais
              </p>
            </div>
          </div>
          {incidentsQuery.data && incidentsQuery.data.length > 0 && (
            <Badge variant="outline" className="rounded-xl px-2.5 py-1 text-[9px] font-black uppercase">
              Total: {incidentsQuery.data.length}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {incidentsQuery.data && incidentsQuery.data.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-40 pl-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Timestamp
                  </TableHead>
                  <TableHead className="w-28 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Severidade
                  </TableHead>
                  <TableHead className="w-24 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Tipo
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Mensagem
                  </TableHead>
                  <TableHead className="w-32 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Fila / JobId
                  </TableHead>
                  <TableHead className="w-32 pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    RequestId
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidentsQuery.data.slice(0, 20).map((inc: any, i: number) => {
                  const severityCritical = inc.severity === "critical";
                  return (
                    <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50">
                      <TableCell className="pl-6 font-mono text-[11px] font-bold text-slate-600">
                        {formatDate(inc.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-xl px-2.5 py-0.5 text-[8px] font-black tracking-wider uppercase leading-none border",
                            severityCritical
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {inc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700 uppercase">
                        {inc.type}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 leading-relaxed max-w-sm truncate" title={inc.message}>
                        {inc.message}
                      </TableCell>
                      <TableCell className="text-[11px] font-bold text-slate-500">
                        <div className="truncate max-w-28" title={inc.queue}>{inc.queue || "-"}</div>
                        {inc.jobId && <div className="mt-1 font-mono text-[10px] text-slate-400">Job: {inc.jobId}</div>}
                      </TableCell>
                      <TableCell className="pr-6">
                        <RequestIdButton requestId={inc.requestId} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <SearchX className="size-12 text-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Nenhum incidente registrado
              </p>
              <p className="text-xs font-medium text-slate-400 max-w-md text-center px-4 leading-relaxed">
                Excelente! Não há falhas operacionais registradas recentemente no Redis para os workers e filas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface QueueCardProps {
  title: string;
  description: string;
  stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

function QueueCard({ title, description, stats }: QueueCardProps) {
  return (
    <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
      <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Database className="text-emerald-600" size={20} />
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-950">
              {title}
            </CardTitle>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-5 gap-3 text-center">
        <StatCell label="Waiting" count={stats.waiting} color="text-blue-600 bg-blue-50 border-blue-100" />
        <StatCell label="Active" count={stats.active} color="text-amber-600 bg-amber-50 border-amber-100" />
        <StatCell label="Delayed" count={stats.delayed} color="text-purple-600 bg-purple-50 border-purple-100" />
        <StatCell label="Completed" count={stats.completed} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
        <StatCell label="Failed" count={stats.failed} color="text-rose-600 bg-rose-50 border-rose-100" />
      </CardContent>
    </Card>
  );
}

function StatCell({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className={cn("h-12 rounded-xl flex items-center justify-center font-mono text-base font-black border", color)}>
        {count}
      </div>
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}
