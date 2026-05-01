import React from "react"; // ✅ Adicionado para resolver erro de escopo JSX
import { AdminLoyaltyView } from "./adminLoyalty/view/AdminLoyaltyView";

export default function AdminLoyalty() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <AdminLoyaltyView />
    </div>
  );
}