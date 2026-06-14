import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Truck,
  X,
  ArrowRight,
  Ticket,
  Store,
  Loader2,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { trpc } from "@/_core/trpc";
import { useGeolocationZip } from "@/_core/hooks/useGeolocationZip";
import { safeNumber } from "@/lib/safe-parse";
import { useCheckoutStore } from "@/_core/store/useCheckoutStore";

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
  isCalculatingShipping?: boolean;
  couponInput: string;
  setCouponInput: (val: string) => void;
  onApplyCoupon: (code: string) => void;
  onShippingResult?: (cost: number, isAvailable: boolean) => void;
  loyaltyValidation?: {
    isValid?: boolean;
    nextTier?: {
      minOrderValue: number;
      maxDiscount: number;
    } | null;
  } | null;
  onBlockStatusChange?: (isBelowMin: boolean, isOutOfArea: boolean, minOrderValue: number) => void;
}

interface ZipZoneResponse {
  isValid: boolean;
  cityAllowed: boolean;
  shippingCost: number;
  minOrderValue?: number;
  minOrderMessage?: string;
}

const CEP_STORAGE_KEY = "cart-delivery-cep";
const WHATSAPP_PHONE = "551145265941";

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function CartSummary({
  subtotal,
  discount,
  autoDiscount,
  couponCode,
  couponDescription,
  couponBannerColor,
  couponLogoUrl,
  removeCoupon,
  loyaltyDiscountValue,
  shipping,
  money,
  goCheckout,
  couponInput,
  setCouponInput,
  onApplyCoupon,
  onShippingResult,
  isCalculatingShipping,
  loyaltyValidation,
  onBlockStatusChange,
}: CartSummaryProps) {
  const utils = trpc.useUtils();
  const [cep, setCep] = useState("");
  const [isInternalCalculating, setIsInternalCalculating] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [geoRequested, setGeoRequested] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);
  const [storeRules, setStoreRules] = useState<{
    minOrderValue: number;
    minOrderMessage: string;
  } | null>(null);

  const {
    cep: geoCep,
    loading: geoLoading,
    error: geoError,
    getZipFromCoords,
  } = useGeolocationZip();

  const isGlobalCalculating = isInternalCalculating || isCalculatingShipping;
  const lastValidatedCepRef = useRef<string | null>(null);

  const validateZipCode = useCallback(
    async (targetCep: string) => {
      const cleanCep = targetCep.replace(/\D/g, "");
      if (cleanCep.length !== 8) {
        setCepFeedback({
          type: "error",
          text: "Digite um CEP válido com 8 números.",
        });
        return;
      }

      if (lastValidatedCepRef.current === cleanCep) {
        return;
      }

      setIsInternalCalculating(true);
      setCepFeedback(null);

      try {
        const res = (await utils.addresses.validateZipZone.fetch({
          zipCode: cleanCep,
          storeSlug: "jundiai",
        })) as ZipZoneResponse;

        lastValidatedCepRef.current = cleanCep;
        useCheckoutStore.getState().setField("manualZipCode", cleanCep);

        if (res.isValid) {
          setCepFeedback({
            type: "success",
            text:
              res.shippingCost > 0
                ? `Entrega disponível! Frete: ${money(res.shippingCost)}`
                : "Entrega disponível com frete grátis!",
          });
          localStorage.setItem(CEP_STORAGE_KEY, cleanCep);
          onShippingResult?.(res.shippingCost, true);
        } else {
          setCepFeedback({
            type: "warning",
            text:
              "Entrega indisponível para este CEP. Você ainda pode escolher retirada ou atendimento pelo WhatsApp.",
          });
          localStorage.setItem(CEP_STORAGE_KEY, cleanCep);
          onShippingResult?.(0, false);
        }
      } catch {
        setCepFeedback({ type: "error", text: "Falha ao consultar CEP." });
      } finally {
        setIsInternalCalculating(false);
      }
    },
    [utils, money, onShippingResult],
  );

  useEffect(() => {
    const savedCep = localStorage.getItem(CEP_STORAGE_KEY);
    if (!savedCep) return;

    const formatted = formatCep(savedCep);
    setCep(formatted);
    void validateZipCode(formatted);
    setIsManualMode(true);
  }, []);

  useEffect(() => {
    if (!geoCep) return;
    const cleanGeo = geoCep.replace(/\D/g, "");
    const cleanCurrent = cep.replace(/\D/g, "");
    if (cleanGeo === cleanCurrent) {
      setGeoRequested(false);
      return;
    }
    const hasExistingCep = cleanCurrent.length === 8;
    if (!geoRequested && (isManualMode || hasExistingCep)) return;

    const formatted = formatCep(geoCep);
    setCep(formatted);
    setCepFeedback(null);
    void validateZipCode(formatted);
    setGeoRequested(false);
  }, [geoCep, validateZipCode, isManualMode, cep, geoRequested]);

  useEffect(() => {
    const loadStoreRules = async () => {
      try {
        const res = (await utils.addresses.validateZipZone.fetch({
          zipCode: "00000000",
          storeSlug: "jundiai",
        })) as ZipZoneResponse;

        if (res.minOrderValue && res.minOrderValue > 0) {
          setStoreRules({
            minOrderValue: Number(res.minOrderValue),
            minOrderMessage: res.minOrderMessage || "",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar regras mínimas:", err);
      }
    };
    void loadStoreRules();
  }, [utils]);

  const total = useMemo(() => {
    const safeLoyalty = safeNumber(loyaltyDiscountValue);
    const safeCoupon = safeNumber(discount);
    const safeAuto = safeNumber(autoDiscount);
    const safeSubtotal = safeNumber(subtotal);
    const safeShipping = safeNumber(shipping);
    return Math.max(
      0,
      safeSubtotal + safeShipping - (safeCoupon + safeAuto + safeLoyalty),
    );
  }, [subtotal, shipping, discount, autoDiscount, loyaltyDiscountValue]);

  const totalSavings = useMemo(() => {
    return (
      safeNumber(discount) +
      safeNumber(autoDiscount) +
      safeNumber(loyaltyDiscountValue)
    );
  }, [discount, autoDiscount, loyaltyDiscountValue]);

  const isBelowMinForDelivery = useMemo(() => {
    if (!storeRules || storeRules.minOrderValue <= 0) return false;
    return subtotal < storeRules.minOrderValue;
  }, [subtotal, storeRules]);

  const goalBar = useMemo(() => {
    const current = Math.max(0, subtotal);

    if (storeRules?.minOrderValue && storeRules.minOrderValue > 0) {
      const minTarget = storeRules.minOrderValue;
      const missing = Math.max(0, minTarget - current);
      const progress = Math.max(0, Math.min(100, (current / minTarget) * 100));

      if (missing > 0) {
        return {
          title: "Falta pouco",
          currentLabel: `Pedido atual: ${money(current)}`,
          message: `Faltam ${money(missing)} para liberar entrega.`,
          progress,
          tone: "delivery" as const,
        };
      }

    }

    if (loyaltyValidation?.nextTier) {
      const nextMinOrder = Math.max(
        0,
        Number(loyaltyValidation.nextTier.minOrderValue || 0),
      );
      const nextDiscount = Math.max(
        0,
        Number(loyaltyValidation.nextTier.maxDiscount || 0),
      );

      if (nextMinOrder > current && nextDiscount > 0) {
        const missing = nextMinOrder - current;
        const progress = Math.max(
          0,
          Math.min(100, (current / nextMinOrder) * 100),
        );
        return {
          title: "Clube Gourmet",
          currentLabel: `Pedido atual: ${money(current)}`,
          message: `Faltam ${money(missing)} para liberar até ${money(nextDiscount)} em descontos por pontos.`,
          progress,
          tone: "loyalty" as const,
        };
      }
    }

    if (loyaltyValidation?.isValid) {
      return {
        title: "Clube Gourmet",
        currentLabel: `Pedido atual: ${money(current)}`,
        message: "Você já está na melhor faixa de benefícios do Clube Gourmet.",
        progress: 100,
        tone: "loyalty" as const,
      };
    }

    if (storeRules?.minOrderValue && storeRules.minOrderValue > 0) {
      return {
        title: "Falta pouco",
        currentLabel: `Pedido atual: ${money(current)}`,
        message: "Entrega liberada para este pedido.",
        progress: 100,
        tone: "delivery" as const,
      };
    }

    return null;
  }, [storeRules, subtotal, money, loyaltyValidation]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualMode(true);
    setGeoRequested(false);
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    setCepFeedback(null);

    if (!formatted) {
      localStorage.removeItem(CEP_STORAGE_KEY);
    }
  };

  const handleUseLocation = () => {
    setGeoRequested(true);
    setIsManualMode(false);
    getZipFromCoords();
  };

  const handleWhatsAppHelp = () => {
    const message = encodeURIComponent(
      "Olá! Meu CEP ficou fora da área de entrega no carrinho e preciso de ajuda com retirada ou atendimento.",
    );
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${message}`, "_blank");
  };

  const hasCouponApplied = !!couponCode && couponCode.trim() !== "";
  const isOutOfArea = cepFeedback?.type === "warning";
  const shouldShowGeoError =
    !!geoError && !isGlobalCalculating && !geoLoading && !geoRequested;

  useEffect(() => {
    onBlockStatusChange?.(isBelowMinForDelivery, isOutOfArea, storeRules?.minOrderValue || 0);
  }, [isBelowMinForDelivery, isOutOfArea, storeRules?.minOrderValue, onBlockStatusChange]);

  return (
    <div className="space-y-6 sticky top-24">
      <div className="bg-white p-8 sm:p-10 rounded-4xl border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        {totalSavings > 0 && (
          <div className="absolute -inset-px bg-emerald-500/5 rounded-4xl -z-10" />
        )}

        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2 border-b border-slate-50 pb-4">
          <ShoppingBag className="h-3 w-3" /> Resumo do Pedido
        </h3>

        <div className="space-y-5">
          <div className="flex justify-between items-center px-1">
            <span className="font-black uppercase text-[9px] tracking-widest text-slate-400">
              Total dos Itens
            </span>
            <span className="font-black text-sm text-slate-900 italic">
              {money(subtotal)}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {hasCouponApplied ? (
                <motion.div
                  key="applied"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "relative p-5 rounded-3xl shadow-sm border",
                    couponBannerColor
                      ? "text-white"
                      : "bg-amber-500 text-white",
                  )}
                  style={
                    couponBannerColor
                      ? { backgroundColor: couponBannerColor, borderColor: "transparent" }
                      : {}
                  }
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center ring-1 ring-white/30 backdrop-blur-sm overflow-hidden">
                        {couponLogoUrl ? (
                          <img
                            src={couponLogoUrl.startsWith("http") ||
                              couponLogoUrl.startsWith("blob:") ||
                              couponLogoUrl.startsWith("data:")
                              ? couponLogoUrl
                              : `${(import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, "")}/${couponLogoUrl.replace(/^\/?public\//, "").replace(/^\//, "")}`}
                            alt="Logo Cupom"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Ticket size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-lg uppercase tracking-tighter">
                          {couponCode}
                        </p>
                        <p className="text-[10px] font-bold opacity-90 uppercase">
                          {couponDescription || "Desconto Aplicado"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="opacity-70 hover:opacity-100 active:scale-90 transition-transform"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CUPOM?"
                    className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-[10px] font-black text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                  />
                  <Button
                    onClick={() => onApplyCoupon(couponInput)}
                    className="h-12 px-8 bg-slate-900 text-white uppercase font-black text-[10px] rounded-2xl"
                  >
                    Aplicar
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                    {isGlobalCalculating || geoLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Truck size={16} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Simular Entrega
                    </p>
                    <p className="text-sm font-black text-slate-900">
                      Digite seu CEP para calcular entrega ou retirada.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={geoLoading || isGlobalCalculating}
                  className="shrink-0 inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                >
                  <MapPin size={12} />
                  Usar localização
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="00000-000"
                  maxLength={9}
                  value={cep}
                  onChange={handleCepChange}
                  className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
                <Button
                  onClick={() => validateZipCode(cep)}
                  disabled={isGlobalCalculating || geoLoading}
                  className="h-12 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  {isGlobalCalculating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Simular"
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                {(cepFeedback || shouldShowGeoError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left",
                      cepFeedback?.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : cepFeedback?.type === "warning"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-rose-200 bg-rose-50 text-rose-600",
                    )}
                  >
                    <p className="text-[10px] font-black uppercase leading-relaxed">
                      {shouldShowGeoError ? geoError : cepFeedback?.text}
                    </p>
                  </motion.div>
                )}

                {isOutOfArea && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleWhatsAppHelp}
                      className="h-11 rounded-2xl border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest"
                    >
                      <MessageCircle size={14} className="mr-2" />
                      Pedir ajuda no WhatsApp
                    </Button>
                    <div className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 inline-flex items-center text-[10px] font-black uppercase text-slate-500">
                      Retirada segue disponível no checkout.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {goalBar && (
            <div className="pt-6 mt-4 border-t border-slate-100">
              <div className={cn(
                "rounded-3xl border p-5 sm:p-6 shadow-sm space-y-4",
                goalBar.tone === "delivery"
                  ? "border-emerald-100 bg-linear-to-br from-emerald-50/80 to-white"
                  : "border-slate-100 bg-linear-to-br from-slate-50 to-white",
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-[0.25em]",
                      goalBar.tone === "delivery" ? "text-slate-400" : "text-emerald-600"
                    )}>
                      {goalBar.title}
                    </p>
                    <p className="text-sm font-black text-slate-900">
                      {goalBar.currentLabel}
                    </p>
                  </div>
                  {goalBar.tone === "delivery" && (
                    <div className="h-10 min-w-10 rounded-2xl px-3 inline-flex items-center justify-center text-[10px] font-black uppercase bg-emerald-500 text-white">
                      {Math.round(goalBar.progress)}%
                    </div>
                  )}
                </div>

                {goalBar.tone === "delivery" && (
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      initial={false}
                      animate={{ width: `${goalBar.progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                )}

                <p className={cn(
                  "text-[11px] font-black leading-relaxed",
                  goalBar.tone === "delivery" ? "text-emerald-700" : "text-slate-600",
                )}>
                  {goalBar.message}
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 mt-4 border-t border-slate-100">
            <AnimatePresence>
              {isBelowMinForDelivery && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 rounded-4xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-6 flex flex-col gap-4 shadow-sm text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                      <Store size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-amber-900 tracking-tight leading-none">
                        Apenas Retirada
                      </p>
                      <p className="text-[9px] font-bold text-amber-700/80 uppercase mt-1">
                        Pedido mínimo para entrega:{" "}
                        {money(storeRules?.minOrderValue || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/30">
                    <p className="text-[10px] font-bold text-amber-900 leading-tight">
                      {storeRules?.minOrderMessage ||
                        "Adicione mais itens para liberar a entrega."}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-amber-600">
                        Falta apenas
                      </span>
                      <span className="text-sm font-black text-amber-900 italic">
                        {money((storeRules?.minOrderValue || 0) - subtotal)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end justify-between px-1 mb-8">
              <div>
                <span className="uppercase text-[10px] font-black text-slate-400">
                  Total Final
                </span>
                <div className="text-6xl font-black text-slate-900 tracking-tighter italic">
                  {money(total)}
                </div>
              </div>
            </div>

            <Button
              onClick={goCheckout}
              disabled={isGlobalCalculating || geoLoading}
              className="w-full h-20 rounded-4xl font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white active:scale-95 transition-all disabled:opacity-50"
            >
              Finalizar Pedido{" "}
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
