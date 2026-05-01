import { execSync } from "child_process";

export async function generateDatabaseBackup(): Promise<string> {
  const containerName = "gourmet_db"; 
  const dbName = "gourmet_saudavel";

  try {
    // ✅ Comando formatado para compatibilidade com Docker/MySQL
    const command = `docker exec ${containerName} /usr/bin/mysqldump -u root --password=root ${dbName}`;
    
    const output = execSync(command, { 
      maxBuffer: 1024 * 1024 * 64, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'] 
    });

    return output;

  } catch (error: unknown) {
    // ✅ CORREÇÃO: Cast seguro de unknown para capturar as propriedades do erro de processo
    const processError = error as { stderr?: Buffer; message?: string };
    
    const stderr = processError.stderr?.toString() || "";
    const message = processError.message || "";

    // Tratamento de erro específico para o usuário
    if (stderr.includes("Unknown database")) {
      throw new Error(`O banco '${dbName}' não existe no container.`);
    }
    if (stderr.includes("Access denied")) {
      throw new Error("Senha do banco incorreta no script de backup.");
    }
    
    throw new Error(`Erro no Docker: ${stderr || message}`);
  }
}