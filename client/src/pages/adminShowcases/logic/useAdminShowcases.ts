import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

export function useAdminShowcases() {
  const utils = trpc.useUtils();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: showcases, isLoading: isLoadingShowcases } = trpc.admin.showcases.list.useQuery();

  // Chamada para o roteador de pratos
  const { 
    data: dishesData, 
    isLoading: isLoadingProducts, 
    error: dishesError 
  } = trpc.admin.dishes.list.useQuery({ limit: 100 });

  // ========================================================
  // 🛠️ NORMALIZAÇÃO DE DADOS (CORRIGIDA)
  // ========================================================
  // Seu backend retorna: { data: [...], total: 52, meta: {...} }
  // Agora buscamos especificamente pela chave '.data'
  const normalizedProducts = Array.isArray(dishesData?.data) 
    ? dishesData.data 
    : Array.isArray(dishesData) 
      ? dishesData 
      : [];
  // ========================================================

  const saveMutation = trpc.admin.showcases.save.useMutation({
    onSuccess: () => {
      toast.success("Vitrine atualizada com sucesso!");
      setIsDrawerOpen(false);
      utils.admin.showcases.list.invalidate();
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message)
  });

  const actions = {
    openEditor: (sc: any = { title: "", active: true, products: [] }) => {
      setEditingShowcase(sc);
      setIsDrawerOpen(true);
    },
    closeEditor: () => setIsDrawerOpen(false),
    setSearchTerm,
    updateFields: (field: string, value: any) => {
      setEditingShowcase((prev: any) => ({ ...prev, [field]: value }));
    },
    toggleProduct: (productId: number) => {
      if (!editingShowcase) return;
      const currentIds = editingShowcase.products || [];
      const isSelected = currentIds.includes(productId);
      const newIds = isSelected
        ? currentIds.filter((id: any) => id !== productId)
        : [...currentIds, productId];
      setEditingShowcase({ ...editingShowcase, products: newIds });
    },
    handleSave: () => {
      if (!editingShowcase?.title) return toast.error("Dê um título para a vitrine");
      saveMutation.mutate(editingShowcase);
    }
  };

  return {
    state: { 
      showcases: showcases || [], 
      isDrawerOpen, 
      editingShowcase, 
      searchTerm, 
      allProducts: normalizedProducts, // ✅ Agora entrega os 52 pratos corretamente
      isLoading: isLoadingShowcases || isLoadingProducts,
      isSaving: saveMutation.isPending
    },
    actions
  };
}