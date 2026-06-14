// client/src/pages/nutri/components/PrescriptionDrawer/types.ts

import type {
    BuilderGroup as SharedBuilderGroup,
    BuilderMeal as SharedBuilderMeal,
    BuilderOption as SharedBuilderOption,
    BuilderPrescriptionState as SharedBuilderPrescriptionState,
} from "@shared/types/prescription";

export type BuilderOption = SharedBuilderOption;
export type BuilderGroup = SharedBuilderGroup;
export type BuilderMeal = SharedBuilderMeal;
export type BuilderPrescriptionState = SharedBuilderPrescriptionState;

export interface CatalogSizeInput {
    id: number;
    name?: string;
    price?: string | number;
    isDefault?: boolean;
    mainDishWeight?: string | number;
    weight?: string | number;
    noAccompanimentsMessage?: string | null;
    price_modifier?: string | number;
    groups?: CatalogAccompanimentGroupInput[] | null;
    accompanimentGroups?: CatalogAccompanimentGroupInput[] | null;
}

export interface CatalogAccompanimentGroupInput {
    id?: string | number | null;
    name?: string | null;
    minSelections?: string | number | null;
    maxSelections?: string | number | null;
    defaultGrammage?: string | number | null;
    isRequired?: boolean | null;
    options?: Array<{
        id: string | number;
        name: string;
        weight?: string | number | null;
        energyKcal?: string | number | null;
        proteins?: string | number | null;
        carbs?: string | number | null;
        fatTotal?: string | number | null;
        isActive?: boolean | null;
        isNoAccompaniment?: boolean | null;
        is_no_accompaniment?: boolean | null;
    }> | null;
}

export interface CatalogProductInput {
    id: string | number;
    name: string;
    basePrice?: string | number;
    base_price?: string | number;
    price?: string | number;
    energyKcal?: string | number;
    proteins?: string | number;
    carbs?: string | number;
    fatTotal?: string | number;
    sizes?: CatalogSizeInput[];
    availableSizes?: CatalogSizeInput[];
}

export interface SizeInput {
    id: number;
    name?: string;
    price?: string | number;
    price_modifier?: string | number;
    mainDishWeight?: string | number;
    weight?: string | number;
    noAccompanimentsMessage?: string | null;
    groups?: CatalogSizeInput["groups"];
    accompanimentGroups?: CatalogSizeInput["accompanimentGroups"];
}

export interface AccInput {
    id: string | number;
    name: string;
    weight?: string | number;
    energyKcal?: string | number;
    proteins?: string | number;
    carbs?: string | number;
    fatTotal?: string | number;
    isNoAccompaniment?: boolean | null;
    is_no_accompaniment?: boolean | null;
    sourceGroupId?: string | number | null;
    sourceGroupName?: string | null;
}