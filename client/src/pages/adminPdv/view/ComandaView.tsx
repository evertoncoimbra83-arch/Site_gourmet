import { useEffect, useMemo, useState } from "react";
import { MinusCircle, Search, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { appToast } from "@/lib/app-toast";
import { safeInteger, safeNumber } from "@/lib/safe-parse";

import { FecharComandaModal } from "../components/FecharComandaModal";
import type { AdminDishListItem, PdvComandaDetalhe } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

type DishDraft = {
  quantidade: string;
  observacao: string;
};

type DishDraftMap = Record<string, DishDraft>;
type ItemObservationMap = Record<number, string>;

export function ComandaView() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const comandaId = safeInteger(params.id, 0);
  const [search, setSearch] = useState("");
  const [discountInput, setDiscountInput] = useState("0");
  const [dishDrafts, setDishDrafts] = useState<DishDraftMap>({});
  const [itemObservations, setItemObservations] = useState<ItemObservationMap>({});
  const [isFecharOpen, setIsFecharOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const comandaQuery = trpc.admin.pdv.comandas.getById.useQuery(
    { id: comandaId },
    { enabled: comandaId > 0 },
  );
  const dishesQuery = trpc.admin.dishes.list.useQuery({
    page: 1,
    perPage: 100,
    search: debouncedSearch || undefined,
  });

  useEffect(() => {
    if (!comandaQuery.data) return;
    setDiscountInput(String(comandaQuery.data.desconto));
    const initialObservations: ItemObservationMap = {};
    comandaQuery.data.itens.forEach((item) => {
      initialObservations[item.id] = item.observacao ?? "";
    });
    setItemObservations(initialObservations);
  }, [comandaQuery.data]);

  const addItemMutation = trpc.admin.pdv.comandas.adicionarItem.useMutation({
    onSuccess: async (result) => {
      await utils.admin.pdv.comandas.getById.invalidate({ id: comandaId });
      await utils.admin.pdv.comandas.listarAbertas.invalidate();
      appToast.success(result.message);
    },
    onError: (error) => appToast.error(error.message),
  });

  const removeItemMutation = trpc.admin.pdv.comandas.removerItem.useMutation({
    onSuccess: async (result) => {
      await utils.admin.pdv.comandas.getById.invalidate({ id: comandaId });
      await utils.admin.pdv.comandas.listarAbertas.invalidate();
      appToast.success(result.message);
    },
    onError: (error) => appToast.error(error.message),
  });

  const updateObservationMutation =
    trpc.admin.pdv.comandas.atualizarItemObservacao.useMutation({
      onSuccess: (result) => appToast.success(result.message),
      onError: (error) => appToast.error(error.message),
    });

  const applyDiscountMutation =
    trpc.admin.pdv.comandas.aplicarDesconto.useMutation({
      onSuccess: async (result) => {
        await utils.admin.pdv.comandas.getById.invalidate({ id: comandaId });
        await utils.admin.pdv.comandas.listarAbertas.invalidate();
        appToast.success(result.message);
      },
      onError: (error) => appToast.error(error.message),
    });

  const fecharComandaMutation = trpc.admin.pdv.comandas.fechar.useMutation({
    onSuccess: async (result) => {
      await utils.admin.pdv.comandas.getById.invalidate({ id: comandaId });
      await utils.admin.pdv.comandas.listarAbertas.invalidate();
      await utils.admin.pdv.relatorios.resumoDia.invalidate();
      appToast.success(result.message);
      setIsFecharOpen(false);
      navigate("/admin/pdv");
    },
    onError: (error) => appToast.error(error.message),
  });

  const dishes = useMemo(() => dishesQuery.data?.data ?? [], [dishesQuery.data?.data]);
  const comanda = comandaQuery.data;

  const handleDraftChange = (
    dishId: number,
    field: keyof DishDraft,
    value: string,
  ) => {
    setDishDrafts((current) => ({
      ...current,
      [String(dishId)]: {
        quantidade: current[String(dishId)]?.quantidade ?? "1",
        observacao: current[String(dishId)]?.observacao ?? "",
        [field]: value,
      },
    }));
  };

  const handleAddItem = async (dish: AdminDishListItem) => {
    const draft = dishDrafts[String(dish.id)] ?? {
      quantidade: "1",
      observacao: "",
    };
    const quantity = Math.max(safeInteger(draft.quantidade, 1), 1);
    await addItemMutation.mutateAsync({
      comandaId,
      dishId: dish.id,
      nome: dish.name,
      precoUnit: safeNumber(dish.price, 0),
      quantidade: quantity,
      observacao: draft.observacao || undefined,
    });
    setDishDrafts((current) => ({
      ...current,
      [String(dish.id)]: {
        quantidade: "1",
        observacao: "",
      },
    }));
  };

  const handleObservationBlur = async (itemId: number, original: string | null) => {
    const nextValue = itemObservations[itemId] ?? "";
    if (nextValue === (original ?? "")) return;
    await updateObservationMutation.mutateAsync({
      itemId,
      observacao: nextValue || undefined,
    });
  };

  const handleCloseConfirm = async (payload: {
    desconto: number;
    pagamentos: Array<{
      forma: "cartao" | "pix" | "outro";
      formaDescricao?: string;
      valor: number;
    }>;
  }) => {
    if (!comanda) return;
    if (payload.desconto !== comanda.desconto) {
      await applyDiscountMutation.mutateAsync({
        comandaId,
        desconto: payload.desconto,
      });
      const refreshed = await utils.admin.pdv.comandas.getById.fetch({ id: comandaId });
      const latest = refreshed as PdvComandaDetalhe;
      await fecharComandaMutation.mutateAsync({
        comandaId,
        pagamentos: payload.pagamentos,
      });
      setDiscountInput(String(latest.desconto));
      return;
    }
    await fecharComandaMutation.mutateAsync({
      comandaId,
      pagamentos: payload.pagamentos,
    });
  };

  if (!comanda) {
    return (
      <div className="rounded-[2.5rem] bg-white p-10 shadow-sm ring-1 ring-slate-200/70">
        <p className="text-sm text-slate-500">Carregando comanda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
            Comanda #{comanda.id}
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            {comanda.cliente.nome}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {comanda.quantidadeItens} itens em aberto • total atual {formatCurrency(comanda.totalFinal)}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-slate-200 px-5 text-slate-600"
            onClick={() => navigate("/admin/pdv")}
          >
            Voltar
          </Button>
          <Button
            type="button"
            className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-500"
            onClick={() => setIsFecharOpen(true)}
          >
            Fechar Comanda
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Catálogo
              </p>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                Adicionar pratos
              </h2>
            </div>
            <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar prato"
                className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {dishes.map((dish) => {
              const draft = dishDrafts[String(dish.id)] ?? {
                quantidade: "1",
                observacao: "",
              };
              return (
                <div key={dish.id} className="rounded-[2rem] bg-slate-50 p-5">
                  <div className="flex gap-4">
                    <img
                      src={dish.imageUrl || "/placeholder.svg"}
                      alt={dish.name}
                      className="h-24 w-24 rounded-[1.5rem] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-black uppercase italic tracking-tighter text-slate-900">
                        {dish.name}
                      </p>
                      <p className="mt-2 text-sm font-black text-emerald-600">
                        {formatCurrency(safeNumber(dish.price, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <input
                      value={draft.quantidade}
                      onChange={(event) =>
                        handleDraftChange(dish.id, "quantidade", event.target.value)
                      }
                      className="h-12 rounded-xl border border-slate-100 bg-white px-4 text-sm text-slate-900 outline-none"
                      placeholder="Quantidade"
                    />
                    <textarea
                      value={draft.observacao}
                      onChange={(event) =>
                        handleDraftChange(dish.id, "observacao", event.target.value)
                      }
                      className="min-h-24 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      placeholder="Observação opcional para o item"
                    />
                    <Button
                      type="button"
                      className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500"
                      disabled={addItemMutation.isPending}
                      onClick={() => handleAddItem(dish)}
                    >
                      Adicionar +
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Itens da comanda
              </p>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                Resumo de consumo
              </h2>
            </div>
            <div className="rounded-[2rem] bg-slate-950 px-5 py-4 text-right text-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total
              </p>
              <p className="text-2xl font-black uppercase italic tracking-tighter text-emerald-400">
                {formatCurrency(comanda.totalFinal)}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {comanda.itens.map((item) => (
              <div key={item.id} className="rounded-[2rem] bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black uppercase italic tracking-tighter text-slate-900">
                      {item.nome}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.quantidade}x {formatCurrency(item.precoUnit)} • subtotal {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItemMutation.mutate({ itemId: item.id })}
                    className="text-slate-400 transition hover:text-rose-500"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                <textarea
                  value={itemObservations[item.id] ?? ""}
                  onChange={(event) =>
                    setItemObservations((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  onBlur={() => handleObservationBlur(item.id, item.observacao)}
                  className="mt-4 min-h-24 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder="Observação do item"
                />
              </div>
            ))}

            {comanda.itens.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                Ainda não há itens lançados nesta comanda.
              </div>
            ) : null}
          </div>

          <div className="mt-8 rounded-[2rem] bg-slate-50 p-5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Desconto da comanda
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={discountInput}
                onChange={(event) => setDiscountInput(event.target.value)}
                className="h-12 flex-1 rounded-xl border border-slate-100 bg-white px-4 text-sm text-slate-900 outline-none"
              />
              <Button
                type="button"
                className="rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                disabled={applyDiscountMutation.isPending}
                onClick={() =>
                  applyDiscountMutation.mutate({
                    comandaId,
                    desconto: safeNumber(discountInput, 0),
                  })
                }
              >
                Aplicar desconto
              </Button>
            </div>
          </div>

          <div className="mt-5">
            <Button
              type="button"
              className="w-full rounded-2xl bg-emerald-600 py-6 text-white hover:bg-emerald-500"
              onClick={() => setIsFecharOpen(true)}
            >
              Fechar Comanda
            </Button>
          </div>
        </section>
      </div>

      <FecharComandaModal
        open={isFecharOpen}
        onOpenChange={setIsFecharOpen}
        comanda={comanda}
        isPending={fecharComandaMutation.isPending || applyDiscountMutation.isPending}
        onConfirm={handleCloseConfirm}
      />
    </div>
  );
}

export default ComandaView;
