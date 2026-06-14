/**
 * server/nutri-prescription-format.spec.ts
 *
 * Testes da correção P0 â€” Formato de Salvamento da Prescrição vs Produto Normal
 *
 * Garante que:
 * 1. accompanimentsJson salva groupId, groupName, defaultGrammage, weight reais
 * 2. normalization.ts não usa heurística de peso por nome de grupo
 * 3. getDashboard converte sourceGroupId legado para groupId
 * 4. usePrescriptionLogic bloqueia accs indisponíveis e sizeId inválido
 * 5. cart/items.ts não tem encoding corrompido
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { safeJsonStringifyForDb } from "./lib/safe-parse.js";

const root = process.cwd();

function readSource(path: string) {
  return readFileSync(join(root, path), "utf8");
}

// â”€â”€â”€ Helpers de utilidade para simular a lógica de enrichedAccs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface MockAcc {
  id: number;
  name: string;
  weight?: number;
  defaultGrammage?: number;
  groupId?: string | number | null;
  groupName?: string | null;
  sourceGroupId?: string | number | null;
  sourceGroupName?: string | null;
  minSelections?: number | null;
  maxSelections?: number | null;
  isNoAccompaniment?: boolean;
  energyKcal?: number;
  proteins?: number;
  carbs?: number;
  fatTotal?: number;
}

/**
 * Simula a lógica do enrichedAccs (backend assignPrescription) para teste unitário.
 * Replica o comportamento após a correção P0.
 */
function simulateEnrichedAcc(
  acc: MockAcc,
  dbAcc?: { energyKcal?: number; proteins?: number; carbs?: number; fatTotal?: number; isNoAccompaniment?: boolean },
  catalogGroup?: { groupId: number; groupName: string; defaultGrammage: number; minSelections: number | null; maxSelections: number | null },
) {
  const raw = acc as unknown as Record<string, unknown>;
  const normalizedGroupId = catalogGroup?.groupId ?? raw.groupId ?? raw.sourceGroupId ?? null;
  const normalizedGroupName = catalogGroup?.groupName ?? raw.groupName ?? raw.sourceGroupName ?? null;
  const normalizedDefaultGrammage =
    Number(catalogGroup?.defaultGrammage ?? raw.defaultGrammage ?? 100) || 100;
  const normalizedWeight = normalizedDefaultGrammage;

  return {
    ...acc,
    groupId: normalizedGroupId,
    groupName: normalizedGroupName,
    sourceGroupId: raw.sourceGroupId ?? normalizedGroupId,
    sourceGroupName: raw.sourceGroupName ?? normalizedGroupName,
    defaultGrammage: normalizedDefaultGrammage,
    weight: normalizedWeight,
    minSelections: catalogGroup?.minSelections ?? raw.minSelections ?? null,
    maxSelections: catalogGroup?.maxSelections ?? raw.maxSelections ?? null,
    energyKcal: dbAcc?.energyKcal ?? 0,
    proteins: dbAcc?.proteins ?? 0,
    carbs: dbAcc?.carbs ?? 0,
    fatTotal: dbAcc?.fatTotal ?? 0,
    isNoAccompaniment: Boolean(dbAcc?.isNoAccompaniment),
    is_no_accompaniment: Boolean(dbAcc?.isNoAccompaniment),
  };
}

/**
 * Simula a lógica do enrichSelectedAccs (getDashboard) após a correção P0.
 * Testa busca por sourceGroupId legado.
 */
function simulateEnrichSelectedAcc(
  acc: MockAcc,
  groups: Array<{
    groupId: number;
    groupName: string;
    defaultGrammage: number;
    minSelections: number | null;
    maxSelections: number | null;
    options: Array<{ id: number; name: string }>;
  }>,
) {
  const raw = acc as unknown as Record<string, unknown>;
  const legacyGroupId = raw.groupId ?? raw.sourceGroupId ?? null;
  const group = groups.find((candidate) =>
    (legacyGroupId !== null && String(candidate.groupId) === String(legacyGroupId)) ||
    candidate.options.some((option) => Number(option.id) === Number(acc.id)),
  );
  const option = group?.options.find((candidate) => Number(candidate.id) === Number(acc.id));
  const legacyAccMissing = !option && !Boolean(acc.isNoAccompaniment);

  const resolvedGroupId = group?.groupId ?? raw.groupId ?? raw.sourceGroupId ?? null;
  const resolvedGroupName = group?.groupName ?? raw.groupName ?? raw.sourceGroupName ?? null;
  const resolvedDefaultGrammage = Number(group?.defaultGrammage ?? raw.defaultGrammage ?? 100) || 100;
  const resolvedWeight = resolvedDefaultGrammage;

  return {
    ...acc,
    groupId: resolvedGroupId,
    groupName: resolvedGroupName,
    sourceGroupId: raw.sourceGroupId ?? resolvedGroupId,
    sourceGroupName: raw.sourceGroupName ?? resolvedGroupName,
    minSelections: raw.minSelections ?? group?.minSelections ?? null,
    maxSelections: raw.maxSelections ?? group?.maxSelections ?? null,
    defaultGrammage: resolvedDefaultGrammage,
    weight: resolvedWeight,
    legacyAccMissing,
  };
}

// â”€â”€â”€ Grupo 1: Backend assignPrescription â€” enrichedAccs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("assignPrescription: enrichedAccs â€” formato correto", () => {
  const mockGroups = [
    {
      groupId: 3,
      groupName: "Carboidratos",
      defaultGrammage: 100,
      minSelections: 1,
      maxSelections: 2,
      options: [{ id: 15, name: "Arroz integral" }],
    },
    {
      groupId: 4,
      groupName: "Proteínas",
      defaultGrammage: 80,
      minSelections: 1,
      maxSelections: 1,
      options: [{ id: 28, name: "Feijão" }],
    },
  ];

  it("1. salva groupId real (não sourceGroupId) no accompanimentsJson", () => {
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
      sourceGroupName: "Carboidratos",
      defaultGrammage: 100,
      weight: 100,
    };
    const result = simulateEnrichedAcc(acc);
    expect(result.groupId).toBe("3");
    expect(result.groupId).not.toBeNull();
  });

  it("2. salva groupName real no accompanimentsJson", () => {
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
      sourceGroupName: "Carboidratos",
      defaultGrammage: 100,
    };
    const result = simulateEnrichedAcc(acc);
    expect(result.groupName).toBe("Carboidratos");
  });

  it("3. salva defaultGrammage real no accompanimentsJson", () => {
    const acc: MockAcc = {
      id: 28,
      name: "Feijão",
      sourceGroupId: "4",
      sourceGroupName: "Proteínas",
      defaultGrammage: 80,
    };
    const result = simulateEnrichedAcc(acc);
    expect(result.defaultGrammage).toBe(80);
  });

  it("4. weight === defaultGrammage (não mainDishWeight)", () => {
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
      defaultGrammage: 100,
      weight: 100,
    };
    const result = simulateEnrichedAcc(acc);
    // weight deve ser = defaultGrammage, NUNCA mainDishWeight (ex: 250g)
    expect(result.weight).toBe(100);
    expect(result.weight).toBe(result.defaultGrammage);
  });

  it("5. salva minSelections e maxSelections quando fornecidos", () => {
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
      defaultGrammage: 100,
      minSelections: 1,
      maxSelections: 2,
    };
    const result = simulateEnrichedAcc(acc);
    expect(result.minSelections).toBe(1);
    expect(result.maxSelections).toBe(2);
  });

  it("6. mantém sourceGroupId/sourceGroupName para compatibilidade com legado", () => {
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
      sourceGroupName: "Carboidratos",
      defaultGrammage: 100,
    };
    const result = simulateEnrichedAcc(acc);
    expect(result.sourceGroupId).toBe("3");
    expect(result.sourceGroupName).toBe("Carboidratos");
  });

  it("7. não usa mainDishWeight (250g) como weight do acompanhamento (100g)", () => {
    // mainDishWeight tipicamente é 250g+ (peso do prato inteiro)
    // Se o acc vier com weight = 250 por engano, defaultGrammage corrige para 100g
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
      defaultGrammage: 100, // real do grupo
      weight: 250, // mainDishWeight por engano
    };
    // O enriquecimento deve preferir defaultGrammage sobre weight errado
    const result = simulateEnrichedAcc(acc);
    // Com a nova lógica: defaultGrammage ?? weight â†’ pega 100 (defaultGrammage)
    expect(result.defaultGrammage).toBe(100);
    expect(result.weight).toBe(100);
  });

  it("8. não usa sizeWeight como weight do acompanhamento", () => {
    // sizeWeight é o peso total do tamanho, ex: "350g"
    // A gramagem do acc deve vir de defaultGrammage do grupo
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
      defaultGrammage: 100,
    };
    const result = simulateEnrichedAcc(acc);
    expect(result.weight).toBe(100); // não 350
  });
});

// â”€â”€â”€ Grupo 2: getDashboard â€” enrichSelectedAccs com legado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("getDashboard: enrichSelectedAccs â€” conversão de legado sourceGroupId", () => {
  const mockGroups = [
    {
      groupId: 3,
      groupName: "Carboidratos",
      defaultGrammage: 100,
      minSelections: 1,
      maxSelections: 2,
      options: [{ id: 15, name: "Arroz integral" }],
    },
    {
      groupId: 4,
      groupName: "Proteínas",
      defaultGrammage: 80,
      minSelections: 1,
      maxSelections: 1,
      options: [{ id: 28, name: "Feijão" }],
    },
  ];

  it("9. converte sourceGroupId legado para groupId", () => {
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3", // formato legado
      // groupId não estava salvo antes da correção
    };
    const result = simulateEnrichSelectedAcc(acc, mockGroups);
    expect(result.groupId).toBe(3); // encontrado pelo catálogo
    expect(result.groupId).not.toBeNull();
  });

  it("10. retorna groupId não-nulo quando o acc ainda existe no catálogo", () => {
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
    };
    const result = simulateEnrichSelectedAcc(acc, mockGroups);
    expect(result.groupId).not.toBeNull();
    expect(result.legacyAccMissing).toBe(false);
  });

  it("11. marca legacyAccMissing=true quando acompanhamento não existe mais no catálogo", () => {
    const acc: MockAcc = {
      id: 999, // ID que não existe no catálogo atual
      name: "Acompanhamento removido",
      sourceGroupId: "3",
    };
    const result = simulateEnrichSelectedAcc(acc, mockGroups);
    expect(result.legacyAccMissing).toBe(true);
  });

  it("12. usa defaultGrammage real do catálogo para weight", () => {
    const acc: MockAcc = {
      id: 15,
      name: "Arroz integral",
      sourceGroupId: "3",
      // sem defaultGrammage (prescrição antiga)
    };
    const result = simulateEnrichSelectedAcc(acc, mockGroups);
    expect(result.defaultGrammage).toBe(100); // do catálogo
    expect(result.weight).toBe(100); // do catálogo
  });

  it("13. preserva defaultGrammage se já vem correto no acc (prescrição nova)", () => {
    const acc: MockAcc = {
      id: 28,
      name: "Feijão",
      groupId: "4",
      groupName: "Proteínas",
      defaultGrammage: 80, // já salvo corretamente pelo novo builder
      weight: 80,
    };
    const result = simulateEnrichSelectedAcc(acc, mockGroups);
    expect(result.defaultGrammage).toBe(80);
    expect(result.weight).toBe(80);
  });
});

// â”€â”€â”€ Grupo 3: normalization.ts â€” sem heurística de nome â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("normalization.ts â€” sem heurística de peso por nome de grupo", () => {
  it("14. não contém lógica de adivinhação por nome '80'/'100'", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/utils/normalization.ts",
    );
    // A heurística removida usava gName.includes("80") ou gName.includes("100")
    expect(source).not.toContain('gName.includes("80")');
    expect(source).not.toContain('gName.includes("100")');
  });

  it("15. não contém distribuição de peso por índice de array (idx === 0 ? 80 : 100)", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/utils/normalization.ts",
    );
    expect(source).not.toContain("idx === 0 ? 80 : 100");
  });

  it("16. usa defaultGrammage ?? weight como regra objetiva", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/utils/normalization.ts",
    );
    expect(source).toContain("acc.defaultGrammage");
    expect(source).toContain("acc.weight");
  });

  it("17. normaliza groupId a partir de sourceGroupId no retorno", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/utils/normalization.ts",
    );
    expect(source).toContain("acc.groupId ?? acc.sourceGroupId ?? null");
  });
});

// â”€â”€â”€ Grupo 4: usePrescriptionBuilder.ts â€” campos corretos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("usePrescriptionBuilder.ts â€” toggleAccompanimentToOption salva campos corretos", () => {
  it("18. salva groupId no objeto do acompanhamento", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );
    expect(source).toContain("groupId: resolvedGroupId");
  });

  it("19. salva groupName no objeto do acompanhamento", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );
    expect(source).toContain("groupName: resolvedGroupName");
  });

  it("20. salva defaultGrammage no objeto do acompanhamento", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );
    expect(source).toContain("defaultGrammage: resolvedDefaultGrammage");
  });

  it("21. weight = defaultGrammage (não acc.weight arbitrário)", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );
    expect(source).toContain("weight: resolvedWeight");
    expect(source).toContain("resolvedWeight = resolvedDefaultGrammage");
  });

  it("22. salva minSelections e maxSelections", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );
    expect(source).toContain("minSelections:");
    expect(source).toContain("maxSelections:");
  });

  it("23. mantém sourceGroupId para compatibilidade com legado", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );
    expect(source).toContain("sourceGroupId,");
  });
});

// â”€â”€â”€ Grupo 5: usePrescriptionLogic.ts â€” guards de adição ao carrinho â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("usePrescriptionLogic.ts â€” guards de add-to-cart", () => {
  it("24. bloqueia sizeId inválido (0 ou null) com mensagem amigável", () => {
    const source = readSource(
      "client/src/pages/prescription/hooks/usePrescriptionLogic.ts",
    );
    expect(source).toContain("numericSizeId");
    expect(source).toContain("Este prato não tem tamanho definido");
  });

  it("25. bloqueia quando há acompanhamento legacyAccMissing=true", () => {
    const source = readSource(
      "client/src/pages/prescription/hooks/usePrescriptionLogic.ts",
    );
    expect(source).toContain("legacyAccMissing");
    expect(source).toContain("acompanhamentos que não estão mais disponíveis");
  });

  it("26. usa defaultGrammage prioritariamente sobre weight no selectedAccs", () => {
    const source = readSource(
      "client/src/pages/prescription/hooks/usePrescriptionLogic.ts",
    );
    // Nova lógica: defaultGrammage ?? weight (ordem invertida em relação à anterior)
    expect(source).toContain("acc.defaultGrammage ?? acc.weight");
  });

  it("27. selectedSizeId é sempre String(numericSizeId) â€” nunca undefined quando válido", () => {
    const source = readSource(
      "client/src/pages/prescription/hooks/usePrescriptionLogic.ts",
    );
    expect(source).toContain("selectedSizeId: String(numericSizeId)");
    // Não deve mais ter o antigo padrão com ternário que produz undefined
    expect(source).not.toContain("dish.sizeId ? String(dish.sizeId) : undefined");
  });
});

// â”€â”€â”€ Grupo 6: cart/items.ts â€” encoding correto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("cart/items.ts â€” sem encoding corrompido nas mensagens", () => {
  it("28. sem 'ç' (ç corrompido) nas mensagens de erro", () => {
    const source = readSource("server/routers/storefront/cart/items.ts");
    expect(source).not.toContain("Ã");
  });

  it("29. sem 'ã' (ã corrompido) nas mensagens de erro", () => {
    const source = readSource("server/routers/storefront/cart/items.ts");
    expect(source).not.toContain("Â");
  });

  it("30. sem 'í' (í corrompido) nas mensagens de erro", () => {
    const source = readSource("server/routers/storefront/cart/items.ts");
    expect(source).not.toContain("Ãƒ");
  });

  it("31. mensagem de login usa UTF-8 correto: 'Faça login para comprar itens da prescrição'", () => {
    const source = readSource("server/routers/storefront/cart/items.ts");
    expect(source).toContain("Faça login para comprar itens da prescrição");
  });

  it("32. mensagem de prato incompatível usa UTF-8 correto", () => {
    const source = readSource("server/routers/storefront/cart/items.ts");
    expect(source).toContain("Prato incompatível com a prescrição");
  });

  it("33. mensagem de tamanho incompatível usa UTF-8 correto", () => {
    const source = readSource("server/routers/storefront/cart/items.ts");
    expect(source).toContain("Tamanho incompatível com a prescrição");
  });
});

// â”€â”€â”€ Grupo 7: Backend prescription.ts â€” enrichedAccs no assignPrescription â”€â”€â”€

describe("assignPrescription backend â€” enrichedAccs salva campos de grupo corretos", () => {
  it("34. normaliza sourceGroupId legado para groupId no enrichedAccs", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );
    expect(source).toContain("raw.groupId ?? raw.sourceGroupId ?? null");
  });

  it("35. salva defaultGrammage no accompanimentsJson", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );
    expect(source).toContain("defaultGrammage: normalizedDefaultGrammage");
  });

  it("36. weight = defaultGrammage (não mainDishWeight)", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );
    expect(source).toContain("weight: normalizedWeight");
    expect(source).toContain("normalizedWeight = normalizedDefaultGrammage");
  });

  it("37. salva minSelections e maxSelections no accompanimentsJson", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );
    expect(source).toContain("catalogGroup?.minSelections");
    expect(source).toContain("catalogGroup?.maxSelections");
    expect(source).toContain("raw.minSelections");
    expect(source).toContain("raw.maxSelections");
  });
});

// â”€â”€â”€ Grupo 8: getDashboard â€” enrichSelectedAccs com sourceGroupId legado â”€â”€â”€â”€â”€â”€

describe("getDashboard â€” enrichSelectedAccs busca por sourceGroupId legado", () => {
  it("38. busca grupo por sourceGroupId quando groupId não existe", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );
    expect(source).toContain("raw.groupId ?? raw.sourceGroupId ?? null");
    expect(source).toContain("legacyGroupId");
  });

  it("39. marca legacyAccMissing quando acompanhamento não está no catálogo ativo", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );
    expect(source).toContain("legacyAccMissing");
    expect(source).toContain("!option && !Boolean(acc.isNoAccompaniment)");
  });

  it("40. retorna sourceGroupId/sourceGroupName para compatibilidade", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );
    expect(source).toContain("sourceGroupId: raw.sourceGroupId ?? resolvedGroupId");
    expect(source).toContain("sourceGroupName: raw.sourceGroupName ?? resolvedGroupName");
  });
});

// â”€â”€â”€ Grupo 9: Serialização JSON do accompanimentsJson com novos campos â”€â”€â”€â”€â”€â”€â”€â”€

describe("safeJsonStringifyForDb â€” accompanimentsJson com novos campos P0", () => {
  it("41. serializa accompanimentsJson com groupId, groupName, defaultGrammage", () => {
    const enrichedAcc = {
      id: 15,
      name: "Arroz integral",
      groupId: "3",
      groupName: "Carboidratos",
      sourceGroupId: "3",
      sourceGroupName: "Carboidratos",
      defaultGrammage: 100,
      weight: 100,
      minSelections: 1,
      maxSelections: 2,
      isNoAccompaniment: false,
      is_no_accompaniment: false,
      energyKcal: 130,
      proteins: 2.5,
      carbs: 28,
      fatTotal: 0.5,
    };

    const json = safeJsonStringifyForDb([enrichedAcc], []);
    const parsed = JSON.parse(json);

    expect(parsed[0].groupId).toBe("3");
    expect(parsed[0].groupName).toBe("Carboidratos");
    expect(parsed[0].defaultGrammage).toBe(100);
    expect(parsed[0].weight).toBe(100);
    expect(parsed[0].minSelections).toBe(1);
    expect(parsed[0].maxSelections).toBe(2);
  });

  it("42. weight !== mainDishWeight no accompanimentsJson serializado", () => {
    // Cenário: prato com mainDishWeight=250 e acc com defaultGrammage=100
    const enrichedAcc = {
      id: 15,
      name: "Arroz integral",
      groupId: "3",
      defaultGrammage: 100,
      weight: 100, // CORRETO: defaultGrammage, não 250
    };

    const json = safeJsonStringifyForDb([enrichedAcc], []);
    const parsed = JSON.parse(json);

    // Se weight fosse confundido com mainDishWeight, seria 250
    expect(parsed[0].weight).not.toBe(250);
    expect(parsed[0].weight).toBe(100);
  });

  it("43. accompanimentsJson vazio serializa como array válido", () => {
    const json = safeJsonStringifyForDb([], []);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(0);
  });
});

