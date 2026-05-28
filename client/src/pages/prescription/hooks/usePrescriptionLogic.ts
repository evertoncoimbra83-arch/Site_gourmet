import { useMemo, useState, ReactNode } from "react";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { safeNumber } from "@/lib/safe-parse";

export interface PrescriptionOptionData {
  dishId: string | number;
  name: string;
  originalPrice: number;
  priceAtCreation?: number;
  sizeId?: string | number;
  allowedAccompaniments?: Array<{ id: string | number; name: string; weight?: number }>;
  nutritionalData?: {
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

    try {
      const discount = safeNumber(activePlan.discountPercentage);
      const finalPrice = discount > 0 
        ? dish.originalPrice * (1 - discount / 100) 
        : dish.originalPrice;

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
          selectedSizeId: dish.sizeId ? String(dish.sizeId) : undefined,
          selectedSizeName: dish.nutritionalData?.mainDishWeight 
            ? `${dish.nutritionalData.mainDishWeight}g` 
            : "Personalizado",
          selectedAccs: (dish.allowedAccompaniments || []).map((acc) => ({
            id: Number(acc.id),
            name: acc.name,
            weight: Number(acc.weight || 100),
            groupName: "Acompanhamento"
          }))
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
