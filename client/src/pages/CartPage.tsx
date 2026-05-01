import React from "react"; // ✅ Adicionado para resolver o erro 'React' must be in scope
import { CartPageView } from "./cart/view/CartPageview"; // Removido .tsx do import
import { SEO } from "@/components/SEO";

export default function CartPage() {
  /**
   * 💡 NOTA: Não passamos props aqui.
   * O componente CartPageView já gerencia sua própria lógica 
   * internamente chamando o useCartPageLogic().
   */
  return (
    <>
      <SEO title="Seu Carrinho | Gourmet Saudável" />
      <CartPageView /> 
    </>
  );
}