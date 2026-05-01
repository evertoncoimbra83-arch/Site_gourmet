// server/src/lib/logger.ts
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

// Garante que a pasta de logs existe no servidor .6
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

export const logCriticalError = (context: string, error: unknown) => {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = `[${timestamp}] [CRITICAL] [${context}]: ${errorMessage}\n`;
  
  // Escreve no arquivo físico (append)
  fs.appendFileSync(path.join(LOG_DIR, 'critical_errors.log'), logMessage);
  
  // Também logamos no console para o PM2/Docker capturar
  console.error(logMessage);
};