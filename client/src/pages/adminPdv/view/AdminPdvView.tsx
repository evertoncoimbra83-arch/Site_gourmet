import { useMemo, useState } from "react";
import { Clock3, Receipt, Search, ShoppingBag, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { appToast } from "@/lib/app-toast";
import { safeNumber } from "@/lib/safe-parse";

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

function formatElapsed(dateValue: Date) {
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.max(Math.floor(diffMs / 60000), 0);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) return `${remainingMinutes} min`;
  return `${hours}h ${remainingMinutes}m`;
}

type ClienteFormState = {
  tipo: "cpf" | "cnpj";
  documento: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  observacoes: string;
};

const emptyClienteForm: ClienteFormState = {
  tipo: "cpf",
  documento: "",
  nome: "",
  email: "",
  telefone: "",
  empresa: "",
  observacoes: "",
};

export function AdminPdvView() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<PdvClienteBusca | null>(null);
  const [isClienteDialogOpen, setIsClienteDialogOpen] = useState(false);
  const [clienteForm, setClienteForm] = useState<ClienteFormState>(emptyClienteForm);
  const [isFecharCaixaOpen, setIsFecharCaixaOpen] = useState(false);
  const [caixaData, setCaixaData] = useState(localDateInputValue());
  const [caixaObservacoes, setCaixaObservacoes] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const clientesQuery = trpc.admin.pdv.clientes.buscar.useQuery(
    { termo: debouncedSearch },
    { enabled: debouncedSearch.trim().length >= 2 },
  );
  const comandasAbertasQuery = trpc.admin.pdv.comandas.listarAbertas.useQuery();

  const criarClienteMutation = trpc.admin.pdv.clientes.criar.useMutation({
    onSuccess: async (result) => {
      await clientesQuery.refetch();
      const novoCliente: PdvClienteBusca = {
        id: result.id,
        tipo: clienteForm.tipo,
        documento: clienteForm.documento,
        nome: clienteForm.nome,
        email: clienteForm.email || null,
        telefone: clienteForm.telefone || null,
        empresa: clienteForm.empresa || null,
        observacoes: clienteForm.observacoes || null,
      };
      setSelectedCliente(novoCliente);
      setClienteForm(emptyClienteForm);
      setIsClienteDialogOpen(false);
      appToast.success(result.message);
    },
    onError: (error) => appToast.error(error.message),
  });

  const abrirComandaMutation = trpc.admin.pdv.comandas.abrir.useMutation({
    onSuccess: async (result) => {
      await utils.admin.pdv.comandas.listarAbertas.invalidate();
      appToast.success(result.message);
      navigate(`/admin/pdv/comanda/${result.id}`);
    },
    onError: (error) => appToast.error(error.message),
  });

  const fecharCaixaMutation = trpc.admin.pdv.relatorios.fecharCaixa.useMutation({
    onSuccess: (result) => {
      appToast.success(
        `Caixa de ${result.data} fechado com total ${formatCurrency(result.totalGeral)}.`,
      );
      setIsFecharCaixaOpen(false);
      navigate("/admin/pdv/relatorios");
    },
    onError: (error) => appToast.error(error.message),
  });

  const comandasDoCliente = useMemo(() => {
    if (!selectedCliente) return [];
    return (comandasAbertasQuery.data ?? []).filter(
      (comanda) => comanda.clienteId === selectedCliente.id,
    );
  }, [comandasAbertasQuery.data, selectedCliente]);

  const handleAbrirComanda = async (clienteId: number) => {
    await abrirComandaMutation.mutateAsync({ clienteId });
  };

  const handleCreateCliente = async () => {
    if (!clienteForm.nome.trim() || !clienteForm.documento.trim()) {
      appToast.error("Preencha nome e documento do cliente.");
      return;
    }

    await criarClienteMutation.mutateAsync({
      tipo: clienteForm.tipo,
      documento: clienteForm.documento,
      nome: clienteForm.nome,
      email: clienteForm.email || undefined,
      telefone: clienteForm.telefone || undefined,
      empresa: clienteForm.empresa || undefined,
      observacoes: clienteForm.observacoes || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
            Ponto de Venda
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Operação de salão
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Busque o cliente, acompanhe comandas abertas e entre na operação da mesa sem sair do admin.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-slate-200 px-5 text-slate-600"
            onClick={() => navigate("/admin/pdv/relatorios")}
          >
            Relatórios
          </Button>
          <Button
            type="button"
            className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-500"
            onClick={() => setIsClienteDialogOpen(true)}
          >
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Clientes
              </p>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                Busca e seleção
              </h2>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Buscar cliente
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4">
              <Search size={16} className="text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nome, CPF ou CNPJ"
                className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(clientesQuery.data ?? []).map((cliente) => {
              const active = selectedCliente?.id === cliente.id;
              return (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => setSelectedCliente(cliente)}
                  className={[
                    "w-full rounded-[2rem] border px-5 py-4 text-left transition",
                    active
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <p className="font-black uppercase italic tracking-tighter text-slate-900">
                    {cliente.nome}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {cliente.documento}
                    {cliente.telefone ? ` • ${cliente.telefone}` : ""}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Comandas do cliente
                </p>
                <h3 className="mt-1 text-xl font-black uppercase italic tracking-tighter text-slate-900">
                  {selectedCliente?.nome || "Selecione um cliente"}
                </h3>
              </div>
              {selectedCliente ? (
                <Button
                  type="button"
                  onClick={() => handleAbrirComanda(selectedCliente.id)}
                  className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-500"
                >
                  Abrir nova
                </Button>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {comandasDoCliente.length > 0 ? (
                comandasDoCliente.map((comanda) => (
                  <button
                    key={comanda.id}
                    type="button"
                    onClick={() => navigate(`/admin/pdv/comanda/${comanda.id}`)}
                    className="flex w-full items-center justify-between rounded-[2rem] bg-slate-50 px-5 py-4 text-left"
                  >
                    <div>
                      <p className="font-black uppercase italic tracking-tighter text-slate-900">
                        Comanda #{comanda.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {comanda.quantidadeItens} itens • aberta há {formatElapsed(comanda.abertaEm)}
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      {formatCurrency(comanda.totalFinal)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                  {selectedCliente
                    ? "Nenhuma comanda aberta para este cliente."
                    : "Selecione um cliente para ver ou abrir comandas."}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Receipt size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Operação ao vivo
              </p>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                Todas as comandas abertas
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {(comandasAbertasQuery.data ?? []).map((comanda) => (
              <div
                key={comanda.id}
                className="rounded-[2rem] bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black uppercase italic tracking-tighter text-slate-900">
                      {comanda.clienteNome}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Comanda #{comanda.id} • {comanda.quantidadeItens} itens
                    </p>
                  </div>
                  <span className="text-sm font-black text-emerald-600">
                    {formatCurrency(comanda.totalFinal)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={14} />
                    Aberta há {formatElapsed(comanda.abertaEm)}
                  </p>
                  <Button
                    type="button"
                    className="rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                    onClick={() => navigate(`/admin/pdv/comanda/${comanda.id}`)}
                  >
                    Abrir
                  </Button>
                </div>
              </div>
            ))}

            {safeNumber((comandasAbertasQuery.data ?? []).length, 0) === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                Nenhuma comanda aberta no momento.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={() => setIsFecharCaixaOpen(true)}
        className="fixed bottom-8 right-8 flex items-center gap-3 rounded-full bg-emerald-600 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition hover:bg-emerald-500"
      >
        <ShoppingBag size={16} />
        Fechar Caixa do Dia
      </button>

      <Dialog open={isClienteDialogOpen} onOpenChange={setIsClienteDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-8 py-7">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
              Novo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 px-8 py-7 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tipo
              </label>
              <select
                value={clienteForm.tipo}
                onChange={(event) =>
                  setClienteForm((current) => ({
                    ...current,
                    tipo: event.target.value as "cpf" | "cnpj",
                  }))
                }
                className="mt-2 h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Documento
              </label>
              <input
                value={clienteForm.documento}
                onChange={(event) =>
                  setClienteForm((current) => ({
                    ...current,
                    documento: event.target.value,
                  }))
                }
                className="mt-2 h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nome
              </label>
              <input
                value={clienteForm.nome}
                onChange={(event) =>
                  setClienteForm((current) => ({
                    ...current,
                    nome: event.target.value,
                  }))
                }
                className="mt-2 h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
              />
            </div>
            {[
              { key: "email", label: "Email" },
              { key: "telefone", label: "Telefone" },
              { key: "empresa", label: "Empresa" },
            ].map((field) => (
              <div key={field.key} className={field.key === "empresa" ? "md:col-span-2" : ""}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {field.label}
                </label>
                <input
                  value={clienteForm[field.key as keyof ClienteFormState]}
                  onChange={(event) =>
                    setClienteForm((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Observações
              </label>
              <textarea
                value={clienteForm.observacoes}
                onChange={(event) =>
                  setClienteForm((current) => ({
                    ...current,
                    observacoes: event.target.value,
                  }))
                }
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-8 py-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-slate-200 px-5 text-slate-600"
              onClick={() => setIsClienteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-500"
              disabled={criarClienteMutation.isPending}
              onClick={handleCreateCliente}
            >
              Salvar cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFecharCaixaOpen} onOpenChange={setIsFecharCaixaOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] border-none bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-8 py-7">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
              Fechar Caixa do Dia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 px-8 py-7">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Data
              </label>
              <input
                type="date"
                value={caixaData}
                onChange={(event) => setCaixaData(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Observações
              </label>
              <textarea
                value={caixaObservacoes}
                onChange={(event) => setCaixaObservacoes(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-8 py-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-slate-200 px-5 text-slate-600"
              onClick={() => setIsFecharCaixaOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-500"
              disabled={fecharCaixaMutation.isPending}
              onClick={() =>
                fecharCaixaMutation.mutate({
                  data: caixaData,
                  observacoes: caixaObservacoes || undefined,
                })
              }
            >
              Confirmar fechamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminPdvView;
