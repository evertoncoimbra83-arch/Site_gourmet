import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Box, FlipHorizontal, Image as ImageIcon, Trash2, Type, X } from "lucide-react";
import type { LabelElement } from "./LabelCanvas";

interface LabelPropertiesProps {
  selectedElement: LabelElement | undefined;
  setSelectedId: (id: string | null) => void;
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
}

export function LabelProperties({
  selectedElement,
  setSelectedId,
  setElements,
}: LabelPropertiesProps) {
  if (!selectedElement) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
          Selecione um item
        </p>
      </div>
    );
  }

  const updateElement = (data: Partial<LabelElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === selectedElement.id ? { ...el, ...data } : el)),
    );
  };

  const deleteElement = () => {
    setElements((prev) => prev.filter((el) => el.id !== selectedElement.id));
    setSelectedId(null);
  };

  return (
    <div className="animate-in space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-100 p-4 shadow-inner fade-in slide-in-from-right-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          {selectedElement.type === "text" && <Type size={12} className="text-slate-400" />}
          {selectedElement.type === "box" && <Box size={12} className="text-slate-400" />}
          {selectedElement.type === "image" && <ImageIcon size={12} className="text-slate-400" />}
          <span className="text-[9px] font-black uppercase italic tracking-tighter text-slate-500">
            Propriedades
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-400 hover:bg-red-50 hover:text-red-600"
            onClick={deleteElement}
          >
            <Trash2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-white text-slate-400 shadow-sm"
            onClick={() => setSelectedId(null)}
          >
            <X size={12} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="ml-1 text-[8px] font-black uppercase text-slate-400">Posição X</p>
            <Input
              type="number"
              className="h-8 border-none bg-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-emerald-500"
              value={Math.round(selectedElement.x)}
              onChange={(event) => updateElement({ x: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <p className="ml-1 text-[8px] font-black uppercase text-slate-400">Posição Y</p>
            <Input
              type="number"
              className="h-8 border-none bg-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-emerald-500"
              value={Math.round(selectedElement.y)}
              onChange={(event) => updateElement({ y: Number(event.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="ml-1 text-[8px] font-black uppercase text-slate-400">Largura (px)</p>
            <Input
              type="number"
              className="h-8 border-none bg-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-emerald-500"
              value={Math.round(selectedElement.width)}
              onChange={(event) => updateElement({ width: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <p className="ml-1 text-[8px] font-black uppercase text-slate-400">Altura (px)</p>
            <Input
              type="number"
              className="h-8 border-none bg-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-emerald-500"
              value={Math.round(selectedElement.height)}
              onChange={(event) => updateElement({ height: Number(event.target.value) })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <p className="ml-1 text-[8px] font-black uppercase text-slate-400">Tam. Fonte</p>
            <Input
              type="number"
              className="h-8 border-none bg-white text-xs font-bold"
              value={selectedElement.fontSize || 10}
              onChange={(event) => updateElement({ fontSize: Number(event.target.value) })}
            />
          </div>

          {selectedElement.type !== "image" && (
            <div className="flex flex-1 flex-col justify-end">
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-8 gap-1 border-none text-[9px] font-black uppercase shadow-sm transition-all",
                  selectedElement.backgroundColor === "black"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-900",
                )}
                onClick={() =>
                  updateElement({
                    color: selectedElement.color === "white" ? "black" : "white",
                    backgroundColor:
                      selectedElement.backgroundColor === "black" ? "transparent" : "black",
                  })
                }
              >
                <FlipHorizontal size={10} /> Inverter
              </Button>
            </div>
          )}
        </div>

        {selectedElement.type === "text" && (
          <div className="space-y-1">
            <p className="ml-1 text-[8px] font-black uppercase text-slate-400">
              Conteúdo do Texto
            </p>
            <Input
              className="h-8 border-none bg-white text-xs font-bold"
              value={selectedElement.content}
              onChange={(event) => updateElement({ content: event.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
