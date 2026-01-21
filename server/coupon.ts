import { eq, sql, desc } from "drizzle-orm";
import { getDb } from "./db"; 
import { coupons, couponUsage, orders } from "../drizzle/schema"; 
import { z } from "zod";

// Tipos usados no painel/admin e no lado do cliente
export type CouponDiscountType = "percentage" | "fixed";

export interface CreateCouponInput {
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number; // Corrigido de discount_value
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  isActive?: boolean;
}

export interface UpdateCouponInput {
  description?: string | null;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  isActive?: boolean;
}

export interface ValidateCouponResult {
  isValid: boolean;
  message?: string;
  discountAmount: number;
  couponId?: string; // Alterado de coupon_id para string (conforme erro TS)
  code?: string;
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

// =========================================================================
// 1. VALIDAÇÃO E APLICAÇÃO
// =========================================================================

export async function validateCoupon(
  code: string,
  userId: string, // Alterado de number para string
  subtotal: number
): Promise<ValidateCouponResult> {
  const now = new Date();
  const db = await getDb();
  
  const couponResult = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()))
    .limit(1);

  if (!couponResult[0]) {
    return { isValid: false, message: "Cupom não encontrado", discountAmount: 0 };
  }

  const coupon = couponResult[0];

  if (!coupon.isActive) {
    return { isValid: false, message: "Cupom inativo", discountAmount: 0 };
  }

  if (coupon.validFrom && new Date(coupon.validFrom) > now) {
    return { isValid: false, message: "Cupom ainda não está válido", discountAmount: 0 };
  }
  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    return { isValid: false, message: "Cupom expirado", discountAmount: 0 };
  }
  
  if (coupon.minOrderValue && subtotal < toNumber(coupon.minOrderValue)) {
    return { isValid: false, message: `Valor mínimo de R$${coupon.minOrderValue} requerido.`, discountAmount: 0 };
  }

  // Verificar limite de uso geral (Corrigido para couponId)
  if (coupon.usageLimit) {
    const usageCount = await db.select({ count: sql<number>`count(*)` })
      .from(couponUsage)
      .where(eq(couponUsage.couponId, coupon.id));
      
    if (Number(usageCount[0].count) >= coupon.usageLimit) {
      return { isValid: false, message: "Limite de uso geral atingido.", discountAmount: 0 };
    }
  }
  
  // Calcular desconto
  let discountAmount = 0;
  const discountValue = toNumber(coupon.discountValue); // Corrigido
  const maxDiscount = coupon.maxDiscount ? toNumber(coupon.maxDiscount) : Infinity;

  if (coupon.discountType === "percentage") {
    discountAmount = subtotal * (discountValue / 100);
  } else if (coupon.discountType === "fixed") {
    discountAmount = discountValue;
  }
  
  discountAmount = Math.min(discountAmount, maxDiscount);
  discountAmount = Math.min(discountAmount, subtotal); 

  return {
    isValid: true,
    message: "Cupom aplicado!",
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    couponId: coupon.id,
    code: coupon.code,
  };
}

export async function applyCouponToOrder(
  orderId: string, // Alterado para string
  couponId: string, // Alterado para string
  couponCode: string, 
  discountAmount: number, 
  userId: string // Alterado para string
) {
  const db = await getDb();

  await db.insert(couponUsage).values({
    id: crypto.randomUUID(), // Assumindo que o ID é string/UUID
    couponId, // Corrigido
    userId,
    orderId,
  });

  // Atualiza o pedido com os campos corretos do seu schema
  // Nota: Verifique se os campos no schema de 'orders' são exatamente estes
  await db.update(orders).set({
    // @ts-ignore - Depende do seu schema de orders possuir estas colunas
    couponCode: couponCode,
    total: sql`total - ${discountAmount.toFixed(2)}`, 
    updatedAt: new Date(),
  }).where(eq(orders.id, orderId));

  return { success: true };
}

export async function removeCouponFromOrder(orderId: string) {
  const db = await getDb();
  await db.delete(couponUsage).where(eq(couponUsage.orderId, orderId));
  return { success: true };
}

// =========================================================================
// 2. ADMIN (CRUD)
// =========================================================================

export async function listCoupons() {
  const db = await getDb();

  const results = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      description: coupons.description,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
      minOrderValue: coupons.minOrderValue,
      maxDiscount: coupons.maxDiscount,
      usageLimit: coupons.usageLimit,
      validFrom: coupons.validFrom,
      validUntil: coupons.validUntil,
      isActive: coupons.isActive,
      // Contagem de usos via leftJoin
      timesUsed: sql<number>`count(${couponUsage.id})`, 
    })
    .from(coupons)
    .leftJoin(couponUsage, eq(coupons.id, couponUsage.couponId))
    .groupBy(coupons.id)
    .orderBy(desc(coupons.createdAt));

  return results;
}

export async function createCoupon(input: CreateCouponInput) {
  const db = await getDb();

  await db.insert(coupons).values({
    id: crypto.randomUUID(), // Gerando ID string
    code: input.code.toUpperCase(),
    description: input.description || null,
    discountType: input.discountType,
    discountValue: input.discountValue.toString(), // Convertendo para string (decimal)
    minOrderValue: input.minOrderValue ? input.minOrderValue.toString() : null,
    maxDiscount: input.maxDiscount ? input.maxDiscount.toString() : null,
    usageLimit: input.usageLimit || null,
    isActive: input.isActive ?? true,
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
  });

  return { success: true }; 
}

export async function updateCoupon(id: string, data: UpdateCouponInput) {
  const db = await getDb();
  const updateData: any = { updatedAt: new Date() };

  if (data.description !== undefined) updateData.description = data.description;
  if (data.discountType !== undefined) updateData.discountType = data.discountType;
  if (data.discountValue !== undefined) updateData.discountValue = data.discountValue.toString();
  if (data.minOrderValue !== undefined) updateData.minOrderValue = data.minOrderValue?.toString();
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount?.toString();
  if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
  if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;

  await db.update(coupons).set(updateData).where(eq(coupons.id, id));
  return { success: true };
}

export async function deleteCoupon(id: string) {
  const db = await getDb();
  await db.delete(couponUsage).where(eq(couponUsage.couponId, id));
  await db.delete(coupons).where(eq(coupons.id, id));
  return { success: true };
}