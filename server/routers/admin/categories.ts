import { router, adminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { categories } from "../../../drizzle/schema/index.js";
import { eq, asc } from "drizzle-orm";

/**
 * Roteador de Categorias (Admin)
 * Rota: admin.categories.list | admin.categories.upsert
 */
export const adminCategoriesRouter = router({
  // Lista todas as categorias ordenadas pela ordem de exibição definida
  list: adminProcedure.query(async () => {
    const db = await getDb();
    return await db.select()
      .from(categories)
      .orderBy(asc(categories.displayOrder));
  }),

  // Cria ou Atualiza uma categoria
  upsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1, "O nome da categoria é obrigatório"),
      allowAccompaniments: z.boolean().default(true),
      isActive: z.boolean().default(true),
      displayOrder: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Gerador simples de slug (Ex: "Pratos Feitos" -> "pratos-feitos")
      const slug = input.name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-');

      const data = { 
        name: input.name, 
        slug: slug,
        allowAccompaniments: input.allowAccompaniments,
        isActive: input.isActive,
        displayOrder: input.displayOrder ?? 0,
        updatedAt: new Date() 
      };

      if (input.id) {
        // Modo Edição
        await db.update(categories)
          .set(data)
          .where(eq(categories.id, input.id));
      } else {
        // Modo Criação
        await db.insert(categories).values({
          ...data,
          createdAt: new Date()
        } as any);
      }
      
      return { success: true };
    }),

  // Adicionei a rota de Delete por conveniência (CRUD completo)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(categories).where(eq(categories.id, input.id));
      return { success: true };
    }),
});