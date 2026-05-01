// client/src/pages/adminLabelEditor/components/elements/TextNode.tsx
import React from "react";
import { ElementNodeProps } from "../LabelCanvas";

export function TextNode({ el, isSelected, onSelect }: ElementNodeProps) {
  const displayValue = el.staticText || `{{${el.field}}}`;

  return (
    // ✅ FIX: Sem position absolute nem left/top — o Rnd já posiciona.
    // O div preenche 100% do container Rnd.
    <div
      style={{
        width: "100%",
        height: "100%",
        fontSize: `${el.fontSize}px`,
        lineHeight: "1.2",
        overflow: "hidden",
      }}
      className={`cursor-move select-none p-1 transition-colors border-2 ${
        isSelected
          ? "border-emerald-500 bg-emerald-50/50"
          : "border-transparent hover:border-slate-200"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(el.id);
      }}
    >
      <span className="font-bold text-slate-900 block truncate">
        {displayValue}
      </span>
    </div>
  );
}