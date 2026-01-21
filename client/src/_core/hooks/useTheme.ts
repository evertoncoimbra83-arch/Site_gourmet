// client/src/hooks/useTheme.ts
export function useTheme() {
  const setTheme = (theme: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  };

  const initTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return { setTheme, initTheme };
}
