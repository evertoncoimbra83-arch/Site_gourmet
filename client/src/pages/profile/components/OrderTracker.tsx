import React from "react";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";
import { Calendar, CreditCard, Loader2, MapPin, MessageCircle } from "lucide-react";
import {
  formatAddress,
  formatCurrency,
  formatDate,
  getOrderDiscounts,
  getStatusLabel,
  statusStyles,
} from "../utils/orderHelpers";
import { Order } from "../types/orderTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    ("id" in value) &&
    ("status" in value) &&
    ("createdAt" in value) &&
    ("items" in value) &&
    Array.isArray(value.items)
  );
}

function getSocialInfo(settings: unknown): Record<string, unknown> {
  if (!isRecord(settings)) return {};

  const rawSocial = settings.company_social_info;
  if (typeof rawSocial === "string") {
    try {
      const parsed = JSON.parse(rawSocial);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isRecord(rawSocial) ? rawSocial : {};
}

export function OrderTracker({ orderId }: { orderId: string }) {
  const { data: orderData, isLoading: isLoadingOrder } = trpc.orders.getById.useQuery({
    id: orderId,
  });
  const { data: settings } = trpc.public.getPublicSettings.useQuery();

  if (isLoadingOrder) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
          Sincronizando...
        </p>
      </div>
    );
  }

  if (!isOrder(orderData)) {
    return (
      <div className="p-20 text-center font-black uppercase text-slate-400 tracking-widest">
        Pedido não localizado.
      </div>
    );
  }

  const order = orderData;
  const { total } = getOrderDiscounts(order);
  const address = formatAddress(order);
  const isPickup = address.toLowerCase().includes("retirada");

  const socialInfo = getSocialInfo(settings);
  const whatsapp =
    typeof socialInfo.whatsapp === "string" ? socialInfo.whatsapp.replace(/\D/g, "") : "551145265941";

  return (
    <div className="text-left animate-in fade-in duration-500 bg-white">
      <div className="bg-slate-900 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 italic">
              Acompanhamento
            </p>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              Pedido #{order.id}
            </h2>
          </div>
          <div
            className={cn(
              "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest italic shadow-lg",
              statusStyles[order.status] || "bg-slate-800 border-slate-700 text-slate-400",
            )}
          >
            {getStatusLabel(order.status)}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-5 rounded-3xl flex items-center gap-4 border border-slate-100 shadow-sm">
            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                Data do Pedido
              </p>
              <p className="text-xs font-bold text-slate-900">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-3xl flex items-center gap-4 border border-slate-100 shadow-sm">
            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                Tipo de Entrega
              </p>
              <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {isPickup ? "Retirada na Loja" : "Entrega em Domicílio"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-3xl flex items-center gap-4 border border-slate-100 shadow-sm">
            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                Total Pago
              </p>
              <p className="text-xs font-bold text-slate-900">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Endereço de Entrega
            </p>
          </div>
          <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 italic">
            {address}
          </p>
        </div>

        <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white text-center shadow-xl shadow-emerald-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <MessageCircle size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-3 italic">
            Alguma dúvida sobre sua entrega?
          </p>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-emerald-700 px-8 py-3 rounded-2xl font-black uppercase italic text-sm hover:bg-slate-50 transition-colors shadow-lg"
          >
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
