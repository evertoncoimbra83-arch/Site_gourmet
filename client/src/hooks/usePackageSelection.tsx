import { useState, useEffect, useMemo } from "react";
import { toast } from "@/components/ui/use-toast";

export function usePackageSelection(pkg: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMeals, setSelectedMeals] = useState<any[]>([]);

  // ✅ HELPER: Extrai números para ordenar gramagens (ex: "100g" vs "80g")
  const getNumericValue = (text: string | null | undefined) => {
    if (!text || typeof text !== 'string') return 0;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // ✅ HELPER: Função de ordenação (Peso > Alfabeto)
  const sortByWeightAndName = (a: any, b: any) => {
    if (!a || !b) return 0;
    
    const valA = getNumericValue(a.name);
    const valB = getNumericValue(b.name);

    // Se ambos tiverem números (ex: pesos), ordena pelo número
    if (valA !== 0 && valB !== 0 && valA !== valB) return valA - valB;
    
    // Senão, ordem alfabética
    return (a.name || "").localeCompare(b.name || "", 'pt-BR');
  };

  // 🔄 INICIALIZAÇÃO
  useEffect(() => {
    // 1. Proteção inicial
    if (!pkg || !pkg.options || !Array.isArray(pkg.options)) return;

    try {
      const meals = pkg.options.map((slot: any, i: number) => {
        // Fallback seguro se o slot vier vazio
        if (!slot) return {
           mealIndex: i,
           label: `Marmita ${i + 1}`,
           allowedDishes: [],
           accompanimentGroups: [],
           selectedAccompaniments: []
        };

        // 2. Ordena Pratos
        const sortedDishes = [...(slot.dishes || [])]
          .filter((d: any) => !!d)
          .sort((a, b) => (a.name || "").localeCompare(b.name || "", 'pt-BR'));

        // 3. Ordena Grupos e suas Opções
        const sortedAccGroups = [...(slot.accompanimentGroups || [])]
          .filter((g: any) => !!g) 
          .sort(sortByWeightAndName)
          .map((group: any) => ({
            ...group,
            maxSelections: Number(group.maxSelections) || 1,
            options: [...(group.options || [])]
              .filter((o: any) => !!o)
              .sort(sortByWeightAndName)
          }));

        return {
          mealIndex: i,
          label: slot.label || slot.name || `Marmita ${i + 1}`,
          dishId: null,
          dishName: "",
          nutritional_info: slot.nutritional_info || null,
          allowedDishes: sortedDishes,
          accompanimentGroups: sortedAccGroups,
          selectedAccompaniments: [], // Começa vazio
        };
      });

      setSelectedMeals(meals);
      setCurrentStep(0);
      
    } catch (error) {
      console.error("❌ Erro ao processar dados do pacote:", error);
      toast.error("Erro ao carregar opções do pacote.");
    }
  }, [pkg]);

  // --- SELEÇÃO DE PRATO ---
  const handleSelectDish = (dishId: string) => {
    const meal = selectedMeals[currentStep];
    if (!meal) return;

    // Converte para string para garantir comparação
    const dish = meal.allowedDishes.find((d: any) => String(d.id) === String(dishId));
    
    if (!dish) return;

    setSelectedMeals(prev => prev.map(m => 
      m.mealIndex === currentStep 
        ? { 
            ...m, 
            dishId: dish.id, 
            dishName: dish.name, 
            nutritional_info: dish.nutritional_info, 
            // Opcional: Se quiser limpar os acompanhamentos ao trocar de prato, descomente abaixo:
            // selectedAccompaniments: [] 
          } 
        : m
    ));
  };

  // --- SELEÇÃO DE ACOMPANHAMENTO ---
  const handleSelectAcc = (groupId: string, optionId: string) => {
    setSelectedMeals(prev => prev.map(m => {
      // Só altera a refeição atual
      if (m.mealIndex !== currentStep) return m;

      // Encontra o grupo e a opção completa (com preço, nome, categoria)
      const group = m.accompanimentGroups.find((g: any) => String(g.id) === String(groupId));
      const option = group?.options?.find((o: any) => String(o.id) === String(optionId));
      
      if (!group || !option) return m;

      const currentSelected = m.selectedAccompaniments || [];
      
      // Verifica se já está selecionado (Toggle)
      const isAlreadySelected = currentSelected.some((a: any) => 
        String(a.id) === String(optionId) && String(a.groupId) === String(groupId)
      );

      // 1. REMOVER (Toggle OFF)
      if (isAlreadySelected) {
        return {
          ...m,
          selectedAccompaniments: currentSelected.filter((a: any) => 
            !(String(a.id) === String(optionId) && String(a.groupId) === String(groupId))
          )
        };
      }

      // 2. ADICIONAR (Verificando limites)
      const countInGroup = currentSelected.filter((a: any) => String(a.groupId) === String(groupId)).length;
      const max = group.maxSelections;

      // Caso A: Limite atingido e é Single Select (Radio Button Behavior)
      // Substitui a seleção anterior pela nova
      if (countInGroup >= max && max === 1) {
          const otherGroups = currentSelected.filter((a: any) => String(a.groupId) !== String(groupId));
          return {
            ...m,
            selectedAccompaniments: [
                ...otherGroups, 
                { ...option, groupId: group.id, groupName: group.name } // Adiciona o novo
            ]
          };
      }
      
      // Caso B: Limite atingido e é Multi Select
      // Bloqueia e avisa
      if (countInGroup >= max && max > 1) {
          toast.error(`Máximo de ${max} opções neste grupo.`);
          return m;
      }

      // Caso C: Ainda cabe mais um
      return {
        ...m,
        selectedAccompaniments: [
          ...currentSelected,
          { ...option, groupId: group.id, groupName: group.name }
        ]
      };
    }));
  };

  return {
    currentStep,
    setCurrentStep,
    selectedMeals,
    handleSelectDish,
    handleSelectAcc,
    // Helper para acesso rápido na UI
    currentMeal: selectedMeals[currentStep] || null
  };
}