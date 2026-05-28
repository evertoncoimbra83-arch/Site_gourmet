import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { coupons } from "../../../drizzle/schema/index";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { safeNumber } from "../../lib/safe-parse";
import { AuditLogService } from "../../services/AuditLogService.js";
import {
  assertConfirmationReason,
  assertFiniteMoney,
  assertStrongConfirmation,
  assertSuperAdmin,
  operationalLimits,
} from "./operational-hardening.js";

// Tipagem para inserção no Drizzle
type CouponInsert = typeof coupons.$inferInsert;

const cleanDate = (val: unknown): Date | null => {
  if (!val || (typeof val === 'string' && val.trim() === '')) return null;
  const d = new Date(val as string | number | Date);
  return isNaN(d.getTime()) ? null : d;
};

const couponInputSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().trim(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive(),
  minOrderValue: z.coerce.number().nullish().default(0),
  maxDiscount: z.coerce.number().nullish(),
  usageLimit: z.coerce.number().int().nullish(),
  validFrom: z.any().nullish(),
  validUntil: z.any().nullish(),
  description: z.string().nullish(),
  isActive: z.boolean().optional().default(true),
  bannerColor: z.string().optional().default("#10b981"),
  logoUrl: z.string().nullish(),
  confirmationToken: z.string().optional(),
  confirmationReason: z.string().optional(),
}).passthrough();

function validateCouponLimits(input: {
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  confirmationToken?: string | null;
  confirmationReason?: string | null;
}, role: string | undefined, actionLabel: string) {
  if (input.discountValue === undefined || !input.discountType) return "warning";
  assertFiniteMoney(input.discountValue, "Desconto");

  if (input.discountType === "percentage") {
    if (input.discountValue > operationalLimits.couponMaxPercentage) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cupom percentual acima de ${operationalLimits.couponMaxPercentage}% esta bloqueado.`,
      });
    }
    if (input.discountValue > operationalLimits.couponCriticalPercentage) {
      assertSuperAdmin(role, actionLabel);
      assertStrongConfirmation(input, actionLabel);
      assertConfirmationReason(input, actionLabel);
      return "critical";
    }
  }

  if (input.discountType === "fixed") {
    if (input.discountValue > operationalLimits.couponMaxFixed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cupom fixo acima de R$ ${operationalLimits.couponMaxFixed} esta bloqueado.`,
      });
    }
    if (input.discountValue > operationalLimits.couponCriticalFixed) {
      assertSuperAdmin(role, actionLabel);
      assertStrongConfirmation(input, actionLabel);
      assertConfirmationReason(input, actionLabel);
      return "critical";
    }
  }

  return "warning";
}

export const adminCouponsRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    try {
      const result = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
      return result.map(c => ({
        ...c,
        id: String(c.id),
        discountValue: safeNumber(c.discountValue), 
        minOrderValue: safeNumber(c.minOrderValue),
        isActive: Boolean(c.isActive),
      }));
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar cupons." });
    }
  }),

  create: adminProcedure
    .input(couponInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const severity = validateCouponLimits(
        input,
        ctx.user?.role,
        "Criacao de cupom de alto impacto",
      );
      
      const [existing] = await db.select().from(coupons).where(eq(coupons.code, input.code));
      if (existing) throw new TRPCError({ code: "CONFLICT", message: `O cupom "${input.code}" já existe.` });

      try {
        const generatedId = String(Math.floor(Math.random() * 1000000000));

        const insertData: CouponInsert = {
          id: generatedId, 
          code: input.code,
          description: input.description,
          discountType: input.discountType,
          discountValue: input.discountValue.toFixed(2), 
          minOrderValue: input.minOrderValue?.toFixed(2) || "0.00",
          maxDiscount: input.maxDiscount?.toFixed(2) || null,
          usageLimit: input.usageLimit,
          isActive: Boolean(input.isActive),
          validFrom: cleanDate(input.validFrom),
          validUntil: cleanDate(input.validUntil),
          bannerColor: input.bannerColor,
          logoUrl: input.logoUrl || null,
          createdAt: new Date()
        };

        await db.insert(coupons).values(insertData);

        const actor = {
          userId: ctx.user?.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId
        };

        void AuditLogService.record({
          actor,
          module: "marketing",
          action: "CREATE_COUPON",
          severity,
          entityType: "coupons",
          entityId: generatedId,
          entityLabel: input.code,
          oldValues: null,
          newValues: {
            ...input,
            confirmationToken: undefined,
          }
        });

        return { success: true, message: `Cupom "${input.code}" criado!` };
      } catch (error: unknown) {
        console.error(error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro técnico ao gerar cupom." });
      }
    }),

  update: adminProcedure
    .input(z.object({ id: z.string() }).passthrough())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      // ✅ CORREÇÃO: Cast explícito para garantir que 'id' seja string e não 'unknown'
      const { id, ...data } = input as { id: string } & Record<string, unknown>;

      const [oldCoupon] = await db.select().from(coupons).where(eq(coupons.id, id));
      if (!oldCoupon) throw new TRPCError({ code: "NOT_FOUND", message: "Cupom não encontrado." });

      const nextDiscountType =
        data.discountType !== undefined
          ? (data.discountType as "percentage" | "fixed")
          : (oldCoupon.discountType as "percentage" | "fixed");
      const nextDiscountValue =
        data.discountValue !== undefined
          ? safeNumber(data.discountValue)
          : safeNumber(oldCoupon.discountValue);
      const severity = validateCouponLimits(
        {
          discountType: nextDiscountType,
          discountValue: nextDiscountValue,
          confirmationToken: data.confirmationToken as string | undefined,
          confirmationReason: data.confirmationReason as string | undefined,
        },
        ctx.user?.role,
        "Alteracao de cupom de alto impacto",
      );

      const updatePayload: Partial<CouponInsert> = { };
      const requireMoney = (value: unknown, label: string) => {
        const amount = safeNumber(value, Number.NaN);
        if (!Number.isFinite(amount) || amount < 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${label} invÃ¡lido.` });
        }
        return amount.toFixed(2);
      };
      
      if (data.code !== undefined) updatePayload.code = String(data.code).toUpperCase();
      if (data.discountValue !== undefined) updatePayload.discountValue = requireMoney(data.discountValue, "Desconto");
      if (data.isActive !== undefined) updatePayload.isActive = Boolean(data.isActive);
      if (data.description !== undefined) updatePayload.description = data.description as string;
      if (data.bannerColor !== undefined) updatePayload.bannerColor = data.bannerColor as string;
      if (data.logoUrl !== undefined) updatePayload.logoUrl = data.logoUrl as string;
      if (data.discountType !== undefined) updatePayload.discountType = data.discountType as "percentage" | "fixed";
      if (data.minOrderValue !== undefined) updatePayload.minOrderValue = requireMoney(data.minOrderValue, "Pedido mÃ­nimo");
      if (data.maxDiscount !== undefined) updatePayload.maxDiscount = data.maxDiscount ? requireMoney(data.maxDiscount, "Desconto mÃ¡ximo") : null;
      if (data.usageLimit !== undefined) updatePayload.usageLimit = data.usageLimit as number;
      if (data.validFrom !== undefined) updatePayload.validFrom = cleanDate(data.validFrom);
      if (data.validUntil !== undefined) updatePayload.validUntil = cleanDate(data.validUntil);

      try {
        await db.update(coupons).set(updatePayload).where(eq(coupons.id, id));
        
        const actor = {
          userId: ctx.user?.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId
        };

        void AuditLogService.record({
          actor,
          module: "marketing",
          action: "UPDATE_COUPON",
          severity,
          entityType: "coupons",
          entityId: id,
          entityLabel: oldCoupon.code,
          oldValues: oldCoupon,
          newValues: { ...oldCoupon, ...updatePayload }
        });

        return { success: true, message: "Cupom atualizado!" };
      } catch (error: unknown) {
        console.error(error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao salvar alterações." });
      }
    }),

  delete: adminProcedure
    .input(z.object({
      id: z.string(),
      confirmationToken: z.string().optional(),
      confirmationReason: z.string().optional(),
    })) 
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      try {
        assertStrongConfirmation(input, "Exclusao de cupom");
        assertConfirmationReason(input, "Exclusao de cupom");
        assertSuperAdmin(ctx.user?.role, "Exclusao de cupom");

        // ✅ Forçando a tipagem para o eq()
        const targetId = String(input.id);

        const [coupon] = await db.select().from(coupons).where(eq(coupons.id, targetId));
        if (!coupon) return { success: true };

        await db.delete(coupons).where(eq(coupons.id, targetId));

        const actor = {
          userId: ctx.user?.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId
        };

        void AuditLogService.record({
          actor,
          module: "marketing",
          action: "DELETE_COUPON",
          severity: "critical",
          entityType: "coupons",
          entityId: targetId,
          entityLabel: coupon.code,
          oldValues: coupon,
          newValues: null
        });

        return { success: true, message: "Cupom removido." };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar." });
      }
    }),
});
