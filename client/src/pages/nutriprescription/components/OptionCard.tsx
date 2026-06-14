import React from "react";
import { Flame, Beef, Wheat, Droplets, CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DishOption, PrescriptionAccompaniment } from "../hooks/usePrescriptionLogic";

interface OptionCardProps {
    opt: DishOption;
    basePrice: number;
    nutriDiscount: number;
    onAdd: (opt: DishOption) => void;
}

export function OptionCard({ opt, basePrice, nutriDiscount, onAdd }: OptionCardProps) {

    const macros = (opt.nutritionalData as any)?.macros || opt.nutritionalData?.baseMacros || opt.macros || {};
    const kcal = Math.round(Number(macros.kcal || macros.energyKcal || 0));
    const protein = Math.round(Number(macros.proteins || macros.protein || 0));
    const carbs = Math.round(Number(macros.carbs || 0));
    const fat = Math.round(Number(macros.fatTotal || macros.fat || 0));
    const finalPrice = nutriDiscount > 0 ? basePrice * (1 - nutriDiscount / 100) : basePrice;
    const mainDishWeight = Number(opt.mainDishWeight || opt.nutritionalData?.mainDishWeight || 0);
    const displayAccompaniments =
        (Array.isArray(opt.displayAccompaniments) && opt.displayAccompaniments.length > 0 && opt.displayAccompaniments) ||
        (Array.isArray(opt.visibleAccompaniments) && opt.visibleAccompaniments.length > 0 && opt.visibleAccompaniments) ||
        (Array.isArray(opt.selectedAccompaniments) && opt.selectedAccompaniments.length > 0 && opt.selectedAccompaniments) ||
        (Array.isArray(opt.allowedAccompaniments) && opt.allowedAccompaniments.length > 0 && opt.allowedAccompaniments) ||
        [] as PrescriptionAccompaniment[];

    const hasDiscount = Boolean(opt.hasNutriDiscount);
    const finalPriceVal = Number(opt.finalPrice ?? finalPrice);
    const originalPriceVal = Number(opt.originalPrice ?? basePrice);
    const discountPct = Number(opt.discountPercentage ?? nutriDiscount ?? 0);
    const hasPrice = originalPriceVal > 0 || finalPriceVal > 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };
    const groupedAccompaniments = displayAccompaniments.reduce<Record<string, PrescriptionAccompaniment[]>>((groups, acc) => {
        const groupName = String(acc.groupName || acc.sourceGroupName || "Acompanhamentos");
        groups[groupName] = groups[groupName] || [];
        groups[groupName].push(acc);
        return groups;
    }, {});

    return (
        <div className="bg-white rounded-4xl border-2 border-slate-100 p-2 flex flex-col shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group h-full text-left">
            <div className="p-6 flex-1">
                <h3 className="text-lg font-black uppercase italic text-slate-800 mb-5 group-hover:text-emerald-700 transition-colors leading-tight">{opt.name || "Prato Sem Nome"}</h3>
                {(opt.sizeName || mainDishWeight > 0) && (
                    <div className="mb-5 flex flex-wrap gap-2">
                        {opt.sizeName && (
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                                Tamanho: {opt.sizeName}
                            </span>
                        )}
                        {mainDishWeight > 0 && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                Prato principal: {mainDishWeight}g
                            </span>
                        )}
                    </div>
                )}
                <div className="grid grid-cols-4 gap-2 mb-8 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                    <div className="flex flex-col items-center"><Flame size={14} className="text-slate-400 mb-1" /><span className="text-[10px] font-black text-slate-800">{kcal}</span><span className="text-[8px] uppercase text-slate-400 font-bold">Kcal</span></div>
                    <div className="flex flex-col items-center"><Beef size={14} className="text-emerald-500 mb-1" /><span className="text-[10px] font-black text-emerald-700">{protein}g</span><span className="text-[8px] uppercase text-emerald-500 font-bold">Prot</span></div>
                    <div className="flex flex-col items-center"><Wheat size={14} className="text-blue-500 mb-1" /><span className="text-[10px] font-black text-blue-700">{carbs}g</span><span className="text-[8px] uppercase text-blue-500 font-bold">Carb</span></div>
                    <div className="flex flex-col items-center"><Droplets size={14} className="text-orange-500 mb-1" /><span className="text-[10px] font-black text-orange-700">{fat}g</span><span className="text-[8px] uppercase text-orange-500 font-bold">Gord</span></div>
                </div>
                {displayAccompaniments.length > 0 ? (
                    <div className="space-y-4 mb-2">
                        {Object.entries(groupedAccompaniments).map(([groupName, accs]) => (
                            <div key={groupName} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                                <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    {groupName}
                                </p>
                                <ul className="space-y-2">
                                    {accs.map((acc, aIdx) => {
                                        const grammage = Number(acc.weight || acc.defaultGrammage || 0);
                                        const isNoAccompaniment = Boolean(acc.isNoAccompaniment || acc.is_no_accompaniment);

                                        return (
                                            <li key={`${acc.id}-${aIdx}`} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                <span className="leading-tight">
                                                    {acc.name}
                                                    {grammage > 0 && (
                                                        <span className="ml-1 text-xs font-bold text-slate-400">
                                                            {grammage}g
                                                        </span>
                                                    )}
                                                    {isNoAccompaniment && (
                                                        <span className="ml-2 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-slate-500">
                                                            Sem acompanhamento
                                                        </span>
                                                    )}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mb-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-400">
                        {opt.noAccompanimentsMessage || "Sem acompanhamentos definidos"}
                    </p>
                )}
            </div>
            <div className="bg-slate-50 p-5 rounded-[2rem] flex items-center justify-between border border-slate-100 mt-auto">
                {!hasPrice ? (
                    <div className="flex flex-col text-left gap-0.5">
                        <span className="text-[10px] font-bold text-slate-500 leading-tight">
                            Preço será confirmado no carrinho
                        </span>
                    </div>
                ) : hasDiscount ? (
                    <div className="flex flex-col text-left gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400">
                                De <span className="line-through">{formatCurrency(originalPriceVal)}</span>
                            </span>
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black uppercase text-amber-700 tracking-wide">
                                {discountPct}% OFF
                            </span>
                        </div>
                        <span className="text-xl font-black italic text-emerald-600 leading-none mt-1">
                            Por {formatCurrency(finalPriceVal)}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 mt-1">
                            Desconto Nutri aplicado automaticamente no carrinho.
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col text-left gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400">Preço:</span>
                        <span className="text-xl font-black italic text-emerald-600 leading-none mt-1">
                            {formatCurrency(originalPriceVal)}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 mt-1">
                            Valor da prescrição.
                        </span>
                    </div>
                )}
                <Button onClick={() => onAdd(opt)} className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shrink-0 ml-4">
                    Adicionar
                </Button>
            </div>
        </div>
    );
}
