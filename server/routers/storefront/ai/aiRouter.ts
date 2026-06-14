// server/routers/storefront/ai/aiRouter.ts

import { z } from "zod";
import {
  router,
  protectedProcedure,
  createRateLimitMiddleware,
} from "../../../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../../db.js";
import { agentRuns, nutriScansTemp, users } from "../../../../drizzle/schema/index.js"; // Adicionado 'users'
import { eq, desc, and, sql } from "drizzle-orm"; // Adicionado 'sql'
import crypto from "crypto";
import { addPrescriptionToQueue } from "../../../queues/nutriQueue.js"; 
import { AiExpertService } from "./AiExpertService.js";
import {
  assertBusinessGuardrails,
  ensureSafeAiResult,
  sanitizeTextForStorage,
  validateAiFileBase64,
  validateAiTextInput,
} from "../../../lib/ai-safety.js";

export const aiRouter = router({
  /**
   * 🎫 BUSCAR SALDO DE CRÉDITOS
   */
  getAiStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const [user] = await db
        .select({ aiCredits: users.aiCredits, role: users.role })
        .from(users)
        .where(eq(users.id, ctx.user.id));

      return { 
        credits: user?.aiCredits ?? 0,
        isAdmin: user?.role === "admin"
      };
    }),

  /**
   * 🔍 LISTAR SCANS DO USUÁRIO
   */
  getUserScans: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      return await db
        .select({
          id: nutriScansTemp.id,
          status: nutriScansTemp.status,
          createdAt: nutriScansTemp.createdAt,
          rawText: nutriScansTemp.rawText,
        })
        .from(nutriScansTemp)
        .where(eq(nutriScansTemp.userId, userId))
        .orderBy(desc(nutriScansTemp.createdAt))
        .limit(50);
    }),

  /**
   * 🚀 DISPARADOR DE INTELIGÊNCIA (Com consumo de Token)
   */
  enqueueTask: protectedProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "ai-enqueue",
        limit: 8,
        windowMs: 10 * 60 * 1000,
      }),
    )
    .input(z.object({
      domain: z.enum(["nutrition", "inventory", "support", "logistics"]),
      payload: z.object({
        rawText: z.string().min(1, "Texto de entrada é obrigatório"),
        fileBase64: z.string().optional(),
      }), 
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      const taskId = crypto.randomUUID();

      // 🛡️ 1. VERIFICAÇÃO DE CRÉDITOS (PROATIVA)
      const [user] = await db
        .select({ aiCredits: users.aiCredits, role: users.role })
        .from(users)
        .where(eq(users.id, userId));

      const isAdmin = user?.role === "admin";
      const hasCredits = (user?.aiCredits ?? 0) > 0;

      if (!isAdmin && !hasCredits) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Seus créditos de IA deste mês acabaram. Eles renovam no dia 1º." 
        });
      }

      // 🛡️ 2. CONSUMO ATÔMICO DO CRÉDITO
      if (!isAdmin) {
        await db
          .update(users)
          .set({ aiCredits: sql`ai_credits - 1` })
          .where(eq(users.id, userId));
      }

      const rawText = validateAiTextInput(input.payload.rawText);
      const fileBase64 = validateAiFileBase64(input.payload.fileBase64);
      assertBusinessGuardrails(rawText);

      // 3. Tenta Cache de Expertise
      if (!fileBase64) {
        const cachedData = await AiExpertService.findKnowledge(rawText);
        if (cachedData) {
          const safeCachedData = ensureSafeAiResult(cachedData);
          await db.insert(nutriScansTemp).values({
            id: taskId,
            userId: userId,
            rawText: sanitizeTextForStorage(rawText),
            suggestedData: safeCachedData,
            status: 'completed'
          });
          return { success: true, taskId, cached: true };
        }
      }

      // 4. Enfileiramento em background
      await db.insert(nutriScansTemp).values({
        id: taskId,
        userId: userId,
        rawText: sanitizeTextForStorage(rawText),
        status: 'pending'
      });

      await addPrescriptionToQueue({
        scanId: taskId,
        rawText: rawText,
        userId: userId,
        requestId: (ctx.req as any)?.requestId
      });

      return { success: true, taskId, cached: false };
    }),

  /**
   * 🗄️ DELETAR REGISTRO (Restrito a Admin)
   */
  archiveAndDeleteScan: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // 🛡️ VERIFICAÇÃO DE ROLE (SECURITY BOUNDARY)
      const [user] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId));

      if (user?.role !== "admin") {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Apenas administradores podem remover registros do histórico de IA." 
        });
      }

      const [scan] = await db
        .select()
        .from(nutriScansTemp)
        .where(and(
          eq(nutriScansTemp.id, input.id),
          eq(nutriScansTemp.userId, userId)
        ))
        .limit(1);

      if (scan) {
        await AiExpertService.recordExpertise({
          runId: `rejection_${input.id}`,
          rawInput: scan.rawText || "Remoção manual",
          aiJson: scan.suggestedData,
          finalJson: null, 
          confidenceScore: 0.05 
        });

        await db.delete(nutriScansTemp).where(eq(nutriScansTemp.id, input.id));
      }

      return { success: true };
    }),

  // Mantive o checkStatus igual, pois ele já tem validação de posse (userId)
  checkStatus: protectedProcedure
    .input(z.object({ 
      scanId: z.string().optional(),
      runId: z.string().optional() 
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      
      if (input.scanId) {
        const [result] = await db
          .select()
          .from(nutriScansTemp)
          .where(and(
            eq(nutriScansTemp.id, input.scanId),
            eq(nutriScansTemp.userId, userId)
          ))
          .limit(1);

        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Análise não encontrada." });
        return { status: result.status, data: ensureSafeAiResult(result.suggestedData) };
      }

      if (input.runId) {
        const [run] = await db
          .select()
          .from(agentRuns)
          .where(eq(agentRuns.id, input.runId))
          .limit(1);
        
        return { status: run?.status || 'not_found', error: run?.errorMessage };
      }

      throw new TRPCError({ code: "BAD_REQUEST", message: "ID inválido." });
    }),
});
