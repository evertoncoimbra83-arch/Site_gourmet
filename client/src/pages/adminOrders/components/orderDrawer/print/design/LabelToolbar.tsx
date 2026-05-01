import React from "react";
import { Button } from "@/components/ui/button";
import { 
  User, Utensils, ListPlus, Calendar, 
  Hash, Clock, ScrollText, Activity, 
  Type, Image as ImageIcon, Square 
} from "lucide-react";

interface LabelToolbarProps {
  // ✅ Tipagem ajustada para aceitar os parâmetros opcionais corretamente
  onAdd: (type: 'text' | 'variable' | 'image' | 'box', content?: string, fontSize?: number, width?: number) => void;
  onImageUpload: () => void;
}

export function LabelToolbar({ onAdd, onImageUpload }: LabelToolbarProps) {
  return (
    <div className="space-y-4 text-left animate-in fade-in slide-in-from-left-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <span className="text-[10px] font-black uppercase text-slate-900 italic tracking-tighter">
          Toolbar <span className="text-emerald-500">Design</span>
        </span>
      </div>

      {/* VARIÁVEIS DINÂMICAS */}
      <div className="space-y-2">
        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Dados Dinâmicos</p>
        <div className="grid grid-cols-2 gap-2">
          {/* ✅ Passando os argumentos na ordem correta: type, content, fontSize, width */}
          <Button variant="outline" onClick={() => onAdd('variable', '{{CLIENTE}}', 14, 80)} className="h-8 text-[9px] font-bold justify-start px-2 bg-white">
            <User size={12} className="mr-1.5 text-slate-400"/> Cliente
          </Button>
          <Button variant="outline" onClick={() => onAdd('variable', '{{NOME_PRATO}}', 12, 80)} className="h-8 text-[9px] font-bold justify-start px-2 bg-white">
            <Utensils size={12} className="mr-1.5 text-slate-400"/> Prato
          </Button>
          <Button variant="outline" onClick={() => onAdd('variable', '{{ACOMPANHAMENTOS}}', 9, 90)} className="h-8 text-[9px] font-bold justify-start px-2 bg-white">
            <ListPlus size={12} className="mr-1.5 text-slate-400"/> Acomp.
          </Button>
          <Button variant="outline" onClick={() => onAdd('variable', '{{DATA_VAL}}', 9, 50)} className="h-8 text-[9px] font-bold justify-start px-2 bg-white">
            <Calendar size={12} className="mr-1.5 text-slate-400"/> Validade
          </Button>
          <Button variant="outline" onClick={() => onAdd('variable', '{{PEDIDO_ID}}', 10, 40)} className="h-8 text-[9px] font-bold justify-start px-2 bg-white">
            <Hash size={12} className="mr-1.5 text-slate-400"/> Pedido
          </Button>
          <Button variant="outline" onClick={() => onAdd('variable', '{{DATA_FAB}}', 9, 50)} className="h-8 text-[9px] font-bold justify-start px-2 bg-white">
            <Clock size={12} className="mr-1.5 text-slate-400"/> Hoje
          </Button>
          
          <Button variant="outline" onClick={() => onAdd('variable', '{{INGREDIENTES}}', 7, 95)} className="h-8 text-[9px] font-bold border-orange-100 text-orange-700 bg-orange-50/30 hover:bg-orange-50 justify-start px-2">
            <ScrollText size={12} className="mr-1.5"/> Ingredientes
          </Button>
          <Button variant="default" onClick={() => onAdd('variable', '{{TABELA_NUTRI}}', 7, 95)} className="h-8 text-[9px] font-black bg-slate-900 text-emerald-400 hover:bg-black shadow-md justify-start px-2 col-span-1">
            <Activity size={12} className="mr-1.5"/> Tabela ANVISA
          </Button>
        </div>
      </div>

      {/* ELEMENTOS GRÁFICOS */}
      <div className="space-y-2">
        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Gráficos & Texto</p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => onAdd('text', 'TEXTO FIXO', 12, 60)} className="h-9 text-[9px] font-bold border-dashed flex-col gap-1 p-0 bg-white">
            <Type size={12}/> <span>Texto</span>
          </Button>
          <Button variant="outline" onClick={() => onAdd('box', '', 0, 50)} className="h-9 text-[9px] font-bold border-dashed flex-col gap-1 p-0 bg-white">
            <Square size={12}/> <span>Caixa</span>
          </Button>
          <Button variant="outline" onClick={onImageUpload} className="h-9 text-[9px] font-bold border-dashed flex-col gap-1 p-0 hover:text-purple-600 bg-white">
            <ImageIcon size={12}/> <span>Logo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}