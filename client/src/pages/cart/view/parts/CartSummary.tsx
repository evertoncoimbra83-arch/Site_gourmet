import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, Truck, X,
  ArrowRight, Ticket, Store, ChevronDown, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { trpc } from "@/_core/trpc";
import { useGeolocationZip } from "@/_core/hooks/useGeolocationZip";

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  autoDiscount: number;
  quantityRuleName?: string | null;
  couponCode?: string | null;
  couponDescription?: string | null;
  couponBannerColor?: string | null;
  couponLogoUrl?: string | null;
  couponError?: string | null;
  removeCoupon: () => void;
  loyaltyDiscountValue: number;
  shipping: number;
  money: (val: number) => string;
  goCheckout: () => void;
  isDeliveryAvailable: boolean;
  // ✅ FIX: Adicionada a prop que estava faltando na interface
  isCalculatingShipping?: boolean; 
  couponInput: string;
  setCouponInput: (val: string) => void;
  onApplyCoupon: (code: string) => void;
  onShippingResult?: (cost: number, isAvailable: boolean) => void;
}

interface ZipZoneResponse {
  isValid: boolean;
  cityAllowed: boolean;
  shippingCost: number;
  minOrderValue?: number;
  minOrderMessage?: string;
}

export function CartSummary({
  subtotal, discount, autoDiscount,
  couponCode, couponDescription, 
  couponBannerColor, couponLogoUrl,
  removeCoupon,
  loyaltyDiscountValue, shipping,
  money, goCheckout,
  couponInput, setCouponInput, onApplyCoupon,
  onShippingResult,
  isCalculatingShipping // ✅ Desestruturado aqui
}: CartSummaryProps) {

  const utils = trpc.useUtils(); 
  const [cep, setCep] = useState("");
  const [isInternalCalculating, setIsInternalCalculating] = useState(false);
  const [isCepOpen, setIsCepOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false); 
  const [cepFeedback, setCepFeedback] = useState<{type: "success" | "warning" | "error", text: string} | null>(null);
  const [storeRules, setStoreRules] = useState<{ minOrderValue: number, minOrderMessage: string } | null>(null);

  const { cep: geoCep, loading: geoLoading, error: geoError, getZipFromCoords } = useGeolocationZip();

  // Consolida o estado de carregamento (externo + interno)
  const isGlobalCalculating = isInternalCalculating || isCalculatingShipping;

  const validateZipCode = useCallback(async (targetCep: string) => {
    const cleanCep = targetCep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsInternalCalculating(true);
    setCepFeedback(null);
    
    try {
      const res = await utils.addresses.validateZipZone.fetch({ 
        zipCode: cleanCep,
        storeSlug: "jundiai" 
      }) as ZipZoneResponse;
      
      if (res.isValid) {
        setCepFeedback({ 
          type: "success", 
          text: res.shippingCost > 0 ? `Entrega disponível! Frete: ${money(res.shippingCost)}` : "Frete Grátis!" 
        });
        if (onShippingResult) onShippingResult(res.shippingCost, true);
      } else {
        setCepFeedback({ type: "warning", text: "Entrega indisponível para este CEP. Você ainda pode escolher retirada ou outro endereço." });
        if (onShippingResult) onShippingResult(0, false);
      }
    } catch {
      setCepFeedback({ type: "error", text: "Falha ao consultar CEP." });
    } finally {
      setIsInternalCalculating(false);
    }
  }, [utils, money, onShippingResult]);

  useEffect(() => {
    if (geoCep && !isManualMode) {
      const formatted = geoCep.substring(0, 5) + "-" + geoCep.substring(5, 8);
      setCep(formatted);
      validateZipCode(geoCep);
    }
  }, [geoCep, validateZipCode, isManualMode]);

  useEffect(() => {
    if (isCepOpen && cep.replace(/\D/g, "").length === 0 && !isManualMode) {
      getZipFromCoords();
    }
  }, [isCepOpen, getZipFromCoords, cep, isManualMode]);

  const getCouponImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    const apiBase = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, "");
    return `${apiBase}/${url.replace(/^\/?public\//, "").replace(/^\//, "")}`;
  };

  useEffect(() => {
    const loadStoreRules = async () => {
      try {
        const res = await utils.addresses.validateZipZone.fetch({ 
          zipCode: "00000000", 
          storeSlug: "jundiai" 
        }) as ZipZoneResponse;
        
        if (res.minOrderValue && res.minOrderValue > 0) {
          setStoreRules({
            minOrderValue: Number(res.minOrderValue),
            minOrderMessage: res.minOrderMessage || ""
          });
        }
      } catch (err) {
        console.error("Erro ao carregar regras mínimas:", err);
      }
    };
    loadStoreRules();
  }, [utils]);

  const total = useMemo(() => {
    const safeLoyalty = Number(loyaltyDiscountValue) || 0;
    const safeCoupon = Number(discount) || 0;
    const safeAuto = Number(autoDiscount) || 0;
    const safeSubtotal = Number(subtotal) || 0;
    const safeShipping = Number(shipping) || 0;
    return Math.max(0, safeSubtotal + safeShipping - (safeCoupon + safeAuto + safeLoyalty));
  }, [subtotal, shipping, discount, autoDiscount, loyaltyDiscountValue]);

  const totalSavings = useMemo(() => {
    return (Number(discount) || 0) + (Number(autoDiscount) || 0) + (Number(loyaltyDiscountValue) || 0);
  }, [discount, autoDiscount, loyaltyDiscountValue]);

  const isBelowMinForDelivery = useMemo(() => {
    if (!storeRules || storeRules.minOrderValue <= 0) return false;
    return subtotal < storeRules.minOrderValue;
  }, [subtotal, storeRules]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualMode(true);
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 5) val = val.substring(0, 5) + "-" + val.substring(5, 8);
    setCep(val);
    setCepFeedback(null);
  };

  const hasCouponApplied = !!couponCode && couponCode.trim() !== "";

  return (
    <div className="space-y-6 sticky top-24">
      <div className="bg-white p-8 sm:p-10 rounded-4xl border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        
        {totalSavings > 0 && <div className="absolute -inset-px bg-emerald-500/5 rounded-4xl -z-10" />}

        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2 border-b border-slate-50 pb-4">
          <ShoppingBag className="h-3 w-3" /> Resumo do Pedido
        </h3>

        <div className="space-y-5">
          <div className="flex justify-between items-center px-1">
            <span className="font-black uppercase text-[9px] tracking-widest text-slate-400">Total dos Itens</span>
            <span className="font-black text-sm text-slate-900 italic">{money(subtotal)}</span>
          </div>

          <div className="space-y-3 pt-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {hasCouponApplied ? (
                <motion.div key="applied" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("relative p-5 rounded-3xl shadow-sm border", couponBannerColor ? "text-white" : "bg-amber-500 text-white")} style={couponBannerColor ? { backgroundColor: couponBannerColor, borderColor: 'transparent' } : {}}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center ring-1 ring-white/30 backdrop-blur-sm overflow-hidden">
                        {couponLogoUrl ? (
                          <img src={getCouponImageUrl(couponLogoUrl)} alt="Logo Cupom" className="w-full h-full object-cover" />
                        ) : (
                          <Ticket size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-lg uppercase tracking-tighter">{couponCode}</p>
                        <p className="text-[10px] font-bold opacity-90 uppercase">{couponDescription || "Desconto Aplicado"}</p>
                      </div>
                    </div>
                    <button onClick={removeCoupon} className="opacity-70 hover:opacity-100 active:scale-90 transition-transform"><X size={16} /></button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" placeholder="CUPOM?" className="flex-1 bg-slate-50 border border-slate-100 h-12 px-5 rounded-2xl font-black text-[10px] outline-none" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
                  <Button onClick={() => onApplyCoupon(couponInput)} className="h-12 px-8 bg-slate-900 text-white uppercase font-black text-[10px] rounded-2xl">Aplicar</Button>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 space-y-4">
            <div className={cn("rounded-3xl border border-slate-100 bg-slate-50/50 transition-all", isCepOpen && "ring-2 ring-emerald-500/10")}>
              <button onClick={() => setIsCepOpen(!isCepOpen)} className="w-full px-5 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isGlobalCalculating || (geoLoading && !isManualMode) ? (
                    <Loader2 size={14} className="text-emerald-500 animate-spin" />
                  ) : (
                    <Truck size={14} className="text-slate-400" />
                  )}
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    {isGlobalCalculating ? "Validando CEP..." : "Simular Entrega"}
                  </span>
                </div>
                <ChevronDown size={16} className={cn("transition-transform duration-300", isCepOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isCepOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 space-y-3 overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="00000-000" 
                        maxLength={9} 
                        value={cep} 
                        onChange={handleCepChange} 
                        className="flex-1 bg-white border h-10 px-4 rounded-xl font-black text-xs outline-none focus:border-emerald-500" 
                      />
                      <Button 
                        onClick={() => validateZipCode(cep)} 
                        disabled={isGlobalCalculating || (geoLoading && !isManualMode) || cep.replace(/\D/g, "").length !== 8} 
                        className="h-10 bg-slate-900 text-white rounded-xl text-[10px] font-black"
                      >
                        {isGlobalCalculating ? <Loader2 size={14} className="animate-spin" /> : "OK"}
                      </Button>
                    </div>

                    {(cepFeedback || (geoError && !isManualMode)) && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "text-[9px] font-bold uppercase",
                          (cepFeedback?.type === "error" || (geoError && !isManualMode)) ? "text-red-500" : "text-emerald-600"
                        )}
                      >
                        {(geoError && !isManualMode) ? geoError : cepFeedback?.text}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100">
            <AnimatePresence>
              {isBelowMinForDelivery && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-4xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-6 flex flex-col gap-4 shadow-sm text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                      <Store size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-amber-900 tracking-tight leading-none">Apenas Retirada</p>
                      <p className="text-[9px] font-bold text-amber-700/80 uppercase mt-1">Pedido mínimo para entrega: {money(storeRules?.minOrderValue || 0)}</p>
                    </div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/30">
                    <p className="text-[10px] font-bold text-amber-900 leading-tight">{storeRules?.minOrderMessage || "Adicione mais itens para liberar a entrega."}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-amber-600">Falta apenas</span>
                      <span className="text-sm font-black text-amber-900 italic">{money((storeRules?.minOrderValue || 0) - subtotal)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end justify-between px-1 mb-8">
              <div>
                <span className="uppercase text-[10px] font-black text-slate-400">Total Final</span>
                <div className="text-6xl font-black text-slate-900 tracking-tighter italic">{money(total)}</div>
              </div>
            </div>

            <Button 
              onClick={goCheckout} 
              disabled={isGlobalCalculating || (geoLoading && !isManualMode)}
              className="w-full h-20 rounded-4xl font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white active:scale-95 transition-all disabled:opacity-50"
            >
              Finalizar Pedido <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
