import { trpc } from "@/_core/trpc";

// --- INTERFACES ---

interface OptionItem {
  id: number | string;
  name: string;
  accompanimentCategoryId?: number | null;
  isActive?: boolean;
  show_nutrition?: boolean;
  showNutrition?: boolean;
  isNoAccompaniment?: boolean;
  is_no_accompaniment?: boolean;
  nutritionalInfo?: string | unknown[];
  nutritional_info?: string | unknown[];
  energyKcal?: string | number;
  energyKj?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  fatSaturated?: string | number;
  fatTrans?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  calcium?: string | number;
  iron?: string | number;
  ingredients?: string;
  priceModifier?: string;
  categoryName?: string;
  composition?: unknown[];
}

/**
 * Hook para gestão da aba de opções de acompanhamentos (Insumos/Ingredientes).
 */
export function useAdminOptionsTab() {
  const utils = trpc.useUtils();

  // Queries
  const query = trpc.admin.accompaniments.options.listAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });

  const categoriesQuery = trpc.admin.accompaniments.categories.list.useQuery();

  // Mutations
  const upsertMutation = trpc.admin.accompaniments.options.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.options.listAll.invalidate();
    }
  });

  /**
   * ✅ NORMALIZAÇÃO REFORÇADA (Tipagem explícita)
   */
  const normalizePayload = (originalItem: Partial<OptionItem>, overrides: Partial<OptionItem> = {}) => {
    const rawComposition = overrides.composition
      ?? originalItem.composition
      ?? originalItem.nutritionalInfo
      ?? originalItem.nutritional_info
      ?? [];

    return {
      id: originalItem.id ? Number(originalItem.id) : undefined,
      name: overrides.name ?? originalItem.name,

      accompanimentCategoryId: overrides.accompanimentCategoryId !== undefined
        ? (overrides.accompanimentCategoryId ? Number(overrides.accompanimentCategoryId) : null)
        : (originalItem.accompanimentCategoryId ? Number(originalItem.accompanimentCategoryId) : null),

      isActive: Boolean(overrides.isActive ?? originalItem.isActive ?? true),
      showNutrition: Boolean(overrides.showNutrition ?? originalItem.showNutrition ?? false),
      isNoAccompaniment: Boolean(
        overrides.isNoAccompaniment ??
        overrides.is_no_accompaniment ??
        originalItem.isNoAccompaniment ??
        originalItem.is_no_accompaniment ??
        false
      ),

      energyKcal: Number(overrides.energyKcal ?? originalItem.energyKcal ?? 0),
      energyKj: Number(overrides.energyKj ?? originalItem.energyKj ?? 0),
      proteins: Number(overrides.proteins ?? originalItem.proteins ?? 0),
      carbs: Number(overrides.carbs ?? originalItem.carbs ?? 0),
      fatTotal: Number(overrides.fatTotal ?? originalItem.fatTotal ?? 0),
      fatSaturated: Number(overrides.fatSaturated ?? originalItem.fatSaturated ?? 0),
      fatTrans: Number(overrides.fatTrans ?? originalItem.fatTrans ?? 0),
      fiber: Number(overrides.fiber ?? originalItem.fiber ?? 0),
      sodium: Number(overrides.sodium ?? originalItem.sodium ?? 0),
      calcium: Number(overrides.calcium ?? originalItem.calcium ?? 0),
      iron: Number(overrides.iron ?? originalItem.iron ?? 0),

      ingredients: overrides.ingredients ?? originalItem.ingredients ?? "",
      composition: rawComposition,
      priceModifier: String(overrides.priceModifier ?? originalItem.priceModifier ?? "0.00"),
    };
  };

  return {
    items: (query.data as OptionItem[])?.map(item => ({
      ...item,
      categoryLabel: item.categoryName || "Sem Categoria"
    })) || [],

    categories: categoriesQuery.data || [],
    isLoading: query.isLoading || categoriesQuery.isLoading,
    isRefetching: query.isRefetching,

    actions: {
      updateCategory: (itemId: number, catId: number | null) => {
        const item = (query.data as OptionItem[] || []).find(i => Number(i.id) === Number(itemId));
        if (!item) return;

        const payload = normalizePayload(item, { accompanimentCategoryId: catId });
        upsertMutation.mutate(payload as unknown as Parameters<typeof upsertMutation.mutate>[0]);
      },

      saveItem: (itemData: Partial<OptionItem>) => {
        const payload = normalizePayload(itemData);
        upsertMutation.mutate(payload as unknown as Parameters<typeof upsertMutation.mutate>[0]);
      }
    },
    upsertMutation
  };
}
