import { useEffect, useCallback } from "react";
import posthog from 'posthog-js'; // Certifique-se de ter instalado: npm install posthog-js

export function useCheckoutTracking(cart: any) {
  
  // 1. CAPTURA E PERSISTÊNCIA DE UTMs (Atribuição de Marketing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get("utm_source");
    const utm_medium = params.get("utm_medium");
    const utm_campaign = params.get("utm_campaign");
    const utm_content = params.get("utm_content");

    if (utm_source || utm_medium || utm_campaign) {
      const trafficData = {
        source: utm_source || "direct",
        medium: utm_medium || "none",
        campaign: utm_campaign || "not_set",
        content: utm_content || "",
        timestamp: new Date().toISOString(),
      };

      // Salva no localStorage para persistência (Atribuição "Last Click")
      localStorage.setItem("marketing_attribution", JSON.stringify(trafficData));
      
      // Registra no PostHog como propriedades do usuário para o funil
      posthog.register({
        initial_utm_source: trafficData.source,
        initial_utm_medium: trafficData.medium,
        initial_utm_campaign: trafficData.campaign
      });
    }
  }, []);

  // 2. RASTREIO DE INÍCIO DE CHECKOUT (begin_checkout)
  useEffect(() => {
    if (cart?.items?.length > 0) {
      const itemsFormatted = cart.items.map((item: any) => ({
        item_id: item.id || item.packageId,
        item_name: item.name,
        price: Number(item.displayPrice || item.price),
        quantity: item.quantity,
        item_category: item.packageId ? "Pacote" : "Prato Avulso"
      }));

      // Evento padrão GA4 / PostHog
      posthog.capture("begin_checkout", {
        value: Number(cart.subtotal),
        currency: "BRL",
        items: itemsFormatted,
        coupon: cart.couponDescription || ""
      });

       }
  }, []); // Executa apenas uma vez ao montar o componente de Checkout

  // 3. EVENTOS DE ETAPAS (Ações do Usuário)
  
  // Rastrear quando escolhe endereço
  const trackShippingSelected = useCallback((type: string, cost: number) => {
    posthog.capture("add_shipping_info", {
      shipping_type: type, // 'delivery' | 'pickup'
      value: cost,
      currency: "BRL"
    });
  }, []);

  // Rastrear quando seleciona método de pagamento
  const trackPaymentSelected = useCallback((methodId: string) => {
    posthog.capture("add_payment_info", {
      payment_type: methodId,
      currency: "BRL"
    });
  }, []);

  // 4. RECUPERAR ORIGEM PARA O PEDIDO (Para salvar no Banco)
  const getMarketingData = () => {
    try {
      const data = localStorage.getItem("marketing_attribution");
      return data ? JSON.parse(data) : { source: 'direct', medium: 'none' };
    } catch { 
      return { source: 'direct', medium: 'none' }; 
    }
  };

  return { 
    getMarketingData,
    trackShippingSelected,
    trackPaymentSelected
  };
}