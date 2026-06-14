import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertJsonValidString,
  safeJsonStringifyForDb,
} from "./lib/safe-parse.js";

const root = process.cwd();

function readSource(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Nutri E2E P0 prescription cart contract", () => {
  it("returns active prescriptions with rich prescription item metadata", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );

    expect(source).toContain('source: "prescription"');
    expect(source).toContain("prescriptionItemId: item.id");
    expect(source).toContain("selectedAccompaniments: enrichedAccs");
    expect(source).toContain("groupId: resolvedGroupId");
    expect(source).toContain("const resolvedGroupId = group?.groupId ?? raw.groupId ?? raw.sourceGroupId ?? null");
    expect(source).toContain('eq(prescriptions.status, "active")');
  });

  it("does not fabricate the selected size label in the customer prescription page", () => {
    const source = readSource(
      "client/src/pages/prescription/hooks/usePrescriptionLogic.ts",
    );

    expect(source).toContain("dish.sizeName");
    expect(source).toContain("source: \"prescription\"");
    expect(source).toContain("prescriptionId: dish.prescriptionId || activePlan.id");
    expect(source).toContain("groupId: acc.groupId ?? acc.sourceGroupId ?? undefined");
    expect(source).not.toContain("`${dish.nutritionalData.mainDishWeight}g`");
    expect(source).not.toContain('groupName: "Acompanhamento"');
  });

  it("validates prescription ownership before applying prescription price in cart", () => {
    const source = readSource("server/routers/storefront/cart/items.ts");

    expect(source).toContain("validatePrescriptionCartSource");
    expect(source).toContain('options.source !== "prescription"');
    expect(source).toContain("eq(prescriptions.clientId, userId)");
    expect(source).toContain('eq(prescriptions.status, "active")');
    expect(source).toContain("prescriptionSource?.unitPrice ?? authoritativeItem.unitPrice");
  });

  it("persists prescription metadata and order item size name through checkout", () => {
    const cartSource = readSource("server/routers/storefront/cart/items.ts");
    const checkoutSource = readSource(
      "server/routers/storefront/checkout/orders.ts",
    );

    expect(cartSource).toContain("prescriptionId: prescriptionSource.prescriptionId");
    expect(cartSource).toContain(
      "prescriptionItemId: prescriptionSource.prescriptionItemId",
    );
    expect(checkoutSource).toContain("const sizeName =");
    expect(checkoutSource).toContain("sizeName,");
  });

  it("serializes assignPrescription dietSnapshot as valid database JSON", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );

    expect(source).toContain("const dietSnapshotJson = safeJsonStringifyForDb(");
    expect(source).toContain("dietSnapshot: dietSnapshotJson as any");
    expect(source).not.toContain("dietSnapshot: typedDietSnapshot");
  });

  it("safe JSON serialization keeps rich prescription snapshots parseable", () => {
    const json = safeJsonStringifyForDb(
      [
        {
          mealName: "Almoço",
          order: 0,
          notes: undefined,
          dishes: [
            {
              dishId: 10,
              sizeId: 20,
              name: "Frango",
              sizeName: "Médio",
              mainDishWeight: 180,
              noAccompanimentsMessage: "Sem acompanhamento",
              selectedAccompaniments: [
                { id: 1, name: "Arroz", weight: 100, groupId: 7 },
              ],
              source: "prescription",
              prescriptionId: "p-1",
              prescriptionItemId: "pi-1",
              fixedPrice: 22.5,
              priceAtCreation: 22.5,
              nutritionalData: {
                baseMacros: {
                  kcal: 420,
                  protein: 35,
                  carbs: 44,
                  fat: 12,
                },
              },
            },
          ],
        },
      ],
      { items: [], meals: [], source: "nutri", version: 1 },
    );

    assertJsonValidString(json);
    const parsed = JSON.parse(json);
    expect(parsed[0].notes).toBeNull();
    expect(parsed[0].dishes[0].selectedAccompaniments[0].name).toBe("Arroz");
    expect(json).not.toBe("[object Object]");
  });

  it("safe JSON serialization normalizes undefined, NaN, Infinity, and BigInt", () => {
    const json = safeJsonStringifyForDb(
      {
        missing: undefined,
        kcal: Number.NaN,
        protein: Number.POSITIVE_INFINITY,
        carbs: Number.NEGATIVE_INFINITY,
        sourceId: BigInt(123),
      },
      { items: [], meals: [], source: "nutri", version: 1 },
    );

    assertJsonValidString(json);
    expect(JSON.parse(json)).toEqual({
      missing: null,
      kcal: null,
      protein: null,
      carbs: null,
      sourceId: "123",
    });
  });

  it("safe JSON serialization stores empty arrays as valid JSON", () => {
    const json = safeJsonStringifyForDb([], {
      items: [],
      meals: [],
      source: "nutri",
      version: 1,
    });

    assertJsonValidString(json);
    expect(JSON.parse(json)).toEqual([]);
  });

  it("assignPrescription converts save failures to a friendly BAD_REQUEST", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/prescription.ts",
    );

    expect(source).toContain("[nutri.assignPrescription] save failed");
    expect(source).toContain('code: "BAD_REQUEST"');
    expect(source).toContain(
      "Não foi possível salvar a prescrição porque os dados nutricionais estão incompletos. Revise os pratos e tente novamente.",
    );
  });
});
