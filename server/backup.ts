import { execSync } from "child_process";

export async function generateDatabaseBackup(): Promise<string> {
  const containerName = "gourmet_db"; 
  const dbName = "gourmet_saudavel";

  try {
    console.log(`📦 [BACKUP] Executando dump via shell seguro...`);

    // ✅ Mudança: Usamos aspas duplas internas para o shell do Windows não se perder
    // E removemos o aviso de senha na CLI para evitar erros de pipe
    const command = `docker exec ${containerName} /usr/bin/mysqldump -u root --password=root ${dbName}`;
    
    const output = execSync(command, { 
      maxBuffer: 1024 * 1024 * 64, 
      encoding: 'utf8',
      // 'pipe' no stderr nos permite ver o erro real se falhar
      stdio: ['pipe', 'pipe', 'pipe'] 
    });

    return output;

  } catch (error: any) {
    // Aqui pegamos o erro REAL que o MySQL devolveu (stderr)
    const stderr = error.stderr?.toString() || "";
    const message = error.message || "";
    
    console.error("❌ [MYSQL ERROR]:", stderr);
    console.error("❌ [EXEC ERROR]:", message);

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