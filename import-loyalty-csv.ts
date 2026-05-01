import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

// --- CONFIGURAÇÃO ---
const CSV_FILE_NAME = "points-rewards-export_27-11-2025-17-54-50.csv";

async function importCsv() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL vazia");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  

  const csvPath = path.join(process.cwd(), CSV_FILE_NAME);
  if (!fs.existsSync(csvPath)) {
    
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  // Divide por linhas, ignora cabeçalho e linhas vazias
  const rows = fileContent.split("\n").slice(1).filter(row => row.trim() !== "");

  
  let success = 0, errors = 0;

  for (const row of rows) {
    try {
      // Parsing simples do CSV (assumindo separador por vírgula)
      const cols = row.split(",");
      
      // Ajuste os índices conforme seu CSV
      // Ex: Customer Name, Email, Points Balance
      const name = cols[0]?.replace(/"/g, "").trim();
      const email = cols[1]?.replace(/"/g, "").trim();
      const points = parseInt(cols[2] || "0");

      if (!email) continue;

      // 1. Buscar usuário pelo email
      const [users]: any = await connection.query(
        "SELECT id FROM users WHERE email = ?", [email]
      );

      let userId;

      if (users.length > 0) {
        userId = users[0].id;
        
      } else {
        // Criar usuário (migração)
        const openId = `migrated-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        const [res]: any = await connection.query(
          "INSERT INTO users (email, name, `openId`, `loginMethod`, role, `createdAt`, `updated_at`) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
          [email, name, openId, "email", "user"]
        );
        userId = res.insertId;
        
      }

      // 2. Atualizar User Profile com pontos
      // Verifica se perfil existe
      const [profiles]: any = await connection.query(
        "SELECT id FROM user_profiles WHERE user_id = ?", [userId]
      );

      if (profiles.length > 0) {
        await connection.query(
          "UPDATE user_profiles SET loyalty_points = ? WHERE user_id = ?",
          [points, userId]
        );
      } else {
        await connection.query(
          "INSERT INTO user_profiles (user_id, loyalty_points, total_spent, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
          [userId, points, 0.00]
        );
      }

      // 3. Histórico (Opcional)
      if (points > 0) {
        await connection.query(
          "INSERT INTO loyaltyHistory (user_id, points_change, reason, description, created_at) VALUES (?, ?, ?, ?, NOW())",
          [userId, points, "Migração", "Importado do sistema antigo"]
        );
      }

      success++;
    } catch (e) {
      
      errors++;
    }
  }

  
  await connection.end();
  process.exit(0);
}

importCsv();