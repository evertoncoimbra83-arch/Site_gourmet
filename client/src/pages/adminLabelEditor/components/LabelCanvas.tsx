// client/src/pages/adminLabelEditor/components/LabelCanvas.tsx
import React from "react";
import { Rnd } from "react-rnd"; // ✅ Importante para o drag & drop
import { TextNode } from "./elements/TextNode";
import { BarcodeNode } from "./elements/BarcodeNode";
import { NutritionTableNode } from "./elements/NutritionTableNode";
import type { LabelElement } from "../logic/label-compiler";

// ✅ Interface padrão para todos os nós do editor
export interface ElementNodeProps {
  el: LabelElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LabelElement>) => void;
}

// ✅ Dicionário de componentes (Adicione novos tipos aqui)
const ELEMENT_COMPONENTS: Record<string, React.FC<ElementNodeProps>> = {
  text: TextNode,
  barcode: BarcodeNode,
  nutrition_table: NutritionTableNode,
};

/**
 * COMPONENTE PAI (ORQUESTRADOR)
 * Renderiza o fundo da etiqueta e mapeia todos os elementos salvos.
 */
export function LabelCanvas({ 
  elements, 
  selectedId, 
  onSelect, 
  onUpdate 
}: { 
  elements: LabelElement[], 
  selectedId: string | null,
  onSelect: (id: string) => void,
  onUpdate: (id: string, updates: Partial<LabelElement>) => void
}) {
  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      {elements.map((el) => (
        <CanvasElement
          key={el.id}
          el={el}
          isSelected={selectedId === el.id}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

/**
 * COMPONENTE DE MOVIMENTAÇÃO (RND)
 * Envolve os nós específicos com a lógica de arrastar e redimensionar.
 */
export function CanvasElement(props: ElementNodeProps) {
  const { el, isSelected, onSelect, onUpdate } = props;
  const ComponentToRender = ELEMENT_COMPONENTS[el.type];

  if (!ComponentToRender) {
    console.warn(`Tipo de elemento "${el.type}" não mapeado em ELEMENT_COMPONENTS.`);
    return null;
  }

  return (
    <Rnd
      size={{ width: el.width, height: el.height }}
      position={{ x: el.x, y: el.y }}
      // Atualiza coordenadas ao soltar o mouse
      onDragStop={(_, d) => onUpdate(el.id, { x: d.x, y: d.y })}
      // Atualiza tamanho e posição ao terminar o redimensionamento
      onResizeStop={(_, __, ref, ___, position) => {
        onUpdate(el.id, {
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
          ...position,
        });
      }}
      bounds="parent" // Não permite sair da etiqueta
      enableResizing={isSelected} // Só redimensiona se estiver clicado
      disableDragging={!isSelected} // Só move se estiver clicado
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation(); // Evita desmarcar ao clicar no elemento
        onSelect(el.id);
      }}
      className={`flex items-center justify-center transition-shadow ${
        isSelected ? "z-50 shadow-xl" : "z-10"
      }`}
    >
      <ComponentToRender {...props} />
    </Rnd>
  );
}