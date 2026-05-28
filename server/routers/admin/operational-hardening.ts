import { TRPCError } from "@trpc/server";

type Role = "super_admin" | "admin" | "operator" | string | undefined | null;

export const STRONG_CONFIRMATION_TOKEN = "CONFIRMAR";

export const operationalLimits = {
  loyaltyCriticalPoints: 1000,
  loyaltySuperAdminPoints: 5000,
  couponCriticalPercentage: 40,
  couponMaxPercentage: 70,
  couponCriticalFixed: 300,
  couponMaxFixed: 1000,
  paymentCriticalDiscountPercentage: 10,
  paymentMaxDiscountPercentage: 30,
  shippingCriticalCost: 100,
  shippingMaxCost: 500,
  orderCriticalDiscountRatio: 0.3,
  orderMaxDiscountRatio: 0.8,
  orderCriticalShippingCost: 150,
  orderMaxShippingCost: 500,
} as const;

export const confirmationSchema = {
  confirmationToken: undefined as string | undefined,
  confirmationReason: undefined as string | undefined,
};

export type ConfirmationInput = {
  confirmationToken?: string | null;
  confirmationReason?: string | null;
};

export function assertStrongConfirmation(
  input: ConfirmationInput,
  actionLabel: string,
) {
  if (input.confirmationToken !== STRONG_CONFIRMATION_TOKEN) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${actionLabel}: digite ${STRONG_CONFIRMATION_TOKEN} para confirmar esta acao critica.`,
    });
  }
}

export function assertConfirmationReason(
  input: ConfirmationInput,
  actionLabel: string,
) {
  const reason = input.confirmationReason?.trim();
  if (!reason || reason.length < 8) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${actionLabel}: informe uma justificativa operacional com pelo menos 8 caracteres.`,
    });
  }
}

export function assertSuperAdmin(role: Role, actionLabel: string) {
  if (role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${actionLabel}: somente super_admin pode executar esta acao critica.`,
    });
  }
}

export function assertFiniteMoney(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label} invalido.`,
    });
  }
}
