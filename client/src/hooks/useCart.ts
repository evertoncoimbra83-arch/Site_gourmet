import { useCart as useCartFromContext } from "@/_core/CartContext";

/**
 * ✅ Hook de Redirecionamento
 * Garante que Header, DishSelector e CartPage vejam os mesmos dados
 * consumindo o hook exportado pelo CartContext.
 */
export const useCart = () => {
  return useCartFromContext();
};

export type { LocalCartItem } from "@/_core/CartContext";