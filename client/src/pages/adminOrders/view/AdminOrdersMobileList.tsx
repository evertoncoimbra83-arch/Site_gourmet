import React from "react";
import {
  CheckSquare,
  Edit3,
  Loader2,
  ShoppingCart,
  Square,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isFinalizedOrderStatus } from "../logic/orderStatusGuards";
import { statusLabels } from "../logic/useAdminOrders";
import type { Order } from "./AdminOrdersView";

interface AdminOrdersMobileListProps {
  orders: Order[];
  selectedIds: string[];
  isEditing: boolean;
  isDeleting: boolean;
  onToggleSelect: (id: string) => void;
  onOpenOrder: (id: string) => void;
  onEditOrder: (id: string, status: string) => void;
  onDeleteOrder: (order: Order) => void;
}

function toSafeString(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export function AdminOrdersMobileList({
  orders,
  selectedIds,
  isEditing,
  isDeleting,
  onToggleSelect,
  onOpenOrder,
  onEditOrder,
  onDeleteOrder,
}: AdminOrdersMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {orders.map((order) => {
        const id = toSafeString(order.id);
        const isSelected = selectedIds.includes(id);
        const isFinalized = isFinalizedOrderStatus(order.status);

        return (
          <article
            key={id}
            className={cn(
              "rounded-3xl border bg-white p-4 shadow-sm",
              isSelected ? "border-emerald-200 bg-emerald-50/40" : "border-slate-100",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onToggleSelect(id)}
                className={cn(
                  "mt-1 shrink-0 text-slate-300",
                  isSelected && "text-emerald-600",
                )}
                aria-label={isSelected ? "Remover selecao" : "Selecionar pedido"}
              >
                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
              </button>

              <button
                type="button"
                onClick={() => onOpenOrder(id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-900">
                  #{id.slice(-8).toUpperCase()}
                </span>
                <h3 className="mt-2 truncate text-sm font-black uppercase text-slate-800">
                  {order.customerName || "Cliente"}
                </h3>
                <p className="truncate text-[11px] font-bold text-slate-400">
                  {order.customerPhone || "---"}
                </p>
              </button>

              <div className="text-right">
                <p className="text-base font-black italic text-slate-900">
                  R${" "}
                  {Number(order.total || 0).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <span className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[9px] font-black uppercase text-amber-700">
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenOrder(id)}
                className="h-11 rounded-2xl text-[10px] font-black uppercase"
              >
                <Edit3 size={14} />
                Ver
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isEditing || isFinalized}
                onClick={() => onEditOrder(id, order.status)}
                className="h-11 rounded-2xl text-[10px] font-black uppercase"
              >
                {isEditing ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                Editar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting || isFinalized}
                onClick={() => onDeleteOrder(order)}
                className="h-11 rounded-2xl text-[10px] font-black uppercase text-red-500"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Excluir
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
