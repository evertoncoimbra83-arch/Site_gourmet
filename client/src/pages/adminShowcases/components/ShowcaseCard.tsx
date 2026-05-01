import React from "react";
import { LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

// --- INTERFACES ---

interface ShowcaseProduct {
  id: string | number;
}

interface Showcase {
  id: string | number;
  title: string;
  active: boolean;
  // ✅ Substituído 'any[]' por uma interface mínima de produto
  products?: ShowcaseProduct[]; 
}

interface ShowcaseCardProps {
  showcase: Showcase;
  onClick: () => void;
}

export function ShowcaseCard({ showcase, onClick }: ShowcaseCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group bg-white p-8 rounded-4xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all relative overflow-hidden cursor-pointer text-left"
    >
        <div className="flex justify-between items-start mb-4 text-left">
          <div className={cn(
            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
            showcase.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
          )}>
            {showcase.active ? "Ativa na Home" : "Rascunho"}
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all">
            <LayoutTemplate size={18} />
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2 leading-none group-hover:text-emerald-600 transition-colors text-left">
          {showcase.title}
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
          {showcase.products?.length || 0} Itens Vinculados
        </p>
    </div>
  );
}