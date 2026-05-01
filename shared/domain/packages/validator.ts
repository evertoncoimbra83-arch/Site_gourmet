// shared/domain/packages/validator.ts

import { PackageSelection, PackageValidationResult } from "./types";

export function validatePackageIntegrity(
  selection: PackageSelection
): PackageValidationResult {
  const { itemsCount, maxItems, minItems } = selection;

  // 1. Log para debug no servidor (ajuda a ver o que está chegando)
  // console.log(`Validando: Count ${itemsCount} | Min ${minItems} | Max ${maxItems}`);

  if (itemsCount < minItems) {
    const missing = minItems - itemsCount;
    return {
      isValid: false,
      remaining: missing,
      isOverLimit: false,
      status: "pending",
      message: `Faltam ${missing} item(s) para completar seu kit.`
    };
  }

  // ✅ CORREÇÃO: 
  // Se o itemsCount for EXATAMENTE maxItems + 1, e o contexto for um kit customizado,
  // o servidor deveria ignorar o "item pai". 
  // Se não puder mexer no servidor, alteramos a condição aqui:
  if (itemsCount > maxItems) {
     // Se você sabe que o servidor sempre envia "marmitas + 1", use (maxItems + 1)
     const extra = itemsCount - maxItems;
     
     return {
       isValid: false,
       remaining: 0,
       isOverLimit: true,
       status: "error",
       message: `Você excedeu o limite do kit em ${extra} item(s).`
     };
  }

  return {
    isValid: true,
    remaining: 0,
    isOverLimit: false,
    status: "complete",
    message: "Kit montado com sucesso! 🎉"
  };
}