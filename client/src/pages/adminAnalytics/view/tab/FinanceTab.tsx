// client/src/pages/adminAnalytics/view/tab/FinanceTab.tsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CreditCard, Wallet } from "lucide-react";
import { AnalyticsData, formatters } from "../../logic/useAdminAnalytics";

const COLORS = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#f43f5e","#06b6d4","#84cc16","#ec4899"];

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-black text-slate-900">{formatters.money(payload[0].value)}</p>
    </div>
  );
}

export function FinanceTab({ stats }: { stats: AnalyticsData }) {
  const data = (stats.paymentMethods || []).map((p, i) => ({
    name: p.name,
    value: Number(p.value || 0),
    color: COLORS[i % COLORS.length],
  }));

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
            <Wallet size={18} />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Recebido</p>
          <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.money(total)}</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
            <CreditCard size={18} />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Métodos Ativos</p>
          <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.num(data.length)}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-2">
          <CreditCard size={14} className="text-blue-500" />
          Distribuição por Meio de Pagamento
        </h4>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" barSize={12} margin={{ left: 0, right: 60 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} label={{
              position: "right",
              formatter: (v: any) => formatters.money(Number(v || 0)),
              fontSize: 10,
              fontWeight: 700,
              fill: "#64748b",
            }}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lista detalhada */}
      <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-50">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Detalhamento</h4>
        </div>
        <div className="divide-y divide-slate-50">
          {data.map((item, i) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-4 px-8 py-4">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="flex-1 text-[11px] font-bold text-slate-700 uppercase tracking-wide">{item.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 w-12 text-right">{formatters.percent(pct)}</span>
                  <span className="text-[12px] font-black text-slate-900 w-24 text-right">{formatters.money(item.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}