import React from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import { Sparkles, ArrowRight } from "lucide-react";

interface DietPlan {
  id: string | number;
  type: string;
  planName: string;
}

export function ActiveDietBanner() {
  const navigate = useNavigate();
  
  // ✅ Ajustado para o caminho correto da procedure (store.nutri ou nutri)
  // Certifique-se de que no seu AppRouter ela está em 'store.nutri' ou apenas 'nutri'
  const { data: plans, isLoading } = trpc.store.nutri.getMyPrescription.useQuery();

  if (isLoading || !plans || (plans as DietPlan[]).length === 0) return null;

  // ✅ Cast seguro para buscar o scan ativo
  const activeScan = (plans as DietPlan[]).find((p) => p.type === 'ai_scan');

  if (!activeScan) return null;

  return (
    <div 
      onClick={() => navigate(`/resultado-scanner?scanId=${activeScan.id}`)}
      className="relative overflow-hidden bg-linear-to-r from-emerald-500 to-teal-600 rounded-[2rem] shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-in fade-in zoom-in text-left"
    >
        <div className="p-5 md:p-6 flex items-center justify-between relative z-10">
           <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/30 shrink-0">
                <Sparkles className="text-white" size={24} />
              </div>
              <div className="flex flex-col text-left">
                 <span className="text-emerald-50 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-90">
                   Análise Disponível
                 </span>
                 <span className="text-white font-black italic text-lg md:text-xl uppercase leading-none truncate">
                   {activeScan.planName}
                 </span>
              </div>
           </div>
           <div className="bg-white text-emerald-600 rounded-full p-2 md:p-3 group-hover:scale-110 transition-all shadow-md shrink-0 ml-2">
              <ArrowRight size={20} strokeWidth={3} />
           </div>
        </div>
        
        {/* Efeito visual de fundo para manter o padrão de design do projeto */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
    </div>
  );
}