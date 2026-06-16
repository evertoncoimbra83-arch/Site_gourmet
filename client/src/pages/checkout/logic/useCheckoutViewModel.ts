// client/src/pages/checkout/logic/useCheckoutViewModel.ts

import { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { useCheckoutStore } from "@/_core/store/useCheckoutStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { isValidCpf, normalizeCpf } from "@shared/domain/checkout/cpf";

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

  const handleOrderSuccess = useCallback((result: { orderId: string | number; publicAccessToken?: string | null }) => {
    const cleanOrderId = String(result.orderId);
    const token = result.publicAccessToken || "";
    const successUrl = `/sucesso?orderId=${encodeURIComponent(cleanOrderId)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

    setIsCompletingOrder(true);
    navigate(successUrl, { replace: true });

    setTimeout(() => {
      store.reset();
      cart.clearCart();
    }, 100);
  }, [cart, navigate, store]);

  const placeOrderMutation = trpc.store.checkout.placeOrder.useMutation({
    onSuccess: (res: { orderId?: string | number; publicAccessToken?: string | null } | undefined) => {
      if (res?.orderId) handleOrderSuccess({ orderId: res.orderId, publicAccessToken: res.publicAccessToken });
    },
    onError: (err) => {
      setIsCompletingOrder(false);
      toast.error(err.message || "Erro ao processar pedido");
    },
  });

  const isSubmitting = placeOrderMutation.isPending || isCompletingOrder;

  // Load manualZipCode from localStorage exactly once upon mount as a stable bridge
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCep = localStorage.getItem("cart-delivery-cep")?.replace(/\D/g, "");
      if (savedCep && !store.manualZipCode) {
        store.setField("manualZipCode", savedCep);
      }
    }
  }, []);

  const selectedAddress = useMemo(() =>
    addresses.find((a) => String(a.id) === String(store.selectedAddressId)),
    [addresses, store.selectedAddressId]
  );

  const currentZip = useMemo(() => {
    if (selectedAddress) {
      return selectedAddress.zipCode.replace(/\D/g, "");
    }
    return store.manualZipCode?.replace(/\D/g, "") || "";
  }, [selectedAddress, store.manualZipCode]);

  const shippingValidation = useValidateShipping({
    selectedAddressId: store.selectedAddressId,
    selectedShippingType: store.selectedShippingType,
    subtotal: cartSubtotal,
    addresses,
    isSubmitting,
    zipCode: currentZip,
  });

  useEffect(() => {
    if (!storeHydrated) return;

    if (customerData && !addrLoading) {
      if (!store.customerName && customerData.name) store.setField("customerName" as never, customerData.name as never);
      if (!store.customerCpf && isValidCpf(customerData.cpf)) {
        store.setField("customerCpf" as never, normalizeCpf(customerData.cpf) as never);
      }
      if (!store.customerPhone && customerData.phone) store.setField("customerPhone" as never, customerData.phone as never);
      if (!store.customerEmail && customerData.email) store.setField("customerEmail" as never, customerData.email as never);
    }
  }, [customerData, store, addrLoading, storeHydrated]);

  useEffect(() => {
    if (!storeHydrated || addrLoading) return;
    if (addresses.length > 0 && !store.selectedAddressId) {
      store.setField("selectedAddressId", String(addresses[0].id));
    }
  }, [addresses, storeHydrated, addrLoading, store.selectedAddressId, store]);

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

    const isBelowMinForDelivery = cartSubtotal > 0 && cartSubtotal < minAmount;
    const isBelowMin = store.selectedShippingType === "delivery" && isBelowMinForDelivery;
    const errorMessage = isBelowMin
      ? `Pedido mínimo: ${formatMoney(minAmount)}`
      : shippingValidation.isCityDenied
        ? "Cidade fora da área de entrega"
        : shippingValidation.isZipOutOfArea
          ? "CEP fora da área"
          : undefined;

    return {
      isLoading: !storeHydrated || authLoading || addrLoading,
      isSubmitting: placeOrderMutation.isPending || isCompletingOrder,
      currentStep: 1,
      session: {
        isReady: !!authUser?.id,
        isLoading: authLoading || (!!authUser && addrLoading),
        userId: authUser?.id ? String(authUser.id) : null,
      },
      customer: {
        name: store.customerName,
        cpf: normalizeCpf(store.customerCpf),
        phone: store.customerPhone,
        email: store.customerEmail,
        isCPFValid: isValidCpf(store.customerCpf)
      },
      logistics: {
        type: store.selectedShippingType,
        addresses,
        selectedAddressId: store.selectedAddressId ? String(store.selectedAddressId) : null,
        shippingCost,
        shippingCostFormatted: formatMoney(shippingCost),
        canContinue: store.selectedShippingType === "pickup" || (shippingValidation.canContinue && !isBelowMin),
        errorMessage,
        canDeliver: !isBelowMinForDelivery && !shippingValidation.isZipOutOfArea && (store.selectedShippingType === "pickup" || (!!currentZip && currentZip.length === 8)),
        minOrderValue: minAmount,
        isBelowMinForDelivery,
        shippingTypeManuallySelected: Boolean(store.shippingTypeManuallySelected),
        zipCode: currentZip
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
          const rawOptions = (item.options || {}) as Record<string, unknown>;
          const noAccMsg = typeof rawOptions.noAccompanimentsMessage === "string"
            ? rawOptions.noAccompanimentsMessage.trim()
            : "";

          return {
            id: String(item.id),
            name: item.name,
            quantity: item.quantity,
            displayPrice: item.price,
            priceFormatted: formatMoney(item.price * item.quantity),
            displaySize: (opts.size as Record<string, unknown>)?.name as string || null,
            isPackage: item.itemType === "package",
            hasNoAvailableAccompaniments: Boolean(rawOptions.hasNoAvailableAccompaniments && noAccMsg),
            noAccompanimentsMessage: noAccMsg || undefined,
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
        setShippingType: (t, options) => {
          store.setField("selectedShippingType", t);
          if (options?.manual !== false) {
            store.setField("shippingTypeManuallySelected", true);
          }
        },
        setAddress: (id) => store.setField("selectedAddressId", id),
        setPayment: (id) => store.setField("selectedPaymentId", id),
        setNotes: (n) => store.setField("notes", n),
        placeOrder: async () => {
          if (!isValidCpf(store.customerCpf)) {
            toast.warning("CPF inválido");
            return;
          }

          const payload = CheckoutService.preparePayload({
            cartId: cart.cartId || "",
            customerName: store.customerName,
            customerCpf: normalizeCpf(store.customerCpf),
            customerPhone: store.customerPhone,
            customerEmail: store.customerEmail,
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
  }, [cart, store, authUser, addresses, paymentMethods, storeSettings, authLoading, addrLoading, placeOrderMutation, isCompletingOrder, cartSubtotal, shippingValidation, handleOrderSuccess, storeHydrated, currentZip]);

  return viewModel;
}
