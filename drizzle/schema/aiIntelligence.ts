import { 
  mysqlTable, 
  serial, 
  text, 
  varchar, 
  timestamp, 
  json, 
  boolean, 
  int,
  decimal,
  index 
} from "drizzle-orm/mysql-core";

/**
 * 🩺 0. PERSISTÊNCIA DE SCANS (nutriScansTemp)
 * Armazena o mapeamento da IA. 
 * Revisado para suportar contador diário e histórico permanente.
 */
export const nutriScansTemp = mysqlTable("nutri_scans_temp", {
  id: varchar("id", { length: 255 }).primaryKey(),
  
  // ✅ userId agora é mandatório para evitar scans órfãos e permitir contador
  userId: varchar("user_id", { length: 255 }).notNull(), 
  
  rawText: text("raw_text"),
  suggestedData: json("suggested_data"),
  status: varchar("status", { length: 50 }).default("pending"),
  sourceType: varchar("source_type", { length: 50 }).default("ocr"),
  
  // Mantido para compatibilidade, mas o foco agora é histórico
  expiresAt: timestamp("expires_at"),
  
  // ✅ createdAt com notNull e defaultNow para o filtro de "scans de hoje"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // ✅ Índices essenciais para performance do Dashboard e Contador
  userIdIdx: index("user_id_idx").on(table.userId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

/**
 * 📂 1. AGENT RUNS (Telemetria e Execução)
 * Guarda o rastro técnico do processamento da IA.
 */
export const agentRuns = mysqlTable("agent_runs", {
  id: varchar("id", { length: 255 }).primaryKey(), 
  scanId: varchar("scan_id", { length: 255 }),     
  domain: varchar("domain", { length: 50 }).default("nutrition"),
  
  provider: varchar("provider", { length: 50 }).default("google"),
  model: varchar("model", { length: 50 }),          
  promptVersion: varchar("prompt_version", { length: 20 }),
  
  inputTokens: int("input_tokens"),
  outputTokens: int("output_tokens"),
  latencyMs: int("latency_ms"),
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 6 }),
  
  rawOutput: text("raw_output"),
  status: varchar("status", { length: 20 }),        
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * 🧠 2. AI EXPERT LOGS (Memória de Longo Prazo / Golden Dataset)
 * Registra correções humanas para re-treinamento e melhoria de precisão.
 */
export const aiExpertLogs = mysqlTable("ai_expert_logs", {
  id: serial("id").primaryKey(),
  runId: varchar("run_id", { length: 255 }),       
  
  inputHash: varchar("input_hash", { length: 64 }).unique(), 
  normalizedHash: varchar("normalized_hash", { length: 64 }), 
  
  rawInputText: text("raw_input_text").notNull(), 
  aiSuggestedJson: json("ai_suggested_json").notNull(), 
  finalCorrectedJson: json("final_corrected_json"), 
  
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  wasCorrected: boolean("was_corrected").default(false), 
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  inputHashIdx: index("input_hash_idx").on(table.inputHash),
  normalizedHashIdx: index("normalized_hash_idx").on(table.normalizedHash),
}));

/**
 * 📖 3. AI EXPERT TERMS (Dicionário Semântico)
 * Mapeia termos técnicos (ex: "frango grelhado") para IDs do seu catálogo.
 */
export const aiExpertTerms = mysqlTable("ai_expert_terms", {
  id: serial("id").primaryKey(),
  term: varchar("term", { length: 255 }).unique().notNull(), 
  
  targetType: varchar("target_type", { length: 50 }), 
  targetId: varchar("target_id", { length: 255 }),
  
  synonyms: json("synonyms"),      
  useCount: int("use_count").default(1), 
  isActive: boolean("is_active").default(true),
  
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * ⚡ 4. AGENT ACTIONS (Camada de Execução Auditável)
 * Log de ações automáticas tomadas pela IA.
 */
export const agentActions = mysqlTable("agent_actions", {
  id: serial("id").primaryKey(),
  runId: varchar("run_id", { length: 255 }),
  actionType: varchar("action_type", { length: 50 }), 
  payload: json("payload"),
  status: varchar("status", { length: 20 }),          
  executedAt: timestamp("executed_at"),
  approvedBy: varchar("approved_by", { length: 255 }), 
});