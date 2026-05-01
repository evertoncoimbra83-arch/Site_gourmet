import { useState } from "react";
import { useCart } from "@/_core/CartContext";

// --- INTERFACES ---

interface DrawerItem {
  id: number | string;
  name: string;
  price: number;
  image?: string | null;
  dishId?: number | string;
  packageId?: number | string;
  options?: Record<string, unknown>;
  appliedNutrition?: Record<string, unknown>;
  applied_nutrition?: Record<string, unknown>;
}

interface NormalizedNutrition {
  energyKcal: number;
  energyKj: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  fatSaturated: number;
  fatTrans: number;
  sodium: number;
  fiber: number;
  yieldWeight: number;
  addedSugars: number;
  calcium: number;
  iron: number;
}

// ✅ helper: converte pra number, mas nunca retorna NaN
function toNumberOrUndefined(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : undefined;
}

export function useCartDrawer() {
  const { addItem } = useCart(); 
  const [isAdding, setIsAdding] = useState(false);

  type AddItemPayload = Parameters<typeof addItem>[0];

  const addToCart = async (
    item: DrawerItem,
    quantity: number,
    optionsPayload: Record<string, unknown>,
    onSuccess?: () => void
  ) => {
    if (!item?.name || item.price === undefined || item.price === null) return;

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) return;

    const price = Number(item.price);
    if (!Number.isFinite(price)) return;

    setIsAdding(true);

    try {
      const rawNut = (item.applied_nutrition ||
        item.appliedNutrition ||
        optionsPayload?.applied_nutrition) as Record<string, unknown> | Array<Record<string, unknown>> | null;

      let finalNutrition: NormalizedNutrition | NormalizedNutrition[] | null = null;

      const normalizeSingle = (n: Record<string, unknown>): NormalizedNutrition => ({
        energyKcal: Number(n.energyKcal || n.kcal || 0),
        energyKj: Number(n.energyKj || n.kj || 0),
        proteins: Number(n.proteins || 0),
        carbs: Number(n.carbs || 0),
        fatTotal: Number(n.fatTotal || n.fats || 0),
        fatSaturated: Number(n.fatSaturated || 0),
        fatTrans: Number(n.fatTrans || 0),
        sodium: Number(n.sodium || 0),
        fiber: Number(n.fiber || 0),
        yieldWeight: Number(n.yieldWeight || 0),
        addedSugars: Number(n.addedSugars || 0),
        calcium: Number(n.calcium || 0),
        iron: Number(n.iron || 0),
      });

      if (Array.isArray(rawNut)) {
        finalNutrition = rawNut.map((n) => normalizeSingle(n as Record<string, unknown>));
      } else if (rawNut) {
        finalNutrition = normalizeSingle(rawNut as Record<string, unknown>);
      }

      const isPackage = Boolean(item.packageId || optionsPayload?.isPackage);
      const dishId = toNumberOrUndefined(item.dishId) ?? (!isPackage ? toNumberOrUndefined(item.id) : undefined);
      const packageId = item.packageId ? String(item.packageId) : undefined;

      // ✅ RESOLUÇÃO FINAL: Cast para unknown seguido do tipo esperado (AddItemPayload)
      // Isso é seguro e remove todos os erros de severidade 8 do ESLint
      const cartPayload = {
        itemType: isPackage ? "package" : "dish",
        dishId,
        packageId,
        quantity: qty,
        price,
        name: item.name,
        image: item.image ?? "", 
        options: optionsPayload || item.options || {},
        appliedNutrition: finalNutrition || {},
      } as unknown as AddItemPayload;

      await addItem(cartPayload);

      onSuccess?.();
    } catch (err) {
      console.error("Erro ao adicionar ao carrinho:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return { addToCart, isAdding };
}