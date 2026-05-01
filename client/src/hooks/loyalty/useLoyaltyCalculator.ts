import { useMemo } from "react";

// ✅ Interface para as faixas dinâmicas de desconto
export interface RedemptionRule {
  minOrderValue: number;
  maxDiscount: number;
}

// ✅ Interface das configurações do programa de fidelidade
export interface LoyaltySettings {
  enabled: boolean;
  redemptionRatePoints: number;
  redemptionRateMoney: number;
  maxDiscountAmount: number; // Fallback para cálculo linear
  minCartAmount: number;
  redemptionRules?: RedemptionRule[]; // Faixas dinâmicas (JSON do banco)
}

export function useLoyaltyCalculator(
  availablePoints: number, 
  subtotal: number, 
  settings: LoyaltySettings | undefined
) {
  return useMemo(() => {
    // 1. Verificações iniciais de segurança
    if (!settings || !settings.enabled) {
      return { 
        canRedeem: false, 
        discountValue: 0, 
        pointsToUse: 0, 
        maxDiscountPossible: 0,
        pointValueUnit: 0,
        minRequired: 0,
        appliedLimit: 0,
        calculatePointsForValue: () => 0 
      };
    }

    // 2. Normalização e Definição da Taxa de Conversão (R$ por Ponto)
    const ratePoints = Math.max(1, Number(settings.redemptionRatePoints || 100));
    const rateMoney = Number(settings.redemptionRateMoney || 1);
    const pointValueUnit = rateMoney / ratePoints;

    // 3. ✅ Limite vem SEMPRE das faixas — maxDiscountAmount global foi eliminado
    // A última faixa (maior minOrderValue) representa o desconto máximo absoluto
    let limitFromRules = 0;
    const rules = settings.redemptionRules;

    if (Array.isArray(rules) && rules.length > 0) {
      // Ordenamos do maior para o menor e pegamos a primeira faixa atingida
      const applicableRule = [...rules]
        .sort((a, b) => Number(b.minOrderValue) - Number(a.minOrderValue))
        .find(rule => subtotal >= Number(rule.minOrderValue));

      if (applicableRule) {
        limitFromRules = Number(applicableRule.maxDiscount);
      } else {
        // Tem regras, mas o carrinho não atingiu nem a menor — bloqueia
        limitFromRules = 0;
      }
    } else {
      // Sem regras configuradas — sem limite (livre)
      limitFromRules = 9999;
    }

    // 4. Cálculo do Desconto Real Possível
    // Valor total que os pontos do cliente valem em dinheiro (Linear)
    const userPointsMoneyValue = Number(availablePoints || 0) * pointValueUnit;
    
    // O desconto máximo permitido é o menor entre: 
    // (Saldo do cliente) VS (Limite da Faixa/Fallback) VS (Subtotal do Pedido)
    const maxDiscountPossible = Math.max(0, Math.min(
      userPointsMoneyValue, 
      limitFromRules,
      subtotal
    ));

    // 5. Função Utilitária: Converte R$ em Pontos necessários
    const calculatePointsForValue = (valueInCash: number) => {
      if (valueInCash <= 0 || pointValueUnit === 0) return 0;
      return Math.ceil(valueInCash / pointValueUnit);
    };

    const minRequired = Number(settings.minCartAmount || 0);

    return {
      maxDiscountPossible: Number(maxDiscountPossible.toFixed(2)), // Garante precisão decimal
      calculatePointsForValue,
      // canRedeem indica se o pedido atingiu o mínimo global e se há pontos
      canRedeem: availablePoints > 0 && subtotal >= minRequired, 
      pointValueUnit,
      minRequired,
      appliedLimit: limitFromRules
    };
  }, [availablePoints, subtotal, settings]);
}