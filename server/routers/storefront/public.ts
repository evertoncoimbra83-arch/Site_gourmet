// server/routers/storefront/public.ts

import { router, publicProcedure, createRateLimitMiddleware } from "../../_core/trpc.js"; 
import { AuditLogService } from "../../services/AuditLogService.js";
import { z } from "zod";
import { eq, asc, and, like, inArray, sql } from "drizzle-orm"; 
import { getDb } from "../../db.js";
import { getStoreSettings as fetchSettingsFromDb } from "../../storeSettings.js"; 
import { getDishDetails } from "../../dishes.js";
import axios from "axios";
import { decrypt } from "../../encryption.js";
import { safeInteger, safeJsonParse, safeNumber } from "../../lib/safe-parse.js";

import * as schema from "../../../drizzle/schema/index.js"; 
import { 
  appConfigs, 
  shippingSettings, 
  referrals, 
  professionalReviews, 
  users,
  user_profiles,
  showcases, 
  dishes,    
  categories
} from "../../../drizzle/schema/index.js"; 

import { paymentMethodsRouter } from "./paymentMethods.js";

// --- INTERFACES DE TIPAGEM ESTREITA ---

interface SocialData {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
}

interface DishRecord {
  id: number | string;
  name?: string;
  slug?: string;
  price?: string | number;
  basePrice?: string | number;
  salePrice?: string | number;
  imageUrl?: string;
  image_url?: string;
  description?: string;
  categoryId?: number;
  category_id?: number;
  isActive?: boolean;
  is_active?: boolean;
  displayOrder?: number;
  show_nutrition?: boolean;
  showNutrition?: boolean;
  nutritionalInfo?: string | Record<string, unknown>;
  nutritional_info?: string | Record<string, unknown>;
  energyKcal?: number;
  proteins?: number;
  carbs?: number;
  fatTotal?: number;
}

/**
 * 🛠️ BUSCA DE CONFIGURAÇÕES DA LOJA
 */
async function fetchAllStoreSettings() {
  try {
    const db = await getDb();
    const general = (await fetchSettingsFromDb()) || {};
    const [shipping] = await db.select().from(shippingSettings).limit(1);
    
    const configKeys = [
      'accessibility_high_contrast', 
      'accessibility_dyslexic_font', 
      'accessibility_vlibras_active', 
      'accessibility_font_scale', 
      'success_order_message',
      'partners_json',
      'company_social_info',
      'favicon_url',
      'google_analytics_id',  // ✅ necessário para o useAnalytics
      'gtm_id',               // ✅ necessário para o GTM
    ];

    const extraConfigs = await db.select().from(appConfigs).where(inArray(appConfigs.configKey, configKeys));
    const getVal = (k: string) => extraConfigs.find(r => r.configKey === k)?.configValue;

    const rawSocial = getVal('company_social_info');
    let socialData: SocialData | null = null;

    if (rawSocial) {
      try {
        const decrypted = decrypt(rawSocial);
        socialData = safeJsonParse<SocialData | null>(
          decrypted || rawSocial,
          null,
        );
      } catch {
        socialData = null;
      }
    }

    return { 
      ...general,
      favicon: getVal('favicon_url') || general.favicon || "/favicon.ico",
      googleAnalyticsId: getVal('google_analytics_id') || null,
      gtmId: getVal('gtm_id') || null,              // ✅ expõe GTM ID para o frontend
      pickupEnabled: shipping?.pickupEnabled ?? general.pickupEnabled ?? true,
      pickupLabel: shipping?.pickupLabel ?? general.pickupLabel ?? "Retirada no Local",
      pickupInstruction: shipping?.pickupInstruction ?? general.pickupInstruction ?? "Apresente o número do pedido no balcão.",
      success_order_message: getVal('success_order_message') || "Pedido recebido com sucesso! 🥗",
      partners_json: getVal('partners_json') || "[]",
      company_social_info: socialData, 
      accessibility: {
          highContrast: getVal('accessibility_high_contrast') === 'true',
          dyslexicFont: getVal('accessibility_dyslexic_font') === 'true',
          vLibrasActive: getVal('accessibility_vlibras_active') === 'true',
          fontScale: safeNumber(getVal('accessibility_font_scale'), 1)
      }
    };
  } catch (err) {
    console.error("Erro ao carregar Store Settings:", err);
    return { id: "1", emergencyMode: false, accessibility: { fontScale: 1.0 } };
  }
}

/**
 * ✅ NORMALIZAÇÃO DE PRATOS
 */
export const normalizeDish = (dish: unknown) => {
  if (!dish || typeof dish !== 'object') return null;
  const d = dish as DishRecord;

  const toNum = (val: unknown) => {
    return safeNumber(val);
  };

  let info: Record<string, unknown> = {};
  const rawInfo = d.nutritionalInfo || d.nutritional_info;
  if (rawInfo) {
    info = safeJsonParse<Record<string, unknown>>(rawInfo, {});
  }

  return {
    id: safeInteger(d.id),
    name: d.name || "Prato sem nome",
    slug: d.slug || String(d.id), 
    price: toNum(d.price || d.basePrice || 0),
    salePrice: d.salePrice ? toNum(d.salePrice) : null,
    imageUrl: d.imageUrl || d.image_url || null,
    description: d.description || "",
    categoryId: (d.categoryId ?? d.category_id) ? safeInteger(d.categoryId ?? d.category_id) : null,
    isActive: !!(d.isActive ?? d.is_active),
    displayOrder: toNum(d.displayOrder ?? 0),
    show_nutrition: !!(d.show_nutrition || d.showNutrition),
    nutritional_info: {
      kcal: Math.round(toNum(info?.kcal || d.energyKcal || 0)),
      proteins: toNum(info?.proteins || d.proteins || 0),
      carbs: toNum(info?.carbs || info?.carbohydrates || d.carbs || 0),
      fats: toNum(info?.fats || d.fatTotal || 0)
    }
  };
};

export const publicRouter = router({
  paymentMethods: paymentMethodsRouter,

  referral: router({
    bindCode: publicProcedure
      .input(z.object({ code: z.string().min(1), sessionId: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const normalizedCode = input.code.toLowerCase().replace(/\s+/g, '');
        
        const [partner] = await db.select().from(referrals).where(and(eq(referrals.code, normalizedCode), eq(referrals.isActive, true))).limit(1);

        if (!partner) return { success: false, message: "Código inválido." };

        await db.update(schema.sessions)
          .set({ referralCode: normalizedCode })
          .where(eq(schema.sessions.id, input.sessionId));
          
        return { success: true, appliedCode: normalizedCode, partnerName: partner.name };
      }),
  }),

  getProfessionalReviews: publicProcedure
    .input(z.object({ dishId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      const rawReviews = await db
        .select({
          id: professionalReviews.id,
          insight: professionalReviews.technicalInsight,
          highlights: professionalReviews.nutritionalHighlights,
          authorNameEncrypted: users.name, 
          authorTitle: user_profiles.professional_title, 
        })
        .from(professionalReviews)
        .innerJoin(users, eq(professionalReviews.userId, users.id))
        .innerJoin(user_profiles, eq(users.id, user_profiles.userId))
        .where(and(eq(professionalReviews.dishId, input.dishId), eq(professionalReviews.isActive, true)));

      return rawReviews.map(review => ({
        id: review.id,
        insight: review.insight,
        highlights: review.highlights,
        authorName: decrypt(review.authorNameEncrypted || "") || "Especialista Gourmet Saudável",
        authorTitle: review.authorTitle || "Nutricionista"
      }));
    }),

  dishes: router({
    categories: publicProcedure.query(async () => {
      const db = await getDb();
      const cats = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.displayOrder));
      
      const counts = await db.select({
        categoryId: dishes.categoryId,
        count: sql<number>`count(${dishes.id})`
      })
      .from(dishes)
      .where(eq(dishes.isActive, true))
      .groupBy(dishes.categoryId);

      const countsMap = new Map(counts.map(c => [c.categoryId, Number(c.count)]));

      return cats.map(c => ({
        ...c,
        dishCount: countsMap.get(c.id) || 0
      }));
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const details = await getDishDetails(input.id);
        if (!details) return null;
        const normalized = normalizeDish(details);
        if (!normalized) return null;

        const d = details as Record<string, unknown>;

        return { 
          ...normalized, 
          nutritionalInfo: normalized.nutritional_info, 
          ingredients: String(d.ingredients || ""), 
          sizes: (d.sizes as unknown[]) || [], 
          accompaniments: (d.accompaniments as unknown[]) || [] 
        };
      }),

    list: publicProcedure
      .input(z.object({ 
          page: z.number().default(1), 
          perPage: z.number().default(100), 
          search: z.string().nullish(), 
          category: z.union([z.number(), z.string()]).nullish() 
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        const dishesTable = dishes;
        const conditions = [eq(dishesTable.isActive, true)];

        if (input?.search) conditions.push(like(dishesTable.name, `%${input.search}%`));
        if (input?.category && input.category !== "all") {
          const catId = safeInteger(input.category, Number.NaN);
          if (Number.isFinite(catId)) conditions.push(eq(dishesTable.categoryId, catId));
        }

        const rows = await db.select().from(dishesTable).where(and(...conditions)).orderBy(asc(dishesTable.displayOrder));
        return rows.map(normalizeDish).filter(Boolean);
      }),
  }),

  getStoreSettings: publicProcedure.query(async () => {
    return await fetchAllStoreSettings();
  }),

  getPublicSettings: publicProcedure.query(async () => {
    return await fetchAllStoreSettings();
  }),

  /**
   * 🖼️ BUSCA DE VITRINES (Showcases) - Dinâmico
   * ✅ Resolvido: Agora filtra os pratos reais salvos no banco.
   */
  getShowcases: publicProcedure.query(async () => {
    const db = await getDb();
    
    // 1. Busca vitrines ativas
    const activeShowcases = await db
      .select()
      .from(showcases)
      .where(eq(showcases.active, true))
      .orderBy(asc(showcases.order));

    if (activeShowcases.length === 0) return [];

    // 2. Busca todos os pratos ativos de uma vez
    const activeDishesRows = await db
      .select()
      .from(dishes)
      .where(eq(dishes.isActive, true))
      .orderBy(asc(dishes.displayOrder));

    const normalizedDishes = activeDishesRows.map(normalizeDish).filter(Boolean);

    // 3. Monta o objeto final filtrando pelos IDs salvos na coluna 'items'
    return activeShowcases.map((sc) => {
      let dishIds: number[] = [];
      dishIds = safeJsonParse<unknown[]>(sc.items || "[]", [])
        .map((id) => safeInteger(id, Number.NaN))
        .filter(Number.isFinite);

      const filteredItems = normalizedDishes.filter(dish => 
        dishIds.includes(dish!.id)
      );

      return {
        id: sc.id,
        title: sc.title,
        items: filteredItems,
      };
    });
  }),

  getCep: publicProcedure
    .input(z.object({ cep: z.string().min(8) }))
    .query(async ({ input }) => {
      const cleanCep = input.cep.replace(/\D/g, "");
      if (cleanCep.length !== 8) return null;
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { timeout: 4000 });
        if (data.erro) return null;
        return { street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf };
      } catch { return null; }
    }),

  logClientError: publicProcedure
    .use(createRateLimitMiddleware({
      keyPrefix: "client-error-logging",
      limit: 20,
      windowMs: 60 * 1000
    }))
    .input(z.object({
      errorName: z.string(),
      errorMessage: z.string(),
      errorStack: z.string().optional(),
      url: z.string().optional(),
      userAgent: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const actor: any = { userId: "system" };
        let requestId: string | undefined = undefined;

        if (ctx) {
          if (ctx.user) {
            actor.userId = ctx.user.id;
          }
          if (ctx.req) {
            requestId = (ctx.req as any).requestId || 
                        ctx.req.headers?.["x-request-id"] || 
                        ctx.req.headers?.["x-correlation-id"];
            actor.ipAddress = ctx.req.ip || 
                              (ctx.req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || 
                              "127.0.0.1";
            actor.userAgent = ctx.req.headers?.["user-agent"] || input.userAgent || "unknown";
          }
        }

        const errorObj = new Error(input.errorMessage);
        errorObj.name = input.errorName;
        if (input.errorStack) {
          errorObj.stack = input.errorStack;
        }

        await AuditLogService.recordError({
          module: "client",
          source: "frontend",
          error: errorObj,
          actor,
          requestId,
          route: input.url,
          severity: "critical",
          metadata: input.metadata || {},
        });

        return { success: true };
      } catch (err) {
        console.error("Erro ao processar logClientError:", err);
        return { success: false };
      }
    }),
});