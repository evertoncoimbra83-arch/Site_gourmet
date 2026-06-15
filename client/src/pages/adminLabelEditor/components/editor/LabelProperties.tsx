import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Barcode, Box, FlipHorizontal, Image as ImageIcon, Trash2, Type, X } from "lucide-react";
import type { LabelElement } from "./LabelCanvas";
import { sanitizeCode128BarcodeValue } from "../../print-engine/zplEscaping";
import { validateImageDataUrl } from "../../print-engine/zplImage";

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
          Selecione um elemento da etiqueta para editar rapidamente.
        </p>
      </div>
    );
  }

  const updateElement = (data: Partial<LabelElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === selectedElement.id ? { ...el, ...data } : el)),
    );
  };

  const updateBarcodeContent = (content: string) => {
    const allowsTemplate = /^\{\{(?:PEDIDO_ID|LOTE)\}\}$/i.test(content.trim());
    if (!allowsTemplate && content && !sanitizeCode128BarcodeValue(content).isValid) return;
    updateElement({ content });
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
          {selectedElement.type === "barcode" && <Barcode size={12} className="text-slate-400" />}
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

          {selectedElement.type !== "image" && selectedElement.type !== "barcode" && (
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
          <div className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
            <p className="ml-1 text-[8px] font-black uppercase tracking-wider text-emerald-600">
              Ajuste rápido de impressão
            </p>
            <Textarea
              className="min-h-[60px] border-none bg-white text-xs font-bold shadow-sm resize-y"
              value={selectedElement.content}
              onChange={(event) => updateElement({ content: event.target.value })}
            />
            {/\{\{[^}]+\}\}/gi.test(selectedElement.content || "") && (
              <p className="ml-1 text-[8px] font-semibold text-amber-600 leading-normal">
                ⚠️ Você está editando uma variável dinâmica. Substituir por texto fixo removerá o preenchimento automático.
              </p>
            )}
            {selectedElement.content?.toUpperCase().includes("{{COMPOSICAO}}") && !selectedElement.content?.toUpperCase().includes("{{COMPOSICAO_LINHAS}}") && (
              <div className="ml-1 mt-1 text-[8px] font-semibold text-blue-600 border-t border-blue-100 pt-1">
                💡 Dica: Use <code className="font-mono font-bold text-blue-800 bg-blue-100/60 px-1 rounded">{"{{COMPOSICAO_LINHAS}}"}</code> para quebrar o prato e acompanhamentos em linhas.
              </div>
            )}
          </div>
        )}

        {selectedElement.type === "barcode" && (
          <div className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
            <p className="ml-1 text-[8px] font-black uppercase tracking-wider text-emerald-600">
              Valor Code 128
            </p>
            <Input
              className="h-8 border-none bg-white font-mono text-xs font-bold shadow-sm"
              value={selectedElement.content}
              onChange={(event) => updateBarcodeContent(event.target.value)}
            />
            <p className="ml-1 text-[8px] font-semibold leading-normal text-slate-500">
              Use um identificador curto, como {"{{PEDIDO_ID}}"} ou {"{{LOTE}}"}.
            </p>
          </div>
        )}

        {selectedElement.type === "image" && (
          <div className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
            <p className="ml-1 text-[8px] font-black uppercase tracking-wider text-emerald-600">
              Informações da Imagem
            </p>
            {(() => {
              const validation = validateImageDataUrl(selectedElement.content);
              const kbSize = selectedElement.content
                ? Math.round((selectedElement.content.length * 0.75) / 1024)
                : 0;
              if (!validation.isValid) {
                return (
                  <div className="space-y-1 text-[9px]">
                    <p className="font-bold text-red-600">⚠️ Imagem Inválida</p>
                    <p className="text-slate-600 leading-normal">{validation.error}</p>
                  </div>
                );
              }
              return (
                <div className="space-y-1 text-[9px] text-slate-600 leading-normal">
                  <p className="font-bold text-emerald-700">✓ Imagem Válida</p>
                  <p>Tamanho Estimado: <span className="font-bold">{kbSize} KB</span></p>
                  <p>Limites Físicos: <span className="font-bold">200x200 dots</span></p>
                  <p className="text-[8px] text-slate-400">
                    A imagem será automaticamente convertida para bitmap monocromático e redimensionada para caber no limite físico da impressora ZPL.
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
