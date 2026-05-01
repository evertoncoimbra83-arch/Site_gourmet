import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface NutritionData {
  kcal?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fats?: string | number;
  ingredients?: string;
  [key: string]: unknown; // Permite chaves dinâmicas da API
}

interface NutritionProps {
  data: string | NutritionData | null | undefined;
  totalWeight?: number;
}

export const NutritionInfo = ({ data, totalWeight = 100 }: NutritionProps) => {
  const [showFull, setShowFull] = useState(false);
  let info: NutritionData | null = null;

  if (typeof data === "string") {
    try { info = JSON.parse(data) as NutritionData; } catch { return null; }
  } else {
    info = data || null;
  }

  if (!info || typeof info !== "object") return null;

  const parseNum = (val: unknown): number => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;
    const num = parseFloat(String(val).replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  const kcal = Math.round(parseNum(info.kcal || info.energyKcal || info.energy_kcal));
  const proteins = parseNum(info.proteins || info.protein);
  const carbs = parseNum(info.carbs || info.carbohydrates);
  const fats = parseNum(info.fats || info.fatTotal || info.fat_total);

  const calculateVD = (value: number, type: string) => {
    const limits: Record<string, number> = { 
      kcal: 2000, carbs: 300, proteins: 75, fats: 55, 
      fatsSat: 22, fiber: 25, sodium: 2000, calcium: 1000, iron: 14 
    };
    if (!limits[type]) return "-";
    return `${Math.round((value / limits[type]) * 100)}%`;
  };

  const rows = [
    { label: "Valor energético (kcal)", val: kcal, vdKey: "kcal", unit: "" },
    { label: "Carboidratos", val: carbs, vdKey: "carbs", unit: "g" },
    { label: "Proteínas", val: proteins, vdKey: "proteins", unit: "g" },
    { label: "Gorduras totais", val: fats, vdKey: "fats", unit: "g" },
    { label: "Gorduras saturadas", val: parseNum(info.saturatedFats || info.fatSaturated || info.fat_saturated), vdKey: "fatsSat", unit: "g", indent: true },
    { label: "Fibra alimentar", val: parseNum(info.fiber), vdKey: "fiber", unit: "g" },
    { label: "Sódio", val: parseNum(info.sodium), vdKey: "sodium", unit: "mg" },
  ];

  if (kcal === 0 && !rows.some(r => r.val > 0)) return null;

  return (
    <div className="space-y-4 text-left">
      <button 
        type="button"
        onClick={() => setShowFull(!showFull)}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-900 transition-all group"
      >
        <FileText size={14} className="text-slate-400 group-hover:text-slate-900" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">
          {showFull ? "Ocultar Tabela Nutricional" : "Ver Tabela Nutricional Completa"}
        </span>
        {showFull ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showFull && (
        <div className="animate-in slide-in-from-top-4 duration-300 space-y-6">
          <div className="bg-white border-2 border-slate-900 p-1 rounded-sm shadow-xl">
            <div className="bg-slate-900 text-white p-2 text-center">
              <h3 className="font-black uppercase text-xs tracking-widest italic">Informação Nutricional</h3>
              <p className="text-[9px] font-bold uppercase opacity-90">Porção de {totalWeight}g</p>
            </div>

            <div className="mt-1 border-t-2 border-slate-900">
              {rows.map((row, idx) => (
                <div key={idx} className={cn(
                  "flex justify-between px-2 py-1.5 border-b border-slate-200 text-[10px] items-center",
                  row.indent && "pl-6 bg-slate-50/40"
                )}>
                  <span className={cn("text-slate-700", !row.indent && "font-black text-slate-900 uppercase")}>
                    {row.label}
                  </span>
                  <div className="flex gap-4 items-baseline">
                    <span className="font-black text-slate-900">{row.val}{row.unit}</span>
                    <span className="min-w-[35px] text-right font-black text-slate-400 text-[9px]">
                      {calculateVD(row.val, row.vdKey)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};