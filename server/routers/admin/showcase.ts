// server/routers/admin/showcase.ts

import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { showcases } from "../../../drizzle/schema/index.js";
import { eq, asc } from "drizzle-orm";
import { logAction } from "../../db/lib/audit.js";
import { TRPCError } from "@trpc/server";

// Interface para tipar o retorno do driver MySQL no Drizzle
interface MySqlInsertResult {
  insertId: number;
  affectedRows: number;
}

export const adminShowcaseRouter = router({
  /**
   * 📋 LISTAGEM ADMIN
   */
  list: adminProcedure.query(async () => {
    const db = await getDb();
    return await db.select().from(showcases).orderBy(asc(showcases.order));
  }),

  /**
   * 🔄 UPSERT (Cria ou Atualiza)
   */
  upsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      title: z.string().min(1, "O título da vitrine é obrigatório"),
      description: z.string().nullable().optional().transform((v: string | null | undefined) => v ?? ""),
      
      /**
       * ✅ NOVO CAMPO: items
       * Recebe array de números do front e salva como string JSON no banco
       */
      items: z.array(z.number()).optional().default([]).transform((v) => JSON.stringify(v)),

      active: z.boolean().default(true),
      order: z.number().int().default(0)
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { id, ...data } = input;

      if (id) {
        // --- MODO ATUALIZAÇÃO ---
        const [exists] = await db.select().from(showcases).where(eq(showcases.id, id)).limit(1);
        if (!exists) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Vitrine não encontrada." });
        }

        await db.update(showcases).set(data).where(eq(showcases.id, id));
        
        await logAction(ctx, "UPDATE_SHOWCASE", "showcase", { 
          entityId: String(id),
          new: data 
        });

        return { success: true, id, message: `Vitrine "${input.title}" atualizada!` };
      } else {
        // --- MODO CRIAÇÃO ---
        const [result] = await db.insert(showcases).values(data);
        const mysqlResult = result as unknown as MySqlInsertResult;
        const newId = mysqlResult.insertId || 0;

        await logAction(ctx, "CREATE_SHOWCASE", "showcase", { 
          entityId: String(newId),
          new: data 
        });
        
        return { success: true, id: newId, message: `Vitrine "${input.title}" criada!` };
      }
    }),

  /**
   * 🗑️ EXCLUSÃO
   */
  delete: adminProcedure
    .input(z.object({ 
      id: z.number(),
      title: z.string().optional() 
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      const [exists] = await db.select().from(showcases).where(eq(showcases.id, input.id)).limit(1);
      if (!exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vitrine não encontrada." });
      }

      await db.delete(showcases).where(eq(showcases.id, input.id));
      
      await logAction(ctx, "DELETE_SHOWCASE", "showcase", { 
        entityId: String(input.id),
        old: { title: exists.title } 
      });
      
      return { 
        success: true,
        message: input.title ? `Vitrine "${input.title}" removida.` : "Vitrine excluída."
      };
    }),
});