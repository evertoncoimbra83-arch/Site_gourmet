import React, { useState } from "react";
import { Plus, X, ChevronDown, ChevronUp, ChefHat, Scale, Check, CalendarDays, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateSingleCardNutrition, type SingleCardOption } from "./utils/nutrition-logic";
import type { FullPrescription, PrescriptionOption, PrescriptionMeal, PrescriptionGroup } from "../../../../../../server/routers/storefront/nutri/types";
import { getSizeGroups } from "./utils/builder-helpers";

// --- INTERFACES ALINHADAS ---
export interface DishSize {
  id: number;
  name: string;
  weight?: string | number | null;
  energyKcal: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  mainDishWeight?: string | number;
  noAccompanimentsMessage?: string | null;
  price_modifier?: string | number;
  groups?: Array<{
    id?: string | number | null;
    name?: string | null;
    minSelections?: string | number | null;
    maxSelections?: string | number | null;
    options?: Accompaniment[];
  }>;
  accompanimentGroups?: Array<{
    id?: string | number | null;
    name?: string | null;
    minSelections?: string | number | null;
    maxSelections?: string | number | null;
    options?: Accompaniment[];
  }>;
}

export interface Accompaniment {
  id: string | number;
  name: string;
  isBase?: boolean;
  weight?: number | string;
  energyKcal?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  fatTotal?: number | string;
  isNoAccompaniment?: boolean;
  is_no_accompaniment?: boolean;
  sourceGroupId?: string | number | null;
  sourceGroupName?: string | null;
}

interface ExtendedOption extends Omit<PrescriptionOption, 'allowedAccompaniments' | 'nutritionalData' | 'dishId' | 'multiplier'> {
  id: string;
  dishId: string | number;
  name: string;
  multiplier: string | number;
  sizeId?: string | number | null;
  sizeName?: string | null;
  noAccompanimentsMessage?: string | null;
  weight?: string | number | null;
  sizeWeight?: string | number | null;
  legacySizeMissing?: boolean;
  availableSizes?: DishSize[];
  allowedAccompaniments?: Accompaniment[];
  nutritionalData?: {
    allowedAccompaniments?: Accompaniment[];
    baseMacros?: Record<string, number>;
    sizeId?: number | null;
    mainDishWeight?: number;
  };
}

interface BuilderGroup extends Omit<PrescriptionGroup, 'options'> {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  options: ExtendedOption[];
}

interface BuilderMeal extends Omit<PrescriptionMeal, 'groups'> {
  id: string;
  name: string;
  notes?: string;
  groups: BuilderGroup[];
}

interface PrescriptionBuilderType {
  removeOption: (mealId: string, groupId: string, optId: string) => void;
  updateOptionSize: (mealId: string, groupId: string, optId: string, size: any) => void;
  toggleAccompanimentToOption: (mId: any, gId: any, optId: any, acc: any) => void;
  setIsPickingAccFor: (val: { mealId: string; groupId: string; optionId: string } | null) => void;
  isPickingAccFor: { optionId?: string } | null;
  toggleAccompanimentIsBase: (optId: string, accId: string | number) => void;
  setIsPickingFor: (val: { mealId: string; groupId: string } | null) => void;
  isPickingFor: { groupId?: string } | null;
  setPrescription: React.Dispatch<React.SetStateAction<FullPrescription>>;
}

interface PrescriptionMealCardProps {
  meal: FullPrescription['meals'][number];
  builder: PrescriptionBuilderType;
}

export function PrescriptionMealCard({ meal, builder }: PrescriptionMealCardProps) {
  const m = meal as unknown as BuilderMeal;
  const mainGroup = m.groups?.[0];

  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});

  const toggleAccordion = (optionId: string) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {mainGroup?.options?.map((opt, optIdx) => {
        const nut = calculateSingleCardNutrition(opt as unknown as SingleCardOption);
        const selectedSize = opt.availableSizes?.find((size) => String(size.id) === String(opt.sizeId));
        const sizeGroups = getSizeGroups(selectedSize as any);
        const isAccordionOpen = !!expandedAccordions[opt.id];

        const missingRequiredByGroup = sizeGroups.reduce((total, group) => {
          const groupMin = Math.max(0, Number(group.minSelections || 0));
          const selectedInGroup = (opt.allowedAccompaniments || []).filter(
            (a) => String(a.sourceGroupId ?? "") === String(group.id ?? "")
          ).length;

          return total + Math.max(0, groupMin - selectedInGroup);
        }, 0);

        const selectedAccCount = (opt.allowedAccompaniments || []).length;
        const missingRequiredAccs = missingRequiredByGroup > 0;
        const hasConfiguredAccs = sizeGroups.some((group) => (group.options || []).length > 0);

        const currentMainDishWeight = Number(
          selectedSize?.mainDishWeight ?? opt.mainDishWeight ?? opt.nutritionalData?.mainDishWeight ?? 0
        );
        // labelWeight é o peso total do tamanho (mainDishWeight = prato principal)
        const mainDishWeight = currentMainDishWeight;
        const labelWeight = Number(selectedSize?.weight ?? opt.weight ?? opt.sizeWeight ?? mainDishWeight);
        const noAccompanimentMessage =
          selectedSize?.noAccompanimentsMessage ||
          opt.noAccompanimentsMessage ||
          "Este tamanho não possui acompanhamentos opcionais cadastrados.";

        return (
          <div key={opt.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300 w-full">
            <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-900 text-white shrink-0 shadow-md">
                  <CalendarDays size={12} className="mb-0.5 opacity-50" />
                  <span className="text-[12px] font-black leading-none">{optIdx + 1}º</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs md:text-sm font-black uppercase text-slate-700 leading-tight">
                    {opt.name}
                  </span>
                  {opt.legacySizeMissing && (
                    <span className="text-[8px] font-black uppercase text-amber-600 italic">
                      Tamanho antigo nao encontrado no cadastro atual.
                    </span>
                  )}
                  <span className="text-[9px] font-black text-slate-400 uppercase italic">
                    Tamanho: {selectedSize?.name || opt.sizeName || "Padrão"} | Prato principal: {mainDishWeight}g | Label: {Number(labelWeight)}g
                  </span>
                </div>
              </div>
              <button
                onClick={() => builder.removeOption(m.id, mainGroup.id, opt.id)}
                className="text-slate-300 hover:text-red-500 p-1 bg-white rounded-full hover:bg-red-50 transition-colors"
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div className="p-4 md:p-5 flex flex-col gap-5">
              {opt.availableSizes && opt.availableSizes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Scale size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Opções de Porção</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-stretch">
                    {opt.availableSizes.map((size) => {
                      const isSelected = String(opt.sizeId) === String(size.id);
                      const mainDishWeight = Number(size.mainDishWeight || 0);
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => builder.updateOptionSize(m.id, mainGroup.id, opt.id, size)}
                          className={cn(
                            "flex min-w-24 flex-col items-start gap-1 px-3 py-2 rounded-lg text-left uppercase border transition-all shrink-0",
                            isSelected ? "bg-slate-900 border-slate-900 text-white shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"
                          )}
                        >
                          <span className="text-[10px] font-black leading-none">{size.name}</span>
                          <span className={cn("text-[7px] font-black leading-tight", isSelected ? "text-slate-300" : "text-slate-400")}>
                            Base: {mainDishWeight}g
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div
                  onClick={() => toggleAccordion(opt.id)}
                  className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-all"
                >
                  <div className="flex items-center gap-2 text-slate-600">
                    <ChefHat size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Acompanhamentos Escalados ({selectedAccCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {missingRequiredAccs && (
                      <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md animate-pulse">
                        Pendente
                      </span>
                    )}
                    {isAccordionOpen ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                  </div>
                </div>

                {isAccordionOpen && (
                  <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-5 animate-in slide-in-from-top-2 duration-300">
                    {hasConfiguredAccs ? (
                      sizeGroups.map((group) => {
                        const groupMin = Number(group.minSelections || 0);
                        const groupMax = Number(group.maxSelections || 2);
                        return (
                          <div key={String(group.id)} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-1">
                              <span className="text-[9px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1">
                                <Sliders size={10} className="text-emerald-600" /> {group.name}
                              </span>
                              <span className="text-[8px] font-bold uppercase text-slate-400">
                                Limite: {groupMin > 0 ? `Mín ${groupMin} | ` : ""} Máx {groupMax} itens
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {(group.options || []).map((option) => {
                                const isChecked = (opt.allowedAccompaniments || []).some(
                                  (a) => String(a.id) === String(option.id) && String(a.sourceGroupId ?? "") === String(group.id ?? "")
                                );
                                return (
                                  <button
                                    key={String(option.id)}
                                    type="button"
                                    onClick={() => {
                                      builder.toggleAccompanimentToOption(
                                        String(m.id),
                                        String(mainGroup.id),
                                        String(opt.id),
                                        {
                                          id: option.id,
                                          name: option.name,
                                          weight: option.weight,
                                          energyKcal: option.energyKcal,
                                          proteins: option.proteins,
                                          carbs: option.carbs,
                                          fatTotal: option.fatTotal,
                                          isNoAccompaniment: option.isNoAccompaniment ?? option.is_no_accompaniment,
                                          sourceGroupId: group.id ? String(group.id) : null,
                                          sourceGroupName: group.name
                                        }
                                      );
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase transition-all shadow-sm select-none",
                                      isChecked
                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-md scale-[1.01]"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                    )}
                                  >
                                    {isChecked && <Check size={10} strokeWidth={4} />}
                                    <span>{option.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[9px] text-slate-400 font-bold uppercase italic text-center py-2">
                        {noAccompanimentMessage}
                      </div>
                    )}
                  </div>
                )}

                {!isAccordionOpen && selectedAccCount > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-1 animate-in fade-in">
                    {(opt.allowedAccompaniments || []).map((acc) => (
                      <span key={String(acc.id)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[8px] font-black uppercase text-slate-500">
                        • {acc.name}
                      </span>
                    ))}
                  </div>
                )}

                {missingRequiredAccs && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-black uppercase text-amber-700">
                    ⚠️ Faltam acompanhamentos obrigatórios para validar os critérios deste tamanho. Expandir para ajustar.
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-900 border-t border-slate-800">
              <div className="grid grid-cols-4 gap-4">
                <MiniMacroBar label="Energia" value={Math.round(nut.kcal)} unit="kcal" color="bg-emerald-400" />
                <MiniMacroBar label="Proteína" value={nut.protein.toFixed(1)} unit="g" color="bg-blue-400" />
                <MiniMacroBar label="Carbo" value={nut.carbs.toFixed(1)} unit="g" color="bg-orange-400" />
                <MiniMacroBar label="Gordura" value={nut.fat.toFixed(1)} unit="g" color="bg-pink-400" />
              </div>
            </div>
          </div>
        );
      })}

      {mainGroup && (
        <Button
          disabled={(mainGroup.options || []).length >= 7}
          onClick={() => builder.setIsPickingFor({ mealId: m.id, groupId: mainGroup.id })}
          variant="outline"
          className={cn(
            "w-full border-dashed border-2 rounded-2xl h-14 font-black uppercase text-[10px] gap-2 transition-all bg-white",
            (mainGroup.options || []).length >= 7 ? "border-slate-100 text-slate-300" : "border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
          )}
        >
          <Plus size={16} strokeWidth={4} />
          {(mainGroup.options || []).length >= 7 ? "Plano da Semana Completo" : "Adicionar Opção ao Cardápio"}
        </Button>
      )}

      <div className="bg-slate-900 rounded-3xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-1">
          Orientações Gerais do Cardápio
        </div>
        <textarea
          value={m.notes || ""}
          onChange={(e) => builder.setPrescription((prev: FullPrescription) => ({
            ...prev,
            meals: (prev.meals || []).map((mealItem) => {
              const mi = mealItem as unknown as BuilderMeal;
              if (mi.id !== m.id) return mealItem;
              return { ...mi, notes: e.target.value } as any;
            })
          }))}
          placeholder="Ex: Beber 3L de água por dia, folga no domingo..."
          className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white text-[11px] font-medium focus:ring-1 focus:ring-emerald-500 outline-none h-24 resize-none placeholder:text-slate-500 transition-all shadow-inner"
        />
      </div>
    </div>
  );
}

function MiniMacroBar({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 tracking-widest">
          {label}
        </span>
        <span className="text-[9px] md:text-[10px] font-black text-white italic">
          {value}<span className="text-[7px] ml-0.5 opacity-50">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: '100%' }} />
      </div>
    </div>
  );
} 