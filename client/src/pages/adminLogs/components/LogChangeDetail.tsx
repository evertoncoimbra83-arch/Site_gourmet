import React from "react"; // ✅ Resolvido: React in scope
import { ArrowRight } from "lucide-react";

// ✅ Resolvido: Substituído 'any' por Record<string, unknown> para tipagem segura
interface LogChangeDetailProps {
  action: string;
  oldValues: Record<string, unknown> | null | undefined;
  newValues: Record<string, unknown> | null | undefined;
}

export function LogChangeDetail({ action, oldValues, newValues }: LogChangeDetailProps) {
  if (!newValues || Object.keys(newValues).length === 0) {
    return <span className="text-slate-400 text-[10px] italic">Evento de sistema</span>;
  }

  // Especialização para Marketing/Preços/Frete
  if (action.includes("MARKETING") || action.includes("SHIPPING")) {
    const oldPrice = (oldValues?.price || oldValues?.generalMinOrderAmount) as string | number | undefined;
    const newPrice = (newValues?.price || newValues?.generalMinOrderAmount) as string | number | undefined;

    return (
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-slate-400 line-through">
           {oldPrice ?? '---'}
        </span>
        <ArrowRight size={10} className="text-slate-300" />
        <span className="text-emerald-600 font-black">
           {newPrice ?? '---'}
        </span>
      </div>
    );
  }

  // Visualização genérica para outros campos
  const firstKey = Object.keys(newValues)[0];
  const displayValue = typeof newValues[firstKey] === 'object' 
    ? JSON.stringify(newValues[firstKey]) 
    : String(newValues[firstKey]);

  return (
    <div className="max-w-50 truncate"> {/* ✅ Resolvido: Sugestão de classe canônica do Tailwind */}
      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-tighter">
        {firstKey}:
      </span>
      <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-1 rounded">
        {displayValue}
      </span>
    </div>
  );
}