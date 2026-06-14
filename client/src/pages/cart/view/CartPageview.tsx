import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useCartPageLogic } from "./../logic/useCartPageLogic";
import { ChevronLeft, ShoppingBag, Loader2, ChevronDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";

import CartItem from "./../view/parts/CartItemRow";
import { CartSummary } from "./../view/parts/CartSummary";
import { CartLoyalty } from "./../view/parts/CartLoyalty";
import { DiscountRoadmap } from "./../view/parts/DiscountRoadmap";
import type { NutritionValues } from "@/_core/type/utils";

/* --------------------------------- TYPES ---------------------------------- */

interface ProcessedCartItem {
  id: string;
  uniqueKey: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  sizeName: string | null;
  itemType?: string;
  appliedNutrition: Record<string, unknown> | NutritionValues;
  options: Record<string, unknown>;
}

const EMPTY_NUTRITION: NutritionValues = {
  energyKcal: 0,
  proteins: 0,
  carbs: 0,
  fatTotal: 0,
  fiber: 0,
  sodium: 0,
  yieldWeight: 0
};

/* ------------------------------- COMPONENT -------------------------------- */

export function CartPageView() {
  const [couponInput, setCouponInput] = useState("");
  const [isSummaryInView, setIsSummaryInView] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const [simulatedShipping, setSimulatedShipping] = useState<number | null>(null);
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState(true);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingBlock, setShippingBlock] = useState<{
    isBelowMin: boolean;
    isOutOfArea: boolean;
    minOrderValue: number;
  }>({
    isBelowMin: false,
    isOutOfArea: false,
    minOrderValue: 0,
  });

  const {
    items = [],
    totals,
    handleApplyCoupon,
    handleRemoveCoupon,
    updateQuantity,
    removeItem,
    money,
    isLoading,
    isCartEmpty,
    handleCheckout,
    discountsInfo,
    allTiers,
    totalQuantity,
    loyaltyValidation,
  } = useCartPageLogic();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSummaryInView(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (summaryRef.current) observer.observe(summaryRef.current);
    window.scrollTo({ top: 0, behavior: "instant" });

    return () => observer.disconnect();
  }, []);

  const scrollToSummary = () => {
    summaryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBlockStatusChange = useCallback((isBelowMin: boolean, isOutOfArea: boolean, minOrderValue: number) => {
    setShippingBlock({ isBelowMin, isOutOfArea, minOrderValue });
  }, []);

  const handleShippingResult = useCallback((cost: number, isAvailable: boolean) => {
    setSimulatedShipping(cost);
    setIsDeliveryAvailable(isAvailable);
    setIsCalculatingShipping(false);
  }, []);

  const handleGoCheckout = useCallback(() => {
    if (!isCalculatingShipping) {
      handleCheckout();
    }
  }, [isCalculatingShipping, handleCheckout]);

  /**
   * ✅ PROCESSAMENTO ROBUSTO SEM ANY
   * Garante que strings JSON sejam convertidas e campos snake_case sejam mapeados.
   */
  const processedItems = useMemo<ProcessedCartItem[]>(() => {
    return items.map((item, index) => {
      // 1. Parse seguro de options (pode vir como string ou objeto)
      let rawOptions: Record<string, unknown> = {};
      if (typeof item.options === 'string') {
        try { rawOptions = JSON.parse(item.options); } catch { rawOptions = {}; }
      } else {
        rawOptions = (item.options || {}) as Record<string, unknown>;
      }

      // 2. Parse seguro de nutrição (suporta appliedNutrition e applied_nutrition)
      const nutritionSource = item.appliedNutrition || (item as unknown as Record<string, unknown>).applied_nutrition;
      let safeNutrition: Record<string, unknown> | NutritionValues = EMPTY_NUTRITION;

      if (typeof nutritionSource === 'string') {
        try { safeNutrition = JSON.parse(nutritionSource); } catch { safeNutrition = EMPTY_NUTRITION; }
      } else if (nutritionSource && typeof nutritionSource === 'object') {
        safeNutrition = nutritionSource as unknown as Record<string, unknown>;
      }

      return {
        // Preservamos o item original para garantir propriedades extras (price, quantity, etc)
        ...item,
        id: String(item.id),
        uniqueKey: String(item.uniqueKey ?? item.id ?? `item-${index}`),
        name: String(item.name || "Produto"),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 0),
        image: item.image ?? null,
        // Fallbacks para o nome do tamanho (suporta várias fontes de dados)
        sizeName: item.sizeName ??
                  (rawOptions?.sizeName as string) ??
                  (rawOptions?.selectedSizeName as string) ??
                  null,
        appliedNutrition: safeNutrition,
        options: rawOptions
      };
    });
  }, [items]);

  if (isLoading && items.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-center p-10">
        <Loader2 className="animate-spin text-emerald-600 h-10 w-10 opacity-40 mb-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando...</span>
      </div>
    );
  }

  if (isCartEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-[#FBFBFC] p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[3.5rem] shadow-xl mb-10 border border-slate-100">
          <ShoppingBag size={56} className="text-emerald-500/10" />
        </motion.div>
        <h2 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">Sacola Vazia</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Adicione delícias saudáveis para continuar</p>
        <Link to="/produtos">
          <button className="mt-10 bg-slate-900 text-white font-black px-16 h-18 rounded-3xl uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
            Ver Cardápio
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-6 md:pt-12 pb-40">
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-emerald-500 z-100 origin-left" style={{ scaleX }} />

      <div className="max-w-2xl mx-auto px-4 space-y-6 md:space-y-10">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 sticky top-0 bg-[#FBFBFC]/90 backdrop-blur-xl z-30 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/produtos">
              <div className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl shadow-sm active:scale-90 hover:bg-slate-50 transition-all">
                <ChevronLeft size={24} strokeWidth={3} className="text-slate-900" />
              </div>
            </Link>
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none truncate">
                Sacola
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Gourmet Saudável</p>
            </div>
          </div>
          <div className="bg-slate-950 px-5 py-2.5 rounded-2xl shadow-xl border border-white/5 shrink-0">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter italic">
              {totalQuantity} {totalQuantity === 1 ? "unidade" : "unidades"}
            </span>
          </div>
        </div>

        <DiscountRoadmap tiers={allTiers ?? []} itemCount={totalQuantity} />

        <div className="space-y-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {processedItems.map((group) => (
              <CartItem
                key={group.uniqueKey}
                group={group}
                money={money}
                updateQuantity={(id, qty) => updateQuantity(String(id), qty)}
                removeItem={(id) => removeItem(String(id))}
              />
            ))}
          </AnimatePresence>
        </div>

        <CartLoyalty />

        <div ref={summaryRef} className="scroll-mt-32">
          <CartSummary
            subtotal={totals?.subtotal ?? 0}
            discount={totals?.couponDiscount ?? 0}
            autoDiscount={totals?.autoDiscount ?? 0}
            loyaltyDiscountValue={Number(totals?.loyaltyDiscount || 0)}
            shipping={simulatedShipping !== null ? simulatedShipping : (totals?.shipping ?? 0)}
            isDeliveryAvailable={isDeliveryAvailable}
            isCalculatingShipping={isCalculatingShipping}
            onBlockStatusChange={handleBlockStatusChange}
            onShippingResult={handleShippingResult}

            quantityRuleName={discountsInfo?.autoDiscountName}
            couponCode={discountsInfo?.coupon?.code}
            couponDescription={discountsInfo?.coupon?.description}
            couponBannerColor={discountsInfo?.coupon?.bannerColor}
            couponLogoUrl={discountsInfo?.coupon?.logoUrl}
            couponError={discountsInfo?.coupon?.hasError ? "Cupom inválido" : null}
            removeCoupon={handleRemoveCoupon}
            money={money}
            goCheckout={handleGoCheckout}
            couponInput={couponInput}
            setCouponInput={setCouponInput}
            loyaltyValidation={loyaltyValidation}
            onApplyCoupon={async (codeStr) => {
              const code = codeStr || couponInput;
              if (code.trim()) {
                await handleApplyCoupon(code.trim());
                setCouponInput("");
              }
            }}
          />
        </div>
      </div>

      <AnimatePresence>
        {!isSummaryInView && (
          <div
            className="fixed left-0 right-0 flex justify-center z-40 md:hidden px-6 pointer-events-none"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              disabled={isCalculatingShipping}
              onClick={handleGoCheckout}
              className="pointer-events-auto w-full bg-slate-950/95 backdrop-blur-2xl text-white px-6 h-16 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Finalizar Pedido • {money(totals?.total ?? 0)}
                </span>
                {shippingBlock.isOutOfArea ? (
                  <span className="text-[8px] font-bold text-amber-400 mt-1 uppercase">
                    CEP fora da área de entrega. Apenas Retirada.
                  </span>
                ) : shippingBlock.isBelowMin ? (
                  <span className="text-[8px] font-bold text-amber-400 mt-1 uppercase">
                    Abaixo do mínimo para entrega. Apenas Retirada.
                  </span>
                ) : (
                  <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">
                    Ir para o checkout
                  </span>
                )}
              </div>
              <div className="bg-emerald-500 rounded-2xl p-2 shadow-lg shadow-emerald-500/30">
                {isCalculatingShipping ? (
                  <Loader2 size={16} className="text-slate-950 animate-spin" />
                ) : (
                  <ArrowRight size={16} className="text-slate-950" strokeWidth={4} />
                )}
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
