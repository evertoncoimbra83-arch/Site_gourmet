// client/src/pages/adminAbandoned/logic/useAdminAbandoned.ts
import { useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { getAdminMutationErrorMessage } from "@/lib/admin-mutation-error";
import { requestStrongConfirmation } from "@/lib/strong-confirmation";
import { differenceInMinutes } from "date-fns";

// --- INTERFACES ---
export interface AbandonedCart {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone?: string | null;
  userId: string | null;
  updatedAt: string | Date | null;
  itemCount: number;
  total: number;
  visitorId?: string | null;
  shippingAddressId?: string | null;
  selectedAddressId?: string | null;
}

interface AbandonedCartsResponse {
  carts: Array<{
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone?: string | null;
    userId: string | null;
    updatedAt: string | Date | null;
    itemCount: number | string;
    total: number | string;
    visitorId?: string | null;
    shippingAddressId?: string | null;
    selectedAddressId?: string | null;
  }>;
}

interface EmptyCartRecord {
  id: string;
  updatedAt: Date | string | null;
}

interface AdminOrdersBypass {
  getEmptyOldCarts: {
    useQuery: () => { data: EmptyCartRecord[] | undefined; isLoading: boolean };
    invalidate: () => void;
  };
}

export function useAdminAbandoned() {
  const utils = trpc.useUtils();

  // 1. QUERIES
  const abandonedQuery = trpc.admin.orders.getAbandonedCarts.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const ordersApi = (trpc.admin.orders as unknown) as AdminOrdersBypass;
  const emptyQuery = ordersApi.getEmptyOldCarts?.useQuery() || { data: [], isLoading: false };

  // 2. MUTATIONS
  const deleteMutation = trpc.admin.orders.clearEmptyOldCarts.useMutation({
    onSuccess: () => {
      toast.success("Limpeza Concluída!");
      const utilsOrdersApi = (utils.admin.orders as unknown) as AdminOrdersBypass;
      if (utilsOrdersApi?.getEmptyOldCarts) {
        utilsOrdersApi.getEmptyOldCarts.invalidate();
      }
    },
    onError: (err) => {
      toast.error(getAdminMutationErrorMessage(err, "Erro ao limpar carrinhos antigos."));
    },
  });

  // 3. NORMALIZAÇÃO E FILTRAGEM (REVISADO)
  const abandonedData = useMemo(() => {
    const rawData = abandonedQuery.data as unknown as AbandonedCartsResponse | undefined;
    const carts = rawData?.carts || [];

    return carts
      .map((cart): AbandonedCart => {
        // ✅ Validação rigorosa do nome para evitar "Visitante Anônimo" indevido
        const rawName = cart.customerName?.trim();
        const isValidName = rawName && rawName !== "" && rawName.toLowerCase() !== "null";

        return {
          ...cart,
          total: Number(cart.total) || 0,
          itemCount: Number(cart.itemCount) || 0,
          customerName: isValidName ? (cart.customerName as string) : "Visitante Anônimo"
        };
      })
      .filter(cart => cart.itemCount > 0); 
  }, [abandonedQuery.data]);

  // 4. LÓGICA DE NEGÓCIO: MENSAGEM DINÂMICA
  const getCustomMessage = (cart: AbandonedCart) => {
    const firstName = cart.customerName !== "Visitante Anônimo" 
      ? cart.customerName.split(" ")[0] 
      : "cliente";
      
    const itemLabel = cart.itemCount === 1 ? "marmita" : "marmitas";
    
    const isAtPayment = !!(cart.shippingAddressId || cart.selectedAddressId);
    const isAtCheckout = !!cart.customerEmail && !isAtPayment;

    if (isAtPayment) {
      return `Olá ${firstName}! Vi que você chegou na etapa de pagamento das suas ${cart.itemCount} ${itemLabel} na Gourmet Saudável, mas não concluiu. Teve algum problema com o cartão? Posso te ajudar a finalizar? 😊`;
    }

    if (isAtCheckout) {
      return `Olá ${firstName}! Vi que você selecionou ${cart.itemCount} ${itemLabel} incríveis na Gourmet Saudável, mas parou no cadastro. Alguma dúvida sobre a entrega ou pratos? Estou à disposição! 🥗`;
    }

    return `Olá! Notei que você deixou algumas delícias no carrinho da Gourmet Saudável. Posso te ajudar a escolher os melhores pratos para sua semana? 🍎`;
  };

  // 5. AUXILIARES
  const stats = useMemo(() => ({
    totalOpportunity: abandonedData.reduce((acc, curr) => acc + curr.total, 0),
    count: abandonedData.length
  }), [abandonedData]);

  const isOnline = (date: string | Date | null | undefined): boolean => {
    if (!date) return false;
    const d = new Date(date);
    if (isNaN(d.getTime())) return false;
    // Considera online se houve atividade nos últimos 6 minutos
    return Math.abs(differenceInMinutes(new Date(), d)) < 6;
  };

  const handleCleanUp = () => {
    const confirmation = requestStrongConfirmation(
      "Digite CONFIRMAR para limpar carrinhos antigos.",
      "Informe uma justificativa para esta limpeza operacional:",
    );
    if (!confirmation) {
      toast.warning("Confirmacao forte cancelada.");
      return;
    }
    deleteMutation.mutate(confirmation);
  };

  return {
    abandonedData,
    emptyData: emptyQuery.data || [],
    isLoading: abandonedQuery.isLoading,
    isDeleting: deleteMutation.isPending,
    handleCleanUp,
    stats,
    isOnline,
    getCustomMessage 
  };
}
