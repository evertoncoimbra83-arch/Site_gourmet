import { describe, expect, it } from "vitest";
import type { LabelData, LabelElement } from "../label-compiler";
import { generateZplNutritionTable } from "./zplNutritionTable";

const baseElement: LabelElement = {
  id: "nutrition_1",
  type: "nutrition_table",
  x: 10,
  y: 10,
  fontSize: 7,
  field: "nutrition",
  staticText: "",
  width: 160,
  height: 120,
};

const baseData: LabelData & { nutrition: Record<string, unknown> } = {
  dishName: "Prato",
  customerName: "Cliente",
  ingredients: "Ingredientes",
  kcal: "350",
  carbs: "40",
  prots: "30",
  fats: "12",
  orderId: "ord_1",
  itemIndex: 1,
  totalItems: 1,
  nutrition: {
    energyKcal: 350,
    energyKj: 1464,
    carbs: 40,
    sugars: 4,
    addedSugars: 1,
    proteins: 30,
    fatTotal: 12,
    fatSaturated: 3,
    fatTrans: 0,
    fiber: 6,
    sodium: 420,
    yieldWeight: 300,
    dailyValues: {
      energyKcal: 18,
      carbs: 13,
      proteins: 40,
      sodium: 21,
    },
  },
};

describe("generateZplNutritionTable", () => {
  it("renderiza tabela textual completa com 11 nutrientes no Canvas/Studio", () => {
    const zpl = generateZplNutritionTable(baseElement, baseData);

    expect(zpl).toContain("^FO21,21");
    expect(zpl).toContain("^FB339,16,0,L,0");
    expect(zpl).toContain("^FH_");
    expect(zpl).toContain("INFORMACAO NUTRICIONAL");
    expect(zpl).toContain("PORCAO 300g");
    expect(zpl).toContain("NUTRIENTE | QTD | %VD");
    expect(zpl).toContain("Energia kcal: 350kcal | 18%");
    expect(zpl).toContain("Energia kJ: 1.464kJ | --");
    expect(zpl).toContain("Carboidratos: 40,0g | 13%");
    expect(zpl).toContain("Acucares totais: 4,0g | --");
    expect(zpl).toContain("Acucares adicionados: 1,0g | --");
    expect(zpl).toContain("Proteinas: 30,0g | 40%");
    expect(zpl).toContain("Gorduras totais: 12,0g | --");
    expect(zpl).toContain("Gorduras saturadas: 3,0g | --");
    expect(zpl).toContain("Gorduras trans: 0,0g | --");
    expect(zpl).toContain("Fibra alimentar: 6,0g | --");
    expect(zpl).toContain("Sodio: 420mg | 21%");
    expect(zpl).not.toContain("undefined");
    expect(zpl).not.toContain("null");
    expect(zpl).not.toContain("{{");
    expect(zpl).toMatchSnapshot();
  });

  it("usa fallback compacto quando a area e pequena", () => {
    const zpl = generateZplNutritionTable(
      {
        ...baseElement,
        height: 40,
      },
      baseData,
    );

    expect(zpl).toContain("^FB339,8,0,L,0");
    expect(zpl).toContain("Energia kcal: 350kcal | 18%");
    expect(zpl).toContain("Carboidratos: 40,0g | 13%");
    expect(zpl).toContain("Proteinas: 30,0g | 40%");
    expect(zpl).toContain("Gorduras totais: 12,0g | --");
    expect(zpl).toContain("Sodio: 420mg | 21%");
    expect(zpl).not.toContain("Acucares totais");
    expect(zpl).toMatchSnapshot();
  });

  it("normaliza campos nulos e roda em 300dpi sem marcadores invalidos", () => {
    const zpl = generateZplNutritionTable(
      baseElement,
      {
        ...baseData,
        nutrition: {
          energyKcal: null,
          carbs: undefined,
          proteins: "{{PROTEINAS}}",
          fatTotal: "texto longo demais para numero",
          sodium: null,
        },
      } as LabelData & { nutrition: Record<string, unknown> },
      300,
    );

    expect(zpl).toContain("^FO32,32");
    expect(zpl).toContain("^FB508,16,0,L,0");
    expect(zpl).toContain("Energia kcal: 0kcal");
    expect(zpl).toContain("Carboidratos: 0,0g");
    expect(zpl).toContain("Proteinas: 0,0g");
    expect(zpl).toContain("Sodio: 0mg");
    expect(zpl).not.toContain("undefined");
    expect(zpl).not.toContain("null");
    expect(zpl).not.toContain("{{");
  });
});
