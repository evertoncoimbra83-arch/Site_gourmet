import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hasRequiredRole } from "../client/src/components/ProtectedRoute";
import { calculateMealNutritionCanonical } from "../shared/domain/nutrition/nutrition";
import { selectDefaultAccompanimentsForNutri } from "../shared/domain/nutrition/nutri-default-accompaniments";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("Portal Nutri P1", () => {
  it("permite Admin e Nutri na rota protegida do Portal Nutri", () => {
    expect(hasRequiredRole("admin", ["nutri", "admin"])).toBe(true);
    expect(hasRequiredRole("super_admin", ["nutri", "admin"])).toBe(true);
    expect(hasRequiredRole("nutri", ["nutri", "admin"])).toBe(true);
    expect(hasRequiredRole("user", ["nutri", "admin"])).toBe(false);
  });

  it("mantem o array de roles das rotas publicas ao renderizar o ProtectedRoute", () => {
    const source = readProjectFile("client/src/app/view/AppView.tsx");

    expect(source).toContain("<ProtectedRoute requiredRole={r.role}>");
    expect(source).not.toContain("const roleToPass = Array.isArray(r.role) ? r.role[0] : r.role");
  });

  it("pre-seleciona dois acompanhamentos reais quando minSelections e 2", () => {
    const result = selectDefaultAccompanimentsForNutri({
      groups: [
        {
          id: 1,
          name: "Guarnicoes",
          minSelections: 2,
          maxSelections: 3,
          options: [
            { id: 10, name: "Arroz", energyKcal: 100 },
            { id: 11, name: "Feijao", energyKcal: 80 },
            { id: 12, name: "Sem acompanhamento", isNoAccompaniment: true },
          ],
        },
      ],
    });

    expect(result.autoSelectedCount).toBe(2);
    expect(result.selectedAccompaniments.map((acc) => acc.name)).toEqual([
      "Arroz",
      "Feijao",
    ]);
  });

  it("pre-seleciona um acompanhamento quando minSelections e 1", () => {
    const result = selectDefaultAccompanimentsForNutri({
      groups: [
        {
          id: 1,
          minSelections: 1,
          maxSelections: 2,
          options: [
            { id: 10, name: "Legumes" },
            { id: 11, name: "Pure" },
          ],
        },
      ],
    });

    expect(result.selectedAccompaniments).toHaveLength(1);
    expect(result.selectedAccompaniments[0].name).toBe("Legumes");
  });

  it("nao inventa acompanhamentos quando o vinculo nao informa minimo", () => {
    const result = selectDefaultAccompanimentsForNutri({
      groups: [
        {
          id: 1,
          maxSelections: 3,
          options: [
            { id: 10, name: "Arroz" },
            { id: 11, name: "Feijao" },
            { id: 12, name: "Legumes" },
          ],
        },
      ],
      minFallback: 0,
    });

    expect(result.selectedAccompaniments).toEqual([]);
  });

  it("nao pre-seleciona Sem acompanhamento quando existem opcoes reais", () => {
    const result = selectDefaultAccompanimentsForNutri({
      groups: [
        {
          id: 1,
          minSelections: 1,
          maxSelections: 2,
          options: [
            { id: 10, name: "Sem acompanhamento", is_no_accompaniment: true },
            { id: 11, name: "Brocolis" },
          ],
        },
      ],
    });

    expect(result.selectedAccompaniments).toHaveLength(1);
    expect(result.selectedAccompaniments[0].name).toBe("Brocolis");
  });

  it("seleciona Sem acompanhamento apenas quando e a unica opcao ativa", () => {
    const result = selectDefaultAccompanimentsForNutri({
      groups: [
        {
          id: 1,
          minSelections: 1,
          maxSelections: 2,
          options: [{ id: 10, name: "Sem acompanhamento", isNoAccompaniment: true }],
        },
      ],
    });

    expect(result.selectedAccompaniments).toHaveLength(1);
    expect(result.selectedAccompaniments[0].isNoAccompaniment).toBe(true);
  });

  it("nao ultrapassa maxSelections e ignora opcoes inativas", () => {
    const result = selectDefaultAccompanimentsForNutri({
      groups: [
        {
          id: 1,
          minSelections: 3,
          maxSelections: 2,
          options: [
            { id: 10, name: "Arroz" },
            { id: 11, name: "Feijao" },
            { id: 12, name: "Pure", isActive: false },
          ],
        },
      ],
    });

    expect(result.selectedAccompaniments).toHaveLength(2);
    expect(result.selectedAccompaniments.map((acc) => acc.name)).toEqual([
      "Arroz",
      "Feijao",
    ]);
  });

  it("recalcula macros com acompanhamentos pre-selecionados sem gerar NaN", () => {
    const selection = selectDefaultAccompanimentsForNutri({
      groups: [
        {
          id: 1,
          minSelections: 2,
          maxSelections: 2,
          options: [
            { id: 10, name: "Arroz", weight: 100, energyKcal: 120, proteins: 3, carbs: 24, fatTotal: 1 },
            { id: 11, name: "Feijao", weight: 100, energyKcal: 90, proteins: 6, carbs: 14, fatTotal: 1 },
          ],
        },
      ],
    });

    const calculated = calculateMealNutritionCanonical({
      dish: { energyKcal: 200, proteins: 25, carbs: 10, fatTotal: 8 },
      targetMainDishWeight: 200,
      recipeWeight: 200,
      accompaniments: selection.selectedAccompaniments,
    }).nutrition;

    expect(calculated.energyKcal).toBe(410);
    expect(Object.values(calculated).every((value) => Number.isFinite(value))).toBe(true);
  });

  it("mantem tamanho sem acompanhamento sem bloquear e sem fake", () => {
    const result = selectDefaultAccompanimentsForNutri({ groups: [] });

    expect(result.selectedAccompaniments).toEqual([]);
    expect(result.autoSelectedCount).toBe(0);
  });

  it("catalogo Nutri usa tamanhos reais vinculados ao prato", () => {
    const source = readProjectFile(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );

    expect(source).toContain(".innerJoin(dishesToSizes");
    expect(source).toContain("mainDishWeight: dishSizes.mainDishWeight");
    expect(source).toContain(
      "noAccompanimentsMessage: dishSizes.noAccompanimentsMessage",
    );
    expect(source).toContain("minSelections: sizeAccompanimentGroups.minSelections");
    expect(source).toContain("maxSelections: sizeAccompanimentGroups.maxSelections");
    expect(source).toContain("sizes: availableSizes");
    expect(source).not.toContain("DEFAULT_SIZES");
  });

  it("Portal Nutri nao usa fallback 200/300/400 como regra de tamanho", () => {
    const builderSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );
    const normalizationSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/utils/normalization.ts",
    );

    expect(builderSource).toContain("getProductSizes(product)");
    expect(builderSource).toContain("getMainDishWeightFromSize(defaultSize)");
    expect(builderSource).not.toContain("mainDishWeight || defaultSize?.weight || 200");
    expect(builderSource).not.toContain("mainDishWeight || size.weight || 200");
    expect(builderSource).not.toContain("300g");
    expect(builderSource).not.toContain("400g");
    expect(normalizationSource).toContain("findRealSizeForSnapshot");
    expect(normalizationSource).not.toContain("safeNumber(o.mainDishWeight, 200)");
  });

  it("Portal Nutri renderiza nome real do tamanho sem concatenar weight", () => {
    const cardSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/PrescriptionMealCard.tsx",
    );

    expect(cardSource).toContain("{size.name}");
    expect(cardSource).toContain("Prato principal: {mainDishWeight}g");
    expect(cardSource).toContain("Label: {Number(labelWeight)}g");
    expect(cardSource).not.toContain("{size.name} {size.weight");
    expect(cardSource).not.toContain("Gramagem Base");
    expect(cardSource).not.toContain("250G + 200G");
  });

  it("builder usa mainDishWeight, weight e mensagem reais do tamanho selecionado", () => {
    const builderSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );

    expect(builderSource).toContain("minFallback: 0");
    expect(builderSource).toContain("weight: defaultSize?.weight");
    expect(builderSource).toContain("sizeWeight: defaultSize?.weight");
    expect(builderSource).toContain("mainDishWeight");
    expect(builderSource).toContain("noAccompanimentsMessage: size.noAccompanimentsMessage");
    expect(builderSource).toContain("allowedAccompaniments: defaultSelection.selectedAccompaniments");
  });

  it("prato sem tamanho vinculado mostra alerta e nao permite criar tamanho fake", () => {
    const catalogSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/CatalogSidebar.tsx",
    );
    const builderSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );

    expect(catalogSource).toContain(
      "Este prato ainda nao possui tamanhos vinculados no Admin.",
    );
    expect(catalogSource).toContain("hasLinkedSize && onAdd(product)");
    expect(builderSource).toContain("if (!defaultSize)");
  });

  it("prescricao antiga hidrata tamanho real e marca aviso quando nao encontra", () => {
    const source = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/utils/normalization.ts",
    );
    const cardSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/PrescriptionMealCard.tsx",
    );

    expect(source).toContain("findRealSizeForSnapshot");
    expect(source).toContain("legacySizeMissing");
    expect(source).toContain("matchedSize.mainDishWeight ?? matchedSize.weight");
    expect(cardSource).toContain("Tamanho antigo nao encontrado no cadastro atual.");
  });

  it("getPrescriptionDetails reidrata dados de tamanho ao reabrir prescricao", () => {
    const source = readProjectFile(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );

    expect(source).toContain("const sizeRows = sizeIds.length > 0");
    expect(source).toContain("mainDishWeight: dishSizes.mainDishWeight");
    expect(source).toContain("noAccompanimentsMessage: dishSizes.noAccompanimentsMessage");
    expect(source).toContain("buildAvailableSizesForDish");
    expect(source).toContain("sizeName,");
    expect(source).toContain("sizeWeight");
    expect(source).toContain("mainDishWeight,");
    expect(source).toContain("noAccompanimentsMessage");
    expect(source).toContain("availableSizes,");
    expect(source).toContain("legacySizeMissing");
  });

  it("salvamento preserva sizeId, sizeName, weight e mainDishWeight reais", () => {
    const actionsSource = readProjectFile(
      "client/src/pages/nutri/logic/usePrescriptionActions.ts",
    );
    const drawerSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/index.tsx",
    );
    const backendSource = readProjectFile(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );

    expect(actionsSource).toContain("sizeName: o.sizeName");
    expect(actionsSource).toContain("sizeWeight: o.sizeWeight");
    expect(actionsSource).toContain("mainDishWeight:");
    expect(drawerSource).toContain("sizeName: o.sizeName");
    expect(drawerSource).toContain("sizeWeight: o.sizeWeight");
    expect(backendSource).toContain("sizeName: dish.sizeName");
    expect(backendSource).toContain("sizeWeight: dish.sizeWeight");
    expect(backendSource).toContain("noAccompanimentsMessage:");
  });

  it("AccompanimentSidebar usa grupos do tamanho selecionado em vez da lista global", () => {
    const sidebarSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/AccompanimentSidebar.tsx",
    );
    const drawerSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/index.tsx",
    );

    expect(sidebarSource).toContain("getGroupsForSize(selectedSize)");
    expect(sidebarSource).toContain("sourceGroupId: group.id");
    expect(sidebarSource).toContain("A lista vem dos grupos vinculados ao tamanho selecionado.");
    expect(sidebarSource).not.toContain("accompaniments:");
    expect(drawerSource).not.toContain("getAvailableAccompaniments.useQuery");
  });

  it("troca de tamanho limpa selecoes invalidas e aplica pre-selecao real", () => {
    const source = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts",
    );

    expect(source).toContain("getAllowedAccompanimentIdsForSize(size)");
    expect(source).toContain("removedInvalidAccompaniments");
    expect(source).toContain("Alguns acompanhamentos foram ajustados porque nao pertencem ao novo tamanho.");
    expect(source).toContain("mapDefaultAccompaniments(getSizeGroups(size))");
    expect(source).toContain("Este acompanhamento nao pertence ao tamanho selecionado.");
    expect(source).toContain("Limite de acompanhamentos atingido para este grupo.");
  });

  it("salvamento bloqueia item legado sem tamanho real selecionado", () => {
    const source = readProjectFile(
      "client/src/pages/nutri/logic/usePrescriptionActions.ts",
    );

    expect(source).toContain("hasInvalidLegacySize");
    expect(source).toContain("legacySizeMissing");
    expect(source).toContain("selecione um tamanho valido");
  });

  it("mantem o drawer de acompanhamentos acima do drawer principal", () => {
    const drawerSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/index.tsx",
    );
    const accSource = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/AccompanimentSidebar.tsx",
    );

    expect(drawerSource).toContain("z-[70]");
    expect(drawerSource).toContain("z-[80]");
    expect(accSource).toContain("z-[130]");
  });

  it("fecha somente o painel de acompanhamentos quando ele esta aberto", () => {
    const source = readProjectFile(
      "client/src/pages/nutri/components/PrescriptionDrawer/index.tsx",
    );

    expect(source).toContain("onClose={() => builder.setIsPickingAccFor(null)}");
    expect(source).toContain("onClick={onClose}");
  });

});
