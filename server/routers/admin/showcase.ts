import { router, adminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { showcases } from "../../../drizzle/schema/index.js"; // ✅ Agora o TS encontrará o membro
import { eq, asc } from "drizzle-orm";
import { logAction } from "../../db/lib/audit.js";

export const adminShowcaseRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    return await db.select().from(showcases).orderBy(asc(showcases.order));
  }),

  // Cria uma nova vitrine
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      active: z.boolean().default(true),
      order: z.number().default(0)
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [result] = await db.insert(showcases).values(input);
      
      await logAction(ctx, "CREATE_SHOWCASE", "showcase", { new: input });
      return { id: result.insertId };
    }),

  // Deleta uma vitrine
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db.delete(showcases).where(eq(showcases.id, input.id));
      
      await logAction(ctx, "DELETE_SHOWCASE", "showcase", { entityId: String(input.id) });
      return { success: true };
    }),
});