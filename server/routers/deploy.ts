import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// ✅ Correção para __dirname em ES Modules (Vite/Node moderno)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 🔑 O TypeScript agora reconhecerá 'env' se os @types/node estiverem instalados
const DEPLOY_SECRET = process.env.DEPLOY_SECRET;

/**
 * ✅ Interface para estender o Request do Express
 * Resolve o erro: Property 'files' does not exist
 */
interface RequestWithFiles extends Request {
  files?: any; // Ou use o tipo UploadedFile do 'express-fileupload'
}

router.post('/deploy-98234-u9832-upgrade', async (req: RequestWithFiles, res: Response) => {
  const apiKey = req.headers['x-api-key'];

  // 1. Validação de Segurança
  if (!DEPLOY_SECRET || apiKey !== DEPLOY_SECRET) {
    return res.status(404).send('Not Found');
  }

  // 2. Acesso aos arquivos enviado pelo middleware express-fileupload
  const zipFile = req.files?.package;
  if (!zipFile) return res.status(400).send("Pacote ausente.");

  const tempPath = path.join(__dirname, '../../temp_update.zip');

  try {
    // 3. Salva o arquivo temporário
    await zipFile.mv(tempPath);

    // 4. Extração (AdmZip)
    const zip = new AdmZip(tempPath);
    zip.extractAllTo("./", true);

    // 5. Migração e Sincronização
    exec('npm run db:push', (err) => {
      if (err) {
        console.error("Erro Drizzle:", err);
        return res.status(500).json({ error: "Erro na atualização do banco" });
      }

      res.json({ success: true, message: "Sistema atualizado com sucesso!" });

      // 6. Reinício Seguro
      if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
          exec('pm2 restart all');
        }, 1000);
      }
    });

  } catch (error) {
    console.error("Erro Deploy:", error);
    res.status(500).json({ error: "Falha na extração dos arquivos" });
  } finally {
    // Limpeza do arquivo temporário
    if (fs.existsSync(tempPath)) {
      fs.removeSync(tempPath);
    }
  }
});

export default router;