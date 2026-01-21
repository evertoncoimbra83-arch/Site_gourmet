import { z } from "zod";
import { getDb } from "./db.js";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { orders, carts, cartItems, orderItems, appConfigs } from "../drizzle/schema/index.js"; 
import crypto from "crypto";

/**
 * ✅ BUSCA UMA CONFIGURAÇÃO (Ex: Layout da Zebra)
 */
export async function getConfig(key: string) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "Falha no banco." });

    const [result] = await db
        .select()
        .from(appConfigs)
        .where(eq(appConfigs.configKey, key))
        .limit(1);

    return result || null;
}

/**
 * ✅ SALVA OU ATUALIZA UMA CONFIGURAÇÃO (Upsert)
 */
export async function setConfig(key: string, value: string) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "Falha no banco." });

    try {
        return await db.insert(appConfigs)
            .values({
                configKey: key,
                configValue: value
            })
            .onDuplicateKeyUpdate({
                set: { configValue: value }
            });
    } catch (error: any) {
        console.error("Erro ao salvar config:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "Erro ao gravar configuração no banco." });
    }
}

// --- LÓGICA DE CHECKOUT REVISADA ---

const createOrderInputSchema = z.object({
    cartId: z.string(), 
    shippingType: z.enum(['delivery', 'pickup']),
    selectedAddressId: z.string().optional().nullable(), 
    shippingCost: z.number(),
    paymentMethod: z.string(),
    notes: z.string().optional().nullable(),
    changeFor: z.number().optional().nullable(),
    // Estes campos do input agora servem apenas como backup ou auditoria
    loyaltyDiscount: z.number().optional().default(0), 
    paymentDiscount: z.number().optional().default(0),
});

type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export async function createOrder(input: CreateOrderInput, userId: string | null) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "Falha no banco." });

    const { 
        cartId, 
        shippingCost, 
        paymentMethod, 
        notes, 
        selectedAddressId,
        paymentDiscount 
    } = input;

    // 1. Busca o carrinho e os itens
    const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    if (!cart) throw new TRPCError({ code: 'NOT_FOUND', message: "Carrinho não encontrado." });

    const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));

    // 2. ✅ FONTE DA VERDADE: Extrai os cálculos do Monitor de Sincronia (logic.ts)
    const cartDetails = cart.discountsJson 
        ? (typeof cart.discountsJson === 'string' ? JSON.parse(cart.discountsJson) : cart.discountsJson) 
        : {};
    
    const totals = cartDetails.totals || {};

    // 3. ✅ SOMA DOS DESCONTOS REAIS (Buscando o valor de fidelidade do servidor)
    const subtotal = Number(totals.subtotal || 0);
    const autoDiscount = Number(totals.autoDiscount || 0);
    const couponDiscount = Number(totals.couponDiscount || 0);
    
    // Se o loyaltyDiscount for uma string de erro no JSON, o Number() retornará 0, o que é seguro.
    const loyaltyDiscountServer = Number(totals.loyaltyDiscount || 0);

    // Soma total de benefícios
    const totalBenefit = autoDiscount + couponDiscount + loyaltyDiscountServer + paymentDiscount;
    
    // Cálculo final do checkout
    const finalTotal = Math.max(0, subtotal + shippingCost - totalBenefit);

    const orderId = `PED-${Math.random().toString(36).toUpperCase().substring(2, 9)}`;

    try {
        await db.transaction(async (tx) => {
            // 4. Insere o Pedido
            await tx.insert(orders).values({
                id: orderId,
                userId: userId,
                status: "pending",
                subtotal: String(subtotal.toFixed(2)),
                shippingCost: String(shippingCost.toFixed(2)),
                discount: String(totalBenefit.toFixed(2)), // Registra a soma de todos os descontos
                total: String(finalTotal.toFixed(2)),
                paymentMethod,
                shippingAddressId: selectedAddressId,
                observation: notes,
                createdAt: new Date(),
            } as any);

            // 5. Transfere os itens do carrinho para o pedido
            for (const item of items) {
                const itemData = item as any;
                
                await tx.insert(orderItems).values({
                    id: crypto.randomUUID(),
                    orderId: orderId,
                    dishId: itemData.dishId,
                    name: itemData.name,
                    quantity: itemData.quantity,
                    unitPrice: itemData.unitPrice,
                    subtotal: itemData.totalPrice || (Number(itemData.unitPrice) * itemData.quantity),
                    optionsJson: itemData.optionsJson || itemData.accompaniments || "{}"
                } as any);
            }

            // 6. Finaliza o carrinho e limpa itens
            await tx.update(carts).set({ status: 'finalized', updatedAt: new Date() } as any).where(eq(carts.id, cartId));
            await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
        });

        return { orderId, success: true, totalFinal: finalTotal };

    } catch (error: any) {
        console.error("Erro no checkout:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
}