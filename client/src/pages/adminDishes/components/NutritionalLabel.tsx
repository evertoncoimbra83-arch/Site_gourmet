import React from "react";

/**
 * 📋 INTERFACE OFICIAL DE NUTRIÇÃO (Roadmap Fase 1 & 2)
 * Garante que o componente leia as colunas escalares individualmente,
 * eliminando a dependência do objeto nutritional_info e o erro 'no-explicit-any'.
 */
interface NutritionalData {
  energyKj?: string | number;
  energyKcal?: string | number;
  carbs?: string | number;
  proteins?: string | number;
  fatTotal?: string | number;
  fatSaturated?: string | number;
  fatTrans?: string | number;
  fiber?: string | number;
  sodium?: string | number;
}

interface NutritionalLabelProps {
  data: NutritionalData;
}

export function NutritionalLabel({ data }: NutritionalLabelProps) {
  /**
   * Formata os valores nutricionais. 
   * Garante que "0" seja exibido se o valor for null/undefined/string vazia.
   */
  const formatVal = (v: string | number | undefined) => {
    if (v === undefined || v === null || v === "") return "0";
    return typeof v === "number" ? v.toFixed(1) : v;
  };

  return (
    <div className="border-2 border-slate-200 p-6 bg-white font-sans text-slate-800 max-w-sm mx-auto shadow-sm text-left rounded-2xl">
      {/* Cabeçalho Estilo Rótulo ANVISA */}
      <h2 className="text-xl font-black border-b-4 border-slate-900 pb-1 mb-2 uppercase italic tracking-tighter">
        Fatos <span className="text-emerald-600">Nutricionais</span>
      </h2>
      
      <div className="flex justify-between font-bold border-b-2 border-slate-900 pb-1 mb-2 text-xs uppercase tracking-wider">
        <span>Quantidade por porção</span>
        <span>Ref. 100 g</span>
      </div>

      <div className="space-y-1 text-sm">
        {/* Bloco de Energia: Sincronizado com colunas energyKj e energyKcal */}
        <div className="flex justify-between border-b border-slate-200 py-1.5 font-bold">
          <span>Valor Energético</span>
          <span>{formatVal(data.energyKj)} kJ / {formatVal(data.energyKcal)} kcal</span>
        </div>

        {/* Macronutrientes Oficiais do Novo Schema */}
        <div className="flex justify-between border-b border-slate-200 py-1.5 font-bold">
          <span>Carboidratos</span>
          <span>{formatVal(data.carbs)} g</span>
        </div>
        
        <div className="flex justify-between border-b border-slate-200 py-1.5 font-bold">
          <span>Proteínas</span>
          <span>{formatVal(data.proteins)} g</span>
        </div>

        {/* Bloco de Gorduras e Detalhamento (Saturadas/Trans) */}
        <div className="pt-1">
          <div className="flex justify-between font-bold py-1">
            <span>Gorduras Totais</span>
            <span>{formatVal(data.fatTotal)} g</span>
          </div>
          
          <div className="pl-4 space-y-1 text-xs text-slate-500 italic border-l-2 border-slate-100 ml-1">
            <div className="flex justify-between">
              <span>Gordura Saturada</span>
              <span>{formatVal(data.fatSaturated)} g</span>
            </div>
            <div className="flex justify-between">
              <span>Gordura Trans</span>
              <span>{formatVal(data.fatTrans)} g</span>
            </div>
          </div>
        </div>

        {/* Fibras e Sódio: Pontos Críticos para Dietas Específicas */}
        <div className="flex justify-between border-t border-slate-200 py-1.5 font-bold mt-1">
          <span>Fibra Alimentar</span>
          <span>{formatVal(data.fiber)} g</span>
        </div>
        
        <div className="flex justify-between border-t-2 border-slate-900 py-2 font-black bg-slate-50 px-2 -mx-2 rounded-b-lg">
          <span>Sódio</span>
          <span>{formatVal(data.sodium)} mg</span>
        </div>
      </div>

      <p className="text-[9px] text-slate-400 mt-4 leading-tight italic uppercase font-bold text-center">
        * Valores baseados em uma dieta de 2.000 kcal.
      </p>
    </div>
  );
}