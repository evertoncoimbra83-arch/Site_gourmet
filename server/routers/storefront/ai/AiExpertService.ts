// server/routers/storefront/ai/AiExpertService.ts

import { getDb } from "../../../db.js";
import { aiExpertLogs, aiExpertTerms, agentRuns } from "../../../../drizzle/schema/index.js"; 
import { sql, eq, or } from "drizzle-orm"; 
import crypto from "crypto";
import {
  ensureSafeAiResult,
  sanitizeTextForStorage,
} from "../../../lib/ai-safety.js";

// --- INTERFACES PARA TIPAGEM ESTREITA ---

interface ExpertLogData {
  runId: string;
  rawInput: string;
  aiJson: unknown; 
  finalJson: unknown; 
  confidenceScore?: number;
}

interface AgentRunData {
  id?: string;
  scanId: string;
  domain?: string;
  provider?: string;
  model?: string;
  promptVersion?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  costEstimate?: number | string;
  rawOutput?: string;
  status?: "success" | "error";
  errorMessage?: string | null;
}

/**
 * Normaliza strings para geração de hash de busca
 */
const normalizeText = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ');
};

export const AiExpertService = {

  /**
   * 🔍 1. AUTO-CONSULTA (Cache de Inteligência)
   * Busca se a IA já resolveu uma entrada similar no passado.
   */
  async findKnowledge(rawInput: string) {
    const db = await getDb();
    if (!db || !rawInput) return null;

    const inputStr = sanitizeTextForStorage(String(rawInput));
    const normalizedInput = normalizeText(inputStr);
    
    const inputHash = crypto.createHash("sha256").update(inputStr).digest("hex");
    const normalizedHash = crypto.createHash("sha256").update(normalizedInput).digest("hex");

    try {
      const [existing] = await db
        .select()
        .from(aiExpertLogs)
        .where(
          or(
            eq(aiExpertLogs.inputHash, inputHash),
            eq(aiExpertLogs.normalizedHash, normalizedHash)
          )
        )
        .limit(1);

      if (existing) {
        const data = existing.finalCorrectedJson || existing.aiSuggestedJson;
        if (!data) return null;
        
        // Garante que o retorno seja um objeto, mesmo que vindo como string do DB
        return ensureSafeAiResult(
          typeof data === 'string' ? JSON.parse(data) : data
        );
      }
    } catch (error) {
      console.error("❌ [AiExpert] Falha na busca de conhecimento prévio:", error);
    }
    return null;
  },

  /**
   * 🚀 2. TELEMETRIA (agent_runs)
   * Grava dados de performance e custo de cada chamada de IA.
   */
  async recordRun(data: AgentRunData) {
    const db = await getDb();
    if (!db) return;

    try {
      await db.insert(agentRuns).values({
        id: data.id || crypto.randomUUID(),
        scanId: data.scanId,
        domain: data.domain || "nutrition",
        provider: data.provider || "google",
        model: data.model || "gemini-1.5-flash",
        promptVersion: data.promptVersion || "2.0.0",
        inputTokens: data.inputTokens || 0,
        outputTokens: data.outputTokens || 0,
        latencyMs: data.latencyMs || 0,
        costEstimate: String(data.costEstimate || "0.000000"),
        rawOutput: sanitizeTextForStorage(data.rawOutput || "", 4000),
        status: data.status || "success",
        errorMessage: data.errorMessage || null,
      });
    } catch (error) {
      console.error("❌ [AiExpert] Erro ao gravar telemetria da execução:", error);
    }
  },

  /**
   * 🧠 3. MEMÓRIA DE LONGO PRAZO (ai_expert_logs)
   * Salva o aprendizado da IA e correções manuais para treinar o cache.
   */
  async recordExpertise(data: ExpertLogData) {
    const db = await getDb();
    if (!db) return;

    const inputStr = sanitizeTextForStorage(String(data.rawInput || ""));
    const normalizedInput = normalizeText(inputStr);
    
    // Verifica se houve correção manual (divergência entre sugestão IA e decisão final)
    const wasCorrected = JSON.stringify(data.aiJson) !== JSON.stringify(data.finalJson);
    const inputHash = crypto.createHash("sha256").update(inputStr).digest("hex");
    const normalizedHash = crypto.createHash("sha256").update(normalizedInput).digest("hex");

    try {
      await db.insert(aiExpertLogs).values({
        runId: data.runId,
        inputHash,
        normalizedHash,
        rawInputText: inputStr,
        aiSuggestedJson: ensureSafeAiResult(data.aiJson || {}),
        finalCorrectedJson: data.finalJson ? ensureSafeAiResult(data.finalJson) : null,
        confidenceScore: String(data.confidenceScore || (wasCorrected ? "1.00" : "0.80")),
        wasCorrected,
      }).onDuplicateKeyUpdate({
        set: { 
          finalCorrectedJson: data.finalJson ? ensureSafeAiResult(data.finalJson) : null,
          wasCorrected,
          runId: data.runId,
          updatedAt: sql`CURRENT_TIMESTAMP()`
        }
      });
    } catch (error) {
      console.error("❌ [AiExpert] Erro ao persistir expertise aprendida:", error);
    }
  },

  /**
   * 🎓 4. BASE DE CONHECIMENTO TÉCNICO
   * Retorna os termos técnicos mapeados para serem usados como Contexto da IA.
   */
  async getExpertKnowledgeBase(): Promise<string> {
    const db = await getDb();
    if (!db) return "";

    try {
      const terms = await db
        .select()
        .from(aiExpertTerms)
        .where(eq(aiExpertTerms.isActive, true));

      if (!terms || terms.length === 0) return "Nenhum termo técnico mapeado ainda.";

      return terms.map(t => {
        if (!t) return "";

        let syns = "";
        if (t.synonyms) {
          try {
            const parsedSyns = typeof t.synonyms === 'string' ? JSON.parse(t.synonyms) : t.synonyms;
            syns = ` (ou: ${JSON.stringify(parsedSyns)})`;
          } catch {
            syns = "";
          }
        }
        
        const type = (t.targetType || 'UNKNOWN').toUpperCase();
        const id = t.targetId || '0';
        const termName = t.term || 'Indefinido';
        
        return `- "${termName}"${syns} mapeia para ${type} ID: ${id}`;
      }).filter(line => line !== "").join('\n');
      
    } catch (error) {
      console.error("❌ [AiExpert] Erro ao construir Knowledge Base:", error);
      return "";
    }
  }
};
