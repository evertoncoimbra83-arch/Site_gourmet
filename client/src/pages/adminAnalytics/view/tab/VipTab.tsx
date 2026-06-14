import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Loader2, Users, DollarSign, Tag, TrendingUp, Crown, Award, Clock, ArrowUpRight, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { appToast } from "@/lib/app-toast";

const COLORS = ["#cd7f32", "#c0c0c0", "#ffd700", "#e5e4e2"]; // Bronze, Prata, Ouro, Diamante colors

const formatters = {
  money: (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val),
  num: (val: number) => new Intl.NumberFormat("pt-BR").format(val),
  percent: (val: number) => `${val.toFixed(1)}%`,
};

export function VipTab() {
  const { data: summary, isLoading, error } = trpc.admin.vip.summary.useQuery(undefined, {
    refetchOnWindowFocus: false
  });

  const [createdCoupon, setCreatedCoupon] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [generatingForUserId, setGeneratingForUserId] = useState<string | null>(null);

  const createReactivationMutation = trpc.admin.vip.createReactivationCoupon.useMutation({
    onSuccess: (data) => {
      setCreatedCoupon(data);
      setGeneratingForUserId(null);
    },
    onError: (err) => {
      appToast.error(err.message || "Erro ao gerar cupom de reativação.");
      setGeneratingForUserId(null);
    }
  });

  const handleGenerate = (userId: string) => {
    setGeneratingForUserId(userId);
    createReactivationMutation.mutate({ userId });
  };

  const handleCopy = () => {
    if (!createdCoupon) return;
    navigator.clipboard.writeText(createdCoupon.messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={28} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Carregando dados VIP...
        </p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-2 text-rose-500">
        <AlertTriangle size={28} />
        <p className="text-[10px] font-black uppercase tracking-widest">
          Erro ao carregar dados VIP.
        </p>
      </div>
    );
  }

  const { distribution, topClients, closestToEvolve, vipsAtRisk, totalRevenue, totalClients, totalOrders } = summary;

  // Average Ticket VIP
  const avgTicketVip = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Chart data
  const chartData = [
    { name: "Bronze", value: distribution.bronze.totalSpent, count: distribution.bronze.count, color: COLORS[0] },
    { name: "Prata", value: distribution.prata.totalSpent, count: distribution.prata.count, color: COLORS[1] },
    { name: "Ouro", value: distribution.ouro.totalSpent, count: distribution.ouro.count, color: COLORS[2] },
    { name: "Diamante", value: distribution.diamante.totalSpent, count: distribution.diamante.count, color: COLORS[3] },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* ── METRIC CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Clientes VIP */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Clientes VIP</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.num(totalClients)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={18} />
          </div>
        </div>

        {/* Card 2: Receita VIP */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Receita VIP</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.money(totalRevenue)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign size={18} />
          </div>
        </div>

        {/* Card 3: Ticket Médio VIP */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Ticket Médio VIP</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.money(avgTicketVip)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Tag size={18} />
          </div>
        </div>

        {/* Card 4: Participação na Receita */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Participação Receita</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">100,0%</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingUp size={18} />
          </div>
        </div>

      </div>

      {/* ── CHARTS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Receita por Faixa */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-2">
            <Crown size={14} className="text-amber-500" />
            Receita por Faixa VIP (LTV)
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

        {/* Clientes por Faixa */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-2">
            <Users size={14} className="text-blue-500" />
            Clientes por Faixa VIP
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={25}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => formatters.num(v)} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── TABELA 1: DISTRIBUIÇÃO POR FAIXA ──────────────── */}
      <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2">
          <Crown size={14} className="text-slate-900" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Distribuição por Faixa</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Faixa</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Clientes</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Faturamento</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Participação</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Pedidos</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.values(distribution).map((tier: any, i: number) => (
                <tr key={tier.key} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4 flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    {tier.name}
                  </td>
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{formatters.num(tier.count)}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-900">{formatters.money(tier.totalSpent)}</td>
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{formatters.percent(tier.pctRevenue)}</td>
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{formatters.num(tier.totalOrders)}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-900">{formatters.money(tier.avgTicket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABELA 2: TOP 15 CLIENTES ─────────────────────── */}
      <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2">
          <Award size={14} className="text-amber-500" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Top 15 Melhores Clientes (LTV)</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">E-mail</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Pedidos</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">LTV</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Ticket Médio</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Faixa VIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topClients.map((client: any) => (
                <tr key={client.userId} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4 text-[11px] font-black text-slate-800 uppercase tracking-wide">{client.name}</td>
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{client.email}</td>
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{formatters.num(client.totalOrders)}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-900">{formatters.money(client.totalSpent)}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-900">{formatters.money(client.avgTicket)}</td>
                  <td className="px-8 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-800">
                      {client.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABELAS ADICIONAIS: PRÓXIMOS DE EVOLUIR & VIPS EM RISCO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tabela 3: Próximos de Evoluir */}
        <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm flex flex-col">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2">
            <ArrowUpRight size={14} className="text-emerald-500" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Próximos de Evoluir</h4>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Tier Atual</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Próximo</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Falta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {closestToEvolve.map((item: any) => (
                  <tr key={item.userId} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide">{item.name}</div>
                      <div className="text-[9px] font-bold text-slate-400">{item.email}</div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.tier}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-wider">{item.nextTier}</td>
                    <td className="px-6 py-4 text-[11px] font-black text-slate-900">{formatters.money(item.remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela 4: VIPs em Risco */}
        <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm flex flex-col">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2">
            <Clock size={14} className="text-rose-500" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">VIPs em Risco (Ouro/Diamante &gt;30d)</h4>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Tier</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Inatividade</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">LTV</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vipsAtRisk.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nenhum cliente VIP em risco encontrado.
                    </td>
                  </tr>
                ) : (
                  vipsAtRisk.map((item: any) => (
                    <tr key={item.userId} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide">{item.name}</div>
                        <div className="text-[9px] font-bold text-slate-400">{item.email}</div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.tier}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-rose-600">{item.daysInactive} dias</td>
                      <td className="px-6 py-4 text-[11px] font-black text-slate-900">{formatters.money(item.totalSpent)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          disabled={generatingForUserId !== null}
                          onClick={() => handleGenerate(item.userId)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 font-black shadow-sm"
                        >
                          {generatingForUserId === item.userId ? (
                            <>
                              <Loader2 size={10} className="animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            "Gerar cupom de retorno"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── MODAL DE DIÁLOGO DE SUCESSO ────────────────────── */}
      {createdCoupon && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-600">
              <Crown size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest">Cupom Criado com Sucesso!</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Código do Cupom</span>
                <div className="text-lg font-black text-slate-900 bg-slate-50 rounded-xl px-4 py-2 mt-1 select-all">{createdCoupon.couponCode}</div>
              </div>
              
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Validade</span>
                <div className="text-xs font-bold text-slate-700 mt-1">Válido até {new Date(createdCoupon.validUntil).toLocaleDateString("pt-BR")}</div>
              </div>
              
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mensagem para o Cliente</span>
                <pre className="text-xs font-medium text-slate-600 bg-slate-50 rounded-xl p-4 mt-1 whitespace-pre-wrap font-sans border border-slate-100 select-all">
                  {createdCoupon.messageText}
                </pre>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {copied ? "Copiado!" : "Copiar Mensagem"}
              </button>
              <button
                onClick={() => setCreatedCoupon(null)}
                className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
