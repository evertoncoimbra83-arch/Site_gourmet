import React from "react"; // ✅ Adicionado para corrigir o erro de escopo JSX
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { DishSize } from "./../logic/types";

interface DrawerFooterProps {
  dishExists: boolean;
  isComplete: boolean;
  isAdding: boolean;
  selectedSize: DishSize | null;
  quantity: number;
  totalPrice: number;
  setQuantity: (q: number) => void;
  onAdd: () => void;
}

export function DrawerFooter({ 
  dishExists, isComplete, isAdding, selectedSize, quantity, totalPrice, setQuantity, onAdd 
}: DrawerFooterProps) {
  if (!dishExists) return null;

  return (
    <div className="p-4 md:p-6 border-t bg-white shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 w-full">
      <div className="w-full space-y-4"> 
        {!isComplete && (
          <div className="bg-amber-50 rounded-xl py-2.5 border border-amber-100 flex items-center justify-center gap-2">
            <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest italic animate-pulse">
              {!selectedSize ? "Escolha um tamanho" : "Finalize sua montagem"}
            </p>
          </div>
        )}
        
        <div className="flex gap-2 items-center w-full">
          {/* QUANTIDADE */}
          <div className="flex items-center bg-slate-50 rounded-2xl h-14 px-1 shrink-0 border border-slate-100">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-white rounded-xl" 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus size={14} />
            </Button>
            <span className="w-8 text-center font-black text-base italic">{quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-white rounded-xl" 
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={14} />
            </Button>
          </div>
          
          {/* BOTÃO ADICIONAR */}
          <Button 
            data-testid="btn-add-carrinho"
            disabled={!isComplete || isAdding || !selectedSize} 
            onClick={onAdd}
            className={cn(
              "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl overflow-hidden", 
              isComplete ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]" : "bg-slate-100 text-slate-400"
            )}
          >
            {isAdding ? <Loader2 className="animate-spin" size={20} /> : (
              <div className="flex items-center justify-between w-full px-2">
                <span className="hidden md:inline italic truncate pr-2">Adicionar ao Carrinho</span>
                <ShoppingBag size={20} className="md:hidden ml-2" />
                <span className="bg-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap text-[12px] border border-white/5">
                  R$ {(totalPrice * quantity).toFixed(2)}
                </span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
