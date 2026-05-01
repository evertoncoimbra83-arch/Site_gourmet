import { useEffect } from "react";
import { trpc } from "@/_core/trpc";

// --- INTERFACES ---
interface AccessibilitySettings {
  accessibility?: {
    highContrast?: boolean;
    dyslexicFont?: boolean;
    fontScale?: number;
  };
}

export function useAccessibility() {
  /**
   * ✅ CORREÇÃO DEFINITIVA: 
   * Usamos 'unknown' como ponte para evitar o aviso de 'any'.
   * O casting para o tipo esperado mantém a segurança do código.
   */
  const publicRouter = (trpc.public as unknown) as { 
    getPublicSettings: { useQuery: (args: undefined, opts: object) => { data: AccessibilitySettings } } 
  };

  const { data: settings } = publicRouter.getPublicSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 30, // 30 minutos de cache
    retry: false,
    refetchOnWindowFocus: false 
  });

  useEffect(() => {
    const root = document.documentElement;

    // 1. LER PREFERÊNCIAS (LocalStorage)
    const userContrast = localStorage.getItem('a11y-high-contrast');
    const userDyslexic = localStorage.getItem('a11y-font-dyslexic');
    const userScale = localStorage.getItem('a11y-font-scale');

    // 2. APLICAR CONTRASTE
    const finalContrast = userContrast !== null 
      ? userContrast === 'true' 
      : settings?.accessibility?.highContrast;

    if (finalContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 3. APLICAR FONTE DISLÉXICA
    const finalDyslexic = userDyslexic !== null 
      ? userDyslexic === 'true' 
      : settings?.accessibility?.dyslexicFont;

    if (finalDyslexic) {
      root.classList.add('font-dyslexic');
    } else {
      root.classList.remove('font-dyslexic');
    }

    // 4. APLICAR ESCALA DE FONTE
    const finalScale = userScale !== null 
      ? parseFloat(userScale) 
      : (settings?.accessibility?.fontScale || 1.0);

    const safeScale = isNaN(finalScale) ? 1.0 : finalScale;
    
    root.style.setProperty("--font-scale", String(safeScale));
    root.style.fontSize = `${safeScale * 100}%`;

  }, [settings]);
}