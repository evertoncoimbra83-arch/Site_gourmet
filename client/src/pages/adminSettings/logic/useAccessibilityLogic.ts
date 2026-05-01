// e:/IA/projects/Site_React/client/src/pages/adminSettings/logic/useAccessibilityLogic.ts

import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---

interface AccessibilityData {
  favicon: string;
  highContrast: boolean;
  dyslexicFont: boolean;
  vLibrasActive: boolean;
}

interface AccessibilitySettings {
  highContrast?: boolean;
  highContrastActive?: boolean; // Adicionado para suportar ambas as nomenclaturas
  dyslexicFont?: boolean;
  vLibrasActive?: boolean;
}

// Interface para forçar a tipagem do retorno da query e evitar TS2339
interface PublicSettingsResponse {
  favicon?: string;
  accessibility?: AccessibilitySettings;
  [key: string]: unknown;
}

export function useAccessibilityLogic() {
  const utils = trpc.useUtils();

  const [accessibilityData, setAccessibilityData] = useState<AccessibilityData>({
    favicon: "",
    highContrast: false,
    dyslexicFont: false,
    vLibrasActive: false,
  });

  /**
   * ✅ LEITURA PÚBLICA
   */
  const { data: settingsRaw, isLoading } = trpc.public.getPublicSettings.useQuery(undefined, {
    retry: false, 
    staleTime: 1000 * 60 * 5, 
  });

  // ✅ Cast seguro para evitar o erro de propriedade inexistente no Union Type
  const settings = settingsRaw as PublicSettingsResponse | undefined;

  /**
   * 🛡️ ESCRITA
   */
  const mutation = trpc.admin.storeSettings.upsert.useMutation({
    onSuccess: () => {
      utils.public.getPublicSettings.invalidate();
      toast.success("Interface atualizada!");
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
    }
  });

  // ✅ SINCRONIZAÇÃO
  useEffect(() => {
    if (settings) {
      const acc = settings.accessibility || {};
      
      setAccessibilityData({
        favicon: settings.favicon || "",
        // Aceita tanto highContrast quanto highContrastActive do backend
        highContrast: !!(acc.highContrast || acc.highContrastActive),
        dyslexicFont: !!acc.dyslexicFont,
        vLibrasActive: !!acc.vLibrasActive, 
      });
    }
  }, [settings]);

  /**
   * ✅ AÇÃO
   */
  const updateField = (updates: Partial<AccessibilityData>) => {
    const newData = { ...accessibilityData, ...updates };
    setAccessibilityData(newData);
    
    // ✅ Enviamos para o 'upsert' garantindo a estrutura que o backend espera
    mutation.mutate({
      favicon: newData.favicon,
      accessibility: {
        highContrastActive: newData.highContrast,
        vLibrasActive: newData.vLibrasActive,
        dyslexicFont: newData.dyslexicFont 
      },
      // Chaves raiz para compatibilidade redundante
      vLibrasActive: newData.vLibrasActive,
      highContrastActive: newData.highContrast
    } as Record<string, unknown>); 
  };

  return {
    state: { 
      accessibilityData, 
      isLoading, 
      isPending: mutation.isPending 
    },
    actions: { updateField }
  };
}