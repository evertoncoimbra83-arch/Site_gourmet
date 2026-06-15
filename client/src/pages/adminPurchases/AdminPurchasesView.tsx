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
  Upload,
  AlertTriangle,
  QrCode,
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
import { NfceQrScanner } from "./components/NfceQrScanner";

export default function AdminPurchasesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [classifyingItemId, setClassifyingItemId] = useState<number | null>(null);
  const [onlyShowPendingInDialog, setOnlyShowPendingInDialog] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // XML Import states
  const [isImportingXml, setIsImportingXml] = useState(false);
  const [xmlContent, setXmlContent] = useState("");
  const [xmlFileName, setXmlFileName] = useState("");
  const [xmlPreview, setXmlPreview] = useState<any>(null);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [xmlNotes, setXmlNotes] = useState("");

  // Queries
  const { data, isLoading, refetch } = trpc.admin.purchases.listEntries.useQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
    status: (statusFilter as any) || undefined,
  });

  const { data: selectedEntry, isLoading: isLoadingEntry, refetch: refetchEntry } =
    trpc.admin.purchases.getEntry.useQuery(
      { id: selectedEntryId ?? 0 },
      { enabled: !!selectedEntryId }
    );

  const handleOpenDetails = (entryId: number, showOnlyPending = false) => {
    setOnlyShowPendingInDialog(showOnlyPending);
    setSelectedEntryId(entryId);
  };

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

  // XML Import Mutations
  const previewMutation = trpc.admin.purchases.previewFiscalXmlImport.useMutation({
    onSuccess: (data) => {
      setXmlPreview(data);
      setXmlError(null);
    },
    onError: (err) => {
      setXmlError(err.message || "Erro ao processar o XML.");
      setXmlPreview(null);
    },
  });

  const createFromXmlMutation = trpc.admin.purchases.createEntryFromFiscalXml.useMutation({
    onSuccess: () => {
      toast.success("Compra importada com sucesso!");
      setIsImportingXml(false);
      resetXmlState();
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao importar XML", { description: err.message });
    },
  });

  const resetXmlState = () => {
    setXmlContent("");
    setXmlFileName("");
    setXmlPreview(null);
    setXmlError(null);
    setXmlNotes("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setXmlFileName(file.name);
    setXmlError(null);
    setXmlPreview(null);

    if (file.size > 2 * 1024 * 1024) {
      setXmlError("O arquivo excede o tamanho limite de 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
      previewMutation.mutate({ xmlContent: content, fileName: file.name });
    };
    reader.onerror = () => {
      setXmlError("Erro ao ler o arquivo XML.");
    };
    reader.readAsText(file);
  };

  const renderSuggestionBadge = (suggestion: any) => {
    if (!suggestion) {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
          Pendente
        </span>
      );
    }

    let bgText = "";
    let colorText = "";
    let label = suggestion.category;

    switch (suggestion.category) {
      case "FOOD_INGREDIENT":
        bgText = "bg-emerald-50";
        colorText = "text-emerald-700";
        label = "Insumo";
        break;
      case "PACKAGING":
        bgText = "bg-sky-50";
        colorText = "text-sky-700";
        label = "Embalagem";
        break;
      case "LABEL_PRINTING":
        bgText = "bg-purple-50";
        colorText = "text-purple-700";
        label = "Etiqueta";
        break;
      case "IGNORE":
        bgText = "bg-slate-100";
        colorText = "text-slate-600";
        label = "Ignorado";
        break;
      default:
        bgText = "bg-blue-50";
        colorText = "text-blue-700";
        break;
    }

    return (
      <div className="flex flex-col gap-0.5 items-start">
        <span className={`px-2 py-0.5 rounded ${bgText} ${colorText} text-[9px] font-bold uppercase tracking-wider`}>
          {label}
        </span>
        {suggestion.linkedEntityName && (
          <span className="text-[8px] text-slate-500 font-semibold max-w-[120px] truncate">
            → {suggestion.linkedEntityName}
          </span>
        )}
      </div>
    );
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

        <div className="flex gap-3">
          <Button
            onClick={() => setIsQrScannerOpen(true)}
            className="h-14 px-8 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <QrCode size={18} />
            Escanear QR
          </Button>
          <Button
            onClick={() => setIsImportingXml(true)}
            className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Upload size={18} />
            Importar XML
          </Button>
          <Button
            onClick={() => setIsCreating(true)}
            className="h-14 px-8 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} />
            Nova Compra
          </Button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            placeholder="Filtrar por nome do fornecedor..."
            className="h-14 pl-12 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-14 px-4 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 text-xs focus:outline-none min-w-[200px]"
        >
          <option value="">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="partial">Parcial</option>
          <option value="classified">Classificado</option>
          <option value="ignored">Ignorado</option>
        </select>
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
                  {data.records.map((entry) => {
                    const borderHighlight =
                      entry.classificationStatus === "partial"
                        ? "border-l-4 border-l-sky-500 bg-sky-50/5"
                        : entry.classificationStatus === "pending"
                        ? "border-l-4 border-l-amber-500 bg-amber-50/5"
                        : "";
                    return (
                      <tr key={entry.id} className={`hover:bg-slate-50/50 transition-colors ${borderHighlight}`}>
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
                          <div className="flex flex-col gap-1 items-start">
                            {getStatusBadge(entry.classificationStatus)}
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {entry.classifiedCount} de {entry.totalItemsCount} classificados
                              {entry.pendingCount > 0 && ` (${entry.pendingCount} pendentes)`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                            {entry.source}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <Button
                              onClick={() => handleOpenDetails(entry.id, false)}
                              className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-[9px] tracking-wider rounded-xl transition-all inline-flex items-center gap-1.5"
                            >
                              <Eye size={12} />
                              Ver Detalhes
                            </Button>
                            {(entry.classificationStatus === "pending" || entry.classificationStatus === "partial") && (
                              <Button
                                onClick={() => handleOpenDetails(entry.id, true)}
                                className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase text-[9px] tracking-wider rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                              >
                                Revisar Pendentes
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

              {/* Filtro de Itens do Dialog */}
              <div className="flex items-center justify-between px-1 shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Itens da Compra ({selectedEntry.items?.length || 0})
                </span>
                <div className="flex items-center gap-2">
                  <input
                    id="dialogOnlyPending"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    checked={onlyShowPendingInDialog}
                    onChange={(e) => setOnlyShowPendingInDialog(e.target.checked)}
                  />
                  <label htmlFor="dialogOnlyPending" className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer select-none">
                    Mostrar apenas pendentes
                  </label>
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
                    {(() => {
                      const filteredItems = selectedEntry.items?.filter(
                        (item) => !onlyShowPendingInDialog || item.classificationStatus === "pending"
                      ) || [];
                      if (filteredItems.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-xs font-bold text-slate-400 uppercase">
                              Nenhum item pendente de classificação.
                            </td>
                          </tr>
                        );
                      }
                      return filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-4 py-4 text-xs font-bold text-slate-700">{item.rawDescription}</td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600">
                          {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="px-4 py-4 text-xs font-black text-slate-900">{formatMoney(item.totalPrice)}</td>
                        <td className="px-4 py-4">
                          {item.classificationStatus === "classified" ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                                {item.category}
                              </span>
                              {item.category === "FOOD_INGREDIENT" && (
                                item.costApplicationStatus === "applied" ? (
                                  <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-tight">
                                    ✓ Custo Aplicado
                                  </span>
                                ) : (
                                  <span className="text-[8px] text-amber-500 font-extrabold uppercase tracking-tight animate-pulse">
                                    ⚠ Custo Pendente
                                  </span>
                                )
                              )}
                            </div>
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
                            className={
                              item.classificationStatus === "classified" && item.category === "FOOD_INGREDIENT"
                                ? item.costApplicationStatus === "applied"
                                  ? "h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all"
                                  : "h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                                : "h-8 px-3 bg-slate-900 hover:bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all"
                            }
                          >
                            {item.classificationStatus === "classified" && item.category === "FOOD_INGREDIENT"
                              ? item.costApplicationStatus === "applied"
                                ? "Rever / Aplicado"
                                : "Aplicar Custo"
                              : "Classificar"}
                          </Button>
                        </td>
                      </tr>
                    ));
                    })()}
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

      {/* Modal de Scanner NFC-e QR Code */}
      {isQrScannerOpen && (
        <NfceQrScanner onClose={() => setIsQrScannerOpen(false)} />
      )}

      {/* Modal de Importação de XML Fiscal */}
      <Dialog
        open={isImportingXml}
        onOpenChange={(open) => {
          if (!open) {
            setIsImportingXml(false);
            resetXmlState();
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl rounded-4xl p-8 border-none bg-white max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          <DialogHeader className="mb-4 text-left">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
              Importar <span className="text-emerald-500">XML Fiscal</span>
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Importe NF-e ou NFC-e (.xml) para gerar uma Entrada de Compra
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden space-y-6">
            {/* Uploader / Seleção de Arquivo */}
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center shrink-0">
              <Upload className="text-slate-400 mb-2" size={32} />
              <p className="text-xs font-bold text-slate-700">Arraste ou selecione o XML fiscal da nota</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Limite de arquivo de 2MB</p>
              <input
                type="file"
                accept=".xml"
                onChange={handleFileChange}
                className="hidden"
                id="xmlFileInput"
              />
              <Button
                asChild
                className="mt-4 h-10 px-6 bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[9px] tracking-wider rounded-xl transition-all shadow-sm font-bold"
              >
                <label htmlFor="xmlFileInput" className="cursor-pointer">
                  Selecionar Arquivo
                </label>
              </Button>
              {xmlFileName && (
                <p className="text-xs font-bold text-emerald-600 mt-2">
                  Arquivo selecionado: {xmlFileName}
                </p>
              )}
            </div>

            {/* Loading e Erros */}
            {previewMutation.isPending && (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <Loader2 className="animate-spin text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase">Processando e validando XML...</p>
              </div>
            )}

            {xmlError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-800 text-[10px] font-bold uppercase leading-tight shrink-0">
                <AlertTriangle size={16} className="shrink-0 text-red-600" />
                <span>{xmlError}</span>
              </div>
            )}

            {/* Tela de Preview / Revisão do XML parseado */}
            {xmlPreview && !previewMutation.isPending && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-6 animate-in fade-in duration-200 text-left">
                {/* Cabeçalho da Nota */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Fornecedor</p>
                    <p className="text-xs font-black text-slate-800 uppercase mt-0.5">{xmlPreview.supplier.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold mt-0.5">CNPJ: {xmlPreview.supplier.cnpj}</p>
                    {!xmlPreview.supplier.exists && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 uppercase tracking-tight">
                        Novo fornecedor
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Documento</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      NF: {xmlPreview.document.number} (Série: {xmlPreview.document.series})
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 uppercase tracking-tight">
                      {xmlPreview.document.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data de Emissão</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {xmlPreview.document.issuedAt
                        ? new Date(xmlPreview.document.issuedAt).toLocaleDateString("pt-BR")
                        : "Não informada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Valor Total</p>
                    <p className="text-xs font-black text-emerald-600 mt-0.5">
                      {formatMoney(xmlPreview.document.totalAmount)}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-4 border-t border-slate-100 pt-2">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Chave de Acesso</p>
                    <p className="text-[10px] font-bold text-slate-600 word-break break-all font-mono">
                      {xmlPreview.document.accessKey}
                    </p>
                  </div>
                </div>

                {/* Tabela de Itens */}
                <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">#</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Descrição / Código</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Qtd / Un</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Preço Total</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Sugestão Classificação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {xmlPreview.items.map((item: any) => (
                        <tr key={item.lineNumber} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-4 py-3.5 text-xs text-slate-500 font-bold">{item.lineNumber}</td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs font-bold text-slate-700">{item.description}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                              Cód: {item.code} {item.ncm && `| NCM: ${item.ncm}`} {item.cfop && `| CFOP: ${item.cfop}`} {item.ean && `| EAN: ${item.ean}`}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-black text-slate-900">
                            {formatMoney(item.totalPrice)}
                          </td>
                          <td className="px-4 py-3.5">
                            {renderSuggestionBadge(item.suggestion)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notas / Observações e Botões */}
                <div className="space-y-3 shrink-0">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Observações adicionais para esta compra (Opcional)</label>
                    <textarea
                      placeholder="Alguma nota importante sobre esta importação..."
                      className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs text-slate-700 focus:outline-none min-h-16"
                      value={xmlNotes}
                      onChange={(e) => setXmlNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resetXmlState()}
                      className="h-12 px-6 font-bold text-xs"
                    >
                      Limpar Arquivo
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        createFromXmlMutation.mutate({
                          xmlContent,
                          notes: xmlNotes || undefined,
                          supplierId: xmlPreview.supplier.id,
                        });
                      }}
                      disabled={createFromXmlMutation.isPending}
                      className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wider px-6 rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-md font-bold"
                    >
                      {createFromXmlMutation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Importar Entrada de Compra"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
