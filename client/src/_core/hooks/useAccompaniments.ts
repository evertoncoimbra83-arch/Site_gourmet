import { useState, useCallback } from "react";

// Definição dos tipos para garantir consistência
export interface AccompanimentOption {
  id: number | string;
  name: string;
  price?: string | number;
  priceModifier?: string | number;
  groupId: number | string;
  groupName?: string;
  nutritional_info?: any;
}

export interface AccompanimentGroup {
  id: number | string;
  name: string;
  minSelection?: number;
  maxSelections?: number;
  maxSelection?: number; // Suporte para legado
  options: AccompanimentOption[];
}

export function useAccompaniments(initialSelections: Record<number, any[]> = {}) {
  const [selections, setSelections] = useState<Record<number, any[]>>(initialSelections);

  // ✅ Função principal de clique
  const toggleOption = useCallback((group: any, option: any) => {
    setSelections((prev) => {
      const gId = Number(group.id);
      const oId = Number(option.id);
      
      // Cria uma cópia segura do array atual
      const current = [...(prev[gId] || [])];
      
      // Verifica se já está selecionado
      const isSelected = current.some((item) => Number(item.id) === oId);

      // 1. Lógica de REMOVER
      if (isSelected) {
        return { 
          ...prev, 
          [gId]: current.filter((item) => Number(item.id) !== oId) 
        };
      }

      // 2. Lógica de ADICIONAR
      const max = Number(group.maxSelections || group.maxSelection || 1);
      
      if (current.length >= max) {
        if (max === 1) {
          // Modo Rádio: Substitui
          return { ...prev, [gId]: [{ ...option, groupName: group.name }] };
        }
        // Modo Limite: Bloqueia
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
      if (typeof info === 'string') { try { info = JSON.parse(info); } catch { info = {}; } }
      return sum + Number(info?.calories || info?.kcal || 0);
    }, 0);
  }, [getFlatSelections]);

  const isValid = useCallback((groups: any[]) => {
    return groups.every(g => (selections[Number(g.id)] || []).length >= Number(g.minSelection || 0));
  }, [selections]);

  const resetSelections = useCallback(() => setSelections({}), []);

  // ✅ RETORNO OBRIGATÓRIO: Verifique se toggleOption está aqui
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