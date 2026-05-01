import { adminProcedure, router } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { auditLogs, users } from "../../../drizzle/schema/index.js";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { decrypt } from "../../encryption.js";

/**
 * 🔐 Helper para descriptografar dados sensíveis (PII)
 */
function unseal(val: unknown): string {
  if (!val) return "";
  try {
    const str = String(val);
    // Verifica se o formato parece ser um dado criptografado (iv:authTag:content)
    if (str.split(':').length !== 3) return str;
    return decrypt(str) || str;
  } catch { 
    return String(val); 
  }
}

/**
 * 👑 Roteador de Logs de Auditoria (Admin)
 * Este router é vital para a conformidade do sistema e monitoramento de ações críticas.
 */
export const adminLogsRouter = router({
  list: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Banco de dados indisponível." 
        });
      }

      try {
        const rows = await db
          .select({
            id: auditLogs.id,
            action: auditLogs.action,
            entity: auditLogs.entity,
            entityId: auditLogs.entityId,
            ipAddress: auditLogs.ipAddress,
            createdAt: auditLogs.createdAt,
            userName: users.name, 
            userEmail: users.email,
            oldValues: auditLogs.oldValues,
            newValues: auditLogs.newValues,
          })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.userId, users.id))
          .orderBy(desc(auditLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return rows.map((row) => {
          /**
           * ✅ Tipagem segura para parsing de JSON de colunas TEXT/BLOB
           */
          const parseLogValues = (val: unknown): Record<string, unknown> | null => {
            if (!val) return null;
            
            // Se já for um objeto (comum em drivers que auto-parseiam JSON)
            if (typeof val === 'object' && !Buffer.isBuffer(val)) {
              return val as Record<string, unknown>;
            }

            try { 
              const str = Buffer.isBuffer(val) ? val.toString('utf8') : String(val);
              return JSON.parse(str); 
            } catch { 
              return { info: "Dados em formato incompatível ou texto puro" }; 
            }
          };

          return {
            id: row.id,
            action: row.action,
            entity: row.entity,
            entityId: row.entityId,
            ipAddress: row.ipAddress || "Interno",
            oldValues: parseLogValues(row.oldValues),
            newValues: parseLogValues(row.newValues),
            // ✅ Descriptografia do nome do executor da ação
            user: row.userName 
              ? { name: unseal(row.userName), email: row.userEmail } 
              : { name: "Sistema", email: "Automático" },
            createdAt: row.createdAt instanceof Date 
              ? row.createdAt.toISOString() 
              : new Date().toISOString()
          };
        });
      } catch (err) {
        // Log interno para depuração sem expor detalhes ao cliente
        console.error("Erro ao processar logs de auditoria:", err);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao carregar trilha de auditoria para o painel.",
        });
      }
    }),
});