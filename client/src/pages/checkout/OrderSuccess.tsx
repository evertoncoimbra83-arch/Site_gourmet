import React, { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  LayoutGrid,
  MessageCircle,
  ReceiptText,
  Star,
} from "lucide-react";
import { trpc } from "@/_core/trpc";
import { useAnalytics } from "@/_core/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { formatCurrency, getOrderDiscounts } from "@/pages/profile/utils/orderHelpers";
import type { Order } from "@/pages/profile/types/orderTypes";

// --- INTERFACES ---

interface Partner {
  name: string;
  link?: string;
  logo_url?: string;
  discount_text?: string;
}

interface StoreSettings {
  success_order_message?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  phone?: string;
  partners_json?: string | Partner[];
}

// --- HELPERS DE VALIDAÇÃO E NORMALIZAÇÃO ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPartner(value: unknown): value is Partner {
  return isRecord(value) && typeof value.name === "string";
}

function normalizePartners(value: unknown): Partner[] {
  if (Array.isArray(value)) return value.filter(isPartner);
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isPartner) : [];
  } catch {
    return [];
  }
}

function normalizeStoreSettings(value: unknown): StoreSettings {
  if (!isRecord(value)) {
    return {
      success_order_message: "Pedido recebido com sucesso!",
      whatsapp: "",
      phone: "",
      partners_json: [],
    };
  }

  return {
    success_order_message:
      typeof value.success_order_message === "string"
        ? value.success_order_message
        : "Pedido recebido com sucesso!",
    whatsapp: typeof value.whatsapp === "string" ? value.whatsapp : "",
    whatsapp_number:
      typeof value.whatsapp_number === "string" ? value.whatsapp_number : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    partners_json:
      typeof value.partners_json === "string" || Array.isArray(value.partners_json)
        ? value.partners_json
        : [],
  };
}

function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    "id" in value &&
    "items" in value &&
    Array.isArray(value.items) &&
    "total" in value &&
    "shippingCost" in value
  );
}

// Formata os itens para o padrão exigido pelo GA4 (e-commerce)
function buildPurchaseItems(order: Order, couponCode: string) {
  return order.items.map((item) => {
    const quantity = Number(item.quantity || 1);
    const totalPrice = Number(item.totalPrice || 0);

    return {
      item_id: String(item.id),
      item_name: item.dishName || item.name,
      price: quantity > 0 ? Number((totalPrice / quantity).toFixed(2)) : totalPrice,
      quantity,
      item_category:
        item.packageItems && item.packageItems.length > 0 ? "Pacote" : "Prato Avulso",
      coupon: couponCode || undefined,
    };
  });
}

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  // Pegamos a função trackPurchase do nosso hook centralizado
  const { trackPurchase } = useAnalytics();

  const { data: storeInfoRaw } = trpc.public.getStoreSettings.useQuery();
  const { data: orderRaw } = trpc.orders.getById.useQuery(
    { id: orderId || "" },
    { enabled: Boolean(orderId) && orderId !== "preview" },
  );

  const order = isOrder(orderRaw) ? orderRaw : null;

  const settings = useMemo(() => {
    const normalized = normalizeStoreSettings(storeInfoRaw);
    return {
      successMessage: normalized.success_order_message || "Pedido recebido com sucesso!",
      whatsapp: normalized.whatsapp || normalized.whatsapp_number || normalized.phone || "",
      partners: normalizePartners(normalized.partners_json),
    };
  }, [storeInfoRaw]);

  const orderDiscounts = useMemo(() => {
    return order ? getOrderDiscounts(order) : null;
  }, [order]);

  // Efeito para disparar a conversão apenas uma vez por pedido
  useEffect(() => {
    // Só prossegue se tiver os dados do pedido e se a função de tracking existir
    if (!order || !orderId || orderId === "preview" || !orderDiscounts || !trackPurchase) return;

    const purchaseStorageKey = `ga4_purchase_sent_${String(order.id)}`;
    
    // Evita disparos duplicados em caso de refresh da página
    if (sessionStorage.getItem(purchaseStorageKey) === "1") return;

    trackPurchase({
      transaction_id: String(order.id),
      currency: "BRL",
      value: orderDiscounts.total,
      shipping: orderDiscounts.shippingCost,
      coupon: orderDiscounts.couponCode || undefined,
      items: buildPurchaseItems(order, orderDiscounts.couponCode || ""),
    });

    sessionStorage.setItem(purchaseStorageKey, "1");
  }, [order, orderDiscounts, orderId, trackPurchase]);

  const getImageUrl = (path: string): string => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    return `${backendUrl}/uploads/${path.replace(/^\//, "")}`;
  };

  return (
    <div
      data-testid="order-success-container"
      className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-6 py-12 font-sans"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-6"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-12 text-center relative overflow-hidden">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10"
            >
              <div className="inline-flex bg-emerald-500 p-4 rounded-3xl mb-6 shadow-xl shadow-emerald-500/40 rotate-3">
                <CheckCircle2 className="text-white" size={40} strokeWidth={3} />
              </div>
              <h1 className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none">
                {orderId === "preview" ? "Visualização" : "Pedido"}{" "}
                <span className="text-emerald-500">Confirmado!</span>
              </h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">
                {orderId === "preview"
                  ? "MODO TESTE DE CONFIGURAÇÃO"
                  : `Protocolo: #${orderId?.slice(-8).toUpperCase()}`}
              </p>
            </motion.div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
          </div>

          <div className="p-8 md:p-10 space-y-8">
            <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
              <div className="bg-white p-2 rounded-xl shadow-sm text-emerald-600">
                <CalendarCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase text-emerald-800 tracking-widest">
                  Informações de Entrega
                </h3>
                <p className="text-[11px] font-medium text-emerald-600/80 italic leading-relaxed">
                  {settings.successMessage}
                </p>
              </div>
            </div>

            {order && orderDiscounts && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 text-slate-400">
                  <ReceiptText size={14} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                    Detalhes da Compra
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                      Total Pago
                    </span>
                    <span className="text-sm font-black text-slate-900 italic">
                      {formatCurrency(orderDiscounts.total)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                      Tipo
                    </span>
                    <span className="text-sm font-black text-slate-900 italic uppercase">
                      {order.shippingType === "pickup" ? "Retirada" : "Entrega"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button
                asChild
                className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95 group border-none"
              >
                <Link to={orderId === "preview" ? "#" : "/perfil/pedidos"}>
                  <div className="flex items-center gap-2">
                    <span>Acompanhar Status</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </Button>

              <div className="flex gap-3">
                <Button
                  asChild
                  variant="ghost"
                  className="flex-1 h-12 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest hover:bg-slate-100"
                >
                  <Link to="/">Início</Link>
                </Button>
                <Button
                  disabled={!settings.whatsapp}
                  onClick={() => {
                    if (!settings.whatsapp) return;
                    const phone = settings.whatsapp.replace(/\D/g, "");
                    const message = encodeURIComponent(
                      `Olá! Gostaria de agendar a entrega do meu pedido #${orderId}.`,
                    );
                    window.open(`https://wa.me/55${phone}?text=${message}`);
                  }}
                  className="flex-2 h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase text-[9px] tracking-widest shadow-md border-none"
                >
                  <MessageCircle size={16} className="mr-2" /> WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4 pt-4"
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Star size={14} className="text-amber-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                Vantagens Exclusivas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {settings.partners.length > 0 ? (
              settings.partners.map((partner, idx) => (
                <a
                  key={idx}
                  href={partner.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all flex flex-col items-center text-center gap-2"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                    {partner.logo_url ? (
                      <img
                        src={getImageUrl(partner.logo_url)}
                        alt={partner.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <LayoutGrid size={20} className="text-slate-200" />
                    )}
                  </div>
                  <div className="w-full">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase leading-none truncate">
                      {partner.name}
                    </h4>
                    <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1 tracking-tighter flex items-center gap-1 justify-center">
                      {partner.discount_text || "Benefício"} <ExternalLink size={8} />
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 bg-slate-100/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <span className="text-[8px] font-black text-slate-400 uppercase">
                  Clube de Benefícios em Breve
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <p className="mt-10 text-slate-400 text-[8px] font-black uppercase tracking-[0.5em] opacity-50 italic text-center">
        Boutique Fit • Crafted for You
      </p>
    </div>
  );
}