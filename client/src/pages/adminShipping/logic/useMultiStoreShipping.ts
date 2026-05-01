// client/src/pages/adminShipping/logic/useMultiStoreShipping.ts

import { useState, useMemo, useEffect } from 'react';
import { trpc } from "@/_core/trpc";

export interface StoreConfig {
  slug: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  allowedCities: string[];
}

export function useMultiStoreShipping() {
  // 1. Estado da loja selecionada (Slug)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // 2. Busca REAL das unidades cadastradas na app_configs
  const { data: storesData, isLoading: isLoadingList } = trpc.admin.shippingMesh.listStores.useQuery(
    undefined, 
    { staleTime: 1000 * 60 * 5 } // Cache de 5 minutos
  );

  // 3. Busca os detalhes da unidade selecionada
  const { data: storeConfig, isLoading: isLoadingConfig } = trpc.admin.shippingMesh.getStoreBase.useQuery(
    { storeSlug: selectedStoreId || "" },
    { 
      enabled: !!selectedStoreId,
      staleTime: 1000 * 60 * 10 
    }
  );

  // Auto-seleção da primeira loja disponível ao carregar
  useEffect(() => {
    if (storesData && storesData.length > 0 && !selectedStoreId) {
      // ✅ CORREÇÃO TS18047: Adicionado check de existência no find e fallback seguro
      const defaultStore = storesData.find(s => s?.slug === 'matriz') || storesData[0];
      
      if (defaultStore?.slug) {
        setSelectedStoreId(defaultStore.slug);
      }
    }
  }, [storesData, selectedStoreId]);

  /**
   * Formata os dados brutos para os componentes (Mapa/Config)
   */
  const mappedConfig = useMemo(() => {
    if (!storeConfig) return null;

    return {
      name: storeConfig.companyName,
      address: storeConfig.address,
      lat: Number(storeConfig.lat),
      lng: Number(storeConfig.lng),
      allowedCities: storeConfig.allowedCities,
      pickup: {
        enabled: storeConfig.pickupEnabled,
        label: storeConfig.pickupLabel,
        instruction: storeConfig.pickupInstruction
      }
    };
  }, [storeConfig]);

  return {
    selectedStoreId,
    setSelectedStoreId,
    stores: storesData || [], // Lista vinda do Banco de Dados
    storeConfig: mappedConfig,
    isLoading: isLoadingList || isLoadingConfig
  };
}