import React from "react"; // ✅ Adicionado para resolver o erro 'React' must be in scope
import { useOrderItemFormatter } from "@/_core/hooks/useOrderItemFormatter";
import { Utensils, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- INTERFACES LOCAIS ---

interface OptionItem {
  name: string;
  groupName?: string;
  dishName?: string;
  slotName?: string;
  accompaniments?: Array<{ name: string }>;
}

export function ItemDetailsDisplay({ item, className }: { item: unknown, className?: string }) {
const formatted = useOrderItemFormatter(item as Parameters<typeof useOrderItemFormatter>[0]);
  if (!formatted) return null;

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      {/* Título do Item (Prato ou Pacote) */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex flex-col">
          <p className="text-sm font-bold text-slate-800 leading-tight">
            {formatted.quantity}x {formatted.name}
          </p>
          {formatted.size && (
            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">
              Tamanho: {formatted.size}
            </span>
          )}
        </div>
        <p className="text-xs font-bold text-slate-500">
          {Number(formatted.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>

      {(formatted.options as OptionItem[]).map((option, idx) => {
        
        // ✅ LAYOUT PACOTE
        if (formatted.isPackage) {
          return (
            <div key={idx} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 relative ml-1 mb-2">
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-orange-400 rounded-r-full" />
              <div className="flex items-center gap-2 mb-1 ml-1">
                <Utensils size={10} className="text-orange-500" />
                <p className="text-[10px] font-black text-slate-700 uppercase italic">
                  {option.slotName || `Item ${idx+1}`}: <span className="text-orange-600">{option.dishName || option.name}</span>
                </p>
              </div>
              <div className="ml-4 flex flex-wrap gap-x-2">
                {option.accompaniments?.map((acc, i) => (
                  <span key={i} className="text-[9px] text-slate-400 font-bold">• {acc.name}</span>
                ))}
              </div>
            </div>
          );
        }

        // ✅ LAYOUT PRATO AVULSO
        return (
          <div key={idx} className="flex gap-2 text-[10px] text-slate-500 font-bold ml-3 items-center">
            <Circle size={4} className="fill-emerald-400 text-emerald-400 shrink-0" />
            <span className="leading-none">
              {option.groupName && (
                <span className="opacity-40 uppercase text-[7px] mr-1">{option.groupName}:</span>
              )}
              {option.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}