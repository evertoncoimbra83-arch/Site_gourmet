import { z } from "zod";
import { router, protectedProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { paymentMethods, authUsers } from "drizzle/schema/index.js";
// Certifique-se que estes arquivos existem na mesma pasta:
import { loadLoyaltyConfig, computeLoyalty } from "./loyalty.js";
import { loadCartAndSnapshot } from "./snapshot.js";
import { loadAddressSnapshot } from "./address.js";
import { computeFinalNet, createOrderWithItems, cleanupCart } from "./orders.js";
import { decrypt } from "server/encryption.js"; 
import { paymentRouter } from "./payment.js"; // ✅ Importado corretamente

// --- Helper de Descriptografia Segura ---
function safeDecrypt(value: any): string {
  if (!value || typeof value !== 'string') return String(value || "");
  if (value.split(':').length === 3) {
    const result = decrypt(value);
    return result !== null ? result : value;
  }
  return value.split(/([, \-]+)/).map(part => {
    if (part.split(':').length === 3) {
      const d = decrypt(part);
      return d !== null ? d : part;
    }
    return part;
  }).join("");
}

export const checkoutRouter = router({
  
  // ✅ AQUI ESTAVA FALTANDO: Conecta o roteador de pagamento
  // Isso faz o 'trpc.checkout.payment.getMethods' funcionar no frontend
  payment: paymentRouter,

  // --- MUTATION DE FINALIZAR PEDIDO ---
  placeOrder: protectedProcedure
    .input(z.object({
      id: z.string().min(1), // ID do Carrinho
      paymentMethodId: z.preprocess(
        (val) => (val === null || val === undefined || val === "") ? undefined : String(val), 
        z.string().min(1, "Selecione um método de pagamento")
      ),
      shippingType: z.enum(["delivery", "pickup"]),
      addressId: z.preprocess(
        (val) => (!val || val === "NaN" || val === "") ? null : String(val), 
        z.string().nullable()
      ).optional(),
      notes: z.string().optional().nullable(),
      customerDocument: z.string().min(11, "CPF inválido"), 
      customerName: z.string().min(1, "Nome é obrigatório"),
      customerPhone: z.string().min(10, "Telefone inválido"),
      shippingCost: z.number().default(0),
      useLoyaltyPoints: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      const cartId = input.id;

      try {
        return await db.transaction(async (tx) => {
          
          // 1. Loads
          const loyaltyCfg = await loadLoyaltyConfig(tx);
          const { cart, totals, items } = await loadCartAndSnapshot(tx, userId, cartId);
          if (!cart) throw new TRPCError({ code: "NOT_FOUND", message: "Carrinho vazio." });

          // 2. Endereço
          const rawAddressSnap = await loadAddressSnapshot(tx, {
            shippingType: input.shippingType,
            addressId: input.addressId ?? null,
          }, userId);

          let addressSnap: any = rawAddressSnap;
          if (addressSnap && typeof addressSnap === 'object') {
            addressSnap = {
              ...addressSnap,
              street: safeDecrypt(addressSnap.street || addressSnap.address || addressSnap.text),
              neighborhood: safeDecrypt(addressSnap.neighborhood),
              number: safeDecrypt(addressSnap.number),
              complement: safeDecrypt(addressSnap.complement),
              city: safeDecrypt(addressSnap.city),
              state: safeDecrypt(addressSnap.state),
            };
          }

          // 3. Cálculos
          const subtotal = Number(totals.subtotal || 0);
          const shippingCost = Number(input.shippingCost || 0);
          const discountsTotal = Number(totals.totalDiscounts || 0); 
          const finalNet = computeFinalNet(subtotal, shippingCost, discountsTotal);

          // 4. Fidelidade
          const discountsData = cart.discountsJson ? JSON.parse(cart.discountsJson as string) : {};
          const { pointsUsed, pointsEarned } = computeLoyalty({
            cfg: loyaltyCfg,
            details: discountsData, 
            useLoyaltyPoints: input.useLoyaltyPoints,
            finalNet,
          });

          // 5. Validação Pagamento
          const payMethod = await tx.select().from(paymentMethods)
            .where(eq(paymentMethods.id, String(input.paymentMethodId)))
            .limit(1)
            .then(r => r[0]);
            
          if (!payMethod) throw new TRPCError({ code: "BAD_REQUEST", message: "Pagamento inválido." });

          // 6. Criar Pedido
          const orderId = await createOrderWithItems({
            tx, userId, input, shippingCost, totals, 
            details: { couponCode: cart.couponCode, autoDiscountName: discountsData.autoDiscountName }, 
            addressSnap, payMethod, cartItemsJoined: items, pointsUsed, pointsEarned, finalNet,
          });

          // 7. Limpeza
          await cleanupCart(tx, cartId);

          // 8. E-mail
          try {
            const [userAuth] = await tx.select({ email: authUsers.email })
              .from(authUsers)
              .where(eq(authUsers.id, userId))
              .limit(1);

            if (userAuth?.email) {
              const { mailer } = await import("../../lib/mailer.js");

              // Formatação dos Itens para Email
              const emailItems = items.map((i: any) => {
                let displayDetails = "";
                let displayName = i.productName || i.name || "Produto";

                try {
                  const opts = typeof i.options === 'string' ? JSON.parse(i.options) : i.options;
                  if (opts && typeof opts === 'object') {
                    if (opts._type === 'multi') {
                      displayName = `📦 ${opts.packageName || displayName}`;
                      if (Array.isArray(opts.meals)) {
                        displayDetails = opts.meals.map((meal: any, idx: number) => {
                          const accs = meal.selectedAccompaniments?.map((a: any) => a.name).join(', ') || "Sem acomp.";
                          return `<div style="margin-bottom:4px;"><strong>${idx + 1}. ${meal.dishName}</strong><br><span style="font-size:11px;color:#666;">+ ${accs}</span></div>`;
                        }).join('');
                      }
                    } else if (opts._type === 'single') {
                      if (opts.selectedSize?.name) displayName += ` (${opts.selectedSize.name})`;
                      if (Array.isArray(opts.selectedAccompaniments) && opts.selectedAccompaniments.length > 0) {
                        const accs = opts.selectedAccompaniments.map((a: any) => `+ ${a.name}`).join('<br>');
                        displayDetails = `<span style="color:#059669;font-size:11px;">${accs}</span>`;
                      }
                    }
                  }
                } catch (e) { displayDetails = "Item Padrão"; }

                const qty = i.quantity || 1;
                const price = Number(i.unitPrice || 0);
                const totalLine = (price * qty).toFixed(2);
                
                return {
                  name: displayName,
                  details: `<div style="margin-top:2px;">${displayDetails}<div style="font-weight:bold;font-size:12px;margin-top:4px;">Qtd: ${qty} x R$ ${price.toFixed(2)} = R$ ${totalLine}</div></div>`
                };
              });

              // Endereço para Email
              let addressStr = "Retirada no Local";
              if (addressSnap && input.shippingType === 'delivery') {
                addressStr = `${addressSnap.street}, ${addressSnap.number}<br>${addressSnap.neighborhood} - ${addressSnap.city}/${addressSnap.state}`;
              }

              await mailer.sendOrderConfirmation(userAuth.email, {
                id: orderId,
                customerName: input.customerName,
                items: emailItems,
                address: addressStr,
                financials: {
                  subtotal: `R$ ${subtotal.toFixed(2)}`,
                  shipping: `R$ ${shippingCost.toFixed(2)}`,
                  discount: `R$ ${discountsTotal.toFixed(2)}`,
                  total: `R$ ${finalNet.toFixed(2)}`
                }
              });
            }
          } catch (emailErr) {
            console.error("⚠️ Falha ao enviar e-mail:", emailErr);
          }

          return { success: true, orderId, total: finalNet, pointsEarned };
        });
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro no checkout." });
      }
    }),
});