import React, { useState, useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { 
  Loader2, Users, DollarSign, Tag, TrendingUp, Gift, Calendar, Clock, Copy, Check, AlertTriangle, Plus, Search, HelpCircle 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const COLORS = ["#cd7f32", "#c0c0c0", "#ffd700", "#e5e4e2"]; // Bronze, Prata, Ouro, Diamante colors

const formatters = {
  money: (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val),
  num: (val: number) => new Intl.NumberFormat("pt-BR").format(val),
  percent: (val: number) => `${val.toFixed(1)}%`,
};

export function BirthdaysTab() {
  const [daysAhead, setDaysAhead] = useState<number>(30);
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: summary, isLoading: isLoadingSummary, error: summaryError } = 
    trpc.birthdays.summary.useQuery(undefined, { refetchOnWindowFocus: false });

  const { data: upcoming, isLoading: isLoadingList, error: listError } = 
    trpc.birthdays.listUpcoming.useQuery({ daysAhead }, { refetchOnWindowFocus: false });

  // Modal / Form States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [validDays, setValidDays] = useState<number>(7);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [createdCoupon, setCreatedCoupon] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Mutations
  const utils = trpc.useUtils();
  const createCouponMutation = trpc.birthdays.createCoupon.useMutation({
    onSuccess: (data) => {
      setCreatedCoupon(data);
      toast.success("Cupom de aniversário gerado!");
      utils.birthdays.summary.invalidate();
      utils.birthdays.listUpcoming.invalidate();
    },
    onError: (err) => {
      toast.error("Erro ao gerar cupom", { description: err.message });
      setSelectedUser(null);
    }
  });

  const handleOpenForm = (user: any) => {
    setSelectedUser(user);
    setDiscountPercent(10);
    setValidDays(7);
    setMinOrderValue(0);
    setCreatedCoupon(null);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    createCouponMutation.mutate({
      userId: selectedUser.id,
      discountPercent,
      validDays,
      minOrderValue,
    });
  };

  const handleCopy = () => {
    if (!createdCoupon) return;
    navigator.clipboard.writeText(createdCoupon.messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Mensagem copiada para a área de transferência!");
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setCreatedCoupon(null);
  };

  // Filtrar lista operacional na barra de pesquisa do frontend
  const filteredList = useMemo(() => {
    if (!upcoming) return [];
    return upcoming.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm)
    );
  }, [upcoming, searchTerm]);

  if (isLoadingSummary || isLoadingList) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={28} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Carregando módulo de aniversários...
        </p>
      </div>
    );
  }

  if (summaryError || listError || !summary) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-2 text-rose-500">
        <AlertTriangle size={28} />
        <p className="text-[10px] font-black uppercase tracking-widest">
          Erro ao carregar dados de aniversários.
        </p>
      </div>
    );
  }

  const { aniversariantesHoje, aniversariantesProximos7Dias, aniversariantesProximos30Dias, vipsAniversariantes, percentualPreenchido, byMonth, byTier } = summary;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 text-slate-900">
      
      {/* ── METRIC CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Hoje */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Hoje</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.num(aniversariantesHoje)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
            <Gift size={18} />
          </div>
        </div>

        {/* Card 2: Próximos 7 dias */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Próximos 7 dias</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.num(aniversariantesProximos7Dias)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Calendar size={18} />
          </div>
        </div>

        {/* Card 3: Próximos 30 dias */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Próximos 30 dias</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.num(aniversariantesProximos30Dias)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar size={18} />
          </div>
        </div>

        {/* Card 4: VIPs Aniversariantes */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">VIPs Aniversariantes</p>
            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{formatters.num(vipsAniversariantes)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingUp size={18} />
          </div>
        </div>

      </div>

      {/* Info extra */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-slate-400" />
          <span>Completude cadastral da base de aniversários:</span>
        </div>
        <span className="font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
          {percentualPreenchido.toFixed(1)}% preenchido
        </span>
      </div>

      {/* ── CHARTS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Aniversários por Mês */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm text-left">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-2">
            <Calendar size={14} className="text-emerald-600" />
            Aniversariantes por Mês
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMonth} barSize={20}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${v} aniversariantes`, "Total"]} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Aniversários por Faixa VIP */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm text-left">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-2">
            <Gift size={14} className="text-blue-500" />
            Aniversariantes por Faixa VIP
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTier} barSize={25}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${v} clientes`, "Total"]} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {byTier.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── TABELA OPERACIONAL ────────────────────────────── */}
      <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm flex flex-col text-left">
        
        {/* Filtros e Busca */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Filtro de Aniversariantes</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-1">Selecione o período e filtre a lista operacional</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Seletor de Período */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
              {[
                { label: "Hoje", val: 0 },
                { label: "7 dias", val: 7 },
                { label: "30 dias", val: 30 },
                { label: "90 dias", val: 90 },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setDaysAhead(opt.val)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                    daysAhead === opt.val
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Input de Busca */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-full"
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Nome</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Contato</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Aniversário</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Última Compra</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Pedidos</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">LTV</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">VIP Tier</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Nenhum aniversariante encontrado neste período.
                  </td>
                </tr>
              ) : (
                filteredList.map((client) => {
                  const vipColors: Record<string, string> = {
                    Diamante: "bg-slate-900 text-slate-100",
                    Ouro: "bg-amber-100 text-amber-800 border-amber-200",
                    Prata: "bg-slate-100 text-slate-700 border-slate-200",
                    Bronze: "bg-orange-50 text-orange-700 border-orange-100",
                    Nenhum: "bg-slate-50 text-slate-400",
                  };

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-black text-slate-900 uppercase tracking-wide truncate max-w-40">{client.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-slate-600">{client.email}</div>
                        <div className="text-[9px] font-semibold text-slate-400">{client.phone || "Sem telefone"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-black text-pink-600 uppercase tracking-tight flex items-center gap-1">
                          <Gift size={11} />
                          {client.birthDate.split("-").reverse().slice(0, 2).join("/")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {client.lastOrderAt ? (
                          <>
                            <div className="text-[10px] font-bold text-slate-700">{new Date(client.lastOrderAt).toLocaleDateString("pt-BR")}</div>
                            <div className="text-[9px] font-semibold text-slate-400">{client.daysInactive} dias inativo</div>
                          </>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">Sem compras</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{client.totalOrders}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-slate-900">{formatters.money(client.ltv)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border",
                          vipColors[client.vipTier] || vipColors.Nenhum
                        )}>
                          {client.vipTier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenForm(client)}
                          className="h-8 px-4 rounded-xl bg-slate-950 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border-none cursor-pointer"
                        >
                          Gerar Cupom
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL FORM & DIÁLOGO DE SUCESSO ────────────────── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6 text-left animate-in zoom-in-95 duration-200">
            
            {/* Título */}
            <div className="flex items-center gap-2 text-pink-600">
              <Gift size={20} className="animate-bounce" />
              <h3 className="text-sm font-black uppercase tracking-widest">
                {createdCoupon ? "Cupom Gerado!" : "Gerar Cupom de Aniversário"}
              </h3>
            </div>

            {/* Lógica Exclusiva para o formulário (antes da geração) */}
            {!createdCoupon ? (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Destinatário</span>
                  <div className="text-[11px] font-black text-slate-900 uppercase tracking-wide">{selectedUser.name}</div>
                  <div className="text-[9px] font-semibold text-slate-500 mt-0.5">{selectedUser.email}</div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="discount" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Porcentagem Desconto (%)</Label>
                  <input
                    id="discount"
                    type="number"
                    min={1}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 w-full focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="validity" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Validade em Dias</Label>
                  <input
                    id="validity"
                    type="number"
                    min={1}
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 w-full focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="minVal" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valor Mínimo Pedido (R$)</Label>
                  <input
                    id="minVal"
                    type="number"
                    min={0}
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 w-full focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createCouponMutation.isPending}
                    className="flex-1 h-11 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-md flex items-center justify-center gap-2 border-none"
                  >
                    {createCouponMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={13} />
                        Gerando...
                      </>
                    ) : (
                      "Gerar Recompensa"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseModal}
                    className="h-11 px-5 border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-xl transition-all shadow-sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              // Lógica Exclusiva para a exibição (após a geração)
              <div className="space-y-6">
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
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Parabéns Personalizado</span>
                    <pre className="text-xs font-medium text-slate-600 bg-slate-50 rounded-xl p-4 mt-1 whitespace-pre-wrap font-sans border border-slate-100 select-all">
                      {createdCoupon.messageText}
                    </pre>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 h-10 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm border-none cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={13} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Copiar Mensagem
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all shadow-sm cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
