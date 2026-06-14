import { adminProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { getDb } from "../../db";
import { categories } from "../../../drizzle/schema/index";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logger } from "../../logger";

type CategoryInsert = typeof categories.$inferInsert;

export const adminCategoriesRouter = router({
  list: adminProcedure
    .input(z.object({ onlyActive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      try {
        const db = await getDb();

        const whereClause = input?.onlyActive
          ? eq(categories.isActive, true)
          : undefined;

        const results = await db
          .select()
          .from(categories)
          .where(whereClause)
          .orderBy(asc(categories.displayOrder), asc(categories.name));

        return results || [];
      } catch (error) {
        logger.error({ err: error }, "ADMIN_CATEGORIES_LIST_FAILED");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao listar categorias.",
        });
      }
    }),

  upsert: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1, "O nome da categoria é obrigatório"),
        iconKey: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        isActive: z.boolean().default(true),
        displayOrder: z.number().optional().default(0),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      const slug = input.name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const data: CategoryInsert = {
        name: input.name,
        slug,
        iconKey: input.iconKey,
        color: input.color || "slate",
        isActive: input.isActive,
        displayOrder: input.displayOrder,
        updatedAt: new Date(),
      };

      try {
        if (input.id) {
          await db.update(categories).set(data).where(eq(categories.id, input.id));

          return { success: true };
        }

        await db.insert(categories).values({
          ...data,
          createdAt: new Date(),
        });

        return { success: true };
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;

        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ER_DUP_ENTRY"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma categoria com este nome ou slug.",
          });
        }

        logger.error(
          { err: error, categoryId: input.id ?? null },
          "ADMIN_CATEGORY_UPSERT_FAILED",
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Ocorreu um erro interno ao processar sua solicitação. Tente novamente.",
        });
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        await db.delete(categories).where(eq(categories.id, input.id));

        return {
          success: true,
          message: input.name
            ? `Categoria "${input.name}" removida.`
            : "Removida com sucesso.",
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Não foi possível excluir. Verifique se existem produtos vinculados.",
        });
      }
    }),
});
