import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import {
  ShoppingCart, TrendingUp,
  Utensils, Settings,
  Wallet, Zap, Palette,
  RefreshCcw, Clock, PackageSearch,
  Users, ArrowUpRight, ChefHat,
  Megaphone, Printer, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SystemHealthIndicator } from "../components/SystemHealthIndicator";
import { Badge } from "@/components/ui/badge";
import OrderDetailsDrawer from "@/pages/adminOrders/components/OrderDetailsDrawer";
import { formatCurrency } from "@/pages/profile/utils/orderHelpers";

interface RecentOrder {
  id: string;
  customerName: string | null;
  status: string | null;
  createdAt: string | Date | null;
  total: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Pendente",   cls: "bg-amber-100 text-amber-700" },
  confirmed:  { label: "Confirmado", cls: "bg-blue-100 text-blue-700" },
  preparing:  { label: "Preparo",    cls: "bg-purple-100 text-purple-700" },
  ready:      { label: "Pronto",     cls: "bg-emerald-100 text-emerald-700" },
  completed:  { label: "Entregue",   cls: "bg-slate-100 text-slate-600" },
  cancelled:  { label: "Cancelado",  cls: "bg-rose-100 text-rose-700" },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: stats, isLoading, isFetching } = trpc.admin.analytics.getDashboardStats.useQuery(undefined, {
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const { data: ordersResponse } = trpc.admin.orders.list.useQuery(
    { perPage: 6, page: 1 },
    { refetchInterval: 30000 }
  );

  const recentOrders = (ordersResponse?.orders || []) as unknown as RecentOrder[];

  useEffect(() => {
    utils.admin.analytics.getDashboardStats.invalidate();
  }, [utils]);

  const totalOrdersCount = useMemo(() =>
    stats?.paymentMethods?.reduce((acc, p) => acc + (Number(p.value) || 0), 0) || 0,
    [stats]
  );

  const averageTicket = totalOrdersCount > 0
    ? (stats?.financials?.grossRevenue || 0) / totalOrdersCount
    : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Zap className="animate-pulse text-emerald-500" size={36} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 text-left animate-in fade-in duration-500">

      {/* ── HEADER ─────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
              Painel <span className="text-emerald-600">Operacional</span>
            </h1>
            {isFetching && <RefreshCcw size={13} className="animate-spin text-slate-300" />}
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Métricas e fluxo de pedidos em tempo real
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1.5 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Integridade do Sistema</span>
          <SystemHealthIndicator />
        </div>
      </div>

      {/* ── MÉTRICAS ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Receita */}
        <MetricCard
          onClick={() => navigate("/admin/analytics")}
          label="Receita Bruta"
          value={formatCurrency(stats?.financials?.grossRevenue || 0)}
          sub="Hoje"
          icon={<Wallet size={18} />}
          accent="emerald"
          highlight
        />

        {/* Pedidos */}
        <MetricCard
          onClick={() => navigate("/admin/orders")}
          label="Pedidos"
          value={totalOrdersCount}
          sub="Tempo Real"
          icon={<ShoppingCart size={18} />}
          accent="slate"
          live
        />

        {/* Ticket Médio */}
        <MetricCard
          label="Ticket Médio"
          value={formatCurrency(averageTicket)}
          sub="Por Pedido"
          icon={<TrendingUp size={18} />}
          accent="blue"
        />

        {/* Novos Clientes */}
        <MetricCard
          onClick={() => navigate("/admin/users")}
          label="Novos Clientes"
          value={stats?.newCustomers ?? 0}
          sub="Conversão"
          icon={<Users size={18} />}
          accent="purple"
        />
      </div>

      {/* ── FEED DE PEDIDOS ────────────────────── */}
      <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Clock size={15} className="text-emerald-600" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
              Fluxo de Pedidos
            </h3>
          </div>
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Ver Todos <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Lista */}
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 opacity-40">
            <PackageSearch size={28} className="text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aguardando pedidos...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order) => {
              const status = STATUS_CONFIG[order.status || ""] || { label: order.status || "Novo", cls: "bg-slate-100 text-slate-600" };
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full flex items-center justify-between px-8 py-4 hover:bg-slate-50/70 transition-colors text-left group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <ChefHat size={15} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase text-slate-900 truncate">
                        {order.customerName || "Cliente Gourmet"}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        #{String(order.id).slice(-6).toUpperCase()} · {order.createdAt
                          ? new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                          : "--:--"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <Badge className={cn("text-[8px] uppercase tracking-widest font-black border-none", status.cls)}>
                      {status.label}
                    </Badge>
                    <span className="text-sm font-black italic text-emerald-600 min-w-[72px] text-right">
                      {formatCurrency(Number(order.total || 0))}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ATALHOS RÁPIDOS ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <QuickAction onClick={() => navigate("/admin/pdv")}      icon={<ShoppingCart size={22} />} label="Novo Pedido PDV" desc="Caixa e comandas"    color="emerald" />
        <QuickAction onClick={() => navigate("/admin/dishes")}   icon={<Utensils size={22} />}     label="Cardápio"       desc="Pratos e ingredientes" color="violet" />
        <QuickAction onClick={() => navigate("/admin/labels/editor/production")} icon={<Printer size={22} />} label="Produção" desc="Etiquetas Zebra" color="blue" />
        <QuickAction onClick={() => navigate("/admin/shipping")}  icon={<Truck size={22} />}       label="Logística"      desc="Fretes e perímetros"  color="rose" />
        <QuickAction onClick={() => navigate("/admin/coupons")}   icon={<Megaphone size={22} />}   label="Cupons Ativos"  desc="Cupons de desconto"   color="amber" />
        <QuickAction onClick={() => navigate("/admin/abandoned-carts")} icon={<PackageSearch size={22} />} label="Carrinhos" desc="Recuperar perdidos" color="slate" />
      </div>

      <OrderDetailsDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

// ── METRIC CARD ──────────────────────────────────────────────

type Accent = "emerald" | "blue" | "purple" | "slate" | "amber";

const ACCENT: Record<Accent, { icon: string; value: string; badge: string; ring: string }> = {
  emerald: { icon: "bg-emerald-50 text-emerald-600", value: "text-emerald-600", badge: "bg-emerald-50 text-emerald-600", ring: "hover:ring-emerald-200" },
  blue:    { icon: "bg-blue-50 text-blue-600",       value: "text-slate-900",   badge: "bg-blue-50 text-blue-600",       ring: "hover:ring-blue-200" },
  purple:  { icon: "bg-violet-50 text-violet-600",   value: "text-slate-900",   badge: "bg-violet-50 text-violet-600",   ring: "hover:ring-violet-200" },
  slate:   { icon: "bg-slate-100 text-slate-600",    value: "text-slate-900",   badge: "bg-slate-100 text-slate-500",    ring: "hover:ring-slate-200" },
  amber:   { icon: "bg-amber-50 text-amber-600",     value: "text-slate-900",   badge: "bg-amber-50 text-amber-600",     ring: "hover:ring-amber-200" },
};

function MetricCard({
  label, value, sub, icon, accent = "slate", highlight, live, onClick,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; accent?: Accent;
  highlight?: boolean; live?: boolean; onClick?: () => void;
}) {
  const a = ACCENT[accent];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200",
        onClick && `cursor-pointer hover:shadow-lg hover:ring-2 ${a.ring}`,
        highlight && "bg-emerald-600 border-emerald-600"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-6">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          highlight ? "bg-white/20 text-white" : a.icon
        )}>
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {live && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          <span className={cn(
            "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
            highlight ? "bg-white/20 text-white" : a.badge
          )}>
            {live ? "Live" : sub}
          </span>
        </div>
      </div>

      {/* Value */}
      <p className={cn(
        "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
        highlight ? "text-white/70" : "text-slate-400"
      )}>
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h4 className={cn(
          "text-2xl font-black italic tracking-tighter leading-none",
          highlight ? "text-white" : a.value
        )}>
          {value}
        </h4>
        {onClick && (
          <ArrowUpRight size={16} className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            highlight ? "text-white/70" : "text-slate-400"
          )} />
        )}
      </div>
    </Tag>
  );
}

// ── QUICK ACTION ─────────────────────────────────────────────

const QUICK_COLORS: Record<string, { bg: string; hover: string; text: string }> = {
  emerald: { bg: "bg-emerald-50",  hover: "group-hover:bg-emerald-600 group-hover:text-white", text: "text-emerald-600" },
  violet:  { bg: "bg-violet-50",   hover: "group-hover:bg-violet-600 group-hover:text-white",  text: "text-violet-600" },
  amber:   { bg: "bg-amber-50",    hover: "group-hover:bg-amber-500 group-hover:text-white",   text: "text-amber-600" },
  slate:   { bg: "bg-slate-50",    hover: "group-hover:bg-slate-900 group-hover:text-white",   text: "text-slate-600" },
  blue:    { bg: "bg-blue-50",     hover: "group-hover:bg-blue-600 group-hover:text-white",    text: "text-blue-600" },
  rose:    { bg: "bg-rose-50",     hover: "group-hover:bg-rose-600 group-hover:text-white",    text: "text-rose-600" },
};

function QuickAction({ onClick, icon, label, desc, color = "slate" }: {
  onClick: () => void; icon: React.ReactNode;
  label: string; desc: string; color?: string;
}) {
  const c = QUICK_COLORS[color] || QUICK_COLORS.slate;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-200 active:scale-[0.98]"
    >
      <div className={cn(
        "h-12 w-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-200",
        c.bg, c.text, c.hover
      )}>
        {icon}
      </div>
      <p className="text-[12px] font-black uppercase italic tracking-tight text-slate-900 leading-none">{label}</p>
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">{desc}</p>
    </button>
  );
}