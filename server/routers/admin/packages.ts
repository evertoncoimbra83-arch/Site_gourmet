// router/admin/packages.ts
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { eq, desc, asc } from "drizzle-orm";
import {
  packages,
  dishes,
  dishSizes,
  dishesToSizes,
  categories,
  accompanimentOptions,
} from "../../../drizzle/schema/index.js";
import { nanoid } from "nanoid";
import { logAction } from "../../db/lib/audit.js";
import { safeJsonParse, safeNumber } from "../../lib/safe-parse.js";

const packageConfigSchema = z.object({
  slots: z.array(z.object({
    name: z.string(),
    sizeId: z.union([z.string(), z.number()]).nullable().optional(),
    dishIds: z.array(z.union([z.string(), z.number()])),
    groups: z.array(z.object({
      id: z.union([z.string(), z.number()]),
      customLabel: z.string().default("Acompanhamento"),
      optionIds: z.array(z.union([z.string(), z.number()])).optional().default([])

    }))
  }))
});

type PackageConfig = z.infer<typeof packageConfigSchema>;

const parseConfig = (config: unknown): PackageConfig => {
  if (!config) return { slots: [] };
  return safeJsonParse<PackageConfig>(config, { slots: [] });
};

const requireMoneyString = (value: unknown, label: string): string => {
  const amount = safeNumber(value, Number.NaN);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${label} invÃ¡lido.` });
  }
  return amount.toFixed(2);
};

export const adminPackagesRouter = router({
  // 1. LISTAGEM
  list: adminProcedure.query(async () => {
    const db = await getDb();
    const result = await db
      .select()
      .from(packages)
      .orderBy(asc(packages.displayOrder), desc(packages.createdAt));

    return result.map(pkg => ({
      ...pkg,
      id: String(pkg.id),
      base_price: pkg.price ? safeNumber(pkg.price) : 0,
      sale_price: pkg.salePrice ? safeNumber(pkg.salePrice) : null,
      image_url: pkg.imageUrl || "",
      size_id: pkg.sizeId,
      number_of_options: pkg.numberOfOptions || 0,
      display_order: pkg.displayOrder || 0,
      config: parseConfig(pkg.config),
      highlights: pkg.highlights || "",
      category: pkg.category || "",
      is_popular: Boolean(pkg.isPopular),
    }));
  }),

  // 2. TAMANHOS
  getAvailableSizes: adminProcedure.query(async () => {
    const db = await getDb();
    return await db
      .select({
        id: dishSizes.id,
        name: dishSizes.name,
        defaultMainWeight: dishSizes.mainDishWeight,
      })
      .from(dishSizes)
      .where(eq(dishSizes.isActive, true))
      .orderBy(asc(dishSizes.displayOrder));
  }),

  // ✅ 3. PRATOS — agora inclui sizeIds via join com dishes_to_sizes
  getDishes: adminProcedure.query(async () => {
    const db = await getDb();

    // Busca pratos com categoria
    const dishRows = await db
      .select({
        id: dishes.id,
        name: dishes.name,
        basePrice: dishes.basePrice,
        categoryId: dishes.categoryId,
        categoryName: categories.name,
        isVegetarian: dishes.isVegetarian,
        isGlutenFree: dishes.isGlutenFree,
        isLactoseFree: dishes.isLactoseFree,
        proteins: dishes.proteins,
        carbs: dishes.carbs,
        energyKcal: dishes.energyKcal,
        fatTotal: dishes.fatTotal,
        fiber: dishes.fiber,
        sodium: dishes.sodium,
      })
      .from(dishes)
      .leftJoin(categories, eq(dishes.categoryId, categories.id))
      .where(eq(dishes.isActive, true))
      .orderBy(asc(dishes.name));

    // Busca todos os vínculos dish → size de uma vez só (sem N+1)
    const sizeLinks = await db
      .select({
        dishId: dishesToSizes.dishId,
        sizeId: dishesToSizes.sizeId,
      })
      .from(dishesToSizes);

    // Agrupa sizeIds por dishId
    const sizeMap = new Map<number, string[]>();
    for (const link of sizeLinks) {
      const key = link.dishId;
      if (!sizeMap.has(key)) sizeMap.set(key, []);
      sizeMap.get(key)!.push(String(link.sizeId));
    }

    return dishRows.map(d => ({
      id: String(d.id),
      name: d.name,
      basePrice: safeNumber(d.basePrice),
      categoryId: d.categoryId ? String(d.categoryId) : null,
      categoryName: d.categoryName || "Sem Categoria",
      // ✅ sizeIds: array com os tamanhos disponíveis para este prato
      sizeIds: sizeMap.get(d.id) ?? [],
      isVegetarian: Boolean(d.isVegetarian),
      isGlutenFree: Boolean(d.isGlutenFree),
      isLactoseFree: Boolean(d.isLactoseFree),
      proteins: safeNumber(d.proteins),
      carbs: safeNumber(d.carbs),
      energyKcal: safeNumber(d.energyKcal),
      fatTotal: safeNumber(d.fatTotal),
      fiber: safeNumber(d.fiber),
      sodium: safeNumber(d.sodium),
    }));
  }),

  // 4. ACOMPANHAMENTOS
  getAllAccompanimentOptions: adminProcedure.query(async () => {
    const db = await getDb();
    const result = await db
      .select()
      .from(accompanimentOptions)
      .where(eq(accompanimentOptions.isActive, true))
      .orderBy(asc(accompanimentOptions.name));

    return result.map(opt => ({
      id: String(opt.id),
      name: opt.name,
      // @ts-ignore
      price: safeNumber(opt.basePrice ?? opt.price),
    }));
  }),

  // 5. STATUS
  updateStatus: adminProcedure
    .input(z.object({
      id: z.union([z.string(), z.number()]),
      status: z.enum(["active", "hidden"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const targetId = String(input.id);
      await db.update(packages)
        .set({ status: input.status, isActive: input.status === "active" })
        .where(eq(packages.id, targetId));
      await logAction(ctx, "UPDATE_PACKAGE_STATUS", "packages", {
        entityId: targetId,
        new: { status: input.status },
      });
      return { success: true };
    }),

  // 6. CREATE
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional().nullable(),
      highlights: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      is_popular: z.boolean().optional().default(false),
      image_url: z.string().optional().nullable(),
      base_price: z.coerce.string(),
      sale_price: z.coerce.string().optional().nullable(),
      display_order: z.coerce.number().optional().default(0),
      number_of_options: z.coerce.number(),
      isActive: z.boolean().optional().default(true),
      size_id: z.coerce.number().min(1),
      config: packageConfigSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      try {
        const newId = nanoid();
        const valuesToInsert: typeof packages.$inferInsert = {
          name: input.name,
          slug: input.slug,
          price: requireMoneyString(input.base_price, "Preço"),
          description: input.description || "",
          highlights: input.highlights || "",
          category: input.category || "",
          isPopular: input.is_popular,
          imageUrl: input.image_url || "",
          salePrice: input.sale_price ? requireMoneyString(input.sale_price, "Preço promocional") : null,
          displayOrder: input.display_order,
          numberOfOptions: input.number_of_options,
          isActive: input.isActive,
          sizeId: input.size_id,
          status: input.isActive ? "active" : "hidden",
          // @ts-ignore
          config: input.config,
          id: newId,
        };
        await db.insert(packages).values(valuesToInsert);
        await logAction(ctx, "CREATE_PACKAGE", "packages", {
          entityId: newId,
          new: { name: input.name },
        });
        return { success: true, id: newId };
      } catch (error: unknown) {
        const err = error as { sqlMessage?: string };
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.sqlMessage || "Erro ao salvar." });
      }
    }),

  // 7. UPDATE
  update: adminProcedure
    .input(z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional().nullable(),
      highlights: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      is_popular: z.boolean().optional(),
      image_url: z.string().optional().nullable(),
      base_price: z.coerce.string(),
      sale_price: z.coerce.string().optional().nullable(),
      display_order: z.coerce.number().optional(),
      number_of_options: z.coerce.number(),
      isActive: z.boolean().optional(),
      size_id: z.coerce.number().min(1),
      config: packageConfigSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      const targetId = String(id);
      try {
        await db.update(packages).set({
          name: data.name,
          slug: data.slug,
          description: data.description,
          highlights: data.highlights,
          category: data.category,
          isPopular: data.is_popular,
          imageUrl: data.image_url,
          price: requireMoneyString(data.base_price, "PreÃ§o"),
          salePrice: data.sale_price ? requireMoneyString(data.sale_price, "PreÃ§o promocional") : null,
          displayOrder: data.display_order,
          numberOfOptions: data.number_of_options,
          isActive: data.isActive,
          sizeId: data.size_id,
          status: data.isActive ? "active" : "hidden",
          // @ts-ignore
          config: data.config,
        }).where(eq(packages.id, targetId));
        await logAction(ctx, "UPDATE_PACKAGE", "packages", {
          entityId: targetId,
          new: { name: data.name },
        });
        return { success: true };
      } catch (error: unknown) {
        const err = error as { sqlMessage?: string };
        throw new TRPCError({ code: "BAD_REQUEST", message: err.sqlMessage || "Erro ao atualizar." });
      }
    }),

  // 8. DELETE
  delete: adminProcedure
    .input(z.object({ id: z.union([z.string(), z.number()]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(packages).where(eq(packages.id, String(input.id)));
      return { success: true };
    }),
});
