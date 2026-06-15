import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import {
  Search,
  Plus,
  Loader2,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { appToast as toast } from "@/lib/app-toast";
import { PurchaseEntryForm } from "./components/PurchaseEntryForm";
import { ItemClassifier } from "./components/ItemClassifier";

export default function AdminPurchasesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [classifyingItemId, setClassifyingItemId] = useState<number | null>(null);

  // Queries
  const { data, isLoading, refetch } = trpc.admin.purchases.listEntries.useQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
  });

  const { data: selectedEntry, isLoading: isLoadingEntry, refetch: refetchEntry } =
    trpc.admin.purchases.getEntry.useQuery(
      { id: selectedEntryId ?? 0 },
      { enabled: !!selectedEntryId }
    );

  const formatMoney = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "classified":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={12} />
            Classificado
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700">
            <AlertCircle size={12} />
            Parcial
          </span>
        );
      case "ignored":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500">
            <HelpCircle size={12} />
            Ignorado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 animate-pulse">
            <AlertCircle size={12} />
            Pendente
          </span>
        );
    }
  };

  const handleCreateSuccess = () => {
    setIsCreating(false);
    refetch();
  };

  const handleClassifySuccess = () => {
    setClassifyingItemId(null);
    if (selectedEntryId) {
      refetchEntry();
    }
    refetch();
  };

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
              Lançar <span className="text-emerald-500">Nova Compra</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Inserir dados manuais de notas ou notas fiscais
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(false)}
            variant="ghost"
            className="h-12 px-6 rounded-xl text-slate-500 hover:bg-slate-100 font-bold uppercase text-[10px] tracking-wider"
          >
            Voltar
          </Button>
        </div>
        <PurchaseEntryForm onSuccess={handleCreateSuccess} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topo / Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Entrada de <span className="text-emerald-500">Compras</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Gestão financeira de insumos e classificação de custos
          </p>
        </div>

        <Button
          onClick={() => setIsCreating(true)}
          className="h-14 px-8 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          Nova Compra
        </Button>
      </div>

      {/* Busca */}
      <div className="relative w-full">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <Input
          placeholder="Filtrar por nome do fornecedor..."
          className="h-14 pl-12 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Lista de Compras */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-emerald-500" />
        </div>
      ) : !data?.records || data.records.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 border border-slate-100 shadow-sm text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-black uppercase text-slate-700 tracking-tight">Nenhuma compra encontrada</h3>
          <p className="text-xs text-slate-400 mt-1">Lance sua primeira compra para começar a auditar custos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Fornecedor</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Data</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Valor Total</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Origem</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.records.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800 text-sm">{entry.supplierNameSnapshot}</p>
                        {entry.invoiceNumber && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">NF: {entry.invoiceNumber}</p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-slate-600 font-bold text-xs">
                        {new Date(entry.purchasedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-5 font-black text-slate-900 text-sm">
                        {formatMoney(entry.totalAmount)}
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(entry.classificationStatus)}
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                          {entry.source}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button
                          onClick={() => setSelectedEntryId(entry.id)}
                          className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-[9px] tracking-wider rounded-xl transition-all inline-flex items-center gap-1.5"
                        >
                          <Eye size={12} />
                          Ver Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                variant="outline"
                className="h-10 px-4 rounded-xl"
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-xs font-bold text-slate-500">
                Página {page} de {data.pagination.totalPages}
              </span>
              <Button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
                variant="outline"
                className="h-10 px-4 rounded-xl"
              >
                Próximo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes da Compra */}
      <Dialog
        open={!!selectedEntryId}
        onOpenChange={(open) => {
          if (!open) setSelectedEntryId(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl rounded-4xl p-8 border-none bg-white max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          <DialogHeader className="mb-4 text-left">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
              Detalhes da <span className="text-emerald-500">Compra</span>
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Classificação e auditoria de insumos comprados
            </DialogDescription>
          </DialogHeader>

          {isLoadingEntry || !selectedEntry ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden space-y-6">
              {/* Resumo Cabeçalho */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 shrink-0 text-left">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Fornecedor</p>
                  <p className="text-sm font-black text-slate-800 uppercase italic mt-0.5">{selectedEntry.supplierNameSnapshot}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data Compra</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    {new Date(selectedEntry.purchasedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Valor Total</p>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">{formatMoney(selectedEntry.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Status Geral</p>
                  <div className="mt-1">{getStatusBadge(selectedEntry.classificationStatus)}</div>
                </div>
              </div>

              {/* Lista de Itens */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 border border-slate-100 rounded-2xl bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                      <th className="px-4 py-3.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Descrição do Item</th>
                      <th className="px-4 py-3.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Qtd / Un</th>
                      <th className="px-4 py-3.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Preço Total</th>
                      <th className="px-4 py-3.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Classificação</th>
                      <th className="px-4 py-3.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Custo Base Unit</th>
                      <th className="px-4 py-3.5 text-right text-[9px] font-black uppercase tracking-wider text-slate-400">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedEntry.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-4 py-4 text-xs font-bold text-slate-700">{item.rawDescription}</td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600">
                          {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="px-4 py-4 text-xs font-black text-slate-900">{formatMoney(item.totalPrice)}</td>
                        <td className="px-4 py-4">
                          {item.classificationStatus === "classified" ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                              {item.category}
                            </span>
                          ) : item.classificationStatus === "ignored" ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                              Ignorado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                          {item.classificationStatus === "classified" && Number(item.computedCostPerBaseUnit) > 0 ? (
                            <span className="font-bold text-slate-700">
                              {formatMoney(item.computedCostPerBaseUnit || "0")} / base
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            onClick={() => setClassifyingItemId(item.id)}
                            className="h-8 px-3 bg-slate-900 hover:bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all"
                          >
                            Classificar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Componente Classificador */}
      {classifyingItemId && (
        <ItemClassifier
          itemId={classifyingItemId}
          onClose={() => setClassifyingItemId(null)}
          onSuccess={handleClassifySuccess}
        />
      )}
    </div>
  );
}
