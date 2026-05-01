// client/src/pages/packages/logic/usePackageViewModel.ts

import { useReducer, useState, useCallback, useMemo } from "react";
import { packageMachine, initialPackageContext } from "./packageMachine";
import { 
  PackageItem, 
  PackageState, 
  AccompanimentOption, 
  AccompanimentGroupRule 
} from "./packageMachine.types";
import { canSubmitPackage } from "./packageGuards"; 
import { useCart } from "@/_core/CartContext";
import { appToast as toast } from "@/lib/app-toast";

// ✅ IMPORTAÇÕES DO DOMÍNIO
import { 
  NutritionData as AppliedNutrition, 
  calculateMealNutrition, 
  aggregateNutritionCollection
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
  accompanimentIds: string[];
  nutrition: AppliedNutrition;
}

export function usePackageViewModel(packageData: PackageData) {
  const cart = useCart();
  const [selectedItems, setSelectedItems] = useState<PackageItem[]>([]);
  
  const [machine, dispatch] = useReducer(packageMachine, {
    ...initialPackageContext,
    capacity: packageData.capacity,
    currentState: 'selecting_meals'
  });

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setSelectedItems([]);
  }, []);

  // ✅ CORREÇÃO: A função addMeal agora aceita o parâmetro nutrition
  const addMeal = useCallback((dish: { 
    id: string; 
    name: string; 
    requiresAccompaniments: boolean; 
    accompanimentGroups: AccompanimentGroupRule[];
    nutrition?: Record<string, unknown>; // <-- Adicionado aqui
  }) => {
    if (selectedItems.length >= packageData.capacity) return;

    // ✅ CORREÇÃO: O newItem agora salva a nutrição para o estado não perder os dados do prato
    const newItem = {
      dishId: dish.id,
      dishName: dish.name,
      requiresAccompaniments: dish.requiresAccompaniments,
      accompanimentGroups: dish.accompanimentGroups,
      selectedAccompaniments: [],
      nutrition: dish.nutrition // <-- Salvando na memória da marmita!
    } as PackageItem; // Fazemos o cast para PackageItem caso a interface em types.ts não tenha sido atualizada ainda

    setSelectedItems(prev => {
      const updated = [...prev, newItem];
      dispatch({ type: 'ADD_MEAL', payload: { item: newItem } });
      dispatch({ type: 'VALIDATE_REQUEST', payload: { items: updated } });
      return updated;
    });
  }, [packageData.capacity, selectedItems.length]);

  const removeMeal = useCallback((index: number) => {
    setSelectedItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      dispatch({ type: 'REMOVE_MEAL', payload: { index } });
      dispatch({ type: 'VALIDATE_REQUEST', payload: { items: updated } });
      return updated;
    });
  }, []);

  const updateAccompaniments = useCallback((index: number, accompaniments: AccompanimentOption[]) => {
    setSelectedItems(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], selectedAccompaniments: accompaniments };
      }
      dispatch({ type: 'VALIDATE_REQUEST', payload: { items: updated } });
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
      calculateMealNutrition(
        item as unknown as Record<string, unknown>, 
        (item.selectedAccompaniments || []) as unknown as Record<string, unknown>[]
      )
    );
    return aggregateNutritionCollection(mealsNutrition);
  }, [selectedItems]);

  const canSubmit = useMemo(() => canSubmitPackage(machine, selectedItems), [machine, selectedItems]);

  const handleAddToCart = useCallback(async () => {
    if (!canSubmit) return;

    dispatch({ type: 'SUBMIT_CART' });
    
    try {
      // ✅ Montagem do Rastro com isolamento nutricional por item
      const itemsTrace: ItemTrace[] = selectedItems.map((item) => ({
        dishId: item.dishId,
        accompanimentIds: item.selectedAccompaniments.map((acc) => String(acc.id)),
        nutrition: calculateMealNutrition(
          item as unknown as Record<string, unknown>, 
          (item.selectedAccompaniments || []) as unknown as Record<string, unknown>[]
        ),
      }));

      // ✅ Mapeamento das marmitas para o payload do carrinho
      const mealsForCart = selectedItems.map(it => ({
        label: it.dishName, 
        dishId: it.dishId,
        dishName: it.dishName,
        accompaniments: it.selectedAccompaniments.map(acc => ({
          id: acc.id,
          name: acc.name,
          weight: acc.weight,
          groupId: acc.groupId
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
    items: selectedItems,
    progress: packageData.capacity > 0 ? (selectedItems.length / packageData.capacity) * 100 : 0,
    canSubmit,
    aggregatedNutrition, 
    actions: { addMeal, removeMeal, updateAccompaniments, handleAddToCart, reset: handleReset }
  };
}