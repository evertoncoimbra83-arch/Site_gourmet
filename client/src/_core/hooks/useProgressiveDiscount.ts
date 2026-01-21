import { useMemo } from "react";
import { trpc } from "@/_core/trpc";

// Interface alinhada com o Schema padronizado
interface DiscountRule {
  id: number;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  discountValue: string | number; // O Drizzle mapeia 'value' para 'discountValue'
  isActive: boolean;
}

export function useProgressiveDiscount({ itemCount }: { itemCount: number }) {
  const { data: rawRules = [], isLoading } = trpc.discounts.getDiscountRules.useQuery();

  const rules = useMemo(() => {
    // Forçamos a tipagem para garantir consistência
    const typedRules = (rawRules as any) as DiscountRule[];

    return typedRules
      .map((r) => ({
        // ✅ Alterado de minQty para minQuantity para matar o erro no useCartPageLogic
        minQuantity: Number(r.minQuantity || 0),
        // ✅ Mapeamento seguro para o valor do desconto
        discountValue: Number(r.discountValue || (r as any).discount_value || 0), 
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