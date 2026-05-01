import React, { useState } from "react";
import { useAdminOrders, statusLabels } from "../logic/useAdminOrders";
import OrderDetailsDrawer from "../components/OrderDetailsDrawer";
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

  const { state, actions, orders: rawOrders, mutations } = useAdminOrders();
  const orders = (rawOrders as Order[]) || [];

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
      toast.success("Pedido carregado no PDV!");
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
    onError: (err: { message: string }) => toast.error("Erro ao excluir: " + err.message),
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

  const handleEditInPDV = (orderId: string) => {
    if (window.confirm("Deseja abrir este pedido no PDV para edição?")) {
      editOrderPDV.mutate({ orderId });
    }
  };

  const handleDelete = (order: Order) => {
    const idStr = toSafeString(order.id);
    if (order.status === "completed") {
      toast.error("Pedidos CONCLUÍDOS não podem ser excluídos.");
      return;
    }
    if (window.confirm("Deseja realmente excluir este pedido?")) {
      deleteOrderMutation.mutate({ id: idStr });
    }
  };

  const handleQuickStatusUpdate = (id: string, newStatus: string) => {
    mutations.updateStatus.mutate(
      { id, status: newStatus },
      { onSuccess: () => {
          utils.admin.ordersAdmin.list.invalidate(undefined, { refetchType: 'all' });
          toast.success("Status atualizado!");
      }}
    );
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20 px-4 md:px-0 text-left relative">
      
      {/* 🚀 FLOATING ACTION BAR PARA SELEÇÃO EM MASSA */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Seleção Ativa</span>
            <span className="text-sm font-bold">{selectedIds.length} selecionados</span>
          </div>
          <div className="h-10 w-px bg-slate-700" />
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
            <span className="text-[10px] font-black uppercase">Abrir PDV Express</span>
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
        {state.isFetching ? (
          <div className="py-40 flex justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
        ) : orders.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-4xl border border-dashed border-slate-200">
             <p className="text-slate-400 font-bold text-sm uppercase">Nenhum pedido encontrado</p>
          </div>
        ) : (
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
                            <Button variant="outline" className={cn("font-black uppercase text-[10px] h-8 px-3 rounded-xl border shadow-none", getStatusColor(order.status))}>
                              {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                              <ChevronDown size={12} className="ml-2 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-48 p-2 rounded-2xl shadow-2xl border-none">
                            {Object.entries(statusLabels).map(([sk, label]) => (
                              <DropdownMenuItem key={sk} onClick={() => handleQuickStatusUpdate(idStr, sk)} className="text-[10px] font-black uppercase py-3 rounded-xl">
                                {label} {order.status === sk && <Check size={14} className="text-emerald-500 ml-auto" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="p-6 text-right font-black text-slate-900 italic text-base">
                        R$ {Number(order.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <Button size="icon" variant="ghost" title="Imprimir" className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600" onClick={() => navigate(`/admin/orders/${idStr}/print`)}><Printer size={16} /></Button>
                          <Button size="icon" variant="ghost" title="Editar no PDV" className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600" onClick={() => handleEditInPDV(idStr)} disabled={editOrderPDV.isPending}>
                            {editOrderPDV.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                          </Button>
                          <Button size="icon" title="Ver Detalhes" className="h-10 w-10 rounded-xl bg-slate-900 text-white" onClick={() => actions.setSelectedOrderId(idStr)}><Edit3 size={16} /></Button>
                          <Button size="icon" variant="ghost" title="Excluir" disabled={deleteOrderMutation.isPending} className="h-10 w-10 rounded-xl bg-red-50 text-red-500" onClick={() => handleDelete(order)}>
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