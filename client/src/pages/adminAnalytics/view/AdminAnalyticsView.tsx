// client/src/pages/adminAnalytics/view/AdminAnalyticsView.tsx
import React, { useState } from "react";
import { Loader2, RefreshCw, Monitor, Activity, TrendingUp, ShoppingCart, Users, Tag } from "lucide-react";
import { useAdminAnalytics } from "../logic/useAdminAnalytics";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";

import { OverviewTab } from "./tab/OverviewTab";
import { ProductsTab } from "./tab/ProductsTab";
import { MarketingTab } from "./tab/MarketingTab";
import { FinanceTab } from "./tab/FinanceTab";
import { HealthTab } from "./tab/HealthTab";
import { EmptyState } from "../components/EmptyState";
import { VipTab } from "./tab/VipTab";
import { CampaignsTab } from "./tab/CampaignsTab";
import { BirthdaysTab } from "./tab/BirthdaysTab";

// ── Tipos exportados para os tabs usarem ──────────────────────
export type MetricKey = "revenue" | "orders" | "ticket" | "customers" | "discounts";

export interface AnalyticsFilters {
  period: any;
  metric: MetricKey;
  compare: boolean;
}

// ── Config das métricas ───────────────────────────────────────
const METRICS: { key: MetricKey; label: string; icon: React.ReactNode }[] = [
  { key: "revenue",   label: "Faturamento",   icon: <TrendingUp size={13} /> },
  { key: "orders",    label: "Pedidos",        icon: <ShoppingCart size={13} /> },
  { key: "ticket",    label: "Ticket Médio",   icon: <Tag size={13} /> },
  { key: "customers", label: "Clientes",       icon: <Users size={13} /> },
];

// ── Tabs principais ───────────────────────────────────────────
const TABS = ["Geral", "Financeiro", "Produtos", "VIP", "Campanhas", "Aniversários"];

export default function AdminAnalyticsView() {
  const {
    stats, isLoading, period, setPeriod,
    syncHistory, isSyncing,
  } = useAdminAnalytics();

  const [activeTab, setActiveTab] = useState(0);
  const [metric, setMetric] = useState<MetricKey>("revenue");
  const [compare, setCompare] = useState(false);

  const { data: health } = trpc.admin.health.checkStatus.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const isSystemCritical = health?.status === "critical";

  const filters: AnalyticsFilters = { period, metric, compare };

  const presets = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "90d", label: "90 dias" },
    { key: "current_month", label: "Mês Atual" },
    { key: "custom", label: "Personalizado" },
  ];

  if (isLoading && !stats) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={36} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando BI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 animate-in fade-in duration-500 text-left pb-12">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
              Business <span className="text-emerald-600">Intelligence</span>
            </h1>
            {isSystemCritical && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1.5 w-fit">
                <Activity size={11} className="text-rose-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">
                  Sistema em modo crítico
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => syncHistory()}
            disabled={isSyncing}
            className="flex items-center gap-2 h-10 px-5 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {isSyncing
              ? <Loader2 size={13} className="animate-spin" />
              : <RefreshCw size={13} />}
            {isSyncing ? "Sincronizando..." : "Atualizar"}
          </button>
        </div>

        {/* ── TABS DE NAVEGAÇÃO ────────────────────────────── */}
        <div className="flex gap-1 border-b border-slate-100">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={cn(
                "relative px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                activeTab === i
                  ? "text-emerald-600"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab}
              {activeTab === i && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── BARRA DE FILTROS ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-b border-slate-50 mb-8">

        {/* Seletor de Período */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2">Período</span>
          <div className="flex flex-wrap items-center gap-1">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod({ preset: p.key as any, startDate: period.startDate, endDate: period.endDate })}
                className={cn(
                  "h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  period.preset === p.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period.preset === "custom" && (
            <div className="flex items-center gap-2 sm:ml-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <input
                type="date"
                value={period.startDate || ""}
                onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
                className="h-8 px-2 rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">até</span>
              <input
                type="date"
                value={period.endDate || ""}
                onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
                className="h-8 px-2 rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Seletor de Métrica + Toggle de Comparação */}
        {activeTab === 0 && (
          <div className="flex items-center gap-3">
            {/* Métrica */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={cn(
                    "flex items-center gap-1.5 h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                    metric === m.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* Toggle Comparação */}
            <button
              onClick={() => setCompare(!compare)}
              className={cn(
                "h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                compare
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              vs Período Anterior
            </button>
          </div>
        )}
      </div>

      {/* ── CONTEÚDO ─────────────────────────────────────── */}
      <div>
        {activeTab === 0 && (stats ? <OverviewTab stats={stats} filters={filters} /> : <EmptyState syncHistory={syncHistory} isSyncing={isSyncing} />)}
        {activeTab === 1 && (stats ? <FinanceTab stats={stats} /> : <EmptyState syncHistory={syncHistory} isSyncing={isSyncing} />)}
        {activeTab === 2 && (stats ? <ProductsTab stats={stats} /> : <EmptyState syncHistory={syncHistory} isSyncing={isSyncing} />)}
        {activeTab === 3 && <VipTab />}
        {activeTab === 4 && <CampaignsTab />}
        {activeTab === 5 && <BirthdaysTab />}
      </div>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-10 mt-4 border-t border-slate-100 opacity-20">
        <Monitor size={13} className="text-slate-400" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Terminal de BI Gourmet Saudável © 2026
        </span>
      </div>
    </div>
  );
}