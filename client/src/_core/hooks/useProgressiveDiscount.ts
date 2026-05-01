import { useMemo } from "react";
import { trpc } from "@/_core/trpc";

// Interface alinhada com o Schema padronizado
interface DiscountRule {
  id: number;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  discountValue: string | number; 
  discount_value?: string | number; // ✅ Suporte para snake_case vindo do banco
  isActive: boolean;
}

export function useProgressiveDiscount({ itemCount }: { itemCount: number }) {
  const { data: rawRules = [], isLoading } = trpc.discounts.getDiscountRules.useQuery();

  const rules = useMemo(() => {
    const typedRules = (rawRules as unknown) as DiscountRule[];

    return typedRules
      .map((r) => ({
        minQuantity: Number(r.minQuantity || 0),
        // ✅ FIX: Mapeamento seguro usando a propriedade definida na interface
        discountValue: Number(r.discountValue || r.discount_value || 0), 
        name: r.name,
        isActive: Boolean(r.isActive)
      }))
      .filter((r) => r.isActive)
      .sort((a, b) => a.minQuantity - b.minQuantity);
  }, [rawRules]);

  // Encontra a regra atual (o maior tier atingido)
  const currentRule = [...rules].reverse().find(r => itemCount >= r.minQuantity);

  return { 
    tiers: rules, 
    currentTier: currentRule || null,
    isLoading 
  };
}