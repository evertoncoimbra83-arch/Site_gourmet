// client/src/pages/adminShowcases/logic/useAdminShowcases.ts
import { useState, useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---

interface Product {
  id: number;
  name?: string;
  title?: string;
  price?: number | string;
}

interface ShowcaseData {
  id?: number; 
  title: string;
  active: boolean;
  items: number[]; 
  description?: string;
  order?: number;
}

// Interface para o que vem do banco (Refletindo a tipagem segura)
interface RawShowcaseFromDB {
  id: number;
  title: string;
  description: string | null;
  items: string | null; // No banco é String (JSON)
  active: boolean | null;
  order: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export function useAdminShowcases() {
  const utils = trpc.useUtils();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<ShowcaseData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: rawShowcases, isLoading: isLoadingShowcases } = trpc.admin.showcases.list.useQuery();

  /**
   * ✅ Mapeia os dados do banco para o formato do Frontend
   * Converte a string 'items' em array de números para os checkboxes
   */
  const normalizedShowcases = useMemo(() => {
    if (!rawShowcases) return [];
    return (rawShowcases as unknown as RawShowcaseFromDB[]).map((sc) => ({
      id: sc.id,
      title: sc.title,
      description: sc.description ?? "",
      active: !!sc.active,
      order: sc.order ?? 0,
      items: JSON.parse(sc.items || "[]").map(Number) as number[],
    }));
  }, [rawShowcases]);

  const { data: dishesData, isLoading: isLoadingProducts } = trpc.admin.dishes.list.useQuery({ perPage: 200 });

  /**
   * ✅ Resolve Erro no-explicit-any: Tipagem correta dos produtos sem usar 'any'
   */
  const normalizedProducts: Product[] = useMemo(() => {
    if (!dishesData) return [];
    
    // 1. Se o tRPC já devolveu o array diretamente
    if (Array.isArray(dishesData)) {
      return dishesData as Product[];
    }
    
    // 2. Se o tRPC devolveu um objeto (ex: paginação) que contém a chave 'data'
    if (typeof dishesData === 'object' && 'data' in dishesData) {
      const list = (dishesData as { data: unknown }).data;
      return Array.isArray(list) ? (list as Product[]) : [];
    }
    
    return [];
  }, [dishesData]);

  const saveMutation = trpc.admin.showcases.upsert.useMutation({
    onSuccess: () => {
      toast.success("Vitrine salva com sucesso!");
      setIsDrawerOpen(false);
      utils.admin.showcases.list.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const actions = {
    openEditor: (sc?: ShowcaseData) => {
      setEditingShowcase(sc || { title: "", active: true, items: [] });
      setIsDrawerOpen(true);
    },
    
    closeEditor: () => setIsDrawerOpen(false),
    
    setSearchTerm,
    
    updateFields: <K extends keyof ShowcaseData>(field: K, value: ShowcaseData[K]) => {
      setEditingShowcase((prev) => prev ? ({ ...prev, [field]: value }) : null);
    },
    
    toggleProduct: (productId: number) => {
      if (!editingShowcase) return;
      
      const currentIds = editingShowcase.items || [];
      const newIds = currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId) // Remove se já existe
        : [...currentIds, productId];                 // Adiciona se não existe
        
      setEditingShowcase({ ...editingShowcase, items: newIds });
    },
    
    handleSave: () => {
      if (!editingShowcase?.title) return toast.error("Título obrigatório");
      saveMutation.mutate(editingShowcase);
    }
  };

  return {
    state: { 
      showcases: normalizedShowcases, 
      isDrawerOpen, 
      editingShowcase, 
      searchTerm, 
      allProducts: normalizedProducts, 
      isLoading: isLoadingShowcases || isLoadingProducts,
      isSaving: saveMutation.isPending
    },
    actions
  };
}