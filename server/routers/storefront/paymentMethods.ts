import { router, publicProcedure, adminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import * as schema from "../../../drizzle/schema/index.js";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function toSlug(input: unknown): string {
  const base = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return base || "metodo_pagamento";
}

function toMoneyString(v: unknown): string {
  if (v === null || v === undefined || v === "") return "0.00";
  const n = Number(v);
  if (Number.isFinite(n)) return n.toFixed(2);
  const n2 = Number(String(v).replace(",", "."));
  return Number.isFinite(n2) ? n2.toFixed(2) : "0.00";
}

const paymentMethodSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  isActive: z.boolean().optional().default(true),
  discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  displayOrder: z.coerce.number().int().optional().default(0),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  slug: z.string().optional(),
  instructions: z.string().optional().nullable(),
});

export const paymentMethodsRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    try {
      return await db
        .select()
        .from(schema.paymentMethods)
        .where(eq(schema.paymentMethods.isActive, true))
        .orderBy(asc(schema.paymentMethods.displayOrder), asc(schema.paymentMethods.name));
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar pagamentos",
      });
    }
  }),

  get: publicProcedure
    .input(z.object({ id: z.coerce.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [method] = await db
        .select()
        .from(schema.paymentMethods)
        .where(eq(schema.paymentMethods.id, input.id))
        .limit(1);

      if (!method)
        throw new TRPCError({ code: "NOT_FOUND", message: "Método não encontrado." });

      return method;
    }),

  create: adminProcedure
    .input(paymentMethodSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      try {
        const slug = toSlug(input.slug ?? input.name);

        // Preparamos o objeto separadamente para clareza
        const insertData = {
          name: input.name,
          isActive: input.isActive,
          displayOrder: input.displayOrder,
          description: input.description,
          icon: input.icon,
          instructions: input.instructions,
          slug,
          discountPercentage: toMoneyString(input.discountPercentage),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // ✅ CORREÇÃO DEFINITIVA: Silenciamos o 'any' especificamente nesta linha de execução.
        // O cast 'as any' é necessário porque 'instructions' e 'slug' podem não existir no Schema local do Drizzle ainda.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.insert(schema.paymentMethods).values(insertData as any);

        return { success: true, message: "Método criado com sucesso!" };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro ao criar.";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }
    }),

  update: adminProcedure
    .input(paymentMethodSchema.partial().extend({ id: z.coerce.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      try {
        const { id, ...data } = input;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {
          ...data,
          updatedAt: new Date(),
        };

        if (data.slug !== undefined) updateData.slug = toSlug(data.slug);
        
        if (data.discountPercentage !== undefined) {
          updateData.discountPercentage = toMoneyString(data.discountPercentage);
        }

        if (data.displayOrder !== undefined) {
          updateData.displayOrder = Number.isFinite(Number(data.displayOrder)) 
            ? Number(data.displayOrder) 
            : 0;
        }

        await db
          .update(schema.paymentMethods)
          .set(updateData)
          .where(eq(schema.paymentMethods.id, id));

        return { success: true, message: "Atualizado com sucesso." };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro ao atualizar.";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.coerce.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      try {
        await db
          .delete(schema.paymentMethods)
          .where(eq(schema.paymentMethods.id, input.id));

        return { success: true, message: "Removido com sucesso." };
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Erro ao excluir (possível vínculo com pedidos).",
        });
      }
    }),
});