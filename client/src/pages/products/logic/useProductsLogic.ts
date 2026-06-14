import { useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import { useProducts } from "./useProducts";
import { usePrescriptionCart } from "@/_core/hooks/usePrescriptionCart";
import { useAuth } from "@/_core/hooks/useAuth";
import { safeNumber } from "@/lib/safe-parse";
import { isAdminRole } from "@shared/security/rbac";

// --- INTERFACES DE TIPAGEM ---
interface AiScanData {
  id: string;
  status: string;
  type?: string;
  suggestedData?: unknown;
  suggested_data?: unknown;
}

interface PrescriptionDish {
  dishId: number | string;
}

interface PrescriptionMeal {
  dishes?: PrescriptionDish[];
}

interface PrescriptionPlan {
  meals?: PrescriptionMeal[];
}

interface ProductData {
  id: number | string;
  name: string;
  categoryId?: number | string;
  isActive: boolean;
  salePrice?: string | number | null;
  displayOrder?: number | string | null;
  categoryDisplayOrder?: number | string | null;
  slug?: string;
}

export function useProductsLogic() {
  const { state, actions } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const intentionallyClosedPratoRef = useRef<string | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { prescription, handleAddDietToCart } = usePrescriptionCart();

  const isDietMode = searchParams.get("modo") === "dieta";
  const pratoQuery = searchParams.get("prato");
  const categoryQuery = searchParams.get("category");
  const isAdmin = isAdminRole(user?.role);

  const { data: plans } = trpc.nutri.getMyPrescription.useQuery(undefined, {
    enabled: !authLoading && isAuthenticated
  });
  const { data: dashboardScans } = trpc.nutri.getDashboard.useQuery(undefined, {
    enabled: !authLoading && isAuthenticated
  });

  // 1. Lógica de Scan Ativo (Gourmet AI) - Tipado
  const activeAiScan = useMemo(() => {
    if (!dashboardScans || !Array.isArray(dashboardScans)) return undefined;
    return (dashboardScans as AiScanData[]).find((scan) => {
      return (
        scan.status !== 'deleted' &&
        (scan.type === 'ai_scan' || 'suggestedData' in scan || 'suggested_data' in scan)
      );
    });
  }, [dashboardScans]);

  // 2. Extração de IDs recomendados - Tipado
  const recommendedDishIds = useMemo(() => {
    const currentPresc = prescription as PrescriptionPlan[] | undefined;
    if (!currentPresc || !Array.isArray(currentPresc)) return [];

    const ids: string[] = [];
    try {
      currentPresc.forEach((plan) => {
        plan.meals?.forEach((meal) => {
          meal.dishes?.forEach((dish) => {
            if (dish.dishId) ids.push(String(dish.dishId));
          });
        });
      });
      return ids;
    } catch {
      return [];
    }
  }, [prescription]);

  // 3. Filtro e Ordenação - Tipado
  const filteredAndSortedProducts = useMemo(() => {
    const products = (state.products as unknown as ProductData[]) || [];

    return products
      .filter((p) => {
        const matchesCategory = !state.selectedCategory || Number(p.categoryId) === Number(state.selectedCategory);
        const matchesSearch = !state.search || p.name.toLowerCase().includes(state.search.toLowerCase());
        const matchesDiet = isDietMode ? recommendedDishIds.includes(String(p.id)) : true;

        return p.isActive && matchesCategory && matchesSearch && matchesDiet;
      })
      .sort((a, b) => {
        const aHasPromo = (a.salePrice && Number(a.salePrice) > 0) ? 1 : 0;
        const bHasPromo = (b.salePrice && Number(b.salePrice) > 0) ? 1 : 0;
        if (aHasPromo !== bHasPromo) return bHasPromo - aHasPromo;

        const orderA = safeNumber(a.categoryDisplayOrder, 999);
        const orderB = safeNumber(b.categoryDisplayOrder, 999);
        if (orderA !== orderB) return orderA - orderB;

        return safeNumber(a.displayOrder) - safeNumber(b.displayOrder);
      });
  }, [state.products, state.selectedCategory, state.search, isDietMode, recommendedDishIds]);

  useEffect(() => {
    const categories = (state.catList as Array<{ id: number | string }> | undefined) || [];

    if (!categoryQuery) {
      if (state.selectedCategory !== null) {
        actions.setSelectedCategory(null);
      }
      return;
    }

    if (categories.length === 0) {
      return;
    }

    const matchedCategory = categories.find((cat) => String(cat.id) === categoryQuery);
    if (!matchedCategory) {
      if (state.selectedCategory !== null) {
        actions.setSelectedCategory(null);
      }
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.delete("category");
        return p;
      }, { replace: true });
      return;
    }

    if (Number(state.selectedCategory) !== Number(matchedCategory.id)) {
      actions.setSelectedCategory(Number(matchedCategory.id));
    }
  }, [categoryQuery, state.catList, state.selectedCategory, actions, setSearchParams]);

  // 4. Sincronização URL
  useEffect(() => {
    if (!state.products || state.products.length === 0) return;

    if (pratoQuery && !state.selectedDishId) {
      if (intentionallyClosedPratoRef.current === pratoQuery) return;
      const products = state.products as unknown as ProductData[];
      const dish = products.find((p) =>
        String(p.slug) === pratoQuery || String(p.id) === pratoQuery
      );
      if (dish) actions.setSelectedDishId(Number(dish.id));
    }
  }, [pratoQuery, state.products, state.selectedDishId, actions]);

  const handleOpenDish = (dish: { id: string | number; slug?: string }) => {
    intentionallyClosedPratoRef.current = null;
    actions.setSelectedDishId(Number(dish.id));
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("prato", dish.slug || String(dish.id));
      return p;
    }, { replace: true });
  };

  const handleCloseDish = () => {
    intentionallyClosedPratoRef.current = pratoQuery;
    actions.setSelectedDishId(null);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("prato");
      return p;
    }, { replace: true });
  };

  const handleClearDietMode = () => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("modo");
      p.delete("scanId");
      return p;
    }, { replace: true });
  };

  const handleSelectCategory = (categoryId: number | string | null) => {
    actions.setSelectedCategory(categoryId === null ? null : Number(categoryId));
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (categoryId === null) {
        p.delete("category");
      } else {
        p.set("category", String(categoryId));
      }
      return p;
    }, { replace: true });
  };

  return {
    state,
    actions,
    isDietMode,
    isAdmin,
    activeAiScan,
    activePlan: plans?.[0],
    filteredProducts: filteredAndSortedProducts,
    handleOpenDish,
    handleCloseDish,
    handleSelectCategory,
    handleClearDietMode,
    handleAddDietToCart
  };
}
