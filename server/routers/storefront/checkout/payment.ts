import { router, publicProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js"
import { paymentMethods } from "drizzle/schema/index.js"; 
import { eq, and, like, or, asc } from "drizzle-orm";

export const paymentRouter = router({
  
  /**
   * ✅ Busca métodos de pagamento GERAIS (Crédito, Débito, Pix, Dinheiro)
   * Filtramos para não trazer os Vales aqui, pois eles aparecem na sub-seção
   */
  getMethods: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      
      const methods = await db.select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.isActive, true), // Apenas ativos
            // Opcional: Filtra para não trazer os Vales na lista principal se quiser
            // ou traz tudo e o frontend decide. Vamos trazer tudo ordenado.
          )
        )
        .orderBy(asc(paymentMethods.displayOrder));

      // Filtramos apenas os "Tipos" principais para a lista de cima
      // Excluímos marcas específicas de VA/VR para não poluir a lista principal
      const mainMethods = methods.filter(m => {
        const nameLower = m.name.toLowerCase();
        // Se for uma marca específica (Alelo, Sodexo), ignoramos aqui (vão para a lista de baixo)
        return !nameLower.includes("alelo") && 
               !nameLower.includes("sodexo") && 
               !nameLower.includes("ticket") &&
               !nameLower.includes("vr refeição");
      });

      return mainMethods.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description || "",
        icon: m.icon || null
      }));
    } catch (error) {
      console.error("Erro ao buscar métodos:", error);
      return [];
    }
  }),

  /**
   * ✅ Busca APENAS as bandeiras de VA/VR
   * Baseado no nome ou descrição contendo palavras-chave
   */
  getFoodCardBrands: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      
      // Busca métodos que pareçam ser Vale Alimentação ou Refeição
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
              like(paymentMethods.name, '%Ben%'),
              like(paymentMethods.name, '%VR%')
            )
          )
        )
        .orderBy(asc(paymentMethods.displayOrder));

      return brands.map(b => {
        const fullName = (b.name + " " + (b.description || "")).toLowerCase();
        
        // Lógica para definir se é VA ou VR baseado no nome
        let type = 'va'; // Padrão
        if (fullName.includes('refeição') || fullName.includes('vr')) {
          type = 'vr';
        }

        return {
          id: b.id,
          // Usa o brand_name se existir, senão usa o name normal
          name: b.brandName || b.name, 
          // Usa o brand_logo_url se existir, senão o icon normal
          logoUrl: b.brandLogoUrl || b.icon,
          type: type // 'va' ou 'vr'
        };
      });

    } catch (error) {
      console.error("Erro ao buscar bandeiras:", error);
      return [];
    }
  })
}); 