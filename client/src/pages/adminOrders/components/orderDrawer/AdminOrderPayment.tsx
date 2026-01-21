import { Printer, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusLabels } from "../../logic/useAdminOrders";

export function AdminOrderPayment({ order, isEditing, isUpdating, onSave, onPrint }: any) {
  const discounts = typeof order.discounts_snapshot === 'string' 
    ? JSON.parse(order.discounts_snapshot) 
    : (order.discounts_snapshot || {});
  const totals = discounts.totals || {};

  return (
    <section className={cn("p-6 rounded-[2.5rem] shadow-2xl transition-all", isEditing ? "bg-emerald-600" : "bg-slate-900")}>
      <div className="space-y-4 text-white">
        {!isEditing && (
          <div className="grid grid-cols-2 gap-2 border-b border-white/10 pb-4 mb-4">
            <div className="space-y-1">
              <span className="text-[8px] font-black opacity-40 uppercase block">Subtotal</span>
              <span className="text-xs font-bold">R$ {Number(totals.subtotal || order.total).toFixed(2)}</span>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[8px] font-black opacity-40 uppercase block">Pagamento</span>
              <span className="text-xs font-black text-emerald-400 uppercase italic">{order.paymentMethod || 'PIX'}</span>
            </div>
            
            <div className="col-span-2 pt-2 space-y-1 border-t border-white/5 mt-1">
              {totals.couponDiscount > 0 && (
                <div className="flex justify-between text-[10px] font-bold text-rose-300 uppercase">
                  <span>Cupom ({discounts.couponCode}):</span>
                  <span>- R$ {Number(totals.couponDiscount).toFixed(2)}</span>
                </div>
              )}
              {totals.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-[10px] font-bold text-amber-300 uppercase">
                  <span>Fidelidade/Cashback:</span>
                  <span>- R$ {Number(totals.loyaltyDiscount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="text-[10px] font-black opacity-40 uppercase italic block">Total do Pedido</span>
            <span className="text-4xl font-black italic leading-none tracking-tighter">
              R$ {Number(totals.total || order.total).toFixed(2)}
            </span>
          </div>
          {!isEditing && (
            <Button onClick={onPrint} size="sm" className="bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px]">
              <Printer size={14} className="mr-2" /> Imprimir
            </Button>
          )}
        </div>

        {isEditing && (
          <Button onClick={onSave} disabled={isUpdating} className="w-full mt-4 bg-white text-emerald-600 font-black h-16 rounded-[1.5rem] uppercase text-xs">
            {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
            Salvar Alterações
          </Button>
        )}
      </div>
    </section>
  );
}