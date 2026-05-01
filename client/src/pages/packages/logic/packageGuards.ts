// client/src/pages/packages/logic/packageGuards.ts
import { PackageMachineContext, PackageItem } from "./packageMachine.types";

/**
 * Verifica se a quantidade de marmitas selecionadas atingiu a capacidade do pacote
 */
export const isSelectionFull = (context: PackageMachineContext): boolean => {
  return Number(context.selectedCount) === Number(context.capacity);
};

/**
 * Verifica se ainda há espaço para adicionar mais marmitas
 */
export const hasSpaceLeft = (context: PackageMachineContext): boolean => {
  return Number(context.selectedCount) < Number(context.capacity);
};

/**
 * ✅ VALIDAÇÃO DE MARMITA:
 * Verifica se uma marmita específica atingiu todos os critérios mínimos.
 */
export const isMealComplete = (meal: PackageItem): boolean => {
  // 1. Se não escolheu o prato, a marmita está incompleta
  if (!meal.dishId) return false;

  // 2. Se não exige acompanhamentos ou não tem grupos definidos, está completa pelo prato
  if (!meal.requiresAccompaniments || !meal.accompanimentGroups || meal.accompanimentGroups.length === 0) {
    return true;
  }

  // 3. Valida cada grupo de acompanhamento individualmente
  return meal.accompanimentGroups.every(group => {
    const minRequired = Number(group.min || 0);
    
    // Se o mínimo for zero, este grupo já está válido
    if (minRequired === 0) return true;

    // Filtra as seleções que pertencem a este grupo
    const selectedInGroup = (meal.selectedAccompaniments || []).filter(acc => {
      const accGroupId = String(acc.groupId);
      const targetGroupId = String(group.id);
      
      // Validação por ID ou nome do grupo (fallback) para evitar quebras por tipos diferentes (int vs string)
      return accGroupId === targetGroupId || acc.groupName === group.name;
    }).length;

    // A marmita só está completa se o selecionado for maior ou igual ao mínimo exigido
    return selectedInGroup >= minRequired;
  });
};

/**
 * Verifica se todos os itens dentro da lista de selecionados estão configurados corretamente
 */
export const allItemsConfigured = (selectedItems: PackageItem[]): boolean => {
  if (!selectedItems || selectedItems.length === 0) return false;
  return selectedItems.every(item => isMealComplete(item));
};

/**
 * ✅ FINALIZADOR:
 * Decide se o pacote como um todo está pronto para ir para o carrinho.
 */
export const canSubmitPackage = (
  context: PackageMachineContext, 
  selectedItems: PackageItem[]
): boolean => {
  const full = isSelectionFull(context);
  const configured = allItemsConfigured(selectedItems);
  
  // Debug interno caso precise monitorar no console porque o botão não libera
  // console.log(`[Guard] Full: ${full} | Configured: ${configured} | Busy: ${context.isBusy}`);

  return full && configured && !context.isBusy;
};