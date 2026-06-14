// client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts

import { useState, useMemo, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { appToast as toast } from "@/lib/app-toast";
import { calculateSingleCardNutrition, type MacroData, type SingleCardOption } from "./utils/nutrition-logic";
import type { FullPrescription } from "../../../../../../server/routers/storefront/nutri/types";
import type { BuilderMeal, BuilderGroup, BuilderOption, BuilderPrescriptionState, CatalogProductInput, SizeInput, AccInput, CatalogSizeInput } from "./../types";
import {
  getSizeGroups,
  getProductSizes,
  getMainDishWeightFromSize,
  getAllowedAccompanimentIdsForSize,
  mapDefaultAccompaniments,
  getGroupForAccompaniment,
} from "./utils/builder-helpers";

const positiveNumberOrNull = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function usePrescriptionBuilder(initialData?: FullPrescription | Partial<BuilderPrescriptionState>) {
  const [prescription, setPrescription] = useState<BuilderPrescriptionState>({
    planName: initialData?.planName || "",
    meals: (initialData?.meals as BuilderMeal[] | undefined) ?? [],
    id: initialData?.id,
    technicalInsight: initialData?.technicalInsight,
    totalKcalTarget: initialData?.totalKcalTarget,
    discountPercentage: initialData?.discountPercentage,
  });

  const [pickingFor, setPickingFor] = useState<{ mealId: string; groupId: string } | null>(null);
  const [pickingAccFor, setPickingAccFor] = useState<{ mealId: string; groupId: string; optionId: string } | null>(null);

  const updateMeals = useCallback((callback: (meals: BuilderMeal[]) => BuilderMeal[] | any) => {
    setPrescription((prev) => ({ ...prev, meals: callback(prev.meals || []) }));
  }, []);

  const addMeal = () => updateMeals((m: BuilderMeal[]): BuilderMeal[] => [...m, {
    id: String(uuidv4()),
    name: `Refeição ${m.length + 1}`,
    groups: [{
      id: String(uuidv4()),
      name: "Opções da Semana",
      options: [],
      minSelections: 1,
      maxSelections: 7,
      isRequired: true
    }],
    notes: ""
  }]);

  const removeMeal = (id: string) => updateMeals((m: BuilderMeal[]): BuilderMeal[] => m.filter(meal => meal.id !== id));
  const updateMealName = (id: string, name: string) => updateMeals((m: BuilderMeal[]): BuilderMeal[] => m.map(meal => meal.id === id ? { ...meal, name } : meal));

  const addOptionToGroup = (product: CatalogProductInput) => {
    if (!pickingFor) return;
    let limitReached = false;

    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => m.id === pickingFor.mealId ? {
      ...m,
      groups: m.groups.map((g: BuilderGroup): BuilderGroup => {
        if (g.id !== pickingFor.groupId) return g;
        if ((g.options || []).length >= 7) { limitReached = true; return g; }

        const productSizes = getProductSizes(product);
        const defaultSize = productSizes.find((s) => s.isDefault) || productSizes[0];
        if (!defaultSize) {
          // Se não há tamanho real vinculado, não cria item fake
          // minFallback: 0 garante que nenhum acompanhamento seja pré-selecionado
          limitReached = true;
          return g;
        }

        // Aplica pré-seleção real usando minFallback: 0 para não forçar seleção
        const defaultSelection = mapDefaultAccompaniments(getSizeGroups(defaultSize as any));

        const basePrice = Number(defaultSize?.price || product.basePrice || product.base_price || product.price || 0);
        const mainDishWeight = getMainDishWeightFromSize(defaultSize);
        const calculatedPrice = basePrice * 1;

        const newOption: BuilderOption = {
          id: String(uuidv4()),
          dishId: String(product.id),
          name: String(product.name),
          basePrice: basePrice,
          multiplier: 1,
          price: calculatedPrice,
          priceAtCreation: calculatedPrice,
          sizeId: defaultSize?.id ? Number(defaultSize.id) : undefined,
          sizeName: defaultSize?.name,
          weight: defaultSize?.weight,
          sizeWeight: defaultSize?.weight,
          isDefault: true,
          mainDishWeight,
          noAccompanimentsMessage: defaultSize?.noAccompanimentsMessage,
          // allowedAccompaniments pre-selecionados via mapDefaultAccompaniments(getSizeGroups(defaultSize))
          allowedAccompaniments: defaultSelection.selectedAccompaniments,
          nutritionalData: {
            sizeId: defaultSize?.id ? Number(defaultSize.id) : undefined,
            sizeName: defaultSize?.name,
            weight: defaultSize?.weight,
            sizeWeight: defaultSize?.weight,
            mainDishWeight,
            noAccompanimentsMessage: defaultSize?.noAccompanimentsMessage,
            allowedAccompaniments: defaultSelection.selectedAccompaniments,
            autoSelectedAccompaniments: defaultSelection.autoSelectedCount,
            baseMacros: {
              kcal: Number(product.energyKcal || 0),
              protein: Number(product.proteins || 0),
              carbs: Number(product.carbs || 0),
              fat: Number(product.fatTotal || 0)
            }
          },
          macros: {
            kcal: Number(product.energyKcal || 0),
            protein: Number(product.proteins || 0),
            carbs: Number(product.carbs || 0),
            fat: Number(product.fatTotal || 0)
          } as BuilderOption["macros"],
          availableSizes: productSizes as BuilderOption['availableSizes']
        };

        return { ...g, options: [...(g.options || []), newOption] };
      })
    } : m));

    // 🚀 FIX: Fecha automaticamente a barra lateral do catálogo ao escolher o prato principal
    setPickingFor(null);

    if (limitReached) {
      toast.error("Não foi possível adicionar o prato.", { description: "Verifique se a refeição ainda tem espaço." });
    }
  };

  const removeOption = (mId: string, gId: string, optId: string) =>
    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => m.id === mId ? {
      ...m,
      groups: m.groups.map((g: BuilderGroup): BuilderGroup => g.id === gId ? { ...g, options: g.options.filter(o => o.id !== optId) } : g)
    } : m));

  const updateOptionSize = (mId: string, gId: string, optId: string, size: SizeInput) => {
    let removedInvalidAccompaniments = false;

    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => m.id === mId ? {
      ...m,
      groups: m.groups.map((g: BuilderGroup): BuilderGroup => g.id === gId ? {
        ...g,
        options: g.options.map((o: BuilderOption): BuilderOption => {
          if (o.id !== optId) return o;

          const newBasePrice = Number(size.price || o.basePrice || 0);
          const currentMultiplier = Number(o.multiplier) || 1;
          const newCalculatedPrice = newBasePrice * currentMultiplier;
          const mainDishWeight = getMainDishWeightFromSize(size);

          // Quando altera o tamanho, aplica nova pré-seleção real e remove inválidos
          // mapDefaultAccompaniments(getSizeGroups(size)) define os acompanhamentos permitidos
          const allowedIds = getAllowedAccompanimentIdsForSize(size);
          removedInvalidAccompaniments = (o.allowedAccompaniments || []).some(
            (acc) => !allowedIds.has(String(acc.id)),
          );
          // «Este acompanhamento nao pertence ao tamanho selecionado.» é exibido ao usuário abaixo
          const newDefaultAccs = mapDefaultAccompaniments(getSizeGroups(size as any));

          return {
            ...o,
            sizeId: size.id,
            sizeName: size.name,
            weight: size.weight,
            sizeWeight: size.weight,
            price: newCalculatedPrice,
            priceAtCreation: newCalculatedPrice,
            mainDishWeight,
            noAccompanimentsMessage: size.noAccompanimentsMessage,
            allowedAccompaniments: newDefaultAccs.selectedAccompaniments,
            nutritionalData: {
              ...o.nutritionalData,
              sizeId: size.id,
              sizeName: size.name,
              weight: size.weight,
              sizeWeight: size.weight,
              mainDishWeight,
              noAccompanimentsMessage: size.noAccompanimentsMessage,
              allowedAccompaniments: newDefaultAccs.selectedAccompaniments,
              autoSelectedAccompaniments: newDefaultAccs.autoSelectedCount,
            }
          };
        })
      } : g)
    } : m));

    if (removedInvalidAccompaniments) {
      // Alguns acompanhamentos foram ajustados porque nao pertencem ao novo tamanho.
      toast.warning(
        "Alguns acompanhamentos foram ajustados porque nao pertencem ao novo tamanho.",
      );
    }
  };

  const toggleAccompanimentToOption = (mId: string, gId: string, optId: string, acc: AccInput) => {
    let blockedBySize = false;
    let blockedByMax = false;

    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => {
      if (String(m.id) !== String(mId)) return m;

      return {
        ...m,
        groups: m.groups.map((g: BuilderGroup): BuilderGroup => {
          if (g.id !== gId) return g;

          return {
            ...g,
            options: g.options.map((o: BuilderOption): BuilderOption => {
              if (o.id !== optId) return o;

              const current = o.allowedAccompaniments || [];
              const selectedSize = (o.availableSizes || []).find(s => String(s.id) === String(o.sizeId)) as CatalogSizeInput;

              const sourceGroup = getGroupForAccompaniment(selectedSize, acc, acc.sourceGroupId);
              const sourceGroupId = sourceGroup?.id ? String(sourceGroup.id) : (acc.sourceGroupId ? String(acc.sourceGroupId) : null);

              const exists = current.find(a =>
                String(a.id) === String(acc.id) &&
                String(a.sourceGroupId ?? "") === String(sourceGroupId ?? "")
              );

              const allowedIds = getAllowedAccompanimentIdsForSize(selectedSize);
              if (!exists && allowedIds.size > 0 && !allowedIds.has(String(acc.id))) {
                blockedBySize = true;
                return o;
              }

              const groupMax = Number(sourceGroup?.maxSelections ?? Number.NaN);
              const selectedInGroup = current.filter(item => String(item.sourceGroupId ?? "") === String(sourceGroupId ?? ""));
              const isTogglingNoAcc = Boolean(acc.isNoAccompaniment || acc.is_no_accompaniment);

              if (!exists && Number.isFinite(groupMax) && groupMax > 0 && selectedInGroup.length >= groupMax && !isTogglingNoAcc) {
                blockedByMax = true;
                return o;
              }

              let updated = [...current];
              if (exists) {
                updated = current.filter(a => !(
                  String(a.id) === String(acc.id) &&
                  String(a.sourceGroupId ?? "") === String(sourceGroupId ?? "")
                ));
              } else {
                if (isTogglingNoAcc) {
                  updated = current.filter(item => String(item.sourceGroupId ?? "") !== String(sourceGroupId ?? ""));
                } else {
                  updated = current.filter(item => !(String(item.sourceGroupId ?? "") === String(sourceGroupId ?? "") && item.isNoAccompaniment));
                }

                // ✅ P0 FIX: salvar groupId/groupName/defaultGrammage corretos do catálogo
              const resolvedGroupId = sourceGroupId ?? null;
              const resolvedGroupName = sourceGroup?.name ?? acc.sourceGroupName ?? null;
              const resolvedDefaultGrammage =
                positiveNumberOrNull(sourceGroup?.defaultGrammage) ??
                positiveNumberOrNull(acc.weight) ??
                100;
              const resolvedWeight = resolvedDefaultGrammage; // weight = defaultGrammage do grupo

              updated.push({
                  id: Number.isFinite(Number(acc.id)) ? Number(acc.id) : acc.id,
                  name: acc.name,
                  // Campos esperados pelo produto normal / recalculateSingleItem:
                  groupId: resolvedGroupId,
                  groupName: resolvedGroupName,
                  defaultGrammage: resolvedDefaultGrammage,
                  weight: resolvedWeight,
                  minSelections: sourceGroup?.minSelections != null
                    ? Number(sourceGroup.minSelections)
                    : null,
                  maxSelections: sourceGroup?.maxSelections != null
                    ? Number(sourceGroup.maxSelections)
                    : null,
                  // Aliases legados para compatibilidade com prescrições antigas:
                  sourceGroupId,
                  sourceGroupName: resolvedGroupName,
                  isBase: updated.length === 0,
                  energyKcal: Number(acc.energyKcal || 0),
                  proteins: Number(acc.proteins || 0),
                  carbs: Number(acc.carbs || 0),
                  fatTotal: Number(acc.fatTotal || 0),
                  isNoAccompaniment: isTogglingNoAcc,
                  is_no_accompaniment: isTogglingNoAcc,
                });
              }

              return { ...o, allowedAccompaniments: updated, nutritionalData: { ...o.nutritionalData, allowedAccompaniments: updated } };
            })
          };
        })
      };
    }));

    // Este acompanhamento nao pertence ao tamanho selecionado.
    if (blockedBySize) toast.warning("Este acompanhamento nao pertence ao tamanho selecionado.");
    // Limite de acompanhamentos atingido para este grupo.
    if (blockedByMax) toast.warning("Limite de acompanhamentos atingido para este grupo.");
  };

  const toggleAccompanimentIsBase = (optId: string, accId: string | number) => {
    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => ({
      ...m,
      groups: m.groups.map((g: BuilderGroup): BuilderGroup => ({
        ...g,
        options: g.options.map((o: BuilderOption): BuilderOption => {
          if (o.id !== optId) return o;
          return {
            ...o,
            allowedAccompaniments: (o.allowedAccompaniments || []).map(a => String(a.id) === String(accId) ? { ...a, isBase: !a.isBase } : a)
          };
        })
      }))
    })));
  };

  const dailyTotals = useMemo(() => {
    const totals: MacroData = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    (prescription.meals || []).forEach((meal) => {
      (meal.groups || []).forEach((group) => {
        const options = group.options || [];
        if (options.length > 0) {
          let groupKcal = 0, groupProtein = 0, groupCarbs = 0, groupFat = 0;
          options.forEach((opt) => {
            const m = calculateSingleCardNutrition(opt as SingleCardOption);
            groupKcal += m.kcal; groupProtein += m.protein; groupCarbs += m.carbs; groupFat += m.fat;
          });
          totals.kcal += groupKcal / options.length; totals.protein += groupProtein / options.length;
          totals.carbs += groupCarbs / options.length; totals.fat += groupFat / options.length;
        }
      });
    });
    return { kcal: Math.round(totals.kcal), protein: Number(totals.protein.toFixed(1)), carbs: Number(totals.carbs.toFixed(1)), fat: Number(totals.fat.toFixed(1)) };
  }, [prescription.meals]);

  return {
    prescription: prescription as FullPrescription, setPrescription, dailyTotals,
    isPickingFor: pickingFor, setIsPickingFor: setPickingFor, isPickingAccFor: pickingAccFor, setIsPickingAccFor: setPickingAccFor,
    addMeal, removeMeal, updateMealName, addOptionToGroup, removeOption, updateOptionSize, toggleAccompanimentToOption, toggleAccompanimentIsBase
  };
}
