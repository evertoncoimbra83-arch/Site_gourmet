import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  Calendar, 
  Package, 
  Loader2, 
  MapPin, 
  Star, 
  Receipt 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemDetailsDisplay } from "@/_core/shared/ItemDetailsDisplay.tsx";

const formatCurrency = (val: any) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(val || 0));

const formatDate = (date: any) =>
  date
    ? new Date(date).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

// ✅ Função para limpar o endereço caso venha em formato JSON
const formatAddress = (order: any) => {
  if (order.shippingType === 'pickup' || order.shippingAddress === 'Retirada') {
    return "Retirada no Local";
  }

  try {
    // Se o endereço começar com {, tenta parsear como JSON
    if (order.shippingAddress?.startsWith('{')) {
      const parsed = JSON.parse(order.shippingAddress);
      const street = parsed.street || parsed.text || "";
      const number = parsed.number || order.shippingAddressNumber || "";
      const neighborhood = parsed.neighborhood || order.shippingNeighborhood || "";
      return `${street}${number ? `, ${number}` : ""}${neighborhood ? ` - ${neighborhood}` : ""}`;
    }
  } catch (e) {
    console.error("Erro ao formatar endereço JSON", e);
  }

  // Fallback para campos normais
  return (
    <>
      {order.shippingAddress}{order.shippingAddressNumber ? `, ${order.shippingAddressNumber}` : ''}
      {order.shippingNeighborhood && ` - ${order.shippingNeighborhood}`}
      {order.shippingComplement && ` (${order.shippingComplement})`}
    </>
  );
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Preparo",
  shipped: "Em Rota",
  delivered: "Entregue",
  cancelled: "Cancelado",
  completed: "Concluído",
};

export function OrdersTab({
  orders = [],
  isLoading,
}: {
  orders: any[];
  isLoading: boolean;
}) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | number | null>(null);

  const sortedOrders = useMemo(() => {
    return Array.isArray(orders) ? [...orders] : [];
  }, [orders]);

  if (isLoading)
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#2D5A3D]" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
          Sincronizando pedidos...
        </p>
      </div>
    );

  if (sortedOrders.length === 0)
    return (
      <div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
        <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
          Nenhum pedido encontrado.
        </p>
      </div>
    );

  return (
    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {sortedOrders.map((order) => {
        const isExpanded = String(expandedOrderId) === String(order.id);
        const hasLoyalty = (order.loyaltyPointsEarned || 0) > 0 || (order.loyaltyPointsUsed || 0) > 0;

        return (
          <Card
            key={order.id}
            className={cn(
              "rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white transition-all duration-500",
              isExpanded ? "ring-2 ring-[#2D5A3D]/10 border-[#2D5A3D]/30 shadow-xl scale-[1.01]" : "hover:shadow-md"
            )}
          >
            {/* Header do Card */}
            <div
              className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
            >
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    "p-4 rounded-[2rem] transition-all duration-500",
                    isExpanded ? "bg-[#2D5A3D] text-white rotate-12" : "bg-slate-50 text-slate-400"
                  )}
                >
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-black text-slate-900 italic uppercase text-lg tracking-tighter">
                      #{order.id}
                    </span>
                    <Badge
                      className={cn(
                        "rounded-full text-[9px] font-black uppercase tracking-widest px-3 border",
                        statusStyles[order.status] || "bg-slate-100 text-slate-500"
                      )}
                    >
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right bg-slate-50/80 px-6 py-2 rounded-2xl border border-slate-100">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Total Pago</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>

            {/* Detalhes Expandidos */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-white animate-in slide-in-from-top-4 duration-500">
                
                {/* 📍 Seção de Entrega (Corrigida para não mostrar JSON) */}
                <div className="px-6 py-4 bg-slate-50/30 flex items-start gap-3 border-b border-slate-50">
                  <MapPin size={16} className="text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entregue em</p>
                    <p className="text-xs font-bold text-slate-700">
                      {formatAddress(order)}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Resumo dos Itens */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Itens do Pedido</p>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item: any, idx: number) => (
                        <ItemDetailsDisplay key={idx} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* 💰 Detalhamento Financeiro e Fidelidade */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Financeiro */}
                    <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 space-y-2">
                      <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Receipt size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Resumo Financeiro</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>Frete</span>
                        <span>{formatCurrency(order.shippingCost)}</span>
                      </div>
                      {Number(order.totalDiscount) > 0 && (
                        <div className="flex justify-between text-xs font-black text-emerald-600 italic">
                          <span>Descontos Aplicados</span>
                          <span>- {formatCurrency(order.totalDiscount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Fidelidade */}
                    {hasLoyalty && (
                      <div className="bg-orange-50/50 rounded-3xl p-4 border border-orange-100/50 space-y-2">
                        <div className="flex items-center gap-2 mb-2 text-orange-400">
                          <Star size={12} fill="currentColor" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Pontos Fidelidade</span>
                        </div>
                        {order.loyaltyPointsEarned > 0 && (
                          <div className="flex justify-between text-xs font-bold text-orange-700">
                            <span>Pontos Ganhos</span>
                            <span className="bg-orange-200/50 px-2 py-0.5 rounded-lg">+{order.loyaltyPointsEarned}</span>
                          </div>
                        )}
                        {order.loyaltyPointsUsed > 0 && (
                          <div className="flex justify-between text-xs font-bold text-red-600">
                            <span>Pontos Utilizados</span>
                            <span className="bg-red-100 px-2 py-0.5 rounded-lg">-{order.loyaltyPointsUsed}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer de Pagamento */}
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center bg-slate-50/50 p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Forma de Pagamento
                  </span>
                  <Badge variant="outline" className="rounded-xl border-slate-200 font-black text-slate-600 uppercase italic text-[10px]">
                    {order.paymentMethod || "Não informado"}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}