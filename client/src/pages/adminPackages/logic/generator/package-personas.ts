// client/src/pages/adminPackages/logic/generator/package-personas.ts

import { PackagePersona } from "./package-generator-types";

/**
 * 🏛️ DEFAULT_PACKAGE_PERSONAS
 * Estas são as personas padrão do sistema. 
 * Elas servirão como base para o SEED do banco de dados e como 
 * fallback caso a API falhe ou o banco esteja vazio.
 */
export const DEFAULT_PACKAGE_PERSONAS: Record<string, PackagePersona> = {
  balanced: {
    id: "balanced",
    label: "Equilibrado",
    goal: "balanced",
    weights: {
      nutrition: 3,
      categoryMatch: 2,
      sizeMatch: 2,
      popularity: 2,
      variety: 4,
      repetitionPenalty: 5,
    },
    constraints: {
      avoidRepeatedProtein: true,
    },
  },

  high_protein: {
    id: "high_protein",
    label: "Alta Proteína",
    goal: "high_protein",
    weights: {
      nutrition: 5,
      categoryMatch: 2,
      sizeMatch: 2,
      popularity: 1,
      variety: 2,
      repetitionPenalty: 3,
    },
    constraints: {
      minProtein: 25,
      avoidRepeatedProtein: true,
    },
  },

  low_carb: {
    id: "low_carb",
    label: "Low Carb",
    goal: "low_carb",
    weights: {
      nutrition: 5,
      categoryMatch: 2,
      sizeMatch: 2,
      popularity: 1,
      variety: 2,
      repetitionPenalty: 3,
    },
    constraints: {
      maxCarbs: 15,
      avoidRepeatedProtein: true,
    },
  },

  economical: {
    id: "economical",
    label: "Custo-Benefício",
    goal: "economical",
    weights: {
      nutrition: 1,
      categoryMatch: 1,
      sizeMatch: 5,
      popularity: 4,
      variety: 2,
      repetitionPenalty: 2,
      cost: 5
    },
    constraints: {
      avoidRepeatedProtein: false,
    },
  },
};

/**
 * 🔄 Fallback temporário para manter o SmartBuilder funcionando
 * enquanto a Fase 7 (Migração para API) não é concluída.
 */
export const PACKAGE_PERSONAS = DEFAULT_PACKAGE_PERSONAS;