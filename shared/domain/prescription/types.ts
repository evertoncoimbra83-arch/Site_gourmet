// shared/domain/prescription/types.ts

/**
 * 🥗 Representa um item (prato ou acompanhamento) dentro de uma refeição
 */
export interface PrescriptionMealItem {
  id: string | number;
  name: string;
  qty: number;
  price: number;
  categoryId: number | string;
  sizeId?: number | string;
  nutrition?: Record<string, unknown>;
  image?: string;
}

/**
 * 🍎 Opção de alimento dentro de um grupo (usado no Builder/IA)
 */
export interface PrescriptionOption {
  id: string;
  dishId?: string | number | null;
  sizeId?: string | number | null;
  name: string;
  multiplier: number;
  isDefault: boolean;
  macros?: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

/**
 * 🧱 Grupo de substituição (ex: Proteínas, Carboidratos)
 */
export interface PrescriptionGroup {
  id: string;
  name: string; 
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  options: PrescriptionOption[];
}

/**
 * 🍱 Representação de uma refeição (Almoço, Jantar, etc.)
 */
export interface PrescriptionMeal {
  id: string;
  mealName: string;
  groups: PrescriptionGroup[];
  notes?: string;
  // ✅ Substituído 'any[]' pela interface de item de refeição
  dishes?: PrescriptionMealItem[]; 
  // ❌ Linha "price(price: any...)" deletada com sucesso!
}

/**
 * 🛡️ Resultado da validação de aderência à dieta
 */
export interface PrescriptionValidation {
  isValid: boolean;
  isExpired: boolean;
  violations: string[];
  message: string;
}

/**
 * 📋 Snapshot completo do Plano Alimentar (Persistência no DB)
 */
export interface DietSnapshot {
  planName: string;
  meals: PrescriptionMeal[];
  discountPercentage: number;
  generatedAt: string;
  expiresAt: string;
  nutriId: string | number;
  technicalInsight?: string;
  totalKcalTarget?: number;
}