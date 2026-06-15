import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Database,
  Download,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type BackupItem = {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedAt: Date | string;
};

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL as string | undefined) || "";
}

export function DatabaseBackupsCard() {
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const {
    data: backups = [],
    isLoading,
    isFetching,
    refetch,
  } = trpc.admin.backups.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const createMutation = trpc.admin.backups.create.useMutation({
    onSuccess: (data) => {
      toast.success("Backup gerado com sucesso.", {
        description: `${data.filename} • ${data.sizeFormatted}`,
      });
      void utils.admin.backups.list.invalidate();
    },
    onError: (err) => {
      toast.error("Falha ao gerar backup.", {
        description: err.message,
      });
    },
  });

  const deleteMutation = trpc.admin.backups.delete.useMutation({
    onSuccess: (data) => {
      toast.success("Backup removido.", {
        description: data.filename,
      });
      void utils.admin.backups.list.invalidate();
    },
    onError: (err) => {
      toast.error("Falha ao excluir backup.", {
        description: err.message,
      });
    },
  });

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/admin/backups/${encodeURIComponent(filename)}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Download não autorizado.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao baixar o arquivo.";
      toast.error("Falha no download.", {
        description: message,
      });
    }
  };

  const handleDelete = (filename: string) => {
    setBackupToDelete(filename);
  };

  return (
    <Card className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-800">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                Backups do Banco
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Admin only • Manual e sem exposição de segredos
              </p>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
            Mantenha uma cópia fora do servidor. O backup automático continua
            ativo via cron.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching || isLoading}
            className="rounded-xl border-slate-300 text-[10px] font-black uppercase tracking-widest"
          >
            {isFetching ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <RefreshCcw size={14} className="mr-2" />
            )}
            Atualizar Lista
          </Button>

          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800"
          >
            {createMutation.isPending ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <Database size={14} className="mr-2" />
            )}
            Gerar Backup Agora
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-12 text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Lendo backups...
            </span>
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="rounded-full bg-white p-4 text-slate-400 shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Nenhum backup manual encontrado
              </p>
              <p className="text-sm text-slate-500">
                Gere o primeiro arquivo para validar restauração e retenção.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {backups.map((backup: BackupItem) => {
              const modifiedAt = new Date(backup.modifiedAt);
              const isDeleting =
                deleteMutation.isPending &&
                deleteMutation.variables?.filename === backup.filename;

              return (
                <div
                  key={backup.filename}
                  className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-[11px] font-black uppercase tracking-widest text-slate-900">
                      {backup.filename}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{backup.sizeFormatted}</span>
                      <span>{modifiedAt.toLocaleString("pt-BR")}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleDownload(backup.filename)}
                      className="rounded-xl border-slate-300 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Download size={14} className="mr-2" />
                      Baixar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(backup.filename)}
                      disabled={isDeleting}
                      className="rounded-xl border-rose-200 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50"
                    >
                      {isDeleting ? (
                        <Loader2 size={14} className="mr-2 animate-spin" />
                      ) : (
                        <Trash2 size={14} className="mr-2" />
                      )}
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={backupToDelete !== null}
        title="Excluir Backup"
        description={backupToDelete ? `Deseja realmente excluir permanentemente o backup "${backupToDelete}"?` : ""}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        destructive={true}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (backupToDelete) {
            deleteMutation.mutate({ filename: backupToDelete });
            setBackupToDelete(null);
          }
        }}
        onCancel={() => setBackupToDelete(null)}
      />
    </Card>
  );
}
