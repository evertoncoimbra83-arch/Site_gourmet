// client/src/pages/packages/components/PackageNutritionDashboard.tsx

import React, { useMemo, useState } from "react";
import { safeNumber } from "@/lib/safe-parse";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, PieChart } from "lucide-react";
import { calculateMealNutritionCanonical, extractDishNutritionSource } from "@shared/domain/nutrition/nutrition";

// ✅ Importação do componente e da tipagem exata que ele espera
import { NutritionInfo, type NutritionData } from "../components/NutritionInfo";

/* --------------------------------- TYPES ---------------------------------- */

// Herdamos a tipagem oficial do componente NutritionData e garantimos que
// tudo que formos calcular seja um número obrigatório
interface StrictNutrition extends NutritionData {
  energyKj: number;
  fatSaturated: number;
  fatTrans: number;
  addedSugars: number;
  calcium: number;
  iron: number;
  yieldWeight: number;
}

interface PackageNutritionProps {
  dish: Record<string, unknown> | null | undefined;
  selectedAccs?: Record<string, unknown>[];
  groups?: Record<string, unknown>[];
  defaultWeight: number | string;
  variant?: "default" | "compact";
}

/* ------------------------------- COMPONENT -------------------------------- */

export default function PackageNutritionDashboard({
  dish,
  selectedAccs = [],
  groups = [],
  defaultWeight,
  variant = "default"
}: PackageNutritionProps) {

  const [showFullNutrition, setShowFullNutrition] = useState(false);

  const { nutrition } = useMemo(() => {
    const emptyNutrition: StrictNutrition = {
      energyKcal: 0,
      energyKj: 0,
      carbs: 0,
      proteins: 0,
      fatTotal: 0,
      fatSaturated: 0,
      fatTrans: 0,
      fiber: 0,
      sodium: 0,
      addedSugars: 0,
      calcium: 0,
      iron: 0,
      yieldWeight: 0
    };

    if (!dish) return { nutrition: emptyNutrition };
    const targetMainDishWeight = safeNumber(
      (dish.mainDishWeight as string | number | undefined) ??
        (dish.main_dish_weight as string | number | undefined) ??
        defaultWeight,
      safeNumber(defaultWeight, 300),
    );
    const mealNutrition = calculateMealNutritionCanonical({
      dish: extractDishNutritionSource(dish),
      recipeWeight: (dish.recipeWeight ?? dish.recipe_weight ?? dish.yieldWeight ?? dish.yield_weight) as
        | number
        | string
        | null
        | undefined,
      targetMainDishWeight,
      composition: Array.isArray(dish.composition)
        ? (dish.composition as Record<string, unknown>[])
        : undefined,
      accompaniments: selectedAccs,
    }).nutrition;

    return {
      nutrition: {
        ...emptyNutrition,
        ...mealNutrition,
      },
    };
  }, [dish, selectedAccs, defaultWeight, groups]);

  if (!dish) return null;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" /> {Math.round(nutrition.energyKcal)} kcal</span>
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {Math.round(nutrition.proteins)}g P</span>
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {Math.round(nutrition.carbs)}g C</span>
      </div>
    );
  }

  const totalMacros = (nutrition.carbs + nutrition.proteins + nutrition.fatTotal) || 1;

  return (
    <div
      className={cn(
        "rounded-[2rem] border-2 transition-all duration-500",
        showFullNutrition
          ? "bg-slate-50 border-slate-200 shadow-inner"
          : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg cursor-pointer"
      )}
      onClick={() => !showFullNutrition && setShowFullNutrition(true)}
    >
      <div className="flex items-center justify-between gap-4 p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <PieChart size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Perfil Nutricional</span>
            <span className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">
              {Math.round(nutrition.energyKcal)} <span className="text-xs not-italic font-bold text-slate-400">kcal</span>
            </span>
          </div>
        </div>

        <div className="flex-1 max-w-35 md:max-w-45 space-y-2 hidden sm:block">
          <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100 p-0.5">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(nutrition.carbs / totalMacros) * 100}%` }} />
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(nutrition.proteins / totalMacros) * 100}%` }} />
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(nutrition.fatTotal / totalMacros) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
            <span className="text-blue-600">C: {Math.round(nutrition.carbs)}g</span>
            <span className="text-emerald-600">P: {Math.round(nutrition.proteins)}g</span>
            <span className="text-amber-600">G: {Math.round(nutrition.fatTotal)}g</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowFullNutrition(!showFullNutrition); }}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-2xl transition-all duration-300",
            showFullNutrition ? "bg-emerald-500 text-white rotate-180" : "bg-slate-50 text-slate-400"
          )}
        >
          <ChevronDown size={20} strokeWidth={3} />
        </button>
      </div>

      <AnimatePresence>
        {showFullNutrition && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="pt-6 border-t border-slate-200">
                {/* ✅ Tipagem garantida através da interface StrictNutrition */}
                <NutritionInfo
                  data={nutrition}
                  totalWeight={nutrition.yieldWeight}
                />

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowFullNutrition(false); }}
                  className="w-full mt-6 py-3 bg-slate-200/50 hover:bg-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-colors"
                >
                  Recolher Tabela
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
