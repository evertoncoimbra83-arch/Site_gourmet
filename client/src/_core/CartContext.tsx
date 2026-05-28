//src/_core/CartContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { type AnalyticsItem, useAnalytics } from "@/_core/hooks/useAnalytics";
import { appToast as toast } from "@/lib/app-toast";
import { calculateGrandTotal, normalizeGourmetOptions } from "../../../shared/domain/math/pricing";
import { normalizeImageUrl } from "@shared/utils/assets";
import type {
  Id,
  NutritionValues,
  PackageCustomOptions,
  ProductCustomOptions,
} from "@/_core/type/utils";

export interface LocalCartItem {
  id: string;
  uniqueKey: string;
  itemType: "dish" | "package";
  dishId?: number;
  packageId?: Id;
  quantity: number;
  price: number;
  name: string;
  image: string;
  addedAt: number;
  options: PackageCustomOptions | ProductCustomOptions;
  appliedNutrition: NutritionValues;
  sizeName?: string | null;
}

interface ServerTotalsMetadata {
  subtotal?: number | string;
  shipping?: number | string;
  loyaltyDiscount?: number | string;
  couponDiscount?: number | string;
  autoDiscount?: number | string;
  totalDiscounts?: number | string;
  total?: number | string;
  couponCode?: string;
  couponError?: string | null;
  couponDescription?: string;
  couponBannerColor?: string;
  couponLogoUrl?: string;
}

export interface CartTotals {
  totalQuantity: number;
  subtotal: number;
  loyaltyDiscount: number;
  couponDiscount: number;
  autoDiscount: number;
  total: number;
  shipping: number;
  couponCode: string;
  couponError: string | null;
  couponDescription?: string;
  couponBannerColor?: string;
  couponLogoUrl?: string;
}

export interface CartContextType {
  items: LocalCartItem[];
  addItem: (item: Omit<LocalCartItem, "id" | "addedAt" | "uniqueKey">) => Promise<string>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  getTotalItems: () => number;
  isAdding: boolean;
  totals: CartTotals;
  isLoading: boolean;
  cartId: string | null;
  usesLoyalty: boolean;
  toggleLoyalty: (active: boolean) => Promise<void>;
  loyaltyPoints: number;
  money: (v: number) => string;
  loyaltySettings: Record<string, unknown> | null;
}

interface RawServerItem {
  id: string | number;
  packageId?: number | string | null;
  dishId?: number | string | null;
  quantity: number;
  unitPrice?: number | string;
  unit_price?: number | string;
  name?: string;
  imageUrl?: string;
  dish?: { image?: string };
  package?: { image?: string };
  options?: string | Record<string, unknown> | null;
  appliedNutrition?: string | Record<string, unknown> | null;
  createdAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return isString(value) && value.trim() ? value : undefined;
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  if (!isString(value) || !value.trim()) return {};

  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeTotalsMetadata(value: unknown): ServerTotalsMetadata {
  const record = isRecord(value) ? value : {};

  return {
    subtotal: record.subtotal as number | string | undefined,
    shipping: record.shipping as number | string | undefined,
    loyaltyDiscount: record.loyaltyDiscount as number | string | undefined,
    couponDiscount: record.couponDiscount as number | string | undefined,
    autoDiscount: record.autoDiscount as number | string | undefined,
    totalDiscounts: record.totalDiscounts as number | string | undefined,
    total: record.total as number | string | undefined,
    couponCode: toStringOrUndefined(record.couponCode),
    couponError:
      record.couponError === null || isString(record.couponError)
        ? record.couponError
        : null,
    couponDescription: toStringOrUndefined(record.couponDescription),
    couponBannerColor: toStringOrUndefined(record.couponBannerColor),
    couponLogoUrl: toStringOrUndefined(record.couponLogoUrl),
  };
}

function normalizeRawServerItem(value: unknown): RawServerItem | null {
  if (!isRecord(value)) return null;
  if (!("id" in value)) return null;

  return {
    id: value.id as string | number,
    packageId:
      "packageId" in value && (typeof value.packageId === "string" || typeof value.packageId === "number")
        ? value.packageId
        : null,
    dishId:
      "dishId" in value && (typeof value.dishId === "string" || typeof value.dishId === "number")
        ? value.dishId
        : null,
    quantity: toNumber(value.quantity, 1),
    unitPrice:
      typeof value.unitPrice === "string" || typeof value.unitPrice === "number"
        ? value.unitPrice
        : undefined,
    unit_price:
      typeof value.unit_price === "string" || typeof value.unit_price === "number"
        ? value.unit_price
        : undefined,
    name: toStringOrUndefined(value.name),
    imageUrl: toStringOrUndefined(value.imageUrl),
    dish: isRecord(value.dish)
      ? { image: toStringOrUndefined(value.dish.image) }
      : undefined,
    package: isRecord(value.package)
      ? { image: toStringOrUndefined(value.package.image) }
      : undefined,
    options:
      isString(value.options) || isRecord(value.options) || value.options === null
        ? value.options
        : null,
    appliedNutrition:
      isString(value.appliedNutrition) ||
      isRecord(value.appliedNutrition) ||
      value.appliedNutrition === null
        ? value.appliedNutrition
        : null,
    createdAt: toStringOrUndefined(value.createdAt),
  };
}

function normalizeServerItems(value: unknown): RawServerItem[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeRawServerItem).filter((item): item is RawServerItem => item !== null);
}

function normalizeNutrition(value: unknown): NutritionValues {
  const record = parseRecord(value);

  return {
    energyKcal: toNumber(record.energyKcal),
    energyKj: toOptionalNumber(record.energyKj),
    proteins: toNumber(record.proteins),
    carbs: toNumber(record.carbs),
    fatTotal: toNumber(record.fatTotal),
    fatSaturated: toOptionalNumber(record.fatSaturated),
    fatTrans: toOptionalNumber(record.fatTrans),
    fiber: toOptionalNumber(record.fiber),
    sodium: toOptionalNumber(record.sodium),
    addedSugars: toOptionalNumber(record.addedSugars),
    calcium: toOptionalNumber(record.calcium),
    iron: toOptionalNumber(record.iron),
    yieldWeight: toOptionalNumber(record.yieldWeight),
  };
}

function normalizeAccompaniments(value: unknown): PackageCustomOptions["meals"][number]["accompaniments"] {
  if (!Array.isArray(value)) return [];

  const result: PackageCustomOptions["meals"][number]["accompaniments"] = [];

  for (const acc of value) {
    if (!isRecord(acc)) continue;
    const id = acc.id;
    const name = toStringOrUndefined(acc.name);
    if ((typeof id !== "string" && typeof id !== "number") || !name) continue;

    result.push({
      id,
      name,
      weight: typeof acc.weight === "number" ? acc.weight : undefined,
      groupId:
        typeof acc.groupId === "string" || typeof acc.groupId === "number"
          ? acc.groupId
          : undefined,
    });
  }

  return result;
}

function normalizePackageOptions(record: Record<string, unknown>): PackageCustomOptions {
  const meals = Array.isArray(record.meals)
    ? record.meals
        .map((meal, index) => {
          if (!isRecord(meal)) return null;

          return {
            label:
              toStringOrUndefined(meal.label) ||
              toStringOrUndefined(meal.slotName) ||
              `Marmita ${index + 1}`,
            dishId:
              typeof meal.dishId === "string" || typeof meal.dishId === "number"
                ? meal.dishId
                : null,
            dishName: toStringOrUndefined(meal.dishName) || "Marmita",
            accompaniments: normalizeAccompaniments(meal.accompaniments),
          };
        })
        .filter((meal): meal is PackageCustomOptions["meals"][number] => meal !== null)
    : [];

  return {
    _type: "package_custom",
    packageId:
      typeof record.packageId === "string" || typeof record.packageId === "number"
        ? record.packageId
        : "package",
    sizeName: record.sizeName,
    meals,
  };
}

function normalizeProductOptions(record: Record<string, unknown>): ProductCustomOptions {
  const dishId =
    typeof record.dishId === "string" || typeof record.dishId === "number"
      ? record.dishId
      : "dish";

  const selectedAccs = Array.isArray(record.selectedAccs)
    ? record.selectedAccs
        .map((acc) => {
          if (!isRecord(acc)) return null;
          const id = acc.id;
          const name = toStringOrUndefined(acc.name);
          if ((typeof id !== "string" && typeof id !== "number") || !name) return null;
          const groupId =
            typeof acc.groupId === "string" || typeof acc.groupId === "number"
              ? acc.groupId
              : undefined;

          const normalizedAcc: ProductCustomOptions["selectedAccs"][number] = {
            id,
            name,
            weight: toNumber(acc.weight),
            groupName: toStringOrUndefined(acc.groupName) || "",
          };

          return groupId === undefined ? normalizedAcc : { ...normalizedAcc, groupId };
        })
        .filter((acc): acc is ProductCustomOptions["selectedAccs"][number] => acc !== null)
    : [];

  return {
    _type: "single",
    dishId,
    selectedSizeId:
      typeof record.selectedSizeId === "string" || typeof record.selectedSizeId === "number"
        ? record.selectedSizeId
        : dishId,
    selectedSizeName: toStringOrUndefined(record.selectedSizeName) || "",
    selectedAccs,
  };
}

function normalizeCartOptions(
  rawOptions: Record<string, unknown>,
): PackageCustomOptions | ProductCustomOptions {
  const normalizedPricingOptions = normalizeGourmetOptions(rawOptions);
  const merged = {
    ...rawOptions,
    ...parseRecord(normalizedPricingOptions),
  };

  if (
    merged._type === "package_custom" ||
    Array.isArray(merged.meals) ||
    merged.packageId !== undefined
  ) {
    return normalizePackageOptions(merged);
  }

  return normalizeProductOptions(merged);
}

function normalizeLoyaltySettings(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function toNutritionPayload(nutrition: NutritionValues): Record<string, unknown> {
  return {
    energyKcal: nutrition.energyKcal,
    energyKj: nutrition.energyKj,
    proteins: nutrition.proteins,
    carbs: nutrition.carbs,
    fatTotal: nutrition.fatTotal,
    fatSaturated: nutrition.fatSaturated,
    fatTrans: nutrition.fatTrans,
    fiber: nutrition.fiber,
    sodium: nutrition.sodium,
    addedSugars: nutrition.addedSugars,
    calcium: nutrition.calcium,
    iron: nutrition.iron,
    yieldWeight: nutrition.yieldWeight,
  };
}

function getCartItemIdFromMutation(value: unknown): string {
  if (!isRecord(value)) return "";
  const cartItemId = value.cartItemId;
  if (typeof cartItemId === "string" || typeof cartItemId === "number") {
    return String(cartItemId);
  }
  return "";
}

function buildAnalyticsItem(item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  itemType: "dish" | "package";
  sizeName?: string | null;
}): AnalyticsItem {
  return {
    item_id: item.id,
    item_name: item.name,
    price: toNumber(item.price),
    quantity: toNumber(item.quantity, 1),
    item_category: item.itemType === "package" ? "Pacote" : "Prato Avulso",
    item_variant: item.sizeName || undefined,
  };
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { trackAddToCart, trackRemoveFromCart } = useAnalytics();
  const utils = trpc.useUtils();

  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [usesLoyalty, setUsesLoyalty] = useState(false);
  const lastSyncedUserIdRef = useRef<string | null | undefined>(undefined);
  const activeUserId = user?.id ? String(user.id) : null;

  const { data: serverCartRaw, isLoading: isCartLoading } = trpc.store.cart.getSummary.useQuery(
    undefined,
    {
      staleTime: 15000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );
  const { data: loyaltyBalanceData } = trpc.store.loyalty.getUserBalance.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: loyaltySettingsRaw } = trpc.store.loyalty.getSettings.useQuery();

  const invalidate = () => utils.store.cart.getSummary.invalidate();

  const addItemMutation = trpc.store.cart.items.addItem.useMutation({ onSuccess: invalidate });
  const updateQuantityMutation = trpc.store.cart.items.updateQuantity.useMutation({
    onSuccess: invalidate,
  });
  const removeItemMutation = trpc.store.cart.items.removeItem.useMutation({
    onSuccess: invalidate,
  });
  const toggleLoyaltyMutation = trpc.store.cart.toggleLoyalty.useMutation({
    onSuccess: invalidate,
  });

  const resetCartCache = () => {
    utils.store.cart.getSummary.setData(undefined, null);
    setItems([]);
    setUsesLoyalty(false);
  };

  useEffect(() => {
    if (lastSyncedUserIdRef.current === undefined) {
      lastSyncedUserIdRef.current = activeUserId;
      return;
    }

    if (lastSyncedUserIdRef.current === activeUserId) return;
    lastSyncedUserIdRef.current = activeUserId;

    void utils.store.cart.getSummary.invalidate();
  }, [activeUserId, utils]);

  // ✅ FIX 3: money usa Number.isFinite em vez de v || 0
  // Evita formatar NaN como "R$ 0,00" silenciosamente
  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number.isFinite(v) ? v : 0,
    );

  const totals: CartTotals = useMemo(() => {
    const styling = normalizeTotalsMetadata(serverCartRaw?.totals);
    const subtotalFromItems = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const subtotal = toNumber(styling.subtotal, subtotalFromItems);
    const shipping = toNumber(styling.shipping);
    const loyaltyDiscount = toNumber(styling.loyaltyDiscount);
    const autoDiscount = toNumber(styling.autoDiscount);
    const couponDiscount = toNumber(styling.couponDiscount);
    const totalDiscounts = toNumber(
      styling.totalDiscounts,
      loyaltyDiscount + autoDiscount + couponDiscount,
    );
    const total = toNumber(
      styling.total,
      calculateGrandTotal(subtotal, shipping, totalDiscounts),
    );

    const raw = serverCartRaw as Record<string, unknown> | null | undefined;
    const rootBannerColor = raw?.couponBannerColor as string | undefined;
    const rootLogoUrl = raw?.couponLogoUrl as string | undefined;
    const rootDescription = raw?.couponDescription as string | undefined;

    return {
      totalQuantity: items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal,
      shipping,
      loyaltyDiscount,
      couponDiscount,
      autoDiscount,
      total,
      couponCode: styling.couponCode || "",
      couponError: styling.couponError || null,
      couponDescription: styling.couponDescription || rootDescription,
      couponBannerColor: styling.couponBannerColor || rootBannerColor,
      couponLogoUrl: styling.couponLogoUrl || rootLogoUrl,
    };
  }, [items, serverCartRaw]);

  useEffect(() => {
    const mappedItems = normalizeServerItems(serverCartRaw?.items).map((item) => {
      const rawOptions = parseRecord(item.options);
      const normalizedOptions = normalizeCartOptions(rawOptions);

      return {
        uniqueKey: String(item.id),
        id: String(item.id),
        itemType: item.packageId ? "package" : "dish",
        dishId: toOptionalNumber(item.dishId),
        packageId: item.packageId ?? undefined,
        quantity: toNumber(item.quantity, 1),
        price: toNumber(item.unitPrice ?? item.unit_price),
        name: item.name || (item.packageId ? "Pacote" : "Item"),
        image: normalizeImageUrl(item.imageUrl || item.dish?.image || item.package?.image),
        options: normalizedOptions,
        appliedNutrition: normalizeNutrition(item.appliedNutrition),
        addedAt: new Date(item.createdAt || Date.now()).getTime(),
        sizeName:
          "sizeName" in normalizedOptions && typeof normalizedOptions.sizeName === "string"
            ? normalizedOptions.sizeName
            : "selectedSizeName" in normalizedOptions
              ? normalizedOptions.selectedSizeName
              : null,
      } satisfies LocalCartItem;
    });

    setItems(mappedItems);
    setUsesLoyalty(Boolean(serverCartRaw?.usesLoyalty));
  }, [serverCartRaw]);

  const contextValue: CartContextType = {
    items,
    totals,
    isLoading: isCartLoading,
    cartId: serverCartRaw?.cartId ? String(serverCartRaw.cartId) : null,
    usesLoyalty,
    loyaltyPoints: toNumber(loyaltyBalanceData?.balance),
    money,
    loyaltySettings: normalizeLoyaltySettings(loyaltySettingsRaw),

    addItem: async (item) => {
      try {
        const res = await addItemMutation.mutateAsync({
          dishId: item.dishId,
          packageId: typeof item.packageId === "number" ? item.packageId : undefined,
          quantity: item.quantity,
          optionsPayload: item.options,
          nutritionPayload: toNutritionPayload(item.appliedNutrition),
        });

        trackAddToCart(
          buildAnalyticsItem({
            id: String(item.dishId ?? item.packageId ?? item.name),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            itemType: item.itemType,
            sizeName: item.sizeName,
          }),
        );

        toast.success("Adicionado!");
        return getCartItemIdFromMutation(res);

      } catch (error: unknown) {
        console.error("[CartContext] Erro ao adicionar item:", error);

        try {
          await utils.store.cart.getSummary.invalidate();
          await utils.store.cart.getSummary.fetch();
        } catch (e) {
          console.warn("[CartContext] erro ao ressincronizar carrinho", e);
        }

        const err = error as { message?: string };
        let message = "Erro ao adicionar item. Tente novamente.";
        if (err.message?.toLowerCase().includes("limite")) {
          message = "Você selecionou mais acompanhamentos do que o permitido.";
        }
        if (err.message?.toLowerCase().includes("obrigat")) {
          message = "Selecione todos os acompanhamentos obrigatórios.";
        }

        toast.error(message);
        throw error;
      }
    },

    removeItem: async (itemId) => {
      const existingItem = items.find((item) => item.id === itemId);
      try {
        await removeItemMutation.mutateAsync({ cartItemId: itemId });
      } catch (error) {
        console.error("[CartContext] Erro ao remover item do carrinho:", error);
        toast.error("Erro ao remover item do carrinho");
        throw error;
      }

      if (existingItem) {
        trackRemoveFromCart(
          buildAnalyticsItem({
            id: existingItem.id,
            name: existingItem.name,
            price: existingItem.price,
            quantity: existingItem.quantity,
            itemType: existingItem.itemType,
            sizeName: existingItem.sizeName,
          }),
        );
      }

      toast.success("Item removido do carrinho");
    },

    updateQuantity: async (itemId, quantity) => {
      const existingItem = items.find((item) => item.id === itemId);

      if (quantity < 1) {
        try {
          await removeItemMutation.mutateAsync({ cartItemId: itemId });
        } catch (error) {
          console.error("[CartContext] Erro ao remover item do carrinho:", error);
          toast.error("Erro ao remover item do carrinho");
          throw error;
        }

        if (existingItem) {
          trackRemoveFromCart(
            buildAnalyticsItem({
              id: existingItem.id,
              name: existingItem.name,
              price: existingItem.price,
              quantity: existingItem.quantity,
              itemType: existingItem.itemType,
              sizeName: existingItem.sizeName,
            }),
          );
        }

        toast.success("Item removido do carrinho");
        return;
      }

      // ✅ FIX 1: try/catch no caminho do update — antes propagava erro sem feedback
      try {
        await updateQuantityMutation.mutateAsync({ cartItemId: itemId, quantity });
      } catch (error) {
        console.error("[CartContext] Erro ao atualizar quantidade:", error);
        toast.error("Erro ao atualizar quantidade. Tente novamente.");
        throw error;
      }

      if (existingItem && quantity > existingItem.quantity) {
        trackAddToCart(
          buildAnalyticsItem({
            id: existingItem.id,
            name: existingItem.name,
            price: existingItem.price,
            quantity: quantity - existingItem.quantity,
            itemType: existingItem.itemType,
            sizeName: existingItem.sizeName,
          }),
        );
      }

      if (existingItem && quantity < existingItem.quantity) {
        trackRemoveFromCart(
          buildAnalyticsItem({
            id: existingItem.id,
            name: existingItem.name,
            price: existingItem.price,
            quantity: existingItem.quantity - quantity,
            itemType: existingItem.itemType,
            sizeName: existingItem.sizeName,
          }),
        );
      }
    },

    clearCart: () => {
      resetCartCache();
      invalidate();
    },

    // ✅ FIX 2: refreshCart com try/catch — antes propagava erro sem feedback
    refreshCart: async () => {
      try {
        await invalidate();
      } catch (error) {
        console.error("[CartContext] Erro ao atualizar carrinho:", error);
        toast.error("Erro ao atualizar carrinho.");
      }
    },

    getTotalItems: () => items.reduce((acc, item) => acc + item.quantity, 0),
    isAdding: addItemMutation.isPending,

    toggleLoyalty: async (active) => {
      setUsesLoyalty(active);
      try {
        await toggleLoyaltyMutation.mutateAsync({ active });
      } catch {
        setUsesLoyalty(!active);
      }
    },
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}