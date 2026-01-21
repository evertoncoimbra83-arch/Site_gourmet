import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { coupons } from "../../../drizzle/schema/index.js";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logAction } from "../../db/lib/audit.js";

const cleanDate = (val: any): Date | null => {
  if (!val || (typeof val === 'string' && val.trim() === '')) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const couponInputSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().trim(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive(), // No input do Zod mantemos camelCase
  minOrderValue: z.coerce.number().nullish().default(0),
  maxDiscount: z.coerce.number().nullish(),
  usageLimit: z.coerce.number().int().nullish(),
  validFrom: z.any().nullish(),
  validUntil: z.any().nullish(),
  description: z.string().nullish(),
  isActive: z.boolean().optional().default(true),
}).passthrough();

export const adminCouponsRouter = router({
  // 1. LISTAGEM
  list: adminProcedure.query(async () => {
    const db = await getDb();
    try {
      const result = await db.select().from(coupons).orderBy(desc(coupons.id));
      
      return result.map(c => ({
        ...c,
        id: String(c.id),
        // ✅ CORREÇÃO: Usando 'discount_value' que é o nome real no seu banco
        discountValue: Number(c.discount_value || 0), 
        minOrderValue: Number(c.minOrderValue || 0),
        isActive: Boolean(c.isActive)
      }));
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar cupons." });
    }
  }),

  // 2. CRIAÇÃO
  create: adminProcedure
    .input(couponInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      const [existing] = await db.select().from(coupons).where(eq(coupons.code, input.code));
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este código de cupom já existe." });

      try {
        const insertData: any = {
          code: input.code,
          description: input.description,
          discountType: input.discountType,
          // ✅ CORREÇÃO: Mapeando para o nome da coluna no banco
          discount_value: input.discountValue.toFixed(2), 
          minOrderValue: input.minOrderValue?.toFixed(2) || "0.00",
          maxDiscount: input.maxDiscount?.toFixed(2) || null,
          usageLimit: input.usageLimit,
          isActive: Boolean(input.isActive),
          validFrom: cleanDate(input.validFrom),
          validUntil: cleanDate(input.validUntil),
        };

        const [result]: any = await db.insert(coupons).values(insertData);

        await logAction(ctx, "CREATE_COUPON", "coupons", {
          entityId: input.code,
          new: { code: input.code, valor: input.discountValue }
        });

        return { success: true, id: result.insertId };
      } catch (error: any) {
        console.error("❌ Erro no Drizzle:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cupom." });
      }
    }),

  // 3. ATUALIZAÇÃO
  update: adminProcedure
    .input(z.object({ id: z.string().or(z.number()) }).passthrough())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { id, ...data } = input;

      const [oldCoupon] = await db.select().from(coupons).where(eq(coupons.id, id as any));
      if (!oldCoupon) throw new TRPCError({ code: "NOT_FOUND", message: "Cupom não encontrado." });

      const updatePayload: any = { updatedAt: new Date() };
      
      if (data.code !== undefined) updatePayload.code = String(data.code).toUpperCase();
      // ✅ CORREÇÃO: Mapeando para 'discount_value'
      if (data.discountValue !== undefined) updatePayload.discount_value = Number(data.discountValue).toFixed(2);
      if (data.isActive !== undefined) updatePayload.isActive = Boolean(data.isActive);
      if (data.validFrom !== undefined) updatePayload.validFrom = cleanDate(data.validFrom);
      if (data.validUntil !== undefined) updatePayload.validUntil = cleanDate(data.validUntil);

      try {
        await db.update(coupons)
          .set(updatePayload)
          .where(eq(coupons.id, id as any));

        await logAction(ctx, "UPDATE_COUPON", "coupons", {
          entityId: id,
          old: { code: oldCoupon?.code },
          new: updatePayload
        });

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar cupom." });
      }
    }),

  // 4. DELEÇÃO
  delete: adminProcedure
    .input(z.object({ id: z.string().or(z.number()) })) 
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      try {
        const [coupon] = await db.select().from(coupons).where(eq(coupons.id, input.id as any));
        if (!coupon) return { success: true };

        await db.delete(coupons).where(eq(coupons.id, input.id as any));
        
        await logAction(ctx, "DELETE_COUPON", "coupons", {
          entityId: input.id,
          old: { code: coupon?.code }
        });

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar cupom." });
      }
    }),
});