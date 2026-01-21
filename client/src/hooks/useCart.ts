import { useCartContext } from "@/_core/CartContext";

// Agora o hook apenas redireciona para o contexto global.
// Isso garante que Header, DishSelector e CartPage vejam os mesmos dados.
export const useCart = () => {
  return useCartContext();
};

export type { LocalCartItem } from "@/_core/CartContext";