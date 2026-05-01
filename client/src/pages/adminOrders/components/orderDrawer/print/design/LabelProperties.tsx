import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Trash2, FlipHorizontal, Type, Box, Image as ImageIcon } from "lucide-react";
import { LabelElement } from "./LabelCanvas";
import { cn } from "@/lib/utils";

interface LabelPropertiesProps {
  selectedElement: LabelElement | undefined;
  setSelectedId: (id: string | null) => void;
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
}

export function LabelProperties({ 
  selectedElement, 
  setSelectedId, 
  setElements 
}: LabelPropertiesProps) {
  
  if (!selectedElement) return (
    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Selecione um item</p>
    </div>
  );

  const updateEl = (data: Partial<LabelElement>) => {
    setElements((prev: LabelElement[]) => 
      prev.map(el => el.id === selectedElement.id ? { ...el, ...data } : el)
    );
  };

  const deleteEl = () => {
    setElements((prev) => prev.filter(el => el.id !== selectedElement.id));
    setSelectedId(null);
  };

  return (
    <div className="p-4 bg-slate-100 rounded-[1.5rem] space-y-4 border border-slate-200 shadow-inner animate-in fade-in slide-in-from-right-4">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          {selectedElement.type === 'text' && <Type size={12} className="text-slate-400" />}
          {selectedElement.type === 'box' && <Box size={12} className="text-slate-400" />}
          {selectedElement.type === 'image' && <ImageIcon size={12} className="text-slate-400" />}
          <span className="text-[9px] font-black uppercase italic text-slate-500 tracking-tighter">Propriedades</span>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50" 
            onClick={deleteEl}
          >
            <Trash2 size={12}/>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-slate-400 bg-white shadow-sm" 
            onClick={() => setSelectedId(null)}
          >
            <X size={12}/>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* POSICIONAMENTO X e Y */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-[8px] text-slate-400 uppercase font-black ml-1">Posição X</p>
            <Input 
              type="number" 
              className="h-8 bg-white text-xs border-none font-bold focus-visible:ring-1 focus-visible:ring-emerald-500" 
              value={Math.round(selectedElement.x)} 
              onChange={(e) => updateEl({ x: Number(e.target.value) })} 
            />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] text-slate-400 uppercase font-black ml-1">Posição Y</p>
            <Input 
              type="number" 
              className="h-8 bg-white text-xs border-none font-bold focus-visible:ring-1 focus-visible:ring-emerald-500" 
              value={Math.round(selectedElement.y)} 
              onChange={(e) => updateEl({ y: Number(e.target.value) })} 
            />
          </div>
        </div>

        {/* DIMENSÕES LARGURA E ALTURA */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-[8px] text-slate-400 uppercase font-black ml-1">Largura (px)</p>
            <Input 
              type="number" 
              className="h-8 bg-white text-xs border-none font-bold focus-visible:ring-1 focus-visible:ring-emerald-500" 
              value={Math.round(selectedElement.width)} 
              onChange={(e) => updateEl({ width: Number(e.target.value) })} 
            />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] text-slate-400 uppercase font-black ml-1">Altura (px)</p>
            <Input 
              type="number" 
              className="h-8 bg-white text-xs border-none font-bold focus-visible:ring-1 focus-visible:ring-emerald-500" 
              value={Math.round(selectedElement.height)} 
              onChange={(e) => updateEl({ height: Number(e.target.value) })} 
            />
          </div>
        </div>

        {/* ESTILO (FONTE E CORES) */}
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <p className="text-[8px] text-slate-400 uppercase font-black ml-1">Tam. Fonte</p>
            <Input 
              type="number" 
              className="h-8 bg-white text-xs border-none font-bold" 
              value={selectedElement.fontSize || 10} 
              onChange={(e) => updateEl({ fontSize: Number(e.target.value) })} 
            />
          </div>
          
          {selectedElement.type !== 'image' && (
            <div className="flex-1 flex flex-col justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                  "h-8 text-[9px] font-black uppercase border-none shadow-sm gap-1 transition-all",
                  selectedElement.backgroundColor === 'black' ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                )} 
                onClick={() => updateEl({ 
                  color: selectedElement.color === 'white' ? 'black' : 'white', 
                  backgroundColor: selectedElement.backgroundColor === 'black' ? 'transparent' : 'black' 
                })}
              >
                <FlipHorizontal size={10} /> Inverter
              </Button>
            </div>
          )}
        </div>

        {/* CONTEÚDO (APENAS TEXTO) */}
        {selectedElement.type === 'text' && (
          <div className="space-y-1">
            <p className="text-[8px] text-slate-400 uppercase font-black ml-1">Conteúdo do Texto</p>
            <Input 
              className="h-8 text-xs bg-white font-bold border-none" 
              value={selectedElement.content} 
              onChange={(e) => updateEl({ content: e.target.value })} 
            />
          </div>
        )}
      </div>
    </div>
  );
}