// E:\IA\projects\Site_React\client\src\_core\hooks\useCartLoyalty.ts

import { useCart } from "@/_core/CartContext";
import { trpc } from "@/_core/trpc"; 
import { useLoyaltyValidator, LoyaltySettings } from "@/_core/hooks/loyalty/useLoyaltyValidator";

/**
 * Hook para gerenciar a lógica de fidelidade no carrinho.
 * ✅ Sincronizado com os totais reais do servidor para evitar divergências de valores.
 */
export function useCartLoyalty() {
  const { 
    loyaltyPoints, 
    totals, 
    usesLoyalty, 
    toggleLoyalty,
    isLoading: cartLoading,
    money 
  } = useCart();

  // 1. Busca as configurações globais de fidelidade (Cache de 1 minuto)
  const { data: settings, isLoading: settingsLoading } = trpc.loyalty.getSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60000 
  });

  // 2. Motor de validação para mensagens de interface e upsell
  const validation = useLoyaltyValidator(
    Number(totals.subtotal || 0), 
    Number(loyaltyPoints || 0), 
    settings as LoyaltySettings | undefined
  );

  return {
    points: loyaltyPoints,
    isActive: usesLoyalty,
    canUse: validation.isValid,
    reason: validation.message,

    /**
     * ✅ ÚNICA FONTE DA VERDADE:
     * Se o benefício estiver ativo, usamos EXCLUSIVAMENTE o valor calculado pelo servidor (totals.loyaltyDiscount).
     * Isso evita que erros de arredondamento ou regras de faixas diferentes entre Front/Back confundam o cliente.
     */
    discountValue: usesLoyalty ? Number(totals.loyaltyDiscount || 0) : 0, 

    // Valor teórico que o cliente ganharia se ativasse o switch agora
    potentialDiscount: validation.discount,
    
    minAmountRequired: settings?.minCartAmount || 0,
    settings,
    toggle: () => toggleLoyalty(!usesLoyalty),
    isLoading: cartLoading || settingsLoading,
    money 
  };
} 