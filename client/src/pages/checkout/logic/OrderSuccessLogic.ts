import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/_core/CartContext";

export type CheckoutVM = ReturnType<typeof useCheckoutLogic>;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useCheckoutLogic() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const cart = useCart();

  const [isZipValid, setIsZipValid] = useState<boolean | null>(null);

  // --- AUTH / USER ---
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery(
    undefined,
    { staleTime: 0, retry: false }
  );

  // --- CONSULTAS ---
  const { data: settings } = trpc.addresses.getStoreSettings.useQuery();
  const { data: addressesList = [], isLoading: loadingAddresses } = trpc.addresses.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: rawPaymentMethods = [] } = trpc.paymentMethods.list.useQuery();
  
  const paymentMethodsList = useMemo(() => {
    return rawPaymentMethods.map((method: any) => {
      let logoUrl = method.brand_logo_url || method.brandLogoUrl;
      if (logoUrl && !logoUrl.startsWith('http')) {
        const cleanPath = logoUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
        logoUrl = `${API_URL}/uploads/${cleanPath}`;
      }
      return { ...method, brandLogoUrl: logoUrl };
    });
  }, [rawPaymentMethods]);

  // --- ESTADOS LOCAIS ---
  const [customerName, setCustomerName] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingType, setSelectedShippingType] = useState<"delivery" | "pickup">("delivery");
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [currentShippingCost, setCurrentShippingCost] = useState(0);

  // --- HELPERS ---
  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const minOrderAmount = useMemo(() => Number(settings?.generalMinOrderAmount || 0), [settings]);
  
  // ✅ TOTAIS SINCRONIZADOS
  const cartTotals = cart.totals; 
  const subtotal = cartTotals.subtotal;
  const shippingCost = selectedShippingType === "pickup" ? 0 : currentShippingCost;
  
  // O total final soma o total calculado do carrinho (com descontos) + o frete calculado no checkout
  const finalTotal = Math.max(0, cartTotals.total + shippingCost);

  // --- REGRAS DE ENTREGA ---
  const { isDeliveryBlocked, isBelowMin, isZipOutOfArea } = useMemo(() => {
    const belowMin = subtotal > 0 && subtotal < minOrderAmount;
    const zipOut = isZipValid === false;
    return {
      isDeliveryBlocked: selectedShippingType === "delivery" && (belowMin || zipOut),
      isBelowMin: belowMin,
      isZipOutOfArea: zipOut,
    };
  }, [subtotal, minOrderAmount, isZipValid, selectedShippingType]);

  const isCPFValid = useMemo(() => (customerCpf || "").replace(/\D/g, "").length === 11, [customerCpf]);

  // --- MUTATIONS ---
  const placeOrderMutation = (trpc as any).checkout.placeOrder.useMutation({
    onSuccess: (res: any) => {
      toast.success("Pedido realizado com sucesso!");
      cart.clearCart(); 
      setLocation(`/sucesso?orderId=${res.orderId}`);
    },
    onError: (err: any) => {
      console.error("Erro no Checkout:", err);
      toast.error(err.message || "Erro ao processar pedido.");
    }
  });

  // --- SINCRONIZAÇÃO PERFIL ---
  useEffect(() => {
    if (user) {
      const u = user as any;
      setCustomerName((prev) => prev || u.name || "");
      setCustomerCpf((prev) => prev || u.customerDocument || u.document || u.cpf || "");
      setShippingPhone((prev) => prev || u.phone || "");
    }
  }, [user]);

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    const addr: any = addressesList.find((a: any) => String(a.id) === String(id));
    if (!addr) return;

    const cleanZip = String(addr.zipCode || addr.zip_code || "").replace(/\D/g, "");

    utils.addresses.validateZipZone
      .fetch({ zipCode: cleanZip })
      .then((rule: any) => {
        const hasRule = !!(rule?.isValid || rule?.is_valid || rule?.zoneId);
        setIsZipValid(hasRule);
        const cost = rule?.shippingCost || rule?.shipping_cost || rule?.price || 0;
        setCurrentShippingCost(hasRule ? Number(cost) : 0);
        if (!hasRule) {
          setSelectedShippingType("pickup");
          toast.warning("Região não atendida para entrega.");
        }
      });
  };

  useEffect(() => {
    if (addressesList.length > 0 && !selectedAddressId) {
      const defaultAddr = (addressesList as any[]).find((a) => a.isDefault) || addressesList[0];
      if (defaultAddr) handleAddressSelect(String(defaultAddr.id));
    }
  }, [addressesList]);

  // --- FINALIZAR PEDIDO ---
  const handlePlaceOrder = () => {
    // Validações Iniciais
    if (selectedShippingType === "delivery" && isDeliveryBlocked) {
      if (isZipOutOfArea) return toast.error("Região não atendida para entrega.");
      if (isBelowMin) return toast.error(`Mínimo para entrega: ${money(minOrderAmount)}`);
    }

    if (selectedShippingType === "delivery" && !selectedAddressId) return toast.warning("Selecione um endereço.");
    if (!selectedPaymentId) return toast.warning("Selecione a forma de pagamento.");
    if (!isCPFValid) return toast.warning("CPF inválido.");
    if (!cart.cartId) return toast.error("Carrinho não encontrado. Tente recarregar a página.");

    // 🚀 Payload Corrigido para evitar Erro de Zod no Backend
    placeOrderMutation.mutate({
      id: cart.cartId, // ✅ Corrigido: Backend espera 'id' (string) para o cartId
      paymentMethodId: Number(selectedPaymentId),
      shippingType: selectedShippingType,
      addressId: selectedShippingType === "pickup" ? null : selectedAddressId,
      notes: notes || "",
      customerDocument: customerCpf.replace(/\D/g, ""),
      customerName: customerName.trim(),
      customerPhone: shippingPhone.replace(/\D/g, ""),
      shippingCost: Number(shippingCost.toFixed(2)),
      discountAmount: Number((cartTotals.couponDiscount + cartTotals.autoDiscount).toFixed(2)),
      loyaltyDiscount: Number(cartTotals.loyaltyDiscount.toFixed(2)),
      useLoyaltyPoints: !!cart.usesLoyalty,
      totalAmount: Number(finalTotal.toFixed(2))
    } as any);
  };

  return {
    user, authLoading, money, addressesList, loadingAddresses,
    selectedAddressId, handleAddressSelect, selectedShippingType,
    handleShippingTypeChange: setSelectedShippingType,
    customerName, setCustomerName, customerCpf, setCustomerCpf,
    isCPFValid, shippingPhone, setShippingPhone, notes, setNotes,
    subtotal, shippingCost, isDeliveryBlocked, isBelowMin, isZipOutOfArea,
    minOrderAmount, paymentMethods: paymentMethodsList,
    selectedPaymentMethod: selectedPaymentId,
    setSelectedPaymentMethod: setSelectedPaymentId,
    finalTotal, handlePlaceOrder,
    isSubmitting: placeOrderMutation.isPending,
    cart,
  };
}