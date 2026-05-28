import React, { useState } from "react";
import { ChevronDown, ExternalLink, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Order } from "../../types/orderTypes";
import {
  formatAddress,
  formatCurrency,
  formatDate,
  getOrderDiscounts,
  statusLabels,
  statusStyles,
} from "../../utils/orderHelpers";
import { OrderTracker } from "../OrderTracker";
import { OrdersTabItem } from "./OrdersTabItem";
import { OrdersTabLoyalty } from "./OrdersTabLoyalty";

export function OrdersTabCard({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { total } = getOrderDiscounts(order);

  return (
    <Card
      className={cn(
        "rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white transition-all duration-300",
        isExpanded
          ? "ring-2 ring-emerald-500/10 border-emerald-500/30 shadow-xl"
          : "hover:shadow-md",
      )}
    >
      <div
        className="p-4 md:p-6 flex items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 md:gap-5">
          <div
            className={cn(
              "hidden sm:flex p-4 rounded-3xl transition-all",
              isExpanded ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400",
            )}
          >
            <ShoppingBag className="h-5 w-5 md:h-6" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-slate-900 uppercase text-sm md:text-lg tracking-tighter">
                #{order.id}
              </span>
              <div
                className={cn(
                  "rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border",
                  statusStyles[order.status],
                )}
              >
                {statusLabels[order.status] || order.status}
              </div>
            </div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Rastrear pedido ${order.id}`}
                className="hidden md:flex gap-2 rounded-full font-black text-[9px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
              >
                <ExternalLink size={14} />
                Rastrear
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl rounded-[2.5rem] border-none p-0 overflow-hidden outline-none shadow-2xl">
              <DialogHeader className="sr-only">
                <DialogTitle>Rastreio do Pedido #{order.id}</DialogTitle>
                <DialogDescription>
                  Acompanhamento detalhado do status do pedido
                </DialogDescription>
              </DialogHeader>

              <OrderTracker orderId={String(order.id)} />
            </DialogContent>
          </Dialog>

          <div className="text-right bg-slate-50/80 px-3 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-slate-100">
            <p className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black leading-none mb-0.5">
              Total
            </p>
            <p className="text-xs md:text-lg font-black text-slate-900 leading-none">
              {formatCurrency(total)}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 md:h-5 md:w-5 text-slate-300 transition-transform duration-300",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-300">
          <div className="px-5 md:px-8 py-3 bg-slate-50/50 flex items-start gap-3 border-b border-slate-100/50">
            <MapPin size={12} className="text-orange-500 mt-0.5 shrink-0" />
            <div className="text-[10px] md:text-xs font-bold text-slate-600 italic leading-tight text-left">
              {formatAddress(order)}
            </div>
          </div>

          <div className="p-4 md:p-8 space-y-6">
            <div className="grid gap-4 md:gap-6">
              {order.items?.map((item, idx) => (
                <OrdersTabItem key={`${order.id}-item-${idx}`} item={item} />
              ))}
            </div>

            <OrdersTabLoyalty order={order} />
          </div>
        </div>
      )}
    </Card>
  );
}
