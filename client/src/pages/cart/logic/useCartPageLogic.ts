// client\src\pages\cart\logic\useCartPageLogic.ts

import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, LocalCartItem } from "@/_core/CartContext";
import { useProgressiveDiscount } from "@/_core/hooks/useProgressiveDiscount";
import { appToast as toast } from "@/lib/app-toast";
import { trpc } from "@/_core/trpc";
import { useLoyaltyValidator, LoyaltySettings } from "@/_core/hooks/loyalty/useLoyaltyValidator";

/* --------------------------------- TYPES ---------------------------------- */

// ✅ Interface para descrever os metadados do cupom vindos do servidor
interface CouponStyling {
  couponDescription?: string;
  couponBannerColor?: string;
  couponLogoUrl?: string;
  couponCode?: string;
  couponDiscount?: number | string;
  couponError?: string | null;
  subtotal?: number | string;
  shipping?: number | string;
  autoDiscount?: number | string;
  loyaltyDiscount?: number | string;
  totalDiscounts?: number | string;
  total?: number | string;
}

interface CouponError {
  message: string;
}

interface LoyaltyUtilsProxy {
  getUserBalance?: {
    invalidate: () => Promise<void>;
  };
}

interface TrpcUtilsProxy {
  store?: {
    loyalty?: LoyaltyUtilsProxy;
  };
  loyalty?: LoyaltyUtilsProxy;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value: number): number {
  return toNumber(value.toFixed(2));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLoyaltySettings(value: unknown): LoyaltySettings | undefined {
  if (!isRecord(value)) return undefined;

  return {
    enabled: value.enabled === true || String(value.enabled) === "1",
    minCartAmount: toNumber(value.minCartAmount),
    maxDiscountAmount: toNumber(value.maxDiscountAmount),
    redemptionRatePoints: toNumber(value.redemptionRatePoints),
    redemptionRateMoney: toNumber(value.redemptionRateMoney),
    redemptionRules:
      typeof value.redemptionRules === "string" || Array.isArray(value.redemptionRules)
        ? value.redemptionRules
        : undefined,
    redemption_rules:
      typeof value.redemption_rules === "string" || Array.isArray(value.redemption_rules)
        ? value.redemption_rules
        : undefined,
    minOrderMessage:
      typeof value.minOrderMessage === "string" ? value.minOrderMessage : undefined,
  };
}

/* --------------------------------- LOGIC ---------------------------------- */

export function useCartPageLogic() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const cartContext = useCart();

  const applyCouponMutation = trpc.cart.applyCoupon.useMutation();
  const removeCouponMutation = trpc.cart.removeCoupon.useMutation();

  const {
    items = [],
    totals: contextTotals,
    isLoading,
    money,
    usesLoyalty,
    loyaltyPoints,
    loyaltySettings,
    removeItem,
    updateQuantity,
    toggleLoyalty: toggleLoyaltyFromContext,
    cartId,
    refreshCart,
  } = cartContext;

  // 🚀 LÓGICA DE FIDELIDADE CENTRALIZADA
  const loyaltyValidation = useLoyaltyValidator(
    toNumber(contextTotals?.subtotal),
    toNumber(loyaltyPoints),
    normalizeLoyaltySettings(loyaltySettings)
  );

  // --- 📊 MEMOS DE TOTAIS ---
  const totalQuantity = useMemo(
    () => items.reduce((acc: number, item: LocalCartItem) => acc + toNumber(item.quantity), 0),
    [items]
  );

  const { tiers, currentTier } = useProgressiveDiscount({ itemCount: totalQuantity });

  const totals = useMemo(() => {
    const styling: CouponStyling = contextTotals;

    const subtotal = toNumber(styling.subtotal);
    const shipping = toNumber(styling.shipping);
    const autoDiscount = toNumber(styling.autoDiscount);
    const loyaltyDiscount = toNumber(styling.loyaltyDiscount);
    const couponError = styling?.couponError;
    const couponDiscount = couponError ? 0 : toNumber(styling.couponDiscount);
    const totalDiscounts =
      toNumber(styling.totalDiscounts) || couponDiscount + autoDiscount + loyaltyDiscount;

    const calculatedTotal = Math.max(0, subtotal + shipping - totalDiscounts);
    const total = toNumber(styling.total, calculatedTotal);
    
    return {
      subtotal,
      shipping,
      couponDiscount,
      loyaltyDiscount,
      autoDiscount,
      totalDiscounts,
      couponError,
      total: roundMoney(total),
      final: roundMoney(total),
      couponCode: styling?.couponCode,
      // ✅ Propriedades agora tipadas via CouponStyling
      couponDescription: styling?.couponDescription,
      couponBannerColor: styling?.couponBannerColor,
      couponLogoUrl: styling?.couponLogoUrl,
    };
  }, [contextTotals]);

  const discountsInfo = useMemo(() => {
    return {
      autoDiscountName: (currentTier as { name?: string })?.name || "Desconto Progressivo",
      coupon: {
        code: totals.couponCode,
        description: totals.couponDescription,
        bannerColor: totals.couponBannerColor,
        logoUrl: totals.couponLogoUrl,
        hasError: !!totals.couponError,
      }
    };
  }, [currentTier, totals]);

  // --- 🛠️ HANDLERS ---
  const invalidateAll = useCallback(async () => {
    if (refreshCart) await refreshCart();
    
    const safeUtils = utils as unknown as TrpcUtilsProxy;
    const loyaltyUtils = safeUtils.store?.loyalty || safeUtils.loyalty;
    
    if (loyaltyUtils?.getUserBalance) {
      await loyaltyUtils.getUserBalance.invalidate();
    }
  }, [refreshCart, utils]);

  const handleApplyCoupon = useCallback(async (code: string) => {
    if (!cartId || !code.trim()) return;
    try {
      await applyCouponMutation.mutateAsync({ code: code.trim().toUpperCase(), cartId });
      await invalidateAll();
      toast.success("Cupom aplicado!");
    } catch (err) {
      const error = err as CouponError;
      toast.error(error.message || "Erro ao aplicar cupom");
    }
  }, [cartId, applyCouponMutation, invalidateAll]);

  const handleRemoveCoupon = useCallback(async () => {
    if (!cartId) return;
    try {
      await removeCouponMutation.mutateAsync({ cartId });
      await invalidateAll();
      toast.info("Cupom removido");
    } catch {
      toast.error("Erro ao remover cupom");
    }
  }, [cartId, removeCouponMutation, invalidateAll]);

  const handleRemoveItem = useCallback(async (id: string) => {
    try {
      await removeItem(id);
      await invalidateAll();
    } catch {
      // O feedback de erro fica centralizado no CartContext.
    }
  }, [removeItem, invalidateAll]);

  const handleUpdateQuantity = useCallback(async (id: string, qty: number) => {
    try {
      await updateQuantity(id, qty);
      await invalidateAll();
    } catch {
      // O feedback de erro fica centralizado no CartContext.
    }
  }, [updateQuantity, invalidateAll]);

  const handleToggleLoyalty = useCallback((checked: boolean) => {
    if (!checked) {
      toggleLoyaltyFromContext(false);
      return;
    }
    
    if (!loyaltyValidation.isValid) {
      return toast.error(loyaltyValidation.message || "Não foi possível aplicar o desconto.");
    }

    toggleLoyaltyFromContext(true);
    toast.success("Desconto de fidelidade aplicado!");
  }, [toggleLoyaltyFromContext, loyaltyValidation]);

  return {
    items,
    totals,
    isLoading,
    usesLoyalty,
    loyaltyPoints: toNumber(loyaltyPoints),
    loyaltyMoneyValue: loyaltyValidation.discount, 
    loyaltySettings,
    money,
    allTiers: tiers,
    totalQuantity,
    discountsInfo, 
    isCartEmpty: items.length === 0,
    handleApplyCoupon, 
    handleRemoveCoupon, 
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    handleCheckout: () => navigate("/finalizar-pedido"),
    toggleLoyalty: handleToggleLoyalty,
    cartId,
  };
}
