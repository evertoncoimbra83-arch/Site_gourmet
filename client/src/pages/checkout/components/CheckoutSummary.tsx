import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Tag, Sparkles, ShoppingBag, ArrowRight, 
  CheckCircle2, Store, Truck, Wallet2, Hash, Utensils 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/_core/CartContext"; 
import type { CheckoutVM } from "../logic/useCheckoutLogic"; 

/* --------------------------- COMPONENTES VISUAIS --------------------------- */

const SummaryRow = ({ label, value, color, icon }: any) => (
  <div className="flex justify-between text-[11px] items-center italic uppercase font-bold text-slate-400">
    <span className="flex items-center tracking-wider">{icon}{label}</span>
    <span className={cn("text-slate-900 font-black", color)}>{value}</span>
  </div>
);

const DiscountBadge = ({ icon, label, value, variant }: any) => {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  };
  return (
    <div className={cn("flex justify-between items-center px-4 py-2.5 rounded-2xl border animate-in fade-in slide-in-from-right-2", styles[variant as keyof typeof styles])}>
      <span className="flex items-center gap-2 text-[9px] font-black uppercase italic leading-none">{icon} {label}</span>
      <span className="text-xs font-black italic">-{value}</span>
    </div>
  );
};

/* --------------------------- COMPONENTE PRINCIPAL -------------------------- */

export default function CheckoutSummary(vm: CheckoutVM) {
  const { items: cartItems, money, cart: contextCart, totals: ctxTotals } = useCart();

  const discountData = useMemo(() => {
    const raw = (vm.cart as any)?.discounts_json || (vm.cart as any)?.discountsJson || (contextCart as any)?.discounts_json;
    let json: any = {};
    try { json = typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { json = {}; }
    const d = json.details || {};

    return {
      autoName: vm.autoDiscountName || json.autoDiscountName || "Desconto Progressivo",
      autoDiscount: vm.autoDiscount > 0 ? vm.autoDiscount : Number(d.autoDiscount || 0),
      couponDiscount: vm.couponDiscount > 0 ? vm.couponDiscount : Number(d.couponDiscount || 0),
      couponCode: vm.couponCode || d.couponCode || "",
      loyaltyDiscount: vm.loyaltyDiscount > 0 ? vm.loyaltyDiscount : Number(d.loyaltyDiscount || 0),
      subtotal: vm.subtotal || Number(d.subtotal || ctxTotals.subtotal || 0),
    };
  }, [vm, contextCart, ctxTotals]);

  // 2. Processamento Inteligente de Itens (Suporta Pratos e Kits/Pacotes)
  const processedItems = useMemo(() => {
    return cartItems.map((item: any) => {
      const rawOpts = item.optionsJson || item.options || item.accompaniments;
      let opts: any = {};
      try {
        opts = typeof rawOpts === "string" && rawOpts.startsWith("{") ? JSON.parse(rawOpts) : (rawOpts || {});
      } catch { opts = {}; }

      // Caso A: É um PACOTE/KIT (contém um array de 'meals')
      if (Array.isArray(opts.meals)) {
        return {
          ...item,
          isPackage: true,
          details: opts.meals.map((m: any) => ({
            slotName: m.slotName,
            dishName: m.dishName,
            accs: Array.isArray(m.accompaniments) ? m.accompaniments.map((a: any) => a.name || a) : []
          }))
        };
      }

      // Caso B: É um PRATO INDIVIDUAL
      const accs = Array.isArray(opts.selectedAccompaniments) 
        ? opts.selectedAccompaniments.map((a: any) => a.name || a) 
        : (Array.isArray(opts.accompaniments) ? opts.accompaniments.map((a: any) => a.name || a) : []);

      return {
        ...item,
        isPackage: false,
        displaySize: opts._sizeLabel || opts.sizeLabel || opts.size?.name || null,
        displayAccs: accs
      };
    });
  }, [cartItems]);

  if (!vm || !vm.cart) return null;

  return (
    <Card className="border-slate-100 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden sticky top-24">
      <CardHeader className="px-8 pt-8 pb-4 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-2 text-slate-900 font-black uppercase italic tracking-tighter">
          <ShoppingBag className="text-emerald-600" size={18} />
          <CardTitle className="text-lg">Revisão do Pedido</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {processedItems.map((item: any) => (
            <div key={item.id} className="border border-slate-100 rounded-[1.8rem] p-5 bg-slate-50/30 space-y-3">
              <div className="flex justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded italic">
                      {item.quantity}x
                    </span>
                    <p className="font-black text-[11px] text-slate-900 uppercase italic leading-tight">{item.name}</p>
                  </div>
                  {!item.isPackage && item.displaySize && (
                    <p className="text-[9px] text-emerald-600 font-black mt-1 uppercase italic flex items-center gap-1">
                      <Hash size={8} /> {item.displaySize}
                    </p>
                  )}
                </div>
                <p className="font-black text-xs text-slate-900 italic">
                  {money((item.unitPrice || item.price || 0) * item.quantity)}
                </p>
              </div>

              {/* RENDERIZAÇÃO PARA KIT (MARMITAS) */}
              {item.isPackage ? (
                <div className="space-y-3 pt-2 border-t border-slate-200/50">
                  {item.details.map((meal: any, idx: number) => (
                    <div key={idx} className="bg-white/50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">{meal.slotName}</p>
                      <p className="text-[10px] font-bold text-slate-700 italic flex items-center gap-1">
                        <Utensils size={10} className="text-slate-400" /> {meal.dishName}
                      </p>
                      {meal.accs.length > 0 && (
                        <p className="text-[9px] text-slate-400 mt-1 pl-3 border-l border-slate-200 ml-1">
                          {meal.accs.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* RENDERIZAÇÃO PARA PRATO INDIVIDUAL */
                item.displayAccs.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/50">
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed italic">
                      <span className="uppercase not-italic text-[8px] mr-1 text-slate-300 font-black">Adicionais:</span>
                      {item.displayAccs.join(", ")}
                    </p>
                  </div>
                )
              )}
            </div>
          ))}
        </div>

        {/* FINANCEIRO */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <SummaryRow label="Subtotal" value={money(discountData.subtotal)} />
          <SummaryRow 
            label={vm.selectedShippingType === "pickup" ? "Retirada" : "Entrega"} 
            value={vm.shippingCost === 0 ? "GRÁTIS" : money(vm.shippingCost)} 
            color="text-emerald-600 font-black"
            icon={vm.selectedShippingType === "pickup" ? <Store size={12} className="mr-1" /> : <Truck size={12} className="mr-1" />}
          />
        </div>

        <div className="space-y-2">
          {discountData.couponDiscount > 0 && (
            <DiscountBadge icon={<Tag size={12}/>} label={`CUPOM: ${discountData.couponCode}`} value={money(discountData.couponDiscount)} variant="amber" />
          )}
          {discountData.autoDiscount > 0 && (
            <DiscountBadge icon={<Sparkles size={12}/>} label={discountData.autoName} value={money(discountData.autoDiscount)} variant="emerald" />
          )}
          {discountData.loyaltyDiscount > 0 && (
            <DiscountBadge icon={<CheckCircle2 size={12}/>} label="PONTOS FIDELIDADE" value={money(discountData.loyaltyDiscount)} variant="emerald" />
          )}
          {vm.paymentDiscountAmount > 0 && (
            <DiscountBadge icon={<Wallet2 size={12}/>} label="DESCONTO PAGAMENTO" value={money(vm.paymentDiscountAmount)} variant="blue" />
          )}
        </div>

        <div className="pt-6 mt-2 border-t border-slate-100 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pb-1">Total Final</span>
            {vm.paymentDiscountAmount > 0 && <span className="text-[9px] font-bold text-blue-600 uppercase italic">Economia aplicada!</span>}
          </div>
          <span className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">
            {money(vm.finalTotal)}
          </span>
        </div>

        <Button
          onClick={vm.handlePlaceOrder}
          disabled={vm.isSubmitting || !vm.isCPFValid || (vm.selectedShippingType === 'delivery' && vm.isDeliveryBlocked)}
          className={cn(
            "w-full h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95",
            vm.isCPFValid && !(vm.selectedShippingType === 'delivery' && vm.isDeliveryBlocked)
              ? "bg-slate-900 hover:bg-black text-white"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          {vm.isSubmitting ? <Loader2 className="animate-spin" /> : (
            <span className="flex items-center gap-2">FINALIZAR PEDIDO <ArrowRight size={14} strokeWidth={3} /></span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}