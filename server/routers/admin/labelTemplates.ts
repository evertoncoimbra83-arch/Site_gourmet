import { z } from "zod";
// ✅ Alterado para 'router' que é o padrão comum do tRPC
import { router, adminProcedure } from "../../../server/_core/trpc"; 
import { labelTemplates } from "../../../drizzle/schema/"; 
import { eq } from "drizzle-orm";

export const labelTemplatesRouter = router({
  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(labelTemplates);
  }),
  
  upsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      width: z.number(),
      height: z.number(),
      elements: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        await ctx.db.update(labelTemplates).set(data).where(eq(labelTemplates.id, id));
        return { success: true, id };
      } else {
        await ctx.db.insert(labelTemplates).values(data);
        return { success: true };
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(labelTemplates).where(eq(labelTemplates.id, input.id));
      return { success: true };
    }),
});