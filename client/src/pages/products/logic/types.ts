// client/src/pages/products/logic/types.ts

export interface AccOption {
  id: string | number;
  name: string;
  priceModifier: number;
  groupName?: string;
  defaultGrammage?: number;
  groupId: string | number;
  iconKey?: string;
  categoryColor?: string;
}

export interface AccGroup {
  id: string | number;
  groupId?: string | number;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: AccOption[];
  processedOptions: AccOption[];
  defaultGrammage?: number;
}

export interface DishSize {
  id: string | number;
  name: string;
  priceModifier: number;
  main_dish_weight?: number;
  mainDishWeight?: number;
  accompanimentGroups: AccGroup[];
  displayOrder?: number;
}

export interface MappedDish {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  salePrice: number | null;
  showNutrition: boolean;
  sizes: DishSize[];
}