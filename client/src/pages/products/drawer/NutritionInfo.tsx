import React, { useState, useMemo } from "react"; // ✅ Adicionado useMemo aqui
import { Label } from "@/components/ui/label";
import { ScrollText, ChevronDown, ChevronUp, FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Interface para evitar 'any' nos dados nutricionais
interface NutritionData {
  kcal?: string | number;
  energyKcal?: string | number;
  energy_kcal?: string | number;
  proteins?: string | number;
  protein?: string | number;
  carbs?: string | number;
  carbohydrates?: string | number;
  fats?: string | number;
  fatTotal?: string | number;
  fat_total?: string | number;
  kj?: string | number;
  energyKj?: string | number;
  energy_kj?: string | number;
  saturatedFats?: string | number;
  fatSaturated?: string | number;
  fat_saturated?: string | number;
  transFats?: string | number;
  fatTrans?: string | number;
  fat_trans?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  calcium?: string | number;
  iron?: string | number;
  ingredients?: string;
}

interface NutritionProps {
  data: string | NutritionData;
  totalWeight?: number;
}

export const NutritionInfo = ({ data, totalWeight = 100 }: NutritionProps) => {
  const [showFull, setShowFull] = useState(false);
  
  // ✅ Lógica de parse segura sem 'any'
  const info: NutritionData | null = useMemo(() => {
    if (!data) return null;
    if (typeof data === "string") {
      try {
        return JSON.parse(data) as NutritionData;
      } catch {
        return null; // ✅ Removido 'e' não utilizado
      }
    }
    return data as NutritionData;
  }, [data]);

  if (!info || typeof info !== "object") return null;

  const parseNum = (val: string | number | undefined | null): number => {
    if (val === undefined || val === null || val === "") return 0;
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
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
    { label: "Valor energético (kJ)", val: parseNum(info.kj || info.energyKj || info.energy_kj), vdKey: "", unit: "", isSecondary: true },
    { label: "Carboidratos", val: carbs, vdKey: "carbs", unit: "g" },
    { label: "Proteínas", val: proteins, vdKey: "proteins", unit: "g" },
    { label: "Gorduras totais", val: fats, vdKey: "fats", unit: "g" },
    { label: "Gorduras saturadas", val: parseNum(info.saturatedFats || info.fatSaturated || info.fat_saturated), vdKey: "fatsSat", unit: "g", indent: true },
    { label: "Gorduras trans", val: parseNum(info.transFats || info.fatTrans || info.fat_trans), vdKey: "", unit: "g", indent: true, noVD: true },
    { label: "Fibra alimentar", val: parseNum(info.fiber), vdKey: "fiber", unit: "g" },
    { label: "Sódio", val: parseNum(info.sodium), vdKey: "sodium", unit: "mg" },
    { label: "Cálcio", val: parseNum(info.calcium), vdKey: "calcium", unit: "mg", isSecondary: true },
    { label: "Ferro", val: parseNum(info.iron), vdKey: "iron", unit: "mg", isSecondary: true },
  ];

  if (kcal === 0 && !rows.some(r => r.val > 0)) return null;

  return (
    <div className="space-y-4">
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
              <p className="text-[9px] font-bold uppercase opacity-90">Porção de {totalWeight}g ({totalWeight > 300 ? 'Refeição completa' : 'Porção sugerida'})</p>
            </div>

            <div className="mt-1 border-t-2 border-slate-900">
              <div className="flex justify-between px-2 py-1.5 bg-slate-100 border-b-2 border-slate-900 text-[9px] font-black uppercase italic">
                <span>Constituintes</span>
                <span>%VD (*)</span>
              </div>
              {rows.map((row, idx) => (
                <div key={idx} className={cn(
                  "flex justify-between px-2 py-1.5 border-b border-slate-200 text-[10px] items-center",
                  row.indent && "pl-6 bg-slate-50/40",
                  row.isSecondary && "bg-slate-50/20 py-1"
                )}>
                  <span className={cn("text-slate-700", !row.indent && "font-black text-slate-900 uppercase tracking-tighter")}>
                    {row.label}
                  </span>
                  <div className="flex gap-4 items-baseline">
                    <span className="font-black text-slate-900">
                      {row.label.includes('Sódio') || row.label.includes('kcal') || row.label.includes('kJ') 
                        ? Math.round(row.val).toLocaleString("pt-BR") 
                        : row.val.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                      }{row.unit}
                    </span>
                    <span className="min-w-8.75 text-right font-black text-slate-400 text-[9px]">
                      {row.noVD || !row.vdKey ? "-" : calculateVD(row.val, row.vdKey)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t-2 border-slate-900 bg-white">
              <p className="text-[6px] leading-tight text-slate-500 font-bold uppercase text-justify">* % Valores Diários com base em dieta de 2.000 kcal ou 8.400 kJ. Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.</p>
            </div>
          </div>

          {info.ingredients && (
            <div className="space-y-3 px-1">
              <div className="flex items-center gap-2">
                <ScrollText size={16} className="text-slate-900" />
                <Label className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Ingredientes / Composição</Label>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-100 relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900" />
                <p className="text-[10px] leading-relaxed text-slate-600 font-bold uppercase italic tracking-tight">{info.ingredients}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 bg-slate-100/50 py-3 rounded-2xl border border-dashed border-slate-200">
        <Info size={12} className="text-slate-400" />
        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest text-center px-4 leading-relaxed">
          Valores baseados na montagem atual ({totalWeight}g).<br/>
          As informações podem variar conforme a pesagem final.
        </p>
      </div>
    </div>
  );
};