import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";
import { ArrowLeft, Copy, Loader2, Printer, RefreshCw, Send } from "lucide-react";
import OrderPrintTemplate, { type OrderData } from "./OrderPrintTemplate";
import { LabelCanvas } from "./design/LabelCanvas";
import { ZebraSettingsPanel } from "../../ZebraSettingsPanel";
import { LabelEditorStation } from "../../../../adminLabelEditor/components/LabelEditorStation";
import {
  buildTemplateLibrary,
  generateZPLForBatch,
  useLabelLogic,
  useZebraTransport,
  type AdminLabelTemplate,
  type ZebraPhysicalConfig,
} from "../../../../adminLabelEditor/print-engine";

interface StoreSettingResult {
  value?: string;
}

export default function OrderPrintCenter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<"receipt" | "labels">("labels");
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [physicalConfig, setPhysicalConfig] = useState<ZebraPhysicalConfig>({});

  const { data: order, isLoading: isOrderLoading, isRefetching } =
    trpc.admin.ordersAdmin.getById.useQuery(
      { orderId: id || "" },
      { enabled: !!id, staleTime: 30000 },
    );

  const { data: templatesRaw = [], isLoading: isTemplatesLoading } =
    trpc.admin.labels.getTemplates.useQuery(undefined, { enabled: !!id });

  const { data: legacyRaw } = trpc.admin.storeSettings.getByKey.useQuery(
    { key: "label_design_elements" },
    { enabled: !!id },
  );

  const templates = useMemo(
    () =>
      buildTemplateLibrary(
        templatesRaw as AdminLabelTemplate[],
        (legacyRaw as StoreSettingResult | undefined)?.value,
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
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const { flatLabels, parseContent } = useLabelLogic(
    (order as Record<string, unknown> | null) || { id: "", customerName: "", items: [] },
    0,
    90,
  );

  const zebra = useZebraTransport();

  const buildZpl = useCallback(
    () =>
      activeTemplate
        ? generateZPLForBatch(
            activeTemplate.elements,
            activeTemplate.width,
            activeTemplate.height,
            flatLabels,
            (content, index) => {
              const value = parseContent(content, index);
              if (value == null) return "";
              return typeof value === "object" ? JSON.stringify(value) : String(value);
            },
            physicalConfig,
          )
        : "",
    [activeTemplate, flatLabels, parseContent, physicalConfig],
  );

  const handlePrintAllZebra = async () => {
    if (!activeTemplate || flatLabels.length === 0) {
      toast.warning("Nenhuma etiqueta disponível.");
      return;
    }
    await zebra.sendZpl(buildZpl());
  };

  const handleCopyZpl = async () => {
    if (!activeTemplate || flatLabels.length === 0) {
      toast.warning("Nenhuma etiqueta disponível.");
      return;
    }
    await navigator.clipboard.writeText(buildZpl());
    toast.success("ZPL copiado.");
  };

  if (isOrderLoading || isTemplatesLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <Loader2 className="mb-4 animate-spin text-emerald-500" size={48} />
        <p className="text-[10px] font-black uppercase italic tracking-widest text-slate-400">
          Sincronizando...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans text-left">
      <header className="no-print sticky top-0 z-50 shrink-0 border-b border-slate-200 bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-xl">
              <ArrowLeft size={18} />
            </Button>

            <div className="ml-2 flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => {
                  setMode("receipt");
                  setShowDesigner(false);
                }}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all",
                  mode === "receipt" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
                )}
              >
                Cupom
              </button>
              <button
                onClick={() => setMode("labels")}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all",
                  mode === "labels" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
                )}
              >
                Etiquetas
              </button>
            </div>

            {mode === "labels" && (
              <Button
                variant="outline"
                onClick={() => setShowDesigner((value) => !value)}
                className={cn(
                  "ml-4 rounded-xl text-[10px] font-black uppercase",
                  showDesigner && "bg-red-50 text-red-600",
                )}
              >
                {showDesigner ? "Sair do Editor" : "Ajustar Layout"}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => utils.admin.ordersAdmin.getById.invalidate({ orderId: id || "" })}
              className="rounded-xl text-slate-400"
            >
              <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
            </Button>

            {mode === "labels" && (
              <>
                <Button
                  disabled={zebra.isPrinting || flatLabels.length === 0 || !activeTemplate}
                  onClick={handlePrintAllZebra}
                  className={cn(
                    "gap-2 rounded-xl px-6 text-[10px] font-black uppercase shadow-lg transition-all",
                    zebra.isReady
                      ? "bg-emerald-600 text-white shadow-emerald-200/50 hover:bg-emerald-700"
                      : "cursor-not-allowed bg-slate-200 text-slate-400",
                  )}
                >
                  {zebra.isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {zebra.isPrinting
                    ? "Enviando..."
                    : zebra.isReady
                      ? `Zebra (${zebra.method === "usb" ? "USB" : "BPrint"})`
                      : "Zebra Offline"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCopyZpl}
                  disabled={flatLabels.length === 0 || !activeTemplate}
                  className="gap-2 rounded-xl text-[10px] font-black uppercase"
                >
                  <Copy size={16} /> Copiar ZPL
                </Button>
              </>
            )}

            <Button
              onClick={() => window.print()}
              className="rounded-xl bg-slate-900 px-8 text-[10px] font-black uppercase text-white shadow-lg"
            >
              <Printer size={16} className="mr-2" /> Imprimir Web
            </Button>
          </div>
        </div>

        {mode === "labels" && !showDesigner && (
          <div className="mx-auto mt-3 max-w-screen-xl">
            <ZebraSettingsPanel
              connection={zebra}
              isUSBSupported={zebra.isUSBSupported}
              onConnectUSB={zebra.connectUSB}
              onCheckBrowserPrint={zebra.checkBrowserPrint}
              onChange={setPhysicalConfig}
            />
          </div>
        )}
      </header>

      <main className="relative flex flex-1 overflow-hidden">
        {mode === "labels" && showDesigner ? (
          <div className="flex-1 bg-white">
            <LabelEditorStation
              initialTemplateId={
                selectedTemplateId && /^\d+$/.test(selectedTemplateId)
                  ? Number(selectedTemplateId)
                  : undefined
              }
              order={(order as Record<string, unknown>) || { id: "", customerName: "", items: [] }}
              onCancel={() => setShowDesigner(false)}
            />
          </div>
        ) : (
          <section className="custom-scrollbar flex flex-1 flex-col items-center overflow-y-auto bg-slate-100/50 p-10">
            {mode === "receipt" ? (
              <div className="w-full max-w-[80mm] border border-slate-200 bg-white shadow-2xl">
                <OrderPrintTemplate order={(order as unknown as OrderData) || null} />
              </div>
            ) : !activeTemplate ? (
              <div className="py-20 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Nenhum template disponível
                </p>
              </div>
            ) : flatLabels.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Nenhuma etiqueta gerada para este pedido
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {flatLabels.map((_, index) => (
                  <div
                    key={String(flatLabels[index].id)}
                    className="relative shrink-0 overflow-hidden border border-slate-200/50 bg-white shadow-xl print:break-after-page print:shadow-none"
                    style={{
                      width: `${activeTemplate.width}mm`,
                      height: `${activeTemplate.height}mm`,
                    }}
                  >
                    <LabelCanvas
                      elements={activeTemplate.elements}
                      setElements={() => {}}
                      isDesignMode={false}
                      selectedId={null}
                      setSelectedId={() => {}}
                      parseContent={(content: string) => parseContent(content, index)}
                      zoom={1}
                      isPrintMode
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print, header, aside, button { display: none !important; }
              body { background: white !important; margin: 0; padding: 0; }
              @page { margin: 0; size: ${
                mode === "receipt"
                  ? "80mm auto"
                  : `${activeTemplate?.width ?? 100}mm ${activeTemplate?.height ?? 60}mm`
              }; }
            }
          `,
        }}
      />
    </div>
  );
}
