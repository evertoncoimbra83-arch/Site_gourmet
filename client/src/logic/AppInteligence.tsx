// client/src/logic/AppInteligence.tsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import { trpc } from "@/_core/trpc";

export function AppInteligence() {
  const location = useLocation();
  const hasInitialized = useRef(false);

  const { data: settings } = trpc.store.settings.getPublicSettings.useQuery();

  useEffect(() => {
    if (settings?.googleAnalyticsId && !hasInitialized.current) {
      ReactGA.initialize(settings.googleAnalyticsId);
      hasInitialized.current = true;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GA4] Inicializado via DB: ${settings.googleAnalyticsId}`);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (hasInitialized.current) {
      ReactGA.send({ 
        hitType: "pageview", 
        page: location.pathname + location.search 
      });
    }
  }, [location, settings]);

  return null;
}