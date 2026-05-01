// e:/IA/projects/Site_React/client/src/pages/nutri/components/PrescriptionDrawer/PrescriptionMealCard.tsx

import React from "react";
import { Plus, X, Settings2, ChefHat, Scale, Check, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateSingleCardNutrition, type SingleCardOption } from "./utils/nutrition-logic";
import type { FullPrescription, PrescriptionOption, PrescriptionMeal, PrescriptionGroup } from "../../../../../../server/routers/storefront/nutri/types";

// --- INTERFACES REVISADAS ---
export interface DishSize {
  id: number;
  name: string;
  // ✅ FIX TS2322: Alinhado com o Builder (aceitando number e sendo opcional/undefined)
  weight?: string | number | null;
  energyKcal: number; 
  proteins: number;
  carbs: number;
  fatTotal: number;
  mainDishWeight?: string | number;
  price_modifier?: string | number;
}

export interface Accompaniment {
  id: string | number;
  name: string;
  isBase?: boolean;
  energyKcal?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  fatTotal?: number | string;
}

// Omitimos o 'dishId' original que conflita entre string/number
interface ExtendedOption extends Omit<PrescriptionOption, 'allowedAccompaniments' | 'nutritionalData' | 'dishId' | 'multiplier'> {
  id: string;
  dishId: string | number; 
  name: string;
  multiplier: string | number; 
  sizeId?: string | number | null;
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
  updateOptionSize: (mealId: string, groupId: string, optId: string, size: DishSize) => void;
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

  return (
    <div className="flex flex-col gap-8 w-full">
      
      {mainGroup?.options?.map((opt, optIdx) => {
        const nut = calculateSingleCardNutrition(opt as unknown as SingleCardOption);
        
        return (
          <div 
            key={opt.id} 
            className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300 w-full"
          >
            {/* CABEÇALHO DO PRATO */}
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
                  <span className="text-[9px] font-black text-slate-400 uppercase italic">
                    Fator: {opt.multiplier}x
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

            {/* CORPO DO PRATO */}
            <div className="p-4 md:p-5 flex flex-col gap-5">
              {/* Gramagem */}
              {opt.availableSizes && opt.availableSizes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Scale size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Gramagem Base</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {opt.availableSizes.map((size) => {
                      const isSelected = String(opt.sizeId) === String(size.id);
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => builder.updateOptionSize(m.id, mainGroup.id, opt.id, size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all shrink-0",
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"
                          )}
                        >
                          {size.name} {size.weight ? `• ${size.weight}g` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Acompanhamentos */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 ml-1">
                    <ChefHat size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Acompanhamentos</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => builder.setIsPickingAccFor({ mealId: m.id, groupId: mainGroup.id, optionId: opt.id })}
                    className={cn(
                      "h-7 px-3 text-[8px] font-black uppercase gap-1.5 rounded-lg",
                      builder.isPickingAccFor?.optionId === opt.id 
                        ? "bg-emerald-600 text-white" 
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    <Settings2 size={12} />
                    {builder.isPickingAccFor?.optionId === opt.id ? "Editando..." : "Gerenciar"}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(opt.allowedAccompaniments || []).length > 0 ? (
                    (opt.allowedAccompaniments || []).map((acc) => (
                      <div 
                        key={String(acc.id)} 
                        onClick={() => builder.toggleAccompanimentIsBase(opt.id, String(acc.id))}
                        className={cn(
                          "group flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-full border text-[9px] font-black uppercase transition-all shadow-sm cursor-pointer select-none",
                          acc.isBase 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "bg-white border-slate-200 text-slate-500"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {acc.isBase && <Check size={10} strokeWidth={4} />}
                          <span>{String(acc.name)}</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            builder.setPrescription((prev: FullPrescription) => {
                              const updatedMeals = (prev.meals || []).map((mealItem) => {
                                const mi = mealItem as unknown as BuilderMeal;
                                if (mi.id !== m.id) return mealItem;
                                return {
                                  ...mi,
                                  groups: mi.groups.map((g) => g.id === mainGroup.id ? {
                                    ...g,
                                    options: g.options.map((o) => {
                                      if (o.id !== opt.id) return o;
                                      const filtered = (o.allowedAccompaniments || []).filter((a) => String(a.id) !== String(acc.id));
                                      return {
                                        ...o,
                                        allowedAccompaniments: filtered,
                                        nutritionalData: { 
                                          ...o.nutritionalData, 
                                          allowedAccompaniments: filtered 
                                        }
                                      };
                                    })
                                  } : g)
                                };
                              });
                              return { ...prev, meals: updatedMeals as unknown as PrescriptionMeal[] };
                            });
                          }}
                          className={cn(
                            "p-1 rounded-full transition-colors ml-1",
                            acc.isBase ? "hover:bg-emerald-700 text-emerald-100" : "hover:bg-red-50 text-slate-300 hover:text-red-500"
                          )}
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-[9px] text-slate-400 font-bold uppercase italic py-2 ml-1">
                      Sem acompanhamentos extras.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 📊 RODAPÉ DE MACROS */}
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

      {/* BOTÃO ADICIONAR */}
      {mainGroup && (
        <Button 
          disabled={(mainGroup.options || []).length >= 7}
          onClick={() => builder.setIsPickingFor({ mealId: m.id, groupId: mainGroup.id })}
          variant="outline" 
          className={cn(
            "w-full border-dashed border-2 rounded-2xl h-14 font-black uppercase text-[10px] gap-2 transition-all bg-white",
            (mainGroup.options || []).length >= 7 
              ? "border-slate-100 text-slate-300"
              : "border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
          )}
        >
          <Plus size={16} strokeWidth={4} /> 
          {(mainGroup.options || []).length >= 7 ? "Plano da Semana Completo" : "Adicionar Opção ao Cardápio"}
        </Button>
      )}

      {/* ORIENTAÇÕES */}
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
              return { ...mi, notes: e.target.value } as unknown as PrescriptionMeal;
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