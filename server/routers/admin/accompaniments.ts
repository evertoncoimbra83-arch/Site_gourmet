import { adminProcedure, router } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { 
  accompanimentGroups, 
  accompanimentOptions, 
  accompanimentCategories 
} from "../../../drizzle/schema/catalog.js"; 
import { eq, asc, desc, sql } from "drizzle-orm";
import { adminSizesRouter } from "./sizes.js";

const generateSlug = (text: string) => 
  text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

/**
 * 🥗 ACCOMPANIMENTS ROUTER
 * Este roteador centraliza Categorias, Grupos, Opções e Tamanhos.
 */
export const adminAccompanimentsRouter = router({
  
  dishSizes: adminSizesRouter,

  // ===================================================================
  // ✅ CATEGORIAS (Proteína, Legumes, etc.)
  // ===================================================================
  categories: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      return await db.select().from(accompanimentCategories).orderBy(asc(accompanimentCategories.displayOrder));
    }),

    upsert: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Nome é obrigatório"),
        iconKey: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        displayOrder: z.number().default(0),
        isActive: z.boolean().default(true)
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...data } = input;
        const payload = { ...data, updatedAt: new Date() };

        if (id) {
          await db.update(accompanimentCategories).set(payload).where(eq(accompanimentCategories.id, id));
        } else {
          await db.insert(accompanimentCategories).values({ ...payload, createdAt: new Date() });
        }
        return { success: true };
      }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      return await db.delete(accompanimentCategories).where(eq(accompanimentCategories.id, input.id));
    }),
  }),

  // ===================================================================
  // ✅ GRUPOS (Slots de Escolha com Drag & Drop JSON)
  // ===================================================================
  groups: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      return await db.select().from(accompanimentGroups).orderBy(desc(accompanimentGroups.id));
    }),

    // Especialmente para atualizações rápidas (como a nova ordem do Drag & Drop)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional().nullable(),
        maxSelections: z.number().optional(),
        minSelections: z.number().optional(),
        isActive: z.boolean().optional(),
        itemsOrder: z.array(z.number()).optional(), // ✅ Suporte ao JSON de IDs
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...data } = input;
        await db.update(accompanimentGroups)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(accompanimentGroups.id, id));
        return { success: true };
      }),

    upsert: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Nome é obrigatório"),
        description: z.string().optional().nullable(),
        maxSelections: z.number().min(1).default(1),
        minSelections: z.number().default(0),
        isActive: z.boolean().default(true),
        itemsOrder: z.array(z.number()).optional()
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...rest } = input;
        const data = {
          ...rest,
          description: rest.description || "",
          updatedAt: new Date()
        };

        if (id) {
          await db.update(accompanimentGroups).set(data).where(eq(accompanimentGroups.id, id));
        } else {
          await db.insert(accompanimentGroups).values({ 
            ...data, 
            slug: generateSlug(input.name),
            createdAt: new Date() 
          });
        }
        return { success: true };
      }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      return await db.delete(accompanimentGroups).where(eq(accompanimentGroups.id, input.id));
    }),
  }),

  // ===================================================================
  // ✅ OPÇÕES (Itens individuais do Banco Master)
  // ===================================================================
  options: router({
    listAll: adminProcedure.query(async () => {
      const db = await getDb();
      return await db.select().from(accompanimentOptions).orderBy(asc(accompanimentOptions.name));
    }),

    listByGroup: adminProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return await db.select()
          .from(accompanimentOptions)
          .where(sql`JSON_CONTAINS(groups_config, JSON_OBJECT('group_id', ${input.groupId}))`)
          .orderBy(asc(accompanimentOptions.displayOrder));
      }),

    upsert: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        accompanimentCategoryId: z.number().optional().nullable(),
        groupsConfig: z.union([z.array(z.any()), z.string()]).optional().default([]),
        isActive: z.boolean().optional().default(true),
        displayOrder: z.number().optional().default(0),
        showNutrition: z.boolean().optional().default(false),
        
        // ✅ ADICIONADO: Colunas individuais para bater com o Schema e resolver erro 2353
        energyKcal: z.number().optional().nullable(),
        proteins: z.union([z.string(), z.number()]).optional().nullable(),
        carbs: z.union([z.string(), z.number()]).optional().nullable(),
        fatTotal: z.union([z.string(), z.number()]).optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        
        const rawConfig = typeof input.groupsConfig === 'string' 
          ? JSON.parse(input.groupsConfig) 
          : input.groupsConfig;

        const cleanGroupsConfig = (rawConfig || []).map((g: any) => ({
          group_id: Number(g.group_id),
          price_modifier: String(g.price_modifier || "0.00")
        }));

        const { id, ...rest } = input;
        
        // Garantimos que os valores decimais sejam salvos como string para o MySQL
        const data = {
          ...rest,
          groupsConfig: cleanGroupsConfig,
          proteins: rest.proteins ? String(rest.proteins) : null,
          carbs: rest.carbs ? String(rest.carbs) : null,
          fatTotal: rest.fatTotal ? String(rest.fatTotal) : null,
          updatedAt: new Date()
        };

        if (id) {
          await db.update(accompanimentOptions).set(data).where(eq(accompanimentOptions.id, id));
        } else {
          await db.insert(accompanimentOptions).values({ 
            ...data, 
            slug: generateSlug(input.name),
            createdAt: new Date() 
          });
        }
        return { success: true };
      }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      return await db.delete(accompanimentOptions).where(eq(accompanimentOptions.id, input.id));
    }),
  }),
});