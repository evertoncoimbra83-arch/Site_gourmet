import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import * as AdminLoyalty from "../../admin-loyalty.js";
import { createDecipheriv, scryptSync } from "crypto";
import { logAction } from "../../db/lib/audit.js";

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
          points: Number(c.loyaltyBalance || 0),
          totalSpent: Number(c.totalSpent || 0)
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
      customerName: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await AdminLoyalty.addManualPoints(input.userId, input.points, input.reason);
      
      await logAction(ctx, "LOYALTY_MANUAL_ADJUST", "loyalty", {
        entityId: input.userId,
        new: { pontos: input.points, motivo: input.reason }
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
        points: Number(h.points || 0),
        pointsChange: Number(h.pointsChange || 0)
      }));
    }),

  update: adminProcedure
    .input(z.record(z.unknown()))
    .mutation(async ({ ctx, input }) => {
      const oldConfigs = await AdminLoyalty.getLoyaltyConfigs();
      const result = await AdminLoyalty.updateLoyaltyConfigs(input);

      await logAction(ctx, "UPDATE_LOYALTY_RULES", "loyalty", {
        entityId: "global_configs",
        old: oldConfigs || {},
        new: input
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
      transactionIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await AdminLoyalty.deleteTransactions(input.userId, input.transactionIds);

      await logAction(ctx, "LOYALTY_BULK_DELETE", "loyalty", {
        entityId: input.userId,
        new: { count: input.transactionIds.length, transactionIds: input.transactionIds }
      });

      return {
        success: true,
        data: result,
        message: `${input.transactionIds.length} transação(ões) estornada(s) com sucesso.`
      };
    }),
});