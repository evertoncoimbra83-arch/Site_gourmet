// client/src/_core/store/useCheckoutStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ✅ Interface Limpa: Sem rastro de guestAddress ou estados locais efêmeros
interface CheckoutFields {
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  customerEmail: string; // ✅ Adicionado e-mail do visitante
  notes: string;
  selectedAddressId: string | number | null; // ID real vindo do banco (Finding 6)
  selectedShippingType: "delivery" | "pickup";
  selectedPaymentId: number | string | null;
  manualZipCode: string;
}

interface CheckoutActions {
  setField: <K extends keyof CheckoutFields>(field: K, value: CheckoutFields[K]) => void;
  reset: () => void;
}

type CheckoutStore = CheckoutFields & CheckoutActions;

const initialState: CheckoutFields = {
  customerName: "",
  customerCpf: "",
  customerPhone: "",
  customerEmail: "", // ✅ Inicializado vazio
  notes: "",
  selectedAddressId: null,
  selectedShippingType: "delivery",
  selectedPaymentId: null,
  manualZipCode: "",
};

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      ...initialState,

      setField: (field, value) => set((state) => ({ ...state, [field]: value })),

      reset: () => set(initialState),
    }),
    {
      name: 'gourmet-checkout-v2', // ✅ Mudamos o nome para invalidar caches do fluxo antigo (Finding 1)
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // ✅ Persistimos apenas os dados, ignorando as funções
        const {
          customerName,
          customerCpf,
          customerPhone,
          customerEmail, // ✅ Persistir e-mail do visitante
          notes,
          selectedAddressId,
          selectedShippingType,
          selectedPaymentId,
          manualZipCode
        } = state;

        return {
          customerName,
          customerCpf,
          customerPhone,
          customerEmail, // ✅ Incluído no retorno
          notes,
          selectedAddressId,
          selectedShippingType,
          selectedPaymentId,
          manualZipCode
        };
      },
    }
  )
);