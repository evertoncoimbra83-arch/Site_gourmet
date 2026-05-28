import React from "react"; // ✅ Adicionado para corrigir o escopo JSX
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SheetTitle } from "@/components/ui/sheet";
import { ShoppingBag, X } from "lucide-react";
import { MappedDish, DishSize } from "./../logic/types";

interface DrawerHeaderProps {
  dish: MappedDish | null;
  selectedSize: DishSize | null;
  onClose: () => void;
}

export function DrawerHeader({ dish, selectedSize, onClose }: DrawerHeaderProps) {
  return (
    <div className="relative shrink-0 bg-white border-b border-slate-50">
      <div className="absolute top-4 right-4 z-50 md:hidden">
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/10 backdrop-blur-md text-white">
          <X size={20} />
        </Button>
      </div>
      <div className="relative w-full h-44 md:h-64 bg-slate-100">
        {dish?.imageUrl ? (
          <img src={dish.imageUrl} className="w-full h-full object-cover" alt={dish.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500"><ShoppingBag size={40} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFC] via-transparent to-transparent" />
      </div>
      <div className="px-6 md:px-8 pb-4 -mt-8 relative z-10 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.2em] bg-white px-3 py-1 rounded-full shadow-sm border border-slate-50">Configuração</span>
          {selectedSize && (
            <Badge className="bg-slate-900 text-white border-none font-black text-[9px] px-3 py-1 rounded-full animate-in zoom-in">
              TAMANHO: {selectedSize.name}
            </Badge>
          )}
        </div>
        <SheetTitle className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
          {dish?.name || "..."}
        </SheetTitle>
      </div>
    </div>
  );
}
