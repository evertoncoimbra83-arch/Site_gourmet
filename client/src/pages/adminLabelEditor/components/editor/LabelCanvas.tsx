import React from "react";
import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import { LabelNutritionTable } from "./LabelNutritionTable";

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
  elements,
  setElements,
  isDesignMode,
  selectedId,
  setSelectedId,
  parseContent,
  labelRef,
  zoom = 1,
  isPrintMode = false,
}: LabelCanvasProps) {
  const safeMarginValue = 7.5;
  const safeMarginStr = "2mm";
  const isViewOnly = isPrintMode || !isDesignMode;

  return (
    <div
      ref={labelRef}
      className={cn(
        "relative shrink-0 overflow-hidden bg-white",
        isDesignMode && !isPrintMode && "shadow-2xl ring-1 ring-slate-200",
        "print:m-0 print:p-0 print:shadow-none print:ring-0",
      )}
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
      onClick={(event) => {
        if (isViewOnly) return;
        if (event.target === event.currentTarget) setSelectedId(null);
      }}
    >
      {isDesignMode && !isPrintMode && (
        <div
          className="pointer-events-none absolute z-[999] border border-dashed border-red-200"
          style={{
            top: safeMarginStr,
            left: safeMarginStr,
            right: safeMarginStr,
            bottom: safeMarginStr,
          }}
        >
          <span className="absolute -top-3 left-0 text-[7px] font-black uppercase text-red-400">
            Área de Segurança (2mm)
          </span>
        </div>
      )}

      {elements.map((el) => {
        const isSelected = selectedId === el.id;
        const displayContent = parseContent(el.content);
        const isGraphicTable = typeof displayContent === "object" && displayContent !== null;
        const isMultiLineText =
          typeof el.content === "string" && el.content.includes("TABELA_NUTRI_TEXTO");
        const offset = isDesignMode && !isPrintMode ? safeMarginValue : 0;
        const x = (el.x || 0) + offset;
        const y = (el.y || 0) + offset;

        const boxStyle: React.CSSProperties = {
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          width: `${el.width}px`,
          height: `${el.height}px`,
          zIndex: isDesignMode && isSelected ? 999 : el.zIndex || 10,
        };

        const renderContent = () => {
          if (el.type === "image") {
            return <img src={el.content} className="h-full w-full object-contain" alt="" />;
          }

          if (isGraphicTable) {
            return (
              <div className="flex h-full w-full items-center justify-center overflow-hidden bg-white p-1">
                <LabelNutritionTable
                  data={displayContent as Record<string, unknown>}
                  fontSize={el.fontSize}
                  target="web"
                />
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
                alignItems: "center",
                justifyContent:
                  el.textAlign === "center"
                    ? "center"
                    : el.textAlign === "right"
                      ? "flex-end"
                      : "flex-start",
                width: "100%",
                height: "100%",
                lineHeight: isMultiLineText ? "1.2" : "1.1",
                whiteSpace: "pre-wrap",
                fontFamily: isMultiLineText ? "monospace" : "inherit",
                padding: el.type === "box" ? 0 : "0 2px",
              }}
            >
              {el.type !== "box" && String(displayContent || "")}
            </div>
          );
        };

        if (isViewOnly) {
          return (
            <div key={el.id} style={boxStyle} className="pointer-events-none">
              {renderContent()}
            </div>
          );
        }

        return (
          <Rnd
            key={el.id}
            size={{ width: el.width, height: el.height }}
            position={{ x, y }}
            scale={zoom}
            bounds="parent"
            enableResizing={isSelected ? { bottom: true, bottomRight: true, right: true } : false}
            className={cn(
              "flex items-center overflow-hidden transition-all",
              isSelected
                ? "bg-emerald-50/10 ring-2 ring-emerald-500 shadow-2xl"
                : "hover:ring-1 hover:ring-slate-300",
            )}
            style={{ zIndex: boxStyle.zIndex, position: "absolute" }}
            onDragStop={(_, data) =>
              setElements((prev) =>
                prev.map((item) =>
                  item.id === el.id ? { ...item, x: data.x - offset, y: data.y - offset } : item,
                ),
              )
            }
            onResizeStop={(_event, _dir, ref, _delta, pos) =>
              setElements((prev) =>
                prev.map((item) =>
                  item.id === el.id
                    ? {
                        ...item,
                        width: parseInt(ref.style.width, 10),
                        height: parseInt(ref.style.height, 10),
                        x: pos.x - offset,
                        y: pos.y - offset,
                      }
                    : item,
                ),
              )
            }
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation();
              setSelectedId(el.id);
            }}
          >
            {renderContent()}
          </Rnd>
        );
      })}
    </div>
  );
}
