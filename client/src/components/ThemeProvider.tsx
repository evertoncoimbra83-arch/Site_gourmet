import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  storageKey = "vite-ui-theme",
  defaultTheme = "light"
}: ThemeProviderProps) {
  // Força o tema claro (light) temporariamente
  const theme: Theme = "light";
  const setTheme = () => {};

  useEffect(() => {
    const root = window.document.documentElement;

    // Garante que a classe dark seja removida e a classe light esteja presente
    root.classList.remove("dark");
    root.classList.add("light");

    // Mantém a preferência no local storage como light
    localStorage.setItem(storageKey, "light");
  }, [storageKey]);

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