// client/src/pages/adminPackages/logic/generator/package-constraints.ts

import { CandidateDish, PackagePersona, SlotDraft } from "./package-generator-types";

/**
 * 🛡️ Validador de Regras Duras (Constraints)
 * Se retornar false, o prato é descartado para aquele slot.
 */
export function isDishValidForSlot(
  dish: CandidateDish,
  slot: SlotDraft,
  persona: PackagePersona
): { valid: boolean; reason?: string } {

  // 1. Filtro de Categorias do Slot (definidas pelo admin na UI)
  // ✅ Compara categoryId vs categoryId — ambos strings agora
  if (
    slot.allowedCategoryIds?.length &&
    !slot.allowedCategoryIds.includes(dish.categoryId || "")
  ) {
    return {
      valid: false,
      reason: `Categoria "${dish.categoryName}" não está na lista permitida para este slot`,
    };
  }

  // 2. Filtro de Categorias Permitidas pela Persona
  if (
    persona.constraints.allowedCategoryIds?.length &&
    !persona.constraints.allowedCategoryIds.includes(dish.categoryId || "")
  ) {
    return {
      valid: false,
      reason: `Categoria "${dish.categoryName}" não é permitida para o perfil "${persona.label}"`,
    };
  }

  // 3. Filtro de Categorias Bloqueadas pela Persona
  if (persona.constraints.blockedCategoryIds?.includes(dish.categoryId || "")) {
    return {
      valid: false,
      reason: `Categoria "${dish.categoryName}" está bloqueada para o perfil "${persona.label}"`,
    };
  }

  // 4. ✅ Validação de Tamanho corrigida — sizeIds é um array
  // O prato é válido se ele TIVER o tamanho solicitado entre seus tamanhos disponíveis
  if (slot.requiredSizeId) {
    if (dish.sizeIds.length === 0) {
      // Prato sem nenhum tamanho vinculado — aceita (sem restrição)
      // Você pode mudar para `return { valid: false }` se quiser ser mais estrito
    } else if (!dish.sizeIds.includes(String(slot.requiredSizeId))) {
      return {
        valid: false,
        reason: `Prato não disponível no tamanho solicitado (sizeId: ${slot.requiredSizeId})`,
      };
    }
  }

  // 5. Restrição Nutricional — Proteína mínima
  if (
    persona.constraints.minProtein != null &&
    dish.protein < persona.constraints.minProtein
  ) {
    return {
      valid: false,
      reason: `Proteína (${dish.protein}g) abaixo do mínimo de ${persona.constraints.minProtein}g`,
    };
  }

  // 6. Restrição Nutricional — Carboidrato máximo
  if (
    persona.constraints.maxCarbs != null &&
    dish.carbs > persona.constraints.maxCarbs
  ) {
    return {
      valid: false,
      reason: `Carboidrato (${dish.carbs}g) acima do limite de ${persona.constraints.maxCarbs}g`,
    };
  }

  return { valid: true };
}