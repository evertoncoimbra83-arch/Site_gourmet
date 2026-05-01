import fs from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:root@localhost:10005/gourmet_saudavel';

async function restoreDishes() {
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    
    // Ler arquivo SQL
    const sqlContent = fs.readFileSync('./dishes-backup.sql', 'utf-8');
    
    // Executar SQL diretamente
    const queries = sqlContent.trim().split(';').filter(q => q.trim());
    
    for (const query of queries) {
      if (query.trim()) {
        try {
          await connection.execute(query);
          
        } catch (error) {
          
        }
      }
    }
    
    await connection.end();
    
  } catch (error) {
    
    process.exit(1);
  }
}

restoreDishes();
