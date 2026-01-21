import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/_core/CartContext";
import { 
  computePaymentDiscount, 
  formatMoney
} from "./checkout-helpers";
import { useCheckoutAuth } from "./useCheckoutAuth";

export type CheckoutVM = ReturnType<typeof useCheckoutLogic>;

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useCheckoutLogic() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const cart = useCart(); 

  // --- QUERIES ---
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery(undefined, { staleTime: 0, retry: false });
  const { data: settings } = trpc.addresses.getStoreSettings.useQuery();
  const { data: addressesList = [], isLoading: loadingAddresses } = trpc.addresses.list.useQuery(undefined, { enabled: !!user });
  const { data: rawPaymentMethods = [] } = trpc.paymentMethods.list.useQuery();
  
  // --- MUTATIONS ---
  const createAddressMutation = trpc.addresses.create.useMutation({
    onSuccess: () => {
      utils.addresses.list.invalidate();
      toast.success("Endereço cadastrado!");
    },
    onError: (err) => toast.error("Erro ao salvar endereço: " + err.message)
  });

  // --- NORMALIZAÇÃO DE FOTOS ---
  const paymentMethodsList = useMemo(() => {
    return rawPaymentMethods.map((method: any) => {
      let logo = method.brandLogoUrl || method.brand_logo_url;
      if (logo && !logo.startsWith("http")) {
        const cleanPath = logo.replace(/^\/+/, '').replace(/^uploads\//, '');
        logo = `${API_BASE_URL}/uploads/${cleanPath}`;
      }
      return { ...method, brandLogoUrl: logo };
    });
  }, [rawPaymentMethods]);

  const { 
    authState, authActions, customerName, setCustomerName, 
    customerCpf, setCustomerCpf, shippingPhone, setShippingPhone 
  } = useCheckoutAuth(user, utils);

  // --- ESTADOS ---
  const [notes, setNotes] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingType, setSelectedShippingType] = useState<"delivery" | "pickup">("delivery");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | number | null>(null);
  const [currentShippingCost, setCurrentShippingCost] = useState(0);
  const [isZipValid, setIsZipValid] = useState<boolean | null>(null);
  const [isValidatingZip, setIsValidatingZip] = useState(false);

  // --- ✅ REGRAS DA LOJA ---
  const storeSettings = useMemo(() => {
    const s = settings as any;
    return {
      minOrderAmount: parseFloat(String(s?.general_min_order_amount ?? s?.generalMinOrderAmount ?? 0).replace(',', '.')),
      minOrderMessage: s?.min_order_message || s?.minOrderMessage || null,
      pickupEnabled: Boolean(s?.pickup_enabled ?? s?.pickupEnabled ?? true),
      pickupLabel: s?.pickup_label || s?.pickupLabel || "Retirada no Local",
      pickupInstruction: s?.pickup_instruction || s?.pickupInstruction || "A retirada é programada pelo contato via whatsapp.",
      storeAddress: s?.store_address || s?.address || "Avenida Samuel Martins, 881 - Jundiaí/SP"
    };
  }, [settings]);

  // --- 💰 FINANCIALS (Sincronizado com CartContext) ---
  const financials = useMemo(() => {
    const t = cart.totals;
    return {
      subtotal: t.subtotal || 0,
      autoDiscount: t.autoDiscount || 0,
      couponDiscount: t.couponDiscount || 0,
      loyaltyDiscount: t.loyaltyDiscount || 0,
      total: t.total || 0,
      couponCode: t.couponCode || "",
      autoName: cart.autoDiscountName || ""
    };
  }, [cart.totals, cart.autoDiscountName]);

  const subtotal = financials.subtotal;
  const couponDiscount = financials.couponDiscount;
  const autoDiscount = financials.autoDiscount;
  const loyaltyDiscount = financials.loyaltyDiscount;

  const paymentDiscountAmount = useMemo(() =>
    computePaymentDiscount(paymentMethodsList, selectedPaymentId, subtotal),
    [paymentMethodsList, selectedPaymentId, subtotal]
  );

  const shippingCost = selectedShippingType === "pickup" ? 0 : currentShippingCost;

  // ✅ Cálculo Final do Checkout
  const finalTotal = useMemo(() => {
    const base = subtotal + shippingCost - (couponDiscount + autoDiscount + loyaltyDiscount) - paymentDiscountAmount;
    return Number(Math.max(0, base).toFixed(2));
  }, [subtotal, shippingCost, paymentDiscountAmount, couponDiscount, autoDiscount, loyaltyDiscount]);

  // --- 🛡️ REGRAS DE BLOQUEIO ---
  const { isDeliveryBlocked, isBelowMin, isZipOutOfArea } = useMemo(() => {
    const belowMin = subtotal > 0 && subtotal < storeSettings.minOrderAmount;
    const zipOut = isZipValid === false;

    return {
      isDeliveryBlocked: selectedShippingType === "delivery" && (belowMin || zipOut || isZipValid === null),
      isBelowMin: belowMin,
      isZipOutOfArea: zipOut,
    };
  }, [subtotal, storeSettings.minOrderAmount, isZipValid, selectedShippingType]);

  // --- ACTIONS ---
  const placeOrderMutation = (trpc as any).checkout.placeOrder.useMutation({
    onSuccess: (res: any) => {
      if (res?.orderId) {
        toast.success("Pedido realizado com sucesso!");
        cart.clearCart();
        utils.cart.getSummary.invalidate();
        setLocation(`/sucesso?orderId=${res.orderId}`);
      }
    },
    onError: (err: any) => toast.error(err.message || "Erro ao processar pedido."),
  });

  const handleAddressSelect = async (id: string) => {
    setSelectedAddressId(id);
    const addr = addressesList.find((a: any) => String(a.id) === String(id));
    if (!addr) return;
    
    setIsValidatingZip(true);
    try {
      const rule: any = await (utils as any).addresses.validateZipZone.fetch({
        zipCode: String(addr.zipCode || addr.zip_code || "").replace(/\D/g, ""),
      });
      const hasRule = !!(rule?.isValid || rule?.price || rule?.shippingCost);
      setIsZipValid(hasRule);
      setCurrentShippingCost(hasRule ? Number(rule?.price || rule?.shippingCost || 0) : 0);
    } catch {
      setIsZipValid(false);
    } finally {
      setIsValidatingZip(false);
    }
  };

  const handlePlaceOrder = () => {
    // Validações
    if (selectedShippingType === "delivery") {
      if (!selectedAddressId) return toast.warning("Selecione um endereço.");
      if (isBelowMin) {
        const msg = storeSettings.minOrderMessage || `Pedido mínimo: ${formatMoney(storeSettings.minOrderAmount)}`;
        return toast.error(msg);
      }
      if (isZipOutOfArea) return toast.error("CEP fora da área de entrega.");
    }

    if (!selectedPaymentId) return toast.warning("Selecione a forma de pagamento.");
    if (!cart.cartId) return toast.error("Sessão da sacola expirou. Recarregue a página.");

    const cleanCpf = String(customerCpf || "").replace(/\D/g, "");
    const cleanPhone = String(shippingPhone || "").replace(/\D/g, "");

    if (cleanCpf.length < 11) return toast.warning("CPF obrigatório.");
    if (cleanPhone.length < 10) return toast.warning("Telefone obrigatório.");

    const selectedAddress = addressesList.find(a => String(a.id) === String(selectedAddressId));

    // 🚀 Payload Corrigido para o Backend (Zod)
    placeOrderMutation.mutate({
      id: String(cart.cartId), // ✅ CORREÇÃO: O backend espera 'id' como string para o cartId
      userId: user?.id ? String(user.id) : null,
      subtotal: Number(subtotal.toFixed(2)),
      shippingCost: Number(shippingCost.toFixed(2)),
      // Soma total de todos os benefícios concedidos
      totalDiscount: Number((couponDiscount + autoDiscount + loyaltyDiscount + paymentDiscountAmount).toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
      paymentMethodId: Number(selectedPaymentId),
      shippingType: selectedShippingType,
      customerName: String(customerName || "").trim(),
      customerDocument: cleanCpf,
      customerPhone: cleanPhone,
      addressId: selectedShippingType === "pickup" ? null : selectedAddressId, 
      shippingAddress: selectedAddress ? `${selectedAddress.street}, ${selectedAddress.number}` : "Retirada",
      notes: notes || "",
      // Enviamos os itens mapeados para o formato que o banco de dados espera (tabela order_items)
      items: cart.items.map((item: any) => ({
        dishId: item.dishId ? Number(item.dishId) : null,
        packageId: item.packageId ? String(item.packageId) : null,
        quantity: Number(item.quantity),
        unitPrice: Number(item.price),
        options: item.options ? JSON.stringify(item.options) : null, // ✅ Garante que acompanhamentos vãos para o pedido
      }))
    } as any);
  };

  useEffect(() => {
    if (addressesList.length > 0 && selectedAddressId == null) {
      const defaultAddr = addressesList.find((a: any) => a.isDefault) || addressesList[0];
      if (defaultAddr?.id) handleAddressSelect(String(defaultAddr.id));
    }
  }, [addressesList]);

  return {
    state: authState,
    actions: authActions,
    user, authLoading, money: formatMoney,
    addressesList, loadingAddresses,
    selectedAddressId, handleAddressSelect, selectedShippingType,
    handleShippingTypeChange: setSelectedShippingType,
    customerName, setCustomerName, customerCpf, setCustomerCpf,
    isCPFValid: authState.isCPFValid,
    shippingPhone, setShippingPhone,
    notes, setNotes,
    subtotal, shippingCost,
    
    isDeliveryBlocked, isBelowMin, isZipOutOfArea,
    minOrderAmount: storeSettings.minOrderAmount,
    minOrderMessage: storeSettings.minOrderMessage,
    storeAddress: storeSettings.storeAddress,

    paymentMethods: paymentMethodsList,
    selectedPaymentMethod: selectedPaymentId,
    setSelectedPaymentMethod: setSelectedPaymentId,
    
    couponDiscount, 
    couponCode: financials.couponCode,
    autoDiscount, 
    autoDiscountName: financials.autoName,
    loyaltyDiscount, 
    paymentDiscountAmount,
    
    finalTotal, handlePlaceOrder,
    isSubmitting: placeOrderMutation.isPending,
    isValidatingZip,
    cart,

    createAddressMutation,
    
    pickupEnabled: storeSettings.pickupEnabled,
    pickupLabel: storeSettings.pickupLabel,
    pickupInstruction: storeSettings.pickupInstruction,
  };
}