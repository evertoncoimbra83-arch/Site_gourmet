import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NutriFieldProps {
  label: string;
  icon: LucideIcon;
  value: string | number;
  onChange?: (val: string) => void;
  unit?: string;
  color?: string;
  bg?: string;
  highlight?: boolean;
}

export function NutriField({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  unit = "g", 
  color = "text-slate-500", 
  bg = "bg-white",
  highlight = false
}: NutriFieldProps) {
  
  return (
    <div 
      className={cn(
        "p-4 rounded-[1.5rem] border border-slate-100/50 transition-all flex flex-col gap-1 shadow-sm hover:shadow-md hover:border-slate-200",
        bg,
        highlight && "border-emerald-200 bg-emerald-50 shadow-emerald-100"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div 
          className={cn(
            "h-7 w-7 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-50",
            color
          )}
        >
          <Icon size={14} strokeWidth={3} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-tight text-slate-500">
          {label}
        </span>
      </div>

      <div className="flex items-end gap-1.5 relative">
        <Input 
          type="number"
          // ✅ Fallback para string vazia evita erro de input controlado/não-controlado
          value={value ?? ""} 
          onChange={(e) => onChange && onChange(e.target.value)} 
          // ✅ 'appearance-none' e hide-spinner removem as setinhas do input
          className="h-10 bg-transparent border-none rounded-xl font-black text-xl text-slate-800 outline-none p-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
        
        <span className="text-[10px] font-black text-slate-300 mb-2 uppercase select-none italic">
          {unit}
        </span>
      </div>
    </div>
  );
}