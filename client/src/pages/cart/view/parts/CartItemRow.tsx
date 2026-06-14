import React, { forwardRef, useMemo, useState, useEffect } from "react";
import { Trash2, Minus, Plus, Package, Utensils, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { Id } from "@/_core/type/utils";
import { normalizeGourmetOptions, type PricingOptions, type NormalizedMeal } from "../../../../../../shared/domain/math/pricing";
import { safeInteger, safeNumber } from "@/lib/safe-parse";
import { normalizeImageUrl } from "@shared/utils/assets";

/* --------------------------------- TYPES ---------------------------------- */

interface NutritionInfo {
  energyKcal?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  fatTotal?: number | string;
  dishId?: string | number;
  nutrition?: {
    energyKcal?: number;
    energy_kcal?: number;
  };
}

interface GourmetMealUI extends NormalizedMeal {
  dishId?: string | number;
  label?: string;
  accompaniments?: GourmetAccUI[];
  selectedAccompaniments?: GourmetAccUI[];
  selectedAccs?: GourmetAccUI[];
}

interface GourmetAccUI {
  id?: string | number;
  name?: string;
  weight?: number | string;
  label?: string;
}

interface PackageTraceItem {
  dishId: string | number;
  nutrition?: {
    energyKcal?: number;
    energy_kcal?: number;
  };
}

interface AppliedNutritionObject {
  energyKcal?: number;
  energy_kcal?: number;
  itemsTrace?: PackageTraceItem[];
}

interface CartItemProps {
  group: {
    id: Id;
    name: string;
    image?: string | null;
    itemType?: "dish" | "package" | string;
    price: number | string;
    quantity: number;
    sizeName?: string | null;
    options?: PricingOptions | string | Record<string, unknown>;
    appliedNutrition?: AppliedNutritionObject | NutritionInfo[] | string;
    applied_nutrition?: AppliedNutritionObject | NutritionInfo[] | string;
  };
  money: (val: number) => string;
  updateQuantity: (id: Id, qty: number) => void;
  removeItem: (id: Id) => void;
}

/* ------------------------------- COMPONENT -------------------------------- */

const CartItemRow = forwardRef<HTMLDivElement, CartItemProps>(
  ({ group, money, updateQuantity, removeItem }, ref) => {
    const [imageError, setImageError] = useState(false);

    // 1. Normalização de Opções
    const options = useMemo(() => normalizeGourmetOptions(group.options), [group.options]);

    const rawOptions = useMemo(() => {
      if (typeof group.options === 'string') {
        try { return JSON.parse(group.options) as Record<string, unknown>; } catch { return {}; }
      }
      return (group.options || {}) as Record<string, unknown>;
    }, [group.options]);

    const isPackage = group.itemType === "package" ||
                      rawOptions._type === "package_custom" ||
                      Array.isArray(rawOptions.meals) ||
                      Array.isArray(options.meals);

    // 2. Normalização de Nutrição
    const rawNutrition = useMemo(() => {
      const data = group.appliedNutrition || group.applied_nutrition;
      if (typeof data === "string") {
        try { return JSON.parse(data) as AppliedNutritionObject | NutritionInfo[]; } catch { return null; }
      }
      return data as AppliedNutritionObject | NutritionInfo[];
    }, [group.appliedNutrition, group.applied_nutrition]);

    // 3. Processamento das Marmitas (Pacote)
    const packageMeals = useMemo(() => {
      const mealsArray = (options.meals || rawOptions.meals) as GourmetMealUI[];
      if (!isPackage || !Array.isArray(mealsArray)) return [];

      const nutritionObj = rawNutrition as AppliedNutritionObject;
      const itemsTrace = nutritionObj?.itemsTrace || [];

      return mealsArray.map((meal, idx) => {
        const traceData = itemsTrace.find((t) => String(t.dishId) === String(meal.dishId)) || itemsTrace[idx];

        const individualKcal = traceData?.nutrition?.energyKcal ||
                             traceData?.nutrition?.energy_kcal;

        const rawAccs = (meal.accompaniments || meal.selectedAccompaniments || meal.selectedAccs || []) as GourmetAccUI[];

        return {
          name: meal.dishName || meal.label || "Marmita",
          accs: rawAccs.map(a => ({
            name: a.name || a.label || "Item",
            weight: a.weight ? `${a.weight}g` : ""
          })).sort((a, b) => safeInteger(String(b.weight)) - safeInteger(String(a.weight))),
          kcal: individualKcal ? Math.round(Number(individualKcal)) : null,
        };
      });
    }, [options, rawOptions, isPackage, rawNutrition]);

    const currentImageUrl = useMemo(() => {
      if (!group.image || imageError) return null;
      return normalizeImageUrl(group.image) || "";
    }, [group.image, imageError]);

    const displaySize = options.size?.name || (rawOptions.sizeName as string) || group.sizeName;
    const noAccompanimentsMessage =
      typeof rawOptions.noAccompanimentsMessage === "string"
        ? rawOptions.noAccompanimentsMessage.trim()
        : "";
    const singleAccs =
      ((options.accompaniments as GourmetAccUI[]) ||
        ((rawOptions.selectedAccs as GourmetAccUI[]) || []));

    const [qtyAnim, setQtyAnim] = useState(group.quantity);
    useEffect(() => setQtyAnim(group.quantity), [group.quantity]);

    return (
      <motion.div
        ref={ref} layout
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm p-3"
      >
        <div className="flex gap-3 mb-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={group.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                {isPackage ? <Package size={28} /> : <Utensils size={28} />}
              </div>
            )}
            <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {isPackage ? "Pack" : "Prato"}
            </div>
          </div>

          <div className="flex-1 min-w-0 py-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-tight text-slate-800">{group.name}</h3>
            {displaySize && <p className="mt-1 text-[11px] font-medium text-slate-500 uppercase tracking-wide">{displaySize}</p>}
          </div>

          <button
            onClick={() => removeItem(group.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 active:scale-90 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Acompanhamentos para Pratos Avulsos */}
          {!isPackage && (singleAccs.length > 0 || noAccompanimentsMessage) && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Acompanhamentos
              </p>
              {singleAccs.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {singleAccs.map((acc, i) => (
                    <span key={i} className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500 border border-slate-100">
                      {acc.name || acc.label || "Item"}{acc.weight ? ` · ${acc.weight}g` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-medium leading-snug text-slate-500">
                  <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{noAccompanimentsMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Lista de Marmitas do Pacote */}
          {isPackage && packageMeals.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
              <AnimatePresence initial={false}>
                {packageMeals.map((meal, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5 px-3 py-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-black text-slate-600">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-bold text-slate-700 uppercase leading-none">{meal.name}</p>
                        {meal.kcal && (
                          <span className="shrink-0 text-[9px] font-black text-orange-500 bg-orange-100/50 px-1.5 py-0.5 rounded border border-orange-200/50">
                            {meal.kcal} KCAL
                          </span>
                        )}
                      </div>
                      {meal.accs.length > 0 && (
                        <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                          {meal.accs.map((a) => `${a.name}${a.weight ? ` ${a.weight}` : ''}`).join(" · ")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Preço e Quantidade */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-lg font-black tracking-tighter text-slate-900">
              {money(safeNumber(group.price) * group.quantity)}
            </span>
            <div className="flex items-center gap-px rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
              <button
                onClick={() => updateQuantity(group.id, group.quantity - 1)}
                disabled={group.quantity <= 1}
                className="flex h-8 w-8 items-center justify-center bg-white text-slate-500 hover:text-emerald-600 disabled:opacity-30 transition-colors"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={qtyAnim}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex h-8 w-10 items-center justify-center bg-white text-sm font-black tabular-nums text-slate-800"
                >
                  {group.quantity}
                </motion.span>
              </AnimatePresence>
              <button
                onClick={() => updateQuantity(group.id, group.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center bg-white text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

CartItemRow.displayName = "CartItemRow";

export default CartItemRow;
