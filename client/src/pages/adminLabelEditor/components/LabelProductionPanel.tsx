import React, { useCallback, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Printer,
  RotateCcw,
  Tag,
  Wifi,
  WifiOff,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LabelCanvas } from "../../adminOrders/components/orderDrawer/print/design/LabelCanvas";
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

function applyManualOverride(content: string, overrideName?: string | null) {
  if (!overrideName) return content;
  return content
    .replace(/\{\{NOME_PRATO\}\}/gi, overrideName)
    .replace(/\{\{COMPOSICAO\}\}/gi, overrideName);
}

export function LabelProductionPanel({
  order,
  item,
  showFullPageLink = false,
  className,
}: LabelProductionPanelProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [labelIndex, setLabelIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});

  const { data: templatesRaw = [] } = trpc.admin.labels.getTemplates.useQuery();
  const { data: legacyRaw } = trpc.admin.storeSettings.getByKey.useQuery(
    { key: "label_design_elements" },
    { enabled: !templatesRaw.length },
  );

  const templates = useMemo(
    () =>
      buildTemplateLibrary(
        templatesRaw as AdminLabelTemplate[],
        (legacyRaw as { value?: string } | undefined)?.value,
      ),
    [legacyRaw, templatesRaw],
  );

  React.useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates.find((template) => template.isDefault)?.id ?? templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const { flatLabels, parseContent } = useLabelLogic(order, labelIndex, 90);

  const itemLabels = useMemo(() => {
    if (!item) return flatLabels;
    const filtered = flatLabels.filter((label) => String(label.id).startsWith(String(item.id)));
    return filtered.length > 0 ? filtered : flatLabels;
  }, [flatLabels, item]);

  React.useEffect(() => {
    setLabelIndex((value) => Math.min(value, Math.max(itemLabels.length - 1, 0)));
  }, [itemLabels.length]);

  const zebra = useZebraTransport();

  const getAbsoluteLabelIndex = useCallback(
    (label: (typeof itemLabels)[number] | undefined, fallbackIndex: number) => {
      if (!label) return fallbackIndex;
      const absoluteIndex = flatLabels.findIndex((itemLabel) => itemLabel.id === label.id);
      return absoluteIndex >= 0 ? absoluteIndex : fallbackIndex;
    },
    [flatLabels],
  );

  const parseForIndex = useCallback(
    (content: string) => {
      const currentLabel = itemLabels[labelIndex];
      const overrideName = currentLabel ? manualOverrides[currentLabel.id] : null;
      const resolved = parseContent(
        applyManualOverride(content, overrideName),
        getAbsoluteLabelIndex(currentLabel, labelIndex),
      );

      if (resolved == null) return "";
      return typeof resolved === "object" ? resolved : String(resolved);
    },
    [getAbsoluteLabelIndex, itemLabels, labelIndex, manualOverrides, parseContent],
  );

  const buildZpl = useCallback(
    (labels: typeof itemLabels) => {
      if (!activeTemplate) return "";
      return generateZPLForBatch(
        activeTemplate.elements,
        activeTemplate.width,
        activeTemplate.height,
        labels,
        (content, index) => {
          const label = labels[index];
          const overrideName = label ? manualOverrides[label.id] : null;
          const resolved = parseContent(
            applyManualOverride(content, overrideName),
            getAbsoluteLabelIndex(label, index),
          );

          if (resolved == null) return "";
          return typeof resolved === "object" ? JSON.stringify(resolved) : String(resolved);
        },
      );
    },
    [activeTemplate, getAbsoluteLabelIndex, manualOverrides, parseContent],
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
      const url = await toPng(canvasRef.current, { pixelRatio: 3, backgroundColor: "white" });
      const link = document.createElement("a");
      link.href = url;
      link.download = `etiqueta-${item?.dish_name ?? item?.name ?? "label"}.png`;
      link.click();
      toast.success("PNG exportado!", { id: toastId });
    } catch {
      toast.error("Erro ao gerar PNG", { id: toastId });
    }
  };

  const currentLabel = itemLabels[labelIndex];

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      <div className="shrink-0 space-y-4 border-b border-slate-50 p-6">
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
        <div className="space-y-2 border-b border-slate-50 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Template</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-[9px] font-black uppercase transition-all",
                  selectedTemplateId === template.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {template.name}
                {template.source === "legacy" && (
                  <Badge className="ml-1 h-4 border-none bg-amber-100 text-[7px] text-amber-700">
                    fallback
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {itemLabels.length > 1 && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Marmita {labelIndex + 1} de {itemLabels.length}
            </span>
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
                onClick={() => setLabelIndex((value) => Math.min(itemLabels.length - 1, value + 1))}
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
                  elements={activeTemplate.elements}
                  setElements={() => {}}
                  isDesignMode={false}
                  selectedId={null}
                  setSelectedId={() => {}}
                  parseContent={parseForIndex}
                  zoom={1}
                  isPrintMode
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

        {currentLabel && (
          <div className="px-6 pb-4">
            <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-emerald-600">
                  Ajuste rápido de impressão
                </label>
                <Input
                  placeholder="Nome que sairá na etiqueta..."
                  value={manualOverrides[currentLabel.id] ?? currentLabel.displayName}
                  onChange={(event) =>
                    setManualOverrides((previous) => ({
                      ...previous,
                      [currentLabel.id]: event.target.value,
                    }))
                  }
                  className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm"
                />
              </div>

              <div className="space-y-1 border-t border-slate-200/60 pt-3">
                <p className="mb-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                  Dados do pedido
                </p>
                <p className="truncate text-[9px] font-bold text-slate-600">
                  <span className="text-slate-400">Composição original:</span> {currentLabel.displayName}
                </p>
                <p className="text-[9px] font-bold text-slate-600">
                  <span className="text-slate-400">Cliente:</span> {String(order?.customerName ?? "—")}
                </p>
                <p className="text-[9px] font-bold text-slate-600">
                  <span className="text-slate-400">Pedido:</span> #{String(order?.id ?? "").slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handlePrintOne}
            disabled={zebra.isPrinting || !activeTemplate || !zebra.isReady || !currentLabel}
            className="h-14 gap-2 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-600"
          >
            {zebra.isPrinting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
            {zebra.isReady ? "Esta etiqueta" : "Offline"}
          </Button>
          <Button
            onClick={handlePrintBatch}
            disabled={zebra.isPrinting || !activeTemplate || !zebra.isReady || itemLabels.length <= 1}
            variant="outline"
            className="h-14 rounded-2xl border-slate-200 text-[10px] font-black uppercase gap-2"
          >
            <Printer size={14} /> Lote ({itemLabels.length})
          </Button>
        </div>

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
