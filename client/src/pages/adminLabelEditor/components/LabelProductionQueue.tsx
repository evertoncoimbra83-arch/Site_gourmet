import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Printer, RefreshCw } from "lucide-react";
import { trpc } from "@/_core/trpc";
import { useNavigate } from "react-router-dom";

export function LabelProductionQueue() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data: pendingOrders, isLoading } = trpc.admin.labels.getPending.useQuery();

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-slate-800">
            Produção de <span className="text-emerald-500">Etiquetas</span>
          </h1>
          <p className="text-slate-500">Abra um pedido para imprimir e conferir as marmitas.</p>
        </div>
        <Button
          onClick={() => utils.admin.labels.getPending.invalidate()}
          variant="ghost"
          className="gap-2"
        >
          <RefreshCw size={16} /> Atualizar
        </Button>
      </header>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pendingOrders?.map((order) => (
            <Card
              key={order.id}
              className="space-y-3 rounded-3xl border-slate-200 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div>
                <p className="text-sm font-black uppercase text-slate-800">
                  #{order.id} - {order.customerName}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {order.totalItems} itens
                </p>
              </div>

              <Button
                onClick={() => navigate(`/admin/labels/editor/production/${order.id}`)}
                className="h-11 w-full gap-2 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white"
              >
                <Printer size={14} /> Abrir produção
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
