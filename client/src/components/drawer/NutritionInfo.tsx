import React from "react";
import { Label } from "@/components/ui/label"; 
import { Flame, Dumbbell, Wheat, Droplets, Info } from "lucide-react"; 
import { cn } from "@/lib/utils";

export const NutritionInfo = ({ data }: any) => {
  let info = data;
  if (typeof data === 'string') {
    try {
      info = JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  if (!info || typeof info !== 'object') return null;

  const parseBrazilianNumber = (field: any) => {
    if (!field) return 0;
    let rawValue = typeof field === 'object' ? String(field.value || "0") : String(field);
    if (rawValue.includes('Kcal')) rawValue = rawValue.split('Kcal')[0];
    const cleanValue = rawValue.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  };

  const stats = [
    { 
      label: "Calorias", 
      value: parseBrazilianNumber(info.energy || info.calories), 
      unit: "kcal",
      icon: <Flame size={12} className="text-orange-500" />,
      bgColor: "bg-orange-50"
    },
    { 
      label: "Proteínas", 
      value: parseBrazilianNumber(info.protein || info.proteins), 
      unit: "g",
      icon: <Dumbbell size={12} className="text-blue-500" />,
      bgColor: "bg-blue-50"
    },
    { 
      label: "Carbos", 
      value: parseBrazilianNumber(info.carbs || info.carbohydrates), 
      unit: "g",
      icon: <Wheat size={12} className="text-amber-500" />,
      bgColor: "bg-amber-50"
    },
    { 
      label: "Gorduras", 
      value: parseBrazilianNumber(info.fat_total || info.fats || info.fat), 
      unit: "g",
      icon: <Droplets size={12} className="text-rose-500" />,
      bgColor: "bg-rose-50"
    },
  ];

  const hasData = stats.some(s => s.value > 0);
  if (!hasData) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between px-1">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
          Macros da Refeição
        </Label>
        
        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-700 uppercase tracking-tighter">Total Dinâmico</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {stats.map((item) => (
          <div 
            key={item.label} 
            className="relative group bg-white border border-slate-100 rounded-[1.2rem] p-3 pt-4 flex flex-col items-center justify-center transition-all hover:border-slate-200 hover:shadow-md"
          >
            <div className={cn("absolute -top-2 p-1.5 rounded-lg shadow-sm border border-white", item.bgColor)}>
              {item.icon}
            </div>

            <div className="flex flex-col items-center mt-1">
              <span className="text-sm font-black text-slate-900 leading-none">
                {Number.isInteger(item.value) ? item.value : item.value.toFixed(1).replace('.', ',')}
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                {item.unit}
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-50 w-full text-center">
               <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest opacity-80">
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* ✅ NOTA DE VALORES APROXIMADOS */}
      <div className="flex items-center justify-center gap-2 bg-slate-50/50 py-2 rounded-xl border border-dashed border-slate-100">
        <Info size={10} className="text-slate-400" />
        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.15em]">
          Valores nutricionais aproximados calculados com base na sua seleção
        </p>
      </div>
    </div>
  );
};