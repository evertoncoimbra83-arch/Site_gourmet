import { useState, useCallback } from "react";

// --- INTERFACES DE RESPOSTA DAS APIS ---

interface BigDataCloudResponse {
  postcode?: string;
  localityInfo?: {
    informative?: Array<{
      name: string;
      [key: string]: unknown;
    }>;
  };
  [key: string]: unknown;
}

interface NominatimResponse {
  address?: {
    postcode?: string;
    zip?: string;
  };
}

interface GeolocationResult {
  cep: string | null;
  address: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocationZip() {
  const [state, setState] = useState<GeolocationResult>({
    cep: null,
    address: null,
    loading: false,
    error: null,
  });

  const getZipFromCoords = useCallback(async () => {
    if (state.loading) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, loading: false, error: "GPS não suportado." }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // 1. Tenta a BigDataCloud
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
          );
          const data: BigDataCloudResponse = await response.json();

          let foundZip = data.postcode || null;

          if (!foundZip && data.localityInfo?.informative) {
            const zipInfo = data.localityInfo.informative.find((i) => 
              /^\d{5}-?\d{3}$/.test(i.name)
            );
            if (zipInfo) foundZip = zipInfo.name;
          }

          // 2. FALLBACK PARA NOMINATIM
          if (!foundZip) {
             const nomResp = await fetch(
               `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
             );
             const nomData: NominatimResponse = await nomResp.json();
             foundZip = nomData.address?.postcode || nomData.address?.zip || null;
          }

          if (foundZip) {
            const cleanZip = String(foundZip).replace(/\D/g, "");
            setState({ 
              cep: cleanZip, 
              address: data as Record<string, unknown>, 
              loading: false, 
              error: null 
            });
          } else {
            throw new Error("CEP não retornado");
          }
        } catch {
          // ✅ Removido 'err' não utilizado para satisfazer o ESLint
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Não conseguimos obter o CEP automaticamente. Digite-o abaixo.",
          }));
        }
      },
      (geoError) => {
        let msg = "Erro ao obter localização.";
        if (geoError.code === 1) msg = "Permissão de GPS negada.";
        setState((prev) => ({ ...prev, loading: false, error: msg }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [state.loading]);

  return { ...state, getZipFromCoords };
}