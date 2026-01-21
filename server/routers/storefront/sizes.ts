import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
// ✅ Caminho ajustado para a lógica de banco de dados
import * as AdminSizes from "../../admin-sizes-accompaniments.js";

export const sizesRouter = router({
  
  // 1. TAMANHOS (DISH SIZES)
  // Usado no Storefront para o cliente escolher o tamanho
  list: publicProcedure.query(async () => {
    return await AdminSizes.getAllDishSizes();
  }),

  getById: adminProcedure
    .input(z.object({ id: z.coerce.number() }))
    .query(async ({ input }) => {
      return await AdminSizes.getSizeById(input.id);
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      priceModifier: z.coerce.number().default(0),
      weight: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      return await AdminSizes.createDishSize(input);
    }),

  update: adminProcedure
    .input(z.object({ 
      id: z.coerce.number(),
      name: z.string().optional(),
      priceModifier: z.coerce.number().optional(),
      weight: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }).passthrough())
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await AdminSizes.updateDishSize(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await AdminSizes.deleteDishSize(input.id);
    }),

  // 2. GRUPOS DE ACOMPANHAMENTO
  listGroups: adminProcedure.query(async () => {
    return await AdminSizes.getAllAccompanimentGroups();
  }),

  createGroup: adminProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await AdminSizes.createAccompanimentGroup(input);
    }),

  duplicateGroup: adminProcedure
    .input(z.object({ 
      id: z.number(), 
      newName: z.string().min(1) 
    }))
    .mutation(async ({ input }) => {
      try {
        return await AdminSizes.duplicateGroup(input);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Falha ao duplicar grupo",
        });
      }
    }),

  // 3. OPÇÕES INDIVIDUAIS (Sub-router)
  options: router({
    list: adminProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ input }) => {
        return await AdminSizes.getAccompanimentOptionsByGroup(input.groupId);
      }),

    create: adminProcedure
      .input(z.object({ 
        groupId: z.number(), 
        name: z.string().min(1), 
        priceModifier: z.coerce.number() 
      }))
      .mutation(async ({ input }) => {
        return await AdminSizes.createAccompanimentOption(input);
      }),

    update: adminProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await AdminSizes.updateAccompanimentOption(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await AdminSizes.deleteAccompanimentOption(input.id);
      }),
  }),

  // 4. VÍNCULOS (Configura quais grupos aparecem em quais tamanhos)
  getAccompanimentGroups: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB Offline" });

    const [rows]: any = await db.execute(sql`
      SELECT size_id as sizeId, accompaniment_group_id as groupId FROM size_accompaniment_groups
    `);
    return Array.isArray(rows) ? rows : [];
  }),

  addAccompanimentGroup: adminProcedure
    .input(z.object({ sizeId: z.coerce.number(), groupId: z.coerce.number() }))
    .mutation(async ({ input }) => {
      return await AdminSizes.linkAccompanimentToSize(input);
    }),

  removeAccompanimentGroup: adminProcedure
    .input(z.object({ sizeId: z.coerce.number(), groupId: z.coerce.number() }))
    .mutation(async ({ input }) => {
      return await AdminSizes.unlinkAccompanimentFromSize(input.sizeId, input.groupId);
    }),
});