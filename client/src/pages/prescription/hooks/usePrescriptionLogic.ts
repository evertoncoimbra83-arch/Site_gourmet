import { useMemo, useState, ReactNode } from "react";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { safeNumber } from "@/lib/safe-parse";

export interface PrescriptionOptionData {
  id?: string | number;
  prescriptionId?: string;
  prescriptionItemId?: string;
  source?: "prescription" | string;
  dishId: string | number;
  name: string;
  originalPrice: number;
  priceAtCreation?: number;
  sizeId?: string | number;
  sizeName?: string | null;
  sizeWeight?: string | number | null;
  weight?: string | number | null;
  mainDishWeight?: number | null;
  noAccompanimentsMessage?: string | null;
  fixedPrice?: number;
  discountPercentage?: number;
  legacySizeMissing?: boolean;
  selectedAccompaniments?: Array<{
    id: string | number;
    name: string;
    groupId?: string | number | null;
    groupName?: string | null;
    sourceGroupId?: string | number | null;
    sourceGroupName?: string | null;
    minSelections?: number | string | null;
    maxSelections?: number | string | null;
    defaultGrammage?: number | string | null;
    weight?: number | string | null;
    isNoAccompaniment?: boolean;
    is_no_accompaniment?: boolean;
    energyKcal?: number | string;
    proteins?: number | string;
    carbs?: number | string;
    fatTotal?: number | string;
    /** Marcado pelo getDashboard quando o acc não existe mais no catálogo ativo */
    legacyAccMissing?: boolean;
    unavailable?: boolean;
  }>;
  allowedAccompaniments?: PrescriptionOptionData["selectedAccompaniments"];
  nutritionalData?: {
    sizeName?: string | null;
    sizeWeight?: string | number | null;
    weight?: string | number | null;
    noAccompanimentsMessage?: string | null;
    mainDishWeight?: number;
    baseMacros?: {
      kcal?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
  [key: string]: unknown;
}

export interface PatientMeal {
  mealName: string;
  notes?: string;
  dishes: PrescriptionOptionData[];
}

export interface PatientPrescription {
  technicalInsight: ReactNode | string;
  id: string;
  planName: string;
  discountPercentage: number;
  meals: PatientMeal[];
}

export function usePrescriptionLogic() {
  // ✅ FIX: Restauramos a chamada original do banco de dados (getDashboard)
  // e forçamos o TypeScript a aceitar para não quebrar o seu código.
  const nutriApi = trpc.nutri as unknown as {
    myPrescription: {
      getDashboard: {
        useQuery: () => { data: unknown; isLoading: boolean }
      }
    }
  };

  const prescriptionsQuery = nutriApi.myPrescription.getDashboard.useQuery();

  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const { addItem, items } = useCart();
  const navigate = useNavigate();

  const allPrescriptions = useMemo(() => {
    const rawData = prescriptionsQuery.data;
    if (!rawData || !Array.isArray(rawData)) return [];

    return (rawData as Record<string, unknown>[]).map((raw): PatientPrescription => ({
      id: String(raw.id || ""),
      planName: String(raw.planName || raw.plan_name || "Plano Alimentar"),
      discountPercentage: Number(raw.discountPercentage || raw.discount_percentage || 0),
      technicalInsight: String(raw.technicalInsight || ""),
      meals: ((raw.meals || []) as Record<string, unknown>[]).map((m): PatientMeal => ({
        mealName: String(m.mealName || "Refeição"),
        notes: String(m.notes || ""),
        dishes: ((m.dishes || []) as Record<string, unknown>[]).map((d): PrescriptionOptionData => ({
          ...d,
          dishId: d.dishId as string | number,
          name: String(d.name || "Prato"),
          originalPrice: Number(d.priceAtCreation || d.price || 0),
        }))
      }))
    }));
  }, [prescriptionsQuery.data]);

  const activePlan = allPrescriptions[selectedPlanIndex] || null;

  const handleAddToCart = async (dish: PrescriptionOptionData) => {
    if (!dish.dishId || !activePlan) return;

    if (dish.legacySizeMissing) {
      toast.error("Este prato usa um tamanho legado e precisa ser atualizado pelo nutricionista.");
      return;
    }

    // ✅ P0 FIX: Bloquear se sizeId inválido (0, null ou undefined)
    const numericSizeId = Number(dish.sizeId);
    if (!numericSizeId || !Number.isFinite(numericSizeId)) {
      toast.error("Este prato não tem tamanho definido. Peça ao nutricionista para atualizar o plano.");
      return;
    }

    const accsToUse = (
      dish.selectedAccompaniments ||
      dish.allowedAccompaniments ||
      []
    );

    // ✅ P0 FIX: Bloquear se algum acompanhamento foi marcado como indisponível pelo getDashboard
    const hasUnavailableAcc = accsToUse.some(
      (acc) =>
        (acc as Record<string, unknown>).legacyAccMissing === true ||
        (acc as Record<string, unknown>).unavailable === true,
    );
    if (hasUnavailableAcc) {
      toast.error(
        "Esta prescrição usa acompanhamentos que não estão mais disponíveis. " +
        "Peça ao nutricionista para atualizar o plano.",
      );
      return;
    }

    try {
      const discount = safeNumber(activePlan.discountPercentage);
      const finalPrice = discount > 0
        ? dish.originalPrice * (1 - discount / 100)
        : dish.originalPrice;

      const selectedSizeName =
        dish.sizeName ||
        dish.nutritionalData?.sizeName ||
        undefined;

      // ✅ P0 FIX: weight vem de defaultGrammage do grupo (gramagem do acompanhamento),
      // nunca de mainDishWeight ou sizeWeight (que são do prato/tamanho, não do acompanhamento)
      const selectedAccs = accsToUse.map((acc) => ({
        id: Number(acc.id),
        name: acc.name,
        weight: safeNumber(acc.defaultGrammage ?? acc.weight, 100),
        defaultGrammage: safeNumber(acc.defaultGrammage ?? acc.weight, 100),
        groupId: acc.groupId ?? acc.sourceGroupId ?? undefined,
        groupName: acc.groupName ?? acc.sourceGroupName ?? undefined,
        minSelections:
          acc.minSelections === null || acc.minSelections === undefined
            ? undefined
            : safeNumber(acc.minSelections),
        maxSelections:
          acc.maxSelections === null || acc.maxSelections === undefined
            ? undefined
            : safeNumber(acc.maxSelections),
        isNoAccompaniment: Boolean(acc.isNoAccompaniment ?? acc.is_no_accompaniment),
        is_no_accompaniment: Boolean(acc.isNoAccompaniment ?? acc.is_no_accompaniment),
        energyKcal: safeNumber(acc.energyKcal),
        proteins: safeNumber(acc.proteins),
        carbs: safeNumber(acc.carbs),
        fatTotal: safeNumber(acc.fatTotal),
      }));

      await addItem({
        itemType: "dish",
        dishId: String(dish.dishId),
        quantity: 1,
        price: finalPrice,
        name: dish.name,
        image: "",
        options: {
          _type: "single",
          dishId: String(dish.dishId),
          dishName: dish.name,
          source: "prescription",
          prescriptionId: dish.prescriptionId || activePlan.id,
          prescriptionItemId: dish.prescriptionItemId || String(dish.id || ""),
          prescriptionDiscountPercentage: discount,
          prescriptionFixedPrice: safeNumber(dish.fixedPrice ?? dish.priceAtCreation ?? dish.originalPrice),
          // ✅ P0 FIX: selectedSizeId sempre explícito quando sizeId > 0
          selectedSizeId: String(numericSizeId),
          selectedSizeName,
          sizeName: selectedSizeName,
          weight: dish.sizeWeight ?? dish.weight ?? dish.nutritionalData?.sizeWeight ?? dish.nutritionalData?.weight ?? null,
          sizeWeight: dish.sizeWeight ?? dish.weight ?? dish.nutritionalData?.sizeWeight ?? dish.nutritionalData?.weight ?? null,
          mainDishWeight: safeNumber(dish.mainDishWeight ?? dish.nutritionalData?.mainDishWeight),
          noAccompanimentsMessage:
            dish.noAccompanimentsMessage ??
            dish.nutritionalData?.noAccompanimentsMessage ??
            undefined,
          selectedAccs,
          selectedAccompaniments: selectedAccs,
        },
        appliedNutrition: {
          energyKcal: Number(dish.nutritionalData?.baseMacros?.kcal || 0),
          proteins: Number(dish.nutritionalData?.baseMacros?.protein || 0),
          carbs: Number(dish.nutritionalData?.baseMacros?.carbs || 0),
          fatTotal: Number(dish.nutritionalData?.baseMacros?.fat || 0),
        }
      } as unknown as Parameters<typeof addItem>[0]);

      toast.success(`${dish.name} adicionado ao carrinho!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar o prato.");
    }
  };

  return {
    isLoading: prescriptionsQuery.isLoading,
    allPrescriptions,
    activePlan,
    selectedPlanIndex,
    setSelectedPlanIndex,
    totalCartItems: items?.length || 0,
    handleAddToCart,
    navigate
  };
}
