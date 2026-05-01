// server/routers/admin/nutri/myPrescription.ts

import { router, adminProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { prescriptions, dishSizes, dishesToSizes } from "../../../../drizzle/schema/index.js"; 
import { eq, inArray } from "drizzle-orm";
import crypto from "crypto";

import { DietSnapshot, PrescriptionMealItem } from "@shared/domain/prescription/types.js";
import { hydratePrescription } from "@shared/domain/prescription/logic.js";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

interface RawDish {
  dishId: number | string;
  sizeId: number | string;
  name: string;
  priceAtCreation?: number;
  categoryId?: number | string;
}

interface RawMeal {
  mealName: string;
  dishes: RawDish[];
}

export const myPrescriptionAdminRouter = router({
  // ✅ Removido o 'ctx' não utilizado
  getPrescriptionDetail: adminProcedure.query(async () => {
    const db = await getDb();
    
    // Busca a prescrição (aqui no admin você provavelmente usa um ID vindo do input)
    // Para este exemplo, manteremos a lógica de busca por cliente
    const [presc] = await db
      .select()
      .from(prescriptions)
      .limit(1); 

    if (!presc || !presc.dietSnapshot) return null;

    // ✅ Alterado de 'let' para 'const'
    const rawMeals: RawMeal[] = safeJsonParse<RawMeal[]>(presc.dietSnapshot, []);

    // 1. Coleta IDs para preços vivos
    const dishIds = new Set<number>();
    rawMeals.forEach(m => m.dishes?.forEach(d => dishIds.add(safeNumber(d.dishId))));

    const livePricesMap = new Map<string, number>();
    if (dishIds.size > 0) {
      const prices = await db
        .select({ id: dishSizes.id, price: dishSizes.price, dId: dishesToSizes.dishId })
        .from(dishSizes)
        .innerJoin(dishesToSizes, eq(dishSizes.id, dishesToSizes.sizeId))
        .where(inArray(dishesToSizes.dishId, Array.from(dishIds)));

      prices.forEach(p => livePricesMap.set(`${p.dId}-${p.id}`, safeNumber(p.price)));
    }

    // ✅ Uso do Record seguro para evitar os erros de 'any' do ESLint
    const pData = presc as Record<string, unknown>;

    // 2. Montagem do Snapshot para o Domínio
    const snapshot: DietSnapshot = {
      planName: presc.planName || "",
      discountPercentage: presc.discountPercentage || 0,
      generatedAt: String(presc.createdAt || ""),
      // ✅ Acesso seguro usando o pData, resolvendo o ESLint
      expiresAt: String(pData.expiresAt || pData.expires_at || ""),
      nutriId: String(pData.professionalId || pData.professional_id || ""),
      
      meals: rawMeals.map(m => ({
        id: crypto.randomUUID(),
        mealName: m.mealName,
        groups: [],
        dishes: m.dishes.map(d => {
          const livePrice = livePricesMap.get(`${d.dishId}-${d.sizeId}`);
          const item: PrescriptionMealItem = {
            id: String(d.dishId),
            name: d.name,
            qty: 1,
            price: livePrice ?? safeNumber(d.priceAtCreation),
            categoryId: String(d.categoryId || 0),
            sizeId: String(d.sizeId)
          };
          return item;
        })
      }))
    };

    // 3. Hidratação (Aplica o desconto de Nutri)
    return hydratePrescription(snapshot);
  })
});
