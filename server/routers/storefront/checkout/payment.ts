import { router, publicProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { paymentMethods } from "../../../../drizzle/schema/index.js";
import { eq, and, like, or, asc } from "drizzle-orm";

export const paymentRouter = router({
  
  /**
   * ✅ getMethods: Busca métodos GERAIS
   */
  getMethods: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const methods = await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.isActive, true))
        .orderBy(asc(paymentMethods.displayOrder));

      const mainMethods = methods.filter(m => {
        const nameLower = (m.name || "").toLowerCase();
        return !nameLower.includes("alelo") && 
               !nameLower.includes("sodexo") && 
               !nameLower.includes("ticket") &&
               !nameLower.includes("vr refeição") &&
               !nameLower.includes("ben ");
      });

      return mainMethods.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description || "",
        icon: m.icon || null
      }));
    } catch {
      return [];
    }
  }),

  /**
   * ✅ getFoodCardBrands: Busca bandeiras de VA/VR
   */
  getFoodCardBrands: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const brands = await db.select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.isActive, true),
            or(
              like(paymentMethods.name, '%Alimentação%'),
              like(paymentMethods.name, '%Refeição%'),
              like(paymentMethods.name, '%Alelo%'),
              like(paymentMethods.name, '%Sodexo%'),
              like(paymentMethods.name, '%Ticket%'),
              like(paymentMethods.name, '%Ben %'),
              like(paymentMethods.name, '%VR%'),
              like(paymentMethods.name, '%Caju%'),
              like(paymentMethods.name, '%Flash%')
            )
          )
        )
        .orderBy(asc(paymentMethods.displayOrder));

      return brands.map(b => {
        const fullName = (b.name + " " + (b.description || "")).toLowerCase();
        
        let type = 'va'; 
        if (fullName.includes('refeição') || fullName.includes('vr')) {
          type = 'vr';
        }

        // ✅ CORREÇÃO: Usamos unknown em vez de any para satisfazer o ESLint
        const brand = b as Record<string, unknown>;

        return {
          id: b.id,
          name: (brand.brandName as string) || b.name, 
          logoUrl: (brand.brandLogoUrl as string) || b.icon,
          type: type 
        };
      });

    } catch {
      return [];
    }
  })
});