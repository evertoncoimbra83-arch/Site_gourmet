import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---
interface AdminSettingsData {
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
  googleLoginEnabled: boolean;
  // 📈 NOVOS CAMPOS PARA ANALYTICS & BI
  googleAnalyticsId: string;
  gaServiceAccount: string; 
  ga4PropertyId: string;
}

interface AdminStoreSettingsRouter {
  get: {
    useQuery: () => { 
      data?: Record<string, unknown>; 
      isLoading: boolean;
    };
    invalidate: () => void;
  };
  getByKey: {
    useQuery: (input: { key?: string; configKey?: string }) => { 
      data?: { value?: string; configValue?: string }; 
      isLoading: boolean;
    };
    invalidate: (input?: unknown) => void;
  };
  saveCompanyInfo: {
    useMutation: () => { 
      mutateAsync: (data: Record<string, unknown>) => Promise<void>; 
      isPending: boolean; 
    };
  };
  saveConfig: {
    useMutation: () => { 
      mutateAsync: (data: { key?: string; value?: string; configKey?: string; configValue?: string }) => Promise<void>; 
      isPending: boolean; 
    };
  };
}

export function useAdminSettings() {
  const utils = trpc.useUtils();
  
  const adminApi = (trpc.admin as unknown as { storeSettings: AdminStoreSettingsRouter }).storeSettings;
  const adminUtils = (utils.admin as unknown as { storeSettings: AdminStoreSettingsRouter }).storeSettings;

  const [formData, setFormData] = useState<AdminSettingsData>({
    generalMinOrderAmount: "0.00",
    minOrderMessage: "",
    success_order_message: "",
    partners_json: "[]",
    pickupEnabled: false,
    pickupLabel: "",
    pickupInstruction: "",
    geminiApiKey: "",
    googleClientId: "",
    googleClientSecret: "",
    googleLoginEnabled: false,
    // ✅ Inicialização dos novos campos
    googleAnalyticsId: "",
    gaServiceAccount: "",
    ga4PropertyId: "250001647"
  });

  const { data: serverData, isLoading } = adminApi.get.useQuery();
  const saveCompanyMutation = adminApi.saveCompanyInfo.useMutation();
  const saveConfigMutation = adminApi.saveConfig.useMutation();

  useEffect(() => {
    if (serverData) {
      setFormData({
        generalMinOrderAmount: String(serverData.generalMinOrderAmount || "0.00"),
        minOrderMessage: String(serverData.minOrderMessage || ""),
        success_order_message: String(serverData.success_order_message || ""),
        partners_json: String(serverData.partners_json || "[]"),
        pickupEnabled: Boolean(serverData.pickupEnabled),
        pickupLabel: String(serverData.pickupLabel || "Retirada no Local"),
        pickupInstruction: String(serverData.pickupInstruction || ""),
        geminiApiKey: String(serverData.geminiApiKey || ""),
        googleLoginEnabled: Boolean(serverData.googleLoginEnabled),
        googleClientId: String(serverData.googleClientId || ""),
        googleClientSecret: String(serverData.googleClientSecret || ""),
        // ✅ Preenchendo com os dados vindos do Kernel
        googleAnalyticsId: String(serverData.googleAnalyticsId || ""),
        gaServiceAccount: String(serverData.gaServiceAccount || ""),
        ga4PropertyId: String(serverData.ga4PropertyId || "250001647")
      });
    }
  }, [serverData]);

  const handleSaveAll = async () => {
    try {
      await saveCompanyMutation.mutateAsync({
        generalMinOrderAmount: formData.generalMinOrderAmount,
        minOrderMessage: formData.minOrderMessage,
        success_order_message: formData.success_order_message,
        partners_json: formData.partners_json,
        pickupEnabled: formData.pickupEnabled,
        pickupLabel: formData.pickupLabel,
        pickupInstruction: formData.pickupInstruction,
        geminiApiKey: formData.geminiApiKey,
        // ✅ Enviando novos campos para o backend
        googleAnalyticsId: formData.googleAnalyticsId,
        gaServiceAccount: formData.gaServiceAccount,
        ga4PropertyId: formData.ga4PropertyId,
        googleLoginConfig: JSON.stringify({
          enabled: formData.googleLoginEnabled,
          clientId: formData.googleClientId,
          clientSecret: formData.googleClientSecret
        })
      });

      toast.success("Kernel Sincronizado!", { 
        description: "Configurações, Chaves de IA e BI guardadas com sucesso." 
      });
      
      // ✅ Invalida a rota pública para o site refletir o novo GAID na hora
      utils.public.getPublicSettings.invalidate(); 
      adminUtils.get.invalidate();
      adminUtils.getByKey.invalidate();
      
    } catch (err) {
      const error = err as Error;
      toast.error("Erro na sincronização", { description: error.message });
    }
  };

  return {
    state: { 
      formData, 
      isLoading, 
      isPending: saveCompanyMutation.isPending || saveConfigMutation.isPending 
    },
    actions: { 
      setFormData, 
      handleSaveAll,
      updateField: <K extends keyof AdminSettingsData>(field: K, value: AdminSettingsData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    }
  };
}