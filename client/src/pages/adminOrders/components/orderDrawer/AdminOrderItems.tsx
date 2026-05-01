// e:/IA/projects/Site_React/client/src/pages/adminOrders/components/orderDrawer/AdminOrderItems.tsx

import React from "react";
import { Package, Tag, Flame, Utensils, AlertCircle, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- INTERFACES ---

interface Accompaniment {
  name: string;
  weight?: number | string;
  groupId?: number | string;
  id?: number | string;
}

interface Meal {
  slotName?: string;
  label?: string; 
  dishName?: string;
  selectedAccompaniments?: Accompaniment[];
  accompaniments?: Accompaniment[]; 
  energy_kcal?: number | string;
  energyKcal?: number | string;
}

interface OrderOptions {
  _type?: string;
  isPackage?: boolean;
  dishName?: string;
  packageName?: string;
  dishId?: string | number;
  selectedSizeName?: string;
  meals?: Meal[];
  selectedAccs?: Accompaniment[];
  selectedAccompaniments?: Accompaniment[];
}

interface OrderItem {
  id: string | number;
  quantity: number;
  dish_name?: string;
  dishName?: string;
  name?: string;
  options?: string | OrderOptions; // ✅ Refinado de 'object' para 'OrderOptions'
  parsedOptions?: OrderOptions; // ✅ Refinado de 'any'
  packageItems?: Meal[]; // ✅ Refinado de 'any[]'
  applied_nutrition?: string | unknown;
  appliedNutrition?: string | unknown;
  package_id?: string | number;
  size_name?: string;
}

interface AdminOrderItemsProps {
  items: OrderItem[];
  isEditing: boolean;
  onPrintLabel?: (item: OrderItem) => void;
}

export function AdminOrderItems({ items, isEditing, onPrintLabel }: AdminOrderItemsProps) {
  
  // PARSER BLINDADO
  const safeParse = <T = Record<string, unknown>>(data: unknown): T => {
    if (!data || data === "null") return {} as T;
    let current = data;
    let attempts = 0;
    while (typeof current === 'string' && attempts < 3) {
      try {
        const parsed = JSON.parse(current);
        if (typeof parsed === 'object' && parsed !== null) {
          current = parsed;
          break; 
        } else {
          current = parsed; 
        }
      } catch {
        break; 
      }
      attempts++;
    }
    return (typeof current === 'object' && current !== null) ? (current as T) : ({} as T);
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
          Nenhum item carregado.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4 text-left">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-2 italic">
        <Package size={14} /> Detalhes da Produção ({items.length})
      </h3>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const rawOptions = item.parsedOptions || item.options || {};
          const options = safeParse<OrderOptions>(rawOptions);
          
          const nutrition = safeParse<Meal | Meal[] | null>(item.applied_nutrition || item.appliedNutrition);
          
          const isPkg = !!item.package_id || 
                        options._type === "package" || 
                        options._type === "package_custom" || 
                        options.isPackage === true || 
                        Array.isArray(options.meals);
          
          const packageMeals = Array.isArray(item.packageItems) && item.packageItems.length > 0 
            ? (item.packageItems as Meal[]) 
            : Array.isArray(options.meals) ? (options.meals as Meal[]) : [];

          const displayName = 
            item.dish_name || 
            item.dishName || 
            item.name || 
            options.dishName || 
            options.packageName || 
            (isPkg ? "Pacote Personalizado" : null) ||
            (options.dishId ? `Prato #${options.dishId}` : "Produto");

          const totalKcal = isPkg && Array.isArray(nutrition)
            ? nutrition.reduce((acc: number, m: Meal) => acc + (Number(m.energy_kcal || m.energyKcal || 0)), 0)
            : (Number((nutrition as Meal)?.energy_kcal || (nutrition as Meal)?.energyKcal || 0));

          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm relative overflow-hidden transition-all hover:border-slate-200 text-left">
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black text-emerald-600 border border-slate-100 shrink-0">
                    {item.quantity}x
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-slate-800 uppercase leading-none">
                        {displayName}
                      </span>
                      {totalKcal > 0 && (
                        <Badge className="bg-orange-50 text-orange-600 border-orange-100 text-[8px] font-black h-4 px-1.5 flex gap-0.5">
                          <Flame size={8} fill="currentColor" /> {Math.round(totalKcal)} KCAL
                        </Badge>
                      )}
                    </div>
                    
                    {!isPkg && (item.size_name || options.selectedSizeName) && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                        {item.size_name || options.selectedSizeName}
                      </span>
                    )}
                    {isPkg && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                        Combo / Pacote ({packageMeals.length} Refeições)
                      </span>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm shrink-0 ml-2" 
                    onClick={() => onPrintLabel?.(item)}
                  >
                    <Tag size={18} />
                  </Button>
                )}
              </div>

              <div className="mt-4 ml-12 border-l-2 border-slate-50 pl-4 text-left">
                {isPkg ? (
                  <div className="space-y-3">
                    {packageMeals.length > 0 ? (
                      packageMeals.map((meal, mIdx) => {
                        const accs = meal.accompaniments || meal.selectedAccompaniments || [];

                        return (
                          <div key={mIdx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                            <p className="text-[9px] font-black text-emerald-600 uppercase italic mb-1">
                              {meal.label || meal.slotName || `Marmita ${mIdx + 1}`}:
                            </p>
                            <p className="text-[10px] font-bold text-slate-700 uppercase mb-2">
                              {meal.dishName}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {accs.length > 0 ? (
                                accs.map((acc, aIdx) => (
                                  <div key={aIdx} className="flex flex-col bg-white border border-slate-100 px-2 py-1 rounded-lg">
                                    <span className="text-[8px] font-bold text-slate-600 uppercase leading-none">
                                      {acc.name} {acc.weight ? `(${acc.weight}g)` : ''}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-[8px] font-bold text-slate-400 uppercase italic">
                                  Sem acompanhamentos
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex gap-2">
                        <Bug size={14} className="shrink-0 mt-0.5" />
                        <div>
                          <strong>JSON Vazio ou Mal Formatado</strong><br/>
                          <span className="text-[9px] text-red-400 break-all">{JSON.stringify(options)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Utensils size={12} />
                      <span className="text-[9px] font-black uppercase">Acompanhamentos:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(options.selectedAccs || options.selectedAccompaniments || []).length > 0 ? (
                        (options.selectedAccs || options.selectedAccompaniments || []).map((acc, i) => (
                          <div key={i} className="flex flex-col bg-emerald-50/50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                            <span className="text-[10px] font-black text-emerald-700 uppercase leading-none">
                              {acc.name} {acc.weight ? `(${acc.weight}g)` : ''}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[9px] font-bold text-slate-300 uppercase italic">Nenhum selecionado.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}