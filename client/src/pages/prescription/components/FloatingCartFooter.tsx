import React from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingCartFooterProps {
  totalItems: number;
  onCheckout: () => void;
}

export function FloatingCartFooter({ totalItems, onCheckout }: FloatingCartFooterProps) {
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-bottom-10 flex justify-center">
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-900 rounded-[1.5rem] p-3 md:p-4 shadow-xl">
        <div className="flex items-center gap-4 pl-2">
          <div className="bg-emerald-500 text-slate-900 h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/30">
            {totalItems}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black uppercase italic leading-none md:text-lg">Sua Sacola</span>
            <span className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Pronta para finalizar</span>
          </div>
        </div>
        
        <Button 
          onClick={onCheckout}
          className="h-12 px-6 md:px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase text-[10px] md:text-xs tracking-widest transition-all active:scale-95"
        >
          Finalizar <ShoppingBag size={18} className="ml-2 hidden md:block" />
        </Button>
      </div>
    </div>
  );
}