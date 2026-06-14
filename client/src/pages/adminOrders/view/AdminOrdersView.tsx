import React, { useState, useMemo } from "react";
import { useAdminOrders, statusLabels } from "../logic/useAdminOrders";
import {
  FINALIZED_ORDER_MESSAGE,
  isFinalizedOrderStatus,
} from "../logic/orderStatusGuards";
import OrderDetailsDrawer from "../components/OrderDetailsDrawer";
import { AdminOrdersMobileList } from "./AdminOrdersMobileList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/_core/trpc";
import {
  Search,
  Loader2,
  Edit3,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  Check,
  Filter,
  ShoppingCart,
  DatabaseZap,
  CheckSquare,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getAdminMutationErrorMessage } from "@/lib/admin-mutation-error";
import { requestStrongConfirmation } from "@/lib/strong-confirmation";
import {
  buildTemplateLibrary,
  generateZPLForBatch,
  useZebraTransport,
  type AdminLabelTemplate,
} from "@/pages/adminLabelEditor/print-engine";
import {
  buildFlatLabels,
  createLabelContentParser,
  normalizeOrderItems,
  type OrderData,
  type OrderItem as LogicOrderItem,
} from "@/pages/adminLabelEditor/print-engine/logic";
import { Send } from "lucide-react";

// -----------------------------
// Interfaces
// -----------------------------
export interface Order {
  id: string | number;
  status: string;
  customerName?: string | null;
  customerPhone?: string | null;
  total?: number | string | null;
  pointsEarned?: number | null;
  pointsUsed?: number | null;
}

// -----------------------------
// Helpers
// -----------------------------
function toSafeString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "cancelled": return "bg-red-50 text-red-600 border-red-100";
    case "preparing": return "bg-blue-50 text-blue-600 border-blue-100";
    case "shipped": return "bg-purple-50 text-purple-600 border-purple-100";
    default: return "bg-amber-50 text-amber-600 border-amber-100";
  }
};

export function AdminOrdersView() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  // --- ESTADO DE SELEÇÃO ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editOrderIdToConfirm, setEditOrderIdToConfirm] = useState<string | null>(null);

  // --- ZEBRA BATCH PRINTING ENGINE & TEMPLATES ---
  const zebra = useZebraTransport();
  const { data: templatesRaw = [] } = trpc.admin.labels.getTemplates.useQuery();
  const { data: legacyRaw } = trpc.admin.storeSettings.getByKey.useQuery(
    { key: "label_design_elements" },
    { enabled: !templatesRaw.length },
  );

  const templates = useMemo(
    () =>
      buildTemplateLibrary(
        templatesRaw as AdminLabelTemplate[],
        (legacyRaw as { value?: string } | undefined)?.value,
      ),
    [legacyRaw, templatesRaw],
  );

  const activeTemplate = useMemo(
    () => templates.find((t) => t.isDefault) ?? templates[0] ?? null,
    [templates],
  );

  const updateStatusBatch = trpc.admin.ordersAdmin.updateStatusBatch.useMutation({
    onSuccess: () => {
      utils.admin.ordersAdmin.list.invalidate(undefined, { refetchType: 'all' });
      setSelectedIds([]);
      toast.success("Status dos pedidos atualizado com sucesso!");
    },
    onError: (err: { message: string }) => toast.error("Erro ao atualizar status: " + err.message)
  });

  const handlePrintBatchZebra = async () => {
    if (!activeTemplate) {
      toast.error("Nenhum template de etiqueta padrão configurado.");
      return;
    }

    const toastId = toast.loading("Carregando detalhes dos pedidos...");
    try {
      const ordersDetails = await utils.client.admin.ordersAdmin.getBatchByIds.query({
        orderIds: selectedIds
      });

      const allFlatLabels: any[] = [];
      const labelToOrderMap = new Map<number, any>();

      // Mapeia e normaliza cada pedido para o formato estruturado OrderData esperado pelo motor de impressão
      const formattedOrders: OrderData[] = ordersDetails.map((order) => {
        const mappedItems: LogicOrderItem[] = (order.items ?? []).map((item) => ({
          id: item.id,
          totalPrice: Number(item.totalPrice || 0),
          quantity: Number(item.quantity || 1),
          name: item.dishName || "Item",
          dishName: item.dishName || undefined,
          dish_name: item.dishName || undefined,
          options: item.options ?? undefined,
          parsedOptions: item.options ?? undefined,
          appliedNutrition: item.appliedNutrition ?? undefined,
          applied_nutrition: item.appliedNutrition ?? undefined,
          sizeName: item.sizeName ?? undefined,
          size_name: item.sizeName ?? undefined,
        }));

        return {
          id: order.id,
          customerName: order.customerName ?? undefined,
          items: normalizeOrderItems(mappedItems),
        };
      });

      formattedOrders.forEach((order) => {
        const labels = buildFlatLabels(order);
        labels.forEach((label) => {
          const labelIndex = allFlatLabels.length;
          allFlatLabels.push(label);
          labelToOrderMap.set(labelIndex, { order, labels });
        });
      });

      if (allFlatLabels.length === 0) {
        toast.error("Nenhuma etiqueta encontrada para os pedidos selecionados.", { id: toastId });
        return;
      }

      const zpl = generateZPLForBatch(
        activeTemplate.elements,
        activeTemplate.width,
        activeTemplate.height,
        allFlatLabels,
        (content, index) => {
          const mapping = labelToOrderMap.get(index);
          if (!mapping) return "";
          const localIndex = mapping.labels.findIndex((l: any) => l.id === allFlatLabels[index].id);
          const parser = createLabelContentParser(mapping.order, mapping.labels, 90);
          return parser(content, localIndex >= 0 ? localIndex : 0);
        }
      );

      toast.loading("Enviando lote para impressora Zebra...", { id: toastId });
      const printSuccess = await zebra.sendZpl(zpl);
      if (printSuccess) {
        toast.success(`${allFlatLabels.length} etiquetas enviadas para a impressora!`, { id: toastId });
        setSelectedIds([]);
      } else {
        toast.error("Falha ao enviar para impressora. Verifique se o app Browser Print está rodando ou se o cabo USB está conectado.", { id: toastId });
      }
    } catch (err: any) {
      toast.error("Erro na impressão: " + err.message, { id: toastId });
    }
  };

  const { state, actions, orders: rawOrders, mutations } = useAdminOrders();
  const orders = (rawOrders as Order[]) || [];
  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(toSafeString(order.id))),
    [orders, selectedIds],
  );
  const selectedFinalizedOrders = useMemo(
    () => selectedOrders.filter((order) => isFinalizedOrderStatus(order.status)),
    [selectedOrders],
  );
  const hasSelectedFinalizedOrders = selectedFinalizedOrders.length > 0;

  // --- MUTAÇÕES ---

  const syncBI = trpc.admin.syncBI.useMutation({
    onSuccess: (data: { processed: number }) => {
      toast.success(`${data.processed} pedidos sincronizados com o BI!`);
      setSelectedIds([]);
    },
    onError: (err: { message: string }) => toast.error("Erro na sincronização: " + err.message)
  });

  const handleNewOrder = () => navigate(`/admin/orders/create`);

  const editOrderPDV = trpc.admin.ordersAdmin.editOrder.useMutation({
    onSuccess: (data) => {
      toast.success("Pedido carregado na Venda Manual!");
      setEditOrderIdToConfirm(null);
      navigate(`/admin/orders/create?draftId=${data.newDraftId}`);
    },
    onError: (err: { message: string }) => toast.error("Erro ao carregar pedido: " + err.message),
  });

  const deleteOrderMutation = trpc.admin.ordersAdmin.deleteOrder.useMutation({
    onMutate: async () => { await utils.admin.ordersAdmin.list.cancel(); },
    onSuccess: () => {
      toast.success("Pedido excluído com sucesso.");
      if (state.selectedOrderId) actions.setSelectedOrderId(null);
    },
    onError: (err) => toast.error(getAdminMutationErrorMessage(err, "Erro ao excluir pedido.")),
    onSettled: async () => { await utils.admin.ordersAdmin.list.invalidate(undefined, { refetchType: 'all' }); }
  });

  // --- HANDLERS ---

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) setSelectedIds([]);
    else setSelectedIds(orders.map(o => toSafeString(o.id)));
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    syncBI.mutate({
      ids: selectedIds,
      start: "2024-01-01",
      end: new Date().toISOString()
    });
  };

  const handleEditInPDV = (orderId: string, status: string) => {
    if (isFinalizedOrderStatus(status)) {
      toast.error(FINALIZED_ORDER_MESSAGE);
      return;
    }
    setEditOrderIdToConfirm(orderId);
  };

  const handleDelete = (order: Order) => {
    const idStr = toSafeString(order.id);
    if (isFinalizedOrderStatus(order.status)) {
      toast.error(FINALIZED_ORDER_MESSAGE);
      return;
    }
    const confirmation = requestStrongConfirmation("Excluir pedido permanentemente.");
    if (!confirmation) return toast.warning("Confirmacao forte cancelada.");
    deleteOrderMutation.mutate({ id: idStr, ...confirmation });
  };

  const handleQuickStatusUpdate = (id: string, newStatus: string) => {
    mutations.updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          utils.admin.ordersAdmin.list.invalidate(undefined, { refetchType: 'all' });
          toast.success("Status atualizado!");
        }
      }
    );
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20 px-4 md:px-0 text-left relative">
      <ConfirmDialog
        open={!!editOrderIdToConfirm}
        title="Abrir pedido na Venda Manual?"
        description="O pedido sera carregado como rascunho editavel para revisao administrativa."
        confirmLabel="Abrir pedido"
        cancelLabel="Manter na lista"
        loading={editOrderPDV.isPending}
        onCancel={() => setEditOrderIdToConfirm(null)}
        onConfirm={() => {
          if (!editOrderIdToConfirm) return;
          editOrderPDV.mutate({ orderId: editOrderIdToConfirm });
        }}
      />

      {/* 🚀 FLOATING ACTION BAR PARA SELEÇÃO EM MASSA */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Seleção Ativa</span>
            <span className="text-sm font-bold">{selectedIds.length} selecionados</span>
          </div>
          <div className="h-10 w-px bg-slate-700" />
          <Button
            onClick={handlePrintBatchZebra}
            disabled={zebra.isPrinting || !zebra.isReady}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 shadow-lg shadow-blue-900/20 transition-all"
            title={zebra.isReady ? "Imprimir etiquetas de todos os pedidos selecionados na Zebra" : "Impressora Zebra offline"}
          >
            {zebra.isPrinting ? <Loader2 className="animate-spin" size={14} /> : <Printer size={14} />}
            Imprimir Zebra
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={updateStatusBatch.isPending || hasSelectedFinalizedOrders}
                className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 transition-all"
                title={hasSelectedFinalizedOrders ? FINALIZED_ORDER_MESSAGE : "Alterar status em lote"}
              >
                {updateStatusBatch.isPending ? <Loader2 className="animate-spin" size={14} /> : <ChevronDown size={14} />}
                Mudar Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-2xl">
              {Object.entries(statusLabels).map(([sk, label]) => (
                <DropdownMenuItem
                  key={sk}
                  onClick={() => updateStatusBatch.mutate({ ids: selectedIds, status: sk })}
                  className="py-3 text-[10px] font-black uppercase rounded-xl text-slate-900 focus:bg-slate-50 focus:text-slate-900 cursor-pointer"
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleExportSelected}
            disabled={syncBI.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 shadow-lg shadow-emerald-900/20 transition-all"
          >
            {syncBI.isPending ? <Loader2 className="animate-spin" size={14} /> : <DatabaseZap size={14} />}
            Sincronizar BI
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSelectedIds([])}
            className="text-[10px] font-black uppercase hover:bg-white/10 h-11 px-4 rounded-xl"
          >
            Cancelar
          </Button>
          {hasSelectedFinalizedOrders && (
            <span className="max-w-56 text-[10px] font-bold text-amber-300">
              {selectedFinalizedOrders.length} pedido(s) finalizado(s) na seleção. O status em lote foi bloqueado.
            </span>
          )}
        </div>
      )}

      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em]">
            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Operações Ativas
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Fluxo de <span className="text-emerald-600">Pedidos.</span>
          </h1>
        </div>

        <Button
          onClick={handleNewOrder}
          className="h-14 md:h-16 px-8 rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all gap-3"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[8px] font-black text-emerald-400 uppercase">Nova Venda</span>
            <span className="text-[10px] font-black uppercase">Abrir Venda Manual</span>
          </div>
          <Plus size={20} />
        </Button>
      </header>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative group flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <Input
            placeholder="BUSCAR CLIENTE OU ID..."
            className="h-14 md:h-16 pl-12 rounded-2xl bg-white border-none shadow-sm font-black text-[10px]"
            value={state.search}
            onChange={(e) => actions.setSearch(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "h-14 md:h-16 px-8 rounded-2xl border-none shadow-sm font-black text-[10px] uppercase gap-3",
              state.filters.status ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-white"
            )}>
              <Filter size={16} />
              <span>{state.filters.status ? statusLabels[state.filters.status as keyof typeof statusLabels] : "Filtros"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-6 rounded-[2rem] shadow-2xl border-none" align="end">
            <div className="space-y-4 text-left">
              <h4 className="font-black text-[10px] uppercase text-slate-400">Status Operacional</h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(statusLabels).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => actions.setFilters({ ...state.filters, status: val })}
                    className={cn(
                      "text-left px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all",
                      state.filters.status === val ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" className="w-full text-red-500 rounded-xl h-12 text-[10px] font-black uppercase" onClick={() => actions.clearFilters()}>Limpar Filtros</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* LISTAGEM */}
      <div>
        {state.isError ? (
          <div className="rounded-4xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="text-sm font-black uppercase text-red-600">
              Nao foi possivel carregar os pedidos.
            </p>
            <p className="mt-2 text-xs font-bold text-red-400">
              {state.error?.message || "Erro desconhecido na listagem."}
            </p>
            <Button
              onClick={() => actions.refetch()}
              className="mt-5 h-11 rounded-2xl bg-red-600 px-6 text-[10px] font-black uppercase text-white hover:bg-red-700"
            >
              Tentar novamente
            </Button>
          </div>
        ) : state.isFetching ? (
          <div className="py-40 flex justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
        ) : orders.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-4xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-sm uppercase">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <>
            <AdminOrdersMobileList
              orders={orders}
              selectedIds={selectedIds}
              isEditing={editOrderPDV.isPending}
              isDeleting={deleteOrderMutation.isPending}
              onToggleSelect={toggleSelect}
              onOpenOrder={actions.setSelectedOrderId}
              onEditOrder={handleEditInPDV}
              onDeleteOrder={handleDelete}
            />
            <div className="hidden md:block bg-white rounded-4xl shadow-xl border border-slate-100 overflow-hidden">
              <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-left">
                  <th className="p-6 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-emerald-600 transition-colors">
                      {selectedIds.length === orders.length && orders.length > 0 ? <CheckSquare size={20} className="text-emerald-600" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400"># Identificador</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400">Cliente</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-center">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">Total</th>
                  <th className="p-6 text-right text-slate-400 text-[10px] font-black uppercase">Gerenciar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => {
                  const idStr = toSafeString(order.id);
                  const isSelected = selectedIds.includes(idStr);
                  const isFinalized = isFinalizedOrderStatus(order.status);
                  return (
                    <tr key={idStr} className={cn("group transition-all", isSelected ? "bg-emerald-50/40" : "hover:bg-slate-50/30")}>
                      <td className="p-6 text-center">
                        <button onClick={() => toggleSelect(idStr)} className={cn("transition-colors", isSelected ? "text-emerald-600" : "text-slate-300 group-hover:text-slate-400")}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="p-6 text-left">
                        <span className={cn("font-black px-3 py-1.5 rounded-lg text-[11px]", isSelected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-900")}>
                          #{idStr.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="p-6 text-left cursor-pointer" onClick={() => actions.setSelectedOrderId(idStr)}>
                        <div className="font-black uppercase text-slate-800 text-sm truncate max-w-50">{order.customerName || "Cliente"}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{order.customerPhone || "---"}</div>
                      </td>
                      <td className="p-6 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={isFinalized}
                              title={isFinalized ? FINALIZED_ORDER_MESSAGE : "Alterar status"}
                              className={cn(
                                "font-black uppercase text-[10px] h-8 px-3 rounded-xl border shadow-none disabled:cursor-not-allowed disabled:opacity-60",
                                getStatusColor(order.status),
                              )}
                            >
                              {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                              <ChevronDown size={12} className="ml-2 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-48 rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-2xl">
                            {Object.entries(statusLabels).map(([sk, label]) => (
                              <DropdownMenuItem
                                key={sk}
                                onClick={() => handleQuickStatusUpdate(idStr, sk)}
                                className={cn(
                                  "py-3 text-[10px] font-black uppercase rounded-xl text-slate-900 focus:bg-slate-50 focus:text-slate-900",
                                  order.status === sk
                                    ? "bg-emerald-50 text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                                    : "hover:bg-slate-50",
                                )}
                              >
                                {label} {order.status === sk && <Check size={14} className="text-emerald-500 ml-auto" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {isFinalized && (
                          <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            Finalizado: status bloqueado
                          </p>
                        )}
                      </td>
                      <td className="p-6 text-right font-black text-slate-900 italic text-base">
                        R$ {Number(order.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" title="Imprimir" className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700" onClick={() => navigate(`/admin/orders/${idStr}/print`)}><Printer size={16} /></Button>
                          <Button size="icon" variant="ghost" title={isFinalized ? FINALIZED_ORDER_MESSAGE : "Editar Venda Manual"} className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200" onClick={() => handleEditInPDV(idStr, order.status)} disabled={editOrderPDV.isPending || isFinalized}>
                            {editOrderPDV.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                          </Button>
                          <Button size="icon" title="Ver Detalhes" className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white" onClick={() => actions.setSelectedOrderId(idStr)}><Edit3 size={16} /></Button>
                          <Button size="icon" variant="ghost" title={isFinalized ? FINALIZED_ORDER_MESSAGE : "Excluir"} disabled={deleteOrderMutation.isPending || isFinalized} className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200" onClick={() => handleDelete(order)}>
                            {deleteOrderMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {state.selectedOrderId && (
        <OrderDetailsDrawer
          orderId={toSafeString(state.selectedOrderId)}
          onClose={() => actions.setSelectedOrderId(null)}
          onUpdateStatus={(id: string, status: string) => handleQuickStatusUpdate(id, status)}
          onUpdateOrder={async () => { await utils.admin.ordersAdmin.list.invalidate(undefined, { refetchType: 'all' }); }}
          isUpdating={mutations.updateStatus.isPending}
        />
      )}
    </div>
  );
}
