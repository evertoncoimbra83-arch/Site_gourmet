import { useSearch } from "wouter";
import { trpc } from "@/_core/trpc";
import { Loader2, CheckCircle } from "lucide-react";

export default function SuccessPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  // ✅ Usa rota PÚBLICA para evitar erros de sessão
  const { data: order, isLoading, error } = trpc.orders.getPublicDetail.useQuery(
    { orderId: orderId || "" },
    { enabled: !!orderId, retry: 2 }
  );

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );

  if (!orderId || error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-xl font-bold text-red-600">Pedido não encontrado.</h2>
        <a href="/meus-pedidos" className="bg-slate-900 text-white px-6 py-2 rounded-full">
          Ver Meus Pedidos
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-in fade-in">
      <CheckCircle className="h-16 w-16 text-emerald-500 mb-6" />
      <h1 className="text-3xl font-bold text-slate-800">Pedido Confirmado!</h1>
      <p className="text-slate-500 mt-2">Obrigado, {order.customerName}.</p>
      <div className="bg-white p-6 rounded-xl shadow-sm border mt-8 w-full max-w-md">
        <div className="flex justify-between border-b pb-4">
          <span className="text-slate-500">Pedido</span>
          <span className="font-mono font-bold">#{order.id}</span>
        </div>
        <div className="flex justify-between pt-4">
          <span className="text-slate-500">Total</span>
          <span className="font-bold text-emerald-700">
            R$ {Number(order.total).toFixed(2)}
          </span>
        </div>
      </div>
      <a
        href="/meus-pedidos"
        className="mt-8 text-emerald-600 font-bold hover:underline"
      >
        Acompanhar Pedido
      </a>
    </div>
  );
}
