//server/workers/nutriWorker.ts
import { Worker, type ConnectionOptions } from "bullmq";
import { NUTRI_QUEUE_NAME } from "../queues/nutriQueue.js";
import { getDb } from "../db.js";
import {
  nutriScansTemp,
  appConfigs,
  dishes,
  dishSizes,
  accompanimentGroups,
  accompanimentOptions,
  dishesToSizes,
  sizeAccompanimentGroups,
  groupToOptions,
  aiExpertTerms,
  agentRuns,
} from "../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { decrypt } from "../encryption.js";
import "dotenv/config";

// Helpers
import { buildNutriAiCatalog } from "./helpers/buildNutriAiCatalog.js";
import {
  normalizeAiPrescriptionResult,
  type NutriCatalog,
} from "./helpers/normalizeAiPrescriptionResult.js";
import { generateNutriPrompt } from "../routers/storefront/ai/prompts/nutriPrompt.js";
import {
  ensureSafeAiResult,
  sanitizeTextForStorage,
} from "../lib/ai-safety.js";
import { safeJsonParse, safeNumber } from "../lib/safe-parse.js";

// --- INTERFACES DE TIPAGEM ---

interface GeminiModelResponse {
  name: string;
  [key: string]: unknown;
}

interface GeminiCheckData {
  models?: GeminiModelResponse[];
  error?: unknown;
}

const redisUrl = process.env.REDIS_URL;

const redisConfig: ConnectionOptions = redisUrl
  ? {
      url: redisUrl,
      maxRetriesPerRequest: null,
    }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: safeNumber(process.env.REDIS_PORT, 6379),
      maxRetriesPerRequest: null,
    };

export const nutriWorker = new Worker(
  NUTRI_QUEUE_NAME,
  async (job) => {
    const { scanId, rawText } = job.data;
    const runId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`\n[DEBUG] 🚀 --- INÍCIO DO JOB ---`);
    console.log(`[DEBUG] 🆔 Scan ID: ${scanId}`);

    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // 1. API KEY
      const setting = await db
        .select()
        .from(appConfigs)
        .where(eq(appConfigs.configKey, "gemini_api_key"))
        .limit(1);

      let activeApiKey = process.env.GEMINI_API_KEY;
      if (setting[0]?.configValue) {
        const decryptedKey = decrypt(setting[0].configValue);
        activeApiKey = decryptedKey || setting[0].configValue;
      }
      if (!activeApiKey) throw new Error("API Key não encontrada");

      // ---------------------------------------------------------
      // 🐞 BLOCO DE DEBUG: LISTANDO MODELOS PERMITIDOS
      // ---------------------------------------------------------
      console.log(`[DEBUG] 🔍 Verificando acesso aos modelos do Google...`);
      try {
        const checkResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${activeApiKey}`
        );
        const checkData = (await checkResponse.json()) as GeminiCheckData;

        if (checkData.models) {
          const availableModels = checkData.models
            .map((m) => m.name.replace("models/", ""))
            .join(", ");

          console.log(`[DEBUG] 📋 Modelos liberados para esta chave:`);
          console.log(availableModels);
        } else {
          console.log(`[DEBUG] ⚠️ Erro ao listar modelos:`, checkData);
        }
      } catch (checkErr) {
        const message =
          checkErr instanceof Error ? checkErr.message : "Erro desconhecido";
        console.log(`[DEBUG] ⚠️ Falha na requisição de debug:`, message);
      }
      // ---------------------------------------------------------

      // 2. CATÁLOGO
      console.log(`[DEBUG] 📦 Coletando dados do catálogo...`);
      const dbDishes = await db
        .select()
        .from(dishes)
        .where(eq(dishes.isActive, true));

      const dishSizesRaw = await db
        .select({
          dishId: dishesToSizes.dishId,
          sizeId: dishSizes.id,
          sizeName: dishSizes.name,
          weight: dishSizes.weight,
          mainDishWeight: dishSizes.mainDishWeight,
          price: dishSizes.price,
          groupId: accompanimentGroups.id,
          groupName: accompanimentGroups.name,
          minSelections: sizeAccompanimentGroups.minSelections,
          maxSelections: sizeAccompanimentGroups.maxSelections,
        })
        .from(dishesToSizes)
        .innerJoin(dishSizes, eq(dishesToSizes.sizeId, dishSizes.id))
        .leftJoin(
          sizeAccompanimentGroups,
          eq(dishSizes.id, sizeAccompanimentGroups.sizeId)
        )
        .leftJoin(
          accompanimentGroups,
          eq(
            sizeAccompanimentGroups.accompanimentGroupId,
            accompanimentGroups.id
          )
        )
        .where(eq(dishSizes.isActive, true));

      const allOptions = await db
        .select({
          id: accompanimentOptions.id,
          groupId: groupToOptions.groupId,
          name: accompanimentOptions.name,
          energyKcal: accompanimentOptions.energyKcal,
          proteins: accompanimentOptions.proteins,
          carbs: accompanimentOptions.carbs,
          fatTotal: accompanimentOptions.fatTotal,
          priceModifier: accompanimentOptions.priceModifier,
        })
        .from(accompanimentOptions)
        .innerJoin(
          groupToOptions,
          eq(accompanimentOptions.id, groupToOptions.optionId)
        )
        .where(eq(accompanimentOptions.isActive, true));

      // 3. TERMOS APRENDIDOS
      console.log(`[DEBUG] 🧠 Coletando termos aprendidos...`);
      const learnedTermsRaw = await db
        .select()
        .from(aiExpertTerms)
        .where(eq(aiExpertTerms.isActive, true));

      const learnedTerms = learnedTermsRaw.map((t) => ({
        term: t.term || "",
        targetId: t.targetId || "",
        type: t.targetType || "UNKNOWN",
        synonyms: t.synonyms || [],
      }));

      const expertKnowledgeJson = JSON.stringify(learnedTerms);

      const catalogTree = buildNutriAiCatalog(
        dbDishes as unknown as Parameters<typeof buildNutriAiCatalog>[0],
        dishSizesRaw as unknown as Parameters<typeof buildNutriAiCatalog>[1],
        allOptions as unknown as Parameters<typeof buildNutriAiCatalog>[2]
      ) as NutriCatalog;

      const catalogJson = JSON.stringify(catalogTree.dishes || []);

      // 4. GEMINI
      const genAI = new GoogleGenerativeAI(activeApiKey);
      const modelName = "gemini-2.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = generateNutriPrompt(
        catalogJson,
        sanitizeTextForStorage(rawText),
        expertKnowledgeJson
      );

      console.log(
        `[DEBUG] 🤖 Chamando Gemini com o modelo: ${modelName}...`
      );
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();

      // 5. NORMALIZAÇÃO
      const cleanJson = sanitizeTextForStorage(
        aiText.replace(/```json|```/g, "").trim(),
        12000,
      );
      const rawAiData = safeJsonParse<unknown>(cleanJson, {});

      console.log(`[DEBUG] 🛡️ Normalizando dados...`);
      const suggestedData = ensureSafeAiResult(
        normalizeAiPrescriptionResult(
        rawAiData,
        catalogTree
        ),
      );

      const latency = Date.now() - startTime;

      // 6. SALVA TELEMETRIA
      await db.insert(agentRuns).values({
        id: runId,
        scanId,
        domain: "nutrition",
        model: modelName,
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        latencyMs: latency,
        rawOutput: sanitizeTextForStorage(aiText, 4000),
        status: "success",
      });

      // 7. ATUALIZA SCAN
      await db
        .update(nutriScansTemp)
        .set({
          suggestedData: suggestedData || {},
          status: "completed",
        })
        .where(eq(nutriScansTemp.id, scanId));

      console.log(`[DEBUG] ✅ Finalizado: ${scanId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      console.error(`\n[DEBUG] ❌ FALHA NO JOB:`, errorMessage);

      const db = await getDb();
      if (db && scanId) {
        await db
          .update(nutriScansTemp)
          .set({ status: "failed" })
          .where(eq(nutriScansTemp.id, scanId));

        await db
          .insert(agentRuns)
          .values({
            id: runId,
            scanId,
            status: "failed",
            errorMessage,
          })
          .catch(() => {});
      }

      throw err;
    }
  },
  { connection: redisConfig, concurrency: 1 }
);

nutriWorker.on("error", (err: Error) => {
  console.warn(`[Nutri Worker] Erro Redis: ${err.message}`);
});
