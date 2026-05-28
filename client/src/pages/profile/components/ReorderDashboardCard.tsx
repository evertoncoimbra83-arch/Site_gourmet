// client/src/pages/profile/components/ReorderDashboardCard.tsx
import React, { useMemo } from "react";
import { useReorder } from "../logic/useReorder";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertCircle, Sparkles, Utensils } from "lucide-react";
import { formatCurrency, getOrderDiscounts } from "../utils/orderHelpers";
import { normalizeImageUrl } from "@shared/utils/assets";
import type { Order } from "../types/orderTypes";

export function ReorderDashboardCard({ orders }: { orders: Order[] }) {
  const { reorder, isLoading: isReordering, isItemAvailable } = useReorder();

  // Encontra o último pedido concluído ou entregue
  const lastCompletedOrder = useMemo(() => {
    if (!Array.isArray(orders)) return null;
    return orders.find(
      (o) =>
        o.status === "completed" ||
        o.status === "delivered" ||
        o.status.toLowerCase() === "completed" ||
        o.status.toLowerCase() === "delivered"
    );
  }, [orders]);

  const hasUnavailableItems = useMemo(() => {
    if (!lastCompletedOrder || !lastCompletedOrder.items) return false;
    return lastCompletedOrder.items.some((item) => !isItemAvailable(item));
  }, [lastCompletedOrder, isItemAvailable]);

  // Calcula a quantidade total de refeições somando a quantidade de cada item
  const totalMeals = useMemo(() => {
    if (!lastCompletedOrder || !lastCompletedOrder.items) return 0;
    return lastCompletedOrder.items.reduce((acc, item) => {
      const qty = typeof item.quantity === "number" ? item.quantity : Number(item.quantity || 0);
      return acc + qty;
    }, 0);
  }, [lastCompletedOrder]);

  if (!lastCompletedOrder) return null;

  const { total } = getOrderDiscounts(lastCompletedOrder);
  const items = lastCompletedOrder.items || [];
  const mainImage = items[0]?.imageUrl ? normalizeImageUrl(items[0].imageUrl) : null;

  const orderTitle = items.length > 0
    ? `${items[0].dishName || items[0].name}${items.length > 1 ? ` + ${items.length - 1} item(ns)` : ""}`
    : `Pedido #${lastCompletedOrder.id}`;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50/30 to-emerald-50/60 border border-emerald-200/80 hover:border-emerald-300 rounded-[2rem] p-5 md:py-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-5 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full md:w-auto text-center sm:text-left">
        {/* Miniatura do prato/combo */}
        <div className="h-16 w-16 rounded-2xl bg-white border border-emerald-100 shadow-md shrink-0 flex items-center justify-center relative overflow-hidden group">
          {mainImage ? (
            <img src={mainImage} alt={orderTitle} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
              <Utensils className="h-6 w-6 text-emerald-600/70" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full tracking-wider leading-none">
              <Sparkles size={8} className="fill-emerald-700" />
              Peça de Novo
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/95 border border-slate-200/70 px-2 py-0.5 rounded-md shadow-xs">
              Pedido #{lastCompletedOrder.id}
            </span>
          </div>

          <h3 className="text-slate-800 font-black text-sm md:text-base tracking-tight uppercase italic mt-2 leading-none">
            {orderTitle}
          </h3>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
            <span>{totalMeals} {totalMeals === 1 ? "refeição" : "refeições"}</span>
            <span className="h-3 w-px bg-slate-200 hidden sm:inline" />
            <span className="text-emerald-800 font-black text-xs">{formatCurrency(total)}</span>
          </div>

          {hasUnavailableItems && (
            <div className="flex items-center justify-center sm:justify-start gap-1 text-[9px] text-rose-500 font-black uppercase tracking-wider mt-1.5">
              <AlertCircle size={10} />
              <span>Itens indisponíveis serão desconsiderados</span>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={() => reorder(lastCompletedOrder)}
        disabled={isReordering}
        aria-label="Pedir novamente o último pedido"
        className="w-full md:w-auto h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
      >
        <RotateCcw size={13} className={isReordering ? "animate-spin" : ""} />
        {isReordering ? "Processando..." : "Pedir novamente"}
      </Button>
    </div>
  );
}
