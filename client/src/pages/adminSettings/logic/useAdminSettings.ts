// src/pages/adminSettings/logic/useAdminSettings.ts
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { safeJsonParse } from "@/lib/safe-parse";

// 1. Interface Única e Verdadeira
export interface AdminSettingsData {
  gtmId: string;
  generalMinOrderAmount: string;
  minOrderMessage: string;
  success_order_message: string;
  partners_json: string;
  pickupEnabled: boolean;
  pickupLabel: string;
  pickupInstruction: string;
  geminiApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  googleLoginEnabled: boolean;
  googleAnalyticsId: string;
  gaServiceAccount: string;
  ga4PropertyId: string;
}

// Interface interna para a hidratação da configuração criptografada do Google
interface GoogleLoginConfigPayload {
  enabled?: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

/**
 * 2. Técnica de "Bridge Typing" Otimizada
 */
type StoreSettingsRouter = {
  invalidate(): unknown;
  get: {
    useQuery: () => { data: any | undefined; isLoading: boolean };
    invalidate: () => void;
  };
  upsert: {
    useMutation: () => {
      mutateAsync: (data: unknown) => Promise<void>;
      isPending: boolean;
    };
  };
  testGoogleOAuth: {
    useMutation: () => {
      mutateAsync: (data: { clientId: string; clientSecret: string; redirectUri: string }) => Promise<{ success: boolean; message: string }>;
      isPending: boolean;
    };
  };
};

export function useAdminSettings() {
  const utils = trpc.useUtils();

  // 3. Tipagem por Asserção Controlada (Substitui o ANY de forma segura)
  const adminProxy = trpc.admin as unknown as { storeSettings: StoreSettingsRouter };
  const storeSettings = adminProxy.storeSettings;

  const [formData, setFormData] = useState<AdminSettingsData>({
    generalMinOrderAmount: "0.00",
    minOrderMessage: "",
    success_order_message: "",
    partners_json: "[]",
    pickupEnabled: false,
    pickupLabel: "Retirada no Local",
    pickupInstruction: "",
    geminiApiKey: "",
    googleClientId: "",
    googleClientSecret: "",
    googleRedirectUri: "",
    googleLoginEnabled: false,
    googleAnalyticsId: "",
    gaServiceAccount: "",
    ga4PropertyId: "250001647",
    gtmId: ""
  });

  const { data: serverData, isLoading } = storeSettings.get.useQuery();
  const saveMutation = storeSettings.upsert.useMutation();

  useEffect(() => {
    if (serverData) {
      // 🧩 HIDRATAÇÃO INTELIGENTE: Descompacta strings JSON sensíveis do banco de volta para os campos do formulário
      const googleConfig = safeJsonParse<GoogleLoginConfigPayload>(serverData.googleLoginConfig, {});

      setFormData(prev => ({
        ...prev,
        generalMinOrderAmount: serverData.generalMinOrderAmount !== undefined ? String(serverData.generalMinOrderAmount) : prev.generalMinOrderAmount,
        minOrderMessage: serverData.minOrderMessage || "",
        success_order_message: serverData.success_order_message || "",
        partners_json: serverData.partners_json || "[]",
        pickupEnabled: Boolean(serverData.pickupEnabled),
        pickupLabel: serverData.pickupLabel || "Retirada no Local",
        pickupInstruction: serverData.pickupInstruction || "",
        geminiApiKey: serverData.geminiApiKey || "",
        googleAnalyticsId: serverData.googleAnalyticsId || "",
        gaServiceAccount: serverData.gaServiceAccount || "",
        ga4PropertyId: serverData.ga4PropertyId || "",
        gtmId: serverData.gtmId || "",
        // Preenche as inputs do Google Login a partir da string unificada do backend
        googleLoginEnabled: googleConfig?.enabled ?? false,
        googleClientId: googleConfig?.clientId || "",
        googleClientSecret: googleConfig?.clientSecret || "",
        googleRedirectUri: googleConfig?.redirectUri || ""
      }));
    }
  }, [serverData]);

  // 4. UpdateField com Generics para garantir que 'value' bata com 'field'
  const updateField = useCallback(<K extends keyof AdminSettingsData>(
    field: K,
    value: AdminSettingsData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveAll = async () => {
    try {
      const {
        generalMinOrderAmount: _generalMinOrderAmount,
        minOrderMessage: _minOrderMessage,
        ...settingsOwnedFields
      } = formData;

      // Compacta o formulário de volta no padrão DTO esperado pelo Zod do backend
      const payload = {
        ...settingsOwnedFields,
        googleLoginConfig: JSON.stringify({
          enabled: settingsOwnedFields.googleLoginEnabled,
          clientId: settingsOwnedFields.googleClientId,
          clientSecret: settingsOwnedFields.googleClientSecret,
          redirectUri: settingsOwnedFields.googleRedirectUri
        })
      };

      await saveMutation.mutateAsync(payload);

      toast.success("Kernel Sincronizado!", {
        description: "Configurações guardadas com sucesso."
      });

      // Invalidação usando Type Assertion segura para o cache reativo
      const adminUtils = (utils.admin as unknown as { storeSettings: StoreSettingsRouter }).storeSettings;

      utils.public.getPublicSettings.invalidate();
      adminUtils.get.invalidate();

    } catch (err) {
      const error = err as Error;
      toast.error("Erro na sincronização", { description: error.message });
    }
  };

  const testGoogleOAuthMutation = storeSettings.testGoogleOAuth.useMutation();

  return {
    state: {
      formData,
      isLoading,
      isPending: saveMutation.isPending,
      isTestingGoogle: testGoogleOAuthMutation.isPending
    },
    actions: {
      setFormData,
      handleSaveAll,
      updateField,
      testGoogleOAuth: testGoogleOAuthMutation.mutateAsync
    }
  };
}
