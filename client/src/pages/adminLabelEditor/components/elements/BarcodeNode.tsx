// client/src/pages/adminLabelEditor/components/elements/BarcodeNode.tsx
import React from "react";
import { Barcode } from "lucide-react";
import { ElementNodeProps } from "../LabelCanvas";

export function BarcodeNode({ el, isSelected, onSelect }: ElementNodeProps) {
  return (
    // ✅ FIX: Sem position absolute nem left/top — o Rnd já posiciona.
    <div
      style={{ width: "100%", height: "100%" }}
      className={`flex flex-col items-center justify-center bg-white cursor-move transition-all ${
        isSelected
          ? "ring-2 ring-emerald-500 ring-offset-2 shadow-lg"
          : "border border-dashed border-slate-300 opacity-80 hover:opacity-100"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(el.id);
      }}
    >
      <Barcode size={32} className="text-slate-900" strokeWidth={1.5} />
      <span className="text-[8px] font-mono mt-1 text-slate-500 uppercase tracking-widest">
        {el.field === "preview" ? "123456789" : `{{${el.field}}}`}
      </span>
    </div>
  );
}
