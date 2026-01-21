import { router, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { discountRules } from "../../../drizzle/schema/index.js";
import { eq, asc } from "drizzle-orm";

/**
 * Lógica centralizada para buscar regras de desconto progressivo.
 * Alinhada com o Schema que mapeia:
 * 'type'  -> discountType
 * 'value' -> discountValue
 */
const fetchRulesLogic = async () => {
  const db = await getDb();
  if (!db) return [];

  try {
    // 🔍 Busca as regras e as ordena pelo gatilho de quantidade (min_quantity)
    const rules = await db
      .select()
      .from(discountRules)
      .where(eq(discountRules.isActive, true))
      .orderBy(asc(discountRules.minQuantity));
    
    // O Drizzle faz o "cast" automático baseado no Schema
    return rules.map((rule) => ({
      ...rule,
      // Garantimos que os valores saiam como números para o Frontend não quebrar
      discountValue: Number(rule.discountValue || 0), 
      minQuantity: Number(rule.minQuantity || 0)
    }));
  } catch (error) {
    // 🛡️ Se houver qualquer erro de coluna, retornamos vazio para não travar a Home
    console.error("❌ [DISCOUNTS] Erro ao buscar regras de desconto:", error);
    return [];
  }
};

export const discountsRouter = router({
  /**
   * 🛒 getDiscountRules
   * Utilizada pelo componente DiscountRoadmap para mostrar o progresso no carrinho.
   */
  getDiscountRules: publicProcedure.query(async () => {
    return await fetchRulesLogic();
  }),

  /**
   * 🔄 getActiveRules (Legada)
   * Mantida para compatibilidade com partes antigas do sistema.
   */
  getActiveRules: publicProcedure.query(async () => {
    return await fetchRulesLogic();
  }),
});