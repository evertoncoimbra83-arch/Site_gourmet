// e:/IA/projects/Site_React/client/src/pages/adminShipping/logic/useStoreConfig.ts

import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---

interface StoreSaveData {
  companyName?: string;
  address?: string;
  fullAddress?: string;
  lat: string | number;
  lng: string | number;
  allowedCities?: string[];
  pickupEnabled?: boolean;
  pickupLabel?: string;
  pickupInstruction?: string;
  minOrderValue?: number;
  minOrderMessage?: string;
}

/** Estrutura para registrar o Marco Zero da cidade (Check 1 da Cascata) */
interface CityBindRow {
  cep: string;
  cidade: string;
  lat: string | number;
  lng: string | number;
}

export function useStoreConfig(storeSlug?: string) {
  const utils = trpc.useUtils();
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // 1. Busca dados da Unidade (app_config)
  const { data: storeBaseData, isLoading } = trpc.admin.shippingMesh.getStoreBase.useQuery(
    { storeSlug: storeSlug || "default" },
    { enabled: !!storeSlug }
  );

  // 2. Gravação Mestra (Identidade, Pickup, Pedido Mínimo e Cidades)
  const updateStoreMutation = trpc.admin.shippingMesh.updateStoreLocation.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas!");
      utils.admin.shippingMesh.getStoreBase.invalidate({ storeSlug });
      utils.admin.shippingMesh.listStores.invalidate();
    },
    // ✅ FIX ESLint: Tipado 'err' como Error em vez de 'any'
    onError: (err: { message: string }) => toast.error("Erro ao salvar: " + err.message)
  });

  // 3. Registro Geográfico
  const registerCityMutation = trpc.admin.shippingMesh.bindOperativeCity.useMutation({
    onSuccess: () => {
      toast.success("Marco zero geográfico registrado!");
      utils.admin.shippingMesh.getImportedCities.invalidate();
    },
    // ✅ FIX ESLint: Tipado 'err' como Error em vez de 'any'
    onError: (err: { message: string }) => toast.error("Erro no registro geográfico: " + err.message)
  });

  /**
   * ✅ BUSCA DE CEP (ViaCEP + Nominatim)
   */
  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      toast.error("CEP inválido.");
      return null;
    }

    setIsSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error();

      const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
      
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        { headers: { 'User-Agent': 'GourmetSaudavel-Admin-Panel' } }
      );
      const geoData = await geoRes.json();

      if (!geoData[0]) throw new Error("Coordenadas não encontradas.");

      return {
        address: fullAddress,
        lat: String(geoData[0].lat),
        lng: String(geoData[0].lon),
        city: data.localidade,
        uf: data.uf
      };
    } catch {
      toast.error("Erro ao localizar este CEP no mapa.");
      return null;
    } finally {
      setIsSearchingCep(false);
    }
  };

  /**
   * ✅ SALVAR CONFIGURAÇÕES (app_config)
   */
  const saveConfig = (data: StoreSaveData) => {
    if (!storeSlug) return;

    updateStoreMutation.mutate({
      storeSlug,
      companyName: data.companyName || "Gourmet Saudável",
      address: data.fullAddress || data.address || "",
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0,
      allowedCities: Array.isArray(data.allowedCities) ? data.allowedCities : [],
      pickupEnabled: !!data.pickupEnabled,
      pickupLabel: data.pickupLabel || "Retirada",
      pickupInstruction: data.pickupInstruction || "",
      minOrderValue: Number(data.minOrderValue) || 0,
      minOrderMessage: data.minOrderMessage || "Valor mínimo não atingido."
    });
  };

  /**
   * ✅ VINCULAR CIDADE
   */
  const bindCity = (cityData: CityBindRow) => {
    registerCityMutation.mutate({ 
      rows: [{
        cep: cityData.cep,
        cidade: cityData.cidade,
        lat: String(cityData.lat),
        lng: String(cityData.lng)
      }]
    });
  };

  return {
    mappedSettings: storeBaseData ? {
      ...storeBaseData,
      allowedCities: storeBaseData.allowedCities || [],
      fullAddress: storeBaseData.address,
      lat: String(storeBaseData.lat),
      lng: String(storeBaseData.lng),
      minOrderValue: storeBaseData.minOrderValue || 0,
      minOrderMessage: storeBaseData.minOrderMessage || ""
    } : undefined,
    actions: { 
      saveConfig,
      searchCep,
      bindCity 
    },
    state: {
      isSaving: updateStoreMutation.isPending,
      isSeeding: registerCityMutation.isPending,
      isSearchingCep,
      isLoading
    }
  };
}