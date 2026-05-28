import { useMemo, useState } from "react";
import { CalendarRange, Search, UserRound } from "lucide-react";

import { trpc } from "@/_core/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/useDebounce";

import type { PdvClienteBusca } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function localDateInputValue(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function RelatoriosView() {
  const today = localDateInputValue();
  const [tab, setTab] = useState("hoje");
  const [dataHoje, setDataHoje] = useState(today);
  const [dataInicio, setDataInicio] = useState(today);
  const [dataFim, setDataFim] = useState(today);
  const [clienteSearch, setClienteSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<PdvClienteBusca | null>(null);
  const debouncedClienteSearch = useDebounce(clienteSearch, 300);

  const resumoHojeQuery = trpc.admin.pdv.relatorios.resumoDia.useQuery({
    data: dataHoje,
  });
  const periodoQuery = trpc.admin.pdv.relatorios.comandasPorPeriodo.useQuery({
    dataInicio,
    dataFim,
  });
  const clientesQuery = trpc.admin.pdv.clientes.buscar.useQuery(
    { termo: debouncedClienteSearch },
    { enabled: debouncedClienteSearch.trim().length >= 2 },
  );
  const clienteHistoryQuery = trpc.admin.pdv.relatorios.comandasPorCliente.useQuery(
    { clienteId: selectedCliente?.id ?? 0 },
    { enabled: Boolean(selectedCliente?.id) },
  );

  const hojeCards = useMemo(
    () => [
      { label: "Cartão", value: resumoHojeQuery.data?.totalCartao ?? 0 },
      { label: "PIX", value: resumoHojeQuery.data?.totalPix ?? 0 },
      { label: "Outro", value: resumoHojeQuery.data?.totalOutro ?? 0 },
      { label: "Geral", value: resumoHojeQuery.data?.totalGeral ?? 0 },
    ],
    [
      resumoHojeQuery.data?.totalCartao,
      resumoHojeQuery.data?.totalGeral,
      resumoHojeQuery.data?.totalOutro,
      resumoHojeQuery.data?.totalPix,
    ],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
          Relatórios do PDV
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter text-slate-900">
          Fechamento e histórico
        </h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="rounded-2xl bg-slate-100 p-1">
          <TabsTrigger
            value="hoje"
            className="rounded-xl px-6 font-black uppercase data-[state=active]:bg-white data-[state=active]:text-emerald-600"
          >
            Hoje
          </TabsTrigger>
          <TabsTrigger
            value="periodo"
            className="rounded-xl px-6 font-black uppercase data-[state=active]:bg-white data-[state=active]:text-emerald-600"
          >
            Período
          </TabsTrigger>
          <TabsTrigger
            value="cliente"
            className="rounded-xl px-6 font-black uppercase data-[state=active]:bg-white data-[state=active]:text-emerald-600"
          >
            Por Cliente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hoje" className="mt-6 space-y-6">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center gap-3">
              <CalendarRange size={18} className="text-emerald-600" />
              <input
                type="date"
                value={dataHoje}
                onChange={(event) => setDataHoje(event.target.value)}
                className="h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
              />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {hojeCards.map((card) => (
                <div key={card.label} className="rounded-[2rem] bg-slate-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-black uppercase italic tracking-tighter text-slate-900">
                    {formatCurrency(card.value)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {(resumoHojeQuery.data?.comandas ?? []).map((comanda) => (
                <div key={comanda.id} className="rounded-[2rem] bg-slate-50 p-5">
                  <p className="font-black uppercase italic tracking-tighter text-slate-900">
                    {comanda.clienteNome}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Comanda #{comanda.id}
                  </p>
                  <p className="mt-3 text-sm font-black text-emerald-600">
                    {formatCurrency(comanda.totalFinal)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="periodo" className="mt-6">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                className="h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
              />
              <input
                type="date"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
                className="h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
              />
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="pb-3">Comanda</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(periodoQuery.data ?? []).map((comanda) => (
                    <tr key={comanda.id} className="border-t border-slate-100">
                      <td className="py-4 font-black text-slate-900">#{comanda.id}</td>
                      <td className="py-4 text-slate-600">{comanda.clienteNome}</td>
                      <td className="py-4 text-slate-600">{comanda.status}</td>
                      <td className="py-4 font-black text-emerald-600">
                        {formatCurrency(comanda.totalFinal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cliente" className="mt-6">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4">
              <Search size={16} className="text-slate-400" />
              <input
                value={clienteSearch}
                onChange={(event) => setClienteSearch(event.target.value)}
                placeholder="Buscar cliente"
                className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="mt-5 space-y-3">
              {(clientesQuery.data ?? []).map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => setSelectedCliente(cliente)}
                  className="flex w-full items-center gap-3 rounded-[2rem] bg-slate-50 px-5 py-4 text-left"
                >
                  <UserRound size={16} className="text-emerald-600" />
                  <div>
                    <p className="font-black uppercase italic tracking-tighter text-slate-900">
                      {cliente.nome}
                    </p>
                    <p className="text-xs text-slate-500">{cliente.documento}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {(clienteHistoryQuery.data ?? []).map((comanda) => (
                <div key={comanda.id} className="rounded-[2rem] bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black uppercase italic tracking-tighter text-slate-900">
                        Comanda #{comanda.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{comanda.status}</p>
                    </div>
                    <p className="text-sm font-black text-emerald-600">
                      {formatCurrency(comanda.totalFinal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RelatoriosView;
