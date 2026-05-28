import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Printer,
  RotateCcw,
  Save,
  Settings,
  Tag,
  Trash2,
  Wifi,
  WifiOff,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LabelCanvas, type LabelElement } from "./editor/LabelCanvas";
import {
  buildTemplateLibrary,
  generateZPLForBatch,
  useLabelLogic,
  useZebraTransport,
  type AdminLabelTemplate,
} from "../print-engine";

interface OrderItem {
  id: string | number;
  quantity: number;
  dish_name?: string;
  dishName?: string;
  name?: string;
  options?: string | Record<string, unknown>;
  parsedOptions?: Record<string, unknown>;
  packageItems?: Record<string, unknown>[];
  [key: string]: unknown;
}

interface LabelProductionPanelProps {
  order: Record<string, unknown> | null;
  item?: OrderItem | null;
  showFullPageLink?: boolean;
  className?: string;
}

type ProductionOverrideMap = Record<string, string>;

function cloneElements(elements: LabelElement[]): LabelElement[] {
  return elements.map((element) => ({ ...element }));
}

function parseTemplateNumericId(templateId: string | null): number | undefined {
  if (!templateId?.startsWith("new:")) return undefined;
  const parsed = Number(templateId.replace("new:", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildOverrideKey(
  labelId: string | number | undefined,
  elementId: string | undefined,
) {
  return `${String(labelId ?? "label")}::${String(elementId ?? "element")}`;
}

function isOverrideKeyForLabel(
  overrideKey: string,
  labelId: string | number | undefined,
) {
  return overrideKey.startsWith(`${String(labelId ?? "label")}::`);
}

export function LabelProductionPanel({
  order,
  item,
  showFullPageLink = false,
  className,
}: LabelProductionPanelProps) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [labelIndex, setLabelIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [printOverrides, setPrintOverrides] =
    useState<ProductionOverrideMap>({});
  const [isEditingTemplateContent, setIsEditingTemplateContent] =
    useState(false);

  const { data: templatesRaw = [] } = trpc.admin.labels.getTemplates.useQuery();
  const { data: legacyRaw } = trpc.admin.storeSettings.getByKey.useQuery(
    { key: "label_design_elements" },
    { enabled: !templatesRaw.length },
  );

  const upsertTemplate = trpc.admin.labels.upsertTemplate.useMutation({
    onSuccess: async () => {
      await utils.admin.labels.getTemplates.invalidate();
      toast.success("Modelo salvo com sucesso.");
    },
    onError: (error) =>
      toast.error(`Falha ao salvar modelo: ${error.message}`),
  });

  const templates = useMemo(
    () =>
      buildTemplateLibrary(
        templatesRaw as AdminLabelTemplate[],
        (legacyRaw as { value?: string } | undefined)?.value,
      ),
    [legacyRaw, templatesRaw],
  );

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(
        templates.find((template) => template.isDefault)?.id ?? templates[0].id,
      );
    }
  }, [selectedTemplateId, templates]);

  const activeTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    if (!activeTemplate) {
      setElements([]);
      setSelectedElementId(null);
      setPrintOverrides({});
      setIsEditingTemplateContent(false);
      return;
    }

    setElements(cloneElements(activeTemplate.elements));
    setSelectedElementId(null);
    setPrintOverrides({});
    setIsEditingTemplateContent(false);
  }, [activeTemplate]);

  const { flatLabels, parseContent } = useLabelLogic(order, labelIndex, 90);

  const itemLabels = useMemo(() => {
    if (!item) return flatLabels;
    const filtered = flatLabels.filter((label) =>
      String(label.id).startsWith(String(item.id)),
    );
    return filtered.length > 0 ? filtered : flatLabels;
  }, [flatLabels, item]);

  useEffect(() => {
    setLabelIndex((value) =>
      Math.min(value, Math.max(itemLabels.length - 1, 0)),
    );
  }, [itemLabels.length]);

  const zebra = useZebraTransport();

  const getAbsoluteLabelIndex = useCallback(
    (label: (typeof itemLabels)[number] | undefined, fallbackIndex: number) => {
      if (!label) return fallbackIndex;
      const absoluteIndex = flatLabels.findIndex(
        (itemLabel) => itemLabel.id === label.id,
      );
      return absoluteIndex >= 0 ? absoluteIndex : fallbackIndex;
    },
    [flatLabels],
  );

  const resolveElementValue = useCallback(
    (
      content: string,
      element: Pick<LabelElement, "id"> | undefined,
      label: (typeof itemLabels)[number] | undefined,
      fallbackIndex: number,
    ): string => {
      const overrideKey = buildOverrideKey(label?.id, element?.id);
      const override = printOverrides[overrideKey];
      if (override !== undefined) {
        return override;
      }

      const resolved = parseContent(
        content,
        getAbsoluteLabelIndex(label, fallbackIndex),
      );

      if (resolved == null) return "";
      return typeof resolved === "object" ? JSON.stringify(resolved) : String(resolved);
    },
    [getAbsoluteLabelIndex, parseContent, printOverrides],
  );

  const parseForIndex = useCallback(
    (content: string, element?: LabelElement) => {
      const currentLabel = itemLabels[labelIndex];
      return resolveElementValue(content, element, currentLabel, labelIndex);
    },
    [itemLabels, labelIndex, resolveElementValue],
  );

  const buildZpl = useCallback(
    (labels: typeof itemLabels) => {
      if (!activeTemplate) return "";

      return generateZPLForBatch(
        elements,
        activeTemplate.width,
        activeTemplate.height,
        labels,
        (content, index, element) => {
          const label = labels[index];
          return resolveElementValue(content, element, label, index);
        },
      );
    },
    [activeTemplate, elements, resolveElementValue],
  );

  const handlePrintOne = async () => {
    if (!itemLabels[labelIndex]) return;
    await zebra.sendZpl(buildZpl([itemLabels[labelIndex]]));
  };

  const handlePrintBatch = async () => {
    await zebra.sendZpl(buildZpl(itemLabels));
  };

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    const toastId = toast.loading("Gerando PNG...");
    try {
      const url = await toPng(canvasRef.current, {
        pixelRatio: 3,
        backgroundColor: "white",
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = `etiqueta-${item?.dish_name ?? item?.name ?? "label"}.png`;
      link.click();
      toast.success("PNG exportado!", { id: toastId });
    } catch {
      toast.error("Erro ao gerar PNG", { id: toastId });
    }
  };

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId),
    [elements, selectedElementId],
  );

  const currentLabel = itemLabels[labelIndex];
  const isDynamicElement = /\{\{[^}]+\}\}/i.test(selectedElement?.content ?? "");
  const selectedTemplateNumericId = parseTemplateNumericId(selectedTemplateId);
  const canSaveTemplate = Boolean(activeTemplate && selectedTemplateNumericId);
  const selectedOverrideKey = buildOverrideKey(
    currentLabel?.id,
    selectedElement?.id,
  );
  const selectedOverride = selectedElement
    ? printOverrides[selectedOverrideKey]
    : undefined;
  const selectedResolvedValue = selectedElement
    ? resolveElementValue(
        selectedElement.content,
        selectedElement,
        currentLabel,
        labelIndex,
      )
    : "";
  const totalOverrides = Object.keys(printOverrides).length;
  const currentLabelOverrideCount = currentLabel
    ? Object.keys(printOverrides).filter((key) =>
        isOverrideKeyForLabel(key, currentLabel.id),
      ).length
    : 0;
  const hasOverrideForElement = useCallback(
    (elementId: string) => {
      if (!currentLabel) return false;
      return printOverrides[buildOverrideKey(currentLabel.id, elementId)] !== undefined;
    },
    [currentLabel, printOverrides],
  );

  const handlePrintOverrideChange = (content: string) => {
    if (!selectedElement || !currentLabel) return;
    setPrintOverrides((previous) => ({
      ...previous,
      [selectedOverrideKey]: content,
    }));
  };

  const handleTemplateContentChange = (content: string) => {
    if (!selectedElement) return;
    setElements((previous) =>
      previous.map((element) =>
        element.id === selectedElement.id ? { ...element, content } : element,
      ),
    );
  };

  const handleClearOverride = () => {
    if (!selectedElement || !currentLabel) return;
    setPrintOverrides((previous) => {
      const next = { ...previous };
      delete next[selectedOverrideKey];
      return next;
    });
  };

  const handleClearAllOverrides = () => {
    if (totalOverrides === 0) return;
    setPrintOverrides({});
    toast.success("Todos os ajustes manuais do lote foram removidos.");
  };

  const handleSaveTemplate = () => {
    if (!activeTemplate || !selectedTemplateNumericId) {
      toast.error(
        "Selecione um modelo salvo do Studio para persistir as alterações.",
      );
      return;
    }

    upsertTemplate.mutate({
      id: selectedTemplateNumericId,
      name: activeTemplate.name,
      width: activeTemplate.width,
      height: activeTemplate.height,
      elements: JSON.stringify(elements),
      isDefault: activeTemplate.isDefault,
    });
  };

  const handleTemplateChange = (templateId: string) => {
    if (totalOverrides > 0) {
      const confirmChange = window.confirm(
        "Trocar o modelo irá limpar os ajustes manuais desta impressão. Deseja continuar?",
      );
      if (!confirmChange) return;
    }
    setPrintOverrides({});
    setSelectedTemplateId(templateId);
  };

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      <div className="shrink-0 space-y-4 border-b border-slate-50 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-emerald-400">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                Produção de Etiquetas
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {item?.dish_name ?? item?.name ?? String(order?.customerName ?? "Pedido")}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/labels/editor")}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50"
          >
            <Settings size={13} /> Configurar Modelos
          </Button>
        </div>

        <div
          onClick={zebra.checkBrowserPrint}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all",
            zebra.isReady
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-slate-50 text-slate-400 hover:bg-slate-100",
          )}
        >
          {zebra.isReady ? <Wifi size={12} /> : <WifiOff size={12} />}
          {zebra.isReady ? "Zebra conectada" : "Impressora offline"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 border-b border-slate-100 bg-slate-50/50 p-6 text-left">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Modelo de Etiqueta
              </label>
              <p className="text-[10px] font-bold leading-normal text-slate-400">
                Escolha o modelo antes de imprimir. A troca de modelo não altera o pedido.
              </p>
            </div>
            {order && (
              <Badge className="h-6 shrink-0 border-none bg-emerald-100 px-3 text-[9px] font-black uppercase text-emerald-700">
                Pedido #{String(order.id)} carregado
              </Badge>
            )}
          </div>

          {templates.length > 0 && selectedTemplateId && (
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="h-11 w-full rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 focus:ring-1 focus:ring-emerald-500">
                <SelectValue className="text-slate-800" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
                {templates.map((template) => (
                  <SelectItem
                    key={template.id}
                    value={template.id}
                    className="cursor-pointer py-3 text-xs font-bold uppercase text-slate-800 focus:bg-slate-100 focus:text-slate-800"
                  >
                    {template.name} {template.source === "legacy" ? "(fallback)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {itemLabels.length > 1 && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Marmita {labelIndex + 1} de {itemLabels.length}
              </span>
              {currentLabelOverrideCount > 0 && (
                <Badge className="h-5 border-none bg-amber-100 px-2 text-[8px] font-black uppercase text-amber-700">
                  {currentLabelOverrideCount} ajuste{currentLabelOverrideCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <button
                disabled={labelIndex === 0}
                onClick={() => setLabelIndex((value) => Math.max(0, value - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={labelIndex === itemLabels.length - 1}
                onClick={() =>
                  setLabelIndex((value) =>
                    Math.min(itemLabels.length - 1, value + 1),
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="mb-3 flex items-center justify-end gap-1">
            <button
              onClick={() => setZoom((value) => Math.max(0.4, value - 0.1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50"
            >
              <ZoomOut size={12} />
            </button>
            <span className="w-10 text-center text-[9px] font-black text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((value) => Math.min(3, value + 0.1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50"
            >
              <ZoomIn size={12} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {activeTemplate ? (
            <div className="flex justify-center overflow-hidden">
              <div
                ref={canvasRef}
                className="shrink-0 overflow-hidden border border-slate-200 bg-white shadow-lg"
                style={{
                  width: `${activeTemplate.width}mm`,
                  height: `${activeTemplate.height}mm`,
                  minWidth: `${activeTemplate.width}mm`,
                  minHeight: `${activeTemplate.height}mm`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  marginBottom: `${(zoom - 1) * activeTemplate.height * 3.78}px`,
                }}
              >
                <LabelCanvas
                  elements={elements}
                  setElements={setElements}
                  isDesignMode={false}
                  selectedId={selectedElementId}
                  setSelectedId={setSelectedElementId}
                  hasOverride={hasOverrideForElement}
                  parseContent={parseForIndex}
                  zoom={1}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Selecione um template acima
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-4">
          <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-emerald-600">
                Ajuste rápido de impressão
              </label>
              {!selectedElement ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Selecione um elemento da etiqueta para editar rapidamente.
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Edite o texto resolvido desta etiqueta..."
                    value={selectedResolvedValue}
                    onChange={(event) =>
                      handlePrintOverrideChange(event.target.value)
                    }
                    className="min-h-[96px] resize-y border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm"
                  />
                  <p className="text-[10px] font-semibold leading-normal text-slate-500">
                    Texto desta impressão. O ajuste vale apenas para esta etiqueta.
                  </p>
                  <p className="text-[10px] font-semibold leading-normal text-slate-500">
                    Origem:{" "}
                    <span className="font-mono font-black text-slate-700">
                      {selectedElement.content}
                    </span>
                  </p>
                  {selectedOverride !== undefined && (
                    <p className="text-[10px] font-semibold leading-normal text-amber-700">
                      Override ativo nesta etiqueta. A impressao atual esta usando texto manual.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearOverride}
                      disabled={selectedOverride === undefined}
                      className="h-8 rounded-xl text-[10px] font-black uppercase"
                    >
                      Limpar ajuste
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIsEditingTemplateContent((value) => !value)
                      }
                      className="h-8 rounded-xl text-[10px] font-black uppercase text-slate-600"
                    >
                      {isEditingTemplateContent
                        ? "Ocultar variável do modelo"
                        : "Editar variável do modelo"}
                    </Button>
                  </div>
                  {isEditingTemplateContent && (
                    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                      <p className="text-[10px] font-semibold leading-normal text-amber-700">
                        Esta área altera o template do modelo. Salve no modelo
                        apenas se quiser persistir a mudança para futuras
                        impressões.
                      </p>
                      <Textarea
                        placeholder="Edite o token ou texto fixo do modelo..."
                        value={selectedElement.content}
                        onChange={(event) =>
                          handleTemplateContentChange(event.target.value)
                        }
                        className="min-h-[84px] resize-y border-amber-200 bg-white text-xs font-bold text-slate-700 shadow-sm"
                      />
                    </div>
                  )}
                  <p className="text-[9px] font-bold text-slate-500">
                    Elemento selecionado:{" "}
                    <span className="font-black uppercase text-slate-700">
                      {selectedElement.type}
                    </span>
                  </p>
                  {isDynamicElement && !isEditingTemplateContent && (
                    <p className="text-[10px] font-semibold leading-normal text-amber-700">
                      A variável dinâmica do modelo foi preservada. O ajuste
                      acima sobrescreve apenas esta impressão.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1 border-t border-slate-200/60 pt-3">
              <p className="mb-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                Dados do pedido
              </p>
              {totalOverrides > 0 && (
                <p className="text-[9px] font-bold text-amber-700">
                  Ajustes ativos no lote: {totalOverrides}
                </p>
              )}
              <p className="truncate text-[9px] font-bold text-slate-600">
                <span className="text-slate-400">Composição original:</span>{" "}
                {currentLabel?.displayName ?? "—"}
              </p>
              <p className="text-[9px] font-bold text-slate-600">
                <span className="text-slate-400">Cliente:</span>{" "}
                {String(order?.customerName ?? "—")}
              </p>
              <p className="text-[9px] font-bold text-slate-600">
                <span className="text-slate-400">Pedido:</span> #
                {String(order?.id ?? "").slice(-6).toUpperCase()}
              </p>
              {!canSaveTemplate && activeTemplate?.source === "legacy" && (
                <p className="text-[9px] font-bold text-amber-700">
                  O template atual veio do fallback legado. Edições locais
                  funcionam no preview e na impressão desta tela, mas não podem
                  ser persistidas por este fluxo.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handlePrintOne}
            disabled={
              zebra.isPrinting || !activeTemplate || !zebra.isReady || !currentLabel
            }
            className="h-14 gap-2 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-600"
          >
            {zebra.isPrinting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
            {zebra.isReady ? "Esta etiqueta" : "Offline"}
          </Button>
          <Button
            onClick={handlePrintBatch}
            disabled={
              zebra.isPrinting ||
              !activeTemplate ||
              !zebra.isReady ||
              itemLabels.length <= 1
            }
            variant="outline"
            className="h-14 gap-2 rounded-2xl border-slate-200 text-[10px] font-black uppercase"
          >
            <Printer size={14} /> Lote ({itemLabels.length})
          </Button>
        </div>

        <Button
          onClick={handleSaveTemplate}
          disabled={!canSaveTemplate || upsertTemplate.isPending}
          className="h-11 w-full gap-2 rounded-2xl bg-emerald-600 text-[10px] font-black uppercase hover:bg-emerald-500 disabled:opacity-50"
        >
          {upsertTemplate.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Salvar modelo
        </Button>

        <Button
          onClick={handleClearAllOverrides}
          disabled={totalOverrides === 0}
          variant="outline"
          className="h-11 w-full gap-2 rounded-2xl border-amber-200 text-[10px] font-black uppercase text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        >
          <Trash2 size={14} /> Limpar ajustes do lote
        </Button>

        <Button
          onClick={handleExportPng}
          disabled={!activeTemplate}
          variant="outline"
          className="h-11 w-full gap-2 rounded-2xl border-slate-200 text-[10px] font-black uppercase hover:bg-slate-50"
        >
          <Download size={14} /> Exportar PNG
        </Button>

        {showFullPageLink && (
          <button
            onClick={() =>
              navigate(`/admin/labels/editor/production/${order?.id ?? ""}`)
            }
            className="flex w-full items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:text-emerald-600"
          >
            <ExternalLink size={10} /> Abrir produção completa
          </button>
        )}
      </div>
    </div>
  );
}
