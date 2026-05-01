// client/src/pages/adminDishes/logic/useAdminDishes.ts
import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

export function useAdminDishes() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const perPage = 8;

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  /* ================================================================
     1) QUERIES
     ================================================================ */

  const { data: categories } = trpc.admin.dishes.listCategories.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });

  const { data: dishesData, isLoading } = trpc.admin.dishes.list.useQuery(
    {
      page,
      perPage,
      search: search.length >= 2 ? search : undefined,
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    },
    { placeholderData: (previousData) => previousData }
  );

  const { data: fullDishData, isLoading: isLoadingDish } = trpc.admin.dishes.getById.useQuery(
    editingDishId as number,
    { enabled: !!editingDishId }
  );

  /* ================================================================
     2) MUTATIONS
     ================================================================ */

  const upsertMutation = trpc.admin.dishes.create.useMutation({
    onSuccess: () => {
      const msg = editingDishId ? "Prato atualizado com sucesso!" : "Novo prato criado!";
      toast.success(msg);
      utils.admin.dishes.list.invalidate();
      setIsDialogOpen(false);
      setEditingDishId(null);
    },
    onError: (err) => toast.error(`Erro ao salvar: ${err.message}`)
  });

  const toggleActiveMutation = trpc.admin.dishes.toggleActive.useMutation({
    onSuccess: () => {
      utils.admin.dishes.list.invalidate();
      toast.success("Visibilidade atualizada!");
    },
    onError: (err) => toast.error(`Erro: ${err.message}`)
  });

  const deleteMutation = trpc.admin.dishes.delete.useMutation({
    onSuccess: () => {
      toast.success("Prato removido.");
      utils.admin.dishes.list.invalidate();
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`)
  });

  /* ================================================================
     3) RETORNO
     ================================================================ */

  return {
    state: { 
      page, 
      search, 
      selectedCategory, 
      isDialogOpen, 
      editingDish: fullDishData || null, 
      isLoading: isLoading || upsertMutation.isPending || deleteMutation.isPending || isLoadingDish
    },
    actions: { 
      setPage, 
      setSearch, 
      setSelectedCategory, 
      setIsDialogOpen: (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) setEditingDishId(null);
      }, 
      handleEdit: (dish: any) => {
        setEditingDishId(dish.id);
        setIsDialogOpen(true);
      },
      handleCreate: () => {
        setEditingDishId(null);
        setIsDialogOpen(true);
      },
      // ✅ FUNÇÃO DE SALVAR REVISADA PARA INCLUIR SALEPRICE
      handleSave: (formData: any) => {
        upsertMutation.mutate({
          ...formData,
          // Garante que o salePrice seja enviado ou como número ou null
          salePrice: formData.salePrice ? Number(formData.salePrice) : null,
          price: Number(formData.price)
        });
      }
    },
    data: { 
      categories: categories || [], 
      dishes: dishesData?.data || [], 
      total: dishesData?.total || 0,
      totalPages: Math.ceil((dishesData?.total || 0) / perPage)
    },
    mutations: { 
      upsertMutation, 
      deleteMutation,
      toggleActiveMutation 
    }
  };
}