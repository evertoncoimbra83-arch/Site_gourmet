import React from "react"; // ✅ Adicionado para satisfazer a regra react-in-jsx-scope
import { AdminThemeView } from "./adminTheme/AdminThemeView";
import { Palette, ChevronRight, LayoutGrid } from "lucide-react"; 

export default function AdminTheme() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER PREMIUM */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <Palette size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Branding & Design</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Identidade <span className="text-emerald-600">Visual</span><span className="text-emerald-600">.</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base italic max-w-2xl">
              Personalize o <span className="text-slate-900 font-bold">DNA cromático</span> da plataforma. As alterações refletem-se em tempo real na interface do cliente.
            </p>
          </div>

          {/* Breadcrumb discreto */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
            <LayoutGrid size={12} className="text-slate-300" />
            <span>Configurações</span>
            <ChevronRight size={10} className="text-slate-300" />
            <span className="text-emerald-600">Style Studio</span>
          </div>
        </div>
      </header>

      {/* DIVISOR DE ARQUITETURA */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200/60"></div>
        </div>
        <div className="relative flex justify-start">
          <span className="bg-background pr-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">
            Laboratório de Estilo
          </span>
        </div>
      </div>
      
      {/* VIEW DE CONTROLE */}
      <div className="rounded-4xl overflow-hidden">
        <AdminThemeView />
      </div>

    </div>
  );
}