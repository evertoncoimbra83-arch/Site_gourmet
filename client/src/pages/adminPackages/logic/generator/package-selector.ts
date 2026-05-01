// client/src/pages/adminPackages/logic/generator/package-selector.ts

import { 
  GeneratorInput, 
  GeneratedSlot 
} from "./package-generator-types";
import { isDishValidForSlot } from "./package-constraints";
import { scoreDishForSlot } from "./package-scoring";

/**
 * 🎯 Seletor de Pratos (O Tomador de Decisão)
 * Percorre os slots desejados e escolhe o melhor candidato para cada um,
 * realizando também o sorteio aleatório de acompanhamentos conforme o limite.
 */
export function buildSlots(input: GeneratorInput): GeneratedSlot[] {
  const { persona, dishes, slots } = input;
  const usedDishIds = new Set<string>();
  const usedProteinKeys = new Set<string>();
  const result: GeneratedSlot[] = [];

  for (const slot of slots) {
    const validCandidates = dishes.filter((dish) => isDishValidForSlot(dish, slot, persona).valid);

    const scoredCandidates = validCandidates
      .map((dish) => {
        const { score, reasons } = scoreDishForSlot(dish, slot, persona, { usedDishIds, usedProteinKeys });
        return { dish, score, reasons };
      })
      .sort((a, b) => b.score - a.score);

    const numOptions = slot.numOptions || 1; 
    const winners = scoredCandidates.slice(0, numOptions);

    if (winners.length === 0) {
      continue;
    }

    winners.forEach(w => {
      usedDishIds.add(w.dish.id);
      if (w.dish.proteinKey) usedProteinKeys.add(w.dish.proteinKey);
    });

    // ✅ Definição do Tamanho (Size)
    const selectedSizeId = slot.requiredSizeId 
      ? String(slot.requiredSizeId) 
      : (winners[0].dish.sizeIds && winners[0].dish.sizeIds.length > 0 
          ? String(winners[0].dish.sizeIds[0]) 
          : undefined);

    // ✅ Construção dos Grupos de Acompanhamentos com Sorteio Aleatório
    const accompanimentGroups = (slot.requiredGroupIds || []).map((groupId) => {
      const accRule = input.rawAccompanimentRules?.find(r => r.id === groupId);
      const allOptionIds = accRule?.optionIds || [];

      // 🎲 Lógica de Aleatoriedade: Embaralha as opções disponíveis
      const shuffledOptions = [...allOptionIds].sort(() => Math.random() - 0.5);

      // 📏 Respeita o limite definido na UI (maxAccompaniments)
      // Se não definido, o padrão é 1 para não lotar a marmita.
      const limit = slot.maxAccompaniments || 1;
      const selectedOptions = shuffledOptions.slice(0, limit);

      return {
        id: String(groupId),
        customLabel: accRule?.label || "Escolha seu acompanhamento", 
        optionIds: selectedOptions 
      };
    });

    result.push({
      name: slot.name,
      dishIds: winners.map(w => w.dish.id), 
      sizeId: selectedSizeId,
      groups: accompanimentGroups,
      reasons: winners[0].reasons,
    });
  }

  return result;
}