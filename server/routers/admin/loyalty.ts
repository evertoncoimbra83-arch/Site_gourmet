import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import * as AdminLoyalty from "../../admin-loyalty.js";
import { createDecipheriv, scryptSync } from "crypto";
import { logAction } from "../../db/lib/audit.js";

// ============================================================================
// 🔐 LÓGICA DE SEGURANÇA (PII)
// ============================================================================
const ENCRYPTION_KEY_RAW = process.env.DB_ENCRYPTION_KEY || "fallback-key-de-seguranca";
const ALGORITHM = "aes-256-gcm";

function decryptManual(text: string | null | undefined): string | null {
  if (!text || !text.includes(":")) return text || null;
  try {
    const [ivHex, authTagHex, encryptedHex] = text.split(":");
    const key = scryptSync(ENCRYPTION_KEY_RAW, "static-salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return "Erro na descriptografia";
  }
}

/**
 * 👑 Roteador de Fidelidade (Admin)
 */
export const adminLoyaltySettingsRouter = router({
  
  // ✅ BUSCA CONFIGURAÇÕES GLOBAIS (Regras do Clube)
  get: adminProcedure.query(async () => {
    return await AdminLoyalty.getLoyaltyConfigs();
  }),

  // ✅ BUSCA LISTAGEM DE CLIENTES (Saldos e Gastos Reais)
  getCustomers: adminProcedure
    .input(z.object({ 
      page: z.number().default(1), 
      limit: z.number().default(10), 
      search: z.string().nullish() 
    }).optional())
    .query(async ({ input }) => {
      const result = await AdminLoyalty.getCustomersLoyalty({ 
        page: input?.page ?? 1, 
        limit: input?.limit ?? 10, 
        search: input?.search || undefined 
      });

      return {
        ...result,
        items: result.items.map((c: any) => ({
          ...c,
          id: String(c.id),
          name: decryptManual(c.name) || c.email || "Cliente s/ Nome",
          // Já mapeado como 'points' e 'totalSpent' na lógica
          points: c.points, 
          totalSpent: c.totalSpent
        }))
      };
    }),
  // ✅ AJUSTE MANUAL DE PONTOS
  addManualPoints: adminProcedure
    .input(z.object({ 
      userId: z.string(), 
      points: z.coerce.number(), 
      reason: z.string().min(1, "O motivo é obrigatório") 
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await AdminLoyalty.addManualPoints(input.userId, input.points, input.reason);
      
      // Auditoria: Registra quem deu os pontos e o motivo
      await logAction(ctx, "LOYALTY_MANUAL_ADJUST", "loyalty", {
        entityId: input.userId,
        new: { pontos: input.points, motivo: input.reason }
      });

      return result;
    }),
  
  // ✅ ATUALIZAR REGRAS DE PONTUAÇÃO E RESGATE
  update: adminProcedure
    .input(z.any())
    .mutation(async ({ ctx, input }) => {
      const oldConfigs = await AdminLoyalty.getLoyaltyConfigs();
      const result = await AdminLoyalty.updateLoyaltyConfigs(input);

      await logAction(ctx, "UPDATE_LOYALTY_RULES", "loyalty", {
        entityId: "global_configs",
        old: oldConfigs,
        new: input
      });

      return result;
    }),
  
  // ✅ HISTÓRICO INDIVIDUAL (EXTRATO)
  getCustomerHistory: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const history = await AdminLoyalty.getCustomerHistory(input.userId);
      return history.map((h: any) => ({
        ...h,
        id: String(h.id),
        // Normaliza o campo points para o extrato
        points: Number(h.points || h.pointsChange || 0)
      }));
    }),
});