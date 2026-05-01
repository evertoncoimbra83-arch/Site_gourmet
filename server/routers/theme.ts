import { getDb } from ".././db"; 

/**
 * Busca as configurações de identidade visual (Cores, Fontes, Logo).
 * Utilizado para alimentar o provedor de tema no Frontend.
 */
export async function getTheme() {
  const db = await getDb();
  if (!db) return null;

  // Usando a Relational Query API do Drizzle (não requer a importação direta de siteTheme)
  const theme = await db.query.siteTheme.findFirst();
  
  return theme || null;
}