import { useEffect } from "react";
import ReactGA from "react-ga4";
import posthog from "posthog-js";
import { trpc } from "@/_core/trpc";

interface PurchaseData {
  transaction_id: string; // ID do pedido
  value: number;          // Valor total (com frete e descontos)
  shipping: number;       // Valor do frete
  currency: string;
  items: {
    item_id: string | number;
    item_name: string;
    price: number;
    quantity: number;
    item_category?: string;
  }[];
}

export function usePurchaseTracking(order: PurchaseData | null | undefined) {
  // Chamamos a mesma query das configurações para garantir que o GA4 está pronto
  const { data: settings } = trpc.store.public.getPublicSettings.useQuery();

  useEffect(() => {
    // Verificamos se o Analytics foi inicializado com sucesso
    const gaId = settings && 'googleAnalyticsId' in settings 
      ? settings.googleAnalyticsId 
      : undefined;

    if (typeof gaId === 'string' && order) {
      const payload = {
        transaction_id: order.transaction_id,
        value: order.value,
        shipping: order.shipping,
        currency: order.currency || "BRL",
        items: order.items
      };

      // ✅ Envia para o GA4
      ReactGA.event("purchase", payload);

      // ✅ Envia para o PostHog
      posthog.capture("purchase", payload);

      // Log discreto para confirmares no desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log("[Analytics] Compra registada:", order.transaction_id);
      }
    }
  }, [order, settings]);
}