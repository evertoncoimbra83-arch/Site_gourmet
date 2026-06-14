import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { sql } from "drizzle-orm";
import { coupons } from "../../../drizzle/schema/index.js";
import { decrypt } from "../../encryption.js";

function getCouponCampaign(coupon: { code: string; description: string | null }): string {
  if (coupon.code.startsWith("VOLTA-")) {
    return "REATIVAÇÃO_VIP";
  }
  
  if (coupon.description) {
    try {
      const parsed = JSON.parse(coupon.description);
      if (parsed.type === "reactivation" || parsed.campaign === "REATIVAÇÃO_VIP") {
        return "REATIVAÇÃO_VIP";
      }
      if (parsed.campaign) {
        const camp = String(parsed.campaign).toUpperCase();
        if (["REATIVAÇÃO_VIP", "BLACK_FRIDAY", "ANIVERSARIO", "CLIENTE_NOVO", "SAZONAL"].includes(camp)) {
          return camp;
        }
        return camp;
      }
    } catch {
      // Not JSON, continue to keywords check
    }
    
    const descLower = coupon.description.toLowerCase();
    if (descLower.includes("aniversario") || descLower.includes("aniversário")) return "ANIVERSARIO";
    if (descLower.includes("black friday") || descLower.includes("blackfriday")) return "BLACK_FRIDAY";
    if (descLower.includes("novo") || descLower.includes("boas-vindas") || descLower.includes("primeira compra")) return "CLIENTE_NOVO";
    if (descLower.includes("volta") || descLower.includes("reativa")) return "REATIVAÇÃO_VIP";
  }

  const codeLower = coupon.code.toLowerCase();
  if (codeLower.includes("volta") || codeLower.includes("reactiva")) return "REATIVAÇÃO_VIP";
  if (codeLower.includes("black") || codeLower.includes("bf")) return "BLACK_FRIDAY";
  if (codeLower.includes("niver") || codeLower.includes("aniv")) return "ANIVERSARIO";
  if (codeLower.includes("novo") || codeLower.includes("first") || codeLower.includes("boas")) return "CLIENTE_NOVO";

  return "SAZONAL";
}

interface UnifiedUsage {
  orderId: string;
  userId: string | null;
  usedAt: Date | string | null;
  couponCode: string;
  campaign: string;
  orderTotal: number;
  discountAmount: number;
  customerName: string;
  email: string | null;
}

async function getUnifiedUsages(db: any, allCoupons: any[]): Promise<UnifiedUsage[]> {
  const usageRows = await db.execute(sql`
    SELECT 
      cu.order_id as orderId,
      cu.user_id as userId,
      cu.used_at as usedAt,
      c.id as couponId,
      c.code as couponCode,
      c.description as couponDescription,
      o.total as total,
      o.total_discount as totalDiscount,
      o.customer_name as customerName,
      u.email as email
    FROM coupon_usage cu
    JOIN orders o ON cu.order_id = o.id
    JOIN coupons c ON cu.coupon_id = c.id
    LEFT JOIN users u ON cu.user_id = u.id
    WHERE o.status IN ('completed', 'shipped', 'delivered')
      AND o.payment_status != 'refunded'
  `) as any;

  const usages = usageRows[0] || [];
  const unified: UnifiedUsage[] = [];
  const usedOrderIds = new Set<string>();

  for (const u of usages) {
    const couponCode = u.couponCode || u.coupon_code;
    const couponId = u.couponId || u.coupon_id;
    if (!couponCode && !couponId) {
      // Ignora registros mockados do fallback que retornarem vazios aqui no teste unitário
      continue;
    }

    const orderId = String(u.orderId || u.id || "");
    if (!orderId) continue;
    usedOrderIds.add(orderId);

    const matchingCoupon = allCoupons.find(c => c.id === couponId) || { code: couponCode, description: u.couponDescription };
    const camp = getCouponCampaign(matchingCoupon as any);

    const orderTotal = Number(u.total || 0);
    const discountAmount = Number(u.totalDiscount || u.total_discount || 0);
    const rawCustomerName = u.customerName || u.customer_name || "";
    const decryptedName = rawCustomerName ? (decrypt(rawCustomerName) || u.email || "Cliente sem Nome") : "Cliente sem Nome";

    unified.push({
      orderId,
      userId: u.userId || u.user_id || null,
      usedAt: u.usedAt || u.used_at || null,
      couponCode: String(couponCode).toUpperCase(),
      campaign: camp,
      orderTotal,
      discountAmount,
      customerName: decryptedName,
      email: u.email || null,
    });
  }

  const fallbackOrdersRows = await db.execute(sql`
    SELECT 
      o.id as orderId,
      o.user_id as userId,
      o.total as total,
      o.total_discount as totalDiscount,
      o.discounts_snapshot as discountsSnapshot,
      o.created_at as usedAt,
      o.customer_name as customerName,
      u.email as email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.status IN ('completed', 'shipped', 'delivered')
      AND o.payment_status != 'refunded'
      AND o.discounts_snapshot LIKE '%"couponCode":"%'
  `) as any;

  const fallbackOrders = fallbackOrdersRows[0] || [];
  for (const order of fallbackOrders) {
    const orderId = String(order.orderId || order.id || "");
    if (!orderId || usedOrderIds.has(orderId)) continue;

    if (!order.discountsSnapshot) continue;

    let couponCode: string | null = null;
    try {
      const snap = JSON.parse(order.discountsSnapshot);
      couponCode = snap.couponCode || snap.totals?.couponCode || null;
    } catch {
      continue;
    }

    if (!couponCode) continue;

    const matchingCoupon = allCoupons.find(c => c.code === couponCode.toUpperCase());
    const camp = matchingCoupon 
      ? getCouponCampaign(matchingCoupon) 
      : getCouponCampaign({ code: couponCode, description: null });

    const orderTotal = Number(order.total || 0);
    const discountAmount = Number(order.totalDiscount || order.total_discount || 0);
    const rawCustomerName = order.customerName || order.customer_name || "";
    const decryptedName = rawCustomerName ? (decrypt(rawCustomerName) || order.email || "Cliente sem Nome") : "Cliente sem Nome";

    unified.push({
      orderId,
      userId: order.userId || order.user_id || null,
      usedAt: order.usedAt || order.used_at || null,
      couponCode: couponCode.toUpperCase(),
      campaign: camp,
      orderTotal,
      discountAmount,
      customerName: decryptedName,
      email: order.email || null,
    });
  }

  return unified;
}

export const adminCampaignsRouter = router({
  summary: adminProcedure.query(async () => {
    const db = await getDb();
    const allCoupons = await db.select().from(coupons);

    const now = new Date();
    const activeCampaignsSet = new Set<string>();
    for (const c of allCoupons) {
      const camp = getCouponCampaign(c);
      const isCouponActive = c.isActive && 
        (!c.validFrom || new Date(c.validFrom) <= now) && 
        (!c.validUntil || new Date(c.validUntil) >= now);
      if (isCouponActive) {
        activeCampaignsSet.add(camp);
      }
    }

    const unifiedUsages = await getUnifiedUsages(db, allCoupons);

    const campaignStats: Record<string, {
      name: string;
      couponsGenerated: number;
      couponsUsed: number;
      revenueGenerated: number;
      clientsImpacted: Set<string>;
    }> = {};

    const predefinedCampaigns = ["REATIVAÇÃO_VIP", "BLACK_FRIDAY", "ANIVERSARIO", "CLIENTE_NOVO", "SAZONAL"];
    for (const camp of predefinedCampaigns) {
      campaignStats[camp] = {
        name: camp,
        couponsGenerated: 0,
        couponsUsed: 0,
        revenueGenerated: 0,
        clientsImpacted: new Set<string>()
      };
    }

    for (const c of allCoupons) {
      const camp = getCouponCampaign(c);
      if (!campaignStats[camp]) {
        campaignStats[camp] = {
          name: camp,
          couponsGenerated: 0,
          couponsUsed: 0,
          revenueGenerated: 0,
          clientsImpacted: new Set<string>()
        };
      }
      campaignStats[camp].couponsGenerated++;
    }

    for (const usage of unifiedUsages) {
      const camp = usage.campaign;
      if (!campaignStats[camp]) {
        campaignStats[camp] = {
          name: camp,
          couponsGenerated: 0,
          couponsUsed: 0,
          revenueGenerated: 0,
          clientsImpacted: new Set<string>()
        };
      }

      campaignStats[camp].couponsUsed++;
      campaignStats[camp].revenueGenerated += usage.orderTotal;
      if (usage.userId) {
        campaignStats[camp].clientsImpacted.add(String(usage.userId));
      }
    }

    const campaignsArray = Object.values(campaignStats).map(c => {
      const conversionRate = c.couponsGenerated > 0 ? (c.couponsUsed / c.couponsGenerated) * 100 : 0;
      const avgTicket = c.couponsUsed > 0 ? c.revenueGenerated / c.couponsUsed : 0;
      const roi = c.couponsUsed > 0 ? c.revenueGenerated / c.couponsUsed : 0;
      
      return {
        name: c.name,
        couponsGenerated: c.couponsGenerated,
        couponsUsed: c.couponsUsed,
        conversionRate: Number(conversionRate.toFixed(2)),
        revenueGenerated: Number(c.revenueGenerated.toFixed(2)),
        avgTicket: Number(avgTicket.toFixed(2)),
        clientsImpacted: c.clientsImpacted.size,
        roi: Number(roi.toFixed(2))
      };
    });

    let totalGenerated = 0;
    let totalUsed = 0;
    let totalRevenue = 0;
    const totalClientsImpacted = new Set<string>();

    for (const c of Object.values(campaignStats)) {
      totalGenerated += c.couponsGenerated;
      totalUsed += c.couponsUsed;
      totalRevenue += c.revenueGenerated;
      c.clientsImpacted.forEach(id => totalClientsImpacted.add(id));
    }

    const overallConversion = totalGenerated > 0 ? (totalUsed / totalGenerated) * 100 : 0;
    const overallAvgTicket = totalUsed > 0 ? totalRevenue / totalUsed : 0;
    const overallRoi = totalUsed > 0 ? totalRevenue / totalUsed : 0;

    const totals = {
      activeCampaigns: activeCampaignsSet.size,
      couponsGenerated: totalGenerated,
      couponsUsed: totalUsed,
      conversionRate: Number(overallConversion.toFixed(2)),
      revenueGenerated: Number(totalRevenue.toFixed(2)),
      avgTicket: Number(overallAvgTicket.toFixed(2)),
      clientsImpacted: totalClientsImpacted.size,
      roi: Number(overallRoi.toFixed(2))
    };

    return {
      campanhas: campaignsArray,
      totals
    };
  }),

  reactivation: adminProcedure.query(async () => {
    const db = await getDb();
    const allCoupons = await db.select().from(coupons);

    const unifiedUsages = await getUnifiedUsages(db, allCoupons);
    const reactivationCouponsUsed: any[] = [];

    let cuponsGerados = 0;
    for (const c of allCoupons) {
      if (getCouponCampaign(c) === "REATIVAÇÃO_VIP") {
        cuponsGerados++;
      }
    }

    const uniqueUsers = new Set<string>();
    let totalRevenue = 0;

    for (const usage of unifiedUsages) {
      if (usage.campaign === "REATIVAÇÃO_VIP") {
        reactivationCouponsUsed.push({
          code: usage.couponCode.toUpperCase(),
          clientName: usage.customerName,
          clientEmail: usage.email,
          usedAt: usage.usedAt ? new Date(usage.usedAt).toISOString() : null,
          orderTotal: usage.orderTotal,
          discountAmount: usage.discountAmount
        });

        if (usage.userId) {
          uniqueUsers.add(String(usage.userId));
        }
        totalRevenue += usage.orderTotal;
      }
    }

    const cuponsUtilizados = reactivationCouponsUsed.length;
    const ticketMedio = cuponsUtilizados > 0 ? totalRevenue / cuponsUtilizados : 0;
    const roi = cuponsUtilizados > 0 ? totalRevenue / cuponsUtilizados : 0;

    return {
      cuponsGerados,
      cuponsUtilizados,
      clientesRetornaram: uniqueUsers.size,
      receitaRecuperada: Number(totalRevenue.toFixed(2)),
      ticketMedio: Number(ticketMedio.toFixed(2)),
      roi: Number(roi.toFixed(2)),
      list: reactivationCouponsUsed
    };
  })
});
