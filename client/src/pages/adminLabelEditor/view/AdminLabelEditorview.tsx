import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, PencilRuler, Printer } from "lucide-react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { LabelEditorStation } from "../components/LabelEditorStation";
import { LabelProductionPanel } from "../components/LabelProductionPanel";
import { LabelProductionQueue } from "../components/LabelProductionQueue";

interface AdminLabelEditorViewProps {
  initialId?: number;
  initialMode?: "design" | "production";
  orderId?: string;
}

function DesignMode({ initialId }: { initialId?: number }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewOrderId = searchParams.get("orderId") ?? undefined;

  const { data: previewOrder } = trpc.admin.ordersAdmin.getById.useQuery(
    { orderId: previewOrderId || "" },
    { enabled: !!previewOrderId },
  );

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-slate-100">
      <header className="shrink-0 border-b border-slate-200 bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                Label <span className="text-emerald-500">Studio</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Modo Design
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="h-10 rounded-xl bg-slate-900 text-[10px] font-black uppercase text-white">
              <PencilRuler size={14} className="mr-2" /> Design
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/labels/editor/production")}
              className="h-10 rounded-xl text-[10px] font-black uppercase"
            >
              <Printer size={14} className="mr-2" /> Produção
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <LabelEditorStation
          initialTemplateId={initialId}
          order={(previewOrder as Record<string, unknown> | null) ?? null}
        />
      </main>
    </div>
  );
}

function ProductionMode({ orderId }: { orderId?: string }) {
  const navigate = useNavigate();
  const { data: order, isLoading } = trpc.admin.ordersAdmin.getById.useQuery(
    { orderId: orderId || "" },
    { enabled: !!orderId },
  );

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-slate-100">
      <header className="shrink-0 border-b border-slate-200 bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                Label <span className="text-emerald-500">Studio</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Modo Produção
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/labels/editor")}
              className="h-10 rounded-xl text-[10px] font-black uppercase"
            >
              <PencilRuler size={14} className="mr-2" /> Design
            </Button>
            <Button className="h-10 rounded-xl bg-slate-900 text-[10px] font-black uppercase text-white">
              <Printer size={14} className="mr-2" /> Produção
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {!orderId ? (
          <LabelProductionQueue />
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm font-bold text-slate-400">Carregando pedido...</p>
          </div>
        ) : (
          <LabelProductionPanel
            order={(order as Record<string, unknown> | null) ?? null}
            className="h-full"
          />
        )}
      </main>
    </div>
  );
}

export default function AdminLabelEditorView({
  initialId,
  initialMode = "design",
  orderId,
}: AdminLabelEditorViewProps) {
  if (initialMode === "production") {
    return <ProductionMode orderId={orderId} />;
  }

  return <DesignMode initialId={initialId} />;
}