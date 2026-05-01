import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";

// --- INTERFACES DE TIPAGEM ---

interface DishSize {
  id: string | number;
  name: string;
  priceModifier: number | string;
  accompanimentGroups?: AccompanimentGroup[];
}

interface AccompanimentOption {
  id: string | number;
  name: string;
  groupId?: number;
  [key: string]: unknown;
}

interface AccompanimentGroup {
  id: string | number;
  groupId?: string | number;
  maxSelections: number | string;
  [key: string]: unknown;
}

interface DishBase {
  id: string | number;
  name: string;
  price: number | string;
}

export function useAdminDishSelector(
  dish: DishBase | null, 
  onConfirm: (customizedItem: unknown) => void
) {
  // 🛡️ Se dish não existe, passamos 0 e desativamos a query
  const effectiveId = dish?.id ? Number(dish.id) : 0;

  const { data: details, isLoading } = trpc.public.dishes.getById.useQuery(
    { id: effectiveId },
    { enabled: effectiveId > 0 }
  );

  const [selectedSize, setSelectedSize] = useState<DishSize | null>(null);
  const [selectedAccs, setSelectedAccs] = useState<AccompanimentOption[]>([]);

  useEffect(() => {
    setSelectedSize(null);
    setSelectedAccs([]);
  }, [effectiveId]);

  const groups = selectedSize?.accompanimentGroups || [];
  const currentPrice = Number(dish?.price || 0) + Number(selectedSize?.priceModifier || 0);

  const toggleAccompaniment = (group: AccompanimentGroup, opt: AccompanimentOption) => {
    const groupId = Number(group.groupId || group.id);
    const max = Number(group.maxSelections || 1);
    const isSelected = selectedAccs.find(a => a.id === opt.id);

    if (isSelected) {
      setSelectedAccs(prev => prev.filter(a => a.id !== opt.id));
    } else {
      const selectionsInGroup = selectedAccs.filter(a => Number(a.groupId) === groupId);
      if (selectionsInGroup.length < max) {
        setSelectedAccs(prev => [...prev, { ...opt, groupId }]);
      } else if (max === 1) {
        setSelectedAccs(prev => [...prev.filter(a => Number(a.groupId) !== groupId), { ...opt, groupId }]);
      }
    }
  };

  return {
    details,
    isLoading,
    groups,
    selectedSize,
    selectedAccs,
    currentPrice,
    isValid: !!dish && effectiveId > 0,
    selectSize: setSelectedSize,
    toggleAccompaniment,
    confirmSelection: () => {
      if (!selectedSize || !dish) return;
      onConfirm({
        productId: dish.id,
        dishName: dish.name,
        quantity: 1,
        unitPrice: currentPrice,
        totalPrice: currentPrice,
        options: { 
          size: selectedSize.name, 
          accompaniments: selectedAccs.map(a => a.name) 
        }
      });
    }
  };
}