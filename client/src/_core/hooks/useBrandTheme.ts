import { useEffect } from "react";
import { trpc } from "@/_core/trpc";

// Função para validar se a string é um código hexadecimal de cor válido
function isValidHex(color?: string): boolean {
  if (!color) return false;
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

export function useBrandTheme() {
  const { data: settings } = trpc.public.getPublicSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 30, // 30 minutos de cache
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !settings) return;

    const root = document.documentElement;

    // ✅ Cast seguro para evitar erro de propriedade inexistente no Union type de fallback
    const typedSettings = settings as {
      siteTheme?: Record<string, string>;
      favicon?: string;
    };

    const theme = typedSettings.siteTheme;

    // 1. Injetar e Validar Variáveis Cromáticas (Claras e Escuras)
    if (theme && typeof theme === "object") {
      if (isValidHex(theme.primary)) {
        root.style.setProperty("--brand-primary", theme.primary);
      }
      if (isValidHex(theme.accent)) {
        root.style.setProperty("--brand-accent", theme.accent);
      }
      if (isValidHex(theme.background)) {
        root.style.setProperty("--brand-background", theme.background);
      }
      if (isValidHex(theme.foreground)) {
        root.style.setProperty("--brand-foreground", theme.foreground);
      }

      // ✅ Injeção de variáveis escuras adicionadas na Sprint P1-C
      if (isValidHex(theme.backgroundDark)) {
        root.style.setProperty("--brand-background-dark", theme.backgroundDark);
      }
      if (isValidHex(theme.foregroundDark)) {
        root.style.setProperty("--brand-foreground-dark", theme.foregroundDark);
      }
      if (isValidHex(theme.surfaceDark)) {
        root.style.setProperty("--brand-surface-dark", theme.surfaceDark);
      }
      if (isValidHex(theme.borderDark)) {
        root.style.setProperty("--brand-border-dark", theme.borderDark);
      }
    }

    // 2. Injetar Favicon Dinâmico
    const faviconUrl = typedSettings.favicon;
    if (faviconUrl && typeof faviconUrl === "string" && faviconUrl.trim().length > 5) {
      // Procurar todos os links de favicon existentes
      let links = document.querySelectorAll("link[rel*='icon']") as NodeListOf<HTMLLinkElement>;

      if (links.length === 0) {
        // Criar link padrão de favicon caso não exista nenhum no HEAD
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = faviconUrl;
        document.head.appendChild(newLink);
      } else {
        // Atualizar todos os links existentes
        links.forEach((link) => {
          link.href = faviconUrl;
        });
      }

      // Procurar e atualizar apple-touch-icon, se existir
      const appleTouch = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
      if (appleTouch) {
        appleTouch.href = faviconUrl;
      }
    }

    // 3. Gerenciamento do Dark Mode do Storefront (P1-C) - Modo Escuro Desativado Temporariamente
    const savedMode = "light";

    const updateThemeClass = (isDark: boolean) => {
      root.classList.remove("public-dark");
    };

    updateThemeClass(false);
    localStorage.setItem("public-theme-mode", "light");

    // 4. Rotina de Limpeza (Cleanup) ao desmontar o PublicLayout (ir para o Admin)
    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-accent");
      root.style.removeProperty("--brand-background");
      root.style.removeProperty("--brand-foreground");
      root.style.removeProperty("--brand-background-dark");
      root.style.removeProperty("--brand-foreground-dark");
      root.style.removeProperty("--brand-surface-dark");
      root.style.removeProperty("--brand-border-dark");

      root.classList.remove("public-dark");
    };
  }, [settings]);
}

export default useBrandTheme;
