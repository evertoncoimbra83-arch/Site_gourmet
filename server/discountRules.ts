import { eq, desc } from "drizzle-orm"; 
import { getDb } from "./db";
import { discountRules } from "../drizzle/schema"; 
import { z } from "zod";

// -------------------------------------------------------------
// ESQUEMA DE VALIDAÇÃO (ZOD)
// -------------------------------------------------------------
export const discountRuleInput = z.object({
  id: z.coerce.number().optional(), 
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().max(512).optional().nullable(),
  minQuantity: z.coerce.number().min(1),
  maxQuantity: z.coerce.number().optional().nullable(),
  type: z.enum(["percentage", "fixed"]), 
  value: z.coerce.number().min(0),       
  priority: z.coerce.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

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
      id: Number(rule.id), 
      minQuantity: Number(rule.minQuantity),
      // ✅ MAPEAMENTO: Traduz o que vem do banco para o que o front espera
      type: rule.discountType,
      value: Number(rule.discountValue),
      isActive: Boolean(rule.isActive),
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao listar regras de desconto:", errorMessage);
    return []; 
  }
}

/**
 * CRIAR REGRA
 */
export async function createDiscountRule(data: z.infer<typeof discountRuleInput>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Removido try/catch inútil (no-useless-catch)
  await db.insert(discountRules).values({
    name: data.name,
    description: data.description ?? null,
    minQuantity: data.minQuantity,
    maxQuantity: data.maxQuantity ?? null,
    discountType: data.type,         
    discountValue: data.value.toString(), 
    priority: data.priority ?? 0,
    isActive: data.isActive,
  });

  return { success: true };
}

/**
 * ATUALIZAR REGRA
 */
export async function updateDiscountRule(id: number, data: z.infer<typeof discountRuleInput>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(discountRules)
    .set({
      name: data.name,
      description: data.description ?? null,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity ?? null,
      discountType: data.type,        
      discountValue: data.value.toString(), 
      priority: data.priority ?? 0,
      isActive: data.isActive,
      updatedAt: new Date()
    })
    .where(eq(discountRules.id, id)); 

  return { success: true };
}

/**
 * DELETAR REGRA
 */
export async function deleteDiscountRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(discountRules).where(eq(discountRules.id, id));
  return { success: true };
}