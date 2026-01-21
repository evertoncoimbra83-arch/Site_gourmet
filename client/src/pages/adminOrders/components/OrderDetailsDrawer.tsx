import { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print"; 
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { X, Loader2, RotateCcw, Edit3 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { statusLabels } from "../logic/useAdminOrders"; 

// Importação dos seus novos subcomponentes da pasta orderDrawer
import { AdminOrderCustomer } from "./orderDrawer/AdminOrderCustomer";
import { AdminOrderItems } from "./orderDrawer/AdminOrderItems";
import { AdminOrderPayment } from "./orderDrawer/AdminOrderPayment";

import OrderPrintTemplate from "./OrderPrintTemplate"; 
import { OrderLabelsTemplate } from "./OrderLabelsTemplate"; 

export function OrderDetailsDrawer({ orderId, onClose, onUpdateStatus, onUpdateOrder, isUpdating }: any) {
  const utils = trpc.useUtils();
  
  // 1. Busca os dados do pedido
  const { data: order, isLoading, refetch } = trpc.admin.orders.getById.useQuery({ id: String(orderId) });
  
  const ticketRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [printItem, setPrintItem] = useState<any>(null);

  // 2. Sincroniza o estado local de edição quando o pedido carrega
  useEffect(() => {
    if (order) {
      setEditForm({
        userId: order.userId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        shippingAddressNumber: order.shippingAddressNumber,
        shippingAddressComplement: order.shippingAddressComplement,
        shippingNeighborhood: order.shippingNeighborhood,
        shippingCity: order.shippingCity || "", 
        total: Number(order.total),
        items: [...(order.items || [])]
      });
    }
  }, [order]);

  const handlePrintTicket = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket_#${orderId}`,
  });

  const handlePrintLabel = useReactToPrint({
    contentRef: labelRef,
    documentTitle: `Etiqueta_Item`,
    onAfterPrint: () => setPrintItem(null)
  });

  useEffect(() => {
    if (printItem) {
      setTimeout(() => handlePrintLabel(), 100);
    }
  }, [printItem]);

  const handleSaveEdit = async () => {
    try {
      await onUpdateOrder({ id: String(orderId), ...editForm });
      setIsEditing(false);
      refetch();
      toast.success("Pedido atualizado!");
    } catch (err) {
      toast.error("Erro ao salvar");
    }
  };

  if (isLoading || !editForm || !order) return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white flex items-center justify-center border-l shadow-2xl">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#FBFBFC] h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-100 animate-in slide-in-from-right">
        
        {/* ÁREA DE IMPRESSÃO (Oculta ao usuário) */}
        <div className="hidden">
           <div ref={ticketRef}><OrderPrintTemplate order={order} /></div>
           <div ref={labelRef}>
              {printItem && <OrderLabelsTemplate order={order} item={printItem} showNutrition={true} />}
           </div>
        </div>

        {/* HEADER */}
        <div className="p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black uppercase text-slate-900 italic tracking-tighter">
              Pedido <span className="text-emerald-600">#{orderId}</span>
            </h2>
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(!isEditing)} size="sm" variant={isEditing ? "destructive" : "outline"} className="h-9 rounded-xl font-black uppercase text-[10px]">
                {isEditing ? <RotateCcw size={14} /> : <Edit3 size={14} />} {isEditing ? "Cancelar" : "Editar"}
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}><X size={20} /></Button>
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 ml-2">Fluxo:</span>
              <select 
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                className="flex-1 bg-transparent border-none text-xs font-black uppercase text-emerald-600 outline-none cursor-pointer"
              >
                {Object.entries(statusLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CONTEÚDO SCROLLÁVEL COM COMPONENTES REFATORADOS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
          
          <AdminOrderCustomer 
            order={order}
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />

          <AdminOrderItems 
            items={editForm.items}
            isEditing={isEditing}
            onPrintLabel={(item: any) => setPrintItem(item)}
          />

          <AdminOrderPayment 
            order={order}
            isEditing={isEditing}
            isUpdating={isUpdating}
            onSave={handleSaveEdit}
            onPrint={handlePrintTicket}
          />

        </div>
      </div>
    </div>
  );
}