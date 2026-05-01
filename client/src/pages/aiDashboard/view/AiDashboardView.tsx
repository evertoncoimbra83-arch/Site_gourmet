// client/src/pages/aiDashboard/view/AiDashboardView.tsx

import React, { useState } from "react";
import { useAiDashboardLogic } from "../logic/useAiDashboardLogic";
import { AiScanCard } from "../components/AiScanCard";
import { PrescriptionScanner } from "../components/PrescriptionScanner";
import { AiScanResultView } from "../components/AiScanResultView";
import { AnimatePresence, motion } from "framer-motion";
import { 
  BrainCircuit, 
  ArrowLeft, 
  History, 
  Loader2, 
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSameMonth } from "date-fns"; 
import { useAuth } from "@/_core/hooks/useAuth"; 

// ✅ Definindo os tipos de status para evitar o erro de 'any' do ESLint
type ScanStatus = "pending" | "processing" | "completed" | "failed";

export default function AiDashboardView() {
  const { scans, isLoading, handleDeleteScan, navigate } = useAiDashboardLogic();
  const { user } = useAuth(); 
  
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  const scansThisMonth = scans.filter(s => 
    isSameMonth(new Date(s.createdAt), new Date())
  ).length;
  
  const isLimitReached = scansThisMonth >= 2;
  const isAdmin = user?.role === "admin";

  const handleToggleExpand = (id: string) => {
    setExpandedScanId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] font-sans pb-20 text-left">
      <header className="bg-slate-950 pt-16 pb-24 px-6 rounded-b-[4rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/produtos")}
            className="mb-8 text-slate-500 hover:text-emerald-400 p-0 transition-colors uppercase text-[10px] font-black tracking-widest"
          >
            <ArrowLeft size={16} className="mr-2" /> Voltar ao Cardápio
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 text-emerald-400">
                <BrainCircuit size={32} strokeWidth={1.2} className="animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">Gourmet AI</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic uppercase text-white tracking-tighter leading-none">
                Meu Cardápio <span className="text-emerald-500">IA</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-md font-medium leading-relaxed">
                Personalização baseada no seu histórico. Você pode realizar até **2 novos mapeamentos por mês**.
              </p>
            </div>

            <div className="shrink-0 relative">
              {!isLimitReached || isAdmin ? (
                <PrescriptionScanner />
              ) : (
                <div className="bg-slate-800/50 p-8 rounded-4xl border border-white/5 text-center backdrop-blur-sm">
                   <AlertTriangle className="text-amber-500 mx-auto mb-3" size={28} />
                   <p className="text-white text-[10px] font-black uppercase tracking-widest leading-tight">
                     Limite mensal<br/>atingido
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 h-6 w-1.5 rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <History size={14} /> Histórico de Mapeamentos
            </h3>
          </div>
          
          <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Uso Mensal: <span className={isLimitReached ? "text-red-500" : "text-emerald-600"}>{scansThisMonth}/2</span>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-20">
            <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando IA...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5"> 
            <AnimatePresence mode="popLayout">
              {scans.length === 0 ? (
                <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center px-10">
                  <Sparkles className="text-slate-200 mb-6" size={40} />
                  <h4 className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Nenhum mapeamento encontrado</h4>
                </div>
              ) : (
                scans.map((scan) => {
                  const isExpanded = expandedScanId === scan.id;

                  return (
                    <motion.div key={scan.id} layout className="flex flex-col">
                      <AiScanCard 
                        // ✅ Resolvendo Erro ESLint: Casting correto do status
                        scan={{ ...scan, status: (scan.status as ScanStatus) || "pending" }} 
                        onClick={() => handleToggleExpand(scan.id)}
                        // ✅ Resolvendo Erro TS 2322: Garantindo que onDelete receba uma função
                        // Se não for Admin, passamos uma função que não faz nada (no-op)
                        onDelete={isAdmin ? (e) => {
                            if (isExpanded) setExpandedScanId(null);
                            handleDeleteScan(e, scan.id);
                        } : () => { /* No-op para não-admins */ }} 
                      />

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-4 px-2"
                          >
                            <AiScanResultView taskId={scan.id} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}