import { router, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { discountRules } from "../../../drizzle/schema/index.js";
import { eq, asc } from "drizzle-orm";

/**
 * 🎯 Lógica de busca de regras de desconto progressivo.
 * Centralizamos aqui para garantir que queries legadas e novas usem a mesma base.
 */
const fetchRulesLogic = async () => {
  const db = await getDb();
  if (!db) return [];

  try {
    // 🔍 Busca regras ativas e ordena pela escada de quantidade
    const rules = await db
      .select()
      .from(discountRules)
      .where(eq(discountRules.isActive, true))
      .orderBy(asc(discountRules.minQuantity));
    
    return rules.map((rule) => ({
      ...rule,
      // Normalização de tipos para o Frontend (Numbers puros)
      discountValue: Number(rule.discountValue || 0), 
      minQuantity: Number(rule.minQuantity || 0),
      // Adicionamos um rótulo amigável caso o banco não tenha (ex: "5% OFF")
      label: rule.name || `${Number(rule.discountValue)}% OFF`
    }));
  } catch {
    // ✅ Removido 'error' não utilizado para satisfazer o ESLint
    return [];
  }
};

export const discountsRouter = router({
  /**
   * 🛒 getDiscountRules
   * Essencial para o componente de progresso no carrinho.
   */
  getDiscountRules: publicProcedure.query(async () => {
    return await fetchRulesLogic();
  }),

  /**
   * 🔄 getActiveRules (Compatibilidade)
   */
  getActiveRules: publicProcedure.query(async () => {
    return await fetchRulesLogic();
  }),
});