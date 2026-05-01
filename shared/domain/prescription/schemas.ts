// shared/domain/prescription/schemas.ts
import { z } from "zod";

export const prescriptionOptionSchema = z.object({
  id: z.string(),
  dishId: z.union([z.string(), z.number()]).nullish(),
  sizeId: z.union([z.string(), z.number()]).nullish(),
  name: z.string(),
  multiplier: z.number().default(1),
  isDefault: z.boolean().default(false),
  macros: z.object({
    kcal: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }).nullish(),
});

export const prescriptionGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  minSelections: z.number().min(0),
  maxSelections: z.number().min(1),
  isRequired: z.boolean().default(true),
  options: z.array(prescriptionOptionSchema),
});

export const prescriptionMealSchema = z.object({
  id: z.string(),
  mealName: z.string(),
  groups: z.array(prescriptionGroupSchema),
  notes: z.string().optional().default(""),
});

export const dietSnapshotSchema = z.object({
  planName: z.string().min(1, "Dê um nome ao plano"),
  meals: z.array(prescriptionMealSchema),
  discountPercentage: z.number().default(0),
  technicalInsight: z.string().optional().default(""),
  totalKcalTarget: z.number().optional(),
  expiresAt: z.string(),
  nutriId: z.union([z.string(), z.number()]),
});