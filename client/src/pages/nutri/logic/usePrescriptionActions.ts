// client/src/pages/nutri/logic/usePrescriptionActions.ts

import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import type { FullPrescription, PrescriptionMeal } from "../../../../../server/routers/storefront/nutri/types";

interface RawOptionData {
  dishId?: string | number | null;
  sizeId?: string | number | null;
  priceAtCreation?: number | null;
  price?: number | null;
  multiplier?: string | number | null;
  isDefault?: boolean;
  allowedAccompaniments?: unknown[];
  macros?: Record<string, unknown> | null;
  nutritionalData?: Record<string, unknown> | null;
  mainDishWeight?: number | null;
  sizeName?: string | null;
  weight?: string | number | null;
  sizeWeight?: string | number | null;
  noAccompanimentsMessage?: string | null;
  legacySizeMissing?: boolean;
  availableSizes?: Array<{ id?: string | number | null }> | null;
  [key: string]: unknown;
}

type FullPrescriptionWithState = FullPrescription & {
  id?: string;
  discountPercentage?: number;
};

interface UsePrescriptionActionsProps {
  clientId?: string;
  prescriptionId?: string | null; 
  builder: {
    prescription: FullPrescriptionWithState;
    // ✅ ADDED: Agora as actions recebem os totais calculados
    dailyTotals?: { kcal: number; protein: number; carbs: number; fat: number };
  };
  onClose: () => void;
}

export function usePrescriptionActions({ clientId, prescriptionId, builder, onClose }: UsePrescriptionActionsProps) {
  const utils = trpc.useUtils();
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const saveForClient = trpc.nutri.assignPrescription.useMutation({
    onSuccess: () => {
      toast.success("Plano Alimentar salvo com sucesso!");
      utils.nutri.getMyClients.invalidate(); 
      if (clientId) {
        utils.nutri.getPrescriptionDetails.invalidate({ clientId });
      }
      onClose();
    },
    onError: (err) => toast.error(`Erro ao salvar: ${err.message}`),
  });

  const saveAsTemplate = trpc.nutri.saveTemplate.useMutation({
    onSuccess: () => {
      toast.success("Modelo salvo na sua biblioteca!");
      utils.nutri.getMyTemplates.invalidate();
      setShowTemplateModal(false);
      if (!clientId) {
        onClose();
      }
    },
    onError: (err) => toast.error(`Erro ao salvar modelo: ${err.message}`),
  });

  const formatDataForDb = (planName: string, customMeals?: PrescriptionMeal[]) => {
    const mealsArray = customMeals || builder.prescription?.meals || [];
    
    const activeId = builder.prescription.id || (prescriptionId !== "NEW" ? prescriptionId : null);

    return {
      ...(activeId ? { id: activeId } : {}),
      planName: planName || builder.prescription?.planName || "Plano Alimentar",
      
      // ✅ FIX: Prioridade para o kcal calculado ativamente no Builder!
      totalKcalTarget: builder.dailyTotals?.kcal || builder.prescription?.totalKcalTarget || 0,
      macros: builder.dailyTotals || {},
      
      technicalInsight: builder.prescription?.technicalInsight || "",
      meals: mealsArray.map((meal) => ({
        ...meal,
        name: meal.name || "Refeição",
        notes: meal.notes || "",
        groups: (meal.groups || []).map((group) => ({
          ...group,
          name: group.name || "Grupo",
          options: (group.options || []).map((opt) => {
            const o = opt as unknown as RawOptionData; 
            const rawNutritionalData = (o.nutritionalData || {}) as Record<string, unknown>;
            const rawBaseMacros = (rawNutritionalData.baseMacros || o.macros || {}) as Record<string, unknown>;

            return {
              ...opt,
              dishId: o.dishId ? String(o.dishId) : null,
              sizeId: o.sizeId ? Number(o.sizeId) : null,
              priceAtCreation: Number(o.priceAtCreation || o.price || 0),
              multiplier: String(o.multiplier || "1.00"),
              isDefault: !!o.isDefault,
              sizeName: o.sizeName ?? rawNutritionalData.sizeName ?? null,
              weight: o.weight ?? o.sizeWeight ?? rawNutritionalData.weight ?? null,
              sizeWeight: o.sizeWeight ?? o.weight ?? rawNutritionalData.sizeWeight ?? null,
              mainDishWeight:
                o.mainDishWeight ??
                (rawNutritionalData.mainDishWeight as number | undefined) ??
                null,
              noAccompanimentsMessage:
                o.noAccompanimentsMessage ??
                (rawNutritionalData.noAccompanimentsMessage as string | undefined) ??
                null,
              // ✅ P0 FIX: Preservar groupId/groupName/defaultGrammage na serialização
              allowedAccompaniments: (o.allowedAccompaniments || []).map((acc) => {
                const a = acc as Record<string, unknown>;
                return {
                  ...a,
                  // Campos obrigatórios para o carrinho (mesmo formato do produto normal):
                  groupId: a.groupId ?? a.sourceGroupId ?? null,
                  groupName: a.groupName ?? a.sourceGroupName ?? null,
                  defaultGrammage: Number(a.defaultGrammage ?? a.weight ?? 100) || 100,
                  weight: Number(a.defaultGrammage ?? a.weight ?? 100) || 100,
                  minSelections: a.minSelections ?? null,
                  maxSelections: a.maxSelections ?? null,
                  // Aliases legados preservados:
                  sourceGroupId: a.sourceGroupId ?? a.groupId ?? null,
                  sourceGroupName: a.sourceGroupName ?? a.groupName ?? null,
                };
              }),
              macros: {
                kcal: Number(rawBaseMacros.kcal || 0),
                protein: Number(rawBaseMacros.protein || 0),
                carbs: Number(rawBaseMacros.carbs || 0),
                fat: Number(rawBaseMacros.fat || 0),
              },
              nutritionalData: {
                ...rawNutritionalData, 
                baseMacros: {
                  kcal: Number(rawBaseMacros.kcal || 0),
                  protein: Number(rawBaseMacros.protein || 0),
                  carbs: Number(rawBaseMacros.carbs || 0),
                  fat: Number(rawBaseMacros.fat || 0),
                },
                sizeId: o.sizeId ? Number(o.sizeId) : null,
                sizeName: o.sizeName ?? rawNutritionalData.sizeName ?? null,
                weight: o.weight ?? o.sizeWeight ?? rawNutritionalData.weight ?? null,
                sizeWeight: o.sizeWeight ?? o.weight ?? rawNutritionalData.sizeWeight ?? null,
                mainDishWeight:
                  o.mainDishWeight ??
                  (rawNutritionalData.mainDishWeight as number | undefined) ??
                  null,
                noAccompanimentsMessage:
                  o.noAccompanimentsMessage ??
                  (rawNutritionalData.noAccompanimentsMessage as string | undefined) ??
                  null,
              }
            };
          }),
        })),
      })),
    };
  };

  const handleSaveProcess = (isTemplateMode: boolean, sanitizedMeals?: PrescriptionMeal[]) => {
    if (!builder.prescription?.meals || builder.prescription.meals.length === 0) {
      return toast.error("Adicione pelo menos uma refeição antes de salvar.");
    }

    const hasInvalidLegacySize = (builder.prescription.meals || []).some((meal) =>
      (meal.groups || []).some((group) =>
        (group.options || []).some((option) => {
          const opt = option as unknown as RawOptionData;
          const availableSizes = Array.isArray(opt.availableSizes) ? opt.availableSizes : [];
          const selectedSizeExists = availableSizes.some(
            (size) => String(size.id) === String(opt.sizeId),
          );

          return Boolean(opt.legacySizeMissing) || (availableSizes.length > 0 && !selectedSizeExists);
        }),
      ),
    );

    if (hasInvalidLegacySize) {
      return toast.warning(
        "Tamanho antigo nao encontrado no cadastro atual. Se editar esta refeicao, selecione um tamanho valido.",
      );
    }

    if (isTemplateMode) {
      setShowTemplateModal(true);
    } else {
      if (!clientId) return toast.error("Selecione um paciente para atribuir a dieta.");
      const currentName = builder.prescription?.planName?.trim() || "Plano Alimentar";
      const formattedData = formatDataForDb(currentName, sanitizedMeals);
      
      saveForClient.mutate({ 
        clientId, 
        prescription: formattedData as unknown as Parameters<typeof saveForClient.mutate>[0]["prescription"] 
      });
    }
  };

  const confirmSaveTemplate = (name: string, description: string, sanitizedMeals?: PrescriptionMeal[]) => {
    if (name.trim().length < 3) {
      return toast.error("O nome do modelo precisa ter no mínimo 3 caracteres.");
    }

    const formattedData = formatDataForDb(name, sanitizedMeals);
    const activeId = builder.prescription.id || (prescriptionId !== "NEW" ? (prescriptionId ?? undefined) : undefined);

    saveAsTemplate.mutate({ 
      id: activeId,
      name, 
      description, 
      data: formattedData as unknown as Parameters<typeof saveAsTemplate.mutate>[0]["data"]
    });
  };

  return {
    showTemplateModal,
    setShowTemplateModal,
    isSaving: saveForClient.isPending || saveAsTemplate.isPending,
    handleSaveProcess,
    confirmSaveTemplate,
  };
}
