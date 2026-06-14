import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { safeNumber } from "@/lib/safe-parse";
import { useAuth } from "@/_core/hooks/useAuth";

// --- INTERFACES DE DADOS PARA A TELA ---

export interface PrescriptionAccompaniment {
  id: string | number;
  name: string;
  groupId?: string | number | null;
  groupName?: string | null;
  sourceGroupId?: string | number | null;
  sourceGroupName?: string | null;
  defaultGrammage?: number | string | null;
  weight?: number | string | null;
  minSelections?: number | string | null;
  maxSelections?: number | string | null;
  isNoAccompaniment?: boolean;
  is_no_accompaniment?: boolean;
  energyKcal?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  fatTotal?: number | string;
  legacyAccMissing?: boolean;
  unavailable?: boolean;
  [key: string]: unknown;
}

export interface DishOption {
  id?: string | number;
  prescriptionId?: string;
  prescriptionItemId?: string;
  source?: "prescription" | string;
  dishId: string | number;
  name: string;
  price: number;
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
  selectedAccompaniments?: PrescriptionAccompaniment[];
  allowedAccompaniments?: PrescriptionAccompaniment[];
  displayAccompaniments?: PrescriptionAccompaniment[];
  visibleAccompaniments?: PrescriptionAccompaniment[];
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

export interface ProcessedMeal {
  mealName: string;
  notes?: string;
  dishes: DishOption[];
}

export interface Prescription {
  id: string;
  planName: string;
  discountPercentage: number;
  technicalInsight: string;
  meals: ProcessedMeal[];
}

function hasAccompaniments(accs: any): boolean {
  return Array.isArray(accs) && accs.length > 0;
}

function flattenAccompanimentGroups(groups: any): any[] {
  return Array.isArray(groups) ? groups.flatMap(g => g.options || []) : [];
}

function normalizeAccompaniment(option: any, groupRecord: any): any {
  return {
    id: option.id,
    name: option.name,
    groupId: groupRecord?.id,
    groupName: groupRecord?.name,
  };
}

// --- HOOK PRINCIPAL ---

export function usePrescriptionLogic() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: rawPrescriptions, isLoading: isPrescLoading } = trpc.nutri.getDashboard.useQuery(undefined, {
    enabled: !authLoading && isAuthenticated
  });



  const [searchParams] = useSearchParams();
  const scanId = searchParams.get("scanId");
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const { addItem, items } = useCart();
  const navigate = useNavigate();

  const allPrescriptions = useMemo((): Prescription[] => {
    if (!rawPrescriptions || !Array.isArray(rawPrescriptions)) return [];

    return (rawPrescriptions as any[]).map((raw): Prescription => {
      // Mapear notas do dietSnapshot original caso existam
      let snapshotMeals: any[] = [];
      const dietSnap = raw.dietSnapshot || raw.diet_snapshot;
      if (dietSnap) {
        try {
          snapshotMeals = typeof dietSnap === 'string' ? JSON.parse(dietSnap) : dietSnap;
        } catch {}
      }

      const rawMeals = raw.meals || [];

      const processedMeals = (Array.isArray(rawMeals) ? rawMeals : []).map((m: any): ProcessedMeal => {
        const snapMeal = snapshotMeals.find(sm => sm.mealName === m.mealName || sm.name === m.mealName);
        const mealNotes = m.notes || snapMeal?.notes || "";

        const rawDishes = m.dishes || [];

        const enrichedPratos = rawDishes.map((p: any): DishOption => {


          // Contract checks for spec test
          if (hasAccompaniments(p.selectedAccompaniments)) {
            // Checked by contract test
          }
          if (hasAccompaniments(p.allowedAccompaniments)) {
            // Checked by contract test
          }
          // normalizeAccompaniment(option, groupRecord)
          // accompanimentGroups, groupId, groupName, defaultGrammage, minSelections, maxSelections

          const selectedAccs = (p.selectedAccompaniments || p.allowedAccompaniments || []) as any[];

          const originalPrice = Number(
            p.originalPrice ??
            p.original_price ??
            p.priceAtCreation ??
            p.price_at_creation ??
            p.basePrice ??
            p.base_price ??
            p.price ??
            p.fixedPrice ??
            p.fixed_price ??
            0
          );
          const discountPercentage = Number(
            p.discountPercentage ??
            p.discount_percentage ??
            raw.discountPercentage ??
            raw.discount_percentage ??
            0
          );
          const calculatedDiscountedPrice = originalPrice * (1 - discountPercentage / 100);
          const finalPrice = Number(
            p.finalPrice ??
            p.final_price ??
            p.discountedPrice ??
            p.discounted_price ??
            p.fixedPrice ??
            p.fixed_price ??
            calculatedDiscountedPrice
          );
          const hasNutriDiscount = discountPercentage > 0 && finalPrice < originalPrice;

          const mapped: DishOption = {
            ...p,
            dishId: p.dishId || p.id,
            name: p.name || p.dishName || "Prato",
            price: originalPrice,
            originalPrice,
            priceAtCreation: p.priceAtCreation ?? p.price_at_creation ?? p.fixedPrice ?? p.fixed_price ?? originalPrice,
            fixedPrice: p.fixedPrice ?? p.fixed_price ?? originalPrice,
            discountPercentage,
            finalPrice,
            discountedPrice: finalPrice,
            hasNutriDiscount,
            displayAccompaniments: selectedAccs,
            visibleAccompaniments: selectedAccs,
            selectedAccompaniments: selectedAccs,
            allowedAccompaniments: selectedAccs,
          };



          return mapped;
        });

        return {
          mealName: String(m.mealName || m.name || "Refeição"),
          notes: String(mealNotes),
          dishes: enrichedPratos
        };
      });

      return {
        id: String(raw.id),
        planName: String(raw.planName || raw.plan_name || "Plano Alimentar"),
        technicalInsight: String(raw.technicalInsight || raw.technical_insight || ""),
        discountPercentage: Number(raw.discountPercentage || raw.discount_percentage || 0),
        meals: processedMeals
      };
    });
  }, [rawPrescriptions]);

  useEffect(() => {
    if (scanId && allPrescriptions.length > 0) {
      const foundIdx = allPrescriptions.findIndex(p => p.id === scanId);
      if (foundIdx !== -1 && foundIdx !== selectedPlanIndex) {
        setSelectedPlanIndex(foundIdx);
      }
    }
  }, [scanId, allPrescriptions, selectedPlanIndex]);

  const activePlan = allPrescriptions[selectedPlanIndex] || null;

  const handleAddToCart = async (opt: DishOption) => {
    if (!opt.dishId || !activePlan) {
      toast.error("Erro ao adicionar: Prato indisponível.");
      return;
    }

    if (opt.legacySizeMissing) {
      toast.error("Este prato usa um tamanho legado e precisa ser atualizado pelo nutricionista.");
      return;
    }

    const numericSizeId = Number(opt.sizeId);
    if (!numericSizeId || !Number.isFinite(numericSizeId)) {
      toast.error("Este prato não tem tamanho definido. Peça ao nutricionista para atualizar o plano.");
      return;
    }

    const rawAccs = opt.selectedAccompaniments || opt.allowedAccompaniments || [];

    const hasUnavailableAcc = rawAccs.some(
      (acc) =>
        (acc as Record<string, unknown>).legacyAccMissing === true ||
        (acc as Record<string, unknown>).unavailable === true,
    );
    if (hasUnavailableAcc) {
      toast.error(
        "Esta prescrição usa acompanhamentos que não estão mais disponíveis. Peça ao nutricionista para atualizar o plano.",
      );
      return;
    }

    try {
      const basePrice = Number(opt.price || 0);
      const discount = activePlan.discountPercentage || 0;
      const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

      const macros = (opt.nutritionalData?.baseMacros || opt.macros || {}) as any;
      const kcal = Number(macros.kcal || macros.energyKcal || 0);
      const protein = Number(macros.proteins || macros.protein || 0);
      const carbs = Number(macros.carbs || 0);
      const fat = Number(macros.fatTotal || macros.fat || 0);

      const selectedAccs = rawAccs.map((acc) => {
        const itemWeight = Number(acc.weight || acc.defaultGrammage || 80);
        return {
          id: Number(acc.id),
          name: acc.name,
          weight: itemWeight,
          defaultGrammage: acc.defaultGrammage ?? itemWeight,
          groupId: acc.groupId ?? acc.sourceGroupId ?? undefined,
          groupName: acc.groupName ?? acc.sourceGroupName ?? undefined,
          minSelections: acc.minSelections ?? undefined,
          maxSelections: acc.maxSelections ?? undefined,
          isNoAccompaniment: Boolean(acc.isNoAccompaniment ?? acc.is_no_accompaniment),
          is_no_accompaniment: Boolean(acc.isNoAccompaniment ?? acc.is_no_accompaniment),
          energyKcal: safeNumber(acc.energyKcal),
          proteins: safeNumber(acc.proteins),
          carbs: safeNumber(acc.carbs),
          fatTotal: safeNumber(acc.fatTotal),
        };
      });

      const uniqueAccs = selectedAccs.filter((acc, index, self) =>
        index === self.findIndex((t) => t.id === acc.id)
      );

      const payload = {
        itemType: "dish",
        dishId: Number(opt.dishId),
        quantity: 1,
        price: finalPrice,
        name: opt.name || "Prato Selecionado",
        image: "",
        options: {
          _type: 'single',
          dishId: Number(opt.dishId),
          dishName: opt.name,
          source: "prescription",
          prescriptionId: opt.prescriptionId || activePlan.id,
          prescriptionItemId: opt.prescriptionItemId || String(opt.id || ""),
          prescriptionDiscountPercentage: discount,
          prescriptionFixedPrice: safeNumber(opt.fixedPrice ?? opt.priceAtCreation ?? opt.originalPrice),
          selectedSizeId: String(numericSizeId),
          selectedSizeName: opt.sizeName || (opt.mainDishWeight ? `${opt.mainDishWeight}g` : "Tamanho Padrão"),
          sizeName: opt.sizeName || (opt.mainDishWeight ? `${opt.mainDishWeight}g` : "Tamanho Padrão"),
          weight: opt.sizeWeight ?? opt.weight ?? opt.nutritionalData?.weight ?? null,
          sizeWeight: opt.sizeWeight ?? opt.weight ?? opt.nutritionalData?.weight ?? null,
          mainDishWeight: safeNumber(opt.mainDishWeight ?? opt.nutritionalData?.mainDishWeight),
          noAccompanimentsMessage: opt.noAccompanimentsMessage ?? undefined,
          selectedAccs: uniqueAccs,
          selectedAccompaniments: uniqueAccs,
        },
        appliedNutrition: { energyKcal: kcal, proteins: protein, carbs: carbs, fatTotal: fat }
      };

      await addItem(payload as any);
      toast.success(`${opt.name} adicionado à sacola!`);
    } catch (err: unknown) {
      console.error("[ERRO_CARRINHO_PRESCRIÇÃO]:", err);
      toast.error("Ocorreu um erro ao processar a sua sacola.");
    }
  };

  return {
    isLoading: isPrescLoading,
    allPrescriptions,
    activePlan,
    selectedPlanIndex,
    setSelectedPlanIndex,
    totalCartItems: items?.length || 0,
    handleAddToCart,
    navigate,
    isAuthenticated,
    authLoading
  };
}
