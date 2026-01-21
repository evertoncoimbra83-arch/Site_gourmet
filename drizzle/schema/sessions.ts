import { mysqlTable, varchar, datetime } from "drizzle-orm/mysql-core";
import { authUsers } from "./auth_users.js"; // Ajuste o nome do arquivo se necessário (ex: auth_users.js)

/**
 * TABELA DE SESSÕES (LUCIA AUTH)
 * Mantém o usuário logado entre navegações.
 */
export const sessions = mysqlTable("sessions", {
  /**
   * ✅ ID DA SESSÃO
   * O Lucia gera strings aleatórias longas para o ID da sessão.
   */
  id: varchar("id", { length: 255 }).primaryKey(),
  
  /**
   * 🚩 AJUSTE CRÍTICO: user_id
   * Alterado para VARCHAR(255) para casar perfeitamente com authUsers.id.
   * Sem isso, o Lucia falha ao tentar criar uma sessão para um usuário recém-logado.
   */
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }), // Limpa sessões se o user for deletado
    
  /**
   * ✅ EXPIRAÇÃO
   * fsp: 3 garante precisão de milissegundos, recomendada pelo Lucia.
   */
  expiresAt: datetime("expires_at", { fsp: 3 }).notNull(),
});