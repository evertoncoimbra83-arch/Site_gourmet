import { useMemo, useEffect } from "react";
import { useCart } from "@/_core/CartContext";
import { useLocation } from "wouter";
import { useProgressiveDiscount } from "@/_core/hooks/useProgressiveDiscount";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/_core/trpc";

export function useCartPageLogic() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const cartContext = useCart();
  
  const { 
    items, 
    totals: contextTotals, 
    isLoading, 
    money,
    usesLoyalty,
    loyaltyPoints,
    removeItem,      
    updateQuantity,  
    toggleLoyalty,   
    cartId
  } = cartContext;

  // 🚀 Mutações de Cupom
  const applyCouponMutation = (trpc as any).cart.applyCoupon.useMutation();
  const removeCouponMutation = (trpc as any).cart.removeCoupon.useMutation();

  const totalQuantity = useMemo(
    () => items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0),
    [items]
  );
  
  const { tiers, currentTier } = useProgressiveDiscount({
    itemCount: totalQuantity,
  });

  // ✅ MONITOR DE SINCRONIA: Verifica a chegada do desconto de fidelidade
  useEffect(() => {
    if (Number(contextTotals?.loyaltyDiscount) > 0) {
      console.log("💎 [LOGIC] Fidelidade Recebida:", contextTotals.loyaltyDiscount);
    }
  }, [contextTotals?.loyaltyDiscount]);

  // ✅ TOTAIS CONSOLIDADOS (Sincronia Pura)
  const totals = useMemo(() => {
    // Pegamos os valores que o CartContext já tratou (que vieram do Logic.ts)
    const subtotal = Number(contextTotals?.subtotal || 0);
    const shipping = Number(contextTotals?.shipping || 0);
    const couponDiscount = Number(contextTotals?.couponDiscount || 0);
    const autoDiscount = Number(contextTotals?.autoDiscount || 0); 
    const loyaltyDiscount = Number(contextTotals?.loyaltyDiscount || 0);

    const totalDiscounts = couponDiscount + autoDiscount + loyaltyDiscount;

    // Recalculamos o final apenas para garantir integridade visual na View
    const calculatedTotal = Math.max(0, subtotal + shipping - totalDiscounts);

    return {
      subtotal,
      shipping,
      couponDiscount, 
      loyaltyDiscount,
      autoDiscount,
      totalDiscounts,
      total: Number(calculatedTotal.toFixed(2)),
      final: Number(calculatedTotal.toFixed(2)),
    };
  }, [contextTotals]);

  // ✅ INFORMAÇÕES DE EXIBIÇÃO
  const discountsInfo = useMemo(() => {
    return {
      autoDiscountName: currentTier?.name || "Desconto Progressivo",
      hasAutoDiscount: totals.autoDiscount > 0,
      coupon: {
        code: contextTotals?.couponCode || "", 
        description: contextTotals?.couponCode ? "Cupom aplicado com sucesso" : "",
      },
    };
  }, [contextTotals?.couponCode, currentTier, totals.autoDiscount]);

  // --- 🛠️ HANDLERS ---

  const handleToggleLoyalty = (checked: boolean) => {
    // Se o usuário tentar ativar e não tiver pontos, bloqueamos no front também
    if (checked && loyaltyPoints <= 0) {
      toast.error("Você não possui pontos para resgate.");
      return;
    }

    // Chama a função central do CartContext
    toggleLoyalty(checked);
    
    if (checked) {
      toast.success("Resgate de fidelidade aplicado!");
    } else {
      toast.info("Resgate removido.");
    }
  };

  const handleUpdateQuantity = async (itemId: string, qty: number) => {
    if (qty < 1) return handleRemoveItem(itemId);
    updateQuantity(itemId, qty);
  };

  const handleRemoveItem = async (itemId: string) => {
    removeItem(itemId);
  };

  const handleApplyCoupon = async (code: string) => {
    if (!code.trim() || !cartId) return;

    try {
      await applyCouponMutation.mutateAsync({ 
        code: code.trim().toUpperCase(),
        cartId: cartId 
      });
      // Invalida a query principal para forçar o logic.ts a rodar no servidor
      await utils.cart.getSummary.invalidate();
      toast.success(`Cupom aplicado!`);
    } catch (err: any) {
      toast.error(err.message || "Cupom inválido");
    }
  };

  const handleRemoveCoupon = async () => {
    if (!cartId) return;
    try {
      await removeCouponMutation.mutateAsync({ cartId });
      await utils.cart.getSummary.invalidate();
      toast.info("Cupom removido");
    } catch (err) {
      toast.error("Erro ao remover cupom");
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Sua sacola está vazia");
      return;
    }
    setLocation("/checkout");
  };

  return {
    items,
    totals,
    isLoading,
    usesLoyalty,
    loyaltyPoints: Number(loyaltyPoints || 0),
    money,
    allTiers: tiers,
    totalQuantity,
    discountsInfo,
    isCartEmpty: items.length === 0,
    handleApplyCoupon, 
    handleRemoveCoupon,
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    handleCheckout,
    toggleLoyalty: handleToggleLoyalty,
    cartId
  };
}