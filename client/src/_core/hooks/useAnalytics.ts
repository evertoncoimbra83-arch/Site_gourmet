import { useEffect, useRef, useCallback } from "react";
import ReactGA from "react-ga4";
import { trpc } from "@/_core/trpc"; 

// Tipagem para os itens do e-commerce
export interface AnalyticsItem {
  item_id: string | number;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string; // ✅ adicionado para suportar tamanhos/variações
  coupon?: string;
}

// Tipagem para os dados de compra
export interface PurchaseData {
  transaction_id: string;
  value: number;
  shipping: number;
  currency: string;
  coupon?: string;
  items: AnalyticsItem[];
}

export function useAnalytics() {
  const { data: settings } = trpc.store.public.getPublicSettings.useQuery();
  const isInitialized = useRef(false);

  useEffect(() => {
    const gaId = settings && 'googleAnalyticsId' in settings 
      ? settings.googleAnalyticsId 
      : undefined;

    if (typeof gaId === 'string' && !isInitialized.current) {
      ReactGA.initialize(gaId);
      isInitialized.current = true;
    }
  }, [settings]);

  const trackPurchase = useCallback((data: PurchaseData) => {
    if (isInitialized.current) {
      ReactGA.event("purchase", data);
    }
  }, []);

  // ✅ Rastreia adição ao carrinho
  const trackAddToCart = useCallback((item: AnalyticsItem, currency = "BRL") => {
    if (isInitialized.current) {
      ReactGA.event("add_to_cart", {
        currency,
        value: Number((item.price * item.quantity).toFixed(2)),
        items: [item],
      });
    }
  }, []);

  // ✅ Rastreia remoção do carrinho
  const trackRemoveFromCart = useCallback((item: AnalyticsItem, currency = "BRL") => {
    if (isInitialized.current) {
      ReactGA.event("remove_from_cart", {
        currency,
        value: Number((item.price * item.quantity).toFixed(2)),
        items: [item],
      });
    }
  }, []);

  const setUserId = useCallback((userId: string | number | null) => {
    if (isInitialized.current) {
      ReactGA.set({ user_id: userId?.toString() });
    }
  }, []);

  const clearUserId = useCallback(() => {
    if (isInitialized.current) {
      ReactGA.set({ user_id: undefined });
    }
  }, []);

  return { setUserId, clearUserId, trackPurchase, trackAddToCart, trackRemoveFromCart };
}