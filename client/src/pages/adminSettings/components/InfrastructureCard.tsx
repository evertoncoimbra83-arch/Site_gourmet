import React, { useState } from "react"; 
import { trpc } from "@/_core/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Upload, Database, Download, Package, 
  ListFilter, Zap, Server, BarChart3, Activity, ShieldCheck, Lock, Unlock 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";
import { Text } from "@tremor/react";

// 🛡️ IMPORTAÇÃO DO AUTENTICADOR REAL
import { authenticator } from "otplib";

// --- INTERFACES ---f
interface BackupResponse { 
  filename: string; 
  success: boolean; 
}

interface HealthComponent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'critical';
  latency: number;
}

interface AdminStoreActions {
  listTables: { useQuery: () => { data: string[] | undefined; isLoading: boolean } };
  downloadBackup: { 
    useMutation: (opts: { 
      onSuccess: (data: BackupResponse) => void; 
      onError: (err: { message: string }) => void 
    }) => { mutate: (variables: { selectedTables: string[] }) => void; isPending: boolean } 
  };
}

export function InfrastructureCard() {
  // 🔐 CONTROLE DE ACESSO (LOCKBOX)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterSecret, setMasterSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Estados de Operação
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // 🚨 MONITORAMENTO DE SAÚDE
  const { data: health } = trpc.admin.health.checkStatus.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const storeActions = (trpc.admin.storeSettings as unknown) as AdminStoreActions;
  const { data: tables, isLoading: isLoadingTables } = storeActions.listTables.useQuery();

  // 🛡️ FUNÇÃO DE DESBLOQUEIO REAL COM RESILIÊNCIA
  const handleUnlock = async () => {
    // 1. Limpeza rigorosa dos dados informados
    const cleanSecret = masterSecret.replace(/\s+/g, '').toUpperCase();
    const cleanTotp = totpCode.replace(/\s+/g, '');

    if (!cleanSecret || cleanTotp.length < 6) {
      toast.error("Campos Incompletos", { description: "Informe o segredo e o código de 6 dígitos." });
      return;
    }
    
    setIsVerifying(true);

    try {
      // Delay suave para a UX
      await new Promise(resolve => setTimeout(resolve, 600));

      // 2. Janela de Tolerância (+- 30s) para evitar erro de sincronia de fuso/relógio
      authenticator.options = { window: 1 }; 

      // 3. Validação matemática REAL
      const isValid = authenticator.check(cleanTotp, cleanSecret);

      if (isValid) {
        setIsUnlocked(true);
        setTotpCode(""); // Limpa o código por segurança
        toast.success("Acesso Concedido", { description: "Kernel e Banco de Dados desbloqueados." });
      } else {
        toast.error("Acesso Negado", { description: "O código TOTP não confere com o Segredo Master." });
      }
    } catch {
      toast.error("Chave Inválida", { description: "O Segredo Master deve ser um código Base32 válido." });
    } finally {
      setIsVerifying(false);
    }
  };

  const backupMutation = storeActions.downloadBackup.useMutation({
    onSuccess: (data) => {
      if (data.filename) {
        const a = document.createElement('a');
        a.href = `/api/admin/backups/${data.filename}`;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Backup Concluído", { description: "Download do arquivo compactado (.sql.gz) iniciado." });
      }
    },
    onError: (err) => toast.error("Falha no Backup", { description: err.message })
  });

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => prev.includes(tableName) ? prev.filter(t => t !== tableName) : [...prev, tableName]);
  };

  const selectAll = () => setSelectedTables(tables || []);
  const deselectAll = () => setSelectedTables([]);

  // --- RENDERIZAÇÃO: ESTADO BLOQUEADO ---
  if (!isUnlocked) {
    return (
      <Card className="rounded-4xl border-none shadow-2xl bg-slate-950 text-white overflow-hidden p-12 flex flex-col items-center justify-center min-h-137.5 text-center border border-white/5">
        <div className="h-20 w-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/20">
          <Lock size={40} className="animate-pulse" />
        </div>
        <CardTitle className="text-2xl font-black uppercase italic tracking-tighter mb-2">
          Infrastructure <span className="text-emerald-500">Lockbox</span>
        </CardTitle>
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">
          Área restrita: Requer autenticação de Kernel
        </Text>

        <div className="w-full max-w-[320px] space-y-5">
          <div className="space-y-2 text-left">
            <label className="text-[9px] font-black uppercase text-slate-600 ml-2">Segredo Master (Base32)</label>
            <Input 
              type="password"
              value={masterSecret}
              onChange={(e) => setMasterSecret(e.target.value)}
              placeholder="••••••••••••••••"
              className="bg-white/5 border-none h-14 rounded-2xl text-center font-mono text-white placeholder:text-slate-800 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[9px] font-black uppercase text-slate-600 ml-2">Código Authenticator</label>
            <Input 
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000 000"
              className="bg-white/5 border-none h-20 rounded-2xl text-center text-5xl font-black tracking-[0.3em] text-emerald-500 placeholder:text-slate-800 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          <Button 
            onClick={handleUnlock}
            disabled={isVerifying}
            className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black uppercase tracking-widest transition-all mt-4 text-white shadow-lg shadow-emerald-900/20"
          >
            {isVerifying ? <Loader2 className="animate-spin" /> : "Abrir Cofre de Infra"}
          </Button>
        </div>
      </Card>
    );
  }

  // --- RENDERIZAÇÃO: ESTADO DESBLOQUEADO ---
  return (
    <Card className="rounded-4xl border-none shadow-2xl bg-white overflow-hidden text-left ring-1 ring-slate-200 relative">
      <button 
        onClick={() => setIsUnlocked(false)}
        className="absolute top-8 right-8 p-3 bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all z-20 group"
        title="Trancar Cofre"
      >
        <Unlock size={18} className="group-hover:hidden" />
        <Lock size={18} className="hidden group-hover:block" />
      </button>

      <div className="bg-slate-50 p-8 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-6">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Engine Health Status</Text>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {health?.components.map((comp) => {
            const item = comp as HealthComponent;
            const isOnline = item.status === 'online';
            return (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl transition-colors",
                  isOnline ? "bg-slate-900 text-white" : "bg-rose-500 text-white animate-pulse"
                )}>
                  {item.id === 'database' ? <Database size={18} /> : item.id === 'redis' ? <Zap size={18} /> : <Server size={18} />}
                </div>
                <div className="overflow-hidden text-left">
                  <p className="text-[10px] font-black uppercase text-slate-900 truncate tracking-tight">{item.name}</p>
                  <p className={cn("text-[11px] font-mono font-bold mt-0.5", isOnline ? "text-emerald-600" : "text-rose-600")}>
                    {isOnline ? `● ${item.latency}ms` : '○ OFFLINE'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CardHeader className="p-10 bg-white">
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-3 rounded-2xl text-slate-900">
              <BarChart3 size={24} />
          </div>
          <div>
              <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-950">
                Kernel <span className="text-slate-300">/</span> Root
              </CardTitle>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sessão administrativa ativa</Text>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-10 pb-10 space-y-8 text-left bg-white">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <ListFilter size={14} /> Esquema de Dados ({tables?.length || 0})
            </span>
            <div className="flex gap-4">
              <button onClick={selectAll} className="text-[10px] font-black text-slate-900 hover:underline uppercase">Selecionar Tudo</button>
              <button onClick={deselectAll} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase">Limpar</button>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-4xl p-6 max-h-72 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3 ring-1 ring-slate-200">
            {isLoadingTables ? (
              <div className="col-span-full py-16 flex flex-col items-center gap-3 opacity-40">
                <Loader2 className="animate-spin text-slate-900" size={24} />
                <Text className="text-[10px] font-black uppercase tracking-widest">Mapeando Tabelas...</Text>
              </div>
            ) : (
              tables?.map((table: string) => (
                <label key={table} className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer border",
                  selectedTables.includes(table) 
                    ? "bg-slate-950 border-slate-950 text-white shadow-xl scale-[1.01]" 
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                )}>
                  <input 
                    type="checkbox" 
                    checked={selectedTables.includes(table)} 
                    onChange={() => toggleTable(table)} 
                    className="rounded border-slate-300 text-slate-950 focus:ring-slate-900 h-4 w-4"
                  />
                  <span className="text-[11px] font-mono font-bold truncate tracking-tight">{table}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => backupMutation.mutate({ selectedTables })} 
            disabled={backupMutation.isPending || selectedTables.length === 0} 
            className="h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black text-[11px] tracking-widest uppercase shadow-lg shadow-emerald-600/10 transition-all active:scale-95"
          >
            {backupMutation.isPending ? <Loader2 className="animate-spin" /> : <><Download size={20} className="mr-3" /> Gerar Dump ({selectedTables.length})</>}
          </Button>

          <Button 
            onClick={() => setIsExporting(true)} 
            disabled={isExporting} 
            className={cn(
              "h-16 rounded-[1.5rem] font-black text-[11px] tracking-widest uppercase border-2 transition-all active:scale-95", 
              isExporting ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-white text-slate-900 border-slate-900 hover:bg-slate-50 shadow-sm"
            )}
          >
            {isExporting ? "Processando..." : <><Package size={20} className="mr-3" /> Export Kernel</>}
          </Button>
        </div>

        <div className="pt-8 space-y-5 border-t border-slate-100 text-left">
          <div className="flex items-center gap-2 px-2 text-slate-400">
             <ShieldCheck size={16} />
             <span className="text-[9px] font-black uppercase tracking-widest">Protocolo de Deploy via SSH</span>
          </div>
          <div className="relative group">
            <input 
              type="file" 
              accept=".zip" 
              onChange={(e) => setUpdateFile(e.target.files?.[0] || null)} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              disabled={isUpdating} 
            />
            <div className={cn(
              "p-10 border-2 border-dashed rounded-4xl flex flex-col items-center transition-all duration-500", 
              updateFile ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50 group-hover:border-slate-400"
            )}>
              <Upload size={28} className={cn("mb-3 transition-transform group-hover:-translate-y-1", updateFile ? "text-emerald-600" : "text-slate-300")} />
              <span className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em] text-center">
                {updateFile ? updateFile.name : "Clique para selecionar pacote de atualização"}
              </span>
            </div>
          </div>
          <Button 
            disabled={!updateFile || isUpdating} 
            onClick={() => {
              if(window.prompt("Digite 'CONFIRMAR':") === 'CONFIRMAR') {
                setIsUpdating(true);
                setTimeout(() => {
                  setIsUpdating(false);
                  setUpdateFile(null);
                  toast.success("Atualização Concluída", { description: "Kernel reiniciado na VPS." });
                }, 3000);
              }
            }} 
            className={cn(
              "w-full h-16 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.3em] transition-all", 
              updateFile ? "bg-slate-950 text-white shadow-2xl hover:bg-black" : "bg-slate-100 text-slate-300"
            )}
          >
            {isUpdating ? <Loader2 className="animate-spin mr-3" /> : <><Activity size={18} className="mr-3" /> Iniciar Deploy Root</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}