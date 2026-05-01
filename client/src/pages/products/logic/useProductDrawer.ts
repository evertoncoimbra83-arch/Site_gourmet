import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { useDishNutrition } from "./useDishNutrition";
import { mapDishFromDb } from "./mappers";
import { appToast as toast } from "@/lib/app-toast";
import type { AccOption, AccGroup, DishSize, MappedDish } from "./types";
// ✅ CORREÇÃO: Voltamos a importar o NutritionValues pois o carrinho exige ele
import type { ProductCustomOptions, Id, NutritionValues } from "@/_core/type/utils"; 

interface SelectionValidation {
  ok: boolean;
  message?: string;
}

function getGroupKey(group: Pick<AccGroup, "id" | "groupId">): string {
  return String(group.groupId ?? group.id);
}

function getAccGroupKey(acc: Pick<AccOption, "groupId">): string {
  return String(acc.groupId);
}

function validateAccSelections(
  accs: AccOption[],
  currentSize: DishSize | null,
): SelectionValidation {
  if (!currentSize) {
    return { ok: false, message: "Escolha um tamanho antes de adicionar." };
  }

  const groups = currentSize.accompanimentGroups || [];
  if (groups.length === 0) {
    return accs.length === 0
      ? { ok: true }
      : { ok: false, message: "Este tamanho nao aceita acompanhamentos." };
  }

  const groupsById = new Map<string, AccGroup>();
  for (const group of groups) {
    groupsById.set(getGroupKey(group), group);
  }

  const seen = new Set<string>();
  for (const acc of accs) {
    const groupId = getAccGroupKey(acc);
    const group = groupsById.get(groupId);

    if (!group) {
      return {
        ok: false,
        message: `${acc.name} nao pertence ao tamanho selecionado.`,
      };
    }

    const belongsToGroup = (group.options || []).some(
      (option) => String(option.id) === String(acc.id),
    );

    if (!belongsToGroup) {
      return {
        ok: false,
        message: `${acc.name} nao pertence ao grupo ${group.name}.`,
      };
    }

    const selectionKey = `${groupId}:${String(acc.id)}`;
    if (seen.has(selectionKey)) {
      return {
        ok: false,
        message: `${acc.name} foi selecionado mais de uma vez.`,
      };
    }
    seen.add(selectionKey);
  }

  for (const group of groups) {
    const groupId = getGroupKey(group);
    const count = accs.filter((acc) => getAccGroupKey(acc) === groupId).length;
    const min = Number(group.minSelections || 0);
    const max = Math.max(1, Number(group.maxSelections || 1));

    if (count < min) {
      return {
        ok: false,
        message: `Escolha pelo menos ${min} item(ns) em ${group.name}.`,
      };
    }

    if (count > max) {
      return {
        ok: false,
        message: `Limite de ${max} item(ns) excedido em ${group.name}.`,
      };
    }
  }

  return { ok: true };
}

export function useProductDrawer(dishId: string | number | null, onClose: () => void) {
  const { addItem } = useCart();
  
  const footerRef = useRef<HTMLDivElement>(null);
  const sizeSelectorRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<DishSize | null>(null);
  const [selectedAccs, setSelectedAccs] = useState<AccOption[]>([]);
  const [showFullNutrition, setShowFullNutrition] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const numericId = useMemo(() => (dishId ? Number(dishId) : null), [dishId]);
  
  const { data: rawDish, isLoading } = trpc.public.dishes.getById.useQuery(
    { id: numericId as number },
    { enabled: !!numericId, staleTime: 1000 * 60 * 5 }
  );

  const dish = useMemo(() => 
    rawDish ? (mapDishFromDb(rawDish as Record<string, unknown>) as unknown as MappedDish) : null, 
  [rawDish]);

  useEffect(() => {
    if (dishId) {
      setQuantity(1);
      setSelectedAccs([]);
      setSelectedSize(null);
      setShowFullNutrition(false);
      setIsAddingItem(false);
    }
  }, [dishId]);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const totalNutrition = useDishNutrition(
    dish as unknown as Record<string, unknown>, 
    selectedSize as unknown as Record<string, unknown>, 
    selectedAccs as unknown as Record<string, unknown>[]
  );

  const basePrice = Number(dish?.price || 0);
  const salePrice = Number(dish?.salePrice || 0);
  const hasDiscount = salePrice > 0 && salePrice < basePrice;

  const totalUnitPrice = useMemo(() => {
    if (!dish) return 0;
    const referencePrice = hasDiscount ? salePrice : basePrice;
    const sizePercentage = Number(selectedSize?.priceModifier || 0);
    const sizeFactor = 1 + (sizePercentage / 100);
    const accsMod = selectedAccs.reduce((sum, a) => sum + Number(a.priceModifier || 0), 0);
    return (referencePrice * sizeFactor) + accsMod;
  }, [dish, selectedSize, selectedAccs, hasDiscount, salePrice, basePrice]);

  const checkCompletion = (accs: AccOption[], currentSize: DishSize | null): boolean => {
    return validateAccSelections(accs, currentSize).ok;
  };

  const isAccompanimentsComplete = useMemo(() => 
    checkCompletion(selectedAccs, selectedSize), 
  [selectedSize, selectedAccs]);

  const handleAccSelection = (group: unknown, optId: string | number) => {
    const g = group as AccGroup;
    const opt = g.options.find((o) => Number(o.id) === Number(optId));
    if (!opt) return;
    const gId = getGroupKey(g);
    
    setSelectedAccs(prev => {
      const exists = prev.some(
        (a) => Number(a.id) === Number(opt.id) && getAccGroupKey(a) === gId,
      );
      let newState: AccOption[];
      if (exists) {
        newState = prev.filter(
          (a) => !(Number(a.id) === Number(opt.id) && getAccGroupKey(a) === gId),
        );
      } else {
        const maxAllowed = Math.max(1, Number(g.maxSelections || 1));
        const newItem: AccOption = { 
          ...opt, 
          groupId: gId, 
          groupName: g.name || opt.groupName || "",
          defaultGrammage: Number(g.defaultGrammage || 100) 
        };
        if (maxAllowed === 1) {
          newState = [...prev.filter((a) => getAccGroupKey(a) !== gId), newItem];
        } else {
          const countInGroup = prev.filter((a) => getAccGroupKey(a) === gId).length;
          newState = countInGroup < maxAllowed ? [...prev, newItem] : prev;
        }
      }
      if (checkCompletion(newState, selectedSize)) scrollTo(footerRef);
      return newState;
    });
  };

  const handleSizeSelect = (s: DishSize) => {
    setSelectedSize(s);
    setSelectedAccs([]);
    scrollTo(sizeSelectorRef);
  };

  const handleAddToCart = async () => {
    if (!dish || !selectedSize || isAddingItem) return;

    const validation = validateAccSelections(selectedAccs, selectedSize);
    if (!validation.ok) {
      toast.warning(validation.message || "Revise os acompanhamentos selecionados.");
      return;
    }

    setIsAddingItem(true);

    const structuralOptions: ProductCustomOptions = {
      _type: 'single',
      dishId: dish.id as Id,
      selectedSizeId: selectedSize.id as Id,
      selectedSizeName: selectedSize.name,
      selectedAccs: selectedAccs.map(acc => ({ 
        id: acc.id as Id, 
        name: acc.name, 
        weight: acc.defaultGrammage || 100, 
        groupId: acc.groupId as Id,
        groupName: acc.groupName || "" 
      })),
    };

    try {
      await addItem({
        itemType: "dish",
        dishId: Number(dish.id),
        quantity: quantity,
        price: Number(totalUnitPrice),
        name: String(dish.name),
        image: String(dish.imageUrl),
        // ✅ CORREÇÃO: Enviando os dados limpos com os tipos que o CartContext espera
        options: structuralOptions,
        appliedNutrition: totalNutrition as unknown as NutritionValues, 
      });

      onClose();
    } catch (error) {
      console.error("❌ Erro ao adicionar prato ao carrinho:", error);
    } finally {
      setIsAddingItem(false);
    }
  };

  return {
    dish,
    isLoading,
    quantity,
    setQuantity,
    selectedSize,
    selectedAccs,
    showFullNutrition,
    setShowFullNutrition,
    totalNutrition,
    totalUnitPrice,
    isAccompanimentsComplete,
    isAdding: isAddingItem,
    footerRef,
    sizeSelectorRef,
    handleSizeSelect,
    handleAccSelection,
    handleAddToCart
  };
}
