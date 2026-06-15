/**
 * 🎯 SHARED TYPES & UTILS - ZERO ANY POLICY
 * Local: client/src/_core/type/utils.ts
 */

import type React from "react";

// --- 1. OBJETOS DINÂMICOS & BÁSICOS ---
export type Id = string | number;

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

export type DynamicObject = Record<string, unknown>;

// --- 2. RESPOSTAS DE API ---
export interface ActionResponse {
  success: boolean;
  message?: string;
  code?: string;
}

export interface DataResponse<T> extends ActionResponse {
  data: T;
}

// --- 3. DOM & EVENTOS ---
export type ClickOutsideHandler = (event: MouseEvent | TouchEvent) => void;
export type RefObjectCustom<T> = React.RefObject<T | null>;

// --- 4. TRATAMENTO DE ERROS ---
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Ocorreu um erro inesperado.";
}

// --- 5. COMPONENTES COM CHILDREN ---
export type WithChildren<T = object> = T & {
  children?: React.ReactNode;
};

// --- 6. FORMATADORES ---
export const formatters = {
  currency: (value: number | string): string => {
    const amount = typeof value === "string" ? Number(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.isFinite(amount) ? amount : 0);
  },

  phone: (value: string | null | undefined): string => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    return digits.length === 11
      ? digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
      : digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  },
};

// ----------------------------------------------------
// --- 7. NUTRITION ---
// ----------------------------------------------------

export interface NutritionValues {
  energyKcal: number;
  energyKj?: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  fatSaturated?: number;
  fatTrans?: number;
  fiber?: number;
  sodium?: number;
  addedSugars?: number;
  calcium?: number;
  iron?: number;
  yieldWeight?: number;
}

// ----------------------------------------------------
// --- 8. TIPOS DO CARRINHO (ESTRUTURA COMPLETA) ---
// ----------------------------------------------------

export type PackageCustomOptions = {
  sizeName: unknown;
  _type: "package_custom";
  packageId: Id;
  meals: Array<{
    label: string;
    dishId: Id | null;
    dishName: string;
    accompaniments: Array<{
      id: Id;
      name: string;
      weight?: number;
      groupId?: Id;
      isNoAccompaniment?: boolean;
      is_no_accompaniment?: boolean;
      nutritionSkipped?: boolean;
    }>;
  }>;
};

export type ProductCustomOptions = {
  _type: "single";
  dishId: Id;
  selectedSizeId: Id;
  selectedSizeName: string;
  mainDishWeight?: number;
  hasNoAvailableAccompaniments?: boolean;
  noAccompanimentsMessage?: string;
  selectedAccs: Array<{
    id: Id;
    name: string;
    weight: number;
    groupId?: Id;
    groupName: string;
    isNoAccompaniment?: boolean;
    is_no_accompaniment?: boolean;
    nutritionSkipped?: boolean;
  }>;
};

export interface BaseCartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  meta?: Record<string, unknown>;
  applied_nutrition?: NutritionValues;
}

export type ProductCartItem = BaseCartItem & {
  type: "product";
  options?: ProductCustomOptions;
};

export type PackageCartItem = BaseCartItem & {
  type: "package";
  options: PackageCustomOptions;
};

export type CartItem = ProductCartItem | PackageCartItem;

// ----------------------------------------------------
// --- 9. HELPERS DE TIPAGEM (CLEAN - NO ANY) ---
// ----------------------------------------------------

type DistributiveOmit<T, K extends keyof T | (string & object)> = T extends unknown
  ? Omit<T, K & keyof T>
  : never;

/**
 * Entrada para a função addItem da Store.
 */
export type AddCartItemInput = DistributiveOmit<CartItem, "quantity">;
