import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children, storageKey = "vite-ui-theme" }: any) {
  // 1. Busca o tema inicial (LocalStorage ou Light por padrão)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || "light"
  );

  useEffect(() => {
    const root = window.document.documentElement;

    // 2. Remove as classes antigas e aplica a nova
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // 3. Persiste no LocalStorage
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  return context;
};