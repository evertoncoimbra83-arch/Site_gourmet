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
import { cn } from "@/lib/utils";
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  RefreshCcw,
  SearchX,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState, type MouseEvent } from "react";
import { LogChangeDetail } from "../components/LogChangeDetail";
import { LogFilters } from "../components/LogFilters";
import { LogInspector } from "../components/LogInspector";
import { LogSeverityBadge } from "../components/LogSeverityBadge";
import {
  shortRequestId,
  useAdminLogs,
  type AdminLog,
} from "../logic/useAdminLogs";

function formatDate(value: string | Date) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function displayEntity(log: AdminLog) {
  return log.entityLabel || log.entityId || log.entity || "Registro legado";
}

function RequestIdButton({
  requestId,
  onFilter,
}: {
  requestId: string | null;
  onFilter: (requestId: string | null | undefined) => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!requestId) {
    return (
      <span className="font-mono text-[10px] font-bold text-slate-400">
        sem-id
      </span>
    );
  }

  const copyRequestId = async (event: MouseEvent) => {
    event.stopPropagation();
    await navigator.clipboard?.writeText(requestId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={event => {
          event.stopPropagation();
          onFilter(requestId);
        }}
        className="font-mono normal-case tracking-normal"
      >
        {shortRequestId(requestId)}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={copyRequestId}
        className="size-7 text-slate-400"
        title="Copiar requestId"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </Button>
    </div>
  );
}

export function AdminLogsView() {
  const {
    logs,
    total,
    pageSize,
    currentPage,
    totalPages,
    hasMore,
    isInitialLoading,
    isRefetching,
    error,
    detailError,
    isDetailLoading,
    selectedLogDetails,
    moduleOptions,
    isModulesLoading,
    stats,
    state,
    actions,
  } = useAdminLogs(50);

  if (isInitialLoading) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4 p-12">
        <Loader2 className="size-10 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Sincronizando historico
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center bg-slate-900 text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Central de Auditoria
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Investigacao operacional por modulo, entidade, severidade e
              requestId
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-none px-3 py-2">
            Total: {total}
          </Badge>
          <Badge variant="outline" className="rounded-none px-3 py-2">
            Pagina atual: {stats.pageTotal}
          </Badge>
          <Badge variant="outline" className="rounded-none px-3 py-2">
            Criticos na pagina: {stats.critical}
          </Badge>
          <Badge variant="outline" className="rounded-none px-3 py-2">
            RequestId: {stats.withRequestId}/{logs.length}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            disabled={isRefetching}
            onClick={actions.refresh}
          >
            <RefreshCcw
              size={16}
              className={cn(isRefetching && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      <LogFilters
        filters={state.filters}
        moduleOptions={moduleOptions}
        isModulesLoading={isModulesLoading}
        onChange={actions.updateFilter}
        onClear={actions.clearFilters}
      />

      {state.filters.requestId && (
        <div className="flex flex-col gap-2 border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 md:flex-row md:items-center md:justify-between">
          <span>
            Cadeia correlacionada por requestId:{" "}
            <code>{shortRequestId(state.filters.requestId)}</code>
          </span>
          <Button size="sm" variant="outline" onClick={actions.clearFilters}>
            Remover correlacao
          </Button>
        </div>
      )}

      {error && (
        <div className="border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Falha ao carregar logs: {error.message}. Tente limpar filtros ou
          atualizar a lista.
        </div>
      )}

      <div className="overflow-hidden border border-slate-100 bg-white shadow-sm">
        {isRefetching && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Loader2 className="size-3.5 animate-spin" />
            Atualizando resultados
          </div>
        )}
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-32 pl-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Data/Hora
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Severidade
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Modulo
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Acao
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Entidade
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Usuario
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                RequestId
              </TableHead>
              <TableHead className="pr-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Diff
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map(log => {
                const date = formatDate(log.createdAt);

                return (
                  <TableRow
                    key={log.id}
                    onClick={() => actions.selectLog(log)}
                    className="cursor-pointer border-slate-50 hover:bg-slate-50"
                  >
                    <TableCell className="pl-5">
                      <div className="text-sm font-black text-slate-800">
                        {date.date}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                        {date.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <LogSeverityBadge
                        severity={log.severity}
                        action={log.action}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-none text-[10px] uppercase"
                      >
                        {log.module || "legacy"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-52 truncate font-mono text-[11px] font-bold text-slate-700">
                        {log.action}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-56 truncate text-xs font-bold text-slate-700">
                        {displayEntity(log)}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-400">
                        {log.entityType || "legacy"} /{" "}
                        {log.entityId || "sem-id"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-slate-300" />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-700">
                            {log.user?.name || "Sistema"}
                          </div>
                          <div className="truncate text-[10px] text-slate-400">
                            {log.user?.email || log.user?.id || "Automatico"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RequestIdButton
                        requestId={log.requestId}
                        onFilter={actions.filterByRequestId}
                      />
                    </TableCell>
                    <TableCell className="pr-5">
                      <LogChangeDetail log={log} />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <SearchX className="size-12 text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      Nenhum registro encontrado
                    </p>
                    <p className="max-w-md text-xs font-medium text-slate-400">
                      Revise periodo, modulo, severidade ou requestId. Filtros
                      de texto usam debounce para reduzir consultas.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={actions.clearFilters}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border border-slate-100 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Activity className="size-4 text-slate-300" />
          Pagina {currentPage} de {totalPages} - exibindo {logs.length} de{" "}
          {total}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={state.offset === 0 || isRefetching}
            onClick={actions.previousPage}
            className="gap-2"
          >
            <ChevronLeft size={14} />
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={!hasMore || isRefetching}
            onClick={actions.nextPage}
            className="gap-2"
          >
            Proximo
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      <LogInspector
        log={state.selectedLog}
        details={selectedLogDetails}
        isLoadingDetails={isDetailLoading}
        detailError={detailError?.message}
        onClose={actions.clearSelection}
        onRequestIdClick={actions.filterByRequestId}
      />
    </div>
  );
}
