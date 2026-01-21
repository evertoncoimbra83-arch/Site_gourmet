import { useState, useRef, useEffect } from "react";
import { useAdminOrders, statusLabels } from "../logic/useAdminOrders";
import { OrderDetailsDrawer } from "../components/OrderDetailsDrawer";
import { OrderPrintCenter } from "../components/OrderPrintCenter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/_core/trpc";
import { 
  Search, 
  Printer, 
  Loader2, 
  Tag, 
  Trash2, 
  Edit3
} from "lucide-react"; 
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import OrderPrintTemplate from "./../components/OrderPrintTemplate";

export function AdminOrdersView() {
  const { state, actions, orders, mutations } = useAdminOrders();
  const utils = trpc.useUtils();
  
  // Controle do Modo Studio Zebra (Etiquetas)
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

  // Lógica de Impressão de Ticket Rápido (Recibo Térmico)
  const [ticketId, setTicketId] = useState<string | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Busca os dados completos apenas quando o usuário clica na impressora
  const { data: fullOrderTicket, isLoading: isLoadingTicketData } = trpc.admin.orders.getById.useQuery(
    { id: ticketId as string },
    { 
      enabled: !!ticketId,
      staleTime: 1000 * 60 // Evita refetch desnecessário se imprimir o mesmo pedido em sequência
    }
  );

  const handlePrintTicket = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket_#${ticketId}`,
    onAfterPrint: () => setTicketId(null),
  });

  // Dispara a impressão assim que os dados chegam do servidor
  useEffect(() => {
    if (fullOrderTicket && ticketId === String(fullOrderTicket.id)) {
      const timer = setTimeout(() => {
        handlePrintTicket();
      }, 200); // Delay de segurança para garantir a renderização do template
      return () => clearTimeout(timer);
    }
  }, [fullOrderTicket, ticketId, handlePrintTicket]);

  // Modo Studio Zebra (Tela Cheia)
  if (printingOrderId) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <OrderPrintCenter 
          orderId={printingOrderId} 
          onBack={() => setPrintingOrderId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em]">
            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" /> 
            Monitor de Produção
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Fluxo de <span className="text-emerald-600">Vendas</span>
          </h1>
        </div>
      </header>

      {/* BARRA DE PESQUISA */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <Input 
          placeholder="BUSCAR POR ID OU NOME DO CLIENTE..." 
          className="h-14 pl-14 rounded-2xl bg-white border-none shadow-sm font-bold text-xs tracking-widest uppercase focus-visible:ring-emerald-500/20 transition-all" 
          value={state.search} 
          onChange={e => actions.setSearch(e.target.value)} 
        />
      </div>

      {/* TABELA DE PEDIDOS */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ID</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data/Hora</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                <th className="p-6 text-right text-slate-400 text-[10px] font-black uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {state.isLoading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-emerald-600" size={32} />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400 font-bold uppercase text-xs italic">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-6 font-black text-slate-400 text-xs">#{order.id}</td>
                    <td className="p-6">
                      <div className="font-bold uppercase text-slate-700 text-sm truncate max-w-[200px]">
                        {order.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{order.customerPhone}</div>
                    </td>
                    <td className="p-6 text-slate-500 font-medium text-[11px]">
                      {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yy HH:mm") : "---"}
                    </td>
                    <td className="p-6 text-center">
                      <select 
                        value={order.status}
                        onChange={(e) => mutations.updateStatus.mutate({ id: order.id, status: e.target.value })}
                        className={cn(
                          "appearance-none px-4 py-2 rounded-xl font-black text-[10px] uppercase outline-none cursor-pointer transition-all",
                          order.status === 'delivered' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {Object.entries(statusLabels).map(([val, label]) => (
                          <option key={val} value={val}>{label as string}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-6 text-right font-black text-slate-900 italic">
                      R$ {Number(order.total || 0).toFixed(2)}
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        {/* 🖨️ TICKET RÁPIDO */}
                        <Button 
                          variant="ghost" size="icon" 
                          className={cn(
                            "h-10 w-10 rounded-xl transition-all",
                            ticketId === order.id ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white"
                          )}
                          onClick={() => setTicketId(order.id)}
                          disabled={!!ticketId}
                        >
                          {ticketId === order.id ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>}
                        </Button>

                        {/* 🏷️ STUDIO ZEBRA */}
                        <Button 
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-600 hover:text-white transition-all"
                          onClick={() => setPrintingOrderId(order.id)}
                        >
                          <Tag size={18}/>
                        </Button>

                        {/* 📝 EDITAR */}
                        <Button 
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition-all"
                          onClick={() => actions.setSelectedOrderId(order.id)}
                        >
                          <Edit3 size={18}/>
                        </Button>
                        
                        {/* 🗑️ EXCLUIR */}
                        <Button 
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-red-50 text-red-300 hover:text-red-600 hover:bg-red-100 transition-all"
                          onClick={() => confirm("Deseja realmente excluir este pedido?") && mutations.deleteOrder.mutate({ id: order.id })}
                        >
                          <Trash2 size={18}/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER DE DETALHES/EDIÇÃO */}
      {state.selectedOrderId && (
        <OrderDetailsDrawer 
          orderId={state.selectedOrderId} 
          onClose={() => actions.setSelectedOrderId(null)}
          onUpdateStatus={(id: string, status: string) => mutations.updateStatus.mutate({ id, status })}
          onUpdateOrder={(data: any) => mutations.updateOrder.mutate(data)}
          isUpdating={mutations.updateOrder.isPending}
        />
      )}

      {/* ÁREA OCULTA PARA IMPRESSÃO DE TICKET */}
      <div className="sr-only" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={ticketRef}>
          {fullOrderTicket && <OrderPrintTemplate order={fullOrderTicket} />}
        </div>
      </div>
    </div>
  );
}