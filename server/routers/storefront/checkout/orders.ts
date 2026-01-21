import { eq } from "drizzle-orm";
import { orders, orderItems, cartItems, carts } from "../../../../drizzle/schema/index.js";
import { decrypt } from "../../../encryption.js"; 
import crypto from "crypto";

/**
 * ✅ GERAÇÃO DE ID AMIGÁVEL
 * Formato: GS-YYMM-RAND (Ex: GS-2601-A2B4)
 */
function generateFriendlyOrderId() {
  const date = new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `GS-${year}${month}-${random}`;
}

/**
 * 🧮 Calcula o valor líquido final (Net Total)
 */
export function computeFinalNet(
  subtotal: number,
  shipping: number,
  discounts: number
) {
  return Math.max(0, Number((subtotal + shipping - discounts).toFixed(2)));
}

/**
 * 🔑 Helper seguro para descriptografar campos sensíveis
 */
function safeDecrypt(value: any): string {
  if (!value || typeof value !== 'string') return String(value || "");
  // Verifica se está no formato de criptografia (contém colons)
  if (value.split(':').length === 3) {
    try {
      const decrypted = decrypt(value);
      return decrypted || value;
    } catch (e) {
      return value;
    }
  }
  return value;
}

/**
 * 📦 Cria o pedido e seus itens dentro de uma transação
 */
export async function createOrderWithItems(params: {
  tx: any; 
  userId: string | null; 
  input: any; 
  shippingCost: number; 
  totals: any;
  details: any; 
  addressSnap: any; 
  payMethod: any; 
  cartItemsJoined: any[];
  pointsUsed: number; 
  pointsEarned: number; 
  finalNet: number;
}) {
  const { 
    tx, userId, input, shippingCost, totals, 
    details, addressSnap, payMethod, cartItemsJoined, 
    pointsUsed, pointsEarned, finalNet 
  } = params;

  // 1. Gerar ID Amigável para o Pedido
  const newOrderId = generateFriendlyOrderId();

  // 2. Preparação do Endereço
  let addr = addressSnap;
  if (typeof addressSnap === 'string' && addressSnap.trim().startsWith('{')) {
    try { addr = JSON.parse(addressSnap); } catch (e) { addr = {}; }
  }

  const street = safeDecrypt(addr?.street || addr?.address || addr?.text || (input.shippingType === 'pickup' ? "Retirada" : ""));
  const number = safeDecrypt(addr?.number);
  const neighborhood = safeDecrypt(addr?.neighborhood);
  const complement = safeDecrypt(addr?.complement);
  const city = safeDecrypt(addr?.city);
  const state = safeDecrypt(addr?.state);
  const zip = safeDecrypt(addr?.zipCode || addr?.zip);

  // 3. Inserção do Cabeçalho (orders)
  await tx.insert(orders).values({
    id: newOrderId, 
    userId: userId ? String(userId) : null,
    status: "pending",

    subtotal: Number(totals.subtotal || 0).toFixed(2),
    shippingCost: Number(shippingCost || 0).toFixed(2),
    totalDiscount: Number(totals.totalDiscounts || 0).toFixed(2), 
    total: Number(finalNet || 0).toFixed(2),

    paymentMethod: payMethod?.name || "Não informado",
    paymentStatus: "pending",
    shippingType: input.shippingType,

    shippingAddress: street,
    shippingAddressNumber: number,
    shippingAddressComplement: complement,
    shippingNeighborhood: neighborhood,
    shippingCity: city,
    shippingState: state,
    shippingZipCode: zip,

    customerName: input.customerName,
    customerDocument: input.customerDocument, 
    customerPhone: input.customerPhone,       

    loyaltyPointsUsed: Number(pointsUsed || 0),
    loyaltyPointsEarned: Number(pointsEarned || 0),

    discountsSnapshot: JSON.stringify({ ...details, totals }),
    notes: input.notes || "",
  });

  // 4. Inserção dos Itens (order_items)
  if (cartItemsJoined && cartItemsJoined.length > 0) {
    const itemsToInsert = cartItemsJoined.map((row) => {
      // Normalização: pega o item independente de vir de um join ou objeto puro
      const cItem = row.cart_items || row.cartItems || row;
      
      // Parse obrigatório do JSON options do carrinho
      let opts: any = {};
      try {
        opts = typeof cItem.options === 'string' ? JSON.parse(cItem.options) : (cItem.options || {});
      } catch (e) { opts = {}; }

      // Resolve o nome (prioridade para o que foi escolhido no carrinho/pacote)
      const displayName = opts.dishName || opts.packageName || cItem.name || "Item";
      
      const unitPrice = Number(cItem.unitPrice || 0);
      const qty = Number(cItem.quantity || 1);

      return {
        id: `ITM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        orderId: newOrderId,
        dishId: cItem.dishId ? String(cItem.dishId) : null,
        packageId: cItem.packageId ? String(cItem.packageId) : null,
        dishName: displayName,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        totalPrice: (unitPrice * qty).toFixed(2), 
        
        // ✅ CORREÇÃO: Salva no campo 'options' (JSON completo)
        options: JSON.stringify(opts),
        
        // ✅ LEGADO: Salva acompanhamentos em texto se for prato individual
        accompaniments: opts.selectedAccompaniments ? JSON.stringify(opts.selectedAccompaniments) : "[]",
        
        appliedNutrition: cItem.appliedNutrition ? (typeof cItem.appliedNutrition === 'string' ? cItem.appliedNutrition : JSON.stringify(cItem.appliedNutrition)) : null,
      };
    });

    await tx.insert(orderItems).values(itemsToInsert);
  }

  return newOrderId; // Retorna o ID amigável GS-
}

/**
 * 🧹 Limpeza do Carrinho
 */
export async function cleanupCart(tx: any, cartId: string) {
  if (!cartId) return;
  
  // Remove itens
  await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
  
  // Marca carrinho como completado em vez de deletar o cabeçalho
  await tx.update(carts).set({
    status: "completed",
    discountsJson: null,
    couponCode: null,
    updatedAt: new Date(),
  } as any).where(eq(carts.id, cartId));
}