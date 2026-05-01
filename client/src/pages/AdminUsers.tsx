import React from "react"; // ✅ Adicionado para satisfazer a regra do linter
import { AdminUsersView } from "./adminUsers/view/AdminUsersView";

export default function AdminUsers() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <AdminUsersView />
    </div>
  );
}