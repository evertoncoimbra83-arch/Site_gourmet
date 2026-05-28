// client/src/pages/profile/logic/useReorder.ts
// Reutiliza pedidos anteriores adicionando todos os itens ao carrinho.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/_core/CartContext";
import { trpc } from "@/_core/trpc";
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
  const [isReorderingSingle, setIsReorderingSingle] = useState<Record<string | number, boolean>>({});

  // Carrega catálogo ativo
  const { data: activeProducts } = trpc.products.list.useQuery(undefined, { staleTime: 1000 * 60 * 5 });
  const { data: activePackages } = trpc.packages.list.useQuery(undefined, { staleTime: 1000 * 60 * 5 });

  const isItemAvailable = (item: OrderItem): boolean => {
    if (!activeProducts || !activePackages) return true;

    const options = safeParseOptions(item.options ?? (item as Record<string, unknown>).parsedOptions);
    const isPackage =
      !!(item as Record<string, unknown>).packageId ||
      options._type === "package_custom" ||
      Array.isArray(options.meals);

    if (isPackage) {
      const packageId = ((item as Record<string, unknown>).packageId) ?? options.packageId;
      if (!packageId) return false;
      return activePackages.some(pkg => String(pkg.id) === String(packageId));
    } else {
      const dishId = Number((item as Record<string, unknown>).dishId ?? options.dishId ?? 0);
      if (!dishId) return false;
      return activeProducts.some(p => Number(p.id) === dishId);
    }
  };

  const reorderSingleItem = async (item: OrderItem) => {
    const itemId = item.id;
    if (!isItemAvailable(item)) {
      toast.error("Este item não está mais disponível no catálogo atual.");
      return;
    }

    setIsReorderingSingle((prev) => ({ ...prev, [itemId]: true }));

    try {
      const entry = mapItemToCartEntry(item);
      if (!entry) {
        toast.error("Não foi possível recuperar os dados deste item.");
        return;
      }

      await addItem(entry);
      
      const isPackage = entry.itemType === "package";
      toast.success(isPackage ? "Combo adicionado ao carrinho!" : "Prato adicionado ao carrinho!");
      navigate("/carrinho");
    } catch (err) {
      console.error("[useReorder] Erro ao recomprar item individual:", err);
      // O toast de erro genérico já é mostrado pelo CartContext se a mutação falhar,
      // mas mostramos um feedback caso ocorra alguma outra exceção.
    } finally {
      setIsReorderingSingle((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const reorder = async (order: Order) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const availableItems = order.items.filter(isItemAvailable);
      const unavailableCount = order.items.length - availableItems.length;

      const entries = availableItems
        .map(mapItemToCartEntry)
        .filter((e): e is NonNullable<typeof e> => e !== null);

      if (entries.length === 0) {
        if (unavailableCount > 0) {
          toast.error("Nenhum item deste pedido está disponível no catálogo atual.");
        } else {
          toast.error("Não foi possível recuperar os itens deste pedido.");
        }
        return;
      }

      // Adiciona sequencialmente para não sobrecarregar
      let addedCount = 0;
      let skippedCount = unavailableCount;

      for (const entry of entries) {
        try {
          await addItem(entry);
          addedCount += 1;
        } catch (err) {
          skippedCount += 1;
          const message =
            err instanceof Error
              ? err.message
              : "Item indisponível no catálogo atual.";
          console.warn("[useReorder] Item ignorado na recompra:", message);
        }
      }

      if (addedCount === 0) {
        toast.error("Nenhum item deste pedido está disponível para recompra.");
        return;
      }

      toast.success(`${addedCount} ${addedCount === 1 ? "item adicionado" : "itens adicionados"} ao carrinho!`);
      if (skippedCount > 0) {
        toast.warning(`${skippedCount} ${skippedCount === 1 ? "item não está mais disponível" : "itens não estão mais disponíveis"} e foi ignorado.`);
      }
      navigate("/carrinho");
    } catch (err) {
      console.error("[useReorder]", err);
      toast.error("Erro ao repetir pedido. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return { reorder, isLoading, isItemAvailable, reorderSingleItem, isReorderingSingle };
}
