import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// ✅ Interface estrita para o arquivo vindo do middleware
interface UploadedFile {
  name: string;
  mv(path: string): Promise<void>;
  mimetype: string;
  data: Buffer;
  tempFilePath: string;
  truncated: boolean;
  size: number;
  md5: string;
}

// ✅ Extensão da interface Request para reconhecer 'files' sem usar 'any'
interface RequestWithFiles extends Request {
  files?: Record<string, UploadedFile | UploadedFile[]>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const DEPLOY_SECRET = process.env.DEPLOY_SECRET;

/**
 * 🚀 ROTA DE DEPLOY AUTOMATIZADO
 * Reforçada com validação de tipos e segurança de segredo.
 */
router.post('/deploy-98234-u9832-upgrade', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'];

  // 1. Validação de Segurança (Fronteira de Confiança)
  if (!DEPLOY_SECRET || apiKey !== DEPLOY_SECRET) {
    return res.status(404).send('Not Found');
  }

  // ✅ SOLUÇÃO TS2339: Cast seguro para a interface estendida
  const { files } = req as RequestWithFiles;
  
  // Captura o arquivo 'package' enviado no FormData
  const zipFile = files?.package;

  if (!zipFile || Array.isArray(zipFile)) {
    return res.status(400).send("Pacote inválido ou ausente.");
  }

  const tempPath = path.resolve(__dirname, '../../temp_update.zip');

  try {
    // 3. Salva o arquivo temporário
    await zipFile.mv(tempPath);

    // 4. Extração segura (Sobrescreve arquivos existentes)
    const zip = new AdmZip(tempPath);
    zip.extractAllTo("./", true);

    // 5. Migração e Sincronização de Banco de Dados
    exec('npm run db:push', (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: "Erro na sincronização do schema Drizzle" 
        });
      }

      res.json({ success: true, message: "Sistema Gourmet Saudável atualizado!" });

      // 6. Reinício Seguro via PM2 em produção
      if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
          exec('pm2 restart all');
        }, 1500);
      }
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno na extração";
    res.status(500).json({ success: false, error: msg });
  } finally {
    // Limpeza de rastro (Segurança de Infraestrutura)
    if (fs.existsSync(tempPath)) {
      fs.removeSync(tempPath);
    }
  }
});

export default router;