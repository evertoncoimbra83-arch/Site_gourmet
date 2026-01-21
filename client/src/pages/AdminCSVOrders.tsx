import { useState } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/_core/trpc";
import { Loader2, X, Calendar, User, CreditCard } from "lucide-react"; 

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Em Processamento",
  paid: "Pago",
  preparing: "Em Preparo",
  shipped: "Enviado",
  completed: "Concluído",
  cancelled: "Cancelado", // Atenção: banco pode ter cancelled ou canceled, ajustado para cancelled
  refunded: "Estornado",
  failed: "Falhou"
};

// --- COMPONENTE DETALHES ---
type OrderDetailsDrawerProps = {
  orderId: number;
  onClose: () => void;
};

function OrderDetailsDrawer({ orderId, onClose }: OrderDetailsDrawerProps) {
  const { data, isLoading } = trpc.admin.orders.get.useQuery({ id: orderId });
  const utils = trpc.useUtils();
  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.orders.list.invalidate();
      utils.admin.orders.get.invalidate({ id: orderId });
    },
  });

  const order = data?.order;
  const items = data?.items ?? [];

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ id: orderId, status: status as any });
  };
  
  const getStatusBadge = (status: string | null) => {
    const safeStatus = status || "pending";
    const map: any = {
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
          <h2 className="font-semibold text-gray-800">
            Detalhes Pedido #{orderId}
          </h2>
          <button className="text-gray-400 hover:text-gray-600 p-2" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (<div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#2D5A3D]" /></div>)}

          {!isLoading && order ? (
            <>
              {/* STATUS */}
              <section className="space-y-2 border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Status Atual</h3>
                  {getStatusBadge(order.status)}
                </div>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
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

              {/* DADOS DO CLIENTE */}
              <section className="space-y-3 border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-700">Cliente & Entrega</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> {order.customerName || "—"}
                  </p>
                  <p className="text-gray-500 pl-6 text-xs">{order.customerEmail}</p>
                  <p className="text-gray-500 pl-6 text-xs">{order.customerPhone || "Sem telefone"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mt-2">
                  <p className="font-medium mb-1 text-xs uppercase text-gray-400">Endereço de Entrega</p>
                  {order.shippingAddress ? (
                    <>
                      <p>{order.shippingAddress}</p>
                      <p className="text-gray-500 text-xs">{order.shippingCity} - {order.shippingState}</p>
                      <p className="text-gray-500 text-xs">{order.shippingZipCode}</p>
                    </>
                  ) : (
                    <p className="italic text-gray-400">Retirada ou não informado</p>
                  )}
                </div>
              </section>

              {/* ITENS */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Itens do Pedido</h3>
                <div className="border rounded-lg divide-y bg-white overflow-hidden">
                  {items.map((item) => (
                    <div key={item.id} className="px-3 py-3 text-sm flex justify-between gap-3">
                      <div className="flex gap-3 items-start">
                        <div className="bg-gray-100 w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-gray-600 shrink-0">
                          {item.quantity}x
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 leading-tight">
                            {item.dishName || "Item removido"}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                             Unit: R$ {Number(item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold text-gray-800 shrink-0">
                        R$ {Number(item.totalPrice).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* RESUMO */}
              <section className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Método de Pagamento</span>
                  <span className="font-medium text-gray-800">{order.paymentMethod || "—"}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t mt-2">
                    <span className="text-gray-800">TOTAL</span>
                    <span className="text-[#2D5A3D] text-xl">R$ {Number(order.total).toFixed(2)}</span>
                </div>
              </section>
            </>
          ) : (
             <p className="text-sm text-red-500">Erro ao carregar pedido.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data, isLoading } = trpc.admin.orders.list.useQuery({
    page,
    limit: 20,
    status,
    search: search || undefined,
  });

  const orders = data?.data ?? [];
  const totalPages = data?.meta?.pageCount ?? 1;

  const getStatusBadge = (status: string | null) => {
    const safeStatus = status || "pending";
    const map: any = {
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

  return (
    <div className="flex flex-col gap-4 p-2 md:p-4 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#2D5A3D]">Gerenciar Pedidos</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="px-3 py-2 border rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="px-3 py-2 border rounded-lg text-sm w-full sm:w-40 bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]"
            value={status || ""}
            onChange={(e) => setStatus(e.target.value || undefined)}
          >
            <option value="">Todos status</option>
            {Object.keys(statusLabels).map(s => (<option key={s} value={s}>{statusLabels[s]}</option>))}
          </select>
        </div>
      </div>

      {/* LOADING */}
      {isLoading && (
        <div className="text-center py-12">
            <Loader2 className="animate-spin h-8 w-8 mx-auto text-[#2D5A3D]" />
            <p className="text-gray-500 mt-2">Carregando pedidos...</p>
        </div>
      )}

      {!isLoading && orders.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">Nenhum pedido encontrado.</p>
          </div>
      )}

      {/* DESKTOP (TABELA) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Pagamento</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 font-mono text-gray-600">#{order.id}</td>
                <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{order.customerName || "—"}</div>
                    <div className="text-xs text-gray-400">{order.customerEmail}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">R$ {Number(order.total).toFixed(2)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{order.paymentMethod || "—"}</td>
                <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => setSelectedOrderId(order.id as number)} 
                    className="px-3 py-1.5 text-xs font-medium text-[#2D5A3D] border border-[#2D5A3D] rounded-lg hover:bg-[#2D5A3D] hover:text-white transition-colors"
                  >
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE (CARDS) */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 active:bg-gray-50 transition-colors" onClick={() => setSelectedOrderId(order.id as number)}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-500 text-sm">#{order.id}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-800 mt-1">{order.customerName || "Cliente Desconhecido"}</h3>
                </div>
                {getStatusBadge(order.status)}
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                    <div className="flex items-center gap-1 mb-1">
                        <CreditCard className="w-3 h-3" /> {order.paymentMethod || "Não informado"}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-400 block mb-0.5">Total</span>
                    <span className="text-xl font-bold text-[#2D5A3D]">R$ {Number(order.total).toFixed(2)}</span>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINAÇÃO */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-center md:justify-end gap-2 text-sm text-gray-600 pt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">Anterior</button>
          <span className="font-medium">Pág. {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">Próxima</button>
        </div>
      )}

      {selectedOrderId && (
        <OrderDetailsDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}