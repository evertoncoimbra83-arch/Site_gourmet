// client/src/pages/packages/context/PackageContext.tsx

import React, { createContext, useContext, ReactNode } from "react";
import { usePackageViewModel } from "../logic/usePackageViewModel";

// ✅ Sincronizado com o retorno real do usePackageViewModel
type PackageContextData = ReturnType<typeof usePackageViewModel>;

const PackageContext = createContext<PackageContextData | undefined>(undefined);

interface PackageProviderProps {
  children: ReactNode;
  packageData: {
    id: string;
    name: string;
    capacity: number;
    price?: number;
    image?: string;
  };
}

export function PackageProvider({ children, packageData }: PackageProviderProps) {
  const viewModel = usePackageViewModel(packageData);

  return (
    <PackageContext.Provider value={viewModel}>
      {children}
    </PackageContext.Provider>
  );
}

// Hook para facilitar o consumo nos componentes
export function usePackage() {
  const context = useContext(PackageContext);
  if (!context) {
    throw new Error("usePackage must be used within a PackageProvider");
  }
  return context;
}