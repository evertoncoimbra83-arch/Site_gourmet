import { loyaltySettings } from "../../../../drizzle/schema/index.js";
import { MySqlTransaction } from "drizzle-orm/mysql-core";

// --- TIPAGENS ---
type LoyaltySettingsSelect = typeof loyaltySettings.$inferSelect;

export interface LoyaltyConfig {
  raw?: LoyaltySettingsSelect;
  enabled: boolean;
  redemptionRatePoints: number;
  redemptionRateMoney: number;
  earnPointsPerReal: number;
  maxDiscountAllowed: number;
  minCartToRedeem: number;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * 💎 Carrega a configuração global de fidelidade diretamente do DB.
 * Utilizamos 'any' nos genéricos da Transação pois os tipos internos do Drizzle (HKTs)
 * são complexos demais para serem tipados estritamente em funções utilitárias genéricas.
 */
export async function loadLoyaltyConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: MySqlTransaction<any, any, any, any>
): Promise<LoyaltyConfig> {
  const result = await tx.select().from(loyaltySettings).limit(1);
  const cfg = result[0] as LoyaltySettingsSelect | undefined;

  if (!cfg) {
    return {
      enabled: false,
      redemptionRatePoints: 100,
      redemptionRateMoney: 1,
      earnPointsPerReal: 0,
      maxDiscountAllowed: 0,
      minCartToRedeem: 0,
    };
  }

  // ✅ Comparação robusta para booleano ou numérico (tinyint)
  // Garante que funcione tanto com true/false quanto com 1/0 do MySQL
  const enabled = cfg.enabled === true || String(cfg.enabled) === "1" || toNumber(cfg.enabled) === 1;
  
  const redemptionRatePoints = toNumber(cfg.redemptionRatePoints, 100);
  const redemptionRateMoney = toNumber(cfg.redemptionRateMoney, 1);

  const earnPts = toNumber(cfg.conversionRatePoints);
  const earnMoney = toNumber(cfg.conversionRateMoney, 1);
  const earnPointsPerReal = earnMoney > 0 ? earnPts / earnMoney : 0;

  return {
    raw: cfg,
    enabled,
    redemptionRatePoints,
    redemptionRateMoney,
    earnPointsPerReal,
    maxDiscountAllowed: toNumber(cfg.maxDiscountAmount),
    minCartToRedeem: toNumber(cfg.minCartAmount),
  };
}

interface ComputeLoyaltyParams {
  cfg: LoyaltyConfig;
  details: {
    loyaltyDiscount?: number;
    totals?: {
      loyaltyDiscount?: number;
    };
  };
  useLoyaltyPoints: boolean;
  finalNet: number;
}

/**
 * 🧮 Calcula matematicamente os pontos baseando-se no valor final líquido pago.
 */
export function computeLoyalty(params: ComputeLoyaltyParams) {
  const { cfg, details, useLoyaltyPoints, finalNet } = params;
  const {
    enabled,
    redemptionRatePoints,
    redemptionRateMoney,
    earnPointsPerReal,
    minCartToRedeem,
  } = cfg;

  const discountInCash = toNumber(details?.loyaltyDiscount ?? details?.totals?.loyaltyDiscount);
  const loyaltyActive = enabled && (useLoyaltyPoints || discountInCash > 0);
  
  let loyaltyValueInCash = loyaltyActive ? discountInCash : 0;
  let pointsUsed = 0;

  if (loyaltyActive && loyaltyValueInCash > 0) {
    if (minCartToRedeem > 0 && finalNet < minCartToRedeem) {
      loyaltyValueInCash = 0;
      pointsUsed = 0;
    } else {
      // ✅ maxDiscountAllowed removido — o limite vem das faixas no frontend
      // O servidor confia no valor calculado pelo cliente (já respeitou as faixas)

      if (redemptionRateMoney > 0) {
        // Math.round previne erros de precisão float do JS
        pointsUsed = Math.round((loyaltyValueInCash / redemptionRateMoney) * redemptionRatePoints);
      }
    }
  }

  // 🎁 Ganho de Cashback
  const pointsEarned = enabled && earnPointsPerReal > 0
      ? Math.floor(finalNet * earnPointsPerReal)
      : 0;

  return { 
    loyaltyValue: toNumber(loyaltyValueInCash.toFixed(2)), 
    pointsUsed, 
    pointsEarned 
  };
}