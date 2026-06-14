import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  countTemplateDishes,
  formatDishesCountLabel,
} from "../client/src/pages/nutri/components/Dashboard/TemplateList";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("Portal Nutri template dish count", () => {
  it("calcula 0 pratos quando o modelo esta vazio", () => {
    expect(countTemplateDishes({ meals: [] })).toBe(0);
  });

  it("calcula 1 prato a partir de meals com dishes", () => {
    expect(
      countTemplateDishes({
        meals: [{ dishes: [{ id: 1, name: "Tilapia" }] }],
      }),
    ).toBe(1);
  });

  it("calcula 2 pratos a partir de snapshot JSON", () => {
    const content = JSON.stringify([
      {
        mealName: "Almoco",
        dishes: [
          { dishId: 1, name: "Tilapia" },
          { dishId: 2, name: "Nhoque" },
        ],
      },
    ]);

    expect(countTemplateDishes({ content })).toBe(2);
  });

  it("calcula grupos/options quando o modelo vem no formato builder", () => {
    expect(
      countTemplateDishes({
        data: {
          meals: [
            {
              groups: [
                { options: [{ id: 1 }, { id: 2 }] },
                { options: [{ id: 3 }] },
              ],
            },
          ],
        },
      }),
    ).toBe(3);
  });

  it("usa count explicito do backend quando disponivel", () => {
    expect(countTemplateDishes({ itemsCount: 2, meals: [] })).toBe(2);
    expect(countTemplateDishes({ dishesCount: "1", meals: [] })).toBe(1);
  });

  it("snapshot invalido nao quebra e retorna 0", () => {
    expect(countTemplateDishes({ content: "{json invalido" })).toBe(0);
  });

  it("formata badge com singular e plural corretos", () => {
    expect(formatDishesCountLabel(0).toUpperCase()).toBe("0 PRATOS");
    expect(formatDishesCountLabel(1).toUpperCase()).toBe("1 PRATO");
    expect(formatDishesCountLabel(2).toUpperCase()).toBe("2 PRATOS");
  });

  it("mapper do frontend preserva itemsCount/dishesCount e nao usa valor hardcoded", () => {
    const source = readProjectFile(
      "client/src/pages/nutri/components/Dashboard/TemplateList.tsx",
    );

    expect(source).toContain("countTemplateDishes(template)");
    expect(source).toContain("safeCount(template.itemsCount)");
    expect(source).toContain("safeCount(template.dishesCount)");
    expect(source).toContain("Array.isArray(template.meals)");
    expect(source).not.toContain("countTotalDishes(template.data)");
  });

  it("endpoint da biblioteca retorna contagem explicita de pratos", () => {
    const source = readProjectFile(
      "server/routers/storefront/nutri/procedures/nutri_templates.ts",
    );

    expect(source).toContain("const itemsCount = countTemplateItemsFromMeals(parsedMeals)");
    expect(source).toContain("itemsCount");
    expect(source).toContain("dishesCount");
    expect(source).toContain("safeJsonParse<SnapshotMeal[]>(t.content, [])");
  });
});
