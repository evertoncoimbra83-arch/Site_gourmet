import { AdminSizesView } from "./adminSizes/view/AdminSizesView";
import { Ruler, ChevronRight } from "lucide-react"; // Ícone para reforçar a ideia de medida/tamanho

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
            <p className="text-slate-500 font-medium text-sm md:text-base italic">
              Configure tamanhos, pesos e regras de acompanhamentos customizáveis.
            </p>
          </div>

          {/* Breadcrumb discreto para navegação interna */}
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <span>Admin</span>
            <ChevronRight size={10} />
            <span className="text-slate-500">Porções</span>
          </div>
        </div>
      </header>

      {/* DIVISOR ESTILIZADO */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-100"></div>
        </div>
        <div className="relative flex justify-start">
          <span className="bg-[#F8FAFC] pr-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
            Painel de Configuração
          </span>
        </div>
      </div>
      
      {/* VIEW PRINCIPAL */}
      <div className="rounded-[2.5rem]">
        <AdminSizesView />
      </div>

    </div>
  );
}