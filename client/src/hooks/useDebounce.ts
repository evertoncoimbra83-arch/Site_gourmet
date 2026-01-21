// client/src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * Hook para debouncing de valores. 
 * Retorna um valor que só é atualizado após um atraso (delay) desde a última mudança.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configura um timer que atualiza debouncedValue
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timer anterior se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}