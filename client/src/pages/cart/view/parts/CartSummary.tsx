import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, Sparkles, Tag, Truck, X,
  ArrowRight, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  discount: number; 
  autoDiscount: number; 
  quantityRuleName?: string | null;
  couponCode?: string | null;
  couponDescription?: string | null;
  removeCoupon?: () => void; 
  loyaltyDiscountValue: number; 
  shipping: number;
  earnedPoints: number;
  money: (val: number) => string;
  goCheckout: () => void;
  isDeliveryAvailable: boolean;
  couponInput: string;
  setCouponInput: (val: string) => void;
  onApplyCoupon: (code: string) => Promise<void>;
}

export function CartSummary({
  subtotal, discount, autoDiscount, quantityRuleName,
  couponCode, couponDescription, removeCoupon,
  loyaltyDiscountValue, shipping, earnedPoints,
  money, goCheckout, isDeliveryAvailable,
  couponInput, setCouponInput, onApplyCoupon,
}: CartSummaryProps) {

  const hasCouponApplied = discount > 0 || (!!couponCode && couponCode.trim() !== "");

  // ✅ CÁLCULO DE TOTAL BLINDADO
  // Garante que se o servidor mandar uma string de erro, o JS trate como 0 para não exibir "NaN"
  const total = useMemo(() => {
    const safeLoyalty = Number(loyaltyDiscountValue) || 0;
    const safeCoupon = Number(discount) || 0;
    const safeAuto = Number(autoDiscount) || 0;
    const safeSubtotal = Number(subtotal) || 0;
    const safeShipping = Number(shipping) || 0;

    return Math.max(0, safeSubtotal + safeShipping - (safeCoupon + safeAuto + safeLoyalty));
  }, [subtotal, shipping, discount, autoDiscount, loyaltyDiscountValue]);

  const handleApplyClick = () => {
    const code = couponInput.trim();
    if (!code) return;
    onApplyCoupon(code);
  };

  return (
    <div className="space-y-6 sticky top-24">
      {/* 🖥️ MONITOR DE SINCRONIA (Apenas para Debug Visual) */}
      <div className="bg-slate-900/5 p-4 rounded-2xl border border-dashed border-slate-200 mb-2">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Monitor de Sincronia</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-bold uppercase tracking-tighter text-center">
          <span className="text-slate-500">Sub: {money(subtotal)}</span>
          <span className={cn(Number(loyaltyDiscountValue) > 0 ? "text-emerald-600" : "text-slate-300")}>
            Fid: -{money(Number(loyaltyDiscountValue) || 0)}
          </span>
          <span className={cn(discount > 0 ? "text-amber-600" : "text-slate-300")}>Cup: -{money(discount)}</span>
          <span className={cn(autoDiscount > 0 ? "text-blue-600" : "text-slate-300")}>Prog: -{money(autoDiscount)}</span>
        </div>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2 border-b border-slate-50 pb-4">
          <ShoppingBag className="h-3 w-3" /> Resumo do Pedido
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="font-black uppercase text-[9px] tracking-widest text-slate-400">Total dos Itens</span>
            <span className="font-black text-sm text-slate-900 italic">{money(subtotal)}</span>
          </div>

          {/* SEÇÃO DE BENEFÍCIOS E DESCONTOS */}
          <div className="space-y-3 pt-2">
            <AnimatePresence mode="popLayout" initial={false}>
              
              {/* 🎫 CUPOM */}
              <motion.div key={hasCouponApplied ? "applied-coupon" : "coupon-input"}>
                {hasCouponApplied ? (
                  <div className="bg-amber-50 p-4 rounded-[1.5rem] border border-amber-100/50 flex justify-between items-center shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-amber-700 uppercase flex items-center gap-1.5 leading-none">
                        <Tag size={12} className="fill-amber-700" /> {couponCode || "CUPOM ATIVO"}
                      </span>
                      <span className="text-[8px] text-amber-600/70 font-bold uppercase mt-1">
                        {couponDescription || "Desconto aplicado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-amber-700">-{money(discount)}</span>
                      <button onClick={removeCoupon} className="h-6 w-6 rounded-full bg-white flex items-center justify-center text-amber-400 hover:text-red-500 border border-amber-100 shadow-sm transition-colors">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="TEM UM CUPOM?" 
                      className="flex-1 bg-slate-50 border-none h-11 px-4 rounded-xl font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-emerald-500/20" 
                      value={couponInput} 
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())} 
                    />
                    <button onClick={handleApplyClick} className="bg-slate-900 text-white px-5 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-all active:scale-95">
                      Aplicar
                    </button>
                  </div>
                )}
              </motion.div>

              {/* 📈 PROGRESSIVO */}
              {autoDiscount > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="progressive-row" className="bg-emerald-50 p-4 rounded-[1.5rem] border border-emerald-100 flex justify-between items-center">
                  <p className="text-[9px] font-black text-emerald-700 uppercase flex items-center gap-1.5 leading-none">
                    <Sparkles size={12} className="fill-emerald-700" /> {quantityRuleName || "Combo Progressivo"}
                  </p>
                  <span className="text-sm font-black text-emerald-700">-{money(autoDiscount)}</span>
                </motion.div>
              )}

              {/* 💎 FIDELIDADE (Exibe apenas se for número válido > 0) */}
              {Number(loyaltyDiscountValue) > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="loyalty-row" className="bg-slate-900 p-4 rounded-[1.5rem] border border-white/5 flex justify-between items-center">
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black text-white uppercase tracking-tighter flex items-center gap-1.5 leading-none">
                      <Coins className="h-3 w-3 text-emerald-400" /> Fidelidade Aplicada
                    </p>
                  </div>
                  <span className="text-sm font-black text-emerald-400">-{money(Number(loyaltyDiscountValue))}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 🚚 ENTREGA */}
          <div className="flex flex-col gap-1 px-1 pt-2 border-t border-slate-50 mt-2">
            <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 font-black text-slate-400 uppercase text-[9px] tracking-widest leading-none">
                  <Truck className="h-3 w-3" /> Entrega
                </span>
                <span className="text-[10px] font-bold text-slate-400 italic">
                  {shipping > 0 ? money(shipping) : "--"}
                </span>
            </div>
            <p className="text-[9px] font-medium text-slate-400 leading-tight">
              {shipping > 0 ? "Calculado para seu endereço" : "Calculada no fechamento do pedido"}
            </p>
          </div>

          {/* TOTAL FINAL */}
          <div className="pt-8 mt-4 border-t border-slate-100 flex flex-col gap-6">
            <div className="flex items-end justify-between px-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-3">Valor Total</span>
                <span className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">
                  {money(total)}
                </span>
              </div>
            </div>

            <Button 
              onClick={goCheckout}
              disabled={!isDeliveryAvailable}
              className={cn(
                "w-full h-16 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 group overflow-hidden",
                isDeliveryAvailable ? "bg-[#2D5A3D] hover:bg-[#1e3d29] text-white shadow-[#2D5A3D]/20" : "bg-slate-100 text-slate-400"
              )}
            >
              Finalizar Compra <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}