import { safeNumber } from "../../lib/safe-parse";

/**
 * ✅ Interface de busca - ÚNICA FONTE DA VERDADE
 */
export interface GetPaginatedDishesParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: number;
  showInactive?: boolean;
}

// ✅ Tipo para itens da Ficha Técnica (Snapshot Nutricional)
export type DishCompositionItem = {
  id?: number;
  ingredientName: string;
  name: string; 
  quantity: number;
  
  // Campos Nutricionais (Números para cálculos matemáticos)
  energyKcal: number;
  energyKj: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  fatSaturated: number;
  fatTrans: number;
  fiber: number;
  sodium: number;
  isFound?: boolean; 
};

export type DishSize = {
  id: number;
  name: string;
  priceModifier: number;
  isActive: boolean;
  weight?: string | null;
  displayOrder?: number;
};

/**
 * ✅ Tipo Principal do Prato (DTO para o Frontend)
 */
export type AdminDish = {
  id: number; 
  name: string;
  price: number; 
  salePrice: number | null; 
  categoryId: number | null; 
  isActive: boolean;
  categoryName?: string | null;
  description?: string | null;
  ingredients?: string | null; 
  imageUrl?: string | null;
  slug?: string;

  // Campos Nutricionais Consolidados
  energyKcal: number;
  energyKj: number;
  proteins: string;
  carbs: string;
  fatTotal: string;
  fatSaturated: string;
  fatTrans: string;
  fiber: string;
  sodium: string;

  showNutrition: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  updatedAt?: Date | null;
  
  sizes?: DishSize[];
  composition?: DishCompositionItem[];
};

/**
 * ✅ Mapeador de Linhas do Banco para o Objeto Admin
 * Substituído 'any' por 'Record<string, unknown>' para segurança.
 */
export function mapDishRowToAdmin(row: Record<string, unknown>): AdminDish {
  if (!row) return {} as AdminDish;

  const toDec = (val: unknown) => {
    if (val === null || val === undefined || val === "") return "0.00";
    return safeNumber(val).toFixed(2);
  };

  return {
    ...row,
    id: safeNumber(row.id),
    price: safeNumber(row.price),
    salePrice: row.salePrice ? safeNumber(row.salePrice) : null,
    categoryId: row.categoryId ? safeNumber(row.categoryId) : null,
    
    isActive: row.isActive === 1 || row.isActive === true || String(row.isActive) === "true",
    categoryName: (row.categoryName as string) ?? "Sem Categoria",
    
    energyKcal: safeNumber(row.energyKcal ?? row.energy_kcal ?? row.calories),
    energyKj: safeNumber(row.energyKj ?? row.energy_kj),
    
    proteins: toDec(row.proteins ?? row.protein), 
    carbs: toDec(row.carbs ?? row.carbohydrates),
    fatTotal: toDec(row.fatTotal ?? row.fat_total ?? row.fats),
    fatSaturated: toDec(row.fatSaturated ?? row.fat_saturated),
    fatTrans: toDec(row.fatTrans ?? row.fat_trans),
    fiber: toDec(row.fiber ?? row.fiber_alimentar),
    sodium: toDec(row.sodium ?? row.sodio),
    
    showNutrition: Boolean(row.showNutrition),
    isVegetarian: Boolean(row.isVegetarian),
    isGlutenFree: Boolean(row.isGlutenFree),
    isLactoseFree: Boolean(row.isLactoseFree),
  } as AdminDish;
}

/**
 * ✅ Utilitários de Formatação
 */
export function toPriceString(price: unknown): string | null {
    if (price === undefined || price === null || price === "") return null;
    // ✅ Alterado para 'const' e tipagem segura (Resolve prefer-const)
    const normalized = typeof price === "string" ? price.replace(",", ".") : price;
    const num = safeNumber(normalized, Number.NaN);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

export function generateSlug(name: string): string {
    const base = name || "dish";
    const cleanName = base.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9\s-]/g, '') 
        .replace(/\s+/g, '-');    
    return `${cleanName}-${Math.random().toString(36).substring(2, 5)}`; 
}
