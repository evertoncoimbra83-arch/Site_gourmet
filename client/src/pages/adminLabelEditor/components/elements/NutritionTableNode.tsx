// client/src/pages/adminLabelEditor/components/elements/NutritionTableNode.tsx
import React from "react";
import type { ElementNodeProps } from "../LabelCanvas";

export function NutritionTableNode({ el, isSelected, onSelect }: ElementNodeProps) {
  return (
    // ✅ FIX: Sem position absolute nem left/top — o Rnd já posiciona.
    <div
      style={{
        width: "100%",
        height: "100%",
        border: "2px solid black",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        overflow: "hidden",
      }}
      className={isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(el.id);
      }}
    >
      <div className="border-b-2 border-black p-1 text-center font-black text-[10px] uppercase bg-slate-100 shrink-0">
        Informação Nutricional
      </div>
      <div className="grid grid-cols-1 gap-y-1 p-2 text-[9px] flex-1 overflow-hidden">
        <NutritionRow label="Kcal"  value={el.field === "preview" ? "350 kcal" : "{{kcal}}"} />
        <NutritionRow label="Carb"  value={el.field === "preview" ? "40g"      : "{{carbs}}"} />
        <NutritionRow label="Prot"  value={el.field === "preview" ? "30g"      : "{{prots}}"} />
        <NutritionRow label="Gord"  value={el.field === "preview" ? "12g"      : "{{fats}}"} />
      </div>
    </div>
  );
}

function NutritionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
      <span className="font-bold">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
