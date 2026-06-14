// client/src/pages/packages/components/PackageMealItem.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, AlertCircle, Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import { usePackageAcc } from "../logic/usePackageAcc";
import { isMealComplete } from "../logic/packageGuards";
import PackageNutritionDashboard from "./PackageNutritionDashboard";
import AccompanimentSelector, { Option, Group } from "@/components/AccompanimentSelector";
import { AccompanimentGroupRule, AccompanimentOption, PackageItem } from "../logic/packageMachine.types";

interface MealItemProps {
  index: number;
  slot: {
    name?: string;
    label?: string;
    dishes: Record<string, unknown>[];
    groups?: Array<{ id: string | number; customLabel: string | null }>;
  };
  currentItemState: {
    dishId?: string;
    dishName?: string;
    selectedAccompaniments: AccompanimentOption[];
    requiresAccompaniments?: boolean;
  } | undefined;
  isExpanded: boolean;
  onExpand: (index: number) => void;
  onNext: () => void;
  isLast: boolean;
  pkg: {
    allowedAccompaniments?: Array<{ id: string | number; name: string; [key: string]: unknown }>;
    accompanimentGroups?: Array<{
      id: string | number;
      name: string;
      min_selections?: number | string;
      max_selections?: number | string;
      minSelections?: number | string;
      maxSelections?: number | string;
    }>;
  };
  actions: {
    removeMeal: (index: number) => void;
    addMeal: (meal: {
      id: string;
      name: string;
      requiresAccompaniments: boolean;
      accompanimentGroups: AccompanimentGroupRule[]
    }) => void;
    updateAccompaniments: (index: number, accs: AccompanimentOption[]) => void;
  };
  sizeWeight: number;
}

interface AccGroupNormalization {
  id: string | number;
  name: string;
  minSelections?: number | string;
  maxSelections?: number | string;
  min_selections?: number | string;
  max_selections?: number | string;
}

export function PackageMealItem({
  index, slot, currentItemState, isExpanded, onExpand, onNext, isLast, pkg, actions, sizeWeight
}: MealItemProps) {

  const hookArgs = {
    currentMealState: currentItemState,
    groups: (slot.groups || []) as Array<{ id: string | number; customLabel: string | null }>,
    slotGroups: (slot.groups || []) as Array<{ id: string | number; customLabel: string | null }>,
    pkg: pkg as Record<string, unknown>
  };

  const { accompanimentGroups, formattedSelections } = usePackageAcc(
    hookArgs as unknown as Parameters<typeof usePackageAcc>[0]
  );

  const isCompleted = currentItemState
    ? isMealComplete({
        ...currentItemState,
        requiresAccompaniments: accompanimentGroups.length > 0
      } as PackageItem)
    : false;

  const allowedDishes = (slot.dishes || []) as Record<string, unknown>[];
  const currentDishRaw = allowedDishes.find((d) => String(d.id) === currentItemState?.dishId);

  // Filtramos os pratos: se tiver um selecionado, só mostra ele.
  const visibleDishes = currentItemState?.dishId
    ? allowedDishes.filter(d => String(d.id) === currentItemState.dishId)
    : allowedDishes;

  return (
    <div className={cn(
      "group rounded-3xl border transition-all duration-300",
      isExpanded ? "bg-white border-emerald-500 shadow-xl" : "bg-white border-slate-200 opacity-90"
    )}>
      {/* Header do Slot */}
      <div onClick={() => onExpand(index)} className="p-5 flex items-center justify-between cursor-pointer">
        <div className="flex flex-col gap-1">
          <span className={cn("text-[9px] font-black uppercase tracking-widest", isExpanded ? "text-emerald-600" : "text-slate-400")}>
            {slot.name || slot.label || `MARMITA ${index + 1}`}
          </span>
          <p className={cn("text-sm font-black uppercase italic", currentItemState?.dishId ? "text-slate-900" : "text-slate-400")}>
            {currentItemState?.dishName || "Escolher prato..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted && !isExpanded && <CheckCircle2 size={20} className="text-emerald-500" />}
          {currentItemState?.dishId && !isCompleted && !isExpanded && <AlertCircle size={20} className="text-amber-500" />}
          <ChevronDown size={16} className={cn("text-slate-300 transition-transform", isExpanded && "rotate-180 text-emerald-600")} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-50 bg-slate-50/30"
          >
            <div className="p-5 space-y-6">
              {/* LISTA DE PRATOS: As outras somem quando seleciona */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Scale size={12} className="text-emerald-500" /> Prato Base ({sizeWeight}g)
                </label>

                <div className="grid grid-cols-1 gap-2">
                  <AnimatePresence mode="popLayout">
                    {visibleDishes.map((dish) => (
                      <motion.div
                        layout
                        key={String(dish.id)}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => {
                          if (!currentItemState?.dishId) {
                            actions.addMeal({
                              id: String(dish.id),
                              name: String(dish.name),
                              requiresAccompaniments: accompanimentGroups.length > 0,
                              accompanimentGroups: accompanimentGroups.map((g) => {
                                const groupData = g as unknown as AccGroupNormalization;
                                return {
                                  id: String(groupData.id),
                                  name: String(groupData.name),
                                  min: Number(groupData.minSelections ?? groupData.min_selections ?? 0),
                                  max: Number(groupData.maxSelections ?? groupData.max_selections ?? 1)
                                };
                              })
                            });
                          }
                        }}
                        className={cn(
                          "p-4 rounded-2xl transition-all flex justify-between items-center group/item",
                          currentItemState?.dishId
                            ? "bg-emerald-600 border-2 border-emerald-500 shadow-lg cursor-default"
                            : "bg-white border-2 border-slate-100 cursor-pointer hover:border-emerald-300"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-black uppercase italic transition-colors",
                          currentItemState?.dishId ? "text-white" : "text-slate-600 group-hover/item:text-emerald-600"
                        )}>
                          {String(dish.name)}
                        </span>

                        {currentItemState?.dishId ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); actions.removeMeal(index); }}
                            className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        ) : (
                          <ChevronDown size={14} className="text-slate-300 -rotate-90" />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* ACOMPANHAMENTOS: Só aparecem após o prato ser selecionado */}
              <AnimatePresence>
                {currentItemState?.dishId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {accompanimentGroups.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Acompanhamentos</h4>
                        <AccompanimentSelector
                          groups={accompanimentGroups as unknown as Group[]}
                          selections={formattedSelections as unknown as Record<number, Option[]>}
                          onToggle={(group: Group, optionId: string) => {
                            let currentSelections = [...currentItemState.selectedAccompaniments];
                            const existingIndex = currentSelections.findIndex(acc => String(acc.id) === String(optionId) && String(acc.groupId) === String(group.id));

                            if (existingIndex > -1) {
                              currentSelections.splice(existingIndex, 1);
                            } else {
                              const optionData = group.options.find(o => String(o.id) === String(optionId));
                              if (optionData) {
                                const countInGroup = currentSelections.filter(a => String(a.groupId) === String(group.id)).length;
                                const max = Number(group.maxSelections || 1);

                                if (countInGroup >= max) {
                                  if (max === 1) {
                                    currentSelections = currentSelections.filter(a => String(a.groupId) !== String(group.id));
                                  } else {
                                    return;
                                  }
                                }

                                currentSelections.push({
                                  ...optionData,
                                  id: String(optionData.id),
                                  name: String(optionData.name),
                                  groupId: String(group.id),
                                  groupName: String(group.name),
                                  weight: Number(optionData.weight || optionData.defaultGrammage || 100),
                                  isNoAccompaniment: Boolean(optionData.isNoAccompaniment || optionData.is_no_accompaniment),
                                  is_no_accompaniment: Boolean(optionData.isNoAccompaniment || optionData.is_no_accompaniment),
                                  nutritionSkipped: Boolean(optionData.isNoAccompaniment || optionData.is_no_accompaniment),
                                } as AccompanimentOption);
                              }
                            }
                            actions.updateAccompaniments(index, currentSelections);
                          }}
                        />
                      </div>
                    )}

                    {/* DASHBOARD NUTRICIONAL: Agora no final, como rodapé da marmita */}
                    <div className="pt-4 border-t border-slate-200">
                       <PackageNutritionDashboard
                        dish={currentDishRaw}
                        selectedAccs={currentItemState.selectedAccompaniments as unknown as Record<string, unknown>[]}
                        defaultWeight={sizeWeight}
                      />
                    </div>

                    {!isLast && (
                      <Button onClick={onNext} className="w-full h-12 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">
                        Próxima Marmita
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
