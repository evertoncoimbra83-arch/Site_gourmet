// client/src/pages/adminOrders/logic/useAdminOrderWizard.ts

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { trpc } from "@/_core/trpc";

// --- INTERFACES ---
interface OrderItem {
  id?: string;
  dishId?: string;
  unitPrice: number | string;
  quantity: number;
  [key: string]: unknown;
}

interface OrderAddress {
  shipping_address: string;
  shipping_address_number: string;
  shipping_neighborhood: string;
  shipping_address_complement?: string;
  shipping_city: string;
  shipping_state: string;
  zipCode: string;
}

interface OrderCustomer {
  id: string;
  name: string;
  phone?: string;
  availablePoints?: number;
  address?: OrderAddress;
}

interface OrderData {
  customer: OrderCustomer | null;
  deliveryMode: 'delivery' | 'pickup' | 'walk_in';
  address: OrderAddress | null;
  items: OrderItem[];
  deliveryFee: number;
  discountValue: number;
  paymentMethod: string;
  paymentStatus: string;
  notes: string;
  couponCode: string | null;
  couponValue: number;
  loyaltyPointsUsed: number;
  loyaltyValue: number;
  paymentDiscountValue: number;
  discountSource: string | null;
  editingOrderId: string | null;
  orderDate?: string;
  metadataJson: string;
}

interface OrderDraft {
  id: string;
  items?: OrderItem[];
  metadataJson?: string | null;
  shippingValue?: string | number;
  discountValue?: string | number;
}

interface MetadataShape extends Partial<OrderData> {
  currentStep?: number;
}

interface PaymentMethod {
  id: string | number;
  label: string;
  discountPercentage?: string | number;
  discount_percentage?: string | number;
}

// ✅ CORREÇÃO ESLint: Trocado 'any' por tipos seguros para satisfazer o no-explicit-any
interface OrderWizardApi {
  getDraft: { 
    useQuery: (
      input: Record<string, unknown>, 
      opts?: Record<string, unknown>
    ) => { data: unknown; isLoading: boolean } 
  };
  updateSession: { 
    useMutation: () => { mutate: (data: Record<string, unknown>) => void } 
  };
  invalidate: () => void;
}

export function useAdminOrderWizard(draftId: string | null) {
  const [step, setStep] = useState(1);
  const isHydrated = useRef(false);
  const lastDraftId = useRef<string | null>(null);
  const utils = trpc.useUtils();

  const [orderData, setOrderData] = useState<OrderData>({
    customer: null,
    deliveryMode: 'delivery',
    address: null,
    items: [],
    deliveryFee: 0,
    discountValue: 0,
    paymentMethod: "",
    paymentStatus: "pending",
    notes: "",
    couponCode: null,
    couponValue: 0,
    loyaltyPointsUsed: 0,
    loyaltyValue: 0,
    paymentDiscountValue: 0,
    discountSource: null,
    editingOrderId: null,
    orderDate: new Date().toISOString().split('T')[0],
    metadataJson: "{}"
  });

  const ordersAdminApi = (trpc.admin.ordersAdmin as unknown as OrderWizardApi);

  const { data, isLoading } = ordersAdminApi.getDraft.useQuery(
    { adminId: "admin_default" },
    {
      enabled: !!draftId && draftId !== "undefined" && draftId !== "null",
      staleTime: 0,
    }
  );

  const draft = data as OrderDraft | undefined;
  
  const { data: paymentMethodsRaw = [] } = trpc.public.paymentMethods.list.useQuery();
  const paymentMethods = (paymentMethodsRaw as unknown as PaymentMethod[]);

  const syncMutation = ordersAdminApi.updateSession.useMutation();

  useEffect(() => {
    if (draft) {
      const isNewDraft = draftId !== lastDraftId.current;
      
      if (!isHydrated.current || isNewDraft) {
        const meta: MetadataShape = draft.metadataJson ? JSON.parse(draft.metadataJson) : {};
        
        setOrderData(prev => {
          const newState = {
            ...prev,
            customer: meta.customer || null,
            deliveryMode: meta.deliveryMode || 'delivery',
            address: meta.address || null, 
            items: draft.items || [],
            deliveryFee: Number(draft.shippingValue || meta.deliveryFee || 0),
            paymentMethod: meta.paymentMethod || "",
            paymentStatus: meta.paymentStatus || "pending",
            notes: meta.notes || "",
            couponCode: meta.couponCode || null,
            couponValue: Number(meta.couponValue || 0),
            loyaltyPointsUsed: Number(meta.loyaltyPointsUsed || 0),
            loyaltyValue: Number(meta.loyaltyValue || 0),
            editingOrderId: meta.editingOrderId || null,
            orderDate: meta.orderDate || new Date().toISOString().split('T')[0],
          };

          newState.discountValue = Number((
            Number(newState.couponValue) + Number(newState.loyaltyValue)
          ).toFixed(2));

          return newState;
        });

        if (meta.currentStep) setStep(Number(meta.currentStep));
        isHydrated.current = true;
        lastDraftId.current = draftId;
      }
    }
  }, [draft, draftId]);

  const subtotal = useMemo(() => {
    return draft?.items?.reduce((acc: number, item: OrderItem) => {
      return acc + (Number(item.unitPrice) * (item.quantity ?? 1));
    }, 0) || 0;
  }, [draft?.items]);

  const updateData = useCallback((newData: Partial<OrderData>) => {
    setOrderData(prev => {
      const updatedState = { ...prev, ...newData };

      if (newData.customer === null) {
        updatedState.address = null;
        updatedState.loyaltyPointsUsed = 0;
        updatedState.loyaltyValue = 0;
      }

      if (newData.customer && !updatedState.address) {
        const addr = newData.customer.address as OrderAddress;
        if (addr) {
          updatedState.address = { ...addr };
        }
      }

      let paymentBonus = 0;
      if (updatedState.paymentMethod && paymentMethods.length > 0) {
        const methodObj = paymentMethods.find(m => String(m.id) === String(updatedState.paymentMethod));
        const discStr = methodObj?.discountPercentage || methodObj?.discount_percentage || "0";
        const methodDiscountPerc = parseFloat(String(discStr).replace(',', '.'));
        paymentBonus = Number(((subtotal * methodDiscountPerc) / 100).toFixed(2));
      }
      
      updatedState.paymentDiscountValue = paymentBonus;
      updatedState.discountValue = Number((
        Number(updatedState.couponValue || 0) +
        Number(updatedState.loyaltyValue || 0) +
        paymentBonus
      ).toFixed(2));

      return updatedState;
    });
  }, [paymentMethods, subtotal]);

  useEffect(() => {
    if (!isHydrated.current || !draftId || draftId === "undefined") return;

    const timer = setTimeout(() => {
      syncMutation.mutate({
        draftId,
        userId: (orderData.customer?.id as unknown as string) || null,
        shippingValue: orderData.deliveryFee,
        discountValue: orderData.discountValue,
        metadataJson: JSON.stringify({
          ...orderData,
          currentStep: step,
          items: undefined 
        })
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [orderData, step, draftId]);

  const total = useMemo(() => {
    return Number(Math.max(0, subtotal + orderData.deliveryFee - orderData.discountValue).toFixed(2));
  }, [subtotal, orderData.deliveryFee, orderData.discountValue]);

  return {
    step,
    setStep,
    orderData,
    updateData,
    totals: { subtotal, total, itemCount: draft?.items?.length || 0 },
    isLoading,
    invalidate: () => (utils.admin.ordersAdmin as unknown as OrderWizardApi).invalidate()
  };
}