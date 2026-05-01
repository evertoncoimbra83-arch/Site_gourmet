import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { useDishStore } from "../logic/useDishStore"; 
import { appToast as toast } from "@/lib/app-toast"; 

// --- INTERFACES ---
interface DishItem {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface DishPayload {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  ingredients: string;
  show_nutrition?: boolean; 
  showNutrition?: boolean;  
  price: number;
  salePrice: number | null;
  categoryId?: number;
  energyKcal: number;
  energyKj: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  fatSaturated: number;
  fatTrans: number;
  fiber: number;
  sodium: number;
  calcium: number;
  iron: number;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  composition: unknown[];
  isActive: boolean;
}

export function useAdminDishes() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<number | null>(null);
  const [hydratedEditingDish, setHydratedEditingDish] = useState<Record<string, unknown> | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Seletores tipados para evitar 'unknown' do Store
  const setFormData = useDishStore((s) => s.setFormData);
  const setComposition = useDishStore((s) => s.setComposition);
  const reset = useDishStore((s) => s.reset);
  
  const utils = trpc.useUtils();
  const perPage = 8;

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, showInactive]);

  /* --- QUERIES --- */
  const { data: categories = [] } = trpc.admin.dishes.listCategories.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });

  const { data: dishesData, isLoading } = trpc.admin.dishes.list.useQuery({
    page,
    perPage,
    search: search.length >= 2 ? search : undefined,
    categoryId: selectedCategory,
    showInactive, 
  });

  const { data: fullDishData, isLoading: isLoadingDish, isFetching } = trpc.admin.dishes.getById.useQuery(
    editingDishId as number,
    { 
      enabled: !!editingDishId,
      gcTime: 0,
      staleTime: 0, 
    }
  );

  const totalItems = dishesData?.total || 0;
  const totalPages = Math.ceil(totalItems / perPage) || 1;

  useEffect(() => {
    if (editingDishId && fullDishData && !isLoadingDish) {
      const dish = fullDishData as Record<string, unknown>;
      setHydratedEditingDish(dish);
      const rawStatus = dish.show_nutrition ?? dish.showNutrition;
      const isVisible = rawStatus === true || rawStatus === 1 || String(rawStatus) === "true";

      // Usamos unknown as Parameters para satisfazer o contrato do Store sem 'any'
      const castedFormData = {
        ...dish,
        showNutrition: isVisible,
        ingredients: typeof dish.ingredients === 'string' ? dish.ingredients : ""
      } as unknown as Parameters<typeof setFormData>[0];

      setFormData(castedFormData);
      
      const comp = Array.isArray(dish.composition) ? dish.composition : [];
      setComposition(comp as unknown as Parameters<typeof setComposition>[0]);

      setIsDialogOpen(true);
    }
  }, [fullDishData, editingDishId, isLoadingDish, setFormData, setComposition]);

  const refreshAll = async () => {
    await utils.admin.dishes.list.invalidate();
    if (editingDishId) {
      await utils.admin.dishes.getById.invalidate(editingDishId);
    }
    reset();
    setHydratedEditingDish(null);
    setEditingDishId(null);
  };

  const refreshCurrentDish = async (dishId: number) => {
    await utils.admin.dishes.list.invalidate();
    const updatedDish = await utils.admin.dishes.getById.fetch(dishId);
    setHydratedEditingDish((updatedDish as Record<string, unknown>) || null);
  };

  const generateSlug = (text: string): string => {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  /* --- MUTATIONS --- */
  const upsertMutation = trpc.admin.dishes.create.useMutation({
    onSuccess: async () => {
      await refreshAll();
      setIsDialogOpen(false);
      toast.success("Prato criado com sucesso!");
    }
  });

  const updateMutation = trpc.admin.dishes.update.useMutation({
    onSuccess: async () => {
      if (editingDishId) {
        await refreshCurrentDish(editingDishId);
      } else {
        await utils.admin.dishes.list.invalidate();
      }
      toast.success("Alterações salvas!");
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
    }
  });

  const toggleActiveMutation = trpc.admin.dishes.toggleActive.useMutation({
    onSuccess: () => {
      utils.admin.dishes.list.invalidate();
      toast.info("Visibilidade alterada.");
    }
  });

  const deleteMutation = trpc.admin.dishes.delete.useMutation({
    onSuccess: () => {
      utils.admin.dishes.list.invalidate();
      toast.success("Prato excluído da base.");
    }
  });

  return {
    state: { 
      page, search, selectedCategory, showInactive, isDialogOpen, 
      isLoading: isLoading || upsertMutation.isPending || updateMutation.isPending || isLoadingDish || isFetching,
      editingDishId,
      editingDish: hydratedEditingDish || fullDishData || null
    },
    mutations: { deleteMutation, toggleActiveMutation, updateMutation, upsertMutation },
    actions: { 
      setPage, setSearch, setShowInactive, 
      setSelectedCategory: (val: string | number) => setSelectedCategory((val === "" || val === "all") ? undefined : Number(val)),
      
      setIsDialogOpen: (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingDishId(null);
          setHydratedEditingDish(null);
          reset();
        }
      }, 
      
      handleEdit: async (dish: { id: number | string }) => {
        reset(); 
        setHydratedEditingDish(dish as Record<string, unknown>);
        setEditingDishId(Number(dish.id));
        setIsDialogOpen(true);
      },

      handleCreate: () => {
        reset(); 
        setHydratedEditingDish(null);
        setEditingDishId(null);
        setIsDialogOpen(true);
      },

      handleSave: (formDataInput: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { nutritional_info, nutritionalInfo, ...fields } = formDataInput;

        let finalIngredientsText = fields.ingredients as string;
        if (Array.isArray(fields.ingredients)) {
           finalIngredientsText = (fields.composition as Array<{ingredientName?: string, name?: string}> || [])
            .map((c) => c.ingredientName || c.name)
            .join(", ");
        }

        const formattedComposition = (fields.composition as Array<Record<string, unknown>> || []).map((item) => ({
          ingredientId: Number(item.ingredientId || item.id),
          quantity: Number(item.quantity || 0),
          energyKcal: Number(item.energyKcal || 0),
          proteins: Number(item.proteins || 0),
          carbs: Number(item.carbs || 0),
          fatTotal: Number(item.fatTotal || 0)
        }));

        const finalSlug = typeof fields.slug === 'string' && fields.slug.trim() 
          ? generateSlug(fields.slug) 
          : generateSlug(fields.name as string);

        const payload: DishPayload = {
          name: fields.name as string,
          slug: finalSlug,
          description: (fields.description as string) || "",
          imageUrl: (fields.imageUrl as string) || "",
          ingredients: String(finalIngredientsText || ""), 
          show_nutrition: Boolean(fields.showNutrition),
          showNutrition: Boolean(fields.showNutrition),
          price: Number(fields.basePrice || fields.price || 0),
          salePrice: fields.salePrice ? Number(fields.salePrice) : null,
          energyKcal: Number(fields.energyKcal || 0),
          energyKj: Number(fields.energyKj || 0),
          proteins: Number(fields.proteins || 0),
          carbs: Number(fields.carbs || 0),
          fatTotal: Number(fields.fatTotal || 0),
          fatSaturated: Number(fields.fatSaturated || 0),
          fatTrans: Number(fields.fatTrans || 0),
          fiber: Number(fields.fiber || 0),
          sodium: Number(fields.sodium || 0),
          calcium: Number(fields.calcium || 0),
          iron: Number(fields.iron || 0), 
          isVegetarian: Boolean(fields.isVegetarian),
          isGlutenFree: Boolean(fields.isGlutenFree),
          isLactoseFree: Boolean(fields.isLactoseFree),
          composition: formattedComposition,
          isActive: !!((fields.isActive as boolean) ?? true),
        };

        if (fields.categoryId && fields.categoryId !== "all" && fields.categoryId !== "") {
          payload.categoryId = Number(fields.categoryId);
        }

        if (editingDishId) {
          updateMutation.mutate({ 
            id: editingDishId, 
            ...payload 
          } as unknown as Parameters<typeof updateMutation.mutate>[0]);
        } else {
          upsertMutation.mutate(payload as unknown as Parameters<typeof upsertMutation.mutate>[0]);
        }
      }
    },
    data: { 
      categories, 
      dishes: (dishesData?.data as unknown as DishItem[]) || [], 
      total: totalItems,
      totalPages
    }
  };
}
