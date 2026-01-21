import { User, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { statusLabels } from "../../logic/useAdminOrders";

export function AdminOrderCustomer({ order, isEditing, editForm, setEditForm }: any) {
  return (
    <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <User size={14} className="text-emerald-500" />
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Identificação</h3>
        </div>
        
        {isEditing ? (
          <Input 
            value={editForm.customerName} 
            onChange={e => setEditForm({...editForm, customerName: e.target.value})} 
            className="h-10 text-xs font-bold uppercase border-emerald-100 mb-2 rounded-xl" 
          />
        ) : (
          <p className="font-black text-slate-800 uppercase italic text-sm leading-none mb-2">
            {order.customerName}
          </p>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-500">
            <Mail size={12} />
            <span className="text-[10px] font-bold">{order.customerEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-600">
            <Phone size={12} />
            <span className="text-[10px] font-black">{order.customerPhone}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-slate-400" />
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {order.deliveryType === 'pickup' ? 'Retirada no Local' : 'Logística de Entrega'}
          </h3>
        </div>
        
        <p className="text-[11px] font-bold text-slate-700 uppercase leading-tight">
          {editForm.shippingAddress}, {editForm.shippingAddressNumber}
          {editForm.shippingAddressComplement && ` - ${editForm.shippingAddressComplement}`}
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
          {editForm.shippingNeighborhood} — {editForm.shippingCity}/{editForm.shippingState}
        </p>

        {order.deliveryType === 'pickup' && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-black text-amber-700 uppercase">Atenção: Cliente retira no balcão</span>
          </div>
        )}
      </div>
    </section>
  );
}