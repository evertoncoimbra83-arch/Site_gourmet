import * as LucideIcons from "lucide-react";
// Tente este import (ajuste conforme sua estrutura de pastas)
import { cn } from "@/lib/utils"; 

interface CategoryIconProps {
  iconKey?: string;
  color?: string;
}

export function CategoryIcon({ iconKey, color }: CategoryIconProps) {
  // Busca o ícone dinamicamente ou usa um círculo como fallback
  const Icon = (LucideIcons as any)[iconKey || "Circle"] || LucideIcons.Circle;

  // Mapeamento das suas classes de cores
  const colorStyles: Record<string, string> = {
    red: "text-red-500 bg-red-50",
    amber: "text-amber-500 bg-amber-50",
    emerald: "text-emerald-500 bg-emerald-50",
    blue: "text-blue-500 bg-blue-50",
    slate: "text-slate-500 bg-slate-50",
  };

  return (
    <div className={cn(
      "w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
      colorStyles[color || "slate"]
    )}>
      <Icon size={16} strokeWidth={2.5} />
    </div>
  );
}