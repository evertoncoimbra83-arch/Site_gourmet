import React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientPrescription } from "../hooks/usePrescriptionLogic";

interface SlotSelectorProps {
  plans: PatientPrescription[];
  activeIdx: number;
  onSelect: (index: number) => void;
}

export function SlotSelector({ plans, activeIdx, onSelect }: SlotSelectorProps) {
  if (plans.length <= 1) return null;

  return (
    <div className="flex gap-3 mb-10 overflow-x-auto pb-4 custom-scrollbar">
      {plans.map((plan, idx) => (
        <button
          key={plan.id || idx}
          onClick={() => onSelect(idx)}
          className={cn(
            "px-6 py-4 rounded-3xl border-2 transition-all shrink-0 min-w-40 text-left",
            activeIdx === idx 
              ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105" 
              : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={14} className={activeIdx === idx ? "text-emerald-400" : ""} />
            <span className="text-[10px] font-black uppercase tracking-widest">Opção {idx + 1}</span>
          </div>
          <span className="font-black italic text-sm truncate block">{plan?.planName || "Plano"}</span>
        </button>
      ))}
    </div>
  );
}