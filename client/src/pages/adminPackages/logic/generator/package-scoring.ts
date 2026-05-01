// client/src/pages/adminPackages/logic/generator/package-scoring.ts

import { CandidateDish, PackagePersona, SlotDraft } from "./package-generator-types";

interface ScoreContext {
  usedDishIds: Set<string>;
  usedProteinKeys: Set<string>;
  // ✅ Adicionamos o "Conhecimento Híbrido" aqui
  externalInsights?: Record<string, { bonus: number; reason: string }>;
  userHistoryPenalties?: Record<string, number>; 
}

export function scoreDishForSlot(
  dish: CandidateDish,
  slot: SlotDraft,
  persona: PackagePersona,
  context: ScoreContext
): { score: number; reasons: string[] } {
  let score = 50; 
  const reasons: string[] = [];
  const { weights, goal } = persona;

  // 1. Match Nutricional Base (O que já fizemos)
  let nutritionScore = 0;
  if (goal === "high_protein") nutritionScore = (dish.protein - 20) * 2;
  else if (goal === "low_carb") nutritionScore = (20 - dish.carbs) * 2;
  else if (goal === "balanced") nutritionScore = (15 - Math.abs(dish.protein - dish.carbs)) * 1.5;
  
  score += nutritionScore * weights.nutrition;
  if (nutritionScore > 0) reasons.push(`Perfil nutricional adequado para ${persona.label}`);

  // 2. 🧠 APRENDIZADO ESTRATÉGICO (Importado de fora)
  // Se você importou que "Cúrcuma está em alta", o prato com cúrcuma ganha bônus aqui
  if (context.externalInsights?.[dish.id]) {
    const insight = context.externalInsights[dish.id];
    score += insight.bonus;
    reasons.push(`✨ Insight: ${insight.reason}`);
  }

  // 3. 📉 APRENDIZADO ORGÂNICO (Suas ações no sistema)
  // Se você costuma remover este prato deste tipo de kit, ele perde pontos
  if (context.userHistoryPenalties?.[dish.id]) {
    const penalty = context.userHistoryPenalties[dish.id];
    score -= penalty;
    reasons.push("Relevância ajustada conforme suas edições anteriores");
  }

  // 4. Variedade e Repetição
  if (context.usedDishIds.has(dish.id)) {
    score -= (50 * weights.repetitionPenalty);
    reasons.push("Já presente no kit");
  }

  if (persona.constraints.avoidRepeatedProtein && context.usedProteinKeys.has(dish.proteinKey)) {
    score -= (20 * weights.variety);
    reasons.push(`Evitando repetição de ${dish.proteinKey}`);
  }

  return { score, reasons };
}