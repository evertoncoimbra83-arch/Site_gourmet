import React from "react"; // ✅ Adicionado para satisfazer a regra react-in-jsx-scope
import { AdminMediaView } from "./adminMedia/view/AdminMediaView";

export default function AdminMediaManager() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <AdminMediaView />
    </div>
  );
}