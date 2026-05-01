import { eq, and, sql, like } from "drizzle-orm";
import { getDb } from "../../../db";
import { v4 as uuidv4 } from "uuid";
import * as schema from "../../../../drizzle/schema/index";
import { unseal, processDraftMetadata } from "./AdminOrderHelpers";
import { TRPCError } from "@trpc/server";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

// --- INTERFACES DE INPUT ---

interface DraftUpdateInput {
  draftId: string;
  userId?: string;
  shippingValue?: string | number;
  metadataJson?: string;
}

interface DraftAddItemInput {
  draftId: string;
  dishId?: number;
  packageId?: number;
  name: string;
  unitPrice: string | number;
  quantity?: number;
  options?: string;
  applied_nutrition?: string;
}

interface ListPackagesInput {
  page: number;
  perPage: number;
  search?: string;
}

type DraftMetadata = Record<string, unknown> & {
  customer?: Record<string, unknown>;
  address?: Record<string, unknown>;
};

export const AdminOrderDraftService = {
  async init(adminId: string) {
    const db = await getDb();
    const [existing] = await db.select().from(schema.adminOrderDrafts)
      .where(and(eq(schema.adminOrderDrafts.adminId, adminId), eq(schema.adminOrderDrafts.status, "active")))
      .limit(1);
    
    if (existing) return { id: existing.id, isExisting: true };
    
    const newId = uuidv4();
    await db.insert(schema.adminOrderDrafts).values({ 
      id: newId, 
      adminId, 
      status: "active", 
      shippingValue: "0.00", 
      discountValue: "0.00", 
      updatedAt: new Date() 
    });
    return { id: newId, isExisting: false };
  },

  async update(input: DraftUpdateInput) {
    const db = await getDb();
    const rawData = safeJsonParse<Record<string, unknown>>(input.metadataJson, {});
    
    const totalDiscount = (
      safeNumber(rawData.couponValue) + 
      safeNumber(rawData.loyaltyValue) + 
      safeNumber(rawData.paymentDiscountValue)
    ).toFixed(2);

    await db.update(schema.adminOrderDrafts).set({ 
      userId: input.userId, 
      shippingValue: input.shippingValue !== undefined ? safeNumber(input.shippingValue).toFixed(2) : undefined, 
      discountValue: totalDiscount, 
      metadataJson: processDraftMetadata(input.metadataJson || "{}"), 
      discountsSnapshot: JSON.stringify(rawData),
      updatedAt: new Date() 
    }).where(eq(schema.adminOrderDrafts.id, input.draftId));
    
    return { success: true };
  },

  async getDraft(adminId: string) {
    const db = await getDb();
    const [draft] = await db.select().from(schema.adminOrderDrafts)
      .where(and(eq(schema.adminOrderDrafts.adminId, adminId), eq(schema.adminOrderDrafts.status, "active")))
      .limit(1);
    
    if (!draft) return null;
    
    const items = await db.select().from(schema.adminOrderDraftItems).where(eq(schema.adminOrderDraftItems.draftId, draft.id));
    
    const meta = safeJsonParse<DraftMetadata>(draft.metadataJson, {});
    
    if (meta.customer) { 
      (meta.customer as Record<string, unknown>).name = unseal((meta.customer as Record<string, unknown>).name || ""); 
      (meta.customer as Record<string, unknown>).phone = unseal((meta.customer as Record<string, unknown>).phone || ""); 
    }

    if (meta.address) {
      const address = meta.address as Record<string, unknown>;
      meta.address = {
        shipping_address: unseal((meta.address as Record<string, unknown>).shipping_address || ""),
        shipping_address_number: unseal((meta.address as Record<string, unknown>).shipping_address_number || ""),
        shipping_neighborhood: unseal((meta.address as Record<string, unknown>).shipping_neighborhood || ""),
        shipping_address_complement: unseal((meta.address as Record<string, unknown>).shipping_address_complement || ""),
        zipCode: unseal(meta.address.zipCode || meta.address.shipping_zip_code || ""), // ✅ Padronizado para zipCode
        shipping_city: unseal((meta.address as Record<string, unknown>).shipping_city || ""),
        shipping_state: unseal((meta.address as Record<string, unknown>).shipping_state || ""),
      };
    }
    
    return { 
      ...draft, 
      metadataJson: JSON.stringify({ 
        ...meta, 
        discountValue: safeNumber(draft.discountValue), 
        shippingValue: safeNumber(draft.shippingValue) 
      }), 
      items: items.map(it => ({ ...it, unitPrice: safeNumber(it.unitPrice) })) 
    };
  },

  async updateItem(itemId: string, data: { quantity?: number; unitPrice?: number }) {
    const db = await getDb();

    const updatePayload: Record<string, unknown> = {};
    if (data.quantity !== undefined) updatePayload.quantity = data.quantity;
    if (data.unitPrice !== undefined) updatePayload.unitPrice = String(safeNumber(data.unitPrice).toFixed(2));

    if (Object.keys(updatePayload).length === 0) return { success: false };

    await db
      .update(schema.adminOrderDraftItems)
      .set(updatePayload)
      .where(eq(schema.adminOrderDraftItems.id, itemId));

    return { success: true };
  },

  async applyLoyalty(draftId: string, pointsRequested: string) {
    const db = await getDb();
    
    const [settings] = await db.select().from(schema.loyaltySettings).limit(1);
    const [draft] = await db.select().from(schema.adminOrderDrafts).where(eq(schema.adminOrderDrafts.id, draftId)).limit(1);
    
    if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "Rascunho não encontrado." });
    if (!settings?.enabled) throw new TRPCError({ code: "BAD_REQUEST", message: "Programa de fidelidade desativado." });

    const items = await db.select().from(schema.adminOrderDraftItems).where(eq(schema.adminOrderDraftItems.draftId, draftId));
    const subtotal = items.reduce((acc, it) => acc + (safeNumber(it.unitPrice) * (it.quantity || 0)), 0);

    const ptsToUse = Math.max(0, safeNumber(pointsRequested));
    const ratePoints = safeNumber(settings.redemptionRatePoints, 100);
    const rateMoney = safeNumber(settings.redemptionRateMoney, 1);
    const pointValueUnit = rateMoney / ratePoints;

    const discountAmount = safeNumber((ptsToUse * pointValueUnit).toFixed(2));

    if (discountAmount > subtotal) {
       throw new TRPCError({ code: "BAD_REQUEST", message: "Desconto de pontos não pode ser maior que o total dos itens." });
    }

    const meta = safeJsonParse<Record<string, unknown>>(draft.metadataJson, {});
    
    const currentCouponValue = safeNumber(meta.couponValue);
    const currentPaymentDiscount = safeNumber(meta.paymentDiscountValue);
    const totalDiscountSum = (currentCouponValue + discountAmount + currentPaymentDiscount).toFixed(2);

    const updatedMeta = {
      ...meta,
      loyaltyPointsUsed: ptsToUse,
      loyaltyValue: discountAmount,
      discountSource: 'loyalty'
    };

    await db.update(schema.adminOrderDrafts).set({
        metadataJson: JSON.stringify(updatedMeta),
        discountValue: totalDiscountSum,
        updatedAt: new Date()
    }).where(eq(schema.adminOrderDrafts.id, draftId));

    return { success: true, discountAmount, pointsUsed: ptsToUse };
  },

  async removeLoyalty(draftId: string) {
    const db = await getDb();
    const [draft] = await db.select().from(schema.adminOrderDrafts).where(eq(schema.adminOrderDrafts.id, draftId)).limit(1);
    if (!draft) return { success: false };

    const meta = safeJsonParse<Record<string, unknown>>(draft.metadataJson, {});
    
    const { ...rest } = meta;
    delete rest.loyaltyPointsUsed;
    delete rest.loyaltyValue;
    
    const currentCouponValue = safeNumber(meta.couponValue);
    const currentPaymentDiscount = safeNumber(meta.paymentDiscountValue);

    await db.update(schema.adminOrderDrafts)
      .set({
        metadataJson: JSON.stringify({ ...rest, loyaltyPointsUsed: 0, loyaltyValue: 0 }),
        discountValue: (currentCouponValue + currentPaymentDiscount).toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(schema.adminOrderDrafts.id, draftId));

    return { success: true };
  },

  async addItem(input: DraftAddItemInput) {
    const db = await getDb();
    const finalOptions = input.options || "{}"; 
    
    await db.insert(schema.adminOrderDraftItems).values({ 
        id: uuidv4(), 
        draftId: input.draftId, 
        dishId: input.dishId ? String(input.dishId) : null,
        packageId: input.packageId ? String(input.packageId) : null,
        name: input.name, 
        unitPrice: String(safeNumber(input.unitPrice).toFixed(2)),
        quantity: input.quantity || 1, 
        options: finalOptions, 
        appliedNutrition: input.applied_nutrition || null
    } as typeof schema.adminOrderDraftItems.$inferInsert);
    
    return { success: true };
  },

  async removeItem(itemId: string) {
    const db = await getDb();
    await db.delete(schema.adminOrderDraftItems).where(eq(schema.adminOrderDraftItems.id, itemId));
    return { success: true };
  },

  async cancelSession(draftId: string) {
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx.delete(schema.adminOrderDraftItems).where(eq(schema.adminOrderDraftItems.draftId, draftId));
      await tx.delete(schema.adminOrderDrafts).where(eq(schema.adminOrderDrafts.id, draftId));
    });
    return { success: true };
  },

  async applyCoupon(draftId: string, code: string) {
    const db = await getDb();
    const [coupon] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, code.toUpperCase().trim())).limit(1);

    if (!coupon) throw new TRPCError({ code: "NOT_FOUND", message: "Cupom não encontrado." });
    if (!coupon.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom inativo." });

    const [draft] = await db.select().from(schema.adminOrderDrafts).where(eq(schema.adminOrderDrafts.id, draftId)).limit(1);
    if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "Rascunho não encontrado." });

    const meta = safeJsonParse<Record<string, unknown>>(draft.metadataJson, {});
    const updatedMeta = { ...meta, couponCode: coupon.code, discountSource: 'coupon' };

    await db.update(schema.adminOrderDrafts)
      .set({ metadataJson: JSON.stringify(updatedMeta), updatedAt: new Date() })
      .where(eq(schema.adminOrderDrafts.id, draftId));

    return { 
      success: true, 
      coupon: { code: coupon.code, type: coupon.discountType, value: safeNumber(coupon.discountValue) }
    };
  },

  async listPackages(input: ListPackagesInput) {
    const db = await getDb();
    const offset = (input.page - 1) * input.perPage;
    const whereClause = and(
      eq(schema.packages.status, "active"), 
      input.search ? like(schema.packages.name, `%${input.search}%`) : undefined
    );

    const data = await db.select().from(schema.packages).where(whereClause).limit(input.perPage).offset(offset);
    const [totalRes] = await db.select({ count: sql<number>`count(*)` }).from(schema.packages).where(whereClause);

    return { 
      data: data.map(p => ({ ...p, price: safeNumber(p.price) })), 
      total: safeNumber(totalRes?.count) 
    };
  }
};
