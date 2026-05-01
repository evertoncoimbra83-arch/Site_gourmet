import React from "react"; // ✅ Adicionado para satisfazer o escopo JSX
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react"; // ✅ Importada tipagem de ícone
import { cn } from "@/lib/utils"; 

interface CategoryIconProps {
  iconKey?: string | null;
  color?: string | null;
  size?: number; 
}

export function CategoryIcon({ iconKey, color, size = 18 }: CategoryIconProps) {
  // 1. Robustez de Casing
  const formattedKey = iconKey 
    ? iconKey.charAt(0).toUpperCase() + iconKey.slice(1).toLowerCase() 
    : "Tag";

  // ✅ CORREÇÃO: Removido 'any'. Usamos cast via unknown para um Record tipado corretamente.
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[formattedKey] || LucideIcons.Tag;

  // 2. Cores com Fundo Sólido
  const colorStyles: Record<string, string> = {
    red: "text-red-600 bg-red-50 border-red-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    slate: "text-slate-500 bg-slate-100 border-slate-200",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    white: "text-slate-900 bg-white border-white", 
  };

  return (
    <div className={cn(
      "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 border",
      colorStyles[color || "slate"] || "text-slate-500 bg-slate-100 border-slate-200"
    )}>
      <Icon size={size} strokeWidth={2.5} />
    </div>
  );
}