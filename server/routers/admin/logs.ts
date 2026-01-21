import { adminProcedure, router } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { auditLogs, users } from "../../../drizzle/schema/index.js";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { decrypt } from "../../encryption.js"; // ✅ Importe sua função de decrypt

/**
 * Helper para descriptografar dados sensíveis (Name, Phone, etc)
 */
function unseal(val: any): string {
  if (!val) return "";
  try {
    const str = String(val);
    // Se não estiver no formato encriptado (IV:AUTH:CONTENT), retorna o original
    if (str.split(':').length !== 3) return str;
    return decrypt(str) || str;
  } catch { 
    return String(val); 
  }
}

/**
 * 👑 Roteador de Logs de Auditoria (Admin)
 * Rota: admin.logs.list
 */
export const adminLogsRouter = router({
  list: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      try {
        const rows = await db
          .select({
            id: auditLogs.id,
            action: auditLogs.action,
            entity: auditLogs.entity,
            entityId: auditLogs.entityId,
            ipAddress: auditLogs.ipAddress,
            createdAt: auditLogs.createdAt,
            userName: users.name,    // Vem encriptado do banco
            userEmail: users.email,  // Geralmente público, mas trataremos por segurança
            oldValues: auditLogs.oldValues,
            newValues: auditLogs.newValues,
          })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.userId, users.id))
          .orderBy(desc(auditLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return rows.map((row) => {
          // Função robusta para tratar JSON/Buffers vindos do Banco
          const parseLogValues = (val: any) => {
            if (!val) return null;
            if (typeof val === 'object' && !Buffer.isBuffer(val)) return val;
            try { 
              const str = Buffer.isBuffer(val) ? val.toString('utf8') : String(val);
              return JSON.parse(str); 
            } catch { 
              return { info: "Dados em formato incompatível" }; 
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
            // ✅ APLICAÇÃO DO UNSEAL: Descriptografa o nome do admin/usuário
            user: row.userName 
              ? { name: unseal(row.userName), email: row.userEmail } 
              : { name: "Sistema", email: "Automático" },
            createdAt: row.createdAt instanceof Date 
              ? row.createdAt.toISOString() 
              : new Date().toISOString()
          };
        });
      } catch (error: any) {
        console.error("❌ [LOGS ERROR]:", error.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao carregar trilha de auditoria.",
        });
      }
    }),
});