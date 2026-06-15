import { z } from "zod";

export const settingsInputSchema = z.record(z.unknown());

export const keyInputSchema = z.object({
  key: z.string().optional(),
  configKey: z.string().optional(),
});

export const saveConfigInputSchema = z.object({
  key: z.string().optional(),
  value: z.string().optional(),
  configKey: z.string().optional(),
  configValue: z.string().optional(),
});

export const emergencyInputSchema = z.union([
  z.boolean(),
  z.object({
    enabled: z.boolean(),
    confirmationToken: z.string().optional(),
    confirmationReason: z.string().optional(),
  }),
]);

export const backupInputSchema = z.object({
  selectedTables: z.array(z.string()).optional(),
});

export const googleOAuthTestInputSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
});
