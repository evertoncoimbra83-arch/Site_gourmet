// client/src/pages/nutri/components/PrescriptionDrawer/utils/builder-helpers.ts

import { safeInteger } from "@/lib/safe-parse";
import { selectDefaultAccompanimentsForNutri } from "@shared/domain/nutrition/nutri-default-accompaniments";
import type { CatalogSizeInput, SizeInput, CatalogProductInput, CatalogAccompanimentGroupInput, AccInput } from "../../types";

export const getSizeGroups = (size?: SizeInput | CatalogSizeInput | null): CatalogAccompanimentGroupInput[] => {
    if (!size) return [];

    const rawGroups = size.accompanimentGroups ?? size.groups ?? [];
    if (!Array.isArray(rawGroups)) return [];

    const seenIds = new Set<string | number>();
    return rawGroups.filter((group) => {
        if (!group || !group.id) return false;
        if (seenIds.has(group.id)) return false;
        seenIds.add(group.id);
        return true;
    });
};

export const getProductSizes = (product: CatalogProductInput): CatalogSizeInput[] => {
    if (Array.isArray(product.availableSizes) && product.availableSizes.length > 0) {
        return product.availableSizes;
    }
    return Array.isArray(product.sizes) ? product.sizes : [];
};

export const getMainDishWeightFromSize = (size?: SizeInput | CatalogSizeInput | null): number => {
    const value = Number(size?.mainDishWeight ?? size?.weight);
    return Number.isFinite(value) && value > 0 ? value : 0;
};

export const getAllowedAccompanimentIdsForSize = (size?: SizeInput | CatalogSizeInput | null): Set<string> =>
    new Set(
        getSizeGroups(size)
            .flatMap((group) => group?.options || [])
            .map((option) => String(option.id)),
    );

// 🚀 CORREÇÃO CIRÚRGICA: Agora aceita o ID do grupo explicitamente para matar a adivinhação errada
export const getGroupForAccompaniment = (
    size: SizeInput | CatalogSizeInput | null | undefined,
    acc: AccInput,
    explicitGroupId?: string | number | null
): CatalogAccompanimentGroupInput | undefined => {
    const sizeGroups = getSizeGroups(size);

    // Se o clique passou de qual grupo veio (ou o próprio item já guardava), usa na hora
    const targetGroupId = explicitGroupId ?? acc.sourceGroupId;
    if (targetGroupId) {
        const foundDirect = sizeGroups.find(g => String(g.id) === String(targetGroupId));
        if (foundDirect) return foundDirect;
    }

    // Fallback seguro caso seja um item legado sem mapeamento de grupo
    return sizeGroups.find((group) =>
        (group.options || []).some((option) => String(option.id) === String(acc.id)),
    );
};

export const mapDefaultAccompaniments = (groups: CatalogAccompanimentGroupInput[]) => {
    const result = selectDefaultAccompanimentsForNutri({
        groups,
        minFallback: 0,
        ignoreNoAccompaniment: true,
    });

    return {
        ...result,
        selectedAccompaniments: result.selectedAccompaniments.map((acc, index) => ({
            id: Number.isFinite(Number(acc.id)) ? Number(acc.id) : acc.id,
            name: acc.name,
            weight: Number(acc.weight || 100),
            isBase: index === 0,
            energyKcal: Number(acc.energyKcal || 0),
            proteins: Number(acc.proteins || 0),
            carbs: Number(acc.carbs || 0),
            fatTotal: Number(acc.fatTotal || 0),
            isNoAccompaniment: Boolean(acc.isNoAccompaniment ?? acc.is_no_accompaniment),
            is_no_accompaniment: Boolean(acc.isNoAccompaniment ?? acc.is_no_accompaniment),
            sourceGroupId: acc.sourceGroupId ? String(acc.sourceGroupId) : null,
            sourceGroupName: acc.sourceGroupName,
        })),
    };
};