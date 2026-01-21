import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { paymentMethods } from "../../../drizzle/schema/index.js";
import { eq, sql } from "drizzle-orm";

export const adminPaymentMethodsRouter = router({
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(paymentMethods).orderBy(sql`display_order ASC`);
  }),

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
      // Ajustado para usar as chaves do Schema (CamelCase)
      await db.insert(paymentMethods).values({
        name: input.name,
        isActive: input.isActive, // Schema: isActive
        brandName: input.brand_name, // Schema: brandName
        brandLogoUrl: input.brand_logo_url, // Schema: brandLogoUrl
        description: input.description,
        icon: input.icon,
        discountPercentage: String(input.discount_percentage), // Schema: discountPercentage
      } as any);
      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.coerce.string(),
      
      name: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      brand_name: z.string().optional().nullable(),
      brandName: z.string().optional().nullable(),
      brand_logo_url: z.string().optional().nullable(),
      brandLogoUrl: z.string().optional().nullable(),
      icon: z.string().optional().nullable(),
      discount_percentage: z.coerce.number().optional().nullable(),
      discountPercentage: z.coerce.number().optional().nullable(),
      isActive: z.any().optional(), 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Normalização
      const finalName = input.name;
      const finalDesc = input.description;
      const finalBrand = input.brand_name ?? input.brandName;
      const finalLogo = input.brand_logo_url ?? input.brandLogoUrl;
      const finalIcon = input.icon;
      const finalDiscount = input.discount_percentage ?? input.discountPercentage;
      
      // ⚠️ CORREÇÃO CRÍTICA: Usando chaves CamelCase do Schema
      const updateData: any = {};
      
      if (finalName !== undefined) updateData.name = finalName;
      if (finalDesc !== undefined) updateData.description = finalDesc;
      
      // Drizzle espera 'brandName', não 'brand_name'
      if (finalBrand !== undefined) updateData.brandName = finalBrand;
      if (finalLogo !== undefined) updateData.brandLogoUrl = finalLogo;
      if (finalIcon !== undefined) updateData.icon = finalIcon;
      if (finalDiscount !== undefined) updateData.discountPercentage = String(finalDiscount);
      
      if (input.isActive !== undefined) {
        // O Schema espera 'isActive' (booleano ou número dependendo da config)
        // Se no log apareceu isActive: true, o Drizzle trata a conversão.
        // Vamos mandar o boolean ou number, o Drizzle resolve.
        updateData.isActive = input.isActive ? 1 : 0;
      }

      // Se seu schema usa snake_case para updated_at, mantenha. 
      // Se no log apareceu updated_at, então é snake_case mesmo.
      updateData.updated_at = new Date();


      if (Object.keys(updateData).length > 1) {
        const [result]: any = await db.update(paymentMethods)
          .set(updateData)
          .where(eq(paymentMethods.id, input.id));
          
        console.log("📊 [RESULTADO] Linhas afetadas:", result.affectedRows);
      }

      const [confimacao] = await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, input.id));

      console.log("👀 [VERIFICAÇÃO] Valor no banco:", confimacao);

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.coerce.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(paymentMethods).where(eq(paymentMethods.id, input.id));
      return { success: true };
    }),
});