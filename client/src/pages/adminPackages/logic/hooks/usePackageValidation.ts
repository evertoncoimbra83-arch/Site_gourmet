// client/src/pages/adminPackages/logic/usePackageValidation.ts

import { PackageFormData } from "./../../components/PackageDrawer";

interface Slot {
  name: string;
  dishIds: string[];
}

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  tab: "geral" | "estrutura" | "regras";
}

export function usePackageValidation(formData: Partial<PackageFormData>, slots: Slot[]) {
  const errors: ValidationError[] = [];

  // Validações de Dados Gerais
  if (!formData.name) {
    errors.push({ type: "error", message: "O pacote precisa de um nome.", tab: "geral" });
  }
  if (!formData.image_url) {
    errors.push({ type: "warning", message: "O pacote está sem imagem de capa.", tab: "geral" });
  }
  if (Number(formData.base_price) <= 0) {
    errors.push({ type: "error", message: "O preço de venda deve ser maior que zero.", tab: "geral" });
  }

  // Validações de Estrutura (Slots)
  if (slots.length === 0) {
    errors.push({ type: "error", message: "Adicione pelo menos uma marmita (slot).", tab: "estrutura" });
  }

  slots.forEach((slot, idx) => {
    if (!slot.name) {
      errors.push({ type: "error", message: `A marmita ${idx + 1} está sem nome.`, tab: "estrutura" });
    }
    if (slot.dishIds.length === 0) {
      errors.push({ type: "error", message: `A marmita "${slot.name || idx + 1}" não tem pratos liberados.`, tab: "estrutura" });
    }
  });

  // Validações de Regras
  if (!formData.number_of_options || Number(formData.number_of_options) <= 0) {
    errors.push({ type: "error", message: "Defina a quantidade total de marmitas do kit.", tab: "regras" });
  }

  return {
    errors,
    isValid: !errors.some(e => e.type === "error"),
    hasWarnings: errors.some(e => e.type === "warning")
  };
}