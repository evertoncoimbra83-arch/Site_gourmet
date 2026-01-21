import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import * as StoreLogic from "../../storeSettings.js";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db.js";
import { appConfigs } from "../../../drizzle/schema/index.js"; 
import { encrypt, decrypt } from "../../encryption.js"; 
import { generateDatabaseBackup } from "../../backup.js";
import { logAction } from "../../db/lib/audit.js";
import { eq } from "drizzle-orm";

// 📊 Estado global simples para a barra de progresso (em memória)
let exportProgress = { percent: 0, status: "Aguardando..." };

/**
 * Helper para realizar Upsert (Update ou Insert) manual no MySQL
 * Garante que as configurações não falhem se o registro ainda não existir.
 */
async function upsertConfig(db: any, key: string, value: string) {
  const result = await db.update(appConfigs)
    .set({ configValue: value })
    .where(eq(appConfigs.configKey, key));

  // @ts-ignore - Se zero linhas afetadas, o registro não existe: INSERT
  if (result[0]?.affectedRows === 0) {
    await db.insert(appConfigs).values({ configKey: key, configValue: value });
  }
}

export const adminSettingsRouter = router({
  
  /**
   * ⚙️ BUSCAR CONFIGURAÇÕES
   */
  get: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      const generalSettings = await StoreLogic.getStoreSettings();
      const extraConfigs = await db.select().from(appConfigs);

      const getRawConfig = (key: string) => 
        extraConfigs.find(r => r.configKey === key)?.configValue;

      const getEncryptedConfig = (key: string) => {
        const row = extraConfigs.find(r => r.configKey === key);
        if (!row?.configValue) return null;
        try {
          const decrypted = decrypt(row.configValue);
          return decrypted ? JSON.parse(decrypted) : null;
        } catch (e) { return null; }
      };

      return {
        ...generalSettings,
        googleLogin: getEncryptedConfig('google_auth_credentials') || { enabled: false, clientId: "", clientSecret: "" },
        companyInfo: getEncryptedConfig('company_social_info') || { phone: "", whatsapp: "", email: "", address: "", instagram: "", facebook: "" },
        accessibility: {
          vLibrasActive: getRawConfig('accessibility_vlibras') === 'true',
          highContrastActive: getRawConfig('accessibility_high_contrast') === 'true',
        }
      };
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar configurações." });
    }
  }),

  /**
   * 💾 ATUALIZAR ACESSIBILIDADE E GERAL
   */
  update: adminProcedure
    .input(z.any()) 
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        const { accessibility, ...storeData } = input;

        await StoreLogic.updateStoreSettings(storeData);

        if (accessibility) {
          await upsertConfig(db, 'accessibility_vlibras', String(accessibility.vLibrasActive));
          await upsertConfig(db, 'accessibility_high_contrast', String(accessibility.highContrastActive));
        }

        await logAction(ctx, "UPDATE_SETTINGS", "settings", { entityId: "global", new: input });
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao salvar." });
      }
    }),

  /**
   * 📈 STATUS DO PROGRESSO (Para o Frontend)
   */
  getExportStatus: adminProcedure.query(() => {
    return exportProgress;
  }),

  /**
   * 📦 EXPORTAÇÃO COM BARRA DE PROGRESSO
   */
  exportKernel: adminProcedure.mutation(async ({ ctx }) => {
    const { execSync } = await import("child_process");
    const fs = await import("fs");
    const path = await import("path");
    const AdmZip = (await import("adm-zip")).default;

    try {
      exportProgress = { percent: 10, status: "🚀 Iniciando build e exportação..." };
      
      // Build (opcional: pode ser removido se a VPS tiver pouca RAM)
      try {
        execSync('npm run build', { stdio: 'ignore', timeout: 300000 });
        exportProgress = { percent: 40, status: "🛠️ Build concluído, zipando arquivos..." };
      } catch (e) {
        exportProgress = { percent: 40, status: "⚠️ Build ignorado, coletando dist atual..." };
      }

      const zip = new AdmZip();
      const rootDir = process.cwd();
      
      const distPath = path.join(rootDir, 'dist');
      if (fs.existsSync(distPath)) {
        zip.addLocalFolder(distPath, 'dist');
        exportProgress = { percent: 70, status: "📦 Pasta /dist adicionada..." };
      }

      ['package.json', 'package-lock.json', 'ecosystem.config.cjs', '.env'].forEach(f => { 
        const filePath = path.join(rootDir, f);
        if (fs.existsSync(filePath)) zip.addLocalFile(filePath); 
      });

      exportProgress = { percent: 90, status: "🔐 Finalizando compressão..." };
      const buffer = zip.toBuffer();
      
      await logAction(ctx, "EXPORT_KERNEL", "system", { entityId: "dist.zip" });
      
      exportProgress = { percent: 100, status: "🏁 Pronto para download!" };
      return {
        base64: buffer.toString('base64'),
        filename: `kernel-deploy-${Date.now()}.zip`
      };
    } catch (err: any) {
      exportProgress = { percent: 0, status: "❌ Erro na exportação" };
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }
  }),

  /**
   * 🏢 SALVAR INFO DA EMPRESA
   */
  saveCompanyInfo: adminProcedure
    .input(z.any())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const encryptedValue = encrypt(JSON.stringify(input));
      if (!encryptedValue) throw new Error("Erro na criptografia");

      await upsertConfig(db, 'company_social_info', encryptedValue);
      await logAction(ctx, "UPDATE_COMPANY_INFO", "app_configs", { entityId: "company_info" });
      return { success: true };
    }),

  /**
   * 🔐 CONFIG GOOGLE
   */
  saveGoogleConfig: adminProcedure
    .input(z.object({
      enabled: z.boolean(),
      clientId: z.string().min(1),
      clientSecret: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const encryptedValue = encrypt(JSON.stringify(input));
      if (!encryptedValue) throw new Error("Erro na criptografia");

      await upsertConfig(db, 'google_auth_credentials', encryptedValue);
      await logAction(ctx, "UPDATE_GOOGLE_AUTH", "app_configs", { entityId: "google_auth" });
      return { success: true };
    }),

  /**
   * 💾 BACKUP SQL
   */
  downloadBackup: adminProcedure.mutation(async ({ ctx }) => {
      const sqlContent = await generateDatabaseBackup();
      await logAction(ctx, "DATABASE_BACKUP", "system", { entityId: "mysql" });
      return { sql: sqlContent, filename: `backup_${Date.now()}.sql` };
  }),

  /**
   * 📥 UPGRADE SYSTEM (IMPLANTAÇÃO)
   */
  upgradeSystem: adminProcedure
    .input(z.object({ fileBase64: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const { exec } = await import("child_process");

        const buffer = Buffer.from(input.fileBase64, 'base64');
        const uploadPath = path.join(process.cwd(), 'update_package.zip');
        
        fs.writeFileSync(uploadPath, buffer);
        await logAction(ctx, "UPGRADE_SYSTEM", "system", { entityId: "kernel_zip" });

        // Comando para VPS: Extrai, limpa e reinicia via PM2
        const deployCommand = 'unzip -o update_package.zip && npm install --production && (sleep 2 && pm2 restart gourmet-novo &)';
        
        exec(deployCommand, (error) => {
          if (error) console.error("❌ [DEPLOY ERROR]:", error.message);
        });

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha no deploy: " + error.message });
      }
    }),
});