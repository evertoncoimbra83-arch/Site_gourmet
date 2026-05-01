import React, { useState } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/_core/trpc";
import { Loader2, X, User } from "lucide-react"; 

// --- TIPAGENS ---

type OrderStatus = "pending" | "processing" | "paid" | "preparing" | "shipped" | "completed" | "cancelled" | "refunded" | "failed";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Em Processamento",
  paid: "Pago",
  preparing: "Em Preparo",
  shipped: "Enviado",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Estornado",
  failed: "Falhou"
};

interface OrderListItem {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  total: string | number;
  paymentMethod: string | null;
  status: string | null;
  createdAt: string | Date | null;
}

interface OrderItemDetail {
  id: string;
  dishName: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
}

interface OrderFullDetail {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZipCode: string | null;
  status: string | null;
  paymentMethod: string | null;
  total: string | number;
  items?: OrderItemDetail[]; // ✅ Array de itens injetado na raiz do pedido
}

// --- COMPONENTE DETALHES ---

type OrderDetailsDrawerProps = {
  orderId: string;
  onClose: () => void;
};

function OrderDetailsDrawer({ orderId, onClose }: OrderDetailsDrawerProps) {
  const { data, isLoading } = trpc.admin.orders.getById.useQuery({ orderId });
  
  const utils = trpc.useUtils();
  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.orders.list.invalidate();
      utils.admin.orders.getById.invalidate({ orderId });
    },
  });

  // ✅ Cast seguro mapeando a estrutura exata que o tRPC está retornando
  const order = data as OrderFullDetail | undefined;
  const items = order?.items ?? [];

  const handleStatusChange = (status: string) => {
    // ✅ FIX 1: O schema de update espera 'id' (não orderId)

    updateStatus.mutate({ id: orderId, status: status as OrderStatus });
  };
  
  const getStatusBadge = (status: string | null) => {
    const safeStatus = status || "pending";
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      preparing: "bg-indigo-100 text-indigo-800",
      shipped: "bg-purple-100 text-purple-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-200 text-gray-700",
      failed: "bg-red-200 text-red-900"
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[safeStatus] || "bg-gray-100"}`}>{statusLabels[safeStatus] ?? safeStatus}</span>;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      
      <div className="w-full sm:max-w-md bg-white h-[85vh] sm:h-full shadow-xl flex flex-col rounded-t-xl sm:rounded-xl relative z-10">
        <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 className="text-gray-800 uppercase text-xs tracking-widest font-black italic">
            Pedido #{orderId.slice(-6).toUpperCase()}
          </h2>
          <button className="text-gray-400 hover:text-gray-600 p-2" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {isLoading && (<div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div>)}

          {!isLoading && order ? (
            <>
              <section className="space-y-2 border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Atual</h3>
                  {getStatusBadge(order.status)}
                </div>
                <select
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={order.status || "pending"}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updateStatus.isPending}
                >
                  {Object.keys(statusLabels).map(status => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </section>

              <section className="space-y-3 border-b pb-4">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente & Entrega</h3>
                <div className="text-sm space-y-1">
                  <p className="font-black text-slate-900 uppercase italic flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" /> {order.customerName || "—"}
                  </p>
                  <p className="text-slate-500 pl-6 text-xs font-bold">{order.customerEmail}</p>
                  <p className="text-slate-500 pl-6 text-xs font-bold">{order.customerPhone || "Sem telefone"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-sm text-slate-700 mt-2 border border-slate-100">
                  <p className="font-black mb-1 text-[9px] uppercase text-slate-400 tracking-widest">Endereço de Entrega</p>
                  {order.shippingAddress ? (
                    <>
                      <p className="font-bold text-slate-800">{order.shippingAddress}</p>
                      <p className="text-slate-500 text-xs font-bold">{order.shippingCity} - {order.shippingState}</p>
                      <p className="text-slate-500 text-xs font-mono">{order.shippingZipCode}</p>
                    </>
                  ) : (
                    <p className="italic text-slate-400 text-xs font-bold">Retirada ou não informado</p>
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Itens do Pedido</h3>
                <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 bg-white overflow-hidden">
                  {items.map((item) => (
                    <div key={item.id} className="px-3 py-3 text-sm flex justify-between gap-3">
                      <div className="flex gap-3 items-start">
                        <div className="bg-emerald-50 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black text-emerald-600 shrink-0 border border-emerald-100">
                          {item.quantity}x
                        </div>
                        <div>
                          <div className="font-black text-slate-800 leading-tight uppercase italic text-xs">
                            {item.dishName || "Item removido"}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                             Unit: R$ {Number(item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="font-black text-slate-900 shrink-0 italic">
                        R$ {Number(item.totalPrice).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2 pt-2 pb-6">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Pagamento</span>
                  <span className="text-slate-800">{order.paymentMethod || "—"}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                    <span className="text-slate-900 font-black text-xs uppercase tracking-widest">TOTAL</span>
                    <span className="text-emerald-700 font-black text-2xl italic tracking-tighter">R$ {Number(order.total).toFixed(2)}</span>
                </div>
              </section>
            </>
          ) : (
             <p className="text-xs text-red-500 text-center py-10 font-black uppercase">Erro ao carregar pedido.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- PÁGINA PRINCIPAL ---

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading } = trpc.admin.orders.list.useQuery({
    page,
    perPage: 20, 
    status,
    search: search || undefined,
  });

  const orders = (data as unknown as { orders: OrderListItem[] })?.orders ?? [];

  const getStatusBadge = (status: string | null) => {
    const safeStatus = status || "pending";
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      preparing: "bg-indigo-100 text-indigo-800",
      shipped: "bg-purple-100 text-purple-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-200 text-gray-700",
      failed: "bg-red-200 text-red-900"
    };
    return <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${map[safeStatus] || "bg-gray-100"}`}>
      {statusLabels[safeStatus] ?? safeStatus}
    </span>;
  };

  return (
    <div className="flex flex-col gap-4 p-2 md:p-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-emerald-800">Gestão de Pedidos</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold uppercase placeholder:text-slate-300"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm w-full sm:w-40 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-black uppercase"
            value={status || ""}
            onChange={(e) => setStatus(e.target.value || undefined)}
          >
            <option value="">Status</option>
            {Object.keys(statusLabels).map(s => (<option key={s} value={s}>{statusLabels[s]}</option>))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />
            <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sincronizando encomendas...</p>
        </div>
      ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mx-2">
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum pedido encontrado.</p>
          </div>
      ) : (
        <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">#</th>
                <th className="px-6 py-4 text-left">Cliente</th>
                <th className="px-6 py-4 text-left">Total</th>
                <th className="px-6 py-4 text-left">Pgto</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4">
                      <div className="font-black text-slate-900 uppercase italic">{order.customerName || "—"}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-45">
                        {order.customerEmail || "—"}
                      </div>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900 italic tracking-tighter text-base">
                    R$ {Number(order.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {order.paymentMethod || "—"}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedOrderId(order.id)} 
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE LIST */}
      <div className="md:hidden space-y-3 px-2">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm active:bg-slate-50 transition-colors" onClick={() => setSelectedOrderId(order.id)}>
             <div className="flex justify-between items-start mb-2">
               <div>
                 <span className="text-[9px] font-black text-slate-300 uppercase block leading-none mb-1">ID #{order.id.slice(-6).toUpperCase()}</span>
                 <h3 className="font-black text-slate-800 uppercase italic tracking-tighter leading-none">{order.customerName}</h3>
               </div>
               {getStatusBadge(order.status)}
             </div>
             <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
               <span className="text-xl font-black text-slate-900 italic tracking-tighter">R$ {Number(order.total).toFixed(2)}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.paymentMethod}</span>
             </div>
          </div>
        ))}
      </div>

      {selectedOrderId && (
        <OrderDetailsDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}