import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { accompanimentCategories } from "../../../../drizzle/schema/index.js";
import { adminProcedure, router } from "../../../_core/trpc.js";

type NewCategory = typeof accompanimentCategories.$inferInsert;

export const accompanimentCategoriesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(accompanimentCategories)
      .orderBy(accompanimentCategories.displayOrder);
  }),

  upsert: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1, "O nome é obrigatório"),
        iconKey: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const payload: NewCategory = {
        name: data.name,
        iconKey: data.iconKey,
        color: data.color,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      };

      if (id) {
        await ctx.db
          .update(accompanimentCategories)
          .set(payload)
          .where(eq(accompanimentCategories.id, id));

        return {
          success: true,
          id,
          message: `Categoria "${data.name}" atualizada!`,
        };
      }

      const result = await ctx.db.insert(accompanimentCategories).values(payload);
      const insertId = result[0]?.insertId;

      if (!insertId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro operacional: Não foi possível gerar o identificador do registro.",
        });
      }

      return {
        success: true,
        id: insertId,
        message: `Nova categoria "${data.name}" criada com sucesso!`,
      };
    }),
});
