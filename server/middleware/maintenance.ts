import fs from 'fs-extra';
import path from 'path';

export const maintenanceMiddleware = async (req, res, next) => {
  const maintenanceFile = path.join(process.cwd(), '.maintenance');
  const isMaintenance = await fs.pathExists(maintenanceFile);

  // Se o arquivo existir e não for a rota de deploy (para não bloquear o próprio upgrade)
  if (isMaintenance && !req.path.includes('upgr4de-sys')) {
    return res.status(503).json({
      maintenance: true,
      message: "Estamos atualizando o sistema para melhor atendê-lo. Voltamos em instantes!"
    });
  }

  next();
};