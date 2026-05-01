import React from "react";
import { Flame, Beef, Wheat, Droplets, CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrescriptionOptionData } from "../hooks/usePrescriptionLogic";

interface OptionCardProps {
  opt: PrescriptionOptionData;
  mealName?: string;
  basePrice: number;
  nutriDiscount: number;
  onAdd: () => void;
}

export function OptionCard({ opt, basePrice, nutriDiscount, onAdd }: OptionCardProps) {
  const macros = opt.nutritionalData?.baseMacros || { 
    kcal: 0, 
    protein: 0, 
    carbs: 0, 
    fat: 0 
  };
  
  const safeBasePrice = Number(basePrice) || 0;
  const finalPrice = nutriDiscount > 0 
    ? safeBasePrice * (1 - nutriDiscount / 100) 
    : safeBasePrice;

  return (
    <div className="bg-white rounded-4xl border-2 border-slate-100 p-2 flex flex-col shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group h-full">
      <div className="p-6 flex-1">
        <h3 className="text-lg font-black uppercase italic text-slate-800 mb-5 group-hover:text-emerald-700 transition-colors leading-tight">
          {opt.name || "Prato Sem Nome"}
        </h3>
        
        <div className="grid grid-cols-4 gap-2 mb-8 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
          <div className="flex flex-col items-center">
            <Flame size={14} className="text-slate-400 mb-1" />
            <span className="text-[10px] font-black text-slate-800">
              {Math.round(Number(macros.kcal) || 0)}
            </span>
            <span className="text-[8px] uppercase text-slate-400 font-bold">Kcal</span>
          </div>
          <div className="flex flex-col items-center">
            <Beef size={14} className="text-emerald-500 mb-1" />
            <span className="text-[10px] font-black text-emerald-700">
              {Math.round(Number(macros.protein) || 0)}g
            </span>
            <span className="text-[8px] uppercase text-emerald-500 font-bold">Prot</span>
          </div>
          <div className="flex flex-col items-center">
            <Wheat size={14} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-black text-blue-700">
              {Math.round(Number(macros.carbs) || 0)}g
            </span>
            <span className="text-[8px] uppercase text-blue-500 font-bold">Carb</span>
          </div>
          <div className="flex flex-col items-center">
            <Droplets size={14} className="text-orange-500 mb-1" />
            <span className="text-[10px] font-black text-orange-700">
              {Math.round(Number(macros.fat) || 0)}g
            </span>
            <span className="text-[8px] uppercase text-orange-500 font-bold">Gord</span>
          </div>
        </div>

        <ul className="space-y-2.5 mb-2">
          {(opt.allowedAccompaniments || []).map((acc: { name: string }, aIdx: number) => (
            <li key={aIdx} className="flex items-start gap-2 text-sm font-medium text-slate-600">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="leading-tight">{acc.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-slate-50 p-5 rounded-[2rem] flex items-center justify-between border border-slate-100 mt-auto">
        <div className="flex flex-col text-left">
          {nutriDiscount > 0 && safeBasePrice > 0 && (
            <span className="text-[10px] font-bold text-slate-400 line-through">
              R$ {safeBasePrice.toFixed(2).replace('.', ',')}
            </span>
          )}
          <span className="text-xl font-black italic text-emerald-600 leading-none">
            R$ {finalPrice.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <Button 
          onClick={onAdd}
          className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-md transition-all active:scale-95"
        >
          <ShoppingBag size={16} className="mr-2 hidden sm:block" /> Adicionar
        </Button>
      </div>
    </div>
  );
}