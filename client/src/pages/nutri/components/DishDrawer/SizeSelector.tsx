import React from "react";
import { Hash } from "lucide-react";

interface SizeOption {
  id: number | string;
  name: string;
  weight: string;
}

interface SizeSelectorProps {
  availableSizes?: SizeOption[];
  selectedSizeId?: string;
  calories?: number;
  onChange: (sizeId: string, calories?: number) => void;
}

export function SizeSelector({ availableSizes, selectedSizeId, calories, onChange }: SizeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
          <Hash size={10} /> Tamanho
        </label>
        <select
          className="w-full bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase p-2 h-9 outline-none focus:ring-1 focus:ring-emerald-500"
          value={selectedSizeId || ""}
          onChange={(e) => onChange(e.target.value, calories)}
        >
          <option value="">Selecionar...</option>
          {availableSizes?.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name} ({s.weight})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase text-slate-400">Meta Kcal</label>
        <input
          type="number"
          className="w-full bg-slate-50 border-none rounded-lg text-[10px] font-bold p-2 h-9 outline-none focus:ring-1 focus:ring-emerald-500"
          value={calories || ""}
          placeholder="0"
          onChange={(e) => onChange(selectedSizeId || "", Number(e.target.value))}
        />
      </div>
    </div>
  );
}