import { useMemo } from "react";
import { safeJsonParse, safeNumber } from "@/lib/safe-parse";

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
  settings?: LoyaltySettings,
) {
  return useMemo(() => {
    const currentSubtotal = safeNumber(subtotal);
    const currentPoints = safeNumber(userPoints);

    if (!settings) return { isValid: false, message: "Sincronizando...", discount: 0 };
    if (!settings.enabled) return { isValid: false, message: "Programa desativado", discount: 0 };

    const rawRules = settings.redemption_rules || settings.redemptionRules;
    const rules: RedemptionRule[] =
      typeof rawRules === "string"
        ? safeJsonParse<RedemptionRule[]>(rawRules, [])
        : Array.isArray(rawRules)
          ? rawRules
          : [];

    if (rules.length === 0) {
      return { isValid: false, message: "Configure as faixas no Admin.", discount: 0 };
    }

    const minCartAmount = safeNumber(settings.minCartAmount);

    if (currentSubtotal < minCartAmount) {
      return {
        isValid: false,
        message:
          settings.minOrderMessage ||
          `Minimo de R$ ${minCartAmount} para usar pontos.`,
        discount: 0,
      };
    }

    const sortedRules = [...rules].sort(
      (a, b) => safeNumber(b.minOrderValue) - safeNumber(a.minOrderValue),
    );
    const matchedRule = sortedRules.find(
      (rule) => currentSubtotal >= safeNumber(rule.minOrderValue),
    );

    if (!matchedRule) {
      const firstTier = [...rules].sort(
        (a, b) => safeNumber(a.minOrderValue) - safeNumber(b.minOrderValue),
      )[0];

      return {
        isValid: false,
        message: firstTier
          ? `Falta R$ ${(safeNumber(firstTier.minOrderValue) - currentSubtotal).toFixed(2)} para o cashback.`
          : "Valor insuficiente.",
        discount: 0,
      };
    }

    const ratePoints = safeNumber(settings.redemptionRatePoints, 1);
    const rateMoney = safeNumber(settings.redemptionRateMoney, 1);
    const pointsWorthMoney = (currentPoints / ratePoints) * rateMoney;
    const activeLimit = safeNumber(matchedRule.maxDiscount);
    const finalDiscount = Math.min(pointsWorthMoney, activeLimit);

    return {
      isValid: true,
      discount: finalDiscount,
      pointsToDeduct: (finalDiscount / rateMoney) * ratePoints,
      appliedRule: matchedRule,
      message: "Desconto liberado!",
      nextTier: sortedRules.find(
        (rule) => safeNumber(rule.minOrderValue) > currentSubtotal,
      ),
    };
  }, [subtotal, userPoints, settings]);
}
