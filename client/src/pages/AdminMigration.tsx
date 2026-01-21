import React, { useState } from 'react';
import { trpc } from '../_core/trpc'; 
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils"; // ✅ Adicionado import da função cn

export function AdminMigration() {
  const [jsonMain, setJsonMain] = useState(""); 
  const [csvSecondary, setCsvSecondary] = useState(""); 
  const [status, setStatus] = useState({ msg: "Aguardando dados...", type: "info" });

  // Mutações tRPC
  const importClientsMutation = trpc.admin.migration.importClients.useMutation();
  const importOrdersMutation = trpc.admin.migration.importOrders.useMutation();
  const importLoyaltyMutation = trpc.admin.migration.importLoyalty.useMutation();
  const clearOrdersMutation = trpc.admin.migration.clearOrders.useMutation();

  const parseCSV = (csvText: string) => {
    const lines = csvText.split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) return [];
    const separator = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map(line => {
      const values = line.split(separator);
      return headers.reduce((obj: any, header, index) => {
        obj[header] = values[index]?.trim().replace(/^"|"$/g, "");
        return obj;
      }, {});
    });
  };

  const getSafeJSON = (text: string) => {
    const cleaned = text.trim();
    return JSON.parse(cleaned);
  };

  const handleImportClients = async () => {
    try {
      if (!jsonMain) return toast.error("Cole o JSON de Clientes na Box 1!");
      const data = getSafeJSON(jsonMain);
      setStatus({ msg: "⏳ Importando clientes...", type: "loading" });
      const result = await importClientsMutation.mutateAsync({ data: data.data || data });
      
      // ✅ Correção: Usando casting ou fallback para evitar erro de propriedade inexistente
      const skippedCount = (result as any).skipped || 0;
      setStatus({ msg: `✅ Clientes: ${result.imported} ok | ${skippedCount} pulados`, type: "success" });
      
      toast.success("Clientes processados!");
    } catch (err: any) {
      setStatus({ msg: `❌ Erro no JSON: ${err.message}`, type: "error" });
    }
  };

  const handleClearOrders = async () => {
    if (!confirm("⚠️ Isso apagará TODOS os pedidos e itens do banco atual. Tem certeza?")) return;
    try {
      setStatus({ msg: "⏳ Limpando banco de pedidos...", type: "loading" });
      await clearOrdersMutation.mutateAsync();
      setStatus({ msg: "✅ Banco de pedidos limpo!", type: "success" });
      toast.success("Tabelas resetadas.");
    } catch (err: any) {
      setStatus({ msg: `❌ Erro na limpeza: ${err.message}`, type: "error" });
    }
  };

  const handleImportOrders = async () => {
    try {
      if (!jsonMain) return toast.error("Cole o JSON de Pedidos na Box 1!");
      const data = getSafeJSON(jsonMain);
      setStatus({ msg: "⏳ Importando pedidos...", type: "loading" });
      const result = await importOrdersMutation.mutateAsync({ data: data.data || data });
      setStatus({ msg: `✅ Pedidos: ${result.imported} ok`, type: "success" });
      toast.success("Pedidos importados!");
    } catch (err: any) {
      setStatus({ msg: `❌ Erro na importação: ${err.message}`, type: "error" });
    }
  };

  const handleImportLoyalty = async () => {
    try {
      if (!jsonMain || !csvSecondary) {
        return toast.error("Box 1: Clientes.json | Box 2: CSV");
      }
      setStatus({ msg: "⏳ Vinculando pontos...", type: "loading" });
      const clientesData = getSafeJSON(jsonMain);
      const logsData = parseCSV(csvSecondary);
      const userMap = (clientesData.data || clientesData).map((u: any) => ({
        old_id: Number(u.old_id),
        email: u.email
      }));
      const result = await importLoyaltyMutation.mutateAsync({ logs: logsData, userMap });
      setStatus({ msg: `✅ Fidelidade: ${result.imported} migrados`, type: "success" });
      toast.success("Pontos migrados!");
    } catch (err: any) { 
      setStatus({ msg: `❌ Erro: ${err.message}`, type: "error" }); 
    }
  };

  const isAnyLoading = 
    importClientsMutation.isPending || 
    importOrdersMutation.isPending || 
    importLoyaltyMutation.isPending ||
    clearOrdersMutation.isPending;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">🚀 Motor de Migração v6.2</h1>
            <p className="text-slate-500 mt-1">Sincronização com Mapeamento de Acompanhamentos</p>
          </div>
          <div className={cn(
            "px-6 py-3 rounded-xl font-bold border transition-all text-sm",
            status.type === 'error' && 'bg-red-50 text-red-600 border-red-100',
            status.type === 'success' && 'bg-emerald-50 text-emerald-600 border-emerald-100',
            status.type === 'loading' && 'bg-amber-50 text-amber-600 animate-pulse border-amber-100',
            status.type === 'info' && 'bg-blue-50 text-blue-600 border-blue-100'
          )}>
            {status.msg}
          </div>
        </div>

        {/* TEXTAREAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Box 1: JSON (WP)</label>
            <textarea 
              className="w-full h-96 p-5 border-2 border-slate-200 rounded-[1.5rem] font-mono text-[10px] bg-white resize-none focus:border-emerald-500 outline-none"
              placeholder='Cole o arquivo .json aqui...'
              value={jsonMain}
              onChange={(e) => setJsonMain(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Box 2: CSV (Fidelidade)</label>
            <textarea 
              className="w-full h-96 p-5 border-2 border-slate-200 rounded-[1.5rem] font-mono text-[10px] bg-white resize-none focus:border-purple-500 outline-none"
              placeholder='Cole o .csv aqui...'
              value={csvSecondary}
              onChange={(e) => setCsvSecondary(e.target.value)}
            />
          </div>
        </div>

        {/* BOTÕES */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <button onClick={handleImportClients} disabled={isAnyLoading} className="flex flex-col items-center bg-emerald-600 text-white p-6 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20">
              <span className="text-3xl mb-2">👤</span>
              <span className="font-black text-xs uppercase">1. Importar Clientes</span>
            </button>

            <div className="flex flex-col gap-3">
              <button onClick={handleImportOrders} disabled={isAnyLoading} className="w-full flex flex-col items-center bg-blue-600 text-white p-6 rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20">
                <span className="text-3xl mb-2">📦</span>
                <span className="font-black text-xs uppercase">2. Importar Pedidos</span>
              </button>
              <button onClick={handleClearOrders} className="text-[10px] text-red-500 font-black uppercase hover:underline text-center">
                Limpar Pedidos
              </button>
            </div>

            <button onClick={handleImportLoyalty} disabled={isAnyLoading} className="flex flex-col items-center bg-purple-600 text-white p-6 rounded-2xl hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-600/20">
              <span className="text-3xl mb-2">💎</span>
              <span className="font-black text-xs uppercase">3. Migrar Fidelidade</span>
            </button>

            <div className="flex flex-col justify-center border-2 border-dashed border-slate-100 rounded-2xl p-6 bg-slate-50/50 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                <p className="flex items-center gap-2 mb-2"><div className="h-1 w-1 bg-emerald-400 rounded-full"/> Nomes encriptados</p>
                <p className="flex items-center gap-2 mb-2"><div className="h-1 w-1 bg-blue-400 rounded-full"/> Cria usuários Shadow</p>
                <p className="flex items-center gap-2"><div className="h-1 w-1 bg-purple-400 rounded-full"/> Mapeia acompanhamentos</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}