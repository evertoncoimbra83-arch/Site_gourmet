// client/src/pages/packages/logic/usePackageAcc.ts
import { useMemo } from "react";
import { AccompanimentOption } from "./packageMachine.types";
import { TRPCGroupMeta, PackageSlot } from "../view/PackageDrawer";

interface UsePackageAccProps {
  currentMealState: {
    dishId?: string;
    selectedAccompaniments: AccompanimentOption[];
  } | undefined;
  slot: PackageSlot;
  // ✅ FIX: lista completa de opções disponíveis para hidratar grupos do Smart Generator
  allOptions?: Array<Record<string, unknown>>;
}

interface RawGroup {
  id: string | number;
  groupId?: string | number;
  name?: string;
  customLabel?: string;
  minSelections?: number;
  maxSelections?: number;
  options?: Array<Record<string, unknown>>;
  optionIds?: (string | number)[];
  group?: TRPCGroupMeta;
}

export function usePackageAcc({ currentMealState, slot, allOptions = [] }: UsePackageAccProps) {
  const accompanimentGroups = useMemo(() => {
    if (!slot) return [];

    const slotGroups = (slot.accompanimentGroups || slot.allowedGroups || []) as unknown as RawGroup[];

    return slotGroups.map((g) => {
      const hasOptions = Array.isArray(g.options) && g.options.length > 0;
      const hasOptionIds = Array.isArray(g.optionIds) && g.optionIds.length > 0;

      let rawOptions: Array<Record<string, unknown>>;

      if (hasOptions) {
        // Grupo manual do banco — já vem hidratado com options
        rawOptions = g.options!;
      } else if (hasOptionIds) {
        // ✅ FIX: Grupo do Smart Generator — hidratar a partir de allOptions usando optionIds
        rawOptions = g.optionIds!
          .map((optId) =>
            allOptions.find((opt) => String(opt.id) === String(optId))
          )
          .filter((opt): opt is Record<string, unknown> => Boolean(opt));
      } else {
        rawOptions = [];
      }

      const gId = String(g.id || g.groupId);
      // ✅ Preserva o customLabel do Smart Generator em vez de usar o nome do banco
      const gName = g.customLabel || g.name || g.group?.name || "Acompanhamento";

      const validOptions = rawOptions.map((opt) => ({
        ...opt,
        id: String(opt.id),
        name: String(opt.name || "Sem Nome"),
        groupId: gId,
        groupName: gName,
        priceModifier: Number(opt.priceModifier || opt.price_modifier || 0),
        weight: Number(opt.weight || opt.defaultGrammage || 100),
      } as AccompanimentOption));

      return {
        id: gId,
        name: gName,
        minSelections: Number(g.minSelections || g.group?.minSelections || 0),
        maxSelections: Number(g.maxSelections || g.group?.maxSelections || 1),
        options: validOptions,
      };
    }).filter((g) => g.options.length > 0);

  }, [slot, allOptions]);

  const formattedSelections = useMemo(() => {
    const selections: Record<string, AccompanimentOption[]> = {};
    if (!currentMealState?.selectedAccompaniments) return selections;

    currentMealState.selectedAccompaniments.forEach((acc) => {
      const gId = String(acc.groupId);
      if (!selections[gId]) selections[gId] = [];
      selections[gId].push(acc);
    });
    return selections;
  }, [currentMealState?.selectedAccompaniments]);

  return { accompanimentGroups, formattedSelections };
}