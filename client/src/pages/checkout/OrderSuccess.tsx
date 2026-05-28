// src/pages/checkout/OrderSuccess.tsx
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
  MapPin
} from "lucide-react";
import { trpc } from "@/_core/trpc";
import { useAnalytics } from "@/_core/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { formatCurrency, getOrderDiscounts } from "@/pages/profile/utils/orderHelpers";
import type { Order } from "@/pages/profile/types/orderTypes";
import { normalizeImageUrl } from "@shared/utils/assets";

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

// ✅ FIX 1: toNumber seguro — evita o padrão frágil Number(x || fallback)
// que trata 0 como falsy e substitui pelo fallback incorretamente
function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
    success_order_message: typeof value.success_order_message === "string" ? value.success_order_message : "Pedido recebido com sucesso!",
    whatsapp: typeof value.whatsapp === "string" ? value.whatsapp : "",
    whatsapp_number: typeof value.whatsapp_number === "string" ? value.whatsapp_number : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    partners_json: typeof value.partners_json === "string" || Array.isArray(value.partners_json) ? value.partners_json : [],
  };
}

function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) && "id" in value && "items" in value && Array.isArray(value.items) && "total" in value && "shippingCost" in value
  );
}

function buildPurchaseItems(order: Order, couponCode: string) {
  return order.items.map((item) => {
    // ✅ FIX 1 aplicado: toNumber com fallback explícito
    // Number(item.quantity || 1) tratava quantity=0 como 1 (bug silencioso)
    const quantity = toNumber(item.quantity, 1);
    const totalPrice = toNumber(item.totalPrice);

    return {
      item_id: String(item.id),
      item_name: item.dishName || item.name,
      price: quantity > 0 ? Number((totalPrice / quantity).toFixed(2)) : totalPrice,
      quantity,
      item_category: item.packageItems && item.packageItems.length > 0 ? "Pacote" : "Prato Avulso",
      coupon: couponCode || undefined,
    };
  });
}

// ✅ FIX 3: sessionStorage helpers com try/catch
// sessionStorage pode lançar em modo privado ou com storage cheio
function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignora falha de storage — o tracking já foi disparado
  }
}

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  
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
      successMessage: normalized.success_order_message || "Seu pedido foi recebido e já está sendo processado com todo o cuidado.",
      whatsapp: normalized.whatsapp || normalized.whatsapp_number || normalized.phone || "",
      partners: normalizePartners(normalized.partners_json),
    };
  }, [storeInfoRaw]);

  const orderDiscounts = useMemo(() => {
    return order ? getOrderDiscounts(order) : null;
  }, [order]);

  useEffect(() => {
    if (!order || !orderId || orderId === "preview" || !orderDiscounts || !trackPurchase) return;
    const purchaseStorageKey = `ga4_purchase_sent_${String(order.id)}`;

    // ✅ FIX 3 aplicado: safeSessionGet/safeSessionSet não explodem em storage indisponível
    if (safeSessionGet(purchaseStorageKey) === "1") return;

    trackPurchase({
      transaction_id: String(order.id),
      currency: "BRL",
      value: orderDiscounts.total,
      shipping: orderDiscounts.shippingCost,
      coupon: orderDiscounts.couponCode || undefined,
      items: buildPurchaseItems(order, orderDiscounts.couponCode || ""),
    });

    safeSessionSet(purchaseStorageKey, "1");
  }, [order, orderDiscounts, orderId, trackPurchase]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 py-12 relative overflow-hidden font-sans">
      {/* Brilho de fundo (Glow effect) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full space-y-6 relative z-10"
      >
        {/* CARD PRINCIPAL */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-100">
          
          {/* HEADER GRADIENTE */}
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-10 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="inline-flex bg-white/20 p-4 rounded-full mb-5 shadow-lg ring-4 ring-white/30 backdrop-blur-md">
                <CheckCircle2 className="text-white" size={48} strokeWidth={2.5} />
              </div>
              <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                {orderId === "preview" ? "Visualização" : "Pedido Confirmado!"}
              </h1>
              <div className="mt-3 inline-flex items-center gap-2 bg-black/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
                <span className="text-emerald-50 text-[10px] font-bold uppercase tracking-widest">
                  {orderId === "preview" ? "Modo Teste" : `Protocolo: #${orderId?.slice(-8).toUpperCase()}`}
                </span>
              </div>
            </motion.div> 
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* INFORMAÇÕES DE ENTREGA (Estilo Ticket) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm text-emerald-500 shrink-0">
                <CalendarCheck size={24} />
              </div>
              <div className="text-left space-y-1 mt-0.5">
                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                  Status e Entrega
                </h3>
                <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                  {settings.successMessage}
                </p>
              </div>
            </div>

            {/* RESUMO DE VALORES */}
            {order && orderDiscounts && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                    <ReceiptText size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Total Pago</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(orderDiscounts.total)}
                  </span>
                </div>
                
                <div className="w-px h-10 bg-slate-100" />
                
                <div className="flex flex-col text-right">
                  <div className="flex items-center justify-end gap-1.5 mb-1 text-slate-400">
                    <MapPin size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Método</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest mt-1">
                    {order.shippingType === "pickup" ? "Retirada" : "Entrega"}
                  </span>
                </div>
              </motion.div>
            )}

            {/* BOTÕES DE AÇÃO */}
            <div className="space-y-3 pt-2">
              <Button
                asChild
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] border-none group"
              >
                <Link to={orderId === "preview" ? "#" : "/perfil/pedidos"}>
                  <div className="flex items-center justify-center gap-2">
                    <span>Acompanhar meu Pedido</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform opacity-70" />
                  </div>
                </Link>
              </Button>

              <div className="flex gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
                >
                  <Link to="/">Início</Link>
                </Button>
                <Button
                  disabled={!settings.whatsapp}
                  onClick={() => {
                    if (!settings.whatsapp) return;
                    const phone = settings.whatsapp.replace(/\D/g, "");
                    const message = encodeURIComponent(`Olá! Gostaria de falar sobre o meu pedido #${orderId}.`);
                    window.open(`https://wa.me/55${phone}?text=${message}`);
                  }}
                  className="flex-[1.5] h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 border-none transition-all active:scale-[0.98]"
                >
                  <MessageCircle size={16} className="mr-2" /> Falar no WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* PARCEIROS E MIMOS VIP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-2"
        >
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="h-px bg-slate-200 flex-1" />
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Mimos & Benefícios
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {settings.partners.length > 0 ? (
              settings.partners.map((partner, idx) => (
                <a
                  key={idx}
                  href={partner.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col items-center text-center gap-3"
                >
                  <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden ring-4 ring-slate-50 group-hover:scale-110 transition-transform">
                    {partner.logo_url ? (
                      <img
                        src={normalizeImageUrl(partner.logo_url) || ""}
                        alt={partner.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <LayoutGrid size={20} className="text-slate-300" />
                    )}
                  </div>
                  <div className="w-full space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {partner.name}
                    </h4>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1 justify-center">
                      {partner.discount_text || "Acessar"} <ExternalLink size={10} />
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Clube de Benefícios em Breve
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ASSINATURA */}
        <p className="mt-8 text-slate-400 text-[9px] font-medium uppercase tracking-[0.3em] text-center">
          Boutique Fit • Crafted for You
        </p>
      </motion.div>
    </div>
  );
}
