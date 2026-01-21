import React from "react"; // Adicionado para acessar os tipos de Evento
import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";

export function LabelCanvas({ 
  elements, 
  setElements, 
  isDesignMode, 
  selectedId, 
  setSelectedId, 
  parseContent, 
  labelRef 
}: any) {
  return (
    <div 
      ref={labelRef} 
      className="bg-white relative shadow-2xl overflow-hidden shrink-0 print:shadow-none print:border-none" 
      style={{ width: '378px', height: '567px' }} 
      onClick={() => setSelectedId(null)}
    >
      {elements.map((el: any) => {
        const isSelected = selectedId === el.id;
        const content = el.type === 'variable' ? parseContent(el.content) : el.content;
        const dynamicZIndex = isDesignMode && isSelected ? 999 : (el.zIndex || 10);

        return (
          <Rnd
            key={el.id}
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            disableDragging={!isDesignMode}
            enableResizing={isDesignMode}
            onDragStop={(_, d) => {
              setElements((prev: any[]) => prev.map((item) => 
                item.id === el.id ? { ...item, x: d.x, y: d.y } : item
              ));
            }}
            onResizeStop={(_, __, ref, ___, pos) => {
              setElements((prev: any[]) => prev.map((item) => 
                item.id === el.id ? { 
                  ...item, 
                  width: parseInt(ref.style.width), 
                  height: parseInt(ref.style.height), 
                  ...pos 
                } : item
              ));
            }}
            // ✅ Tipagem do evento 'e' adicionada aqui
            onClick={(e: React.MouseEvent) => {
              if (!isDesignMode) return;
              e.stopPropagation();
              setSelectedId(el.id);
            }}
            className={cn(
              "flex items-center px-1 overflow-hidden transition-shadow", 
              isDesignMode && isSelected ? "ring-2 ring-emerald-500 shadow-lg" : "",
              isDesignMode && !isSelected ? "border border-dashed border-slate-200 hover:border-slate-400" : ""
            )}
            style={{ zIndex: dynamicZIndex }}
          >
            {el.type === 'image' ? (
              <img 
                src={el.content} 
                className="w-full h-full object-contain pointer-events-none" 
                alt="label-element"
              />
            ) : (
              <div 
                style={{ 
                  fontSize: el.fontSize > 0 ? `${el.fontSize}px` : 'inherit', 
                  fontWeight: el.fontWeight || 'normal', 
                  width: '100%', 
                  color: el.color || 'black', 
                  backgroundColor: el.backgroundColor || 'transparent',
                  textAlign: (el.textAlign || 'left') as any,
                  whiteSpace: 'pre-line', 
                  lineHeight: '1.1',
                  pointerEvents: 'none'
                }}
              >
                {content}
              </div>
            )}
          </Rnd>
        );
      })}
    </div>
  );
}