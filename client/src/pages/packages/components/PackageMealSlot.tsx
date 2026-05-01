// client/src/pages/packages/components/PackageMealSlot.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, CheckCircle2, X, Utensils, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DishSelector } from "./DishSelector";
import { AccompanimentConfigurator } from "./AccompanimentConfigurator";
import { TRPCBaseItem, TRPCGroupMeta, PackageSlot } from "../view/PackageDrawer";
import { AccompanimentOption, AccompanimentGroupRule } from "../logic/packageMachine.types";

interface RawSlotGroup {
  id?: string | number;
  groupId?: string | number;
  name?: string;
  minSelections?: number | string;
  maxSelections?: number | string;
  group?: {
    name?: string;
    minSelections?: number | string;
    maxSelections?: number | string;
  };
}

interface PackageMealSlotProps {
  index: number;
  slot: PackageSlot;
  isLocked?: boolean;
  pkg: {
    allowedAccompaniments: TRPCBaseItem[];
    accompanimentGroups: TRPCGroupMeta[];
  };
  currentState: {
    dishId?: string;
    dishName?: string;
    selectedAccompaniments: AccompanimentOption[];
    nutrition?: Record<string, unknown>;
  } | undefined;
  isExpanded: boolean;
  onExpand: () => void;
  onNext: () => void;
  isLast: boolean;
  sizeWeight: number;
  actions: {
    addMeal: (meal: { 
      id: string; 
      name: string; 
      requiresAccompaniments: boolean;
      accompanimentGroups: AccompanimentGroupRule[];
      nutrition?: Record<string, unknown>;
    }) => void;
    removeMeal: (index: number) => void;
    updateAccompaniments: (index: number, accs: AccompanimentOption[]) => void;
  };
}

export function PackageMealSlot({
  index, slot, pkg, currentState, isExpanded, isLocked = false, onExpand, onNext, isLast, sizeWeight, actions,
}: PackageMealSlotProps) {
  const hasDish = !!currentState?.dishId;
  const slotGroups = (slot.accompanimentGroups || slot.allowedGroups || []) as RawSlotGroup[];
  const hasGroups = slotGroups.length > 0;

  return (
    <motion.div
      layout
      transition={{ duration: 0.4, ease: "circOut" }}
      className={cn(
        "rounded-4xl border-2 transition-all duration-500 overflow-hidden",
        isLocked
          ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
          : isExpanded 
            ? "bg-white border-emerald-500 shadow-2xl shadow-emerald-100 scale-[1.02] z-10" 
            : "bg-white border-slate-100 opacity-90 hover:opacity-100 hover:border-slate-200"
      )}
    >
      {/* Header do Slot */}
      <div 
        onClick={isLocked ? undefined : onExpand} 
        className={cn(
          "p-6 flex justify-between items-center transition-colors duration-500",
          isLocked ? "cursor-not-allowed" : "cursor-pointer",
          isExpanded && hasDish ? "bg-emerald-50/50" : "bg-transparent"
        )}
      >
        <div className="flex items-center gap-5">
          {/* Círculo de Status Lateral */}
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 shadow-inner",
            hasDish 
              ? "bg-emerald-500 text-white rotate-10" 
              : isExpanded ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-300"
          )}>
            {hasDish ? <CheckCircle2 size={24} /> : index + 1}
          </div>

          <div className="flex flex-col gap-0.5">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
              isExpanded ? "text-emerald-600" : "text-slate-400"
            )}>
              {slot.name || slot.label || `Marmita ${index + 1}`}
            </span>

            <motion.h3 
              layout="position"
              className={cn(
                "font-black uppercase italic text-base tracking-tighter transition-colors",
                hasDish ? "text-slate-900" : "text-slate-300"
              )}
            >
              {currentState?.dishName || "Selecionar prato base"}
            </motion.h3>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {isExpanded && (
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
              >
                Configurando
              </motion.span>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            {hasDish && isExpanded && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  actions.removeMeal(index);
                }}
                className="p-2.5 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-90"
              >
                <X size={18} />
              </button>
            )}
            
            {isLocked ? (
              <Lock size={16} className="text-slate-300" />
            ) : (
              <ChevronDown 
                size={20} 
                className={cn(
                  "transition-transform duration-500", 
                  isExpanded ? "rotate-180 text-emerald-600" : "text-slate-200"
                )} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Expansível */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div 
            key={hasDish ? "configurator" : "selector"}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="border-t border-slate-50"
          >
            <div className="p-6 bg-slate-50/30">
              {!hasDish ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Utensils size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cardápio Disponível</span>
                  </div>
                  <DishSelector
                    dishes={slot.dishes}
                    onSelect={(dish: TRPCBaseItem) => {
                      const rules: AccompanimentGroupRule[] = slotGroups.map((sg) => ({
                        id: String(sg.id || sg.groupId || ""),
                        name: String(sg.name || sg.group?.name || "Acompanhamento"),
                        min: Number(sg.minSelections ?? sg.group?.minSelections ?? 0),
                        max: Number(sg.maxSelections ?? sg.group?.maxSelections ?? 1)
                      }));

                      const nInfo = (dish as Record<string, unknown>).nutritional_info || 
                                    (dish as Record<string, unknown>).nutritionalInfo || 
                                    dish;

                      const parseValue = (v: unknown): number => {
                        if (v === undefined || v === null || v === "") return 0;
                        const parsed = parseFloat(String(v).replace(",", "."));
                        return isNaN(parsed) ? 0 : parsed;
                      };

                      const safeExtract = (key1: string, key2?: string) => {
                        const val = (nInfo as Record<string, unknown>)[key1] ?? (key2 ? (nInfo as Record<string, unknown>)[key2] : undefined);
                        return parseValue(val);
                      };

                      actions.addMeal({
                        id: String(dish.id),
                        name: String(dish.name),
                        requiresAccompaniments: hasGroups,
                        accompanimentGroups: rules,
                        nutrition: {
                          energyKcal: safeExtract("kcal", "energy_kcal"),
                          proteins: safeExtract("proteins"),
                          carbs: safeExtract("carbs"),
                          fatTotal: safeExtract("fats", "fat_total"),
                          fiber: safeExtract("fiber"),
                          sodium: safeExtract("sodium")
                        }
                      });
                    }}
                  />
                </div>
              ) : (
                <AccompanimentConfigurator
                  slot={slot}
                  pkg={pkg}
                  index={index}
                  currentState={currentState}
                  actions={actions}
                  onNext={onNext}
                  isLast={isLast}
                  sizeWeight={sizeWeight}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}