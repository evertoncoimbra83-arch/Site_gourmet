import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import { trpc } from "@/_core/trpc";

export function useGAPageTracking() {
  const location = useLocation();
  const { data: settings } = trpc.store.public.getPublicSettings.useQuery();

  useEffect(() => {
    const gaId = settings && 'googleAnalyticsId' in settings 
      ? settings.googleAnalyticsId 
      : undefined;

    if (typeof gaId === 'string') {
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname + location.search,
      });
    }
  }, [location, settings]);
}