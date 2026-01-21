import { router, publicProcedure } from "../../_core/trpc.js"; 
import { appConfigs } from "../../../drizzle/schema/index.js"; 
import { getDb } from "../../db.js";
import { eq, inArray } from "drizzle-orm"; 
import { decrypt } from "../../encryption.js";
import { getStoreSettings } from "../../storeSettings.js"; 

// ✅ IMPORTANTE: Este router deve conter a lógica que busca sizes, iconKey e description
import { productsRouter } from "./products.js";

/**
 * 🌎 PUBLIC ROUTER
 * Este é o ponto de entrada para usuários não autenticados (clientes do site).
 */
export const publicRouter = router({
  
  /**
   * 🍽️ Sub-rota de Produtos (Alias 'dishes')
   * Mapeia trpc.public.dishes para o roteador de produtos.
   * Certifique-se de que o productsRouter.getById utilize o mapper revisado.
   */
  dishes: productsRouter,

  /**
   * 1. CONFIGURAÇÕES DA LOJA E ACESSIBILIDADE
   * Carrega horários, taxas e flags de acessibilidade (Alto Contraste, Dislexia).
   */
  getStoreSettings: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      const general = await getStoreSettings();

      const extraConfigs = await db.select()
        .from(appConfigs)
        .where(inArray(appConfigs.configKey, [
            'accessibility_high_contrast', 
            'accessibility_dyslexic_font', 
            'accessibility_font_scale'
        ]));

      const getVal = (k: string) => extraConfigs.find(r => r.configKey === k)?.configValue;

      return { 
        ...general,
        accessibility: {
            highContrast: getVal('accessibility_high_contrast') === 'true',
            dyslexicFont: getVal('accessibility_dyslexic_font') === 'true',
            fontScale: parseFloat(getVal('accessibility_font_scale') || '1.00')
        }
      };
    } catch (error) {
      console.error("⚠️ Erro ao carregar Store Settings, usando fallback.");
      return { 
        id: "1", 
        generalMinOrderAmount: 0, 
        minOrderMessage: "", 
        emergencyMode: false,
        accessibility: { highContrast: false, dyslexicFont: false, fontScale: 1.0 }
      };
    }
  }),

  /**
   * 2. INFORMAÇÕES DE CONTATO E REDES SOCIAIS
   * Decripta os dados sensíveis de contato para exibição no rodapé/contato.
   */
  getCompanyInfo: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database offline");

      const [row] = await db.select()
        .from(appConfigs)
        .where(eq(appConfigs.configKey, 'company_social_info'))
        .limit(1);

      const defaultInfo = {
        phone: "(11) 99999-9999",
        whatsapp: "5511999999999",
        email: "contato@sualoja.com.br",
        address: "Cidade, Estado",
        instagram: "@sualoja",
        facebook: "sualoja"
      };

      if (!row?.configValue) return defaultInfo;

      const decrypted = decrypt(row.configValue);
      if (!decrypted) return defaultInfo;

      try {
        const parsed = JSON.parse(decrypted);
        return { ...defaultInfo, ...parsed };
      } catch (e) {
        return defaultInfo;
      }
    } catch (error) {
      console.error("❌ [PUBLIC_INFO_ERROR]:", error);
      return { phone: "", whatsapp: "", email: "", address: "", instagram: "", facebook: "" };
    }
  }),
});