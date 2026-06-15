import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { router, superAdminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { paymentMethods } from "../../../drizzle/schema/index.js";
import { AuditLogService } from "../../services/AuditLogService.js";
import {
  assertConfirmationReason,
  assertFiniteMoney,
  assertStrongConfirmation,
  operationalLimits,
} from "./operational-hardening.js";
import { assertCloudinaryStorageUrl } from "@shared/utils/image-url";

type PaymentMethodInsert = typeof paymentMethods.$inferInsert;

function validatePaymentDiscount(
  discount: number,
  input: { confirmationToken?: string | null; confirmationReason?: string | null },
  actionLabel: string,
) {
  assertFiniteMoney(discount, "Desconto do metodo de pagamento");
  if (discount > operationalLimits.paymentMaxDiscountPercentage) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Desconto de pagamento acima de ${operationalLimits.paymentMaxDiscountPercentage}% esta bloqueado.`,
    });
  }
  if (discount > operationalLimits.paymentCriticalDiscountPercentage) {
    assertStrongConfirmation(input, actionLabel);
    assertConfirmationReason(input, actionLabel);
    return "critical";
  }
  return "warning";
}

function requireCloudinaryLogoUrl(value: string | null | undefined) {
  try {
    return assertCloudinaryStorageUrl(value, "Logo do metodo de pagamento");
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        error instanceof Error
          ? error.message
          : "Logo do metodo de pagamento invalida.",
    });
  }
}

export const adminPaymentMethodsRouter = router({
  listAll: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(paymentMethods).orderBy(asc(paymentMethods.name));
  }),

  create: superAdminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        isActive: z.boolean().optional().default(true),
        brand_name: z.string().optional().nullable(),
        brand_logo_url: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        icon: z.string().optional().nullable(),
        discount_percentage: z.coerce.number().optional().default(0),
        confirmationToken: z.string().optional(),
        confirmationReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const severity = validatePaymentDiscount(
        input.discount_percentage,
        input,
        "Criacao de metodo de pagamento com desconto",
      );

      const payload: Record<string, unknown> = {
        name: input.name,
        isActive: input.isActive,
        brandName: input.brand_name,
        brandLogoUrl: requireCloudinaryLogoUrl(input.brand_logo_url),
        description: input.description,
        icon: input.icon,
        discountPercentage: String(input.discount_percentage),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [insertResult] = await db
        .insert(paymentMethods)
        .values(payload as PaymentMethodInsert);
      const insertId = insertResult?.insertId;

      if (!insertId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro operacional ao gerar o ID do registro no banco.",
        });
      }

      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId
      };

      void AuditLogService.record({
        actor,
        module: "payments",
        action: "CREATE_PAYMENT_METHOD",
        severity,
        entityType: "payment_methods",
        entityId: insertId,
        entityLabel: input.name,
        oldValues: null,
        newValues: {
          ...payload,
          confirmationReason: input.confirmationReason?.trim() || null,
        },
      });

      return {
        success: true,
        id: insertId,
        message: `Método "${input.name}" cadastrado!`,
      };
    }),

  update: superAdminProcedure
    .input(
      z.object({
        id: z.coerce.number(),
        name: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        brandName: z.string().optional().nullable(),
        brand_name: z.string().optional().nullable(),
        brandLogoUrl: z.string().optional().nullable(),
        brand_logo_url: z.string().optional().nullable(),
        icon: z.string().optional().nullable(),
        discountPercentage: z.coerce.number().optional().nullable(),
        discount_percentage: z.coerce.number().optional().nullable(),
        isActive: z.boolean().optional().nullable(),
        confirmationToken: z.string().optional(),
        confirmationReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const [oldPayment] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, String(input.id)))
        .limit(1);

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;

      const brandName = input.brandName ?? input.brand_name;
      if (brandName !== undefined) updateData.brandName = brandName;

      const brandLogo = input.brandLogoUrl ?? input.brand_logo_url;
      if (brandLogo !== undefined) updateData.brandLogoUrl = requireCloudinaryLogoUrl(brandLogo);

      if (input.icon !== undefined) updateData.icon = input.icon;

      const discount = input.discountPercentage ?? input.discount_percentage;
      let severity: "warning" | "critical" = "warning";
      if (discount !== undefined && discount !== null) {
        severity = validatePaymentDiscount(
          discount,
          input,
          "Alteracao de desconto em metodo de pagamento",
        );
        updateData.discountPercentage = String(discount);
      }

      if (input.isActive !== undefined && oldPayment?.isActive !== input.isActive) {
        assertStrongConfirmation(input, "Ativacao/desativacao de metodo de pagamento");
        assertConfirmationReason(input, "Ativacao/desativacao de metodo de pagamento");
        severity = "critical";
      }

      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db
        .update(paymentMethods)
        .set(updateData as Partial<PaymentMethodInsert>)
        .where(eq(paymentMethods.id, String(input.id)));

      if (oldPayment) {
        const actor = {
          userId: ctx.user?.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId
        };

        void AuditLogService.record({
          actor,
          module: "payments",
          action: "UPDATE_PAYMENT_METHOD",
          severity,
          entityType: "payment_methods",
          entityId: input.id,
          entityLabel: oldPayment.name,
          oldValues: oldPayment,
          newValues: { ...oldPayment, ...updateData }
        });

      }

      return {
        success: true,
        message: "Método atualizado com sucesso!",
      };
    }),

  delete: superAdminProcedure
    .input(z.object({
      id: z.coerce.number(),
      name: z.string().optional(),
      confirmationToken: z.string().optional(),
      confirmationReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertStrongConfirmation(input, "Exclusao de metodo de pagamento");
      assertConfirmationReason(input, "Exclusao de metodo de pagamento");

      const [oldPayment] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, String(input.id)))
        .limit(1);

      await db.delete(paymentMethods).where(eq(paymentMethods.id, String(input.id)));

      if (oldPayment) {
        const actor = {
          userId: ctx.user?.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId
        };

        void AuditLogService.record({
          actor,
          module: "payments",
          action: "DELETE_PAYMENT_METHOD",
          severity: "critical",
          entityType: "payment_methods",
          entityId: input.id,
          entityLabel: oldPayment.name,
          oldValues: oldPayment,
          newValues: null
        });

      }

      return {
        success: true,
        message: input.name ? `"${input.name}" removido.` : "Excluído com sucesso.",
      };
    }),
});
