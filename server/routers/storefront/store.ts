import { router, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { appConfigs } from "../../../drizzle/schema/index.js";
import { eq, inArray } from "drizzle-orm";

/**
 * 🎨 Roteador de Identidade Visual e Componentes da Loja
 * Gerencia banners (showcases) e preferências visuais/acessibilidade.
 */
export const storeRouter = router({
  
  /**
   * CONFIGURAÇÕES PÚBLICAS DE APARÊNCIA
   * Resolve o erro 403 no hook useAccessibility.
   */
  getPublicSettings: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return {};
      
      // Filtra apenas chaves de configuração visual e acessibilidade
      const rows = await db.select()
        .from(appConfigs)
        .where(inArray(appConfigs.configKey, [
          'accessibility', 
          'general_appearance', 
          'store_info'
        ]));

      const settings: Record<string, any> = {};
      
      rows.forEach(row => {
        try {
          // Se o valor for um JSON (ex: cores ou flags de fonte), parseia
          settings[row.configKey] = JSON.parse(row.configValue || '{}');
        } catch (e) {
          // Se for string simples, mantém original
          settings[row.configKey] = row.configValue;
        }
      });

      return settings;
    } catch (error) {
      console.error("❌ [STORE_SETTINGS_ERROR]:", error);
      return {}; 
    }
  }),

  /**
   * VITRINES E BANNERS (Showcases)
   * Resolve o erro 404 ao carregar a Home Page.
   */
  getShowcases: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return [];

      const [config] = await db.select()
        .from(appConfigs)
        .where(eq(appConfigs.configKey, 'showcases'))
        .limit(1);
      
      if (!config || !config.configValue) return [];
      
      return JSON.parse(config.configValue);
    } catch (error) {
      console.error("❌ [SHOWCASES_ERROR]:", error);
      return [];
    }
  }),
});