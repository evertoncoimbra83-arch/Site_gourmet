import React from "react";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Barcode,
  Calendar,
  Clock,
  Hash,
  Image as ImageIcon,
  ListPlus,
  ScrollText,
  Square,
  Type,
  User,
  Utensils,
} from "lucide-react";

interface LabelToolbarProps {
  onAdd: (
    type: "text" | "variable" | "image" | "box" | "barcode",
    content?: string,
    fontSize?: number,
    width?: number,
  ) => void;
  onImageUpload: () => void;
}

export function LabelToolbar({ onAdd, onImageUpload }: LabelToolbarProps) {
  return (
    <div className="animate-in space-y-4 text-left fade-in slide-in-from-left-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <span className="text-[10px] font-black uppercase italic tracking-tighter text-slate-900">
          Toolbar <span className="text-emerald-500">Design</span>
        </span>
      </div>

      <div className="space-y-2">
        <p className="ml-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
          Dados Dinâmicos
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{CLIENTE}}", 14, 80)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <User size={12} className="mr-1.5 text-slate-400" /> Cliente
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{PRATO_PRINCIPAL}}", 12, 80)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <Utensils size={12} className="mr-1.5 text-slate-400" /> Prato Principal
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{TAMANHO_REFEICAO}}", 12, 60)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <Utensils size={12} className="mr-1.5 text-slate-400" /> Tam. Refeição
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{COMPOSICAO}}", 10, 90)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <ListPlus size={12} className="mr-1.5 text-slate-400" /> Comp. Linear
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{COMPOSICAO_LINHAS}}", 11, 95)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <ListPlus size={12} className="mr-1.5 text-slate-400" /> Comp. Linhas (*)
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{ACOMPANHAMENTOS_LINHAS}}", 10, 95)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <ListPlus size={12} className="mr-1.5 text-slate-400" /> Acomp. Linhas (*)
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{DATA_VAL}}", 9, 50)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <Calendar size={12} className="mr-1.5 text-slate-400" /> Validade
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{DATA_FAB}}", 9, 50)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <Clock size={12} className="mr-1.5 text-slate-400" /> Hoje
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{PEDIDO_ID}}", 10, 40)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <Hash size={12} className="mr-1.5 text-slate-400" /> Pedido
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{INGREDIENTES}}", 7, 95)}
            className="h-8 justify-start border-orange-100 bg-orange-50/30 px-2 text-[9px] font-bold text-orange-700 hover:bg-orange-50"
          >
            <ScrollText size={12} className="mr-1.5" /> Ingredientes
          </Button>
        </div>

        <p className="ml-1 mt-3 text-[7px] font-black uppercase tracking-widest text-slate-400">
          Prefixos de Acompanhamento (Linhas)
        </p>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <div className="space-y-1">
            <p className="text-[6.5px] font-bold uppercase tracking-widest text-slate-400 ml-1">Composição:</p>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                onClick={() => onAdd("variable", "{{COMPOSICAO_LINHAS_MAIS}}", 11, 95)}
                className="h-6 justify-start bg-slate-50 border border-slate-100 px-1.5 text-[8px] font-medium"
              >
                Mais (+)
              </Button>
              <Button
                variant="ghost"
                onClick={() => onAdd("variable", "{{COMPOSICAO_LINHAS_PONTO}}", 11, 95)}
                className="h-6 justify-start bg-slate-50 border border-slate-100 px-1.5 text-[8px] font-medium"
              >
                Ponto (•)
              </Button>
              <Button
                variant="ghost"
                onClick={() => onAdd("variable", "{{COMPOSICAO_LINHAS_SETA}}", 11, 95)}
                className="h-6 justify-start bg-slate-50 border border-slate-100 px-1.5 text-[8px] font-medium"
              >
                Seta (↳)
              </Button>
              <Button
                variant="ghost"
                onClick={() => onAdd("variable", "{{COMPOSICAO_LINHAS_SEM}}", 11, 95)}
                className="h-6 justify-start bg-slate-50 border border-slate-100 px-1.5 text-[8px] font-medium"
              >
                Sem prefixo
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[6.5px] font-bold uppercase tracking-widest text-slate-400 ml-1">Acompanhamentos:</p>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                onClick={() => onAdd("variable", "{{ACOMPANHAMENTOS_LINHAS_MAIS}}", 10, 95)}
                className="h-6 justify-start bg-slate-50 border border-slate-100 px-1.5 text-[8px] font-medium"
              >
                Mais (+)
              </Button>
              <Button
                variant="ghost"
                onClick={() => onAdd("variable", "{{ACOMPANHAMENTOS_LINHAS_PONTO}}", 10, 95)}
                className="h-6 justify-start bg-slate-50 border border-slate-100 px-1.5 text-[8px] font-medium"
              >
                Ponto (•)
              </Button>
              <Button
                variant="ghost"
                onClick={() => onAdd("variable", "{{ACOMPANHAMENTOS_LINHAS_SETA}}", 10, 95)}
                className="h-6 justify-start bg-slate-50 border border-slate-100 px-1.5 text-[8px] font-medium"
              >
                Seta (↳)
              </Button>
              <Button
                variant="ghost"
                onClick={() => onAdd("variable", "{{ACOMPANHAMENTOS_LINHAS_SEM}}", 10, 95)}
                className="h-6 justify-start bg-slate-50 border border-slate-100 px-1.5 text-[8px] font-medium"
              >
                Sem prefixo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="ml-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
          Nutrição & Macros
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            onClick={() => onAdd("variable", "{{TABELA_NUTRI}}", 7, 95)}
            className="col-span-2 h-8 justify-start bg-slate-900 px-2 text-[9px] font-black text-emerald-400 shadow-md hover:bg-black"
          >
            <Activity size={12} className="mr-1.5" /> Tabela Completa (ANVISA)
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{TABELA_NUTRI_LINEAR}}", 8, 95)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <Activity size={12} className="mr-1.5 text-slate-400" /> Tabela Linear
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{MACROS_COMPACTO}}", 9, 90)}
            className="h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <Activity size={12} className="mr-1.5 text-slate-400" /> Macros Compactos
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("variable", "{{MACROS_LINHAS}}", 8, 90)}
            className="col-span-2 h-8 justify-start bg-white px-2 text-[9px] font-bold"
          >
            <Activity size={12} className="mr-1.5 text-slate-400" /> Macros em Linhas
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="ml-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
          Gráficos & Texto
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => onAdd("text", "TEXTO FIXO", 12, 60)}
            className="h-9 flex-col gap-1 border-dashed bg-white p-0 text-[9px] font-bold"
          >
            <Type size={12} /> <span>Texto</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("box", "", 0, 50)}
            className="h-9 flex-col gap-1 border-dashed bg-white p-0 text-[9px] font-bold"
          >
            <Square size={12} /> <span>Caixa</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onAdd("barcode", "{{PEDIDO_ID}}", 8, 140)}
            className="h-9 flex-col gap-1 border-dashed bg-white p-0 text-[9px] font-bold hover:text-emerald-600"
          >
            <Barcode size={12} /> <span>Barras</span>
          </Button>
          <Button
            variant="outline"
            onClick={onImageUpload}
            className="h-9 flex-col gap-1 border-dashed bg-white p-0 text-[9px] font-bold hover:text-purple-600"
          >
            <ImageIcon size={12} /> <span>Logo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
