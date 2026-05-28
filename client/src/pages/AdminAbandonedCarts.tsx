// client/src/pages/AdminAbandonedCarts.tsx
import React from "react";
import { AdminAbandonedView } from "./adminAbandoned/view/AdminAbandonedView";

/**
 * 🛒 Página de Gestão de Carrinhos Abandonados
 * Esta página utiliza a arquitetura Logic/Component/View.
 * A renderização principal reside em: ./adminAbandoned/view/AdminAbandonedView
 */
export default function AdminAbandonedCarts() {
  return <AdminAbandonedView />;
}