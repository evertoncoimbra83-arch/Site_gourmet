import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readSource(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Nutri P0 prescription rehydration", () => {
  it("opens existing prescriptions with getPrescriptionDetails instead of the light client summary", () => {
    const source = readSource("client/src/pages/nutri/NutriDashboardView.tsx");

    expect(source).toContain("selectedPrescriptionId");
    expect(source).toContain("trpc.nutri.getPrescriptionDetails.useQuery");
    expect(source).toContain("prescriptionId: selectedPrescriptionId || undefined");
    expect(source).toContain("setSelectedPrescriptionId(diet?.id || null)");
    expect(source).toContain("setCurrentDiet(null)");
    expect(source).toContain("setCurrentDiet((richPrescription as unknown) as PrescriptionType)");
    expect(source).toContain("isLoadingInitialData={Boolean(selectedPrescriptionId) && isLoadingPrescriptionDetails}");
    expect(source).not.toContain("setCurrentDiet(diet");
  });

  it("keeps the drawer blocked while rich initial data is loading", () => {
    const source = readSource(
      "client/src/pages/nutri/components/PrescriptionDrawer/index.tsx",
    );

    expect(source).toContain("isLoadingInitialData?: boolean");
    expect(source).toContain("isLoadingInitialData = false");
    expect(source).toContain("Carregando prescricao salva");
    expect(source).toContain("!builderPrescription.meals?.length");
  });

  it("returns builder-shaped meals, groups, options, and selected accompaniments for editing", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );

    expect(source).toContain("getPrescriptionDetails: protectedProcedure");
    expect(source).toContain("mealMap.set(item.mealName");
    expect(source).toContain("groups: [");
    expect(source).toContain("options: []");
    expect(source).toContain("allowedAccompaniments: enrichedAccs");
    expect(source).toContain("selectedAccompaniments: enrichedAccs");
    expect(source).toContain("defaultGrammage");
    expect(source).toContain("minSelections");
    expect(source).toContain("maxSelections");
  });
});

describe("Customer prescription page rich rendering contract", () => {
  it("uses the live nutriprescription route and preserves selected accompaniment metadata", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/hooks/usePrescriptionLogic.ts",
    );

    expect(source).toContain("trpc.nutri.getDashboard.useQuery");
    expect(source).toContain("selectedAccompaniments?: PrescriptionAccompaniment[]");
    expect(source).toContain("function hasAccompaniments");
    expect(source).toContain("if (hasAccompaniments(p.selectedAccompaniments))");
    expect(source).toContain("if (hasAccompaniments(p.allowedAccompaniments))");
    expect(source).toContain("function flattenAccompanimentGroups");
    expect(source).toContain("normalizeAccompaniment(option, groupRecord)");
    expect(source).toContain("displayAccompaniments: selectedAccs");
    expect(source).toContain("visibleAccompaniments: selectedAccs");
    expect(source).toContain("selectedAccompaniments: selectedAccs");
    expect(source).toContain("allowedAccompaniments: selectedAccs");
    expect(source).toContain("accompanimentGroups");
    expect(source).toContain("groupId");
    expect(source).toContain("groupName");
    expect(source).toContain("defaultGrammage");
    expect(source).toContain("minSelections");
    expect(source).toContain("maxSelections");
    expect(source).toContain("const rawAccs = opt.selectedAccompaniments || opt.allowedAccompaniments || []");
  });

  it("renders size, grouped accompaniments, grammage, and empty-accompaniment fallback", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/components/OptionCard.tsx",
    );

    expect(source).toContain("const displayAccompaniments =");
    expect(source).toContain("opt.displayAccompaniments");
    expect(source).toContain("opt.visibleAccompaniments");
    expect(source).toContain("opt.selectedAccompaniments");
    expect(source).toContain("opt.allowedAccompaniments");
    expect(source).toContain("groupedAccompaniments");
    expect(source).toContain("Tamanho:");
    expect(source).toContain("Prato principal:");
    expect(source).toContain("acc.groupName || acc.sourceGroupName");
    expect(source).toContain("acc.weight || acc.defaultGrammage");
    expect(source).toContain("Sem acompanhamento");
    expect(source).toContain("Sem acompanhamentos definidos");
    expect(source).toContain("displayAccompaniments.length > 0 ? (");
  });
});
