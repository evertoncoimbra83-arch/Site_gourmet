import { describe, expect, it } from "vitest";
import { pxToDots, type LabelData, type LabelElement } from "../label-compiler";
import { generateZplText } from "./zplText";

const baseData: LabelData = {
  dishName: "Lasanha de Berinjela",
  customerName: "Joao",
  ingredients: "Berinjela, molho de tomate, queijo",
  kcal: "300",
  carbs: "20",
  prots: "15",
  fats: "8",
  orderId: "ord_1",
  itemIndex: 1,
  totalItems: 1,
};

function makeTextElement(overrides: Partial<LabelElement> = {}): LabelElement {
  return {
    id: "text_1",
    type: "text",
    x: 10,
    y: 5,
    fontSize: 10,
    field: "dishName",
    staticText: "",
    width: 80,
    height: 20,
    ...overrides,
  };
}

describe("generateZplText", () => {
  it("usa a mesma conversao de 96dpi para dots do lote", () => {
    expect(pxToDots(3.7795, 203)).toBe(8);
    expect(pxToDots(3.7795, 300)).toBe(12);
  });

  it("gera bloco textual curto com largura, fonte, ^FB e escape habilitado", () => {
    const zpl = generateZplText(makeTextElement(), baseData);

    expect(zpl).toContain("^FO21,11");
    expect(zpl).toContain("^A0N,21,19");
    expect(zpl).toContain("^FB169,2,0,L,0");
    expect(zpl).toContain("^FH_");
    expect(zpl).toContain("^FDLasanha de Berinjela^FS");
  });

  it("mantem texto longo e ingredientes longos dentro de bloco com wrapping", () => {
    const zpl = generateZplText(
      makeTextElement({
        field: "ingredients",
        height: 30,
      }),
      {
        ...baseData,
        ingredients:
          "Arroz integral, frango desfiado, creme de ricota, cenoura, brocolis, ervas finas",
      },
    );

    expect(zpl).toContain("^FB169,3,0,L,0");
    expect(zpl).toContain(
      "^FDArroz integral, frango desfiado, creme de ricota, cenoura, brocolis, ervas finas^FS",
    );
  });

  it("preserva quebras manuais, acentos e escapa caracteres reservados", () => {
    const zpl = generateZplText(
      makeTextElement({
        staticText: "Joao\nA\u00e7ai com ^leve~ e barra\\",
      }),
      baseData,
    );

    expect(zpl).toContain("Joao\\&A\u00e7ai com _5Eleve_7E e barra_5C");
  });

  it("respeita largura pequena, maxLines e alinhamento", () => {
    const zpl = generateZplText(
      makeTextElement({
        width: 20,
        maxLines: 1,
        textAlign: "center",
      }),
      baseData,
    );

    expect(zpl).toContain("^FB42,1,0,C,0");
  });

  it("nao emite valores nulos, indefinidos ou placeholders nao resolvidos", () => {
    const zpl = generateZplText(
      makeTextElement({
        staticText: "Valor {{CAMPO}} undefined null",
      }),
      baseData,
    );

    expect(zpl).not.toContain("{{CAMPO}}");
    expect(zpl).not.toContain("undefined");
    expect(zpl).not.toContain("null");
  });
});
