// client/src/pages/adminOrders/components/orderDrawer/print/LabelNutritionTable.tsx
// ✅ FIX: Adiciona leitura dos campos snake_case que faltavam:
//   yield_weight, fat_saturated, fat_trans, added_sugars, energy_kj

import React from "react";

interface LabelNutritionTableProps {
  data: unknown;
  fontSize?: number;
  variant?: "vertical" | "horizontal" | "linear";
  target?: "web" | "zebra" | "preview";
}

const deaccent = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const safeText = (s: unknown, target: string) => {
  const str = String(s ?? "");
  return target === "zebra" ? deaccent(str) : str;
};

function safeJsonParse(val: unknown): Record<string, unknown> | null {
  if (val == null) return null;
  if (typeof val === "object") return val as Record<string, unknown>;
  if (typeof val === "string") {
    const s = val.trim();
    if (!s || s === "null" || s === "undefined") return null;
    try {
      const unwrapped = s.startsWith('"') && s.endsWith('"') ? JSON.parse(s) : s;
      const parsed = typeof unwrapped === "string" ? JSON.parse(unwrapped) : unwrapped;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch { return null; }
  }
  return null;
}

const parseNum = (val: unknown) => {
  if (val === undefined || val === null || val === "") return 0;
  const num = Number(String(val).replace(",", "."));
  return Number.isFinite(num) ? num : 0;
};

type Row = {
  key: string;
  label: string;
  val: number;
  unit: "kcal" | "kJ" | "g" | "mg";
  indent?: boolean;
  isSecondary?: boolean;
};

export const LabelNutritionTable = ({
  data,
  fontSize = 7,
  variant = "vertical",
  target = "web",
}: LabelNutritionTableProps) => {
  const scale = (size: number) => `${(size / 7) * fontSize}px`;

  const info = safeJsonParse(data);
  if (!info) return null;

  // ✅ FIX: lê camelCase E snake_case para todos os campos
  const energyKcal    = Math.round(parseNum(info.energyKcal    ?? info.energy_kcal  ?? info.kcal));
  const energyKj      = Math.round(parseNum(info.energyKj      ?? info.energy_kj    ?? (energyKcal * 4.2)));
  const carbs         = parseNum(info.carbs         ?? info.carbohydrates ?? 0);
  const sugars        = parseNum(info.sugars        ?? info.totalSugars   ?? 0);
  const addedSugars   = parseNum(info.addedSugars   ?? info.added_sugars  ?? 0);
  const proteins      = parseNum(info.proteins      ?? info.protein        ?? 0);
  const fatTotal      = parseNum(info.fatTotal      ?? info.fat_total      ?? info.fats ?? 0);
  const fatSaturated  = parseNum(info.fatSaturated  ?? info.fat_saturated  ?? info.saturatedFats ?? 0);
  const fatTrans      = parseNum(info.fatTrans      ?? info.fat_trans      ?? info.transFats ?? 0);
  const fiber         = parseNum(info.fiber         ?? info.dietary_fiber  ?? 0);
  const sodium        = parseNum(info.sodium        ?? info.salt           ?? 0);

  // ✅ FIX: yield_weight agora lido em snake_case também
  const portion = parseNum(info.yieldWeight ?? info.yield_weight ?? 0) || 100;

  const rows: Row[] = [
    { key: "energyKcal",   label: "Valor energetico",     val: energyKcal,   unit: "kcal" },
    { key: "energyKj",     label: "Valor energetico",     val: energyKj,     unit: "kJ",  isSecondary: true },
    { key: "carbs",        label: "Carboidratos",          val: carbs,        unit: "g" },
    { key: "sugars",       label: "Acucares totais",       val: sugars,       unit: "g",   indent: true },
    { key: "addedSugars",  label: "Acucares adicionados",  val: addedSugars,  unit: "g",   indent: true },
    { key: "proteins",     label: "Proteinas",             val: proteins,     unit: "g" },
    { key: "fatTotal",     label: "Gorduras totais",       val: fatTotal,     unit: "g" },
    { key: "fatSaturated", label: "Gorduras saturadas",    val: fatSaturated, unit: "g",   indent: true },
    { key: "fatTrans",     label: "Gorduras trans",        val: fatTrans,     unit: "g",   indent: true },
    { key: "fiber",        label: "Fibra alimentar",       val: fiber,        unit: "g" },
    { key: "sodium",       label: "Sodio",                 val: sodium,       unit: "mg" },
  ];

  const formatVal = (val: number, unit: Row["unit"]) => {
    const isInt = unit === "kcal" || unit === "kJ" || unit === "mg";
    return val.toLocaleString("pt-BR", {
      minimumFractionDigits: isInt ? 0 : 1,
      maximumFractionDigits: isInt ? 0 : 1,
    });
  };

  // ── Variante LINEAR ────────────────────────────────────────────────────────
  if (variant === "linear") {
    return (
      <div className="border-[1.5px] border-black p-1 bg-white leading-tight uppercase font-bold text-justify" style={{ fontSize: scale(6) }}>
        <strong>{safeText("INFORMACAO NUTRICIONAL:", target)}</strong>{" "}
        {safeText(`Porcao ${portion}g;`, target)}{" "}
        {rows.map((r, i) => (
          <span key={r.key}>
            {safeText(r.label, target)}: {formatVal(r.val, r.unit)}{r.unit}
            {i === rows.length - 1 ? "." : "; "}
          </span>
        ))}
        <br />
        <span style={{ fontSize: scale(5) }}>
          {safeText("* % VD com base em dieta de 2.000 kcal.", target)}
        </span>
      </div>
    );
  }

  // ── Variante HORIZONTAL ───────────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <div className="border-[1.5px] border-black bg-white flex flex-col w-full h-full font-sans overflow-hidden">
        <div className="border-b-[1.5px] border-black p-0.5 font-black uppercase text-center" style={{ fontSize: scale(7.5) }}>
          {safeText("Informacao Nutricional", target)}
        </div>
        <div className="border-b border-black p-0.5 font-bold text-center" style={{ fontSize: scale(6) }}>
          {safeText(`Porcao: ${portion}g`, target)}
        </div>
        <div className="flex flex-wrap flex-1 overflow-hidden">
          {rows.map((row) => (
            <div key={row.key} className="border-r border-b border-black flex-[1_1_30%] p-0.5 flex flex-col items-center justify-center text-center last:border-r-0">
              <span style={{ fontSize: scale(5) }} className="font-bold leading-none uppercase">
                {safeText(row.label, target)}
              </span>
              <span style={{ fontSize: scale(6.5) }} className="font-black">
                {formatVal(row.val, row.unit)}{row.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Variante VERTICAL (padrão ANVISA) ─────────────────────────────────────
  return (
    <div className="border-[1.5px] border-black bg-white leading-none w-full text-black flex flex-col box-border font-sans h-full overflow-hidden">
      <div className="border-b-[1.5px] border-black font-black uppercase text-left" style={{ fontSize: scale(8), padding: "2px 4px" }}>
        {safeText("Informacao Nutricional", target)}
      </div>
      <div className="border-b-[1px] border-black font-bold" style={{ fontSize: scale(6.5), padding: "2px 4px" }}>
        {safeText(`Porcao: ${portion}g (1 unidade)`, target)}
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex border-b-[1px] border-black font-black uppercase bg-slate-50" style={{ fontSize: scale(6) }}>
          <div className="flex-[3] border-r border-black px-1 py-0.5">{safeText("Constituintes", target)}</div>
          <div className="flex-1 px-1 py-0.5 text-right">{safeText("Qtd.", target)}</div>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="flex border-b border-black last:border-b-0 items-center" style={{ fontSize: scale(6.5) }}>
            <div className={`flex-[3] border-r border-black px-1 py-0.5 ${row.indent ? "italic font-normal pl-3" : "font-bold uppercase"}`}>
              {safeText(row.label, target)} {`(${row.unit})`}
            </div>
            <div className="flex-1 px-1 py-0.5 text-right font-black">
              {formatVal(row.val, row.unit)}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t-[1.5px] border-black font-bold text-justify" style={{ fontSize: scale(4.5), padding: "2px", lineHeight: "1.1" }}>
        {safeText("* Valores diarios com base em uma dieta de 2.000 kcal.", target)}
      </div>
    </div>
  );
};