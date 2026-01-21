import { eq, desc } from "drizzle-orm"; 
import { getDb } from "./db.js";
import { discountRules } from "../drizzle/schema.js"; 
import { z } from "zod";

// -------------------------------------------------------------
// ESQUEMA DE VALIDAÇÃO (ZOD)
// -------------------------------------------------------------

export const discountRuleInput = z.object({
  // ✅ Agora forçamos o ID a ser um número (ou convertido para número)
  id: z.coerce.number().optional(), 
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().max(512).optional().nullable(),
  minQuantity: z.coerce.number().min(1),
  maxQuantity: z.coerce.number().optional().nullable(),
  discountType: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().min(0),
  priority: z.coerce.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// -------------------------------------------------------------
// FUNÇÕES DE SERVIÇO (CRUD)
// -------------------------------------------------------------

/**
 * LISTAR REGRAS
 */
export async function listDiscountRules() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não inicializado");

  try {
    const rules = await db.select().from(discountRules).orderBy(desc(discountRules.id));
    
    return rules.map(rule => ({
      ...rule,
      // ✅ Mantemos como número internamente
      id: Number(rule.id), 
      minQuantity: Number(rule.minQuantity),
      discount_value: Number(rule.discount_value),
      isActive: Boolean(rule.isActive),
    }));
  } catch (error: any) {
    console.error("❌ ERRO AO LISTAR:", error.message);
    return []; 
  }
}

/**
 * CRIAR REGRA
 */
export async function createDiscountRule(data: z.infer<typeof discountRuleInput>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // ✅ No INSERT, NÃO enviamos o ID (MySQL gerencia o AUTO_INCREMENT)
    await db.insert(discountRules).values({
      name: data.name,
      description: data.description ?? null,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity ?? null,
      discountType: data.discountType,
      discount_value: data.discount_value.toString(),
      priority: data.priority ?? 0,
      isActive: data.isActive,
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ ERRO NO INSERT:", error.message);
    throw error;
  }
}

/**
 * ATUALIZAR REGRA
 */
export async function updateDiscountRule(id: number, data: z.infer<typeof discountRuleInput>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // ✅ Certifique-se de passar o ID como NUMBER para o eq()
    await db.update(discountRules)
      .set({
        name: data.name,
        description: data.description ?? null,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity ?? null,
        discountType: data.discountType,
        discount_value: data.discount_value.toString(),
        priority: data.priority ?? 0,
        isActive: data.isActive,
        updated_at: new Date()
      })
      .where(eq(discountRules.id, id)); 

    return { success: true };
  } catch (error: any) {
    console.error("❌ ERRO NO UPDATE:", error.message);
    throw error;
  }
}

/**
 * DELETAR REGRA
 */
export async function deleteDiscountRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // ✅ O ID aqui deve ser number
    await db.delete(discountRules).where(eq(discountRules.id, id));
    return { success: true };
  } catch (error: any) {
    console.error("❌ ERRO AO DELETAR:", error.message);
    throw error;
  }
}