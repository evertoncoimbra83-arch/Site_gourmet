import { router, adminProcedure } from "../../_core/trpc.js"; 
import { z } from "zod";
import { getDb } from "../../db.js";
import { desc, sql } from "drizzle-orm";
import { referrals, orders } from "../../../drizzle/schema/index.js";
import { nanoid } from "nanoid";

// ✅ Tipagem do Drizzle para inserção
type ReferralInsert = typeof referrals.$inferInsert;

/**
 * 🤝 Roteador de Indicações e Parceiros (Nutris/Influencers)
 */
export const adminReferralRouter = router({
  
  // 📝 LISTAR TODOS OS PARCEIROS
  listPartners: adminProcedure.query(async () => {
    const db = await getDb();
    return await db
      .select()
      .from(referrals)
      .orderBy(desc(referrals.createdAt));
  }),

  // ➕ CRIAR OU ATUALIZAR PARCEIRO
  upsertPartner: adminProcedure
    .input(z.object({
      id: z.string().optional().nullable(),
      code: z.string().min(3),
      name: z.string(),
      type: z.string().default("nutri"),
      commissionRate: z.string().default("0.00"),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = input.id || nanoid(); 
      const code = input.code.toUpperCase();

      const payload: ReferralInsert = {
        id,
        code,
        name: input.name,
        type: input.type,
        commissionRate: input.commissionRate,
        isActive: input.isActive
      };

      // ✅ Upsert tipado para MySQL
      await db.insert(referrals)
        .values(payload)
        .onDuplicateKeyUpdate({
          set: {
            name: input.name,
            type: input.type,
            commissionRate: input.commissionRate,
            isActive: input.isActive,
          }
        });

      return { 
        success: true,
        message: `Parceiro "${input.name}" salvo com sucesso!` 
      };
    }),

  // 📊 DASHBOARD: DESEMPENHO DOS PARCEIROS
  getPerformance: adminProcedure.query(async () => {
    const db = await getDb();
    
    // Coletando estatísticas reais baseadas no código de indicação usado nos pedidos
    return await db
      .select({
        referralCode: orders.referralCode,
        totalSales: sql<number>`count(${orders.id})`.mapWith(Number),
        revenue: sql<number>`sum(${orders.total})`.mapWith(Number),
      })
      .from(orders)
      .where(sql`${orders.referralCode} IS NOT NULL`)
      .groupBy(orders.referralCode);
  }),
});