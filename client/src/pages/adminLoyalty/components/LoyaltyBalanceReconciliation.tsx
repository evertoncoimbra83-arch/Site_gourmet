import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReconciliationRow = {
  userId: string;
  nome: string;
  email: string;
  saldoAtual: number;
  saldoTeorico: number;
  diferenca: number;
  status: "ok" | "divergent" | "negative" | "negative_divergent";
  sugestao: string;
};

function formatPoints(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function statusLabel(status: ReconciliationRow["status"]) {
  const labels = {
    ok: "OK",
    divergent: "Divergente",
    negative: "Negativo",
    negative_divergent: "Negativo divergente",
  };
  return labels[status];
}

export function LoyaltyBalanceReconciliation() {
  const utils = trpc.useUtils();
  const [selectedRow, setSelectedRow] = useState<ReconciliationRow | null>(null);
  const previewQuery = trpc.admin.loyalty.reconcilePreview.useQuery(undefined, {
    enabled: false,
  });

  const applyMutation = trpc.admin.loyalty.applyReconciliation.useMutation({
    onSuccess: (result) => {
      toast.success(result.message || "Reconciliação aplicada.");
      setSelectedRow(null);
      utils.admin.loyalty.reconcilePreview.invalidate();
      utils.admin.loyaltySettings.getCustomers.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao aplicar reconciliação.");
    },
  });

  const rows = useMemo(
    () => (previewQuery.data?.users || []) as ReconciliationRow[],
    [previewQuery.data?.users],
  );

  const applyRow = (row: ReconciliationRow) => {
    setSelectedRow(row);
  };

  const summary = previewQuery.data;

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={!!selectedRow}
        title="Aplicar reconciliacao?"
        description={selectedRow ? `Os saldos de pontos de ${selectedRow.nome} serão ajustados em ${formatPoints(selectedRow.diferenca)} ponto(s).` : ""}
        confirmLabel="Aplicar ajuste"
        cancelLabel="Revisar antes"
        loading={applyMutation.isPending}
        requireReason={true}
        reasonPlaceholder="Informe a justificativa para este ajuste (mínimo 8 caracteres)..."
        onCancel={() => setSelectedRow(null)}
        onConfirm={(reason) => {
          if (!selectedRow || !reason) return;
          applyMutation.mutate({
            userId: selectedRow.userId,
            expectedDifference: selectedRow.diferenca,
            reason: reason,
          });
        }}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-600">
            <ShieldCheck size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">
              Auditoria segura
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase text-slate-900">
            Ajuste de Saldos
          </h2>
        </div>

        <Button
          type="button"
          onClick={() => previewQuery.refetch()}
          disabled={previewQuery.isFetching}
          className="h-11 rounded-full bg-slate-950 px-5 text-[10px] font-black uppercase text-white hover:bg-emerald-600"
        >
          {previewQuery.isFetching ? (
            <Loader2 className="mr-2 animate-spin" size={15} />
          ) : (
            <RefreshCcw className="mr-2" size={15} />
          )}
          Simular
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Auditados
          </p>
          <strong className="mt-2 block text-2xl font-black text-slate-900">
            {formatPoints(summary?.auditedUsers || 0)}
          </strong>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Divergentes
          </p>
          <strong className="mt-2 block text-2xl font-black text-amber-600">
            {formatPoints(summary?.divergentUsers || 0)}
          </strong>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Negativos
          </p>
          <strong className="mt-2 block text-2xl font-black text-red-600">
            {formatPoints(summary?.negativeUsers || 0)}
          </strong>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Diferença global
          </p>
          <strong className="mt-2 block text-2xl font-black text-slate-900">
            {formatPoints(summary?.totalDifference || 0)}
          </strong>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Saldo atual</TableHead>
              <TableHead className="text-right">Saldo teórico</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                  {previewQuery.isFetched
                    ? "Nenhuma divergência encontrada."
                    : "Execute a simulação para auditar saldos."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{row.nome}</div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPoints(row.saldoAtual)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPoints(row.saldoTeorico)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatPoints(row.diferenca)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700">
                      {row.status.includes("negative") ? (
                        <AlertTriangle size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      {statusLabel(row.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={applyMutation.isPending}
                      onClick={() => applyRow(row)}
                      className="rounded-full text-[10px] font-black uppercase"
                    >
                      Aplicar ajuste
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
