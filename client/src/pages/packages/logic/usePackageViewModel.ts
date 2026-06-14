// client/src/pages/packages/logic/usePackageViewModel.ts

import { useReducer, useState, useCallback, useMemo, useEffect } from "react";
import { packageMachine, initialPackageContext } from "./packageMachine";
import {
  PackageItem,
  PackageState,
  AccompanimentOption,
  AccompanimentGroupRule
} from "./packageMachine.types";
import { canSubmitPackage, isMealComplete } from "./packageGuards"; import { useCart } from "@/_core/CartContext";
import { appToast as toast } from "@/lib/app-toast";

// ✅ IMPORTAÇÕES DO DOMÍNIO
import {
  NutritionData as AppliedNutrition,
  calculateMealNutritionCanonical,
  aggregateNutritionCollection,
  extractDishNutritionSource
} from "@shared/domain/nutrition/nutrition";

interface PackageData {
  id: string;
  name: string;
  capacity: number;
  price?: number;
  image?: string;
}

// ✅ Rastro nutricional detalhado por marmita (usado para etiquetas/cozinha)
interface ItemTrace {
  dishId: string;
  dishName: string;
  sizeId?: string | number;
  mainDishWeightUsed: number;
  recipeWeightUsed: number;
  accompanimentIds: string[];
  accompaniments: AccompanimentOption[];
  skippedNoAccompanimentCount: number;
  nutrition: AppliedNutrition;
}

function calculatePackageItemNutrition(item: PackageItem) {
  const dishSource = {
    ...(item.nutrition || {}),
    ...(item.dishRawData || {}),
    mainDishWeight: item.mainDishWeight,
  };

  return calculateMealNutritionCanonical({
    dish: extractDishNutritionSource(dishSource),
    recipeWeight: (
      item.dishRawData?.recipeWeight ??
      item.dishRawData?.recipe_weight ??
      item.dishRawData?.yieldWeight ??
      item.dishRawData?.yield_weight
    ) as number | string | null | undefined,
    targetMainDishWeight: item.mainDishWeight,
    composition: Array.isArray(item.dishRawData?.composition)
      ? (item.dishRawData?.composition as Record<string, unknown>[])
      : undefined,
    accompaniments: item.selectedAccompaniments as unknown as Record<string, unknown>[],
  });
}

export function usePackageViewModel(packageData: PackageData) {
  const cart = useCart();
  // ✅ FIX: Array de tamanho fixo (capacity) — cada slot tem posição fixa
  // Evita o bug onde remover um item desloca os índices e troca as seleções
  const emptySlots = useCallback((): Array<PackageItem | null> =>
    Array.from({ length: packageData.capacity }, () => null), [packageData.capacity]);

  const [slotItems, setSlotItems] = useState<Array<PackageItem | null>>([]);

  // Derived: apenas slots preenchidos (para compatibilidade com canSubmit e cart)
  const selectedItems = slotItems.filter((s): s is PackageItem => s !== null && s !== undefined);

  const [machine, dispatch] = useReducer(packageMachine, {
    ...initialPackageContext,
    capacity: packageData.capacity,
    currentState: 'selecting_meals'
  });

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET', payload: { capacity: packageData.capacity } });
    setSlotItems(emptySlots());
  }, [dispatch, emptySlots, packageData.capacity]);

  useEffect(() => {
    handleReset();
  }, [packageData.id, handleReset]);

  // ✅ addMeal agora recebe slotIndex — insere na posição correta
  const addMeal = useCallback((dish: {
    id: string;
    name: string;
    requiresAccompaniments: boolean;
    accompanimentGroups: AccompanimentGroupRule[];
    nutrition?: Record<string, unknown>;
    dishRawData?: Record<string, unknown>;
    sizeId?: string | number;
    mainDishWeight?: number;
    slotIndex: number; // ✅ obrigatório agora
  }) => {
    const newItem = {
      dishId: dish.id,
      dishName: dish.name,
      requiresAccompaniments: dish.requiresAccompaniments,
      accompanimentGroups: dish.accompanimentGroups,
      selectedAccompaniments: [],
      nutrition: dish.nutrition,
      dishRawData: dish.dishRawData,
      sizeId: dish.sizeId,
      mainDishWeight: dish.mainDishWeight,
    } as PackageItem;

    setSlotItems(prev => {
      const updated = [...prev];
      updated[dish.slotIndex] = newItem;
      const filled = updated.filter((s): s is PackageItem => s !== null);
      dispatch({ type: 'ADD_MEAL', payload: { item: newItem } });
      dispatch({ type: 'VALIDATE_REQUEST', payload: { items: filled } });
      return updated;
    });
  }, []);

  // ✅ removeMeal limpa apenas o slot — não desloca os outros
  const removeMeal = useCallback((index: number) => {
    setSlotItems(prev => {
      const updated = [...prev];
      updated[index] = null;
      const filled = updated.filter((s): s is PackageItem => s !== null);
      dispatch({ type: 'REMOVE_MEAL', payload: { index } });
      dispatch({ type: 'VALIDATE_REQUEST', payload: { items: filled } });
      return updated;
    });
  }, []);

  const updateAccompaniments = useCallback((index: number, accompaniments: AccompanimentOption[]) => {
    setSlotItems(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index]!, selectedAccompaniments: accompaniments };
      }
      const filled = updated.filter((s): s is PackageItem => s !== null);
      dispatch({ type: 'VALIDATE_REQUEST', payload: { items: filled } });
      return updated;
    });
  }, []);

  /**
   * ✅ CÁLCULO DE NUTRIÇÃO AGREGADO
   * Calcula a nutrição individual de cada marmita e depois soma o total.
   * O uso de item.selectedAccompaniments garante que o acompanhamento de uma marmita
   * não "vaze" para o cálculo da outra.
   */
  const aggregatedNutrition = useMemo(() => {
    const mealsNutrition = selectedItems.map(item =>
      calculatePackageItemNutrition(item).nutrition
    );
    return aggregateNutritionCollection(mealsNutrition);
  }, [selectedItems]);

  const canSubmit = useMemo(() => {
    const full = selectedItems.length === packageData.capacity;
    const configured = selectedItems.every(item => isMealComplete(item));
    return full && configured && !machine.isBusy;
  }, [selectedItems, packageData.capacity, machine.isBusy]);
  const handleAddToCart = useCallback(async () => {
    if (!canSubmit) return;

    dispatch({ type: 'SUBMIT_CART' });

    try {
      // ✅ Montagem do Rastro com isolamento nutricional por item
      const itemsTrace: ItemTrace[] = selectedItems.map((item) => {
        const calculated = calculatePackageItemNutrition(item);
        return {
          dishId: item.dishId,
          dishName: item.dishName,
          sizeId: item.sizeId,
          mainDishWeightUsed: calculated.metadata.targetMainDishWeightUsed,
          recipeWeightUsed: calculated.metadata.recipeWeightUsed,
          accompanimentIds: item.selectedAccompaniments.map((acc) => String(acc.id)),
          accompaniments: item.selectedAccompaniments,
          skippedNoAccompanimentCount: calculated.metadata.skippedNoAccompanimentCount,
          nutrition: calculated.nutrition,
        };
      });

      // ✅ Mapeamento das marmitas para o payload do carrinho
      const mealsForCart = selectedItems.map(it => ({
        label: it.dishName,
        dishId: it.dishId,
        dishName: it.dishName,
        accompaniments: it.selectedAccompaniments.map(acc => ({
          id: acc.id,
          name: acc.name,
          weight: acc.weight,
          groupId: acc.groupId,
          isNoAccompaniment: acc.isNoAccompaniment,
          is_no_accompaniment: acc.is_no_accompaniment,
          nutritionSkipped: Boolean(acc.isNoAccompaniment || acc.is_no_accompaniment),
        }))
      }));

      await cart.addItem({
        name: packageData.name,
        price: packageData.price || 0,
        quantity: 1,
        image: packageData.image || "",
        itemType: "package",
        // Consolida o trace individual + macros totais para o banco de dados
        appliedNutrition: { itemsTrace, ...aggregatedNutrition } as unknown as AppliedNutrition,
        options: {
          _type: 'package_custom',
          packageId: packageData.id,
          sizeName: `${packageData.capacity} Marmitas`,
          meals: mealsForCart
        }
      });

      toast.success("Combo adicionado com sucesso!");
      handleReset();
    } catch {
      toast.error("Erro ao adicionar ao carrinho.");
      dispatch({ type: 'VALIDATE_REQUEST', payload: { items: selectedItems } });
    }
  }, [canSubmit, packageData, selectedItems, cart, handleReset, aggregatedNutrition]);

  return {
    state: machine.currentState as PackageState,
    items: slotItems, // array de tamanho fixo — null = slot vazio
    progress: packageData.capacity > 0 ? (selectedItems.length / packageData.capacity) * 100 : 0,
    canSubmit,
    aggregatedNutrition,
    actions: { addMeal, removeMeal, updateAccompaniments, handleAddToCart, reset: handleReset }
  };
}
