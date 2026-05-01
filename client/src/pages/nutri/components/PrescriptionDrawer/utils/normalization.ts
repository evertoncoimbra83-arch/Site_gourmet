import { v4 as uuidv4 } from "uuid";
import type { FullPrescription, PrescriptionMeal, PrescriptionOption } from "../../../../../../../server/routers/storefront/nutri/types";

export interface CatalogItem {
  id: string | number;
  availableSizes?: unknown[];
  basePrice?: number | string; 
  base_price?: number | string;
}

export function normalizePrescriptionData(
  p: unknown, 
  catalog: CatalogItem[] = []
): FullPrescription {
  if (!p) return { planName: "Plano Alimentar", meals: [] } as unknown as FullPrescription;

  const data = p as Record<string, unknown>;
  
  let rawMeals: unknown[] = [];
  
  // Prioridade de extração (Nova tabela 'meals' vs Snapshot antigo)
  if (Array.isArray(data.meals)) {
    rawMeals = data.meals;
  } else if (data.dietSnapshot) {
    rawMeals = typeof data.dietSnapshot === 'string' ? JSON.parse(data.dietSnapshot) : data.dietSnapshot as unknown[];
  } else if (data.content) {
    rawMeals = typeof data.content === 'string' ? JSON.parse(data.content) : data.content as unknown[];
  } else if (Array.isArray(p)) {
    rawMeals = p;
  }

  if (!Array.isArray(rawMeals)) rawMeals = [];

  const builtMeals: PrescriptionMeal[] = rawMeals.map((mItem) => {
    const m = mItem as Record<string, unknown>;
    const mealId = (m.id as string) || uuidv4();
    const mealName = (m.name as string) || (m.mealName as string) || "Refeição";

    const transformOption = (oItem: unknown): PrescriptionOption => {
      const o = oItem as Record<string, unknown>;
      const nutriData = (o.nutritionalData as Record<string, unknown>) || {};
      
      // ✅ Prioriza macros já calculados (que agora o backend envia)
      const macrosSource = (o.macros as Record<string, unknown>) || (nutriData.baseMacros as Record<string, unknown>) || o || {};
      const macros = {
        kcal: Number(macrosSource.kcal || macrosSource.energyKcal || 0),
        protein: Number(macrosSource.protein || macrosSource.proteins || 0),
        carbs: Number(macrosSource.carbs || 0),
        fat: Number(macrosSource.fat || macrosSource.fatTotal || 0),
      };

      const finalAccs = Array.isArray(o.allowedAccompaniments) 
        ? o.allowedAccompaniments 
        : Array.isArray(nutriData.allowedAccompaniments) 
          ? nutriData.allowedAccompaniments 
          : [];

      const sId = o.sizeId !== undefined ? Number(o.sizeId) : nutriData.sizeId ? Number(nutriData.sizeId) : null;
      const weight = o.mainDishWeight !== undefined ? Number(o.mainDishWeight) : nutriData.mainDishWeight !== undefined ? Number(nutriData.mainDishWeight) : 200;

      const catalogItem = catalog.find((c) => String(c.id) === String(o.dishId));
      const availableSizes = (catalogItem?.availableSizes as unknown[]) || (o.availableSizes as unknown[]) || [];

      // ✅ IMPORTANTE: Preservar os campos de preço
      const priceAtCreation = Number(o.priceAtCreation || o.fixedPrice || o.price || 0);
      
      // Tenta recuperar o preço base do catálogo, se falhar usa o preço da criação
      const basePrice = catalogItem ? Number(catalogItem.basePrice || catalogItem.base_price || 0) : priceAtCreation;

      // 🔥 TRAVA DE SEGURANÇA (RESCUE LOGIC) 🔥
      // Corrige dietas corrompidas onde o 'price' foi salvo no 'multiplier' (ex: 8.00)
      const rawMultiplier = Number(o.multiplier || 1);
      const safeMultiplier = rawMultiplier > 5 ? 1 : rawMultiplier; // Se for bizarro (>5), reseta para 1

      return {
        ...o,
        id: (o.id as string) || uuidv4(),
        dishId: (o.dishId as string | number),
        name: (o.name as string),
        sizeId: sId,
        mainDishWeight: weight,
        
        multiplier: String(safeMultiplier), // ✅ Fator limpo e seguro
        basePrice: basePrice, // ✅ Injeta para não quebrar a edição de tamanho
        priceAtCreation: priceAtCreation,
        price: priceAtCreation, 
        
        isDefault: o.isDefault === true || String(o.isDefault) === "true",
        macros: macros,
        availableSizes: availableSizes,
        allowedAccompaniments: finalAccs,
        nutritionalData: {
          ...nutriData,
          sizeId: sId,
          mainDishWeight: weight,
          baseMacros: macros,
          allowedAccompaniments: finalAccs
        }
      } as unknown as PrescriptionOption;
    };

    // Suporte tanto para estrutura com Grupos (Builder) quanto Lista Simples (API)
    let finalGroups: PrescriptionMeal['groups'] = [];

    if (m.groups && Array.isArray(m.groups)) {
      finalGroups = m.groups.map((gItem) => {
        const g = gItem as Record<string, unknown>;
        return {
          id: (g.id as string) || uuidv4(),
          name: (g.name as string) || "Opções da Semana",
          minSelections: Number(g.minSelections || 1),
          maxSelections: Number(g.maxSelections || 7), // Atualizado para suportar até 7 pratos
          isRequired: g.isRequired !== false,
          options: (Array.isArray(g.options) ? g.options : []).map(transformOption)
        };
      });
    } else if (Array.isArray(m.dishes)) {
      // Se vier como lista plana (da nova tabela), agrupa por groupName para o Builder
      const groupsMap = new Map<string, PrescriptionMeal['groups'][number]>();
      m.dishes.forEach((dishItem) => {
        const dish = dishItem as Record<string, unknown>;
        const gName = (dish.groupName as string) || "Opções da Semana";
        if (!groupsMap.has(gName)) {
          groupsMap.set(gName, { id: uuidv4(), name: gName, minSelections: 1, maxSelections: 7, isRequired: true, options: [] });
        }
        groupsMap.get(gName)!.options.push(transformOption(dish));
      });
      finalGroups = Array.from(groupsMap.values());
    }

    return {
      id: mealId,
      name: mealName,
      notes: (m.notes as string) || "",
      groups: finalGroups
    };
  });

  return {
    id: data.id as string, 
    planName: (data.planName as string) || (data.name as string) || "Plano Alimentar",
    totalKcalTarget: (data.totalKcalTarget as number) || 0,
    technicalInsight: (data.technicalInsight as string) || "",
    meals: builtMeals
  } as unknown as FullPrescription;
}