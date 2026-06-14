// server/routers/admin/orders/ordersAdminRouter.ts

import { z } from "zod";
import { router, adminProcedure, operatorProcedure, superAdminProcedure } from "../../../_core/trpc.js";
import { AdminOrderDraftService } from "./AdminOrderDraftService.js";
import { AdminOrderFinalizeService } from "./AdminOrderFinalizeService.js";
import { OrderManagerService } from "./OrderManagerService.js";
import { PagSeguroService } from "./services/PagSeguroService.js";
import { decrypt, unseal } from "../../../encryption.js";
import { getDb } from "../../../db.js";
import {
    adminOrderDraftItems,
    carts,
    cartItems,
    orders,
    orderItems,
    users
} from "../../../../drizzle/schema/index.js";
import { eq, sql, desc, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";
import { AuditLogService } from "../../../services/AuditLogService.js";
import {
    assertConfirmationReason,
    assertStrongConfirmation,
    operationalLimits,
} from "../operational-hardening.js";

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
     * Inicia ou reutiliza uma sessão ativa de Venda Manual para o operador atual.
     */
    init: adminProcedure
        .mutation(async ({ ctx }) => {
            const session = await AdminOrderDraftService.init(ctx.user.id);
            return { ...session, draftId: session.id };
        }),

    /**
     * Recupera o rascunho ativo. O draftId preserva compatibilidade com links
     * existentes de edição; adminId fica como fallback legado.
     */
    getDraft: adminProcedure
        .input(z.object({
            draftId: z.string().optional(),
            adminId: z.string().optional(),
        }).optional())
        .query(async ({ input, ctx }) => {
            if (input?.draftId) {
                return AdminOrderDraftService.getDraftById(input.draftId);
            }

            const byCurrentUser = await AdminOrderDraftService.getDraft(ctx.user.id);
            if (byCurrentUser) return byCurrentUser;

            if (input?.adminId && input.adminId !== ctx.user.id) {
                return AdminOrderDraftService.getDraft(input.adminId);
            }

            return null;
        }),

    updateSession: adminProcedure
        .input(z.object({
            draftId: z.string(),
            userId: z.string().nullish(),
            shippingValue: z.union([z.string(), z.number()]).optional(),
            discountValue: z.union([z.string(), z.number()]).optional(),
            metadataJson: z.string().optional(),
        }))
        .mutation(({ input }) => AdminOrderDraftService.update({
            draftId: input.draftId,
            userId: input.userId ?? undefined,
            shippingValue: input.shippingValue,
            metadataJson: input.metadataJson,
        })),

    listActiveDrafts: adminProcedure
        .query(({ ctx }) => AdminOrderDraftService.listActiveDrafts(ctx.user.id)),

    recoverDraft: adminProcedure
        .input(z.object({
            draftId: z.string(),
            adminId: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const draft = await AdminOrderDraftService.getDraftById(input.draftId);
            if (!draft) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Rascunho não encontrado." });
            }

            return { success: true, newDraftId: input.draftId };
        }),

    /**
     * 📋 LISTAGEM DE PEDIDOS
     */
    list: operatorProcedure
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
    getById: operatorProcedure
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
    updateStatus: operatorProcedure
        .input(z.object({
            id: z.string(),
            status: z.string()
        }))
        .mutation(async ({ input, ctx }) => {
            const db = await getDb();
            const [oldOrder] = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);

            await OrderManagerService.updateStatus(input.id, input.status as OrderStatus, (ctx.req as any)?.requestId);

            if (oldOrder) {
                const actor = {
                    userId: ctx.user?.id,
                    ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                    userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                    requestId: (ctx.req as any)?.requestId
                };

                void AuditLogService.record({
                    actor,
                    module: "orders",
                    action: "UPDATE_STATUS",
                    severity: "warning",
                    entityType: "orders",
                    entityId: input.id,
                    entityLabel: oldOrder.customerName ? (unseal(oldOrder.customerName as string) || `Pedido ${input.id}`) : `Pedido ${input.id}`,
                    oldValues: { status: oldOrder.status },
                    newValues: { status: input.status }
                });
            }
            return { success: true };
        }),

    /**
     * 🛒 CARRINHOS ABANDONADOS
     */
    getAbandonedCarts: operatorProcedure
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

            const actor = {
                userId: ctx.user?.id,
                ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                requestId: (ctx.req as any)?.requestId
            };

            void AuditLogService.record({
                actor,
                module: "orders",
                action: "INIT_ADMINISTRATIVE_EDIT",
                severity: "info",
                entityType: "orders",
                entityId: input.orderId,
                entityLabel: order.customerName ? (unseal(order.customerName as string) || `Pedido ${input.orderId}`) : `Pedido ${input.orderId}`,
                oldValues: null,
                newValues: { orderId: input.orderId }
            });

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
    updateItem: adminProcedure
        .input(z.object({
            itemId: z.string(),
            quantity: z.number().optional(),
            unitPrice: z.number().optional(),
        }))
        .mutation(({ input }) => AdminOrderDraftService.updateItem(input.itemId, {
            quantity: input.quantity,
            unitPrice: input.unitPrice,
        })),

    removeItem: adminProcedure
        .input(z.string())
        .mutation(({ input }) => AdminOrderDraftService.removeItem(input)),

    applyLoyalty: adminProcedure
        .input(z.object({
            draftId: z.string(),
            pointsInput: z.string(),
        }))
        .mutation(({ input }) => AdminOrderDraftService.applyLoyalty(input.draftId, input.pointsInput)),

    removeLoyalty: adminProcedure
        .input(z.object({ draftId: z.string() }))
        .mutation(({ input }) => AdminOrderDraftService.removeLoyalty(input.draftId)),

    applyCoupon: adminProcedure
        .input(z.object({
            draftId: z.string(),
            code: z.string(),
        }))
        .mutation(({ input }) => AdminOrderDraftService.applyCoupon(input.draftId, input.code)),

    cancelSession: adminProcedure
        .input(z.object({ draftId: z.string() }))
        .mutation(({ input }) => AdminOrderDraftService.cancelSession(input.draftId)),

    listPackages: adminProcedure
        .input(z.object({
            page: z.number().default(1),
            perPage: z.number().default(20),
            search: z.string().nullish(),
        }))
        .query(({ input }) => AdminOrderDraftService.listPackages({
            page: input.page,
            perPage: input.perPage,
            search: input.search || undefined,
        })),

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
    clearEmptyOldCarts: adminProcedure
        .input(z.object({
            confirmationToken: z.string().optional(),
            confirmationReason: z.string().optional()
        }).optional())
        .mutation(async ({ input }) => {
        assertStrongConfirmation(input || {}, "Limpeza operacional de carrinhos antigos");
        assertConfirmationReason(input || {}, "Limpeza operacional de carrinhos antigos");
        return await OrderManagerService.clearEmptyOldCarts();
    }),

    /**
     * ❌ EXCLUIR PEDIDO
     */
    deleteOrder: superAdminProcedure
        .input(z.union([
            z.string(),
            z.object({
                id: z.string(),
                confirmationToken: z.string().optional(),
                confirmationReason: z.string().optional()
            })
        ]))
        .mutation(async ({ input, ctx }) => {
            const id = typeof input === "string" ? input : input.id;
            if (typeof input === "string") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Exclusao de pedido exige confirmacao forte.",
                });
            }
            assertStrongConfirmation(input, "Exclusao de pedido");
            assertConfirmationReason(input, "Exclusao de pedido");
            const db = await getDb();
            const [oldOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
            const oldItems = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

            await OrderManagerService.delete(id);

            if (oldOrder) {
                const actor = {
                    userId: ctx.user?.id,
                    ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                    userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                    requestId: (ctx.req as any)?.requestId
                };

                void AuditLogService.record({
                    actor,
                    module: "orders",
                    action: "DELETE_ORDER",
                    severity: "critical",
                    entityType: "orders",
                    entityId: id,
                    entityLabel: oldOrder.customerName ? (unseal(oldOrder.customerName as string) || `Pedido ${id}`) : `Pedido ${id}`,
                    oldValues: {
                        id: oldOrder.id,
                        customerName: oldOrder.customerName ? unseal(oldOrder.customerName as string) : null,
                        total: safeNumber(oldOrder.total),
                        status: oldOrder.status,
                        items: oldItems.map(item => ({
                            dishName: item.dishName,
                            quantity: safeNumber(item.quantity),
                            unitPrice: safeNumber(item.unitPrice)
                        }))
                    },
                    newValues: null
                });
            }
            return { success: true };
        }),

     updateStatusBatch: operatorProcedure
        .input(z.object({
            ids: z.array(z.string()),
            status: z.string()
        }))
        .mutation(async ({ input, ctx }) => {
            if (!input.ids.length) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhum ID de pedido fornecido." });
            }
            const db = await getDb();
            const oldOrders = await db.select().from(orders).where(inArray(orders.id, input.ids));

            await OrderManagerService.assertOrdersAreMutable(input.ids);
            for (const id of input.ids) {
                await OrderManagerService.updateStatus(id, input.status as OrderStatus, (ctx.req as any)?.requestId);
            }

            const actor = {
                userId: ctx.user?.id,
                ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                requestId: (ctx.req as any)?.requestId
            };

            for (const oldOrder of oldOrders) {
                void AuditLogService.record({
                    actor,
                    module: "orders",
                    action: "UPDATE_STATUS_BATCH",
                    severity: "warning",
                    entityType: "orders",
                    entityId: oldOrder.id,
                    entityLabel: oldOrder.customerName ? (unseal(oldOrder.customerName as string) || `Pedido ${oldOrder.id}`) : `Pedido ${oldOrder.id}`,
                    oldValues: { status: oldOrder.status },
                    newValues: { status: input.status }
                });
            }

            return { success: true };
        }),

    getBatchByIds: operatorProcedure
        .input(z.object({
            orderIds: z.array(z.string())
        }))
        .query(async ({ input }) => {
            if (!input.orderIds.length) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhum ID de pedido fornecido." });
            }
            const db = await getDb();
            const results = [];
            for (const orderId of input.orderIds) {
                const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
                if (order) {
                    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
                    results.push({
                        ...order,
                        items: items.map(it => ({ ...it, unitPrice: safeNumber(it.unitPrice) }))
                    });
                }
            }
            return results;
        }),

    commitAdministrativeEdit: adminProcedure
        .input(z.object({
            orderId: z.string(),
            justification: z.string().min(5, "A nota descritiva precisa de pelo menos 5 caracteres"),
            discountAmount: z.number().min(0).default(0),
            shippingCost: z.number().min(0).default(0),
            confirmationToken: z.string().optional(),
            confirmationReason: z.string().optional(),
            items: z.array(z.object({
                dishName: z.string().min(1, "O nome do prato é obrigatório"),
                quantity: z.number().int().min(1),
                unitPrice: z.number().min(0)
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const adminId = ctx.user?.id || "ADMIN_SESSION";
            const db = await getDb();
            const [oldOrder] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
            const oldItems = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
            const oldTotal = safeNumber(oldOrder?.total);
            const discountRatio = oldTotal > 0 ? input.discountAmount / oldTotal : 0;
            if (discountRatio > operationalLimits.orderMaxDiscountRatio) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Desconto administrativo acima do limite operacional bloqueado.",
                });
            }
            if (
                discountRatio > operationalLimits.orderCriticalDiscountRatio ||
                input.shippingCost > operationalLimits.orderCriticalShippingCost
            ) {
                if (input.shippingCost > operationalLimits.orderMaxShippingCost) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Frete administrativo acima do limite operacional bloqueado.",
                    });
                }
                assertStrongConfirmation(input, "Ajuste financeiro administrativo");
                assertConfirmationReason(input, "Ajuste financeiro administrativo");
            }

            // Executa a mutação a partir do mesmo serviço local unificado
            const result = await AdminOrderDraftService.applyAdministrativeChanges({
                ...input,
                adminId
            });

            if (oldOrder) {
                const actor = {
                    userId: ctx.user?.id,
                    ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
                    userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
                    requestId: (ctx.req as any)?.requestId
                };

                const before = {
                    totalDiscount: safeNumber(oldOrder.totalDiscount),
                    shippingCost: safeNumber(oldOrder.shippingCost),
                    items: oldItems.map(item => ({
                        dishName: item.dishName,
                        quantity: safeNumber(item.quantity),
                        unitPrice: safeNumber(item.unitPrice)
                    }))
                };

                const after = {
                    totalDiscount: input.discountAmount,
                    shippingCost: input.shippingCost,
                    items: input.items.map(item => ({
                        dishName: item.dishName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice
                    })),
                    justification: input.justification
                };

                void AuditLogService.record({
                    actor,
                    module: "orders",
                    action: "COMMIT_ADMINISTRATIVE_EDIT",
                    severity: discountRatio > operationalLimits.orderCriticalDiscountRatio ||
                        input.shippingCost > operationalLimits.orderCriticalShippingCost ? "critical" : "warning",
                    entityType: "orders",
                    entityId: input.orderId,
                    entityLabel: oldOrder.customerName ? (unseal(oldOrder.customerName as string) || `Pedido ${input.orderId}`) : `Pedido ${input.orderId}`,
                    oldValues: before,
                    newValues: after
                });
            }

            return result;
        }),
});
