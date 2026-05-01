import { eq, sql, desc } from "drizzle-orm";
import { getDb } from "./db"; 
import { coupons, couponUsage } from "../drizzle/schema/index"; 
import crypto from "crypto";
import { safeNumber } from "./lib/safe-parse";

// Tipos usados no painel/admin e no lado do cliente
export type CouponDiscountType = "percentage" | "fixed";

export interface CreateCouponInput {
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  isActive?: boolean;
  bannerColor?: string;
  logoUrl?: string | null;
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
  bannerColor?: string;
  logoUrl?: string | null;
}

export interface ValidateCouponResult {
  isValid: boolean;
  message?: string;
  discountAmount: number;
  couponId?: string;
  code?: string;
  bannerColor?: string;
  logoUrl?: string | null;
}

function toNumber(value: unknown): number {
  return safeNumber(value);
}

// =========================================================================
// 1. VALIDAÇÃO E APLICAÇÃO
// =========================================================================

export async function validateCoupon(
  code: string,
  _userId: string, // Prefixo '_' para indicar que não está sendo usado no momento
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

  if (coupon.usageLimit) {
    const [usageRes] = await db.select({ count: sql<number>`count(*)` })
      .from(couponUsage)
      .where(eq(couponUsage.couponId, coupon.id));
      
    if (safeNumber(usageRes.count) >= coupon.usageLimit) {
      return { isValid: false, message: "Limite de uso geral atingido.", discountAmount: 0 };
    }
  }
  
  let discountAmount = 0;
  const discountValue = toNumber(coupon.discountValue);
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
    discountAmount: safeNumber(discountAmount.toFixed(2)),
    couponId: coupon.id,
    code: coupon.code,
    bannerColor: coupon.bannerColor || "#10b981",
    logoUrl: coupon.logoUrl,
  };
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
      bannerColor: coupons.bannerColor,
      logoUrl: coupons.logoUrl,
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
    id: crypto.randomUUID(),
    code: input.code.toUpperCase(),
    description: input.description || null,
    discountType: input.discountType,
    discountValue: input.discountValue.toString(),
    minOrderValue: input.minOrderValue ? input.minOrderValue.toString() : null,
    maxDiscount: input.maxDiscount ? input.maxDiscount.toString() : null,
    usageLimit: input.usageLimit || null,
    isActive: input.isActive ?? true,
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    bannerColor: input.bannerColor || "#10b981",
    logoUrl: input.logoUrl || null,
  });

  return { success: true }; 
}

export async function updateCoupon(id: string, data: UpdateCouponInput) {
  const db = await getDb();
  
  // ✅ CORREÇÃO: Silenciando o aviso de 'any' apenas onde o cast de escape é necessário
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Partial<typeof coupons.$inferInsert> & Record<string, any> = {
    updatedAt: new Date()
  };

  if (data.description !== undefined) updateData.description = data.description;
  if (data.discountType !== undefined) updateData.discountType = data.discountType;
  if (data.discountValue !== undefined) updateData.discountValue = data.discountValue.toString();
  if (data.minOrderValue !== undefined) updateData.minOrderValue = data.minOrderValue?.toString();
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount?.toString();
  if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
  if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
  if (data.bannerColor !== undefined) updateData.bannerColor = data.bannerColor;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;

  await db.update(coupons).set(updateData).where(eq(coupons.id, id));
  return { success: true };
}

export async function deleteCoupon(id: string) {
  const db = await getDb();
  await db.delete(couponUsage).where(eq(couponUsage.couponId, id));
  await db.delete(coupons).where(eq(coupons.id, id));
  return { success: true };
}
