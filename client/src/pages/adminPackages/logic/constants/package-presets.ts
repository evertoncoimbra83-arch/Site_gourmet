// client/src/pages/adminPackages/logic/package-presets.ts

export interface PackagePreset {
  id: string;
  name: string;
  description: string;
  category: "Padrão" | "Inteligência BI" | "Sazonal";
  numberOfOptions: number;
  type: "static" | "dynamic"; // static = cria slots vazios, dynamic = preenche com pratos
}

export const PACKAGE_PRESETS: PackagePreset[] = [
  {
    id: "kit-10-standard",
    name: "Kit 10 Pratos (Vazio)",
    description: "Cria 10 slots com nomes padrão para você preencher manualmente.",
    category: "Padrão",
    numberOfOptions: 10,
    type: "static"
  },
  {
    id: "bi-top-10-performance",
    name: "🚀 Kit Best Sellers (BI)",
    description: "Cria 10 slots já preenchidos com os pratos mais vendidos dos últimos 30 dias.",
    category: "Inteligência BI",
    numberOfOptions: 10,
    type: "dynamic"
  }
];