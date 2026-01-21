import { useState, useEffect } from "react";

export function usePersistedState<T>(key: string, initialState: T) {
  // 1. Tenta carregar o valor inicial do localStorage
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialState;
      }
    }
    return initialState;
  });

  // 2. Sempre que o state mudar, salva no localStorage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  // 3. Função para limpar o rascunho manualmente (ex: após salvar)
  const clear = () => {
    localStorage.removeItem(key);
    setState(initialState);
  };

  return [state, setState, clear] as const;
}