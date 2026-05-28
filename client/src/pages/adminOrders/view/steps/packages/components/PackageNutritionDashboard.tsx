// view/steps/packages/components/PackageNutritionDashboard
import React, { useMemo } from "react";
import { safeNumber } from "@/lib/safe-parse";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Activity, 
  Layers, 
  Info 
} from "lucide-react";

// --- INTERFACES ---
interface NutritionalInfo {
  energyKcal?: string | number;
  kcal?: string | number;
  carbs?: string | number;
  proteins?: string | number;
  protein?: string | number;
  fatTotal?: string | number;
  fats?: string | number;
}

interface SelectedAcc {
  groupId?: string | number;
  defaultGrammage?: number | string;
  nutritional_info?: NutritionalInfo | string;
  nutritionalInfo?: NutritionalInfo;
}

interface Dish {
  // 🚀 NOVAS COLUNAS (Fase 1)
  energyKcal?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  // Fallbacks legados
  nutritional_info?: NutritionalInfo | string;
  nutritionalInfo?: NutritionalInfo;
}

interface PackageNutritionProps {
  dish: Dish | null | undefined;
  selectedAccs: SelectedAcc[];
  groups?: Array<{ id: string | number; defaultGrammage?: number | string }>; 
  defaultWeight: number | string;
}

export default function PackageNutritionDashboard({ 
  dish, 
  selectedAccs = [], 
  groups = [], 
  defaultWeight 
}: PackageNutritionProps) {

  const { nutrition, itemCount } = useMemo(() => {
    const p = (v: unknown) => safeNumber(String(v || 0).replace(",", "."));

    if (!dish) return { nutrition: { kcal: 0, carbs: 0, pro: 0, fat: 0 }, itemCount: 0 };

    /**
     * 🚀 NORMALIZAÇÃO DE LEITURA DO PRATO (Fase 4)
     * Priorizamos as colunas na raiz. Se o prato for antigo (não migrado),
     * extraímos do JSON legado.
     */
    let dLegacy: NutritionalInfo = {};
    if (typeof dish.nutritional_info === 'string') {
      try { dLegacy = JSON.parse(dish.nutritional_info); } catch { dLegacy = {}; }
    } else {
      dLegacy = (dish.nutritional_info || dish.nutritionalInfo || {}) as NutritionalInfo;
    }

    const dFactor = safeNumber(defaultWeight, 300) / 100;

    // Consolidação Prato Principal
    const base = {
      kcal: p(dish.energyKcal || dLegacy.energyKcal || dLegacy.kcal) * dFactor,
      carbs: p(dish.carbs || dLegacy.carbs) * dFactor,
      pro: p(dish.proteins || dLegacy.proteins || dLegacy.protein) * dFactor,
      fat: p(dish.fatTotal || dLegacy.fatTotal || dLegacy.fats) * dFactor,
    };

    // Consolidação Acompanhamentos
    const totalNutrition = selectedAccs.reduce((acc, curr) => {
      let aInfo: NutritionalInfo = {};
      if (typeof curr.nutritional_info === 'string') {
        try { aInfo = JSON.parse(curr.nutritional_info); } catch { aInfo = {}; }
      } else {
        aInfo = (curr.nutritional_info || curr.nutritionalInfo || {}) as NutritionalInfo;
      }

      const safeGroups = Array.isArray(groups) ? groups : [];
      const parentGroup = safeGroups.find(g => Number(g.id) === Number(curr.groupId));
      
      const weight = Number(parentGroup?.defaultGrammage ?? curr?.defaultGrammage ?? 100);
      const aFactor = weight / 100;

      return {
        kcal: acc.kcal + (p(aInfo.energyKcal || aInfo.kcal) * aFactor),
        carbs: acc.carbs + (p(aInfo.carbs) * aFactor),
        pro: acc.pro + (p(aInfo.proteins || aInfo.protein) * aFactor),
        fat: acc.fat + (p(aInfo.fatTotal || aInfo.fats) * aFactor),
      };
    }, base);

    return { 
      nutrition: totalNutrition, 
      itemCount: 1 + selectedAccs.length
    };
  }, [dish, selectedAccs, groups, defaultWeight]);

  const totalMacros = nutrition.carbs + nutrition.pro + nutrition.fat || 1;

  const macroItems = [
    { label: "Carbos", val: nutrition.carbs, color: "bg-blue-500", width: (nutrition.carbs / totalMacros) * 100 },
    { label: "Proteínas", val: nutrition.pro, color: "bg-emerald-500", width: (nutrition.pro / totalMacros) * 100 },
    { label: "Gorduras", val: nutrition.fat, color: "bg-amber-500", width: (nutrition.fat / totalMacros) * 100 },
  ];

  if (!dish) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-4xl p-6 shadow-sm hover:shadow-md transition-all text-left">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity size={14} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard Nutricional</span>
          </div>
          <h4 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">
            {Math.round(nutrition.kcal)} <span className="text-sm not-italic font-bold text-slate-300 ml-1 uppercase">Kcal</span>
          </h4>
        </div>

        <div className="flex bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 items-center gap-2">
            <Layers size={12} className="text-emerald-600" />
            <span className="text-[9px] font-black text-slate-600 uppercase italic tracking-tighter">{itemCount} Itens</span>
        </div>
      </div>

      <div className="space-y-5">
        <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-slate-100">
          {macroItems.map((item) => (
            <motion.div 
              key={item.label}
              className={cn("h-full transition-all duration-700", item.color)}
              initial={{ width: 0 }}
              animate={{ width: isNaN(item.width) ? 0 : `${item.width}%` }}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {macroItems.map((item) => (
            <div key={item.label} className="flex flex-col border-l border-slate-100 pl-3 first:border-0 first:pl-0">
              <span className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">{item.label}</span>
              <span className="text-base font-black text-slate-900 tracking-tighter leading-none italic">{item.val.toFixed(1)}g</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50 flex justify-center">
        <div className="flex items-center gap-1.5 text-slate-300">
            <Info size={10} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Valores ajustados ao peso selecionado</span>
        </div>
      </div>
    </div>
  );
}
