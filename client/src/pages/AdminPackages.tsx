import React from "react"; // ✅ O ESLint exige isso aqui
import { AdminPackagesView } from "./adminPackages/view/AdminPackagesView";

export default function AdminPackages() {
  return (
    <div className="container mx-auto py-6 md:py-10 px-4 md:px-0">
      <AdminPackagesView />
    </div>
  );
}