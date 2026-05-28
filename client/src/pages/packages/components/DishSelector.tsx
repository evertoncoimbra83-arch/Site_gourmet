// client/src/pages/packages/components/DishSelector.tsx
import React from "react";
import { ChevronRight, UtensilsCrossed, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { TRPCBaseItem } from "../view/PackageDrawer";

interface DishSelectorProps {
  dishes: TRPCBaseItem[];
  onSelect: (dish: TRPCBaseItem) => void;
}

export function DishSelector({ dishes, onSelect }: DishSelectorProps) {
  if (!dishes || dishes.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl"
      >
        <UtensilsCrossed className="mx-auto text-slate-300 mb-2" size={32} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Nenhum prato disponível para este slot
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2 py-4">
      <div className="flex items-center justify-between mb-4 ml-1">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
          1. Escolha o prato desta refeição
        </h4>
        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
          {dishes.length} Opções
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-2 max-h-100 overflow-y-auto no-scrollbar pr-1">
        {dishes.map((dish, idx) => (
          <motion.button
            key={String(dish.id)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onSelect(dish)}
            className="group w-full flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-black uppercase italic text-slate-700 group-hover:text-emerald-700 transition-colors">
                {String(dish.name)}
              </span>
              
              {dish.energy_kcal !== undefined && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <Zap size={10} className="text-amber-400" />
                  <span>{Math.round(Number(dish.energy_kcal))} kcal base</span>
                </div>
              )}
            </div>
            
            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 text-slate-300 transition-all">
              <ChevronRight size={18} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
