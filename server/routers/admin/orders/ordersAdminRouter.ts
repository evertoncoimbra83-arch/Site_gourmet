// server/routers/admin/orders/ordersAdminRouter.ts

import { z } from "zod";
import { router, adminProcedure } from "../../../_core/trpc.js";
import { AdminOrderDraftService } from "./AdminOrderDraftService.js";
import { AdminOrderFinalizeService } from "./AdminOrderFinalizeService.js";
import { OrderManagerService } from "./OrderManagerService.js";
import { PagSeguroService } from "./services/PagSeguroService.js";
import { decrypt } from "../../../encryption.js"; 
import { getDb } from "../../../db.js";
import { 
    adminOrderDraftItems,
    carts,
    cartItems,
    orders,
    orderItems,
    users 
} from "../../../../drizzle/schema/index.js";
import { eq, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

// --- INTERFACES ---

interface DiscountSnapshot {
    couponCode?: string | null;
    loyaltyValue?: number | string;
    pointsUsed?: number | string;
    totals?: Record<string, number | string>;
    [key: string]: unknown;
}

type OrderStatus = "pending" | "preparing" | "shipped" | "delivered" | "cancelled" | "completed";

export const ordersAdminRouter = router({
  
    /**
     * 📋 LISTAGEM DE PEDIDOS
     */
    list: adminProcedure
        .input(z.object({ 
            search: z.string().optional(), 
            status: z.string().optional(), 
            page: z.number().default(1), 
            perPage: z.number().default(10) 
        }))
        .query(async ({ input }) => {
            const result = await OrderManagerService.listOrders(input);
            return { 
                orders: result.data, 
                meta: { 
                    totalItems: result.total, 
                    totalPages: Math.ceil(result.total / input.perPage), 
                    currentPage: input.page 
                } 
            };
        }),

    /**
     * 🔍 DETALHES DO PEDIDO
     */
    getById: adminProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ input }) => {
            const db = await getDb();
            const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
            if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
            
            const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
            
            return { 
                ...order, 
                items: items.map(it => ({ ...it, unitPrice: safeNumber(it.unitPrice) })) 
            };
        }),

    /**
     * 🔄 ATUALIZAR STATUS
     */
    updateStatus: adminProcedure
        .input(z.object({ 
            id: z.string(), 
            status: z.string() 
        }))
        .mutation(async ({ input }) => {
            await OrderManagerService.updateStatus(input.id, input.status as OrderStatus);
            return { success: true };
        }),

    /**
     * 🛒 CARRINHOS ABANDONADOS
     */
    getAbandonedCarts: adminProcedure
        .input(z.object({ 
            page: z.number().default(1), 
            perPage: z.number().default(10) 
        }).optional())
        .query(async ({ input }) => {
            const db = await getDb();
            const page = input?.page || 1;
            const perPage = input?.perPage || 10;
            const offset = (page - 1) * perPage;

            const abandonedCarts = await db
                .select({
                    id: carts.id,
                    userId: carts.userId,
                    updatedAt: carts.updatedAt,
                    customerName: users.name,
                    customerEmail: users.email,
                    itemCount: sql<number>`count(${cartItems.id})`,
                })
                .from(carts)
                .innerJoin(users, eq(carts.userId, users.id))
                .leftJoin(cartItems, eq(carts.id, cartItems.cartId))
                .where(sql`${carts.updatedAt} < NOW() - INTERVAL 2 HOUR`)
                .groupBy(carts.id, users.id)
                .limit(perPage)
                .offset(offset)
                .orderBy(desc(carts.updatedAt));

            return {
                carts: abandonedCarts.map(c => ({
                    ...c,
                    customerName: c.customerName ? (decrypt(c.customerName) || "Cliente") : "Cliente",
                    customerEmail: c.customerEmail || "E-mail indisponível"
                }))
            };
        }),

    /**
     * 📝 EDITAR PEDIDO
     */
    editOrder: adminProcedure
        .input(z.object({ orderId: z.string() })) 
        .mutation(async ({ input, ctx }) => {
            const db = await getDb();
            const adminId = ctx.user.id;
            
            const [orderResult] = await db
                .select({ order: orders, customerName: users.name })
                .from(orders)
                .leftJoin(users, eq(users.id, orders.userId))
                .where(eq(orders.id, input.orderId))
                .limit(1);

            if (!orderResult) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
            
            const { order, customerName } = orderResult;
            const customerCleanName = customerName ? (decrypt(customerName) || "Cliente") : "Cliente";

            let snap: DiscountSnapshot = {};
            if (order.discountsSnapshot) {
                try {
                    const rawSnap = decrypt(order.discountsSnapshot as string);
                    snap = safeJsonParse<DiscountSnapshot>(rawSnap, {});
                } catch {
                    snap = {};
                }
            }

            const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
            const session = await AdminOrderDraftService.init(adminId);
            const pdvDraftId = session.id;
            
            await db.delete(adminOrderDraftItems).where(eq(adminOrderDraftItems.draftId, pdvDraftId));

            const snapTotals = (snap.totals as Record<string, string | number>) || {};

            await AdminOrderDraftService.update({
                draftId: pdvDraftId,
                userId: order.userId ? String(order.userId) : undefined,
                shippingValue: safeNumber(order.shippingCost),
                metadataJson: JSON.stringify({
                    customer: order.userId ? { id: String(order.userId), name: customerCleanName } : null,
                    address: {
                        shipping_address: order.shippingAddress,
                        shipping_address_number: order.shippingAddressNumber,
                        shipping_neighborhood: order.shippingNeighborhood,
                        shipping_city: order.shippingCity,
                        shipping_state: order.shippingState,
                        zipCode: order.shippingZipCode,
                    },
                    deliveryMode: order.shippingCity ? 'delivery' : 'pickup',
                    notes: order.notes || "",
                    couponCode: snap.couponCode || null,
                    couponValue: safeNumber(snapTotals.couponDiscount),
                    loyaltyValue: safeNumber(snap.loyaltyValue),
                    loyaltyPointsUsed: safeNumber(snap.pointsUsed),
                    discountValue: safeNumber(order.totalDiscount),
                    editingOrderId: order.id,
                    discountsSnapshot: JSON.stringify(snap)
                })
            });

            for (const item of items) {
                await AdminOrderDraftService.addItem({
                    draftId: pdvDraftId,
                    dishId: item.dishId ? safeNumber(item.dishId) : undefined,
                    packageId: item.packageId ? safeNumber(item.packageId) : undefined,
                    name: item.dishName || "Item do Pedido",
                    unitPrice: safeNumber(item.unitPrice),
                    quantity: safeNumber(item.quantity),
                    options: typeof item.options === 'string' ? item.options : JSON.stringify(item.options || {}),
                    applied_nutrition: item.appliedNutrition ? String(item.appliedNutrition) : undefined
                });
            }

            return { success: true, newDraftId: pdvDraftId };
        }),

    /**
     * ➕ ADICIONAR ITEM AO RASCUNHO
     */
    addItem: adminProcedure
        .input(z.object({ 
            draftId: z.string(), 
            dishId: z.coerce.number().nullish(), 
            packageId: z.coerce.number().nullish(), 
            name: z.string(), 
            unitPrice: z.number(), 
            quantity: z.number().default(1), 
            options: z.string().optional(), 
            applied_nutrition: z.string().optional() 
        }))
        .mutation(({ input }) => AdminOrderDraftService.addItem({
            ...input,
            dishId: input.dishId ?? undefined, 
            packageId: input.packageId ?? undefined
        })),

    /**
     * 🏁 FINALIZAR PEDIDO MANUAL
     */
    placeOrder: adminProcedure
        .input(z.object({ draftId: z.string() }))
        .mutation(({ input }) => AdminOrderFinalizeService.finalize(input.draftId)),

    /**
     * 💳 GERAR LINK DE PAGAMENTO
     */
    generatePaymentLink: adminProcedure
        .input(z.object({ orderId: z.string() }))
        .mutation(async ({ input }) => {
            const db = await getDb();
            const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
            if (!order) throw new TRPCError({ code: "NOT_FOUND" });
            
            const orderForPayment = {
                ...order,
                customerName: order.customerName || "Cliente"
            };

            const link = await PagSeguroService.createPaymentLink(
                (orderForPayment as unknown) as Parameters<typeof PagSeguroService.createPaymentLink>[0]
            );
            
            if (!link) throw new TRPCError({ code: "BAD_GATEWAY", message: "Erro ao gerar link de pagamento." });
            return { link };
        }),

    /**
     * 🔍 LISTAGEM DE CARRINHOS ANTIGOS (Usado pelo useQuery no Front para ler/contar)
     */
    getEmptyOldCarts: adminProcedure.query(async () => {
        return await OrderManagerService.getEmptyOldCarts();
    }),

    /**
     * 🧹 LIMPEZA DE CARRINHOS ANTIGOS (Usado pelo useMutation no Front no botão Limpar)
     */
    clearEmptyOldCarts: adminProcedure.mutation(async () => {
        return await OrderManagerService.clearEmptyOldCarts();
    }),

    /**
     * ❌ EXCLUIR PEDIDO
     */
    deleteOrder: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await OrderManagerService.delete(input.id);
            return { success: true };
        }),
});
