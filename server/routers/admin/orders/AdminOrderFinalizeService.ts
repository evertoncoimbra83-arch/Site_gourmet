import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db.js";
import { TRPCError } from "@trpc/server";
import { encrypt } from "../../../encryption.js";
import * as schema from "../../../../drizzle/schema/index.js";
import { unseal, generateFriendlyOrderId } from "./AdminOrderHelpers.js";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

export const AdminOrderFinalizeService = {
  async finalize(draftId: string) {
    const db = await getDb();
    
    // 1. Busca o Rascunho e Itens
    const [draft] = await db.select()
      .from(schema.adminOrderDrafts)
      .where(eq(schema.adminOrderDrafts.id, draftId))
      .limit(1);
      
    const items = await db.select()
      .from(schema.adminOrderDraftItems)
      .where(eq(schema.adminOrderDraftItems.draftId, draftId));
    
    if (!draft || !items.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Carrinho vazio ou não encontrado." });
    }

    const meta = safeJsonParse<Record<string, unknown>>(draft.metadataJson, {});
    const snap = safeJsonParse<Record<string, unknown>>(draft.discountsSnapshot, {});
    const addr = meta.address || {};
    const editingOrderId =
      typeof meta.editingOrderId === "string" ? meta.editingOrderId : "";
    const paymentStatus = meta.paymentStatus === "paid" ? "paid" : "pending";
    const notes = typeof meta.notes === "string" ? meta.notes : "";
    const orderDate =
      typeof meta.orderDate === "string" || typeof meta.orderDate === "number"
        ? meta.orderDate
        : null;
    
    const subtotal = items.reduce((acc, it) => acc + (safeNumber(it.unitPrice) * (it.quantity || 1)), 0);
    const orderId = generateFriendlyOrderId();

    await db.transaction(async (tx) => {
      
      // 2. TRATAMENTO DE EDIÇÃO (Cancela o pedido anterior)
      if (editingOrderId) {
        await tx.update(schema.orders)
          .set({ 
            status: "cancelled", 
            notes: sql`CONCAT(COALESCE(${schema.orders.notes}, ''), ' | Substituído pelo: ', ${orderId})`,
            updatedAt: new Date()
          })
          .where(eq(schema.orders.id, editingOrderId));
      }

      // 3. Inserir Novo Pedido
      const newOrder: typeof schema.orders.$inferInsert = {
        id: orderId, 
        userId: draft.userId || "admin_system", 
        status: paymentStatus === 'paid' ? "preparing" : "pending", 
        // ✅ REMOVIDO: 'origin' (não existe no schema)
        paymentMethod: String(meta.paymentMethod || snap.paymentMethodName || "Presencial"),
        paymentStatus,
        notes,
        subtotal: subtotal.toFixed(2), 
        total: (subtotal + safeNumber(draft.shippingValue) - safeNumber(draft.discountValue)).toFixed(2),
        shippingCost: safeNumber(draft.shippingValue).toFixed(2),
        totalDiscount: safeNumber(draft.discountValue).toFixed(2),
        customerName: encrypt(unseal((meta.customer as Record<string, unknown> | undefined)?.name || "") || "Cliente PDV"),
        customerPhone: encrypt(unseal((meta.customer as Record<string, unknown> | undefined)?.phone || "") || ""),
        shippingAddress: encrypt(unseal((addr as Record<string, unknown>).shipping_address || "") || "Venda Presencial"),
        shippingAddressNumber: encrypt(unseal((addr as Record<string, unknown>).shipping_address_number || "") || ""),
        shippingAddressComplement: encrypt(unseal((addr as Record<string, unknown>).shipping_address_complement || "") || ""),
        shippingNeighborhood: encrypt(unseal((addr as Record<string, unknown>).shipping_neighborhood || "") || ""),
        shippingCity: unseal((addr as Record<string, unknown>).shipping_city || ""),
        shippingState: unseal((addr as Record<string, unknown>).shipping_state || ""),
        shippingZipCode: unseal((addr as Record<string, unknown>).zipCode || (addr as Record<string, unknown>).shipping_zip_code || ""),
        discountsSnapshot: draft.discountsSnapshot,
        createdAt: orderDate ? new Date(orderDate) : new Date(), 
        updatedAt: new Date()
      };

      await tx.insert(schema.orders).values(newOrder);

      // 4. Inserir Itens do Pedido
      for (const it of items) {
        const qty = it.quantity ?? 1;
        const newItem: typeof schema.orderItems.$inferInsert = {
          id: it.id,
          orderId: orderId,
          dishId: it.dishId,
          packageId: it.packageId,
          dishName: encrypt(it.name || "Item") || "Item",
          unitPrice: String(it.unitPrice),
          quantity: qty,
          options: it.options,
          appliedNutrition: it.appliedNutrition,
          totalPrice: (safeNumber(it.unitPrice) * qty).toFixed(2)
        };
        await tx.insert(schema.orderItems).values(newItem);
      }

      // 5. Atualização de Fidelidade
      if (draft.userId) {
        const pointsUsed = safeNumber(meta.loyaltyPointsUsed);
        const pointsEarned = Math.floor(subtotal);

        await tx.execute(sql`
          UPDATE users 
          SET loyalty_balance = GREATEST(COALESCE(loyalty_balance, 0) - ${pointsUsed} + ${pointsEarned}, 0)
          WHERE id = ${draft.userId}
        `);
      }

      // 6. Limpeza do Rascunho
      await tx.delete(schema.adminOrderDraftItems).where(eq(schema.adminOrderDraftItems.draftId, draftId));
      await tx.delete(schema.adminOrderDrafts).where(eq(schema.adminOrderDrafts.id, draftId));
    });

    return { success: true, orderId };
  }
};
