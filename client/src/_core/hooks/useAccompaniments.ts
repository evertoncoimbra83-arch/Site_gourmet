import { useState, useCallback } from "react";

// --- INTERFACES ---

export interface AccompanimentOption {
  id: number | string;
  name: string;
  price?: string | number;
  priceModifier?: string | number;
  groupId: number | string;
  groupName?: string;
  nutritional_info?: string | {
    calories?: number | string;
    kcal?: number | string;
    [key: string]: unknown;
  };
}

export interface AccompanimentGroup {
  id: number | string;
  name: string;
  minSelection?: number;
  maxSelections?: number;
  maxSelection?: number; // Suporte para legado
  options: AccompanimentOption[];
}

// Tipo para o estado de seleções: Chave é o ID do grupo, valor é o array de opções selecionadas
type SelectionsState = Record<number | string, AccompanimentOption[]>;

export function useAccompaniments(initialSelections: SelectionsState = {}) {
  const [selections, setSelections] = useState<SelectionsState>(initialSelections);

  // ✅ Função principal de clique totalmente tipada
  const toggleOption = useCallback((group: AccompanimentGroup, option: AccompanimentOption) => {
    setSelections((prev) => {
      const gId = group.id;
      const oId = option.id;
      
      // Cria uma cópia segura do array atual
      const current = [...(prev[gId] || [])];
      
      // Verifica se já está selecionado
      const isSelected = current.some((item) => String(item.id) === String(oId));

      // 1. Lógica de REMOVER
      if (isSelected) {
        return { 
          ...prev, 
          [gId]: current.filter((item) => String(item.id) !== String(oId)) 
        };
      }

      // 2. Lógica de ADICIONAR
      const max = Number(group.maxSelections || group.maxSelection || 1);
      
      if (current.length >= max) {
        if (max === 1) {
          // Modo Rádio: Substitui o item atual
          return { ...prev, [gId]: [{ ...option, groupName: group.name }] };
        }
        // Modo Limite: Bloqueia se atingir o máximo
        return prev;
      }

      // 3. Adiciona novo item
      return { 
        ...prev, 
        [gId]: [...current, { ...option, groupName: group.name }] 
      };
    });
  }, []);

  // Helpers
  const getFlatSelections = useCallback(() => Object.values(selections).flat(), [selections]);
  
  const calculateExtraPrice = useCallback(() => {
    return getFlatSelections().reduce((sum, i) => sum + Number(i.price || i.priceModifier || 0), 0);
  }, [getFlatSelections]);

  const calculateTotalKcal = useCallback(() => {
    return getFlatSelections().reduce((sum, i) => {
      let info = i.nutritional_info;
      
      // Tratamento seguro para JSON string ou objeto
      if (typeof info === 'string') { 
        try { 
          info = JSON.parse(info); 
        } catch { 
          info = {}; 
        } 
      }
      
      const kcalValue = (info as Record<string, unknown>)?.calories || (info as Record<string, unknown>)?.kcal || 0;
      return sum + Number(kcalValue);
    }, 0);
  }, [getFlatSelections]);

  const isValid = useCallback((groups: AccompanimentGroup[]) => {
    return groups.every(g => {
      const selectedInGroup = selections[g.id] || [];
      return selectedInGroup.length >= Number(g.minSelection || 0);
    });
  }, [selections]);

  const resetSelections = useCallback(() => setSelections({}), []);

  return { 
    selections, 
    toggleOption, 
    setSelections,
    resetSelections,
    getFlatSelections,
    calculateExtraPrice,
    calculateTotalKcal,
    isValid
  };
}