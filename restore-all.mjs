import fs from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:root@localhost:10005/gourmet_saudavel';

async function restoreData() {
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('📂 Restaurando categorias...');
    const categoriesSQL = fs.readFileSync('./categories-backup.sql', 'utf-8');
    const categoriesQueries = categoriesSQL.trim().split(';').filter(q => q.trim());
    
    for (const query of categoriesQueries) {
      if (query.trim()) {
        try {
          await connection.execute(query);
          console.log('✅ Categorias restauradas');
        } catch (error) {
          console.error('❌ Erro:', error.message);
        }
      }
    }
    
    console.log('🍽️  Restaurando pratos...');
    const dishesSQL = fs.readFileSync('./dishes-backup.sql', 'utf-8');
    const dishesQueries = dishesSQL.trim().split(';').filter(q => q.trim());
    
    for (const query of dishesQueries) {
      if (query.trim()) {
        try {
          await connection.execute(query);
          console.log('✅ Pratos restaurados');
        } catch (error) {
          console.error('❌ Erro:', error.message);
        }
      }
    }
    
    await connection.end();
    console.log('✅ Restauração concluída!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

restoreData();
