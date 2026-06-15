import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import * as AdminLoyalty from "../../admin-loyalty.js";
import { createDecipheriv, scryptSync } from "crypto";
import { AuditLogService } from "../../services/AuditLogService.js";
import {
  assertConfirmationReason,
  assertStrongConfirmation,
  assertSuperAdmin,
  operationalLimits,
} from "./operational-hardening.js";
import { safeNumber } from "../../lib/safe-parse.js";

// 🔐 LÓGICA DE SEGURANÇA (PII)
const ENCRYPTION_KEY_RAW = process.env.DB_ENCRYPTION_KEY || "fallback-key-de-seguranca";
const ALGORITHM = "aes-256-gcm";

function decryptManual(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;
  if (!text.includes(":")) return text;

  try {
    const parts = text.split(":");
    if (parts.length !== 3) return text;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = scryptSync(ENCRYPTION_KEY_RAW, "static-salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return text.startsWith("iv:") ? "Dados Protegidos" : text;
  }
}

// --- INTERFACES PARA TIPAGEM SEGURA ---
interface LoyaltyCustomerRaw {
  id: number | string;
  name: string | null;
  email: string | null;
  loyaltyBalance?: number | string;
  totalSpent?: number | string;
}

interface HistoryItemRaw {
  id: number | string;
  points: number | string;
  type: string;
  reason: string | null;
  description: string | null;
  createdAt: Date | string | null;
  pointsChange: number | string;
}

function getRequestId(req: unknown): string | undefined {
  if (typeof req !== "object" || req === null) return undefined;
  const requestId = Reflect.get(req, "requestId");
  return typeof requestId === "string" ? requestId : undefined;
}

/**
 * 🏆 Roteador de Fidelidade do Gourmet Saudável
 * ✅ NOME CORRETO DA CONSTANTE: adminLoyaltySettingsRouter
 */
export const adminLoyaltySettingsRouter = router({

  get: adminProcedure.query(async () => {
    const configs = await AdminLoyalty.getLoyaltyConfigs();
    return configs || {};
  }),

  getCustomers: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().nullish()
    }).optional())
    .query(async ({ input }) => {
      const searchTerm = input?.search?.trim() || undefined;

      const result = await AdminLoyalty.getCustomersLoyalty({
        page: input?.page ?? 1,
        limit: input?.limit ?? 10,
        search: searchTerm
      });

      if (!result || !result.items) {
        return { items: [], total: 0, totalPages: 0 };
      }

      const mappedItems = result.items.map((c: LoyaltyCustomerRaw) => {
        if (!c) return null;

        return {
          ...c,
          id: String(c.id),
          name: decryptManual(c.name) || c.email || "Cliente s/ Nome",
          points: safeNumber(c.loyaltyBalance),
          totalSpent: safeNumber(c.totalSpent)
        };
      }).filter((i): i is NonNullable<typeof i> => i !== null);

      return {
        items: mappedItems,
        total: result.total || 0,
        totalPages: result.totalPages || 1
      };
    }),

  addManualPoints: adminProcedure
    .input(z.object({
      userId: z.string(),
      points: z.coerce.number(),
      reason: z.string().min(1, "O motivo é obrigatório"),
      customerName: z.string().optional(),
      confirmationToken: z.string().optional(),
      confirmationReason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const absolutePoints = Math.abs(input.points);
      if (absolutePoints >= operationalLimits.loyaltyCriticalPoints) {
        assertStrongConfirmation(input, "Ajuste manual de fidelidade");
        assertConfirmationReason(input, "Ajuste manual de fidelidade");
      }
      if (absolutePoints >= operationalLimits.loyaltySuperAdminPoints) {
        assertSuperAdmin(ctx.user?.role, "Ajuste manual acima do limite operacional");
      }

      const result = await AdminLoyalty.addManualPoints(input.userId, input.points, input.reason);

      const severity = absolutePoints >= operationalLimits.loyaltyCriticalPoints ? "critical" : "warning";
      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: getRequestId(ctx.req)
      };

      void AuditLogService.record({
        actor,
        module: "loyalty",
        action: "LOYALTY_MANUAL_ADJUST",
        severity,
        entityType: "loyalty",
        entityId: input.userId,
        entityLabel: input.customerName || `Cliente ${input.userId}`,
        oldValues: null,
        newValues: {
          pontos: input.points,
          motivo: input.reason,
          confirmationReason: input.confirmationReason?.trim() || null,
        }
      });

      const actionText = input.points >= 0 ? "Adicionados" : "Removidos";
      return {
        success: true,
        data: result,
        message: `${actionText} ${Math.abs(input.points)} pontos ${input.customerName ? `para ${input.customerName}` : 'ao cliente'}.`
      };
    }),

  getCustomerHistory: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const history = await AdminLoyalty.getCustomerHistory(input.userId);

      return (history || []).map((h: HistoryItemRaw) => ({
        ...h,
        id: String(h.id),
        points: safeNumber(h.points),
        pointsChange: safeNumber(h.pointsChange)
      }));
    }),

  update: adminProcedure
    .input(z.record(z.unknown()))
    .mutation(async ({ ctx, input }) => {
      const confirmationInput = {
        confirmationToken: input.confirmationToken as string | undefined,
        confirmationReason: input.confirmationReason as string | undefined,
      };
      assertStrongConfirmation(confirmationInput, "Alteracao de regras de fidelidade");
      assertConfirmationReason(confirmationInput, "Alteracao de regras de fidelidade");

      const sanitizedInput = { ...input };
      delete sanitizedInput.confirmationToken;
      delete sanitizedInput.confirmationReason;

      const oldConfigs = await AdminLoyalty.getLoyaltyConfigs();
      const result = await AdminLoyalty.updateLoyaltyConfigs(sanitizedInput);

      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: getRequestId(ctx.req)
      };

      void AuditLogService.record({
        actor,
        module: "loyalty",
        action: "UPDATE_LOYALTY_RULES",
        severity: "warning",
        entityType: "loyalty",
        entityId: "global_configs",
        entityLabel: "Regras de Fidelidade",
        oldValues: oldConfigs || {},
        newValues: sanitizedInput
      });

      return {
        success: true,
        data: result,
        message: "Regras do Programa de Fidelidade atualizadas!"
      };
    }),

  deleteTransactions: adminProcedure
    .input(z.object({
      userId: z.string(),
      transactionIds: z.array(z.string()),
      confirmationToken: z.string().optional(),
      confirmationReason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      assertStrongConfirmation(input, "Exclusao de transacoes de fidelidade");
      assertConfirmationReason(input, "Exclusao de transacoes de fidelidade");
      assertSuperAdmin(ctx.user?.role, "Exclusao de transacoes de fidelidade");

      const result = await AdminLoyalty.deleteTransactions(input.userId, input.transactionIds);

      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: getRequestId(ctx.req)
      };

      void AuditLogService.record({
        actor,
        module: "loyalty",
        action: "LOYALTY_BULK_DELETE",
        severity: "critical",
        entityType: "loyalty",
        entityId: input.userId,
        entityLabel: `Transações estornadas do usuário ${input.userId}`,
        oldValues: null,
        newValues: {
          count: input.transactionIds.length,
          transactionIds: input.transactionIds,
          confirmationReason: input.confirmationReason?.trim(),
        }
      });

      return {
        success: true,
        data: result,
        message: `${input.transactionIds.length} transação(ões) estornada(s) com sucesso.`
      };
    }),
});
