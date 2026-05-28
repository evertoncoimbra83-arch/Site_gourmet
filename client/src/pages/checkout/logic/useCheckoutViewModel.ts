// client/src/pages/checkout/logic/useCheckoutViewModel.ts

import { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { useCheckoutStore } from "@/_core/store/useCheckoutStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { validateCPF } from "@/lib/utils";

import type { CheckoutViewModel, AddressItem } from "./CheckoutViewModel";
import { CheckoutService } from "./checkoutService";
import { formatMoney } from "./checkout-helpers";
import { useValidateShipping } from "./useValidateShipping";
import { extractCustomerData } from "@shared/domain/checkout/customer";

import { 
  calculateDiscountValue, 
  calculateGrandTotal,
  normalizeGourmetOptions 
} from "../../../../../shared/domain/math/pricing";

interface StoreSettings {
  pickupAddress?: string;
  pickupHours?: string;
  generalMinOrderAmount?: number | string;
}

interface PaymentMethod {
  id: string | number;
  name: string;
  discountPercentage?: number | string | null;
}

function useCheckoutStoreHydration() {
  const [hasHydrated, setHasHydrated] = useState(() =>
    useCheckoutStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const syncHydration = () => {
      setHasHydrated(useCheckoutStore.persist.hasHydrated());
    };

    syncHydration();

    const unsubscribeHydrate = useCheckoutStore.persist.onHydrate(() => {
      setHasHydrated(false);
    });
    const unsubscribeFinishHydration =
      useCheckoutStore.persist.onFinishHydration(() => {
        setHasHydrated(true);
      });

    return () => {
      unsubscribeHydrate();
      unsubscribeFinishHydration();
    };
  }, []);

  return hasHydrated;
}

export function useCheckoutViewModel(): CheckoutViewModel {
  const navigate = useNavigate();
  const cart = useCart();
  const store = useCheckoutStore();
  const { user: authUser, loading: authLoading } = useAuth();
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);
  const storeHydrated = useCheckoutStoreHydration();

  const { data: storeSettingsRaw } = trpc.public.getStoreSettings.useQuery();
  const { data: addrRaw, isLoading: addrLoading } = trpc.store.addresses.list.useQuery(undefined, { enabled: !!authUser });
  const { data: paymentsRaw } = trpc.store.paymentMethods.list.useQuery();

  const storeSettings = (storeSettingsRaw as StoreSettings) || {}; 
  const addresses = useMemo(() => (addrRaw as AddressItem[]) || [], [addrRaw]);
  const paymentMethods = useMemo(() => (paymentsRaw as unknown as PaymentMethod[]) || [], [paymentsRaw]);
  const customerData = useMemo(() => extractCustomerData(authUser), [authUser]);
  const cartSubtotal = Number(cart.totals?.subtotal || 0);

  const shippingValidation = useValidateShipping({
    selectedAddressId: store.selectedAddressId,
    selectedShippingType: store.selectedShippingType,
    subtotal: cartSubtotal,
    addresses,
  });

  const handleOrderSuccess = useCallback((orderId: string | number) => {
    const cleanOrderId = String(orderId);
    const completedCartId = cart.cartId ? String(cart.cartId) : "";
    const successUrl = `/sucesso?orderId=${encodeURIComponent(cleanOrderId)}${completedCartId ? `&cartId=${encodeURIComponent(completedCartId)}` : ""}`;

    setIsCompletingOrder(true);
    navigate(successUrl, {
      replace: true,
      state: { orderId: cleanOrderId, cartId: completedCartId || null },
    });

    setTimeout(() => {
      store.reset();
      cart.clearCart();
    }, 100);
  }, [cart, navigate, store]);

  const placeOrderMutation = trpc.store.checkout.placeOrder.useMutation({
    onSuccess: (res: { orderId?: string | number } | undefined) => {
      if (res?.orderId) handleOrderSuccess(res.orderId);
    },
    onError: (err) => {
      setIsCompletingOrder(false);
      toast.error(err.message || "Erro ao processar pedido");
    },
  });

  useEffect(() => {
    if (!storeHydrated) return;

    if (customerData && !addrLoading) {
      if (!store.customerName && customerData.name) store.setField("customerName" as never, customerData.name as never);
      if (!store.customerCpf && customerData.cpf) store.setField("customerCpf" as never, customerData.cpf as never);
      if (!store.customerPhone && customerData.phone) store.setField("customerPhone" as never, customerData.phone as never);
    }
  }, [customerData, store, addrLoading, storeHydrated]);

  const viewModel = useMemo((): CheckoutViewModel => {
    const selectedMethod = paymentMethods.find(p => String(p.id) === String(store.selectedPaymentId));
    const paymentDiscount = calculateDiscountValue(cartSubtotal, { 
      type: 'percentage', 
      value: Number(selectedMethod?.discountPercentage || 0) 
    });

    const shippingCost = store.selectedShippingType === "pickup" ? 0 : shippingValidation.shippingCost;
    const totalDiscounts = paymentDiscount + 
      Number(cart.totals?.loyaltyDiscount || 0) + 
      Number(cart.totals?.autoDiscount || 0) + 
      Number(cart.totals?.couponDiscount || 0);
    
    const finalTotal = calculateGrandTotal(cartSubtotal, shippingCost, totalDiscounts);
    const minAmount = shippingValidation.minOrderValue || Number(storeSettings.generalMinOrderAmount || 50);

    const isBelowMin = store.selectedShippingType === "delivery" && cartSubtotal < minAmount;
    const errorMessage = isBelowMin ? `Pedido mínimo: ${formatMoney(minAmount)}` : shippingValidation.isZipOutOfArea ? "CEP fora da área" : undefined;

    return {
      isLoading: !storeHydrated || authLoading || addrLoading,
      isSubmitting: placeOrderMutation.isPending || isCompletingOrder,
      currentStep: 1,
      customer: {
        name: store.customerName,
        cpf: store.customerCpf,
        phone: store.customerPhone,
        isCPFValid: validateCPF(store.customerCpf)
      },
      logistics: {
        type: store.selectedShippingType,
        addresses,
        selectedAddressId: store.selectedAddressId ? String(store.selectedAddressId) : null,
        shippingCost,
        shippingCostFormatted: formatMoney(shippingCost),
        canContinue: store.selectedShippingType === "pickup" || (shippingValidation.canContinue && !isBelowMin),
        errorMessage,
        canDeliver: !isBelowMin && !shippingValidation.isZipOutOfArea
      },
      payment: {
        methods: paymentMethods.map(p => ({
          id: String(p.id),
          name: p.name,
          discountLabel: p.discountPercentage ? `${p.discountPercentage}% OFF` : undefined
        })),
        selectedId: store.selectedPaymentId ? String(store.selectedPaymentId) : null
      },
      summary: {
        items: cart.items.map(item => {
          const opts = normalizeGourmetOptions(item.options) as Record<string, unknown>;
          
          return {
            id: String(item.id),
            name: item.name,
            quantity: item.quantity,
            displayPrice: item.price,
            priceFormatted: formatMoney(item.price * item.quantity),
            displaySize: (opts.size as Record<string, unknown>)?.name as string || null,
            isPackage: item.itemType === "package",
            packageMeals: (Array.isArray(opts.meals) ? opts.meals : []).map(m => {
              const meal = m as Record<string, unknown>;
              const accs = (Array.isArray(meal.accompaniments) ? meal.accompaniments : 
                            Array.isArray(meal.selectedAccompaniments) ? meal.selectedAccompaniments : 
                            []) as Record<string, unknown>[];

              return {
                dishName: String(meal.dishName || meal.label || "Marmita"),
                accompaniments: accs.map(a => String(a.name || a.label || ""))
              };
            }),
            accompaniments: (Array.isArray(opts.accompaniments) ? opts.accompaniments : [])
              .map(a => String((a as Record<string, unknown>).name || (a as Record<string, unknown>).label || ""))
          };
        }),
        subtotal: cartSubtotal,
        subtotalFormatted: formatMoney(cartSubtotal),
        discounts: [
          ...(cart.totals?.autoDiscount ? [{ label: "Combo", valueFormatted: `-${formatMoney(cart.totals.autoDiscount)}` }] : []),
          ...(paymentDiscount ? [{ label: `Desconto ${selectedMethod?.name || 'Pagamento'}`, valueFormatted: `-${formatMoney(paymentDiscount)}` }] : []),
          ...(cart.totals?.loyaltyDiscount ? [{ label: "Fidelidade", valueFormatted: `-${formatMoney(cart.totals.loyaltyDiscount)}` }] : []),
          ...(cart.totals?.couponDiscount ? [{ label: `Cupom ${cart.totals.couponCode || ''}`, valueFormatted: `-${formatMoney(cart.totals.couponDiscount)}` }] : [])
        ],
        total: finalTotal,
        totalFormatted: formatMoney(finalTotal),
        notes: store.notes,
        storeInfo: {
          address: storeSettings.pickupAddress || "Endereço da Loja",
          hours: storeSettings.pickupHours || "Horário Comercial"
        }
      },
      actions: {
        setField: (f, v) => store.setField(f as never, v as never),
        setShippingType: (t) => store.setField("selectedShippingType", t),
        setAddress: (id) => store.setField("selectedAddressId", id),
        setPayment: (id) => store.setField("selectedPaymentId", id),
        setNotes: (n) => store.setField("notes", n),
        placeOrder: async () => {
          if (!validateCPF(store.customerCpf)) {
            toast.warning("CPF inválido");
            return;
          }
          
          const payload = CheckoutService.preparePayload({
            cartId: cart.cartId || "",
            customerName: store.customerName,
            customerCpf: store.customerCpf,
            customerPhone: store.customerPhone,
            selectedPaymentId: store.selectedPaymentId || "",
            selectedShippingType: store.selectedShippingType,
            selectedAddressId: store.selectedAddressId,
            usesLoyalty: !!cart.usesLoyalty,
            notes: store.notes
          });
          
          await placeOrderMutation.mutateAsync(payload as never);
        }
      }
    };
  }, [cart, store, authUser, addresses, paymentMethods, storeSettings, authLoading, addrLoading, placeOrderMutation, isCompletingOrder, cartSubtotal, shippingValidation, handleOrderSuccess, storeHydrated]);

  return viewModel;
}
