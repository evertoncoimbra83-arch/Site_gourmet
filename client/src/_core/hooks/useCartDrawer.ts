import { useState } from "react";
import { useCart } from "@/_core/CartContext";
import { toast } from "@/components/ui/use-toast";

interface DrawerItem {
  id: number | string; 
  name: string;
  price: number;
  image?: string | null; // A interface do componente permite null
  dishId?: number | string;
  packageId?: number | string;
  options?: any;
  nutrition?: any;
}

export function useCartDrawer() {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = async (
    item: DrawerItem,
    quantity: number,
    optionsPayload: any, 
    onSuccess?: () => void
  ) => {
    if (!item.name || item.price === undefined || quantity < 1) {
      toast.error("Dados do produto incompletos.");
      return;
    }

    setIsAdding(true);

    try {
      await addItem({
        itemType: item.packageId ? "package" : "dish",
        dishId: item.dishId ? Number(item.dishId) : (item.id && !item.packageId ? Number(item.id) : undefined),
        packageId: item.packageId ? String(item.packageId) : undefined,
        quantity: Number(quantity),
        price: Number(item.price), 
        name: item.name,
        
        // ✅ CORREÇÃO: Converte null para undefined ou usa string vazia
        // Isso resolve o erro "Type 'null' is not assignable to type 'string | undefined'"
        image: item.image ?? undefined,
        
        options: item.options || optionsPayload, 
        appliedNutrition: item.nutrition || optionsPayload?.appliedNutrition || null
      });

      toast.success(`${item.name} adicionado à sacola!`, { icon: "🛒" });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("🔥 Erro no useCartDrawer:", error);
      toast.error("Erro ao adicionar item.");
    } finally {
      setIsAdding(false);
    }
  };

  return { addToCart, isAdding };
}