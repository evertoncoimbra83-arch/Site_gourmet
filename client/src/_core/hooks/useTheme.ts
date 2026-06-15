// client/src/hooks/useTheme.ts
export function useTheme() {
  const setTheme = (theme: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    localStorage.setItem("theme", "light");
  };

  const initTheme = () => {
    setTheme("light");
  };

  return { setTheme, initTheme };
}
