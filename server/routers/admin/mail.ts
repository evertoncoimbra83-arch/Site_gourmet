import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { mailer } from "../../routers/lib/mailer.js"; // ✅ Ajustado caminho relativo se necessário
import { appConfigs } from "../../../drizzle/schema/index.js";
import { getDb } from "../../db.js";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const mailAdminRouter = router({
  /**
   * 📥 GET CONFIGS
   */
  getConfigs: adminProcedure.query(async () => {
    const db = await getDb();
    const configs = await db.select().from(appConfigs);
    
    return configs.filter(c => 
      c.configKey.startsWith("smtp_") || 
      c.configKey.startsWith("email_")
    );
  }),

  /**
   * 💾 SAVE CONFIGS
   */
  saveConfigs: adminProcedure
    .input(z.array(z.object({
      configKey: z.string(),
      configValue: z.string()
    })))
    .mutation(async ({ input }) => {
      const db = await getDb();

      for (const item of input) {
        const [exists] = await db.select().from(appConfigs)
          .where(eq(appConfigs.configKey, item.configKey)).limit(1);

        if (exists) {
          await db.update(appConfigs)
            .set({ configValue: item.configValue })
            .where(eq(appConfigs.configKey, item.configKey));
        } else {
          await db.insert(appConfigs).values({
            configKey: item.configKey,
            configValue: item.configValue
          });
        }
      }
      
      return { 
        success: true, 
        message: "Configurações de SMTP salvas com sucesso!" 
      };
    }),

  /**
   * 🧪 TEST CONNECTION
   */
  testConnection: adminProcedure
    .input(z.object({ to: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        const { transporter, from } = await mailer.getTransport();

        await transporter.sendMail({
          from: `"Teste de Sistema" <${from}>`,
          to: input.to,
          subject: "Teste de Conexão SMTP 🚀",
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h1 style="color: #059669;">Conexão Bem-Sucedida!</h1>
              <p>Se você recebeu este e-mail, suas configurações de SMTP estão funcionando corretamente.</p>
              <p style="color: #64748b; font-size: 12px;">Data do teste: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          `
        });
        
        return { 
          success: true, 
          message: `E-mail de teste enviado para ${input.to}!` 
        };
      } catch (error: unknown) {
        // ✅ CORREÇÃO: Removido 'any' e adicionada validação de erro
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Falha no teste SMTP: ${errorMessage}`
        });
      }
    }),
});
