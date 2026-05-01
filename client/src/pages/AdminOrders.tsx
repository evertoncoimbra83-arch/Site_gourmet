import React from "react"; // ✅ Adicionado para satisfazer a regra do ESLint
import { AdminOrdersView } from "./adminOrders/view/AdminOrdersView";

/**
 * 📦 Componente Raiz da Página de Pedidos
 * Este arquivo atua como o entry-point, fornecendo o container principal
 * e renderizando a View que contém a tabela e a lógica de pedidos.
 */
export default function AdminOrders() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0 min-h-screen bg-transparent text-left">
      {/* Renderiza a View principal. 
          Se houver erro de compilação aqui, verifique se o arquivo 
          ./adminOrders/view/AdminOrdersView.tsx existe.
      */}
      <AdminOrdersView />
    </div>
  );
}