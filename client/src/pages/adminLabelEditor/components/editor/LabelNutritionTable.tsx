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
    } catch {
      return null;
    }
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

  const energyKcal = Math.round(parseNum(info.energyKcal ?? info.energy_kcal ?? info.kcal));
  const energyKj = Math.round(
    parseNum(info.energyKj ?? info.energy_kj ?? energyKcal * 4.2),
  );
  const carbs = parseNum(info.carbs ?? info.carbohydrates ?? 0);
  const sugars = parseNum(info.sugars ?? info.totalSugars ?? 0);
  const addedSugars = parseNum(info.addedSugars ?? info.added_sugars ?? 0);
  const proteins = parseNum(info.proteins ?? info.protein ?? 0);
  const fatTotal = parseNum(info.fatTotal ?? info.fat_total ?? info.fats ?? 0);
  const fatSaturated = parseNum(
    info.fatSaturated ?? info.fat_saturated ?? info.saturatedFats ?? 0,
  );
  const fatTrans = parseNum(info.fatTrans ?? info.fat_trans ?? info.transFats ?? 0);
  const fiber = parseNum(info.fiber ?? info.dietary_fiber ?? 0);
  const sodium = parseNum(info.sodium ?? info.salt ?? 0);
  const portion = parseNum(info.yieldWeight ?? info.yield_weight ?? 0) || 100;

  const rows: Row[] = [
    { key: "energyKcal", label: "Valor energetico", val: energyKcal, unit: "kcal" },
    { key: "energyKj", label: "Valor energetico", val: energyKj, unit: "kJ", isSecondary: true },
    { key: "carbs", label: "Carboidratos", val: carbs, unit: "g" },
    { key: "sugars", label: "Acucares totais", val: sugars, unit: "g", indent: true },
    { key: "addedSugars", label: "Acucares adicionados", val: addedSugars, unit: "g", indent: true },
    { key: "proteins", label: "Proteinas", val: proteins, unit: "g" },
    { key: "fatTotal", label: "Gorduras totais", val: fatTotal, unit: "g" },
    { key: "fatSaturated", label: "Gorduras saturadas", val: fatSaturated, unit: "g", indent: true },
    { key: "fatTrans", label: "Gorduras trans", val: fatTrans, unit: "g", indent: true },
    { key: "fiber", label: "Fibra alimentar", val: fiber, unit: "g" },
    { key: "sodium", label: "Sodio", val: sodium, unit: "mg" },
  ];

  const formatVal = (val: number, unit: Row["unit"]) => {
    const isInt = unit === "kcal" || unit === "kJ" || unit === "mg";
    return val.toLocaleString("pt-BR", {
      minimumFractionDigits: isInt ? 0 : 1,
      maximumFractionDigits: isInt ? 0 : 1,
    });
  };

  if (variant === "linear") {
    return (
      <div
        className="bg-white p-1 text-justify font-bold uppercase leading-tight"
        style={{ border: "1.5px solid black", fontSize: scale(6) }}
      >
        <strong>{safeText("INFORMACAO NUTRICIONAL:", target)}</strong>{" "}
        {safeText(`Porcao ${portion}g;`, target)}{" "}
        {rows.map((r, i) => (
          <span key={r.key}>
            {safeText(r.label, target)}: {formatVal(r.val, r.unit)}
            {r.unit}
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

  if (variant === "horizontal") {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden border-[1.5px] border-black bg-white font-sans">
        <div
          className="border-b-[1.5px] border-black p-0.5 text-center font-black uppercase"
          style={{ fontSize: scale(7.5) }}
        >
          {safeText("Informacao Nutricional", target)}
        </div>
        <div
          className="border-b border-black p-0.5 text-center font-bold"
          style={{ fontSize: scale(6) }}
        >
          {safeText(`Porcao: ${portion}g`, target)}
        </div>
        <div className="flex flex-1 flex-wrap overflow-hidden">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-[1_1_30%] flex-col items-center justify-center border-b border-r border-black p-0.5 text-center last:border-r-0"
            >
              <span style={{ fontSize: scale(5) }} className="font-bold uppercase leading-none">
                {safeText(row.label, target)}
              </span>
              <span style={{ fontSize: scale(6.5) }} className="font-black">
                {formatVal(row.val, row.unit)}
                {row.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="box-border flex h-full w-full flex-col overflow-hidden border-[1.5px] border-black bg-white font-sans leading-none text-black">
      <div
        className="border-b-[1.5px] border-black px-1 py-[2px] text-left font-black uppercase"
        style={{ fontSize: scale(8) }}
      >
        {safeText("Informacao Nutricional", target)}
      </div>
      <div
        className="border-b border-black px-1 py-[2px] font-bold"
        style={{ fontSize: scale(6.5) }}
      >
        {safeText(`Porcao: ${portion}g (1 unidade)`, target)}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          className="flex border-b border-black bg-slate-50 font-black uppercase"
          style={{ fontSize: scale(6) }}
        >
          <div className="flex-[3] border-r border-black px-1 py-0.5">
            {safeText("Constituintes", target)}
          </div>
          <div className="flex-1 px-1 py-0.5 text-right">{safeText("Qtd.", target)}</div>
        </div>
        {rows.map((row) => (
          <div
            key={row.key}
            className="last:border-b-0 flex items-center border-b border-black"
            style={{ fontSize: scale(6.5) }}
          >
            <div
              className={`flex-[3] border-r border-black px-1 py-0.5 ${
                row.indent ? "pl-3 font-normal italic" : "font-bold uppercase"
              }`}
            >
              {safeText(row.label, target)} {`(${row.unit})`}
            </div>
            <div className="flex-1 px-1 py-0.5 text-right font-black">
              {formatVal(row.val, row.unit)}
            </div>
          </div>
        ))}
      </div>
      <div
        className="border-t-[1.5px] border-black p-[2px] text-justify font-bold"
        style={{ fontSize: scale(4.5), lineHeight: "1.1" }}
      >
        {safeText("* Valores diarios com base em uma dieta de 2.000 kcal.", target)}
      </div>
    </div>
  );
};
