import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { paymentMethods } from "../../../drizzle/schema/index.js";
import { eq, asc } from "drizzle-orm"; // ✅ CORREÇÃO: 'sql' removido e 'asc' adicionado

// Tipagem inferida para inserção
type PaymentMethodInsert = typeof paymentMethods.$inferInsert;

export const adminPaymentMethodsRouter = router({
  // --- LISTAGEM ---
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    // Ordenação por nome usando o helper nativo do Drizzle
    return await db.select().from(paymentMethods).orderBy(asc(paymentMethods.name));
  }),

  /**
   * ✅ CRIAÇÃO
   */
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      isActive: z.boolean().optional().default(true),
      brand_name: z.string().optional().nullable(),
      brand_logo_url: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      icon: z.string().optional().nullable(),
      discount_percentage: z.coerce.number().optional().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // ✅ CORREÇÃO ESLint: Usando Record para evitar 'any'
      const payload: Record<string, unknown> = {
        name: input.name,
        isActive: input.isActive, 
        brandName: input.brand_name,
        brandLogoUrl: input.brand_logo_url,
        description: input.description,
        icon: input.icon,
        discountPercentage: String(input.discount_percentage),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Inserção com cast seguro para o Schema
      const [res] = await db.insert(paymentMethods).values(payload as PaymentMethodInsert) as unknown as [{ insertId: number }];

      return { 
        success: true, 
        id: res.insertId,
        message: `Método "${input.name}" cadastrado!` 
      };
    }),

  /**
   * ✅ ATUALIZAÇÃO
   */
  update: adminProcedure
    .input(z.object({
      id: z.coerce.number(),
      name: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      brandName: z.string().optional().nullable(),
      brand_name: z.string().optional().nullable(),
      brandLogoUrl: z.string().optional().nullable(),
      brand_logo_url: z.string().optional().nullable(),
      icon: z.string().optional().nullable(),
      discountPercentage: z.coerce.number().optional().nullable(),
      discount_percentage: z.coerce.number().optional().nullable(),
      isActive: z.boolean().optional().nullable(), 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // ✅ CORREÇÃO ESLint: Tipagem robusta para o objeto de update
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      
      // Tratando variações de nomes vindas do front (Snake vs Camel)
      const brandName = input.brandName ?? input.brand_name;
      if (brandName !== undefined) updateData.brandName = brandName;
      
      const brandLogo = input.brandLogoUrl ?? input.brand_logo_url;
      if (brandLogo !== undefined) updateData.brandLogoUrl = brandLogo;
      
      if (input.icon !== undefined) updateData.icon = input.icon;
      
      const discount = input.discountPercentage ?? input.discount_percentage;
      if (discount !== undefined) updateData.discountPercentage = String(discount);
      
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db.update(paymentMethods)
        .set(updateData as Partial<PaymentMethodInsert>)
        .where(eq(paymentMethods.id, String(input.id)));

      return { 
        success: true, 
        message: "Método atualizado com sucesso!" 
      };
    }),

  /**
   * ✅ EXCLUSÃO
   */
  delete: adminProcedure
    .input(z.object({ id: z.coerce.number(), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(paymentMethods).where(eq(paymentMethods.id, String(input.id)));
      
      return { 
        success: true, 
        message: input.name ? `"${input.name}" removido.` : "Excluído com sucesso." 
      };
    }),
});