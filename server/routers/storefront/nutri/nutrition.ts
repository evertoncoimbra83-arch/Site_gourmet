// server/routers/storefront/nutri/nutrition.ts

import { z } from "zod";
import { router, publicProcedure } from "../../../_core/trpc.js";
import { dishes, dishSizes, appConfigs } from "../../../../drizzle/schema/index.js"; 
import { and, eq, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { decrypt } from "../../../encryption.js";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

interface AIMeta {
  lunch: { kcal: number; protein: number };
  dinner: { kcal: number; protein: number };
}

export const nutritionRouter = router({
  parsePrescription: publicProcedure
    .input(z.object({ 
      rawText: z.string().optional(),
      imageBase64: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const config = await ctx.db.query.appConfigs.findFirst({
          where: eq(appConfigs.configKey, "gemini_api_key")
        });

        const rawValue = config?.configValue;

        // ✅ Verificação implacável: barra null, undefined e strings vazias
        if (!rawValue) {
          throw new Error("IA não configurada no painel.");
        }
        
        // ✅ CORREÇÃO DEFINITIVA TS2345:
        // O .toString() garante a conversão (útil até se o banco retornar um Buffer do LONGBLOB)
        // E a tipagem explícita ': string' obriga o TypeScript a aceitar a variável limpa.
        const validKey = String(rawValue);
        
        const apiKey = decrypt(validKey);
        if (!apiKey) {
          throw new Error("IA não configurada no painel.");
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Extraia metas de Almoço/Jantar em JSON: { "lunch": { "kcal": 0, "protein": 0 }, "dinner": { "kcal": 0, "protein": 0 } }`;

        let result;
        if (input.imageBase64) {
          result = await model.generateContent([
            prompt,
            { inlineData: { data: input.imageBase64, mimeType: "image/jpeg" } }
          ]);
        } else {
          result = await model.generateContent([prompt, input.rawText || ""]);
        }

        const aiMeta = safeJsonParse<AIMeta>(
          result.response.text().replace(/```json|```/g, "").trim(),
          { lunch: { kcal: 0, protein: 0 }, dinner: { kcal: 0, protein: 0 } },
        );

        const matchedProducts = await ctx.db
          .select({
            id: dishes.id,
            name: dishes.name,
            slug: dishes.slug,
            imageUrl: dishes.imageUrl,
            sizeName: dishSizes.name,
            protein: sql<number>`dish_sizes.protein_g`,
            kcal: sql<number>`dish_sizes.energy_kcal`,
          })
          .from(dishes)
          .innerJoin(dishSizes, sql`${dishes.id} = dish_sizes.dish_id`)
          .where(
            and(
              eq(dishes.isActive, true),
              eq(dishes.isVisible, true),
              sql`dish_sizes.energy_kcal >= ${aiMeta.lunch.kcal * 0.8}`,
              sql`dish_sizes.energy_kcal <= ${aiMeta.lunch.kcal * 1.2}`
            )
          )
          .limit(10);

        const suggestions = matchedProducts
          .sort((a, b) => {
            const diffA = Math.abs(safeNumber(a.protein) - aiMeta.lunch.protein);
            const diffB = Math.abs(safeNumber(b.protein) - aiMeta.lunch.protein);
            return diffA - diffB;
          })
          .slice(0, 4);

        return { success: true, meta: aiMeta, suggestions };

      } catch (err) {
        const error = err as Error;
        console.error("❌ Erro NutritionRouter:", error.message);
        throw new Error("Erro ao processar prescrição.");
      }
    }),
}); 
