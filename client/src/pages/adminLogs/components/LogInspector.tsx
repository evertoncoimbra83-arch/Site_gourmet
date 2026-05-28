import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  Fingerprint,
  Globe,
  Hash,
  Loader2,
  Terminal,
  User,
} from "lucide-react";
import { useState, type MouseEvent } from "react";
import type { AdminLog } from "../logic/useAdminLogs";
import { shortRequestId } from "../logic/useAdminLogs";
import { LogDiffViewer } from "./LogDiffViewer";
import { LogSeverityBadge } from "./LogSeverityBadge";

interface Props {
  log: AdminLog | null;
  details: {
    id: number | string;
    oldValues: Record<string, unknown> | null;
    newValues: Record<string, unknown> | null;
  } | null;
  isLoadingDetails: boolean;
  detailError?: string;
  onClose: () => void;
  onRequestIdClick: (requestId: string | null | undefined) => void;
}

function stringifyPreview(data: Record<string, unknown> | null | undefined) {
  if (!data || Object.keys(data).length === 0) return "Nenhum dado registrado";

  const text = JSON.stringify(data, null, 2);
  if (text.length <= 4000) return text;
  return `${text.slice(0, 4000)}\n... conteúdo colapsado (${text.length} caracteres)`;
}

function JsonBlock({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | null | undefined;
}) {
  const hasData = data && Object.keys(data).length > 0;

  return (
    <details className="border border-slate-100 bg-slate-50 p-4">
      <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-slate-500">
        {title}
      </summary>
      <pre className="mt-3 max-h-72 overflow-auto bg-slate-950 p-4 text-[11px] leading-relaxed text-slate-100">
        {hasData ? stringifyPreview(data) : "Nenhum dado registrado"}
      </pre>
    </details>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border border-slate-100 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="text-xs font-bold text-slate-700">{value}</div>
    </div>
  );
}

export function LogInspector({
  log,
  details,
  isLoadingDetails,
  detailError,
  onClose,
  onRequestIdClick,
}: Props) {
  const oldValues = details?.oldValues ?? log?.oldValues ?? null;
  const newValues = details?.newValues ?? log?.newValues ?? null;
  const isErrorLog = log?.isErrorLog || log?.action === "ERROR";
  const [copiedRequestId, setCopiedRequestId] = useState(false);

  const copyRequestId = async (event: MouseEvent) => {
    event.stopPropagation();
    if (!log?.requestId) return;
    await navigator.clipboard?.writeText(log.requestId);
    setCopiedRequestId(true);
    window.setTimeout(() => setCopiedRequestId(false), 1200);
  };

  return (
    <Sheet open={!!log} onOpenChange={open => !open && onClose()}>
      <SheetContent className="border-l border-slate-100 bg-white sm:max-w-2xl">
        <SheetHeader className="border-b border-slate-100 pb-5">
          <div className="mb-2 flex items-center gap-3 text-emerald-600">
            <Terminal size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Inspector
            </span>
          </div>
          <SheetTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">
            {log?.action || "Log"}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Hash size={10} /> ID {log?.id}
            {log && (
              <LogSeverityBadge severity={log.severity} action={log.action} />
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-140px)] pr-4">
          {log && (
            <div className="space-y-6 pb-10">
              <div className="grid gap-3 md:grid-cols-2">
                <MetaItem
                  icon={<User size={13} />}
                  label="Usuário"
                  value={
                    <div>
                      <div>{log.user?.name || "Sistema"}</div>
                      <div className="mt-1 truncate font-mono text-[10px] text-slate-400">
                        {log.user?.email || log.user?.id || "Automático"}
                      </div>
                    </div>
                  }
                />
                <MetaItem
                  icon={<Globe size={13} />}
                  label="Origem"
                  value={
                    <div>
                      <div className="font-mono">
                        {log.ipAddress || "Interno"}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-slate-400">
                        {log.userAgent || "unknown"}
                      </div>
                    </div>
                  }
                />
                <MetaItem
                  icon={<Activity size={13} />}
                  label="Classificação"
                  value={
                    <div>
                      <div className="font-mono uppercase">
                        {log.module || "legacy"}
                      </div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {isErrorLog ? "erro técnico" : "log operacional"}
                      </div>
                    </div>
                  }
                />
                <MetaItem
                  icon={<Activity size={13} />}
                  label="Entidade"
                  value={
                    <div>
                      <div>
                        {log.entityLabel || log.entityId || "Registro legado"}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-400">
                        {log.entityType || "legacy"} /{" "}
                        {log.entityId || "sem-id"}
                      </div>
                    </div>
                  }
                />
                <MetaItem
                  icon={<Fingerprint size={13} />}
                  label="Request ID"
                  value={
                    <div className="flex items-center justify-between gap-2">
                      <code className="truncate text-[11px]">
                        {shortRequestId(log.requestId)}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={!log.requestId}
                        onClick={copyRequestId}
                        className="size-7 shrink-0 text-slate-400"
                        title="Copiar requestId"
                      >
                        {copiedRequestId ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={!log.requestId}
                        onClick={() => onRequestIdClick(log.requestId)}
                      >
                        Ver cadeia
                      </Button>
                    </div>
                  }
                />
              </div>

              <section className="space-y-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">
                    Diff visual
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Campos adicionados, removidos e alterados preservam valores
                    mascarados.
                  </p>
                </div>
                {isLoadingDetails ? (
                  <div className="flex items-center gap-2 border border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-500">
                    <Loader2 className="size-4 animate-spin" />
                    Carregando detalhes do log
                  </div>
                ) : detailError ? (
                  <div className="flex items-center gap-2 border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-700">
                    <AlertTriangle className="size-4" />
                    {detailError}
                  </div>
                ) : (
                  <LogDiffViewer before={oldValues} after={newValues} />
                )}
              </section>

              <section className="space-y-3">
                <JsonBlock title="Snapshot before" data={oldValues} />
                <JsonBlock title="Snapshot after" data={newValues} />
              </section>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
