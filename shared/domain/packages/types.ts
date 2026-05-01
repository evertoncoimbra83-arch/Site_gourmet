// shared/domain/packages/types.ts

export interface PackageSelection {
  packageId: number | string;
  itemsCount: number;
  maxItems: number;
  minItems: number;
}

export interface PackageValidationResult {
  isValid: boolean;
  remaining: number;
  isOverLimit: boolean;
  message: string;
  status: "pending" | "complete" | "error";
}