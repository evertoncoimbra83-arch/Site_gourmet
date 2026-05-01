import { useMemo } from "react";

// --- INTERFACES ---

interface Accompaniment {
  id: string | number;
  name: string;
  priceModifier?: string | number;
  categoryName?: string;
  category?: { name: string };
  [key: string]: unknown;
}

interface AccompanimentGroup {
  id: string | number;
  name: string;
  itemsOrder?: string | Array<{ id: string | number; price_modifier?: string | number }>;
  options?: Accompaniment[];
}

interface Package {
  allowedAccompaniments?: Accompaniment[];
}

// Interface para o objeto de configuração dentro do JSON de itemsOrder
interface ItemOrderConfig {
  id?: string | number;
  group_id?: string | number;
  price_modifier?: string | number;
}

interface MealSelection {
  dishData?: {
    accompanimentGroups?: AccompanimentGroup[];
  };
  accompanimentGroups?: AccompanimentGroup[];
  selectedAccompaniments?: Array<{
    groupId?: string | number;
    group_id?: string | number;
    group?: { id: string | number };
    [key: string]: unknown;
  }>;
}

interface UsePackageAccProps {
  currentMeal: MealSelection | null | undefined;
  pkg: Package | null | undefined;
}

export function usePackageAcc({ currentMeal, pkg }: UsePackageAccProps) {
  /**
   * ✅ Lógica de Hidratação de Grupos
   */
  const accompanimentGroups = useMemo(() => {
    if (!currentMeal) return [];

    const rawGroups = currentMeal.accompanimentGroups || currentMeal.dishData?.accompanimentGroups || [];
    
    const backupItems = rawGroups.flatMap((g) => g?.options || []);
    const globalItems = pkg?.allowedAccompaniments || [];
    const allAvailableItems = [...globalItems, ...backupItems];

    return rawGroups.map((group) => {
      if (!group) return null;

      if (group.options && Array.isArray(group.options) && group.options.length > 0) {
        return group;
      }

      try {
        const orderData = typeof group.itemsOrder === 'string' 
          ? (JSON.parse(group.itemsOrder) as ItemOrderConfig[]) 
          : (group.itemsOrder as ItemOrderConfig[] || []);

        if (Array.isArray(orderData) && orderData.length > 0) {
          const hydratedOptions = orderData.map((conf) => {
            const itemId = Number(conf.id || conf.group_id);
            const baseItem = allAvailableItems.find((a) => Number(a.id) === itemId);
            
            if (!baseItem) return null;

            return { 
              ...baseItem, 
              priceModifier: conf.price_modifier || baseItem.priceModifier || "0.00",
              categoryName: baseItem.categoryName || baseItem.category?.name || "Acompanhamentos"
            } as Accompaniment;
          }).filter((item): item is Accompaniment => item !== null);

          return { ...group, options: hydratedOptions };
        }
      } catch {
        // Ignora erros de parse
      }

      return group;
    })
    .filter((g): g is AccompanimentGroup => !!(g && g.options && g.options.length > 0));
  }, [currentMeal, pkg?.allowedAccompaniments]);

  /**
   * ✅ Formatação das Seleções Atuais
   */
  const formattedSelections = useMemo(() => {
    // ✅ CORREÇÃO: Tipagem do Record para evitar 'any[]'
    const selections: Record<number, unknown[]> = {};
    if (!currentMeal?.selectedAccompaniments) return selections;

    currentMeal.selectedAccompaniments.forEach((acc) => {
      const gId = Number(acc.groupId || acc.group_id || acc.group?.id);
      
      if (!isNaN(gId) && gId > 0) {
        if (!selections[gId]) selections[gId] = [];
        selections[gId].push(acc);
      }
    });
    return selections;
  }, [currentMeal?.selectedAccompaniments]);

  return {
    accompanimentGroups,
    formattedSelections,
    hasGroups: accompanimentGroups.length > 0
  };
}