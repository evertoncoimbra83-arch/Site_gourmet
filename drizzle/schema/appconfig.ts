import { mysqlTable, varchar, longtext, timestamp } from "drizzle-orm/mysql-core";

/**
 * ✅ TABELA DE CONFIGURAÇÕES GLOBAIS
 * Centraliza layouts da Zebra, textos do site, banners e ACESSIBILIDADE.
 */
export const appConfigs = mysqlTable("app_configs", {
  // Chave identificadora (ex: 'accessibility_high_contrast', 'zebra_layout_default')
  configKey: varchar("config_key", { length: 100 }).primaryKey(),
  
  // Conteúdo da configuração (Pode ser 'true', '1.25', ou JSON)
  configValue: longtext("config_value").notNull(),
  
  // Controle de versão temporal
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),  
});