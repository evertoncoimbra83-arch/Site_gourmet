import crypto from "crypto";

// --- INTERFACES DE TIPAGEM ---

interface CatalogOption {
  id: number | string;
  name: string;
  priceModifier?: number | string;
}

interface CatalogGroup {
  id: number | string;
  options: CatalogOption[];
}

interface CatalogSize {
  id: number | string;
  name: string;
  accompanimentGroups: CatalogGroup[];
}

interface CatalogDish {
  id: number | string;
  name: string;
  availableSizes: CatalogSize[];
}

interface AiAccompaniment {
  groupId: number | string;
  optionId: number | string;
}

interface AiOption {
  dishId: number | string;
  sizeId: number | string;
  selectedAccompaniments?: AiAccompaniment[];
}

interface AiGroup {
  name?: string;
  options: AiOption[];
}

interface AiMeal {
  name?: string;
  notes?: string;
  groups: AiGroup[];
}

export function normalizeAiPrescriptionResult(aiData: unknown, catalogTree: CatalogDish[]) {
  const normalizedMeals = [];

  // Garante que aiData é um array de AiMeal
  const mealsToProcess = Array.isArray(aiData) ? (aiData as AiMeal[]) : [];

  for (const meal of mealsToProcess) {
    const normalizedGroups = [];

    for (const group of meal.groups || []) {
      const normalizedOptions = [];

      for (const opt of group.options || []) {
        // 🔒 VALIDAÇÃO 1: O Prato existe?
        const realDish = catalogTree.find(d => Number(d.id) === Number(opt.dishId));
        if (!realDish) continue;

        // 🔒 VALIDAÇÃO 2: O Tamanho pertence a este prato?
        const realSize = realDish.availableSizes.find(s => Number(s.id) === Number(opt.sizeId));
        if (!realSize) continue;

        // 🔒 VALIDAÇÃO 3: Limpeza dos acompanhamentos
        const normalizedAccs = [];
        for (const acc of opt.selectedAccompaniments || []) {
          // O Grupo pertence a este tamanho?
          const realGroup = realSize.accompanimentGroups.find(g => Number(g.id) === Number(acc.groupId));
          if (!realGroup) continue;

          // A Opção pertence a este grupo?
          const realOption = realGroup.options.find(o => Number(o.id) === Number(acc.optionId));
          if (!realOption) continue;

          normalizedAccs.push({
            groupId: realGroup.id,
            optionId: realOption.id,
            name: realOption.name,
            extraPrice: Number(realOption.priceModifier || 0)
          });
        }

        // Reconstrói a opção blindada
        normalizedOptions.push({
          dishId: realDish.id,
          sizeId: realSize.id,
          name: realDish.name,
          sizeName: realSize.name,
          selectedAccompaniments: normalizedAccs
        });
      }

      if (normalizedOptions.length > 0) {
        normalizedGroups.push({
          id: crypto.randomUUID(),
          name: group.name || "Opções da Refeição",
          options: normalizedOptions
        });
      }
    }

    if (normalizedGroups.length > 0) {
      normalizedMeals.push({
        id: crypto.randomUUID(),
        name: meal.name || "Refeição",
        notes: meal.notes || "",
        groups: normalizedGroups
      });
    }
  }

  return normalizedMeals;
}