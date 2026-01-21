import { useMemo } from "react";
import { useCart } from "@/_core/CartContext";
import { trpc } from "@/_core/trpc"; 

/**
 * 💎 HOOK DE FIDELIDADE
 * Encapsula toda a inteligência de cálculo de pontos e descontos.
 */
export function useCartLoyalty() {
  const { 
    loyaltyPoints, 
    totals, 
    usesLoyalty, 
    toggleLoyalty,
    isLoading: cartLoading,
    money // Importante: pegamos do contexto para formatar mensagens aqui
  } = useCart();

  // Busca configurações globais (taxa de conversão, valor mínimo, etc)
  const { data: settings, isLoading: settingsLoading } = trpc.loyalty.getSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60000 
  });

  const loyaltyInfo = useMemo(() => {
    const s = settings as any;
    
    // 1. Sanitização dos valores vindos do Drizzle/MySQL (tratando vírgulas e nulos)
    const parse = (v: any) => v ? parseFloat(String(v).replace(',', '.')) : 0;

    const minAmountRequired = parse(s?.minCartAmount);
    const dbPointsReq = parse(s?.redemptionRatePoints) || 100; // Fallback para 100 se 0
    const dbMoneyVal = parse(s?.redemptionRateMoney) || 1;     // Fallback para 1 se 0
    const maxD = parse(s?.maxDiscountAmount);

    const subtotal = totals.subtotal || 0;
    
    // 2. Validações de Regra de Negócio
    const hasReachedMinAmount = subtotal >= minAmountRequired;
    const hasPoints = loyaltyPoints > 0;

    // 3. Cálculo do Desconto Potencial
    // Fórmula: (Meus Pontos / Pontos Exigidos) * Valor em Real
    let discountValue = (loyaltyPoints / dbPointsReq) * dbMoneyVal;

    // 4. Aplicação de Travas (Teto de desconto e Subtotal)
    if (maxD > 0 && discountValue > maxD) discountValue = maxD;
    discountValue = Math.min(subtotal, discountValue);

    // 5. Definição da Mensagem de Status (UX)
    let reason = "Você pode usar seus pontos!";
    if (!hasReachedMinAmount) {
      const missing = minAmountRequired - subtotal;
      reason = `Faltam ${money(missing)} para liberar o resgate.`;
    } else if (!hasPoints) {
      reason = "Você ainda não possui pontos para resgate.";
    }

    return {
      points: loyaltyPoints,
      isActive: usesLoyalty,
      canUse: hasReachedMinAmount && hasPoints,
      reason,
      // discountValue é o valor real aplicado, potential é quanto ele TEM disponível
      discountValue: usesLoyalty ? Number(discountValue.toFixed(2)) : 0, 
      potentialDiscount: Number(discountValue.toFixed(2)),
      minAmountRequired,
      settings: s
    };
  }, [loyaltyPoints, totals.subtotal, usesLoyalty, settings, money]);

  return {
    ...loyaltyInfo,
    toggle: () => toggleLoyalty(!usesLoyalty),
    isLoading: cartLoading || settingsLoading,
    money // ✅ Exportado para o componente não dar erro de "Property money does not exist"
  };
}