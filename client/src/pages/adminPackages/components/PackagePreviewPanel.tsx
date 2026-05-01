// client/src/pages/adminPackages/components/PackagePreviewPanel.tsx

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, ShoppingCart, Zap, Info } from "lucide-react";

interface Slot {
  name: string;
  dishIds?: string[];
  groups?: { id: string; customLabel?: string | null }[];
}

interface PackagePreviewProps {
  data: {
    name: string;
    description: string;
    image_url?: string;
    base_price: string | number;
    sale_price?: string | number;
    category: string;
    highlights: string;
    number_of_options: number;
    slots: Slot[];
  };
}

export function PackagePreviewPanel({ data }: PackagePreviewProps) {
  const finalPrice = Number(data.sale_price || data.base_price || 0);
  const hasDiscount = Boolean(data.sale_price && Number(data.sale_price) < Number(data.base_price));
  
  // Transforma a string de highlights em array
  const highlightList = data.highlights 
    ? data.highlights.split(",").map(h => h.trim()).filter(h => h !== "") 
    : [];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
      
      {/* 1. PREVIEW NA VITRINE (CARD DO CLIENTE) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Info size={14} className="text-blue-500" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preview na Vitrine</h4>
        </div>

        <div className="max-w-85 mx-auto md:mx-0 bg-white rounded-4xl border border-slate-100 shadow-xl overflow-hidden group transition-all hover:shadow-2xl">
          {/* Imagem */}
          <div className="relative h-48 bg-slate-100 overflow-hidden">
            {data.image_url ? (
              <img src={data.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package size={48} strokeWidth={1} />
              </div>
            )}
            <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[9px] px-3">
              {data.category.toUpperCase()}
            </Badge>
          </div>

          {/* Conteúdo do Card */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-tight italic uppercase">
                {data.name || "Nome do Combo"}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-1">
                {data.description || "Descrição curta que aparecerá para o cliente no site..."}
              </p>
            </div>

            {/* Preços */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tighter">
                R$ {finalPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-300 line-through font-bold">
                  R$ {Number(data.base_price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-2 pt-2">
              {highlightList.length > 0 ? (
                highlightList.map((h, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                    <CheckCircle2 size={10} /> {h}
                  </div>
                ))
              ) : (
                <span className="text-[9px] text-slate-300 italic">Sem diferenciais cadastrados</span>
              )}
            </div>

            <button className="w-full h-12 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-orange-600 transition-colors">
              <ShoppingCart size={14} /> Montar meu Kit
            </button>
          </div>
        </div>
      </section>

      {/* 2. RESUMO DA ESTRUTURA (FLOW DO CLIENTE) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Zap size={14} className="text-orange-500" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fluxo de Escolha ({data.number_of_options} Marmitas)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.slots.length > 0 ? (
            data.slots.map((slot, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 shadow-sm">
                  {idx + 1}
                </div>
                <div>
                  <h5 className="text-[11px] font-black uppercase text-slate-700 leading-none">{slot.name || "Sem Nome"}</h5>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[8px] font-bold text-orange-500 uppercase tracking-tighter">
                      {slot.dishIds?.length || 0} Opções de Pratos
                    </span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                      •
                    </span>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">
                      {slot.groups?.length || 0} Regras
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">
              Nenhuma marmita configurada
            </div>
          )}
        </div>
      </section>
    </div>
  );
}