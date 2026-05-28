import React from "react";
import {
  AlertCircle,
  Flame,
  Minus,
  Package,
  Plus,
  Tag,
  Trash2,
  Utensils,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { safeJsonParse, safeNumber } from "@/lib/safe-parse";

interface Accompaniment {
  name?: string;
  label?: string;
  weight?: number | string;
  id?: number | string;
}

interface Meal {
  slotName?: string;
  label?: string;
  dishName?: string;
  name?: string;
  selectedAccompaniments?: Accompaniment[];
  selectedAccs?: Accompaniment[];
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

export interface OrderItem {
  id: string | number;
  quantity: number;
  unitPrice?: number | string;
  totalPrice?: number | string;
  dish_name?: string;
  dishName?: string;
  name?: string;
  options?: string | OrderOptions;
  parsedOptions?: string | OrderOptions;
  packageItems?: Meal[];
  applied_nutrition?: string | unknown;
  appliedNutrition?: string | unknown;
  package_id?: string | number;
  size_name?: string;
}

interface AdminOrderItemsProps {
  items: OrderItem[];
  isEditing: boolean;
  onPrintLabel?: (item: OrderItem) => void;
  onUpdateQuantity?: (index: number, qty: number) => void;
  onRemoveItem?: (index: number) => void;
}

function normalizeAccList(value: unknown): Accompaniment[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return safeJsonParse<Accompaniment[]>(value, []);
  }
  return [];
}

function parseOptions(value: unknown): OrderOptions {
  if (typeof value === "string") {
    return safeJsonParse<OrderOptions>(value, {});
  }
  return (value as OrderOptions) || {};
}

function parseNutrition(value: unknown): Meal | Meal[] | null {
  if (!value || value === "null") return null;
  if (typeof value === "string") {
    return safeJsonParse<Meal | Meal[] | null>(value, null);
  }
  return value as Meal | Meal[] | null;
}

export function AdminOrderItems({
  items,
  isEditing,
  onPrintLabel,
  onUpdateQuantity,
  onRemoveItem,
}: AdminOrderItemsProps) {
  if (!items || items.length === 0) {
    return (
      <section className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <AlertCircle className="mx-auto mb-3 text-slate-400" size={40} />
        <p className="text-xs font-black uppercase italic tracking-widest text-slate-500">
          Nenhum item carregado.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 text-left">
      <h3 className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <Package size={14} className="text-slate-700" />
        Detalhes da produção ({items.length})
      </h3>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const options = parseOptions(item.parsedOptions || item.options || {});
          const nutrition = parseNutrition(item.applied_nutrition || item.appliedNutrition);
          const isPackage =
            Boolean(item.package_id) ||
            options._type === "package" ||
            options._type === "package_custom" ||
            options.isPackage === true ||
            Array.isArray(options.meals) ||
            (Array.isArray(item.packageItems) && item.packageItems.length > 0);

          const packageMeals = Array.isArray(item.packageItems) && item.packageItems.length > 0
            ? item.packageItems
            : Array.isArray(options.meals)
              ? options.meals
              : [];

          const displayName =
            item.dish_name ||
            item.dishName ||
            item.name ||
            options.dishName ||
            options.packageName ||
            (isPackage ? "Pacote Personalizado" : "Produto");

          const totalKcal = isPackage && Array.isArray(nutrition)
            ? nutrition.reduce(
                (acc, meal) => acc + safeNumber(meal.energy_kcal ?? meal.energyKcal),
                0,
              )
            : safeNumber((nutrition as Meal | null)?.energy_kcal ?? (nutrition as Meal | null)?.energyKcal);

          const singleAccs = normalizeAccList(
            options.selectedAccompaniments || options.selectedAccs || [],
          );

          return (
            <div
              key={String(item.id || idx)}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-900">
                    {safeNumber(item.quantity, 1)}x
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase leading-none text-slate-900">
                        {displayName}
                      </span>
                      {totalKcal > 0 && (
                        <Badge className="h-5 gap-1 border-orange-200 bg-orange-50 px-2 text-[9px] font-black uppercase text-orange-700">
                          <Flame size={10} className="text-orange-600" />
                          {Math.round(totalKcal)} kcal
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {isPackage
                          ? `Combo / Pacote (${packageMeals.length} marmitas)`
                          : item.size_name || options.selectedSizeName || "Sem tamanho"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700">
                        R$ {safeNumber(item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-2xl border-slate-200 bg-slate-50 text-slate-800 hover:bg-amber-50 hover:text-amber-700"
                      onClick={() => onPrintLabel?.(item)}
                    >
                      <Tag size={16} className="text-current" />
                    </Button>
                  )}

                  {isEditing && (
                    <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-slate-800 hover:bg-white"
                        onClick={() =>
                          onUpdateQuantity?.(idx, Math.max(1, safeNumber(item.quantity, 1) - 1))
                        }
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="min-w-8 text-center text-xs font-black text-slate-900">
                        {safeNumber(item.quantity, 1)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-slate-800 hover:bg-white"
                        onClick={() =>
                          onUpdateQuantity?.(idx, safeNumber(item.quantity, 1) + 1)
                        }
                      >
                        <Plus size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-1 h-8 w-8 rounded-xl text-red-600 hover:bg-red-50"
                        onClick={() => onRemoveItem?.(idx)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-l-2 border-slate-200 pl-4">
                {isPackage ? (
                  <div className="space-y-3">
                    {packageMeals.length > 0 ? (
                      packageMeals.map((meal, mealIndex) => {
                        const mealAccs = normalizeAccList(
                          meal.accompaniments ||
                            meal.selectedAccompaniments ||
                            meal.selectedAccs ||
                            [],
                        );

                        return (
                          <div
                            key={`${item.id}-${mealIndex}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="text-[9px] font-black uppercase italic text-emerald-700">
                              {meal.label || meal.slotName || `Marmita ${mealIndex + 1}`}
                            </p>
                            <p className="mt-1 text-[11px] font-bold uppercase text-slate-900">
                              {meal.dishName || meal.name || "Prato do pacote"}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {mealAccs.length > 0 ? (
                                mealAccs.map((acc, accIndex) => (
                                  <span
                                    key={`${item.id}-${mealIndex}-${accIndex}`}
                                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-slate-800"
                                  >
                                    {acc.name || acc.label || "Acompanhamento"}
                                    {acc.weight ? ` (${acc.weight}g)` : ""}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] font-bold uppercase italic text-slate-500">
                                  Sem acompanhamentos
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-[10px] font-black uppercase text-amber-800">
                          Pacote sem composição legível
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-amber-700">
                          O item existe no pedido, mas o JSON das marmitas não trouxe refeições
                          renderizáveis neste carregamento.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Utensils size={12} className="text-slate-600" />
                      <span className="text-[10px] font-black uppercase text-slate-500">
                        Acompanhamentos
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {singleAccs.length > 0 ? (
                        singleAccs.map((acc, accIndex) => (
                          <span
                            key={`${item.id}-${accIndex}`}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-800"
                          >
                            {acc.name || acc.label || "Acompanhamento"}
                            {acc.weight ? ` (${acc.weight}g)` : ""}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-bold uppercase italic text-slate-500">
                          Nenhum acompanhamento selecionado.
                        </span>
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
