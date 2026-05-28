import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { discountRules } from "../../../drizzle/schema/index";
import { AuditLogService } from "../../services/AuditLogService.js";
import {
    assertConfirmationReason,
    assertStrongConfirmation,
    assertSuperAdmin,
    operationalLimits,
} from "./operational-hardening.js";
// ✅ Removido import de discountRules (eslint: no-unused-vars)
import { 
    discountRuleInput, 
    listDiscountRules,
    createDiscountRule,
    updateDiscountRule,
    deleteDiscountRule
} from "../../discountRules"; 

const protectedDiscountRuleInput = discountRuleInput.extend({
    confirmationToken: z.string().optional(),
    confirmationReason: z.string().optional(),
});

function validateDiscountRule(input: z.infer<typeof protectedDiscountRuleInput>, role: string | undefined, label: string) {
    if (input.type === "percentage" && input.value > operationalLimits.couponMaxPercentage) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Regra percentual acima de ${operationalLimits.couponMaxPercentage}% esta bloqueada.` });
    }
    if (
        (input.type === "percentage" && input.value > operationalLimits.couponCriticalPercentage) ||
        (input.type === "fixed" && input.value > operationalLimits.couponCriticalFixed)
    ) {
        assertSuperAdmin(role, label);
        assertStrongConfirmation(input, label);
        assertConfirmationReason(input, label);
    }
}

/**
 * 🏷️ Roteador de Regras de Desconto (Admin)
 */
export const adminDiscountRulesRouter = router({
  
  list: adminProcedure.query(async () => {
    try {
      return await listDiscountRules();
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar regras de desconto.",
      });
    }
  }),

  create: adminProcedure
    .input(protectedDiscountRuleInput) 
    .mutation(async ({ ctx, input }) => {
      try {
        validateDiscountRule(input, ctx.user?.role, "Criacao de regra de desconto de alto impacto");
        const { confirmationToken, confirmationReason, ...data } = input;
        const result = await createDiscountRule(data);

        void AuditLogService.record({
            actor: {
                userId: ctx.user?.id,
                ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                requestId: (ctx.req as any)?.requestId,
            },
            module: "marketing",
            action: "CREATE_DISCOUNT_RULE",
            severity: "warning",
            entityType: "discount_rules",
            entityLabel: input.name,
            oldValues: null,
            newValues: { ...data, confirmationReason: confirmationReason?.trim() || null },
        });
        return {
          success: true,
          data: result,
          message: `Regra "${input.name}" criada com sucesso!`
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro ao criar regra";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  update: adminProcedure
    .input(
      protectedDiscountRuleInput.extend({ 
        id: z.coerce.number() 
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        validateDiscountRule(input, ctx.user?.role, "Alteracao de regra de desconto de alto impacto");
        /**
         * ✅ CORREÇÃO TS2339:
         * Se o seu 'discountRuleInput' já usa 'type' e 'value',
         * não precisamos tentar ler 'discountType'.
         * A desestruturação abaixo garante que passamos o objeto limpo para a função.
         */
        const db = await getDb();
        const [oldRule] = await db.select().from(discountRules).where(eq(discountRules.id, input.id)).limit(1);
        const { id, confirmationToken, confirmationReason, ...data } = input;

        // ✅ CORREÇÃO ESLint: Tipamos o data para evitar o 'any'
        const result = await updateDiscountRule(id, data as Parameters<typeof updateDiscountRule>[1]);

        void AuditLogService.record({
            actor: {
                userId: ctx.user?.id,
                ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                requestId: (ctx.req as any)?.requestId,
            },
            module: "marketing",
            action: "UPDATE_DISCOUNT_RULE",
            severity: "warning",
            entityType: "discount_rules",
            entityId: id,
            entityLabel: input.name,
            oldValues: oldRule || null,
            newValues: { ...data, confirmationReason: confirmationReason?.trim() || null },
        });
        
        return {
          success: true,
          data: result,
          message: `Regra de desconto "${input.name}" atualizada!`
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar regra";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  delete: adminProcedure
    .input(z.object({ 
        id: z.coerce.number(),
        name: z.string().optional(),
        confirmationToken: z.string().optional(),
        confirmationReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        assertStrongConfirmation(input, "Exclusao de regra de desconto");
        assertConfirmationReason(input, "Exclusao de regra de desconto");
        assertSuperAdmin(ctx.user?.role, "Exclusao de regra de desconto");
        const db = await getDb();
        const [oldRule] = await db.select().from(discountRules).where(eq(discountRules.id, input.id)).limit(1);
        await deleteDiscountRule(input.id);

        void AuditLogService.record({
            actor: {
                userId: ctx.user?.id,
                ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                requestId: (ctx.req as any)?.requestId,
            },
            module: "marketing",
            action: "DELETE_DISCOUNT_RULE",
            severity: "critical",
            entityType: "discount_rules",
            entityId: input.id,
            entityLabel: input.name || oldRule?.name,
            oldValues: oldRule || null,
            newValues: { confirmationReason: input.confirmationReason?.trim() },
        });
        return {
          success: true,
          message: input.name 
            ? `Regra "${input.name}" removida.` 
            : "Regra de desconto excluída com sucesso."
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao excluir a regra de desconto.",
        });
      }
    }),
});
