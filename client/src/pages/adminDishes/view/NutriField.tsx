import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDishStore } from "../logic/useDishStore";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NutriFieldProps {
  label: string;
  icon: LucideIcon;
  field: string; 
  highlight?: boolean;
}

export function NutriField({ label, icon: Icon, field, highlight }: NutriFieldProps) {
  /**
   * 🛡️ TIPAGEM SEGURA:
   * Novamente, forçamos o cast para garantir que o TS enxergue o formData e o setFormData,
   * resolvendo o erro de 'Property does not exist on type unknown'.
   */
  const { formData, setFormData } = useDishStore() as unknown as {
    formData: Record<string, unknown>;
    setFormData: (data: Record<string, unknown>) => void;
  };

  /**
   * ✅ EXTRAÇÃO DE VALOR:
   * Garante que o valor seja compatível com o Input HTML.
   */
  const rawValue = formData?.[field];
  const value = typeof rawValue === "string" || typeof rawValue === "number" 
    ? rawValue 
    : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    /**
     * 🚀 ROADMAP FASE 3:
     * Ao atualizar o campo individual (ex: 'proteins'), o Store reflete 
     * diretamente na raiz do objeto, preparando os dados para as colunas do MySQL.
     */
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  return (
    <div className={cn(
      "space-y-2 p-3 rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-emerald-500/20",
      highlight ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-transparent"
    )}>
      <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
        <Icon size={12} className={highlight ? "text-emerald-500" : "text-slate-300"} />
        {label}
      </Label>
      
      <div className="relative">
        <Input 
          type="number" 
          step="0.01"
          className={cn(
            "h-10 text-lg font-black bg-transparent border-none p-0 focus-visible:ring-0 shadow-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            highlight ? "text-emerald-700" : "text-slate-700"
          )}
          placeholder="0.00"
          value={value}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}