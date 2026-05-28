import {
  buildFlatLabels,
  createLabelContentParser,
  formatMacrosCompact,
  type OrderData,
} from "../client/src/pages/adminLabelEditor/print-engine/logic.ts";
import { generateZPLForBatch } from "../client/src/pages/adminLabelEditor/print-engine/generator.ts";
import type { PrintLabelElement } from "../client/src/pages/adminLabelEditor/print-engine/templates.ts";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildOverrideKey(labelId: string | number, elementId: string) {
  return `${String(labelId)}::${elementId}`;
}

const order: OrderData = {
  id: "order-zebra-p13",
  customerName: "Everton",
  items: [
    {
      id: "item-1",
      quantity: 1,
      dishName: "Abobrinha Recheada com Frango",
      sizeName: "250G",
      parsedOptions: {
        sizeName: "250G",
        selectedAccs: [{ name: "Arroz Branco" }],
      },
      appliedNutrition: {
        proteins: 53.1,
        carbs: 98.5,
        fatTotal: 16.6,
      },
    },
  ],
};

const template: PrintLabelElement[] = [
  {
    id: "dish",
    type: "text",
    content: "{{PRATO_PRINCIPAL}}",
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    fontSize: 12,
    fontWeight: "700",
    zIndex: 1,
  },
  {
    id: "customer",
    type: "text",
    content: "{{CLIENTE}}",
    x: 0,
    y: 20,
    width: 100,
    height: 20,
    fontSize: 12,
    fontWeight: "700",
    zIndex: 2,
  },
  {
    id: "accs",
    type: "text",
    content: "{{ACOMPANHAMENTOS_LINHAS}}",
    x: 0,
    y: 40,
    width: 100,
    height: 30,
    fontSize: 12,
    fontWeight: "700",
    zIndex: 3,
  },
  {
    id: "composition-lines",
    type: "text",
    content: "{{COMPOSICAO_LINHAS}}",
    x: 0,
    y: 70,
    width: 120,
    height: 35,
    fontSize: 12,
    fontWeight: "700",
    zIndex: 4,
  },
  {
    id: "macros",
    type: "text",
    content: "{{MACROS_COMPACTO}}",
    x: 0,
    y: 105,
    width: 120,
    height: 20,
    fontSize: 12,
    fontWeight: "700",
    zIndex: 5,
  },
  {
    id: "size",
    type: "text",
    content: "{{TAMANHO_REFEICAO}}",
    x: 0,
    y: 125,
    width: 100,
    height: 20,
    fontSize: 12,
    fontWeight: "700",
    zIndex: 6,
  },
];

const flatLabels = buildFlatLabels(order);
assert(flatLabels.length === 1, "Era esperado exatamente 1 flat label.");

const parser = createLabelContentParser(order, flatLabels, 90);
const label = flatLabels[0];
const macrosExpected = formatMacrosCompact(label.nutrition);

const prato = parser("{{PRATO_PRINCIPAL}}", 0);
const accs = parser("{{ACOMPANHAMENTOS_LINHAS}}", 0);
const composicao = parser("{{COMPOSICAO}}", 0);
const composicaoLinhas = parser("{{COMPOSICAO_LINHAS}}", 0);
const tamanho = parser("{{TAMANHO_REFEICAO}}", 0);
const cliente = parser("{{CLIENTE}}", 0);
const macros = parser("{{MACROS_COMPACTO}}", 0);

assert(
  prato === "ABOBRINHA RECHEADA COM FRANGO",
  "PRATO_PRINCIPAL nao deve conter acompanhamento.",
);
assert(
  !String(prato).includes("ARROZ BRANCO"),
  "PRATO_PRINCIPAL trouxe acompanhamento indevido.",
);
assert(
  String(accs).includes("ARROZ BRANCO"),
  "ACOMPANHAMENTOS_LINHAS nao trouxe o acompanhamento.",
);
assert(
  !String(accs).includes("ABOBRINHA RECHEADA COM FRANGO"),
  "ACOMPANHAMENTOS_LINHAS trouxe o prato principal.",
);
assert(
  composicao === "ABOBRINHA RECHEADA COM FRANGO + ARROZ BRANCO",
  "COMPOSICAO deveria concatenar prato principal e acompanhamento.",
);
assert(
  String(composicaoLinhas).includes(
    "ABOBRINHA RECHEADA COM FRANGO\n* ARROZ BRANCO",
  ),
  "COMPOSICAO_LINHAS deveria separar prato principal e acompanhamento em linhas.",
);
assert(
  tamanho === "250G",
  "TAMANHO_REFEICAO deveria retornar o tamanho da refeicao.",
);
assert(cliente === "EVERTON", "CLIENTE deveria retornar o nome do cliente.");
assert(
  macros === macrosExpected,
  "MACROS_COMPACTO nao correspondeu aos macros calculados.",
);

const zpl = generateZPLForBatch(template, 100, 60, flatLabels, (content, index) =>
  parser(content, index),
);

const printOverrides = {
  [buildOverrideKey(label.id, "customer")]: "EVER TESTE",
  [buildOverrideKey(label.id, "macros")]: "P 50g • C 90g • G 10g",
};

const zplWithOverride = generateZPLForBatch(
  template,
  100,
  60,
  flatLabels,
  (content, index, element) => {
    const override = element
      ? printOverrides[
          buildOverrideKey(String(flatLabels[index]?.id ?? "label"), element.id)
        ]
      : undefined;
    return override ?? parser(content, index);
  },
);

assert(
  zpl.includes("ABOBRINHA RECHEADA COM FRANGO"),
  "ZPL nao contem o prato principal.",
);
assert(zpl.includes("ARROZ BRANCO"), "ZPL nao contem o acompanhamento.");
assert(
  zpl.includes("\\&"),
  "COMPOSICAO_LINHAS/ACOMPANHAMENTOS_LINHAS deveriam usar quebra ZPL com \\&.",
);
assert(!zpl.includes("TEXTO"), "ZPL ainda contem TEXTO de placeholder.");
assert(!zpl.includes("Preview"), "ZPL ainda contem Preview.");
assert(!zpl.includes("{\""), "ZPL ainda contem JSON cru.");
assert(!/\{\{[^}]+\}\}/.test(zpl), "ZPL ainda contem placeholder sem resolver.");
assert(
  zplWithOverride.includes("EVER TESTE"),
  "ZPL com override nao aplicou cliente sobrescrito.",
);
assert(
  zplWithOverride.includes("P 50g • C 90g • G 10g"),
  "ZPL com override nao aplicou macros sobrescritos.",
);
assert(
  template.find((element) => element.id === "customer")?.content ===
    "{{CLIENTE}}",
  "Template nao deveria perder o token {{CLIENTE}}.",
);
assert(
  template.find((element) => element.id === "macros")?.content ===
    "{{MACROS_COMPACTO}}",
  "Template nao deveria perder o token {{MACROS_COMPACTO}}.",
);

console.log("Zebra P1.4 smoke");
console.log({
  prato,
  accs,
  composicao,
  composicaoLinhas,
  tamanho,
  cliente,
  macros,
  overrideCliente: printOverrides[buildOverrideKey(label.id, "customer")],
  overrideMacros: printOverrides[buildOverrideKey(label.id, "macros")],
});
console.log(zpl);
console.log(zplWithOverride);
