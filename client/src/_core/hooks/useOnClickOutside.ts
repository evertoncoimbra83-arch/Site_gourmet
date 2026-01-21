import { useEffect, RefObject } from "react";

/**
 * Hook para detectar cliques fora de um elemento específico.
 * @param ref Referência do elemento que deve ser ignorado (ex: o dropdown)
 * @param handler Função a ser disparada quando houver um clique fora
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;

      // Não faz nada se o clique for dentro do próprio elemento 
      // ou se o elemento ainda não existir
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }

      handler(event);
    };

    // Usamos mousedown e touchstart para capturar a intenção de fechar o mais rápido possível
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      // Limpeza obrigatória para evitar vazamento de memória e bugs de execução
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]); // O efeito recarrega se a ref ou o handler mudarem
}