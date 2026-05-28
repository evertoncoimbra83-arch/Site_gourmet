import { useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { safeNumber } from "@/lib/safe-parse";

export interface AccessibilityPreferences {
  highContrast?: boolean;
  dyslexicFont?: boolean;
  fontScale?: number;
  vLibrasActive?: boolean;
}

interface PublicAccessibilitySettings {
  accessibility?: AccessibilityPreferences;
}

export const LS_A11Y_CONTRAST = "a11y-high-contrast";
export const LS_A11Y_DYSLEXIC = "a11y-font-dyslexic";
export const LS_A11Y_SCALE = "a11y-font-scale";

const FONT_SCALE_MIN = 0.9;
const FONT_SCALE_MAX = 1.5;
const DEFAULT_FONT_SCALE = 1;
const VLIBRAS_SCRIPT_ID = "vlibras-plugin-script";
const VLIBRAS_ROOT_ID = "vlibras-plugin-root";

let vLibrasScriptPromise: Promise<void> | null = null;
let vLibrasInitialized = false;

export function clampFontScale(value: unknown) {
  const normalized = safeNumber(value, DEFAULT_FONT_SCALE);
  if (Number.isNaN(normalized)) return DEFAULT_FONT_SCALE;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, normalized));
}

export function readStoredAccessibilityPreferences() {
  const storedContrast = localStorage.getItem(LS_A11Y_CONTRAST);
  const storedDyslexic = localStorage.getItem(LS_A11Y_DYSLEXIC);
  const storedScale = localStorage.getItem(LS_A11Y_SCALE);

  return {
    hasContrastOverride: storedContrast !== null,
    hasDyslexicOverride: storedDyslexic !== null,
    hasScaleOverride: storedScale !== null,
    highContrast: storedContrast === "true",
    dyslexicFont: storedDyslexic === "true",
    fontScale:
      storedScale !== null
        ? clampFontScale(storedScale)
        : DEFAULT_FONT_SCALE,
  };
}

export function persistAccessibilityPreferences(
  preferences: Pick<
    AccessibilityPreferences,
    "highContrast" | "dyslexicFont" | "fontScale"
  >,
) {
  localStorage.setItem(LS_A11Y_CONTRAST, String(!!preferences.highContrast));
  localStorage.setItem(LS_A11Y_DYSLEXIC, String(!!preferences.dyslexicFont));
  localStorage.setItem(
    LS_A11Y_SCALE,
    String(clampFontScale(preferences.fontScale)),
  );
}

export function clearStoredAccessibilityPreferences() {
  localStorage.removeItem(LS_A11Y_CONTRAST);
  localStorage.removeItem(LS_A11Y_DYSLEXIC);
  localStorage.removeItem(LS_A11Y_SCALE);
}

export function applyAccessibilityToDOM(
  preferences: Pick<
    AccessibilityPreferences,
    "highContrast" | "dyslexicFont" | "fontScale"
  >,
) {
  const root = document.documentElement;
  const fontScale = clampFontScale(preferences.fontScale);

  root.classList.toggle("high-contrast", !!preferences.highContrast);
  root.classList.toggle("font-dyslexic", !!preferences.dyslexicFont);
  root.style.setProperty("--font-scale", String(fontScale));
  root.style.fontSize = `${fontScale * 100}%`;
}

function getVLibrasRoot() {
  let root = document.getElementById(VLIBRAS_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = VLIBRAS_ROOT_ID;
    root.innerHTML = `
      <div vw class="enabled">
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
          <div class="vw-plugin-top-wrapper"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
  }

  return root;
}

function setVLibrasVisibility(visible: boolean) {
  const root = getVLibrasRoot();
  root.style.display = visible ? "" : "none";
}

function loadVLibrasScript() {
  if (typeof window === "undefined") return Promise.resolve();

  if (vLibrasScriptPromise) return vLibrasScriptPromise;

  const existingScript = document.getElementById(
    VLIBRAS_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (existingScript?.dataset.loaded === "true") {
    vLibrasScriptPromise = Promise.resolve();
    return vLibrasScriptPromise;
  }

  vLibrasScriptPromise = new Promise((resolve, reject) => {
    const script = existingScript || document.createElement("script");
    script.id = VLIBRAS_SCRIPT_ID;
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      vLibrasScriptPromise = null;
      reject(new Error("Falha ao carregar o script do VLibras."));
    };

    if (!existingScript) {
      document.body.appendChild(script);
    }
  });

  return vLibrasScriptPromise;
}

async function syncVLibras(active: boolean) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!active) {
    setVLibrasVisibility(false);
    return;
  }

  setVLibrasVisibility(true);

  try {
    await loadVLibrasScript();

    const globalWindow = window as Window & {
      VLibras?: { Widget: new (baseUrl: string) => unknown };
    };

    if (!vLibrasInitialized && globalWindow.VLibras?.Widget) {
      new globalWindow.VLibras.Widget("https://vlibras.gov.br/app");
      vLibrasInitialized = true;
    }
  } catch (error) {
    console.error(error);
    setVLibrasVisibility(false);
  }
}

export function useAccessibility() {
  const { data: settings } = trpc.public.getPublicSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const stored = readStoredAccessibilityPreferences();
    const defaults: AccessibilityPreferences = settings?.accessibility ?? {};

    const mergedPreferences = {
      highContrast: stored.hasContrastOverride
        ? stored.highContrast
        : !!defaults.highContrast,
      dyslexicFont: stored.hasDyslexicOverride
        ? stored.dyslexicFont
        : !!defaults.dyslexicFont,
      fontScale: stored.hasScaleOverride
        ? stored.fontScale
        : clampFontScale(defaults.fontScale),
      vLibrasActive: !!defaults.vLibrasActive,
    };

    applyAccessibilityToDOM(mergedPreferences);
    void syncVLibras(mergedPreferences.vLibrasActive);
  }, [settings]);
}
