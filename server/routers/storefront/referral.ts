import { router, publicProcedure } from "../../_core/trpc.js"; 
import { z } from "zod";
import { getDb } from "../../db.js";
import { eq, and } from "drizzle-orm";

// ✅ Importando as tabelas necessárias do seu schema unificado
import { sessions, referrals } from "../../../drizzle/schema/index.js"; 

export const referralRouter = router({
  /**
   * ✅ VINCULA O CÓDIGO DE INDICAÇÃO NA SESSÃO
   * Renomeado de 'apply' para 'bindCode' para evitar conflito com palavra reservada do JS.
   */
  bindCode: publicProcedure
    .input(z.object({ 
      code: z.string(),
      sessionId: z.string() 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); 
      const { code, sessionId } = input;
      const normalizedCode = code.toUpperCase();

      // 1. Busca o parceiro na nova tabela e checa se 'isActive' é true
      const [partner] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.code, normalizedCode),
            eq(referrals.isActive, true)
          )
        )
        .limit(1);

      // Se o parceiro não existir ou estiver pausado, retornamos erro
      if (!partner) {
        return { 
          success: false, 
          message: "Código de indicação inválido ou parceria temporariamente pausada." 
        };
      }

      // 2. Se estiver tudo OK, atualiza a sessão com o código
      // ✅ CORREÇÃO: Cast explícito para permitir 'referralCode'
      await db.update(sessions)
        .set({ referralCode: normalizedCode } as Record<string, unknown>)
        .where(eq(sessions.id, sessionId));

      return { 
        success: true, 
        code: normalizedCode,
        partnerName: partner.name,
        message: `Indicação de ${partner.name} aplicada com sucesso!` 
      };
    }),
});