import React from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { Leaf, Zap, Heart, Flame, Sparkles, Trophy } from "lucide-react";

type BadgeType = "promotion" | "new" | "bestseller" | "vegan" | "glutenFree" | "highProtein" | "limited";

interface ProductBadgeProps {
  type: BadgeType;
  label?: string;
  animated?: boolean;
  className?: string;
}

const badgeConfig: Record<BadgeType, { icon: React.ReactNode; label: string; bgColor: string; textColor: string; gradient: string }> = {
  promotion: {
    icon: <Flame className="w-3 h-3" />,
    label: "Promoção",
    bgColor: "bg-secondary",
    textColor: "text-secondary-foreground",
    gradient: "from-secondary to-yellow-500",
  },
  new: {
    icon: <Sparkles className="w-3 h-3" />,
    label: "Novo",
    bgColor: "bg-accent",
    textColor: "text-white",
    gradient: "from-accent to-green-400",
  },
  bestseller: {
    icon: <Trophy className="w-3 h-3" />,
    label: "Bestseller",
    bgColor: "bg-primary",
    textColor: "text-primary-foreground",
    gradient: "from-primary to-accent",
  },
  vegan: {
    icon: <Leaf className="w-4 h-4" />,
    label: "Vegano",
    bgColor: "bg-white",
    textColor: "text-green-600",
    gradient: "from-white to-green-50",
  },
  glutenFree: {
    icon: <Zap className="w-4 h-4" />,
    label: "Sem Glúten",
    bgColor: "bg-white",
    textColor: "text-yellow-600",
    gradient: "from-white to-yellow-50",
  },
  highProtein: {
    icon: <Heart className="w-4 h-4" />,
    label: "Proteico",
    bgColor: "bg-white",
    textColor: "text-red-600",
    gradient: "from-white to-red-50",
  },
  limited: {
    icon: <Flame className="w-3 h-3" />,
    label: "Edição Limitada",
    bgColor: "bg-purple-500",
    textColor: "text-white",
    gradient: "from-purple-500 to-pink-500",
  },
};

/**
 * Componente reutilizável de badges para produtos
 * Suporta múltiplos tipos com ícones e estilos predefinidos
 */
export default function ProductBadge({
  type,
  label,
  animated = false,
  className = "",
}: ProductBadgeProps) {
  const config = badgeConfig[type];
  const displayLabel = label || config.label;
  const isLarge = type === "vegan" || type === "glutenFree" || type === "highProtein";

  if (isLarge) {
    return (
      <div
        className={`bg-gradient-to-br ${config.gradient} ${config.textColor} rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}
        title={displayLabel}
      >
        {config.icon}
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-r ${config.gradient} ${config.textColor} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 ${
        animated ? "animate-pulse" : ""
      } ${className}`}
    >
      {config.icon}
      <span className="leading-none">{displayLabel}</span>
    </div>
  );
}