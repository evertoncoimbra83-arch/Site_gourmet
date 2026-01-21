import { useEffect } from "react";
import { trpc } from "@/_core/trpc";

export function useAccessibility() {
  // ✅ CORREÇÃO CRÍTICA: Mudamos de 'admin.storeSettings.get' para a rota pública
  // Isso remove o erro 403 Forbidden que aparecia em todas as páginas.
  const { data: settings } = trpc.public.getStoreSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 30, // 30 minutos de cache
    retry: false,              // Se falhar uma vez, não fica tentando (evita spam no console)
    refetchOnWindowFocus: false // Não refaz a busca ao trocar de aba
  });

  useEffect(() => {
    const root = document.documentElement;

    // 1. LER SESSÃO (LocalStorage)
    const userContrast = localStorage.getItem('a11y-high-contrast');
    const userDyslexic = localStorage.getItem('a11y-font-dyslexic');
    const userScale = localStorage.getItem('a11y-font-scale');

    // 2. DEFINIR CONTRASTE
    const finalContrast = userContrast !== null 
      ? userContrast === 'true' 
      : settings?.accessibility?.highContrast;

    root.classList.toggle('high-contrast', !!finalContrast);

    // 3. DEFINIR FONTE DISLÉXICA
    const finalDyslexic = userDyslexic !== null 
      ? userDyslexic === 'true' 
      : settings?.accessibility?.dyslexicFont;

    root.classList.toggle('font-dyslexic', !!finalDyslexic);

    // 4. ESCALA DE FONTE
    // Prioridade: 1º LocalStorage (usuário), 2º Banco (Admin), 3º Padrão (1.0)
    const finalScale = userScale !== null 
      ? parseFloat(userScale) 
      : (settings?.accessibility?.fontScale || 1.0);

    root.style.setProperty("--font-scale", String(finalScale));
    root.style.fontSize = `${finalScale * 100}%`;

  }, [settings]);
}