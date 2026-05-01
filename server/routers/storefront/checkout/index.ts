import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  router,
  protectedProcedure,
  createRateLimitMiddleware,
} from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { encrypt, normalizeDigits, piiHash } from "../../../encryption.js";
import {
  loyaltyHistory,
  paymentMethods,
  userAddresses,
  users,
} from "../../../../drizzle/schema/index.js";
import { recalculateCheckoutFromCart } from "../../../orders/logic/recalculateOrder.js";
import { isValidCPF } from "../auth/auth.logic.js";
import { loadAddressSnapshot } from "./address.js";
import { createOrderWithItems, cleanupCheckoutCarts } from "./orders.js";
import { paymentRouter } from "./payment.js";

type CreateOrderParams = Parameters<typeof createOrderWithItems>[0];
type BaseTx = CreateOrderParams["tx"];
type AddressSnap = CreateOrderParams["addressSnap"];

function ensureCustomerName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O nome do cliente é obrigatório.",
    });
  }
  return trimmed;
}

function ensureValidCpf(value: string) {
  const cleanCpf = normalizeDigits(value);
  if (!isValidCPF(cleanCpf)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O CPF informado é inválido.",
    });
  }
  return cleanCpf;
}

function ensureValidPhone(value: string) {
  const cleanPhone = normalizeDigits(value);
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O telefone informado é inválido.",
    });
  }
  return cleanPhone;
}

export const checkoutRouter = router({
  payment: paymentRouter,

  placeOrder: protectedProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "checkout-place-order",
        limit: 12,
        windowMs: 10 * 60 * 1000,
      }),
    )
    .input(
      z.object({
        id: z.string().min(1),
        paymentMethodId: z.preprocess(
          (value) => String(value || ""),
          z.string().min(1),
        ),
        shippingType: z.enum(["delivery", "pickup"]),
        addressId: z.string().nullable().optional(),
        notes: z.string().optional().nullable(),
        customerDocument: z.string().min(11, "CPF incompleto"),
        customerName: z.string().min(1, "Nome é obrigatório"),
        customerPhone: z.string().min(10, "Telefone inválido"),
        useLoyaltyPoints: z.boolean().default(false),
        loyaltyDiscount: z.number().optional(),
        discountAmount: z.number().optional(),
        shippingCost: z.number().optional(),
        totalAmount: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const cleanCpf = ensureValidCpf(input.customerDocument);
      const cleanPhone = ensureValidPhone(input.customerPhone);
      const cleanCustomerName = ensureCustomerName(input.customerName);

      const db = await getDb();
      const cartId = input.id;
      const userId = ctx.user.id;
      const checkoutClosedBefore = new Date();

      try {
        return await db.transaction(async (tx) => {
          const castTx = tx as unknown as BaseTx;
          const finalAddressId = input.addressId ?? null;

          if (input.shippingType === "delivery") {
            if (!finalAddressId || finalAddressId === "guest") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "ID de endereço inválido para entrega.",
              });
            }

            const [existingAddress] = await tx
              .select({ id: userAddresses.id })
              .from(userAddresses)
              .where(
                and(
                  eq(userAddresses.id, finalAddressId),
                  eq(userAddresses.userId, userId),
                ),
              )
              .limit(1);

            if (!existingAddress) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Endereço não localizado ou não pertence à sua conta.",
              });
            }
          }

          const addressSnapRaw = await loadAddressSnapshot(castTx, {
            shippingType: input.shippingType,
            addressId: finalAddressId,
          });
          const realShippingCost = Number(addressSnapRaw.price || 0);

          const checkout = await recalculateCheckoutFromCart({
            userId,
            cartId,
            shippingCost: realShippingCost,
            paymentMethodId: String(input.paymentMethodId),
            useLoyaltyPoints: input.useLoyaltyPoints,
          });

          const payMethod = await tx
            .select()
            .from(paymentMethods)
            .where(eq(paymentMethods.id, String(input.paymentMethodId)))
            .limit(1)
            .then((rows) => rows[0]);

          const orderId = await createOrderWithItems({
            tx: castTx,
            userId,
            input: {
              shippingType: input.shippingType,
              customerName: cleanCustomerName,
              customerDocument: cleanCpf,
              customerPhone: cleanPhone,
              notes: input.notes,
            },
            shippingCost: checkout.shippingCost,
            totals: {
              subtotal: checkout.subtotal,
              totalDiscounts: checkout.totalDiscounts,
              loyaltyDiscount: checkout.loyaltyDiscount,
            },
            details: {
              couponCode: checkout.cart.couponCode,
              autoDiscountName: checkout.autoDiscountName,
              loyaltyValue: checkout.loyaltyDiscount,
              paymentDiscount: checkout.paymentDiscount,
              paymentMethodName: checkout.paymentMethodName,
              finalNetCalculated: checkout.total,
            },
            addressSnap: {
              ...addressSnapRaw,
              zipCode: addressSnapRaw.zipCode ?? undefined,
            } as AddressSnap,
            payMethod,
            verifiedItems: checkout.items,
            pointsUsed: checkout.pointsUsed,
            pointsEarned: checkout.pointsEarned,
            finalNet: checkout.total,
          });

          const cleanOrderId = String(orderId).replace(/[#\s]/g, "");

          if (checkout.pointsUsed > 0 || checkout.pointsEarned > 0) {
            const [userProfile] = await tx
              .select()
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);
            const currentBalance = Number(userProfile?.availablePoints || 0);

            if (checkout.pointsUsed > 0) {
              const finalPointsToRedeem = Math.min(
                checkout.pointsUsed,
                currentBalance,
              );
              await tx.insert(loyaltyHistory).values({
                id: randomUUID(),
                userId,
                orderId: cleanOrderId,
                pointsChange: -finalPointsToRedeem,
                type: "redeemed",
                reason: "Resgate em Pedido",
              });
              await tx
                .update(users)
                .set({
                  availablePoints: sql`${users.availablePoints} - ${finalPointsToRedeem}`,
                })
                .where(eq(users.id, userId));
            }

            if (checkout.pointsEarned > 0) {
              await tx.insert(loyaltyHistory).values({
                id: randomUUID(),
                userId,
                orderId: cleanOrderId,
                pointsChange: checkout.pointsEarned,
                type: "earned",
                reason: "Compra Gourmet Saudável",
              });
              await tx
                .update(users)
                .set({
                  availablePoints: sql`${users.availablePoints} + ${checkout.pointsEarned}`,
                })
                .where(eq(users.id, userId));
            }
          }

          await tx
            .update(users)
            .set({
              name: encrypt(cleanCustomerName),
              customerDocument: encrypt(cleanCpf),
              documentIndex: piiHash(cleanCpf),
              phone: encrypt(cleanPhone),
              phoneIndex: piiHash(cleanPhone),
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          await cleanupCheckoutCarts(castTx, {
            cartId,
            userId,
            guestId: ctx.guestId,
            closedBefore: checkoutClosedBefore,
          });

          return {
            success: true,
            orderId: cleanOrderId,
            message: "Pedido criado com sucesso!",
          };
        });
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Falha crítica no processamento do pedido.",
        });
      }
    }),
});
