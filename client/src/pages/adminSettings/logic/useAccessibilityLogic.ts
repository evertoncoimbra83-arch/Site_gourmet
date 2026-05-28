import { useEffect, useState } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import {
  applyAccessibilityToDOM,
  clampFontScale,
  persistAccessibilityPreferences,
} from "@/_core/hooks/useAccessibility";

interface AccessibilityData {
  favicon: string;
  highContrast: boolean;
  dyslexicFont: boolean;
  fontScale: number;
  vLibrasActive: boolean;
}

interface AccessibilitySettings {
  highContrast?: boolean;
  highContrastActive?: boolean;
  dyslexicFont?: boolean;
  fontScale?: number;
  vLibrasActive?: boolean;
}

interface AdminStoreSettingsResponse {
  favicon?: string;
  accessibility?: AccessibilitySettings;
}

type StoreSettingsRouter = {
  invalidate(): unknown;
  get: {
    useQuery: () => {
      data: AdminStoreSettingsResponse | undefined;
      isLoading: boolean;
    };
  };
  upsert: {
    useMutation: () => {
      mutateAsync: (data: Record<string, unknown>) => Promise<unknown>;
      isPending: boolean;
    };
  };
};

export function useAccessibilityLogic() {
  const utils = trpc.useUtils();
  const adminProxy = trpc.admin as unknown as {
    storeSettings: Omit<StoreSettingsRouter, "invalidate">;
  };
  const adminUtils = (utils.admin as unknown as {
    storeSettings: Pick<StoreSettingsRouter, "invalidate">;
  }).storeSettings;

  const storeSettings = adminProxy.storeSettings;
  const { data: settings, isLoading } = storeSettings.get.useQuery();

  const [accessibilityData, setAccessibilityData] = useState<AccessibilityData>({
    favicon: "",
    highContrast: false,
    dyslexicFont: false,
    fontScale: 1,
    vLibrasActive: false,
  });

  const mutation = storeSettings.upsert.useMutation();

  useEffect(() => {
    if (!settings) return;

    const acc = settings.accessibility || {};

    setAccessibilityData({
      favicon: settings.favicon || "",
      highContrast: !!(acc.highContrast ?? acc.highContrastActive),
      dyslexicFont: !!acc.dyslexicFont,
      fontScale: clampFontScale(acc.fontScale),
      vLibrasActive: !!acc.vLibrasActive,
    });
  }, [settings]);

  const updateField = (updates: Partial<AccessibilityData>) => {
    setAccessibilityData((prev) => ({
      ...prev,
      ...updates,
      fontScale:
        updates.fontScale !== undefined
          ? clampFontScale(updates.fontScale)
          : prev.fontScale,
    }));
  };

  const handleSave = async () => {
    const payload = {
      favicon: accessibilityData.favicon,
      accessibility: {
        highContrast: accessibilityData.highContrast,
        highContrastActive: accessibilityData.highContrast,
        dyslexicFont: accessibilityData.dyslexicFont,
        fontScale: clampFontScale(accessibilityData.fontScale),
        vLibrasActive: accessibilityData.vLibrasActive,
      },
      highContrast: accessibilityData.highContrast,
      highContrastActive: accessibilityData.highContrast,
      dyslexicFont: accessibilityData.dyslexicFont,
      fontScale: clampFontScale(accessibilityData.fontScale),
      vLibrasActive: accessibilityData.vLibrasActive,
    };

    try {
      await mutation.mutateAsync(payload);

      applyAccessibilityToDOM({
        highContrast: accessibilityData.highContrast,
        dyslexicFont: accessibilityData.dyslexicFont,
        fontScale: accessibilityData.fontScale,
      });

      persistAccessibilityPreferences({
        highContrast: accessibilityData.highContrast,
        dyslexicFont: accessibilityData.dyslexicFont,
        fontScale: accessibilityData.fontScale,
      });

      utils.public.getPublicSettings.invalidate();
      utils.public.getStoreSettings.invalidate();
      adminUtils.invalidate();

      toast.success("Preferencias de acessibilidade salvas.");
    } catch (error) {
      const err = error as Error;
      toast.error("Erro ao salvar acessibilidade", {
        description: err.message,
      });
    }
  };

  return {
    state: {
      accessibilityData,
      isLoading,
      isPending: mutation.isPending,
    },
    actions: {
      updateField,
      handleSave,
    },
  };
}
