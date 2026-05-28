import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appToast as toast } from "@/lib/app-toast";
import { safeJsonParse } from "@/lib/safe-parse";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  PencilRuler,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  buildTemplateLibrary,
  useLabelLogic,
  type AdminLabelTemplate,
} from "../print-engine";
import { LabelCanvas, type LabelElement } from "./editor/LabelCanvas";
import { LabelProperties } from "./editor/LabelProperties";
import { LabelToolbar } from "./editor/LabelToolbar";

export interface LabelTemplate {
  id: number | string | null;
  name: string;
  elements: LabelElement[] | string;
  config?: { width: number; height: number };
  width?: number;
  height?: number;
  source?: "admin.labels" | "legacy";
  isDefault?: boolean;
}

interface LabelEditorStationProps {
  initialTemplateId?: number;
  order?: Record<string, unknown> | null;
  initialMode?: "design" | "preview";
  onCancel?: () => void;
}

interface LegacySettingResult {
  value?: string;
}

const EMPTY_ORDER: Record<string, unknown> = {
  id: "",
  customerName: "Preview",
  items: [],
};

export function LabelEditorStation({
  initialTemplateId,
  order,
  initialMode = "design",
  onCancel,
}: LabelEditorStationProps) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const printAllRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"design" | "preview">(initialMode);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  const [templateId, setTemplateId] = useState<number | string | null>(null);
  const [templateName, setTemplateName] = useState("Layout Padrão");
  const [labelWidthMm, setLabelWidthMm] = useState(100);
  const [labelHeightMm, setLabelHeightMm] = useState(60);
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: templatesRaw = [] } = trpc.admin.labels.getTemplates.useQuery();
  const { data: legacyRaw } = trpc.admin.storeSettings.getByKey.useQuery(
    { key: "label_design_elements" },
    { enabled: !templatesRaw.length },
  );

  const upsertTemplate = trpc.admin.labels.upsertTemplate.useMutation({
    onSuccess: async (data) => {
      await utils.admin.labels.getTemplates.invalidate();
      toast.success("Design atualizado!");
      if (data && data.id) {
        setTemplateId(`new:${data.id}`);
      }
    },
    onError: (error) => toast.error(`Falha ao salvar: ${error.message}`),
  });

  const deleteTemplate = trpc.admin.labels.deleteTemplate.useMutation({
    onSuccess: async () => {
      await utils.admin.labels.getTemplates.invalidate();
      toast.success("Template excluído.");
      // Seleciona o primeiro template restante na lista ou limpa a seleção
      if (templates.length > 1) {
        const remaining = templates.filter((t) => t.id !== templateId);
        if (remaining.length > 0) {
          loadTemplate(remaining[0]);
          return;
        }
      }
      setTemplateId(null);
      setTemplateName("Novo Layout");
      setElements([]);
    },
    onError: (error) => toast.error(`Falha ao excluir: ${error.message}`),
  });

  const templates = useMemo(
    () =>
      buildTemplateLibrary(
        templatesRaw as AdminLabelTemplate[],
        (legacyRaw as LegacySettingResult | undefined)?.value,
      ).map<LabelTemplate>((template) => ({
        id: template.id,
        name: template.name,
        elements: template.elements,
        config: { width: template.width, height: template.height },
        source: template.source,
        isDefault: template.isDefault,
      })),
    [legacyRaw, templatesRaw],
  );

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const previewOrder = order ?? EMPTY_ORDER;
  const { flatLabels, parseContent } = useLabelLogic(previewOrder, selectedLabelIndex, 90);

  const loadTemplate = useCallback((template: LabelTemplate) => {
    setTemplateId(template.id);
    setTemplateName(template.name);

    const rawElements =
      typeof template.elements === "string"
        ? safeJsonParse<LabelElement[]>(template.elements, [])
        : template.elements || [];

    setElements(rawElements);
    setLabelWidthMm(template.config?.width || template.width || 100);
    setLabelHeightMm(template.config?.height || template.height || 60);
    setSelectedElementId(null);
  }, []);

  useEffect(() => {
    if (!templates.length || isInitialized) return;

    const preferredTemplate =
      (initialTemplateId != null
        ? templates.find((template) => Number(template.id) === initialTemplateId)
        : null) ?? templates[0];

    if (preferredTemplate) {
      loadTemplate(preferredTemplate);
      setIsInitialized(true);
    }
  }, [initialTemplateId, isInitialized, loadTemplate, templates]);

  const addElement = (
    type: "text" | "variable" | "image" | "box",
    content?: string,
    fontSize = 12,
    width = 80,
  ) => {
    const newElement: LabelElement = {
      id: `el-${Date.now()}`,
      type: type === "variable" ? "text" : type,
      content:
        content ||
        (type === "variable" ? "{{NOME_PRATO}}" : type === "box" ? "" : "TEXTO FIXO"),
      x: 10,
      y: 10,
      width,
      height:
        type === "image" || type === "box"
          ? 40
          : content === "{{TABELA_NUTRI}}"
            ? 60
            : content === "{{COMPOSICAO_LINHAS}}"
              ? 35
              : content === "{{MACROS_LINHAS}}"
                ? 35
                : 15,
      fontSize,
      fontWeight: "700",
      zIndex: elements.length + 1,
      textAlign: "left",
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handleSave = useCallback(() => {
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      toast.error("O layout precisa de um nome.");
      return;
    }

    let numericId: number | undefined = undefined;
    if (typeof templateId === "number") {
      numericId = templateId;
    } else if (typeof templateId === "string") {
      if (templateId.startsWith("new:")) {
        const parsed = Number(templateId.replace("new:", ""));
        if (Number.isFinite(parsed)) {
          numericId = parsed;
        }
      }
    }

    upsertTemplate.mutate({
      id: numericId,
      name: trimmedName,
      width: labelWidthMm,
      height: labelHeightMm,
      elements: JSON.stringify(elements),
      isDefault: false,
    });
  }, [elements, labelHeightMm, labelWidthMm, templateId, templateName, upsertTemplate]);

  const handleDelete = useCallback(() => {
    if (!templateId) {
      toast.error("Selecione um layout salvo para excluir.");
      return;
    }

    let numericId: number = NaN;
    if (typeof templateId === "number") {
      numericId = templateId;
    } else if (typeof templateId === "string") {
      if (templateId.startsWith("new:")) {
        const parsed = Number(templateId.replace("new:", ""));
        if (Number.isFinite(parsed)) {
          numericId = parsed;
        }
      }
    }

    if (!Number.isFinite(numericId)) {
      toast.error("Templates legados são somente leitura.");
      return;
    }

    const targetTemplate = templates.find((t) => t.id === templateId);
    const isDefault = targetTemplate ? Boolean(targetTemplate.isDefault) : false;

    if (isDefault) {
      if (!window.confirm("Este é o modelo padrão de etiqueta do sistema. Tem certeza que deseja excluí-lo?")) {
        return;
      }
    } else {
      if (!window.confirm("Tem certeza que deseja excluir este modelo de etiqueta?")) {
        return;
      }
    }

    deleteTemplate.mutate({ id: numericId });
  }, [deleteTemplate, templateId, templates]);

  const handlePrintSingle = useReactToPrint({ contentRef: printRef });
  const handlePrintAll = useReactToPrint({ contentRef: printAllRef });

  const hasPreviewOrder = Boolean(order && flatLabels.length > 0);

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden bg-slate-50 text-left font-sans lg:flex-row">
      <style>{`
        @media print {
          @page { margin: 0; }
          .label-page-break { page-break-after: always; break-after: page; position: relative; overflow: hidden; }
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (loadEvent) => addElement("image", loadEvent.target?.result as string);
          reader.readAsDataURL(file);
        }}
      />

      <aside className="custom-scrollbar no-print z-20 flex h-full w-full shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-lg lg:w-80">
        <header className="space-y-4 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="leading-none">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-slate-900">
                Label Studio
              </h3>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Editor Oficial
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setTemplateId(null);
                  setElements([]);
                  setTemplateName("Novo Layout");
                }}
                className="h-8 w-8 border-emerald-100 text-emerald-600 shadow-sm"
              >
                <Plus size={16} />
              </Button>
              {onCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="h-8 w-8 text-slate-400"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setMode("design")}
              className="h-9 rounded-xl text-[10px] font-black uppercase"
              variant={mode === "design" ? "default" : "outline"}
            >
              <PencilRuler size={14} className="mr-2" /> Design
            </Button>
            <Button
              onClick={() => setMode("preview")}
              className="h-9 rounded-xl text-[10px] font-black uppercase"
              variant={mode === "preview" ? "default" : "outline"}
            >
              <Eye size={14} className="mr-2" /> Produção
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
              Layout salvo:
            </label>
            <select
              className="h-9 w-full rounded-xl border-slate-200 bg-slate-50 px-3 text-[10px] font-black outline-none shadow-inner focus:ring-1 focus:ring-emerald-500"
              value={templateId || ""}
              onChange={(event) => {
                const template = templates.find((item) => String(item.id) === event.target.value);
                if (template) loadTemplate(template);
              }}
            >
              <option value="">Selecione um layout...</option>
              {templates.map((template) => (
                <option key={String(template.id)} value={template.id || ""}>
                  {template.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="flex-1 space-y-6 py-4">
          <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <label className="block text-[8px] font-black uppercase tracking-wider text-emerald-600">
              Nome do Layout
            </label>
            <div className="flex gap-2">
              <Input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                className="h-8 flex-1 border-none bg-white text-[10px] font-black shadow-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white text-red-400 shadow-sm hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleteTemplate.isPending}
              >
                {deleteTemplate.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </Button>
            </div>
          </div>

          {mode === "preview" && flatLabels.length > 1 && (
            <div className="flex items-center justify-between rounded-xl bg-slate-900 p-2 shadow-xl">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-white"
                onClick={() => setSelectedLabelIndex((prev) => Math.max(0, prev - 1))}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-[9px] font-black uppercase italic text-white">
                Prévia item: {selectedLabelIndex + 1} / {flatLabels.length}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-white"
                onClick={() =>
                  setSelectedLabelIndex((prev) => Math.min(flatLabels.length - 1, prev + 1))
                }
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          )}

          <LabelToolbar onAdd={addElement} onImageUpload={() => fileInputRef.current?.click()} />
          <LabelProperties
            selectedElement={selectedElement}
            setSelectedId={setSelectedElementId}
            setElements={setElements}
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {hasPreviewOrder
              ? `Preview ligado ao pedido #${String(order?.id ?? "").slice(-6).toUpperCase()}`
              : "Preview sem pedido real. Use a rota de produção para validar um pedido."}
          </div>
        </div>

        <footer className="mt-auto space-y-3 border-t pt-4">
          <div className="flex gap-3 rounded-2xl bg-slate-900 p-3 text-white shadow-inner">
            <div className="flex-1 text-center font-bold uppercase">
              <p className="mb-1 text-center text-[7px] tracking-widest opacity-40">Largura mm</p>
              <Input
                type="number"
                value={labelWidthMm}
                onChange={(event) => setLabelWidthMm(Number(event.target.value))}
                className="h-7 border-none bg-white/10 text-center text-[10px] font-black"
              />
            </div>
            <div className="flex-1 text-center font-bold uppercase">
              <p className="mb-1 text-center text-[7px] tracking-widest opacity-40">Altura mm</p>
              <Input
                type="number"
                value={labelHeightMm}
                onChange={(event) => setLabelHeightMm(Number(event.target.value))}
                className="h-7 border-none bg-white/10 text-center text-[10px] font-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handlePrintSingle()}
              className="h-12 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-emerald-700"
            >
              <Printer size={16} className="mr-2" /> Única
            </Button>
            <Button
              onClick={() => handlePrintAll()}
              className="h-12 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-blue-700"
            >
              <Copy size={16} className="mr-2" /> Lote
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={upsertTemplate.isPending}
            className="h-12 w-full rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:bg-black"
          >
            {upsertTemplate.isPending ? (
              <Loader2 size={16} className="mr-2 animate-spin text-emerald-400" />
            ) : (
              <Save size={16} className="mr-2 text-emerald-400" />
            )}
            Salvar Design
          </Button>

          {templateId && String(templateId).startsWith("new:") && (
            <Button
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
              variant="destructive"
              className="h-12 w-full rounded-xl text-[10px] font-black uppercase tracking-[0.2em]"
            >
              {deleteTemplate.isPending ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Trash2 size={16} className="mr-2" />
              )}
              Excluir Modelo
            </Button>
          )}
        </footer>
      </aside>

      <main className="relative flex-1 overflow-hidden bg-slate-200">
        <div className="no-print absolute right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border border-white bg-white/90 p-2 shadow-2xl backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
            className="h-8 w-8 hover:bg-slate-100"
          >
            <ZoomOut size={16} />
          </Button>
          <span className="w-12 text-center text-[10px] font-black text-slate-600">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom((value) => Math.min(4, value + 0.1))}
            className="h-8 w-8 hover:bg-slate-100"
          >
            <ZoomIn size={16} />
          </Button>
          <div className="mx-1 h-4 w-px bg-slate-200" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(1.2)}
            className="h-8 w-8 hover:bg-slate-100"
          >
            <RotateCcw size={14} />
          </Button>
        </div>

        <div className="custom-scrollbar flex h-full w-full items-center justify-center overflow-auto p-20">
          <div
            ref={printRef}
            className="origin-center bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] transition-transform duration-300"
            style={{
              width: `${labelWidthMm}mm`,
              height: `${labelHeightMm}mm`,
              transform: `scale(${zoom})`,
            }}
          >
            <LabelCanvas
              elements={elements}
              setElements={setElements}
              isDesignMode={mode === "design"}
              selectedId={selectedElementId}
              setSelectedId={setSelectedElementId}
              parseContent={(content, _element, index) =>
                parseContent(content, index)
              }
              zoom={zoom}
            />
          </div>

          <div style={{ display: "none" }}>
            <div ref={printAllRef}>
              {(flatLabels.length > 0 ? flatLabels : [null]).map((_, index) => (
                <div
                  key={index}
                  className="label-page-break"
                  style={{
                    width: `${labelWidthMm}mm`,
                    height: `${labelHeightMm}mm`,
                    backgroundColor: "white",
                  }}
                >
                  <LabelCanvas
                    elements={elements}
                    setElements={() => {}}
                    isDesignMode={false}
                    selectedId={null}
                    setSelectedId={() => {}}
                    parseContent={(content) => parseContent(content, index)}
                    zoom={1}
                    isPrintMode
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
