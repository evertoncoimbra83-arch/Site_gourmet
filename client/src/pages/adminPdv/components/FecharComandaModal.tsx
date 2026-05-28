import { useEffect, useMemo, useState } from "react";
import { CreditCard, Landmark, ReceiptText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { safeNumber } from "@/lib/safe-parse";

import type { PdvComandaDetalhe } from "../types";

type PagamentoForma = "cartao" | "pix" | "outro";

type PagamentoDraft = {
  ativa: boolean;
  valor: string;
  descricao: string;
};

type PagamentoDraftMap = Record<PagamentoForma, PagamentoDraft>;

type FecharComandaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comanda: PdvComandaDetalhe | undefined;
  isPending: boolean;
  onConfirm: (payload: {
    desconto: number;
    pagamentos: Array<{
      forma: PagamentoForma;
      formaDescricao?: string;
      valor: number;
    }>;
  }) => Promise<void>;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

const emptyDrafts: PagamentoDraftMap = {
  cartao: { ativa: true, valor: "", descricao: "" },
  pix: { ativa: false, valor: "", descricao: "" },
  outro: { ativa: false, valor: "", descricao: "" },
};

export function FecharComandaModal({
  open,
  onOpenChange,
  comanda,
  isPending,
  onConfirm,
}: FecharComandaModalProps) {
  const [desconto, setDesconto] = useState("0");
  const [pagamentos, setPagamentos] =
    useState<PagamentoDraftMap>(emptyDrafts);

  useEffect(() => {
    if (!open || !comanda) return;
    setDesconto(String(comanda.desconto));
    setPagamentos({
      cartao: {
        ativa: true,
        valor: String(comanda.totalFinal),
        descricao: "",
      },
      pix: { ativa: false, valor: "", descricao: "" },
      outro: { ativa: false, valor: "", descricao: "" },
    });
  }, [comanda, open]);

  const totalComDesconto = useMemo(() => {
    const descontoAplicado = safeNumber(desconto, 0);
    return Math.max((comanda?.totalItens ?? 0) - descontoAplicado, 0);
  }, [comanda?.totalItens, desconto]);

  const somaPagamentos = useMemo(() => {
    return (Object.entries(pagamentos) as Array<[PagamentoForma, PagamentoDraft]>)
      .filter(([, draft]) => draft.ativa)
      .reduce((acc, [, draft]) => acc + safeNumber(draft.valor, 0), 0);
  }, [pagamentos]);

  const isValid = somaPagamentos >= totalComDesconto && totalComDesconto >= 0;

  const handleToggle = (forma: PagamentoForma) => {
    setPagamentos((current) => ({
      ...current,
      [forma]: {
        ...current[forma],
        ativa: !current[forma].ativa,
      },
    }));
  };

  const handleChange = (
    forma: PagamentoForma,
    field: keyof PagamentoDraft,
    value: string,
  ) => {
    setPagamentos((current) => ({
      ...current,
      [forma]: {
        ...current[forma],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    const payload = (Object.entries(pagamentos) as Array<
      [PagamentoForma, PagamentoDraft]
    >)
      .filter(([, draft]) => draft.ativa && safeNumber(draft.valor, 0) > 0)
      .map(([forma, draft]) => ({
        forma,
        formaDescricao:
          forma === "outro" ? draft.descricao.trim() || undefined : undefined,
        valor: safeNumber(draft.valor, 0),
      }));

    await onConfirm({
      desconto: safeNumber(desconto, 0),
      pagamentos: payload,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-[2.5rem] border-none bg-white p-0 shadow-2xl outline-none">
        <DialogHeader className="border-b border-slate-100 px-8 py-7">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
            Fechar Comanda
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Revise itens, ajuste desconto e informe os pagamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 px-8 py-7 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-[2rem] bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Resumo dos itens
              </p>
              <div className="mt-4 space-y-3">
                {comanda?.itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-black uppercase italic tracking-tighter text-slate-900">
                        {item.nome}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantidade}x {formatCurrency(item.precoUnit)}
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Desconto
              </label>
              <input
                value={desconto}
                onChange={(event) => setDesconto(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-emerald-600"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total final
              </p>
              <p className="mt-3 text-4xl font-black uppercase italic tracking-tighter text-emerald-400">
                {formatCurrency(totalComDesconto)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Pagamentos informados: {formatCurrency(somaPagamentos)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Formas de pagamento
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  { forma: "cartao" as const, label: "Cartão", icon: CreditCard },
                  { forma: "pix" as const, label: "PIX", icon: Landmark },
                  { forma: "outro" as const, label: "Outro", icon: ReceiptText },
                ].map(({ forma, label, icon: Icon }) => (
                  <button
                    key={forma}
                    type="button"
                    onClick={() => handleToggle(forma)}
                    className={[
                      "flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-[10px] font-black uppercase tracking-widest transition",
                      pagamentos[forma].ativa
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-500",
                    ].join(" ")}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {(Object.entries(pagamentos) as Array<[PagamentoForma, PagamentoDraft]>)
                .filter(([, draft]) => draft.ativa)
                .map(([forma, draft]) => (
                  <div key={forma} className="rounded-[2rem] bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {forma}
                    </p>
                    <input
                      value={draft.valor}
                      onChange={(event) =>
                        handleChange(forma, "valor", event.target.value)
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-slate-100 bg-white px-4 text-sm text-slate-900 outline-none focus:border-emerald-600"
                      placeholder="0,00"
                    />
                    {forma === "outro" ? (
                      <input
                        value={draft.descricao}
                        onChange={(event) =>
                          handleChange(forma, "descricao", event.target.value)
                        }
                        className="mt-3 h-12 w-full rounded-xl border border-slate-100 bg-white px-4 text-sm text-slate-900 outline-none focus:border-emerald-600"
                        placeholder="Descreva a forma de pagamento"
                      />
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 px-8 py-6">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-slate-200 px-6 text-slate-600"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!isValid || isPending}
            onClick={handleSubmit}
            className="rounded-2xl bg-emerald-600 px-6 text-white hover:bg-emerald-500"
          >
            Confirmar fechamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
