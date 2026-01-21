import { useState, useRef } from "react";
import { trpc } from "@/_core/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Database, Download, Package, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export function InfrastructureCard() {
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Ref para controlar o cancelamento da requisição
  const abortControllerRef = useRef<AbortController | null>(null);

  // 📈 QUERY DE STATUS: Busca o progresso do servidor a cada 1s
  const statusQuery = trpc.admin.storeSettings.getExportStatus.useQuery(undefined, {
    enabled: isExporting,
    refetchInterval: isExporting ? 1000 : false,
  });

  // 📦 MUTATION: Exportar Kernel
  const exportMutation = trpc.admin.storeSettings.exportKernel.useMutation({
    onMutate: () => {
      setIsExporting(true);
      // Inicializa o controller para permitir cancelamento
      abortControllerRef.current = new AbortController();
    },
    onSuccess: (data) => {
      const byteCharacters = atob(data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      
      toast.success("Kernel exportado com sucesso!");
      setTimeout(() => {
        setIsExporting(false);
        abortControllerRef.current = null;
      }, 2000);
    },
    onError: (err) => {
      if (err.message.includes("aborted")) {
        toast.info("Exportação cancelada pelo usuário.");
      } else {
        toast.error("Erro na exportação: " + err.message);
      }
      setIsExporting(false);
    }
  });

  // Função para parar a operação
  const handleStopOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsExporting(false);
      toast.warning("Operação interrompida.");
    }
  };

  // 💾 MUTATION: Backup SQL
  const backupMutation = trpc.admin.storeSettings.downloadBackup.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.sql], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Backup SQL concluído!");
    },
    onError: (err) => toast.error("Erro no backup: " + err.message)
  });

  // 🚀 MUTATION: Upgrade System
  const upgradeMutation = trpc.admin.storeSettings.upgradeSystem.useMutation({
    onSuccess: () => {
      setIsUpdating(false);
      setUpdateFile(null);
      toast.success("Deploy iniciado com sucesso!");
    },
    onError: (err) => {
      setIsUpdating(false);
      toast.error("Erro no deploy: " + err.message);
    }
  });

  const handleSystemUpgrade = async () => {
    if (!updateFile) return toast.error("Selecione o pacote .zip");
    const confirmName = prompt("Digite 'ATUALIZAR' para confirmar:");
    if (confirmName !== "ATUALIZAR") return;

    setIsUpdating(true);
    const reader = new FileReader();
    reader.readAsDataURL(updateFile);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      upgradeMutation.mutate({ fileBase64: base64 });
    };
  };

  const currentPercent = statusQuery.data?.percent || 0;
  const currentStatus = statusQuery.data?.status || "Iniciando...";

  return (
    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden border border-white/5">
      <CardHeader className="p-8 border-b border-white/5 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-400">
            <Database size={24} />
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-white">
              Infra <span className="text-blue-500">/</span> Kernel
            </CardTitle>
          </div>
          {isExporting && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleStopOperation}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full h-8 px-3 text-[10px] font-bold uppercase tracking-tighter"
            >
              <XCircle size={14} className="mr-1" /> Parar Processo
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-6">
        
        {/* BARRA DE PROGRESSO DINÂMICA */}
        {isExporting && (
          <div className="p-6 rounded-[2rem] bg-blue-600/5 border border-blue-500/20 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/60">Sistema de Build</span>
                <p className="text-sm font-bold text-blue-100 flex items-center gap-2">
                  {currentPercent === 100 ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Loader2 size={16} className="animate-spin text-blue-500" />}
                  {currentStatus}
                </p>
              </div>
              <span className="text-3xl font-black italic text-blue-500">{currentPercent}%</span>
            </div>
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-1 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                style={{ width: `${currentPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => backupMutation.mutate()} 
              disabled={backupMutation.isPending || isExporting}
              className="h-16 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all shadow-lg shadow-blue-900/20"
            >
              {backupMutation.isPending ? <Loader2 className="animate-spin" /> : <><Download size={18} className="mr-2" /> Dump SQL</>}
            </Button>

            <Button 
              onClick={() => exportMutation.mutate()} 
              disabled={isExporting}
              className={cn(
                "h-16 rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all border",
                isExporting ? "bg-slate-800 border-white/5 text-white/20" : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              )}
            >
              {isExporting ? "Processando..." : <><Package size={18} className="mr-2" /> Exportar Kernel</>}
            </Button>
        </div>

        <div className="pt-8 border-t border-white/5 space-y-4">
          <div className="relative group">
            <input 
              type="file" 
              accept=".zip" 
              onChange={(e) => setUpdateFile(e.target.files?.[0] || null)} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              disabled={isUpdating || isExporting}
            />
            <div className={cn(
              "p-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center transition-all duration-500", 
              updateFile ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 bg-white/5"
            )}>
              <Upload size={32} className={cn("mb-3 transition-colors", updateFile ? "text-emerald-500" : "text-slate-600")} />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                {updateFile ? updateFile.name : "Solte o pacote .zip aqui"}
              </span>
            </div>
          </div>

          <Button 
            disabled={!updateFile || isUpdating || isExporting} 
            onClick={handleSystemUpgrade} 
            className={cn(
              "w-full h-16 rounded-[1.5rem] font-black uppercase text-[12px] tracking-[0.3em] transition-all duration-500", 
              updateFile 
                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 hover:bg-emerald-500 hover:-translate-y-1" 
                : "bg-white/5 text-white/10"
            )}
          >
             {isUpdating ? <Loader2 className="animate-spin mr-2" /> : "Implantar Kernel na VPS"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}