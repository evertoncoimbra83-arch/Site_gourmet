// e:/IA/projects/Site_React/client/src/pages/adminShipping/logic/useShippingMesh.ts

import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---
export interface GeoMeshItem {
  cep: string;
  bairro: string | null;
  cidade: string | null;
  lat: string | number;
  lng: string | number;
  price?: string | number | null;
  storeSlug?: string | null;
  lastSeen?: string | Date | null;
}

/**
 * Hook especializado na gestão da Malha Geográfica.
 * Agora o processamento pesado ocorre 100% no Backend.
 */
export function useShippingMesh() {
  const utils = trpc.useUtils();

  // 🔍 Query: Busca a malha geográfica completa (Cache do servidor)
  const { data: knownMesh, isLoading: isLoadingMesh } = trpc.admin.shippingMesh.getMesh.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, 
  });

  const invalidateMesh = async () => {
    await utils.admin.shippingMesh.getMesh.invalidate();
  };

  // ⚡ Mutation: SINCRONIZAÇÃO GERAL
  const syncMeshMutation = trpc.admin.shippingMesh.syncMeshWithRules.useMutation({
    onSuccess: async () => {
      await invalidateMesh();
    },
    onError: (err) => console.error("Erro interno de sincronia:", err.message)
  });

  return {
    state: {
      isLoading: isLoadingMesh,
      isSaving: syncMeshMutation.isPending,
      isImporting: syncMeshMutation.isPending,
      isSyncing: syncMeshMutation.isPending,
    },
    data: {
      /**
       * ✅ Mapeamento do retorno do Backend (Inglês) para a Interface (Português)
       */
      knownMesh: (knownMesh || []).map(item => ({
        cep: item.zipCode,
        bairro: item.neighborhood,
        cidade: item.city,
        lat: item.lat,
        lng: item.lng,
        storeSlug: item.storeSlug,
        lastSeen: item.lastSeen
      })) as GeoMeshItem[]
    },
    actions: {
      saveDrawnArea: async () => {
        try {
          await syncMeshMutation.mutateAsync();
        } catch (error) {
          console.error("❌ Erro ao sincronizar nova área:", error);
        }
      },
      
      /**
       * ✅ Parâmetro removido fisicamente dos parênteses
       */
      handleImportMesh: async () => {
        await syncMeshMutation.mutateAsync();
      },

      handleSyncMesh: async () => {
        console.log("🔄 Iniciando processamento da malha no backend...");
        
        const promise = syncMeshMutation.mutateAsync();

        toast.promise(promise, {
          loading: 'O servidor está processando a malha... Isso pode levar alguns segundos.',
          success: (data: { insertedCount?: number }) => {
            const result = data as { insertedCount?: number };
            return `${result?.insertedCount || 0} rotas foram validadas e atualizadas!`;
          },
          error: (err: unknown) =>
            `A sincronização falhou: ${err instanceof Error ? err.message : "tente novamente."}`,
        });
      }
    }
  };
}
