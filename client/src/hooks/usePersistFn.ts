import { useRef } from 'react';

/**
 * Hook para persistir a referência de uma função, garantindo que ela nunca mude,
 * mas sempre execute a versão mais recente da função original.
 */
export function usePersistFn<Args extends unknown[], ReturnValue>(
  fn: (...args: Args) => ReturnValue
): (...args: Args) => ReturnValue {
  const fnRef = useRef(fn);

  // Mantém a referência atualizada a cada render
  fnRef.current = fn;

  const persistFn = useRef<(...args: Args) => ReturnValue>();

  // Inicialização preguiçosa (Lazy initialization) da função estável
  if (!persistFn.current) {
    persistFn.current = (...args: Args): ReturnValue => {
      return fnRef.current(...args);
    };
  }

  // O cast garante ao compilador que a função já foi criada no bloco if acima
  return persistFn.current as (...args: Args) => ReturnValue;
}