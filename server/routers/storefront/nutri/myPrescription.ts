// server/routers/storefront/nutri/myPrescription.ts

import { z } from "zod"; 
import { protectedProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { prescriptions, prescriptionItems, nutriScansTemp } from "../../../../drizzle/schema/index.js"; 
import { eq, desc, and, gt } from "drizzle-orm";

// 📦 DOMÍNIO COMPARTILHADO
import { calculatePrescriptionItemPrice } from "@shared/domain/prescription/logic.js";
import { type PrescriptionMealItem } from "@shared/domain/prescription/types.js";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

// Interfaces locais para IA
interface IAMealOption {
  dishId: string | number;
  sizeId?: string | number;
  name?: string;
  priceAtCreation?: number;
}

interface IAMeal {
  name?: string;
  mealName?: string;
  notes?: string;
  dishes?: IAMealOption[];
  groups?: Array<{ options: IAMealOption[] }>;
}

export const myPrescriptionProcedures = {
  
  getMyPrescription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = ctx.user.id;

    // 1. BUSCA DE DADOS BRUTOS
    const allPrescs = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.clientId, userId))
      .orderBy(desc(prescriptions.updatedAt));

    const aiScans = await db
      .select()
      .from(nutriScansTemp)
      .where(
        and(
          eq(nutriScansTemp.userId, userId), 
          gt(nutriScansTemp.expiresAt, new Date())
        )
      )
      .orderBy(desc(nutriScansTemp.createdAt));

    // 2. PROCESSAMENTO DAS PRESCRIÇÕES OFICIAIS
    const processedOfficial = await Promise.all(allPrescs.map(async (presc) => {
      const items = await db
        .select()
        .from(prescriptionItems)
        .where(eq(prescriptionItems.prescriptionId, presc.id))
        .orderBy(prescriptionItems.order);

      // Tipagem explícita do Record para evitar 'any' no acúmulo de pratos
      const meals: Record<string, { mealName: string; order: number; dishes: PrescriptionMealItem[] }> = {};

      items.forEach(item => {
        const mName = item.mealName || "Refeição";
        if (!meals[mName]) {
          meals[mName] = { mealName: mName, order: item.order ?? 0, dishes: [] };
        }
        
        const originalPrice = safeNumber(item.fixedPrice);
        const discount = safeNumber(presc.discountPercentage);

        // Cast para Record para acessar propriedades que podem não estar no schema TS do Drizzle
        const itemData = item as Record<string, unknown>;

        meals[mName].dishes.push({
          id: String(item.dishId),
          name: item.dishName || "Prato",
          qty: 1,
          price: calculatePrescriptionItemPrice(originalPrice, discount),
          categoryId: String(itemData.categoryId || 0),
          sizeId: Number(item.sizeId)
        });
      });

      return {
        id: presc.id,
        planName: presc.planName || "Plano Alimentar",
        technicalInsight: presc.technicalInsight || "",
        discountPercentage: safeNumber(presc.discountPercentage),
        meals: Object.values(meals).sort((a, b) => a.order - b.order),
        type: 'official',
        createdAt: presc.createdAt
      };
    }));

    // 3. PROCESSAMENTO DOS SCANS DA IA
    const processedAI = aiScans.map(scan => {
      const rawData = safeJsonParse<IAMeal[]>(scan.suggestedData, []);

      const meals = (Array.isArray(rawData) ? rawData : []).map((m, idx) => ({
        mealName: m.name || m.mealName || `Refeição ${idx + 1}`,
        notes: m.notes || "",
        dishes: (m.dishes || m.groups?.flatMap(g => g.options) || []).map((d: IAMealOption) => ({
          id: String(d.dishId),
          name: d.name || "Prato Sugerido",
          qty: 1,
          price: safeNumber(d.priceAtCreation),
          categoryId: "0",
          sizeId: d.sizeId ? safeNumber(d.sizeId) : undefined
        }))
      }));

      return {
        id: scan.id,
        planName: "Análise via Scanner AI",
        technicalInsight: "Plano gerado automaticamente a partir da sua foto/texto.",
        discountPercentage: 0,
        meals: meals,
        type: 'ai_scan',
        createdAt: scan.createdAt
      };
    });

    // 4. UNIÃO E ORDENAÇÃO POR DATA
    return [...processedAI, ...processedOfficial].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }),

  deleteScan: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      await db.delete(nutriScansTemp)
        .where(
          and(
            eq(nutriScansTemp.id, input.id), 
            eq(nutriScansTemp.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
};
