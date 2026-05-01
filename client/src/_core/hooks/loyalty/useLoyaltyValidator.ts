import { useMemo } from "react";

export interface RedemptionRule {
  minOrderValue: number;
  maxDiscount: number;
}

export interface LoyaltySettings {
  enabled: boolean;
  minCartAmount: number;
  maxDiscountAmount: number;
  redemptionRatePoints: number;
  redemptionRateMoney: number;
  redemptionRules?: string | RedemptionRule[];
  redemption_rules?: string | RedemptionRule[]; 
  minOrderMessage?: string;
}

export function useLoyaltyValidator(
  subtotal: number,
  userPoints: number,
  settings?: LoyaltySettings
) {
  return useMemo(() => {
    // 1. Garante que subtotal e pontos sejam números limpos
    const currentSubtotal = Number(subtotal || 0);
    const currentPoints = Number(userPoints || 0);
    
    // 2. Se os settings ainda não carregaram, retornamos um estado de "espera" 
    // para não mostrar mensagens de erro precipitadas na UI da Gourmet Saudável
    if (!settings) return { isValid: false, message: "Sincronizando...", discount: 0 };
    if (!settings.enabled) return { isValid: false, message: "Programa desativado", discount: 0 };

    // 3. EXTRAÇÃO DINÂMICA (Pega do Drizzle: redemption_rules)
    const rawRules = settings.redemption_rules || settings.redemptionRules;
    let rules: RedemptionRule[] = [];

    if (rawRules) {
      try {
        rules = typeof rawRules === 'string' ? JSON.parse(rawRules) : (rawRules as RedemptionRule[]);
      } catch (e) {
        console.error("Erro no parse das regras:", e);
        rules = [];
      }
    }

    // 4. Bloqueio se não houver regras no banco
    if (!rules || rules.length === 0) {
      return { isValid: false, message: "Configure as faixas no Admin.", discount: 0 };
    }

    // 5. Validação de Pedido Mínimo Geral (Trava Global do Admin)
    if (currentSubtotal < Number(settings.minCartAmount)) {
      return { 
        isValid: false, 
        message: settings.minOrderMessage || `Mínimo de R$ ${settings.minCartAmount} para usar pontos.`, 
        discount: 0 
      };
    }

    // 6. Localização da Faixa (Busca no seu JSON)
    // Ordenamos do maior para o menor para garantir a melhor regra
    const sortedRules = [...rules].sort((a, b) => Number(b.minOrderValue) - Number(a.minOrderValue));
    const matchedRule = sortedRules.find(r => currentSubtotal >= Number(r.minOrderValue));

    // 7. Se o carrinho for muito baixo para a primeira faixa do JSON
    if (!matchedRule) {
      const firstTier = [...rules].sort((a, b) => Number(a.minOrderValue) - Number(b.minOrderValue))[0];
      return { 
        isValid: false, 
        message: firstTier 
          ? `Falta R$ ${(Number(firstTier.minOrderValue) - currentSubtotal).toFixed(2)} para o cashback.` 
          : "Valor insuficiente.",
        discount: 0 
      };
    }

    // 8. CÁLCULO FINANCEIRO
    // Valor real dos pontos
    const pointsWorthMoney = (currentPoints / Number(settings.redemptionRatePoints)) * Number(settings.redemptionRateMoney);
    
    // ✅ Limite vem APENAS da faixa — maxDiscountAmount global foi eliminado
    // A última faixa da tabela é o desconto máximo
    const activeLimit = Number(matchedRule.maxDiscount);
    
    // Desconto Final: Não pode ser maior que o saldo do cliente nem maior que o limite da faixa
    const finalDiscount = Math.min(pointsWorthMoney, activeLimit);

    return {
      isValid: true,
      discount: finalDiscount,
      pointsToDeduct: (finalDiscount / Number(settings.redemptionRateMoney)) * Number(settings.redemptionRatePoints),
      appliedRule: matchedRule,
      message: "Desconto liberado!",
      nextTier: sortedRules.find(r => Number(r.minOrderValue) > currentSubtotal)
    };
  }, [subtotal, userPoints, settings]);
}