import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, superAdminProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { shippingZones, shippingSettings } from "../../../../drizzle/schema/index.js";
import { eq, asc, or, notLike, isNull, and, like } from "drizzle-orm";
import { AuditLogService } from "../../../services/AuditLogService.js";
import {
  assertConfirmationReason,
  assertFiniteMoney,
  assertStrongConfirmation,
  operationalLimits,
} from "../operational-hardening.js";

const shippingRuleSchema = z.object({
  id: z.number().optional(), 
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  active: z.boolean().default(true),
  type: z.enum(["zipcode", "polygon", "circle"]),
  cepStart: z.string().optional().nullable(),
  cepEnd: z.string().optional().nullable(),
  polygonCoords: z.string().optional().nullable(),
  storeSlug: z.string().optional().default("default"),
  confirmationToken: z.string().optional(),
  confirmationReason: z.string().optional(),
});

function validateShippingCost(
  price: number,
  input: { confirmationToken?: string | null; confirmationReason?: string | null },
  actionLabel: string,
) {
  assertFiniteMoney(price, "Frete");
  if (price > operationalLimits.shippingMaxCost) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Frete acima de R$ ${operationalLimits.shippingMaxCost} esta bloqueado.`,
    });
  }
  if (price > operationalLimits.shippingCriticalCost) {
    assertStrongConfirmation(input, actionLabel);
    assertConfirmationReason(input, actionLabel);
    return "critical";
  }
  return "warning";
}

export const shippingRulesRouter = router({
  
  getSettings: superAdminProcedure.query(async () => {
    const db = await getDb();
    const [s] = await db.select().from(shippingSettings).limit(1);
    return s || { 
      pickupEnabled: false, 
      pickupLabel: "Retirada no Balcão", 
      pickupInstruction: "" 
    };
  }),

  updateSettings: superAdminProcedure
    .input(z.object({
      pickupEnabled: z.boolean().optional(),
      pickupLabel: z.string().optional(),
      pickupInstruction: z.string().optional(),
      confirmationToken: z.string().optional(),
      confirmationReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const existing = await db.select().from(shippingSettings).limit(1);
      assertStrongConfirmation(input, "Alteracao de configuracoes de retirada/frete");
      assertConfirmationReason(input, "Alteracao de configuracoes de retirada/frete");
      const { confirmationToken, confirmationReason, ...settingsInput } = input;

      if (existing.length === 0) {
        await db.insert(shippingSettings).values({
          pickupEnabled: settingsInput.pickupEnabled ?? false,
          pickupLabel: input.pickupLabel ?? "Retirada no Balcão",
          pickupInstruction: settingsInput.pickupInstruction ?? "",
        });

        const actor = {
          userId: ctx.user?.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId
        };

        void AuditLogService.record({
          actor,
          module: "shipping",
          action: "CREATE_SHIPPING_SETTINGS",
          severity: "critical",
          entityType: "shipping_settings",
          entityId: "global",
          entityLabel: "Configurações de Retirada/Entrega",
          oldValues: null,
          newValues: {
            ...settingsInput,
            confirmationToken: undefined,
            confirmationReason,
          }
        });

      } else {
        const oldSettings = existing[0];
        await db.update(shippingSettings)
          .set({ ...settingsInput, updatedAt: new Date() })
          .where(eq(shippingSettings.id, oldSettings.id));

        const actor = {
          userId: ctx.user?.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId
        };

        void AuditLogService.record({
          actor,
          module: "shipping",
          action: "UPDATE_SHIPPING_SETTINGS",
          severity: "critical",
          entityType: "shipping_settings",
          entityId: oldSettings.id,
          entityLabel: "Configurações de Retirada/Entrega",
          oldValues: oldSettings,
          newValues: {
            ...oldSettings,
            ...settingsInput,
            confirmationToken: undefined,
            confirmationReason,
          }
        });

      }
      return { success: true };
    }),

  /**
   * ✅ BUSCA REGRAS (Flexível: Loja Selecionada + Default)
   */
  getRules: superAdminProcedure
    .input(z.object({ storeSlug: z.string().optional().default("default") }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      return await db.select({
        id: shippingZones.id,
        name: shippingZones.name,
        description: shippingZones.description,
        type: shippingZones.type,
        zipCodeStart: shippingZones.zipCodeStart,
        zipCodeEnd: shippingZones.zipCodeEnd,
        shippingCost: shippingZones.shippingCost,
        polygonCoords: shippingZones.polygonCoords,
        isActive: shippingZones.isActive,
        estimatedDays: shippingZones.estimatedDays,
        storeSlug: shippingZones.storeSlug,
      })
      .from(shippingZones)
      .where(
        and(
          // 🟢 Filtro de Unidade: Carrega a selecionada OU registros 'default'
          or(
            eq(shippingZones.storeSlug, input.storeSlug),
            eq(shippingZones.storeSlug, 'default'),
            isNull(shippingZones.storeSlug)
          ),
          // Filtro de Descrição: Evita poluir com CEPs individuais do radar
          or(
            eq(shippingZones.description, 'Regra Mestra'),
            isNull(shippingZones.description),
            notLike(shippingZones.description, 'via polígono:%')
          )
        )
      )
      .orderBy(asc(shippingZones.name));
    }),

  /**
   * ✅ UPSERT: Cria ou Atualiza
   */
  createRule: superAdminProcedure
    .input(shippingRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const severity = validateShippingCost(
        input.price,
        input,
        input.id ? "Alteracao de regra de frete" : "Criacao de regra de frete",
      );
      
      const payload = {
        name: input.name,
        type: input.type,
        shippingCost: String(input.price), 
        isActive: input.active, 
        zipCodeStart: input.type === "zipcode" ? (input.cepStart || "00000000") : "00000000",
        zipCodeEnd: input.type === "zipcode" ? (input.cepEnd || "99999999") : "99999999",
        polygonCoords: input.polygonCoords,
        description: "Regra Mestra",
        storeSlug: input.storeSlug,
      };

      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId
      };

      if (input.id) {
        const [oldRule] = await db.select().from(shippingZones).where(eq(shippingZones.id, input.id)).limit(1);

        await db.update(shippingZones)
          .set({ ...payload, updatedAt: new Date() })
          .where(eq(shippingZones.id, input.id));

        if (oldRule) {
          void AuditLogService.record({
            actor,
            module: "shipping",
            action: "UPDATE_SHIPPING_RULE",
            severity,
            entityType: "shipping_zones",
            entityId: input.id,
            entityLabel: oldRule.name,
            oldValues: oldRule,
            newValues: { ...oldRule, ...payload }
          });

        }
      } else {
        const [res] = await db.insert(shippingZones).values(payload);
        const insertId = res?.insertId;

        void AuditLogService.record({
          actor,
          module: "shipping",
          action: "CREATE_SHIPPING_RULE",
            severity,
          entityType: "shipping_zones",
          entityId: insertId || null,
          entityLabel: input.name,
          oldValues: null,
          newValues: payload
        });

      }
      
      return { success: true };
    }),

  deleteRule: superAdminProcedure
    .input(z.object({
      id: z.number(),
      confirmationToken: z.string().optional(),
      confirmationReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertStrongConfirmation(input, "Exclusao de regra de frete");
      assertConfirmationReason(input, "Exclusao de regra de frete");
      
      const [rule] = await db.select()
        .from(shippingZones)
        .where(eq(shippingZones.id, input.id))
        .limit(1);
      
      if (!rule) return { success: false, error: "Regra não encontrada" };

      await db.delete(shippingZones).where(eq(shippingZones.id, input.id));
      await db.delete(shippingZones)
        .where(like(shippingZones.description, `via polígono: ${rule.name}%`));

      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId
      };

      void AuditLogService.record({
        actor,
        module: "shipping",
        action: "DELETE_SHIPPING_RULE",
        severity: "critical",
        entityType: "shipping_zones",
        entityId: input.id,
        entityLabel: rule.name,
        oldValues: rule,
        newValues: null
      });

      return { success: true };
    }),
});
