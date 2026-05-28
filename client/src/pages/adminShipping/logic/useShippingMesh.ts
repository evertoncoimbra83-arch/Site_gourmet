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
  const bindOperativeCityMutation = trpc.admin.shippingMesh.bindOperativeCity.useMutation({
    onSuccess: async () => {
      await invalidateMesh();
    },
    onError: (err) => console.error("Erro interno de importacao:", err.message)
  });

  const syncMeshMutation = trpc.admin.shippingMesh.syncMeshWithRules.useMutation({
    onSuccess: async () => {
      await invalidateMesh();
    },
    onError: (err) => console.error("Erro interno de sincronia:", err.message)
  });

  return {
    state: {
      isLoading: isLoadingMesh,
      isSaving: syncMeshMutation.isPending || bindOperativeCityMutation.isPending,
      isImporting: bindOperativeCityMutation.isPending,
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
      handleImportMesh: async (rows: Array<{ cep: string; cidade: string; bairro?: string; lat: string | number; lng: string | number }>) => {
        const promise = (async () => {
          const bindResult = await bindOperativeCityMutation.mutateAsync({ rows });
          await syncMeshMutation.mutateAsync();
          return bindResult;
        })();

        toast.promise(promise, {
          loading: 'Processando arquivo de CEPs... Isto pode levar alguns instantes.',
          success: (data) => {
            return `${data.count} rotas foram importadas e sincronizadas com sucesso!`;
          },
          error: (err: unknown) =>
            `A importação falhou: ${err instanceof Error ? err.message : "tente novamente."}`,
        });
      },

      handleSyncMesh: async () => {
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
