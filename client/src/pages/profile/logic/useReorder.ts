// client/src/pages/profile/logic/useReorder.ts
// Reutiliza pedidos anteriores adicionando todos os itens ao carrinho.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/_core/CartContext";
import { appToast as toast } from "@/lib/app-toast";
import type { Order, OrderItem } from "@/pages/profile/types/orderTypes";
import type { LocalCartItem } from "@/_core/CartContext";
import type { PackageCustomOptions, ProductCustomOptions, NutritionValues } from "@/_core/type/utils";

function safeParseOptions(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
  }
  return {};
}

function safeParseNutrition(raw: unknown): NutritionValues {
  const parsed = safeParseOptions(raw);
  // Se vier como array, pega o primeiro elemento
  if (Array.isArray(raw) && raw.length > 0) return raw[0] as NutritionValues;
  return parsed as unknown as NutritionValues;
}

function mapItemToCartEntry(
  item: OrderItem
): Omit<LocalCartItem, "id" | "addedAt" | "uniqueKey"> | null {
  const options = safeParseOptions(item.options ?? (item as Record<string, unknown>).parsedOptions);
  const quantity = Math.max(1, Number(item.quantity) || 1);

  // Detecta se é pacote ou prato
  const isPackage =
    !!(item as Record<string, unknown>).packageId ||
    options._type === "package_custom" ||
    Array.isArray(options.meals);

  const dishId = !isPackage
    ? Number((item as Record<string, unknown>).dishId ?? options.dishId ?? 0) || undefined
    : undefined;

  const packageId = isPackage
    ? ((item as Record<string, unknown>).packageId as number | undefined) ??
      (options.packageId as number | undefined)
    : undefined;

  // Sem dishId nem packageId não conseguimos readicionar
  if (!dishId && !packageId) return null;

  return {
    itemType: isPackage ? "package" : "dish",
    dishId,
    packageId,
    quantity,
    price: 0,
    name: item.dishName ?? item.dish_name ?? item.name ?? "Item",
    image: ((item as Record<string, unknown>).imageUrl as string) ?? "",
    options: options as PackageCustomOptions | ProductCustomOptions,
    appliedNutrition: safeParseNutrition(
      (item as Record<string, unknown>).appliedNutrition ??
      (item as Record<string, unknown>).applied_nutrition
    ),
    sizeName: (options.sizeName as string) ?? null,
  };
}

export function useReorder() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const reorder = async (order: Order) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const entries = order.items
        .map(mapItemToCartEntry)
        .filter((e): e is NonNullable<typeof e> => e !== null);

      if (entries.length === 0) {
        toast.error("Não foi possível recuperar os itens deste pedido.");
        return;
      }

      // Adiciona sequencialmente para não sobrecarregar
      let addedCount = 0;
      let skippedCount = order.items.length - entries.length;

      for (const entry of entries) {
        try {
          await addItem(entry);
          addedCount += 1;
        } catch (err) {
          skippedCount += 1;
          const message =
            err instanceof Error
              ? err.message
              : "Item indisponÃ­vel no catÃ¡logo atual.";
          console.warn("[useReorder] Item ignorado na recompra:", message);
        }
      }

      if (addedCount === 0) {
        toast.error("Nenhum item deste pedido estÃ¡ disponÃ­vel para recompra.");
        return;
      }

      toast.success(`${addedCount} ${addedCount === 1 ? "item adicionado" : "itens adicionados"} ao carrinho!`);
      if (skippedCount > 0) {
        toast.warning(`${skippedCount} ${skippedCount === 1 ? "item nÃ£o estÃ¡ mais disponÃ­vel" : "itens nÃ£o estÃ£o mais disponÃ­veis"} e foi ignorado.`);
      }
      navigate("/carrinho");
    } catch (err) {
      console.error("[useReorder]", err);
      toast.error("Erro ao repetir pedido. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return { reorder, isLoading };
}
