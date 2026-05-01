import React from "react"; // ✅ Adicionado para satisfazer a regra do linter
import { AdminPaymentMethodsView } from "./adminPaymentMethods/view/AdminPaymentMethodsView";

export default function AdminPaymentMethods() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <AdminPaymentMethodsView />
    </div>
  );
}