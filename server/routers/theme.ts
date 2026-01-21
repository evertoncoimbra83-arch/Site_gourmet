import { getDb } from ".././db.js"; 
import { siteTheme } from "drizzle/schema/index.js"; // ✅ Caminho e extensão corrigidos

/**
 * Busca as configurações de identidade visual (Cores, Fontes, Logo).
 * Utilizado para alimentar o provedor de tema no Frontend.
 */
export async function getTheme() {
  const db = await getDb();
  if (!db) return null;

  // Usando a Relational Query API do Drizzle para buscar o primeiro registro
  const theme = await db.query.siteTheme.findFirst();
  
  return theme || null;
}