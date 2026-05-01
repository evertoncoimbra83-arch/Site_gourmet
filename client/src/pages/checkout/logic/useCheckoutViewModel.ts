// client/src/pages/checkout/logic/useCheckoutViewModel.ts

import { useMemo, useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { useCheckoutStore } from "@/_core/store/useCheckoutStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { validateCPF } from "@/lib/utils";

import type { CheckoutViewModel, AddressItem, CheckoutCartItem } from "./CheckoutViewModel";
import { CheckoutService } from "./checkoutService";
import { formatMoney, computeDeliveryStatus } from "./checkout-helpers";
import { useValidateShipping } from "./useValidateShipping";
import { extractCustomerData } from "@shared/domain/checkout/customer";

import { 
  calculateDiscountValue, 
  calculateGrandTotal,
  normalizeGourmetOptions 
} from "../../../../../shared/domain/math/pricing";

interface PaymentMethod {
  id: string | number;
  name: string;
  discountPercentage?: number | string | null;
}

interface StoreSettings {
  generalMinOrderAmount?: number | string;
  pickupAddress?: string;
  pickupHours?: string;
}

interface OrderResponse {
  orderId?: string | number;
}

interface RawAcc {
  name?: string;
  label?: string;
}

interface RawMeal {
  dishName?: string;
  label?: string;
  accompaniments?: RawAcc[];
  selectedAccompaniments?: RawAcc[];
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useCheckoutViewModel(): CheckoutViewModel {
  const navigate = useNavigate();
  const cart = useCart();
  const store = useCheckoutStore();
  const { user: authUser, loading: authLoading } = useAuth();
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  const { data: storeSettingsRaw } = trpc.public.getStoreSettings.useQuery();
  const { data: addrRaw, isLoading: addrLoading } = trpc.store.addresses.list.useQuery(undefined, { enabled: !!authUser });
  const { data: paymentsRaw } = trpc.store.paymentMethods.list.useQuery();

  const storeSettings = (storeSettingsRaw as StoreSettings) || {}; 
  const addresses = useMemo(() => (addrRaw as AddressItem[]) || [], [addrRaw]);
  const paymentMethods = useMemo(() => (paymentsRaw as unknown as PaymentMethod[]) || [], [paymentsRaw]);
  const customerData = useMemo(() => extractCustomerData(authUser), [authUser]);
  const cartSubtotal = toNumber(cart.totals?.subtotal);
  const shippingValidation = useValidateShipping({
    selectedAddressId: store.selectedAddressId,
    selectedShippingType: store.selectedShippingType,
    subtotal: cartSubtotal,
    addresses,
  });

  const placeOrderMutation = trpc.store.checkout.placeOrder.useMutation({
    onSuccess: (res: unknown) => {
      const data = res as OrderResponse; 
      const orderId = data?.orderId;
      if (orderId) {
        const cleanOrderId = String(orderId);
        const completedCartId = cart.cartId ? String(cart.cartId) : "";
        const successUrl =
          `/sucesso?orderId=${encodeURIComponent(cleanOrderId)}` +
          (completedCartId ? `&cartId=${encodeURIComponent(completedCartId)}` : "");

        setIsCompletingOrder(true);
        navigate(successUrl, {
          replace: true,
          state: { orderId: cleanOrderId, cartId: completedCartId || null },
        });

        window.setTimeout(() => {
          store.reset();
          cart.clearCart();
        }, 0);
      }
    },
    onError: (err) => {
      setIsCompletingOrder(false);
      toast.error(err.message || "Erro ao processar pedido");
    },
  });

  useEffect(() => {
    if (customerData) {
      if (!store.customerName && customerData.name) store.setField("customerName", customerData.name as never);
      if (!store.customerCpf && customerData.cpf) store.setField("customerCpf", customerData.cpf as never);
      if (!store.customerPhone && customerData.phone) store.setField("customerPhone", customerData.phone as never);
    }
  }, [customerData, store]);

  useEffect(() => {
    if (!addrLoading && addresses.length > 0 && !store.selectedAddressId) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      store.setField("selectedAddressId", String(def.id) as never);
    }
  }, [addresses, addrLoading, store]);

  const viewModel = useMemo((): CheckoutViewModel => {
    const subtotal = cartSubtotal;
    const selectedMethod = paymentMethods.find(p => String(p.id) === String(store.selectedPaymentId));

    const paymentDiscount = calculateDiscountValue(subtotal, { 
      type: 'percentage', 
      value: toNumber(selectedMethod?.discountPercentage) 
    });

    const shippingCost = store.selectedShippingType === "pickup" ? 0 : shippingValidation.shippingCost;

    const totalDiscounts = paymentDiscount + toNumber(cart.totals?.loyaltyDiscount) + toNumber(cart.totals?.autoDiscount) + toNumber(cart.totals?.couponDiscount);
    
    const finalTotal = calculateGrandTotal(subtotal, shippingCost, totalDiscounts);

    const MIN_ORDER_VALUE = shippingValidation.minOrderValue > 0
      ? shippingValidation.minOrderValue
      : toNumber(storeSettings.generalMinOrderAmount, 50);

    const deliveryStatus = computeDeliveryStatus({
      subtotal,
      minOrderAmount: MIN_ORDER_VALUE,
      isZipValid:
        store.selectedShippingType === "pickup"
          ? true
          : shippingValidation.isLoading
            ? null
            : !shippingValidation.isZipOutOfArea && !shippingValidation.isCityDenied,
      selectedShippingType: store.selectedShippingType
    });

    const isBelowMinManual = store.selectedShippingType === "delivery" && subtotal < MIN_ORDER_VALUE;
    const isBelowMin = deliveryStatus.isBelowMin || isBelowMinManual;
    const isDeliveryBlocked = deliveryStatus.isDeliveryBlocked || isBelowMinManual;

    let errorMessage: string | undefined = undefined;
    if (isDeliveryBlocked) {
      if (isBelowMin) errorMessage = `Pedido mínimo para entrega é ${formatMoney(MIN_ORDER_VALUE)}`;
      else if (deliveryStatus.isZipOutOfArea) errorMessage = "Entrega indisponível para este CEP, escolha retirada ou outro endereço.";
      else errorMessage = "Entrega indisponível para este pedido";
    }

    const checkoutItems: CheckoutCartItem[] = cart.items.map(item => {
      const opts = normalizeGourmetOptions(item.options);
      const rawOptions = item.options as Record<string, unknown>;
      const selectedAccs = Array.isArray(rawOptions?.selectedAccs) ? rawOptions.selectedAccs as RawAcc[] : [];
      const normAccs = Array.isArray(opts.accompaniments) ? opts.accompaniments as RawAcc[] : [];
      const rawAccs = normAccs.length > 0 ? normAccs : selectedAccs;

      return {
        id: String(item.id),
        name: item.name,
        quantity: item.quantity,
        displayPrice: item.price,
        priceFormatted: formatMoney(item.price * item.quantity),
        displaySize: opts.size?.name || null,
        isPackage: item.itemType === "package",
        packageMeals: (opts.meals || []).map((m: unknown) => {
          const meal = m as RawMeal;
          const mealAccs = meal.accompaniments || meal.selectedAccompaniments || [];
          return {
            dishName: meal.dishName || meal.label || "Marmita",
            accompaniments: mealAccs.map(a => String(a.name || a.label || ""))
          };
        }),
        accompaniments: rawAccs.map(a => String(a.name || a.label || ""))
      };
    });

    return {
      isLoading: authLoading || addrLoading,
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
        canContinue: store.selectedShippingType === "pickup" ? true : shippingValidation.canContinue && !isDeliveryBlocked,
        errorMessage,
        canDeliver: !isBelowMin && !deliveryStatus.isZipOutOfArea && !shippingValidation.isCityDenied
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
        items: checkoutItems,
        subtotal,
        subtotalFormatted: formatMoney(subtotal),
        discounts: [
          ...(cart.totals?.autoDiscount ? [{ label: "Combo", valueFormatted: `-${formatMoney(cart.totals.autoDiscount)}` }] : []),
          ...(paymentDiscount ? [{ label: `Desconto ${selectedMethod?.name}`, valueFormatted: `-${formatMoney(paymentDiscount)}` }] : []),
          ...(cart.totals?.loyaltyDiscount ? [{ label: "Fidelidade", valueFormatted: `-${formatMoney(cart.totals.loyaltyDiscount)}` }] : []),
          // ✅ Cupom aplicado no carrinho
          ...(cart.totals?.couponDiscount && !cart.totals?.couponError
            ? [{ label: cart.totals.couponCode ? `Cupom ${cart.totals.couponCode}` : "Cupom", valueFormatted: `-${formatMoney(cart.totals.couponDiscount)}` }]
            : [])
        ],
        total: finalTotal,
        totalFormatted: formatMoney(finalTotal),
        notes: store.notes,
        storeInfo: {
          address: storeSettings.pickupAddress || "Avenida Samuel Martins, 881 - Vila Progresso, Jundiaí - SP",
          hours: storeSettings.pickupHours
        }
      },
      actions: {
        setField: (f: string, v: string | number | boolean | null) => store.setField(f as never, v as never),
        setShippingType: (t: "delivery" | "pickup") => store.setField("selectedShippingType", t),
        setAddress: (id: string) => store.setField("selectedAddressId", id),
        setPayment: (id: string) => store.setField("selectedPaymentId", id),
        setNotes: (n: string) => store.setField("notes", n),
        placeOrder: async () => {
          if (isDeliveryBlocked && store.selectedShippingType === "delivery") {
            toast.error(errorMessage || "Opção de entrega inválida.");
            return;
          }

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
            shippingCost,
            cartDiscounts: toNumber(cart.totals?.autoDiscount) + toNumber(cart.totals?.couponDiscount),
            paymentDiscount,
            loyaltyDiscount: toNumber(cart.totals?.loyaltyDiscount),
            usesLoyalty: !!cart.usesLoyalty,
            finalTotal,
            notes: store.notes
          });
          
          placeOrderMutation.mutate(payload as never);
        }
      }
    };
  }, [cart, store, authUser, addresses, paymentMethods, storeSettings, authLoading, addrLoading, placeOrderMutation, isCompletingOrder, cartSubtotal, shippingValidation]);

  return viewModel;
}