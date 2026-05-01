//pages/profile/components/OrderTab/OrdersTabItem.tsx
import React, { useMemo } from "react";
import { Flame, Beef, Wheat, Droplets, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NutritionData } from "@/pages/adminLabelEditor/print-engine/logic";
import { formatCurrency, safeNum } from "../../utils/orderHelpers";
import { OrderItem, OrderNutritionSummary } from "../../types/orderTypes";

function MiniNutriBadge({
  kcal,
  pro,
  carbs,
  fat,
}: {
  kcal: number;
  pro: number;
  carbs: number;
  fat: number;
}) {
  if (!kcal && !pro && !carbs && !fat) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 py-2 px-3 bg-slate-50/50 rounded-xl border border-slate-100 w-fit">
      <div className="flex items-center gap-1.5">
        <Flame size={12} className="text-orange-500" />
        <span className="text-[10px] font-black text-slate-700">
          {kcal}
          <span className="text-[8px] ml-0.5 text-slate-400 font-bold uppercase">
            kcal
          </span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
        <Beef size={12} className="text-emerald-500" />
        <span className="text-[10px] font-black text-slate-700">
          {pro}g
          <span className="text-[8px] ml-0.5 text-emerald-500 font-bold uppercase">
            P
          </span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
        <Wheat size={12} className="text-blue-500" />
        <span className="text-[10px] font-black text-slate-700">
          {carbs}g
          <span className="text-[8px] ml-0.5 text-blue-500 font-bold uppercase">
            C
          </span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
        <Droplets size={12} className="text-orange-400" />
        <span className="text-[10px] font-black text-slate-700">
          {fat}g
          <span className="text-[8px] ml-0.5 text-orange-400 font-bold uppercase">
            G
          </span>
        </span>
      </div>
    </div>
  );
}

function NutriTable({ nut, title }: { nut: NutritionData; title: string }) {
  const n = (val: number | undefined) => safeNum(val);

  const portion = nut.yieldWeight || 100;
  const kcal = Math.round(n(nut.energyKcal));
  const kj = Math.round(n(nut.energyKj) || kcal * 4.184);

  const rows = [
    { label: "Valor Energético", val: `${kcal} kcal / ${kj} kJ` },
    { label: "Carboidratos", val: `${n(nut.carbs).toFixed(1)} g` },
    { label: "Açúcares Totais", val: `${n(nut.addedSugars).toFixed(1)} g`, indent: true },
    {
      label: "Açúcares Adicionados",
      val: `${n(nut.addedSugars).toFixed(1)} g`,
      indent: true,
    },
    { label: "Proteínas", val: `${n(nut.proteins).toFixed(1)} g` },
    { label: "Gorduras Totais", val: `${n(nut.fatTotal).toFixed(1)} g` },
    { label: "Gorduras Saturadas", val: `${n(nut.fatSaturated).toFixed(1)} g`, indent: true },
    { label: "Gorduras Trans", val: `${n(nut.fatTrans).toFixed(1)} g`, indent: true },
    { label: "Fibra Alimentar", val: `${n(nut.fiber).toFixed(1)} g` },
    { label: "Sódio", val: `${Math.round(n(nut.sodium))} mg` },
  ];

  return (
    <div className="space-y-3 text-left">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
        {title}
      </p>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex justify-between">
          <span className="text-[10px] font-black uppercase text-white tracking-wider">
            Informação Nutricional
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            Porção {portion}g
          </span>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex justify-between items-center px-4 py-2 border-b border-slate-100 last:border-0 ${
              i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            }`}
          >
            <span
              className={`text-[11px] font-bold text-slate-700 ${
                row.indent ? "pl-4 font-normal text-slate-500" : ""
              }`}
            >
              {row.label}
            </span>
            <span className="text-[11px] font-black text-slate-900">{row.val}</span>
          </div>
        ))}

        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100">
          <p className="text-[9px] text-slate-400 leading-snug">
            * Valores diários com base em uma dieta de 2.000 kcal.
          </p>
        </div>
      </div>
    </div>
  );
}

function IndividualMealRow({ label }: { label: OrderNutritionSummary }) {
  const mainDish = label.mainDishName || label.displayName;
  const accompaniments = label.accompaniments || [];

  return (
    <div className="relative border-b border-slate-50 last:border-0 py-5 first:pt-2">
      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.15em] leading-none mb-1.5 italic">
        {label.slot || "Item"}
      </p>

      <p className="text-sm font-bold text-slate-800 leading-snug mb-2 uppercase italic">
        {mainDish}
      </p>

      {accompaniments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {accompaniments.map((accompaniment, index) => (
            <span
              key={index}
              className="text-[9px] text-slate-500 font-bold bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50 uppercase"
            >
              + {accompaniment}
            </span>
          ))}
        </div>
      )}

      {label.hasNutrition && (
        <MiniNutriBadge
          kcal={label.kcal || 0}
          pro={label.proteins || 0}
          carbs={label.carbs || 0}
          fat={label.fat || 0}
        />
      )}

      <Dialog>
        <DialogTrigger asChild>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 outline-none">
            <FileText size={11} /> Ver ficha técnica
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-md rounded-3xl border-0 p-0 overflow-hidden outline-none flex flex-col max-h-[85dvh]">
          <DialogHeader className="bg-slate-900 px-6 py-5 text-left">
            <DialogTitle className="text-white font-black uppercase tracking-tight text-sm italic">
              Ficha Técnica
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              {label.displayName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 text-left">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Composição
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase italic">
                  {mainDish}
                </span>
                {accompaniments.map((accompaniment, index) => (
                  <span
                    key={index}
                    className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 uppercase"
                  >
                    + {accompaniment}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Ingredientes
              </p>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] font-semibold leading-relaxed text-slate-600 whitespace-pre-line uppercase">
                {label.combinedIngredients || "Ingredientes não informados."}
              </div>
            </div>

            <NutriTable nut={label.nutrition || {}} title="Tabela Nutricional (ANVISA)" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function OrdersTabItem({ item }: { item: OrderItem }) {
  const nutritionLabels = useMemo(() => item.nutritionLabels ?? [], [item.nutritionLabels]);
  const isPackage =
    nutritionLabels.length > 1 || String(item.name).toLowerCase().includes("pacote");

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-5 text-left">
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-6 px-2 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-[10px]">
            {item.quantity}x
          </span>
          <h4 className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-tight italic">
            {isPackage ? item.name : item.dishName || item.name}
          </h4>
        </div>
        <span className="font-black text-slate-900 text-xs md:text-sm">
          {formatCurrency(item.totalPrice)}
        </span>
      </div>

      <div className="space-y-2 pl-4 border-l-2 border-emerald-50">
        {nutritionLabels.map((label, idx) => (
          <IndividualMealRow key={`${label.id}-${idx}`} label={label} />
        ))}
      </div>
    </div>
  );
}