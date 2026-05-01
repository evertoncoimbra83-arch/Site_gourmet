// server/utils/calculateOrderTotal.ts
import { getDb } from "../db";
import { dishes, dishSizes, accompanimentOptions } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

interface CartItemInput {
  dishId: number;
  selectedSizeId: number;
  selectedAccompanimentIds: number[]; // Array de IDs das opções (extras)
  quantity: number;
}

export async function calculateVerifiedTotal(items: CartItemInput[]) {
  const db = await getDb();
  let grandTotal = 0;

  for (const item of items) {
    // 1. Busca o preço base do Prato
    const [dish] = await db
      .select({ price: dishes.basePrice, salePrice: dishes.salePrice })
      .from(dishes)
      .where(eq(dishes.id, item.dishId));

    if (!dish) throw new Error(`Prato ID ${item.dishId} não encontrado/ativo.`);

    // Usa o preço promocional se existir, senão o base
    let unitPrice = Number(dish.salePrice || dish.price);

    // 2. Busca o modificador do Tamanho
    const [size] = await db
      .select({ priceModifier: dishSizes.priceModifier })
      .from(dishSizes)
      .where(eq(dishSizes.id, item.selectedSizeId));

    if (size) {
      // Se sua lógica é porcentagem (ex: +20%)
      // unitPrice += unitPrice * (Number(size.priceModifier) / 100);
      
      // OU Se sua lógica for valor fixo (ex: + R$ 10,00) - Ajuste conforme sua regra de negócio
      unitPrice += Number(size.priceModifier || 0); 
    }

    // 3. Busca o somatório dos Acompanhamentos
    if (item.selectedAccompanimentIds.length > 0) {
      const options = await db
        .select({ priceModifier: accompanimentOptions.priceModifier })
        .from(accompanimentOptions)
        .where(inArray(accompanimentOptions.id, item.selectedAccompanimentIds));

      const accompanimentsTotal = options.reduce((acc, opt) => acc + Number(opt.priceModifier || 0), 0);
      unitPrice += accompanimentsTotal;
    }

    // 4. Soma ao total geral multiplicado pela quantidade
    grandTotal += unitPrice * item.quantity;
  }

  return grandTotal;
}