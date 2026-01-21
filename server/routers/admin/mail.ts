import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc.js";
import { mailer } from "server/routers/lib/mailer.js"; // ✅ Caminho corrigido
import { appConfigs } from "../../../drizzle/schema/index.js";
import { getDb } from "../../db.js";
import { eq } from "drizzle-orm";

export const mailAdminRouter = router({
  /**
   * 📥 GET CONFIGS
   * Carrega todas as configurações de e-mail e SMTP do banco
   */
  getConfigs: protectedProcedure.query(async () => {
    const db = await getDb();
    const configs = await db.select().from(appConfigs);
    
    // Filtra apenas as chaves relacionadas a e-mail e servidor SMTP
    return configs.filter(c => 
      c.configKey.startsWith("smtp_") || 
      c.configKey.startsWith("email_")
    );
  }),

  /**
   * 💾 SAVE CONFIGS
   * Salva ou atualiza as configurações (Upsert)
   */
  saveConfigs: protectedProcedure
    .input(z.array(z.object({
      configKey: z.string(),
      configValue: z.string()
    })))
    .mutation(async ({ input }) => {
      const db = await getDb();

      for (const item of input) {
        // Verifica se a chave já existe para decidir entre Update ou Insert
        const [exists] = await db.select().from(appConfigs)
          .where(eq(appConfigs.configKey, item.configKey)).limit(1);

        if (exists) {
          await db.update(appConfigs)
            .set({ configValue: item.configValue })
            .where(eq(appConfigs.configKey, item.configKey));
        } else {
          // ✅ CORREÇÃO: Removido 'configGroup' para evitar erro TS2769
          await db.insert(appConfigs).values({
            configKey: item.configKey,
            configValue: item.configValue
          });
        }
      }
      return { success: true };
    }),

  /**
   * 🧪 TEST CONNECTION
   * Envia um e-mail de teste rápido para validar as credenciais SMTP
   */
  testConnection: protectedProcedure
    .input(z.object({ to: z.string().email() }))
    .mutation(async ({ input }) => {
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
      
      return { success: true };
    }),
});