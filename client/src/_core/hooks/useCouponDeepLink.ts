import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useCart } from "@/_core/CartContext";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import {
  parseCouponFromUrl,
  readPendingCoupon,
  writePendingCoupon,
  clearPendingCoupon,
  removeQueryParams,
} from "../../../../shared/utils/coupon";

export function useCouponDeepLink() {
  const location = useLocation();
  const { items, totals, cartId, refreshCart } = useCart();
  const utils = trpc.useUtils();

  const isApplyingRef = useRef(false);

  const applyCouponMutation = trpc.cart.applyCoupon.useMutation({
    onSuccess: () => {
      void utils.store.cart.getSummary.invalidate();
    },
  });

  // 1. Capturar cupom da URL
  useEffect(() => {
    const capturedCode = parseCouponFromUrl(location.search);
    if (!capturedCode) return;

    const currentApplied = totals.couponCode ? totals.couponCode.trim().toUpperCase() : "";

    if (currentApplied) {
      if (currentApplied === capturedCode) {
        // Já está aplicado, não duplica toast nem faz nada
      } else {
        // Outro cupom já aplicado: avisa e salva como pendente (para caso remova o atual)
        writePendingCoupon(
          (k, v) => localStorage.setItem(k, v),
          capturedCode,
          "url"
        );
        toast.warning(
          `Você já possui um cupom aplicado. Para usar ${capturedCode}, remova o cupom atual.`
        );
      }
    } else {
      // Nenhum cupom aplicado: avisa ativação e salva como pendente
      writePendingCoupon(
        (k, v) => localStorage.setItem(k, v),
        capturedCode,
        "url"
      );
      toast.success(`Cupom ${capturedCode} ativado.`, {
        description: "Ele será aplicado no carrinho.",
      });
    }

    // Limpar o parâmetro da URL de forma cirúrgica
    const cleanedSearch = removeQueryParams(location.search, [
      "cupom",
      "coupon",
      "discount",
    ]);
    const newUrl =
      window.location.pathname +
      (cleanedSearch ? `?${cleanedSearch}` : "") +
      window.location.hash;
    window.history.replaceState({}, "", newUrl);
  }, [location.search, totals.couponCode]);

  // 2. Auto-aplicar o cupom pendente se houver itens no carrinho e nenhum cupom aplicado
  useEffect(() => {
    const pending = readPendingCoupon((k) => localStorage.getItem(k));
    if (!pending) return;

    const currentApplied = totals.couponCode ? totals.couponCode.trim().toUpperCase() : "";

    // Se o cupom pendente já é o cupom aplicado, podemos limpar o pendente do storage
    if (currentApplied === pending.code) {
      clearPendingCoupon((k) => localStorage.removeItem(k));
      return;
    }

    // Se já existe outro cupom aplicado, não sobrescrevemos automaticamente
    if (currentApplied && currentApplied !== pending.code) {
      return;
    }

    // Auto-aplica apenas se houver itens no carrinho e temos cartId
    if (items.length > 0 && cartId && !isApplyingRef.current) {
      isApplyingRef.current = true;

      const applyPending = async () => {
        try {
          await applyCouponMutation.mutateAsync({
            code: pending.code,
            cartId,
          });

          if (refreshCart) {
            await refreshCart();
          }

          clearPendingCoupon((k) => localStorage.removeItem(k));
          toast.success("Cupom aplicado!");
        } catch (err: unknown) {
          clearPendingCoupon((k) => localStorage.removeItem(k));
          const message = (err as { message?: string }).message || "Cupom inválido ou expirado.";
          toast.warning(message);

          if (refreshCart) {
            await refreshCart();
          }
        } finally {
          isApplyingRef.current = false;
        }
      };

      void applyPending();
    }
  }, [items, totals.couponCode, cartId, refreshCart, applyCouponMutation]);
}
