import React, { useMemo } from "react"; // ✅ Adicionado React
import { cn } from "@/lib/utils";
import { PieChart } from "lucide-react"; // ✅ Removido AlertCircle (não usado)

// --- INTERFACES ---
interface NutritionStats {
  kcal?: string | number;
  energyKcal?: string | number;
  energy_kcal?: string | number;
  carbs?: string | number;
  proteins?: string | number;
  protein?: string | number;
  fats?: string | number;
  fatTotal?: string | number;
  fat_total?: string | number;
  fatsSat?: string | number;
  fatSaturated?: string | number;
}

interface NutritionSummaryBarProps {
  data: NutritionStats;
  selectedAccompaniments?: NutritionStats[];
  onShowFull: () => void;
}

export const NutritionSummaryBar = ({ 
  data, 
  selectedAccompaniments = [], 
  onShowFull 
}: NutritionSummaryBarProps) => {

  const stats = useMemo(() => {
    const p = (v: string | number | undefined | null) => parseFloat(String(v || 0).replace(",", "."));

    // 1. Macros do Prato Principal
    let totalKcal = p(data?.kcal || data?.energyKcal || data?.energy_kcal);
    let totalCarbs = p(data?.carbs);
    let totalPro = p(data?.proteins || data?.protein);
    let totalFat = p(data?.fats || data?.fatTotal || data?.fat_total);

    // 2. Soma dos Acompanhamentos
    if (selectedAccompaniments.length > 0) {
      selectedAccompaniments.forEach(acc => {
        totalKcal += p(acc.energyKcal || acc.kcal || acc.energy_kcal);
        totalCarbs += p(acc.carbs);
        totalPro += p(acc.proteins || acc.protein);
        totalFat += p(acc.fatTotal || acc.fats || acc.fat_total);
      });
    }

    return {
      kcal: Math.round(totalKcal),
      carbs: totalCarbs,
      pro: totalPro,
      fat: totalFat
    };
  }, [data, selectedAccompaniments]);

  const totalGrams = stats.carbs + stats.pro + stats.fat || 1;

  const items = [
    { label: "Carbo", val: stats.carbs, color: "bg-blue-500", width: (stats.carbs / totalGrams) * 100 },
    { label: "Prot", val: stats.pro, color: "bg-emerald-500", width: (stats.pro / totalGrams) * 100 },
    { label: "Gord", val: stats.fat, color: "bg-amber-500", width: (stats.fat / totalGrams) * 100 },
  ];

  if (stats.kcal === 0) return null;

  return (
    <div className="bg-white border-y border-slate-100 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
            Total Nutricional <span className="text-[8px] opacity-50 italic">(Prato + Itens)</span>
          </span>
          <span className="text-2xl font-black text-slate-900 italic leading-none">
            {stats.kcal} <span className="text-xs tracking-tighter not-italic text-emerald-600">KCAL</span>
          </span>
        </div>
        
        <button 
          type="button"
          onClick={onShowFull}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm active:scale-95"
        >
          <PieChart size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">Detalhes</span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="h-3 w-full flex rounded-full overflow-hidden bg-slate-100 border border-slate-100 shadow-inner">
          {items.map((item) => (
            <div 
              key={item.label}
              className={cn("h-full transition-all duration-500 ease-out", item.color)}
              style={{ width: `${item.width}%` }}
            />
          ))}
        </div>
        
        <div className="flex justify-between px-1">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
                <span className="text-[9px] font-black uppercase text-slate-400">{item.label}</span>
              </div>
              <span className="text-[11px] font-black text-slate-800">
                {item.val.toFixed(1)}<span className="text-[8px] ml-0.5 text-slate-400">g</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};