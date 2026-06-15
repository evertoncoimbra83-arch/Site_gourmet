import React from "react"; // ✅ Adicionado para resolver erro de escopo JSX
// ✅ CORREÇÃO: Importado como DEFAULT (sem as chaves) para bater com o SyntaxError anterior
import  AdminCouponsView  from "./adminCoupons/view/AdminCouponsView";

export default function AdminCoupons() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <AdminCouponsView />
    </div>
  );
}
