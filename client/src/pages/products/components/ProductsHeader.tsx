import React from "react";
import { Utensils, Search } from "lucide-react";

interface ProductsHeaderProps {
  search: string;
  setSearch: (val: string) => void;
}

export function ProductsHeader({
  search,
  setSearch,
}: ProductsHeaderProps) {
  return (
    <div className="relative pt-24 pb-16 md:pb-20 overflow-hidden bg-white border-b border-slate-100">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
        <Utensils size={400} strokeWidth={0.5} />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-4">
          <div className="h-1 w-8 bg-emerald-500 rounded-full" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Gastronomia de Performance
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter text-slate-900 uppercase leading-[0.85] mb-4 md:mb-6">
              Nosso <span className="text-emerald-600">Cardápio</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs md:text-lg max-w-md italic leading-relaxed">
              Sabor artesanal com contagem de macros precisa para seus objetivos.
            </p>
          </div>

          {/* BARRA DE BUSCA */}
          <div className="w-full lg:w-96 relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              placeholder="BUSCAR NO CARDÁPIO..."
              className="w-full h-14 md:h-16 pl-14 pr-6 rounded-2xl border-none bg-slate-50 font-bold text-[10px] md:text-xs uppercase tracking-widest focus:ring-4 focus:ring-emerald-500/5 focus:bg-white outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}