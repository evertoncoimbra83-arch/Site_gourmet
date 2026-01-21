import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { eq, desc, asc } from "drizzle-orm";
import { packages, dishes, accompanimentGroups } from "../../../drizzle/schema/index.js";
import { logAction } from "../../db/lib/audit.js";
import { nanoid } from "nanoid";

/**
 * ✅ ESQUEMA DE CONFIGURAÇÃO DOS SLOTS
 */
const packageConfigSchema = z.object({
  slots: z.array(z.object({
    name: z.string(),
    dishIds: z.array(z.union([z.string(), z.number()])),
    groups: z.array(z.object({    
      id: z.union([z.string(), z.number()]),
      customLabel: z.string().optional().nullable()
    }))
  }))
});

const parseConfig = (config: any) => {
  if (!config) return { slots: [] };
  if (typeof config === 'string') {
    try { return JSON.parse(config); } catch { return { slots: [] }; }
  }
  return config;
};

export const adminPackagesRouter = router({
  // 1) LISTAGEM
  list: adminProcedure.query(async () => {
    const db = await getDb();
    const result = await db.select().from(packages).orderBy(desc(packages.createdAt));
    
    return result.map(pkg => ({
      ...pkg,
      id: String(pkg.id),
      base_price: Number(pkg.price || 0),
      config: parseConfig(pkg.config)
    }));
  }),

  // ✅ NOVO: ATUALIZAR STATUS (OCULTAR/EXIBIR)
  updateStatus: adminProcedure
    .input(z.object({
      id: z.union([z.string(), z.number()]),
      status: z.enum(["active", "hidden"])
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      await db.update(packages)
        .set({ 
          status: input.status,
          isActive: input.status === "active" // Sincroniza isActive para compatibilidade
        })
        .where(eq(packages.id, String(input.id)));

      await logAction(ctx, "UPDATE_PACKAGE_STATUS", "packages", {
        entityId: String(input.id),
        new: { status: input.status }
      });

      return { success: true };
    }),

  // 2) DETALHES
  get: adminProcedure
    .input(z.object({ id: z.string().or(z.number()) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [pkg] = await db.select().from(packages).where(eq(packages.id, String(input.id))).limit(1);
      
      if (!pkg) throw new TRPCError({ code: 'NOT_FOUND', message: "Pacote não encontrado" });

      return { 
        ...pkg, 
        id: String(pkg.id),
        base_price: Number(pkg.price || 0),
        config: parseConfig(pkg.config)
      };
    }),

  getDishes: adminProcedure.query(async () => {
    const db = await getDb();
    const result = await db.select().from(dishes).where(eq(dishes.isActive, true)).orderBy(asc(dishes.name));
    return result.map(d => ({ id: String(d.id), name: d.name }));
  }),

  getAccompanimentGroups: adminProcedure.query(async () => {
    const db = await getDb();
    const result = await db.select().from(accompanimentGroups).orderBy(asc(accompanimentGroups.name));
    return result.map(g => ({ id: String(g.id), name: g.name }));
  }),

  // 3) CRIAÇÃO
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional().nullable(),
      image_url: z.string().optional().nullable(),
      base_price: z.coerce.string(), 
      number_of_options: z.coerce.number(),
      month: z.string().optional().nullable(),
      isActive: z.boolean().optional().default(true),
      config: packageConfigSchema 
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      try {
        const newId = nanoid();

        await db.insert(packages).values({
          id: newId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          imageUrl: input.image_url,
          price: input.base_price, 
          numberOfOptions: input.number_of_options,
          month: input.month,
          isActive: input.isActive,
          status: input.isActive ? "active" : "hidden", // Inicializa o status
          config: input.config,
        } as any);

        await logAction(ctx, "CREATE_PACKAGE", "packages", {
          entityId: newId,
          new: { name: input.name, price: input.base_price }
        });

        return { success: true, id: newId };
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
           throw new TRPCError({ code: "CONFLICT", message: "Já existe um pacote com este Slug." });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // 4) ATUALIZAÇÃO
  update: adminProcedure
    .input(z.object({
      id: z.string().or(z.number()),
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional().nullable(),
      image_url: z.string().optional().nullable(),
      base_price: z.coerce.string(),
      number_of_options: z.coerce.number(),
      month: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
      config: packageConfigSchema 
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { id, ...data } = input;

      const [old] = await db.select().from(packages).where(eq(packages.id, String(id)));
      if (!old) throw new TRPCError({ code: "NOT_FOUND", message: "Pacote não encontrado" });

      await db.update(packages).set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.image_url,
        price: data.base_price,
        numberOfOptions: data.number_of_options,
        month: data.month,
        isActive: data.isActive,
        status: data.isActive ? "active" : "hidden",
        config: data.config,
      } as any).where(eq(packages.id, String(id)));

      await logAction(ctx, "UPDATE_PACKAGE", "packages", {
        entityId: String(id),
        old: { name: old?.name },
        new: { name: data.name }
      });

      return { success: true };
    }),

  // 5) DELEÇÃO
  delete: adminProcedure
    .input(z.object({ id: z.string().or(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db.delete(packages).where(eq(packages.id, String(input.id)));
      
      await logAction(ctx, "DELETE_PACKAGE", "packages", {
        entityId: String(input.id)
      });
      
      return { success: true };
    }),
});