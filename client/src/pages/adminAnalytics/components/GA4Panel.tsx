import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Card, Text, Metric, AreaChart, BarList, DonutChart } from "@tremor/react";
import {
  Users, Eye, MousePointerClick, Clock,
  WifiOff, Loader2, RefreshCcw, Radio, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_LABELS: Record<string, string> = {
  "/":                 "Home",
  "/produtos":         "Cardápio",
  "/pacotes":          "Pacotes",
  "/carrinho":         "Carrinho",
  "/finalizar-pedido": "Checkout",
  "/sucesso":          "Pedido Confirmado",
  "/login":            "Login",
  "/perfil":           "Perfil",
  "/meu-plano":        "Meu Plano",
};

function friendlyPage(path: string): string {
  return PAGE_LABELS[path] || path;
}

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface ConnStatus {
  connected: boolean;
  apiWorking?: boolean;
  measurementId?: string | null;
  measurementIdValid?: boolean;
  propertyId?: string | null;
}

function StatusBar({ conn }: { conn: ConnStatus | undefined }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Measurement ID */}
      <div className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3",
        conn?.measurementIdValid
          ? "border-emerald-100 bg-emerald-50"
          : "border-amber-100 bg-amber-50"
      )}>
        <div className={cn(
          "h-2 w-2 rounded-full shrink-0",
          conn?.measurementIdValid ? "bg-emerald-500" : "bg-amber-400"
        )} />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Measurement ID</p>
          <p className={cn(
            "text-[11px] font-black truncate",
            conn?.measurementIdValid ? "text-emerald-700" : "text-amber-700"
          )}>
            {conn?.measurementId || "Não configurado"}
          </p>
        </div>
        {conn?.measurementIdValid
          ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          : <WifiOff size={14} className="text-amber-500 shrink-0" />
        }
      </div>

      {/* Data API */}
      <div className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3",
        conn?.apiWorking
          ? "border-emerald-100 bg-emerald-50"
          : "border-rose-100 bg-rose-50"
      )}>
        <div className={cn(
          "h-2 w-2 rounded-full shrink-0",
          conn?.apiWorking ? "bg-emerald-500 animate-pulse" : "bg-rose-400"
        )} />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Data API</p>
          <p className={cn(
            "text-[11px] font-black",
            conn?.apiWorking ? "text-emerald-700" : "text-rose-700"
          )}>
            {conn?.apiWorking ? "Conectada" : "Não conectada"}
          </p>
        </div>
        {conn?.apiWorking
          ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          : <WifiOff size={14} className="text-rose-500 shrink-0" />
        }
      </div>
    </div>
  );
}

export function GA4Panel() {
  const [days, setDays] = useState(30);

  const { data: conn } = trpc.admin.ga4.checkConnection.useQuery(undefined, {
    staleTime: 60_000,
  });

  const { data: realtime, refetch: refetchRt, isFetching: fetchingRt } =
    trpc.admin.ga4.getActiveUsers.useQuery(undefined, {
      refetchInterval: 30_000,
      enabled: !!conn?.connected,
    });

  const { data: summary, isLoading: loadingSummary } =
    trpc.admin.ga4.getSummary.useQuery({ days }, { enabled: !!conn?.connected });

  const { data: topPages } =
    trpc.admin.ga4.getTopPages.useQuery({ days }, { enabled: !!conn?.connected });

  const { data: traffic } =
    trpc.admin.ga4.getTrafficSources.useQuery({ days }, { enabled: !!conn?.connected });

  const { data: timeline } =
    trpc.admin.ga4.getSessionsOverTime.useQuery({ days }, { enabled: !!conn?.connected });

  if (!conn?.connected) {
    return (
      <Card className="rounded-[2rem] border border-slate-200 bg-white p-8 text-left space-y-5">
        <div className="flex items-center gap-3 text-rose-600">
          <WifiOff size={20} />
          <span className="text-sm font-black uppercase tracking-widest">GA4 não configurado</span>
        </div>
        <StatusBar conn={conn} />
        <p className="text-sm text-slate-500 leading-relaxed">
          Adicione o <strong>Service Account JSON</strong> e o <strong>GA4 Property ID</strong> em{" "}
          <strong>Ajustes → IA & Automação</strong> para ativar este painel.
        </p>
      </Card>
    );
  }

  const kpis = [
    { label: "Sessões",       value: summary?.sessions?.toLocaleString("pt-BR") ?? "—",                       icon: MousePointerClick, color: "text-blue-600",    bg: "bg-blue-50" },
    { label: "Usuários",      value: summary?.users?.toLocaleString("pt-BR") ?? "—",                          icon: Users,             color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pageviews",     value: summary?.pageviews?.toLocaleString("pt-BR") ?? "—",                      icon: Eye,               color: "text-violet-600",  bg: "bg-violet-50" },
    { label: "Taxa de Saída", value: summary?.bounceRate ? `${summary.bounceRate}%` : "—",                    icon: WifiOff,           color: "text-amber-600",   bg: "bg-amber-50" },
    { label: "Tempo médio",   value: summary?.avgSessionDuration ? fmtDuration(summary.avgSessionDuration) : "—", icon: Clock,             color: "text-rose-600",    bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header + período */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
            <Radio size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Google Analytics 4</p>
            <p className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Painel de Audiência</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                days === d ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar conn={conn} />

      {/* Tempo real */}
      <Card className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Ao vivo agora</p>
              <p className="text-3xl font-black text-emerald-900 leading-none">
                {realtime?.total ?? "—"}
                <span className="text-sm font-bold text-emerald-600 ml-2">usuários ativos</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetchRt()}
            disabled={fetchingRt}
            className="rounded-xl border-emerald-200 text-[10px] font-black uppercase tracking-wider"
          >
            {fetchingRt ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
          </Button>
        </div>

        {realtime?.pages && realtime.pages.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {/* ✅ Removida a tipagem explícita do parâmetro e tratada na conversão */}
            {realtime.pages.slice(0, 6).map((p) => (
              <span key={p.page} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 text-[10px] font-black text-emerald-800 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {friendlyPage(p.page)} ({Number(p.users as string | number) || 0})
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* KPIs */}
      {loadingSummary ? (
        <div className="flex items-center gap-2 text-slate-400 py-4">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">Carregando métricas...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="rounded-[1.5rem] border-slate-100 shadow-sm p-5">
              <div className={cn("p-2 rounded-xl w-fit mb-3", kpi.bg)}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
              <Metric className="text-xl font-black text-slate-900">{kpi.value}</Metric>
              <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{kpi.label}</Text>
            </Card>
          ))}
        </div>
      )}

      {/* Gráfico de sessões */}
      {timeline && timeline.length > 0 && (
        <Card className="rounded-[2rem] border-slate-100 shadow-sm p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
            Sessões nos últimos {days} dias
          </p>
          <AreaChart
            data={timeline}
            index="date"
            categories={["sessions", "users"]}
            colors={["blue", "emerald"]}
            valueFormatter={(v: number) => v.toLocaleString("pt-BR")}
            showLegend
            showGridLines={false}
            className="h-52"
          />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top páginas */}
        {topPages && topPages.length > 0 && (
          <Card className="rounded-[2rem] border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Páginas mais visitadas</p>
            {/* ✅ Removida a tipagem explícita do parâmetro e tratada na conversão */}
            <BarList
              data={topPages.map((p) => ({
                name: friendlyPage(p.page),
                value: Number(p.views as string | number) || 0,
              }))}
              color="blue"
              valueFormatter={(v: number) => v.toLocaleString("pt-BR")}
            />
          </Card>
        )}

        {/* Origens de tráfego */}
        {traffic && traffic.length > 0 && (
          <Card className="rounded-[2rem] border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Origem do tráfego</p>
            {/* ✅ Removida a tipagem explícita do parâmetro e tratada na conversão */}
            <DonutChart
              data={traffic.map((t) => ({ name: t.channel, value: Number(t.sessions as string | number) || 0 }))}
              category="value"
              index="name"
              colors={["blue", "emerald", "violet", "amber", "rose", "cyan", "slate", "orange"]}
              valueFormatter={(v: number) => `${v.toLocaleString("pt-BR")} sessões`}
              className="h-40"
            />
            <div className="mt-4 space-y-1">
              {/* ✅ Removida a tipagem explícita do parâmetro e tratada na conversão */}
              {traffic.map((t) => (
                <div key={t.channel} className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>{t.channel}</span>
                  <span className="font-black">{Number(t.sessions as string | number).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}