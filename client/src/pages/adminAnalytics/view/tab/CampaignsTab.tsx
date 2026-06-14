import React from "react";
import { trpc } from "@/_core/trpc";
import { Loader2, AlertTriangle, TrendingUp, Tag, Users, Calendar, BarChart2, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS: Record<string, string> = {
  REATIVAÇÃO_VIP: "#ffd700", // Dourado
  BLACK_FRIDAY: "#1e293b",   // Slate-800
  ANIVERSARIO: "#ec4899",    // Pink-500
  CLIENTE_NOVO: "#3b82f6",   // Blue-500
  SAZONAL: "#f59e0b",        // Amber-500
};

const DEFAULT_COLOR = "#10b981"; // Emerald-500

const formatters = {
  money: (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val),
  num: (val: number) => new Intl.NumberFormat("pt-BR").format(val),
  percent: (val: number) => `${val.toFixed(1)}%`,
};

export function CampaignsTab() {
  const { data: summary, isLoading: isLoadingSummary, error: summaryError } = trpc.admin.campaigns.summary.useQuery(undefined, {
    refetchOnWindowFocus: false
  });

  const { data: reactivation, isLoading: isLoadingReactivation, error: reactivationError } = trpc.admin.campaigns.reactivation.useQuery(undefined, {
    refetchOnWindowFocus: false
  });

  if (isLoadingSummary || isLoadingReactivation) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={28} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Carregando dados de campanhas...
        </p>
      </div>
    );
  }

  if (summaryError || reactivationError || !summary || !reactivation) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-2 text-rose-500">
        <AlertTriangle size={28} />
        <p className="text-[10px] font-black uppercase tracking-widest">
          Erro ao carregar dados de campanhas e ROI.
        </p>
      </div>
    );
  }

  const { campanhas, totals } = summary;
  const { cuponsGerados, cuponsUtilizados, clientesRetornaram, receitaRecuperada, list: reactivationList } = reactivation;

  // Filter campaigns with data for charts
  const chartData = campanhas.map(c => ({
    name: c.name.replace("_", " "),
    value: c.revenueGenerated,
    conversion: c.conversionRate,
    color: COLORS[c.name] || DEFAULT_COLOR
  }));

  // Top campaigns sorted by revenue desc
  const topCampanhas = [...campanhas]
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* ── METRIC CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Campanhas Ativas */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Campanhas Ativas</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.num(totals.activeCampaigns)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar size={18} />
          </div>
        </div>

        {/* Card 2: Receita Recuperada (VIP) */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Receita Recuperada (VIP)</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.money(receitaRecuperada)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign size={18} />
          </div>
        </div>

        {/* Card 3: Clientes Reativados */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Clientes Reativados</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.num(clientesRetornaram)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users size={18} />
          </div>
        </div>

        {/* Card 4: Taxa de Conversão */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Conversão Geral</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.percent(totals.conversionRate)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingUp size={18} />
          </div>
        </div>

      </div>

      {/* ── CHARTS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Receita por Campanha */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-2">
            <BarChart2 size={14} className="text-emerald-500" />
            Receita Gerada por Campanha
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={25}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip formatter={(v: any) => formatters.money(v)} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversão por Campanha */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-500" />
            Taxa de Conversão por Campanha (%)
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={25}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any) => formatters.percent(v)} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="conversion" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── TABELA 1: LISTA GERAL DE CAMPANHAS ──────────────── */}
      <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2">
          <Tag size={14} className="text-slate-900" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Campanhas Analisadas</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Origem / Campanha</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Cupons Gerados</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Utilizações</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Conversão</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Faturamento</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Ticket Médio</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">ROI Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {campanhas.map((camp: any) => (
                <tr key={camp.name} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4 flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[camp.name] || DEFAULT_COLOR }} />
                    {camp.name.replace("_", " ")}
                  </td>
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{formatters.num(camp.couponsGenerated)}</td>
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{formatters.num(camp.couponsUsed)}</td>
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{formatters.percent(camp.conversionRate)}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-900">{formatters.money(camp.revenueGenerated)}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-900">{formatters.money(camp.avgTicket)}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-emerald-600">{formatters.money(camp.roi)} / uso</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SEÇÃO DE TOP CAMPANHAS E CUPONS DE RETORNO ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabela 2: Top Campanhas */}
        <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm flex flex-col lg:col-span-1">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2">
            <TrendingUp size={14} className="text-amber-500" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Ranking por Receita</h4>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Campanha</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topCampanhas.map((item: any, idx: number) => (
                  <tr key={item.name} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-bold">#{idx + 1}</span>
                        {item.name.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[11px] font-black text-slate-900">{formatters.money(item.revenueGenerated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela 3: Cupons de Retorno Usados (Reativação VIP) */}
        <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm flex flex-col lg:col-span-2">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2">
            <Users size={14} className="text-purple-500" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Cupons de Retorno Utilizados (VIP)</h4>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Código</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Data de Uso</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Desconto</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Total Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reactivationList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nenhum cupom de reativação utilizado ainda.
                    </td>
                  </tr>
                ) : (
                  reactivationList.map((item: any, idx: number) => (
                    <tr key={`${item.code}-${idx}`} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black bg-purple-50 text-purple-700 select-all">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide">{item.clientName}</div>
                        <div className="text-[9px] font-bold text-slate-400">{item.clientEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500">
                        {item.usedAt ? new Date(item.usedAt).toLocaleDateString("pt-BR") : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-rose-500">{formatters.money(item.discountAmount)}</td>
                      <td className="px-6 py-4 text-right text-[11px] font-black text-slate-900">{formatters.money(item.orderTotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
