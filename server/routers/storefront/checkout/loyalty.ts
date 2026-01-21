import { TRPCError } from "@trpc/server";
import { loyaltySettings } from "drizzle/schema/index.js";

/**
 * 💎 Carrega a configuração global de fidelidade.
 * tx: Instância de transação para garantir consistência.
 */
export async function loadLoyaltyConfig(tx: any) {
  const [cfg] = await tx.select().from(loyaltySettings).limit(1);

  // Fallback seguro caso a loja não tenha configurado o fidelidade ainda
  if (!cfg) {
    return {
      raw: null,
      enabled: false,
      earnPointsPerReal: 0,
      redeemPointsPerReal: 0,
      maxDiscountAllowed: 0,
      minCartToRedeem: 0,
    };
  }

  // No MySQL/Drizzle, campos booleanos costumam vir como 1 ou 0
  const enabled = Number(cfg.enabled ?? 0) === 1;

  /**
   * 📈 TAXA DE GANHO (Crédito)
   * Ex: Se conversion_rate_money = 1 e conversion_rate_points = 10 -> R$ 1,00 = 10 pontos.
   */
  const earnPointsPerReal =
    Number(cfg.conversion_rate_money || 0) > 0
      ? Number(cfg.conversion_rate_points || 0) / Number(cfg.conversion_rate_money)
      : 0;

  /**
   * 📉 TAXA DE RESGATE (Débito)
   * Ex: Se redemption_rate_points = 100 e redemption_rate_money = 1 -> 100 pontos = R$ 1,00.
   */
  const redeemPointsPerReal =
    Number(cfg.redemption_rate_money || 0) > 0
      ? Number(cfg.redemption_rate_points || 0) / Number(cfg.redemption_rate_money)
      : 0;

  return {
    raw: cfg,
    enabled,
    earnPointsPerReal,
    redeemPointsPerReal,
    maxDiscountAllowed: Number(cfg.max_discount_amount || cfg.maxDiscountAllowed || 0),
    minCartToRedeem: Number(cfg.min_cart_amount || cfg.minCartToRedeem || 0),
  };
}

/**
 * 🧮 Calcula matematicamente os pontos usados e ganhos.
 */
export function computeLoyalty(params: {
  cfg: any;
  details: any;
  useLoyaltyPoints: boolean;
  finalNet: number;
}) {
  const { cfg, details, useLoyaltyPoints, finalNet } = params;
  const {
    enabled,
    redeemPointsPerReal,
    earnPointsPerReal,
    maxDiscountAllowed,
    minCartToRedeem,
  } = cfg;

  // 1. Verificações de Elegibilidade
  // O carrinho precisa ter calculado um valor de loyalty e o usuário deve ter aceito usar
  const loyaltyActive = enabled && !!details?.loyalty?.active && !!useLoyaltyPoints;
  
  // O valor em Reais (R$) de desconto que o carrinho propôs
  let loyaltyValue = loyaltyActive ? Number(details?.loyalty?.value || 0) : 0;
  let pointsUsed = 0;

  if (loyaltyActive && loyaltyValue > 0) {
    // 2. Validação de Pedido Mínimo
    // Se o total da compra for menor que o mínimo configurado, ignora o desconto
    if (minCartToRedeem > 0 && finalNet < minCartToRedeem) {
      loyaltyValue = 0;
      pointsUsed = 0;
    } else {
      // 3. Aplicação de Limite Máximo de Desconto
      if (maxDiscountAllowed > 0 && loyaltyValue > maxDiscountAllowed) {
        loyaltyValue = maxDiscountAllowed;
      }

      // 4. Conversão: Reais -> Pontos
      pointsUsed = Math.round(loyaltyValue * redeemPointsPerReal);
    }
  }

  /**
   * 🎁 Pontos GANHOS (Cashback)
   * Sempre calculados sobre o total líquido (o que o cliente efetivamente pagou).
   * Usamos Math.floor para não dar pontos "quebrados" a favor do cliente (arredonda para baixo).
   */
  const pointsEarned =
    enabled && earnPointsPerReal > 0
      ? Math.max(0, Math.floor(finalNet * earnPointsPerReal))
      : 0;

  return { 
    loyaltyValue: Number(loyaltyValue.toFixed(2)), // Valor em R$ abatido
    pointsUsed,                                    // Qtd de pontos retirados do saldo
    pointsEarned                                   // Qtd de pontos que o cliente ganhará
  };
}