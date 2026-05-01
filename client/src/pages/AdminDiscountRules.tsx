import React from "react"; // ✅ Adicionado para satisfazer a regra do linter
import { AdminDiscountRulesView } from "./adminDiscountRules/view/AdminDiscountRulesView";

export default function AdminDiscountRules() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <AdminDiscountRulesView />
    </div>
  );
}