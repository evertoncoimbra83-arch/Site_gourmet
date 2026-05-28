import React from "react";
import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import { LabelNutritionTable } from "./../LabelNutritionTable";

export interface LabelElement {
  id: string;
  type: "text" | "variable" | "image" | "box";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  zIndex: number;
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
}

interface LabelCanvasProps {
  elements: LabelElement[];
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
  isDesignMode: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  parseContent: (content: string, index?: number) => unknown; 
  labelRef?: React.RefObject<HTMLDivElement>;
  zoom?: number;
  isPrintMode?: boolean;
}

export function LabelCanvas({
  elements, setElements, isDesignMode, selectedId, setSelectedId, parseContent, labelRef, zoom = 1, isPrintMode = false,
}: LabelCanvasProps) {
  const SAFE_MARGIN_VALUE = 7.5; 
  const SAFE_MARGIN_STR = "2mm";
  const isViewOnly = isPrintMode || !isDesignMode;

  return (
    <div
      ref={labelRef}
      className={cn(
        "bg-white relative shrink-0 overflow-hidden",
        isDesignMode && !isPrintMode && "shadow-2xl ring-1 ring-slate-200",
        "print:shadow-none print:ring-0 print:m-0 print:p-0"
      )}
      style={{ width: "100%", height: "100%", boxSizing: "border-box", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      onClick={(e) => {
        if (isViewOnly) return;
        if (e.target === e.currentTarget) setSelectedId(null);
      }}
    >
      {isDesignMode && !isPrintMode && (
        <div className="absolute border border-dashed border-red-200 pointer-events-none z-[999]" style={{ top: SAFE_MARGIN_STR, left: SAFE_MARGIN_STR, right: SAFE_MARGIN_STR, bottom: SAFE_MARGIN_STR }}>
          <span className="absolute -top-3 left-0 text-[7px] text-red-400 font-black uppercase">Área de Segurança (2mm)</span>
        </div>
      )}

      {elements.map((el) => {
        const isSelected = selectedId === el.id;
        const displayContent = parseContent(el.content); 

        const isGraphicTable = typeof displayContent === 'object' && displayContent !== null;
        const isMultiLineText = typeof el.content === 'string' && el.content.includes("TABELA_NUTRI_TEXTO");

        const offset = isDesignMode && !isPrintMode ? SAFE_MARGIN_VALUE : 0;
        const x = (el.x || 0) + offset;
        const y = (el.y || 0) + offset;

        const boxStyle: React.CSSProperties = {
          position: "absolute", left: `${x}px`, top: `${y}px`, width: `${el.width}px`, height: `${el.height}px`, zIndex: isDesignMode && isSelected ? 999 : el.zIndex || 10,
        };

        const renderContent = () => {
          if (el.type === "image") return <img src={el.content} className="w-full h-full object-contain" alt="" />;
          
          if (isGraphicTable) {
            return (
              <div className="w-full h-full bg-white p-1 overflow-hidden flex items-center justify-center">
                <LabelNutritionTable data={displayContent as Record<string, unknown>} fontSize={el.fontSize} target="web" />
              </div>
            );
          }

          return (
            <div
              style={{
                fontSize: `${el.fontSize}px`,
                fontWeight: el.fontWeight || "bold",
                color: el.color || "black",
                backgroundColor: el.backgroundColor || "transparent",
                textAlign: el.textAlign || "left",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
                width: "100%", height: "100%",
                lineHeight: isMultiLineText ? "1.2" : "1.1", // Ajusta altura da linha se for a tabela texto
                whiteSpace: "pre-wrap", 
                fontFamily: isMultiLineText ? "monospace" : "inherit", // Fonte alinhada só na tabela texto
                padding: el.type === "box" ? 0 : "0 2px",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {el.type !== "box" && String(displayContent || "")}
            </div>
          );
        };

        if (isPrintMode) {
          return (
            <div key={el.id} style={boxStyle} className="pointer-events-none">
              {renderContent()}
            </div>
          );
        }

        if (!isDesignMode) {
          return (
            <div
              key={el.id}
              style={boxStyle}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedId(el.id);
              }}
              className={cn(
                "cursor-pointer transition-all",
                isSelected
                  ? "ring-2 ring-emerald-500 bg-emerald-50/10 shadow-lg z-[999]"
                  : "hover:ring-1 hover:ring-slate-300"
              )}
            >
              {renderContent()}
            </div>
          );
        }

        return (
          <Rnd
            key={el.id} size={{ width: el.width, height: el.height }} position={{ x, y }} scale={zoom} bounds="parent"
            enableResizing={isSelected ? { bottom: true, bottomRight: true, right: true } : false}
            className={cn("flex items-center overflow-hidden transition-all", isSelected ? "ring-2 ring-emerald-500 bg-emerald-50/10 shadow-2xl" : "hover:ring-1 hover:ring-slate-300")}
            style={{ zIndex: boxStyle.zIndex, position: "absolute" }}
            onDragStop={(_, d) => setElements((prev) => prev.map((item) => item.id === el.id ? { ...item, x: d.x - offset, y: d.y - offset } : item))}
            onResizeStop={(_e, _dir, ref, _delta, pos) => setElements((prev) => prev.map((item) => item.id === el.id ? { ...item, width: parseInt(ref.style.width), height: parseInt(ref.style.height), x: pos.x - offset, y: pos.y - offset } : item))}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedId(el.id); }}
          >
            {renderContent()}
          </Rnd>
        );
      })}
    </div>
  );
}