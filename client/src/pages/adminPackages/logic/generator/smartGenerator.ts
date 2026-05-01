// client/src/pages/adminPackages/logic/generator/smartGenerator.ts

import {
  CandidateDish,
  GeneratedSlot,
  GeneratorInput,
  GeneratorResult,
  RawAccompanimentRule,
} from "./package-generator-types";
import { buildSlots } from "./package-selector";

export type Slot = GeneratedSlot;
export type SlotGroup = GeneratedSlot["groups"][number];
export type Dish = CandidateDish;

/**
 * 🛠️ Normalizador de Grupos
 * Garante que os grupos gerados mantenham os metadados corretos das regras (labels),
 * mas preserva EXATAMENTE a lista de IDs que foi sorteada e limitada pelo seletor.
 */
function normalizeGeneratedSlotGroups(
  slot: GeneratedSlot,
  rawAccompanimentRules: RawAccompanimentRule[]
): GeneratedSlot {
  const rulesById = new Map(
    rawAccompanimentRules.map((rule) => [String(rule.id), rule] as const)
  );

  // Mapeamos os grupos para garantir que o label esteja correto conforme o cadastro
  const normalizedGroups = (slot.groups || []).map((group) => {
    const matchedRule = rulesById.get(String(group.id));
    
    return {
      ...group,
      id: matchedRule ? String(matchedRule.id) : String(group.id),
      customLabel: matchedRule?.label || group.customLabel || "Acompanhamento",
      // 🚨 IMPORTANTE: Não fazemos merge. Usamos o optionIds que veio do sorteio no buildSlots.
      optionIds: group.optionIds || []
    };
  });

  return {
    ...slot,
    groups: normalizedGroups,
  };
}

/**
 * 🚀 Gerador de Pacote Inteligente
 * Orquestra a seleção de pratos e a normalização de regras de acompanhamento.
 */
export function generateSmartPackage(input: GeneratorInput): GeneratorResult {
  const { persona, dishes, slots: drafts, rawAccompanimentRules } = input;

  console.group(`SmartGenerator: Geracao [${persona.label}]`);
  console.log("1. Input Data:", {
    totalDishes: dishes.length,
    totalSlotsSolicitados: drafts.length,
    personaGoal: persona.goal,
  });

  if (dishes.length === 0) {
    console.error("Erro: Lista de pratos (dishes) está vazia.");
  }

  // 1. O buildSlots realiza a lógica pesada (Constraints + Scoring + Sorteio de Accs)
  // 2. O map seguinte apenas limpa as etiquetas (labels)
  const generatedSlots = buildSlots(input).map((slot) =>
    normalizeGeneratedSlotGroups(slot, rawAccompanimentRules || [])
  );

  const warnings: string[] = [];
  const failedSlots = generatedSlots.filter((slot) => slot.dishIds.length === 0);

  if (failedSlots.length > 0) {
    console.warn(`Falha em ${failedSlots.length} slots.`);

    const firstFailedIndex = generatedSlots.findIndex(s => s.dishIds.length === 0);
    const sampleFail = drafts[firstFailedIndex];

    console.log("Provável causa do descarte no primeiro slot falho:", {
      tamanhoExigido: sampleFail?.requiredSizeId,
      categoriasPermitidas: sampleFail?.allowedCategories || "Todas",
    });

    warnings.push(
      `O sistema não encontrou pratos suficientes para ${failedSlots.length} marmitas com os filtros aplicados (Tamanho/Categoria).`
    );
  }

  console.log(
    "3. Geração finalizada com sucesso:",
    generatedSlots.length,
    "slots."
  );
  console.groupEnd();

  return {
    slots: generatedSlots,
    warnings,
  };
}