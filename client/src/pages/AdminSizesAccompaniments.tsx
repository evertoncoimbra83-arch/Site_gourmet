import React from "react"; // ✅ Adicionado para satisfazer o linter
import { AdminSizesView } from "./adminSizes/view/AdminSizesView";
import { Ruler, ChevronRight, LayoutGrid } from "lucide-react"; 

export default function AdminSizesAccompaniments() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER PADRONIZADO */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <Ruler size={18} className="rotate-90" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Métricas & Escala</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Engenharia de <span className="text-emerald-600">Porções</span><span className="text-emerald-600">.</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base italic max-w-2xl">
              Gerencie tamanhos globais e estabeleça as <span className="text-slate-900 font-bold">regras de vínculos</span> entre porções e grupos de acompanhamentos.
            </p>
          </div>

          {/* Breadcrumb discreto */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
            <LayoutGrid size={12} className="text-slate-300" />
            <span>Cardápio</span>
            <ChevronRight size={10} className="text-slate-300" />
            <span className="text-emerald-600">Engenharia de Porções</span>
          </div>
        </div>
      </header>

      {/* DIVISOR ESTILIZADO */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200/60"></div>
        </div>
        <div className="relative flex justify-start">
          <span className="bg-background pr-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">
            Arquitetura Relacional
          </span>
        </div>
      </div>
      
      {/* VIEW PRINCIPAL */}
      <div className="rounded-4xl overflow-hidden"> {/* ✅ Ajustado para rounded-4xl */}
        <AdminSizesView />
      </div>

    </div>
  );
}