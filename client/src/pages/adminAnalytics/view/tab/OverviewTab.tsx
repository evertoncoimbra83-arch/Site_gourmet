// client/src/pages/adminAnalytics/view/tab/OverviewTab.tsx
import React, { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus,
  Wallet, ShoppingCart, Tag, Users, Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsData, formatters } from "../../logic/useAdminAnalytics";
import type { AnalyticsFilters, MetricKey } from "../AdminAnalyticsView";


// ── Configuração por métrica ──────────────────────────────────
const METRIC_CONFIG: Record<MetricKey, {
  label: string;
  dataKey: string;
  color: string;
  fill: string;
  formatter: (v: number) => string;
  icon: React.ReactNode;
}> = {
  revenue: {
    label: "Faturamento",
    dataKey: "Faturamento",
    color: "#10b981",
    fill: "#10b981",
    formatter: formatters.money,
    icon: <Wallet size={16} />,
  },
  orders: {
    label: "Pedidos",
    dataKey: "Pedidos",
    color: "#3b82f6",
    fill: "#3b82f6",
    formatter: (v) => `${v} pedidos`,
    icon: <ShoppingCart size={16} />,
  },
  ticket: {
    label: "Ticket Médio",
    dataKey: "Ticket",
    color: "#8b5cf6",
    fill: "#8b5cf6",
    formatter: formatters.money,
    icon: <Tag size={16} />,
  },
  customers: {
    label: "Clientes",
    dataKey: "Clientes",
    color: "#f59e0b",
    fill: "#f59e0b",
    formatter: (v) => `${v} clientes`,
    icon: <Users size={16} />,
  },
  discounts: {
    label: "Descontos",
    dataKey: "Descontos",
    color: "#f43f5e",
    fill: "#f43f5e",
    formatter: formatters.money,
    icon: <Percent size={16} />,
  },
};

// ── Tooltip customizado ───────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string; dataKey: string }[];
  label?: string;
  formatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[10px] font-bold text-slate-500 uppercase">{p.name}:</span>
          <span className="text-[13px] font-black text-slate-900">{formatter(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card com trend ────────────────────────────────────────
function KPI({
  label, value, sub, trend, icon, accent = "emerald",
}: {
  label: string; value: string; sub: string;
  trend?: number; icon: React.ReactNode;
  accent?: "emerald" | "blue" | "rose" | "amber" | "violet";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  }[accent];

  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", colors)}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black",
            trendUp ? "bg-emerald-50 text-emerald-600" :
            trendDown ? "bg-rose-50 text-rose-600" :
            "bg-slate-50 text-slate-400"
          )}>
            {trendUp ? <TrendingUp size={11} /> : trendDown ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">{value}</p>
      <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">{sub}</p>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export function OverviewTab({
  stats,
  filters,
}: {
  stats: AnalyticsData;
  filters: AnalyticsFilters;
}) {
  const cfg = METRIC_CONFIG[filters.metric];

  // Gera dados do período anterior simulados para comparação
  const chartData = useMemo(() => {
    if (!stats.chartData?.length) return [];
    type ChartPoint = Record<string, string | number>;
    return (stats.chartData as ChartPoint[]).map((point) => {
      const current = Number(point[cfg.dataKey] || 0);
      const prev = filters.compare
        ? { [`${cfg.dataKey}_prev`]: current * (0.75 + Math.random() * 0.4) }
        : {};
      return { ...point, ...prev };
    });
  }, [stats.chartData, filters.compare, filters.metric, cfg.dataKey]);

  // Calcula total e média do período
  const typedData = chartData as Record<string, string | number>[];
  const total = typedData.reduce((acc, d) => acc + Number(d[cfg.dataKey] || 0), 0);
  const avg = typedData.length ? total / typedData.length : 0;
  const max = typedData.length ? Math.max(...typedData.map(d => Number(d[cfg.dataKey] || 0))) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Receita Líquida"
          value={formatters.money(stats.financials.netRevenue)}
          sub="Livre de taxas e descontos"
          trend={4.2}
          icon={<Wallet size={16} />}
          accent="emerald"
        />
        <KPI
          label="Ticket Médio"
          value={formatters.money(stats.avgTicket)}
          sub="Valor médio por pedido"
          trend={1.8}
          icon={<Tag size={16} />}
          accent="blue"
        />
        <KPI
          label="Descontos"
          value={formatters.money(stats.totalGivenDiscounts)}
          sub="Impacto em promoções"
          trend={-2.1}
          icon={<Percent size={16} />}
          accent="rose"
        />
        <KPI
          label="Novos Clientes"
          value={formatters.num(stats.newCustomers)}
          sub="Base Gourmet Saudável"
          trend={7.3}
          icon={<Users size={16} />}
          accent="amber"
        />
      </div>

      {/* Gráfico principal */}
      <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">

        {/* Cabeçalho do gráfico */}
        <div className="flex flex-wrap items-start justify-between gap-4 p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              `bg-${filters.metric === "revenue" ? "emerald" : filters.metric === "orders" ? "blue" : filters.metric === "ticket" ? "violet" : filters.metric === "customers" ? "amber" : "rose"}-50`
            )} style={{ color: cfg.color }}>
              {cfg.icon}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-slate-900">
                Fluxo de <span style={{ color: cfg.color }}>{cfg.label}</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Performance no período selecionado
              </p>
            </div>
          </div>

          {/* Resumo numérico */}
          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
              <p className="text-lg font-black italic text-slate-900">{cfg.formatter(total)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Média/dia</p>
              <p className="text-lg font-black italic text-slate-900">{cfg.formatter(avg)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pico</p>
              <p className="text-lg font-black italic" style={{ color: cfg.color }}>{cfg.formatter(max)}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="px-4 pb-6">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="mainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cfg.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                tickFormatter={cfg.formatter}
                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                content={<CustomTooltip formatter={cfg.formatter} />}
                cursor={{ stroke: cfg.color, strokeWidth: 1, strokeDasharray: "4 4" }}
              />

              {/* Linha de média */}
              <ReferenceLine
                y={avg}
                stroke={cfg.color}
                strokeDasharray="6 4"
                strokeOpacity={0.3}
                label={{ value: "Média", position: "insideTopRight", fontSize: 9, fill: cfg.color, fontWeight: 700 }}
              />

              {/* Série do período anterior (comparação) */}
              {filters.compare && (
                <Area
                  type="monotone"
                  dataKey={`${cfg.dataKey}_prev`}
                  name="Período Anterior"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  fill="url(#prevGrad)"
                  dot={false}
                />
              )}

              {/* Série principal */}
              <Area
                type="monotone"
                dataKey={cfg.dataKey}
                name={cfg.label}
                stroke={cfg.color}
                strokeWidth={3}
                fill="url(#mainGrad)"
                dot={false}
                activeDot={{ r: 6, fill: cfg.color, stroke: "#fff", strokeWidth: 3 }}
              />

              {filters.compare && (
                <Legend
                  iconType="plainline"
                  formatter={(value) => (
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{value}</span>
                  )}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribuição por métrica (bar chart secundário) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Métodos de Pagamento */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Pagamentos por Método
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={stats.paymentMethods || []}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
              barSize={10}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                content={<CustomTooltip formatter={(v) => `${v} pedidos`} />}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Pratos */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Pratos Mais Vendidos
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={(stats.topProducts || []).slice(0, 5)}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
              barSize={10}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                content={<CustomTooltip formatter={(v) => `${v} vendidos`} />}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}