// src/components/ProductCard.tsx
import React from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Scale, ChevronRight } from "lucide-react";

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    image: string;
    kcal?: number | null;
    description?: string; 
    sizes?: { id: number; name: string }[]; 
  };
  onClick?: () => void;
};

export function ProductCard({ product, onClick }: ProductCardProps) {
  const availableSizes = product.sizes || [];

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white border border-slate-100 rounded-[2rem] shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col h-full text-left"
    >
      
      {/* AREA DA IMAGEM COM OVERLAY GRADIENTE */}
      <div className="relative aspect-[4/3] md:aspect-square bg-slate-50 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* BADGE DE KCAL FLUTUANTE */}
        {product.kcal && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-slate-100">
            <UtensilsCrossed size={10} className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-700 uppercase italic">
              {product.kcal} kcal
            </span>
          </div>
        )}
      </div>

      {/* CONTEÚDO DO CARD */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-black uppercase italic text-slate-800 leading-tight tracking-tighter line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed italic">
              {product.description}
            </p>
          )}
        </div>

        {/* SEÇÃO DE TAMANHOS / OPÇÕES */}
        <div className="pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 mb-3">
             <Scale size={12} className="text-emerald-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tamanhos Disponíveis</span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
            {availableSizes.length > 0 ? (
              availableSizes.map((size) => (
                <Badge
                  key={size.id}
                  variant="secondary"
                  className="bg-slate-50 text-slate-500 border-none font-black text-[9px] px-2.5 py-0.5 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors"
                >
                  {size.name}
                </Badge>
              ))
            ) : (
              <span className="text-[9px] font-bold text-slate-300 uppercase italic">Opções sob consulta</span>
            )}
          </div>
        </div>

        {/* BOTÃO DE AÇÃO PREMIUM */}
        <Button
          className="mt-2 w-full h-12 rounded-2xl bg-slate-900 text-white hover:bg-emerald-600 font-black uppercase text-[10px] tracking-[0.1em] shadow-lg shadow-slate-100 transition-all active:scale-95 group/btn border-none"
        >
          <span>Escolher Detalhes</span>
          <ChevronRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}