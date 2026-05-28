// server/routers/admin/ga4Analytics.ts
import { router, superAdminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { GoogleAuth } from "google-auth-library";
import { getDb } from "../../db.js";
import { appConfigs } from "../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger.js";

const GA4_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

// ✅ Lê credenciais do banco — sem hardcode
async function getGA4Credentials(): Promise<{ propertyId: string; auth: GoogleAuth } | null> {
  try {
    const db = await getDb();

    const [serviceAccountRow, propertyRow] = await Promise.all([
      db.select().from(appConfigs).where(eq(appConfigs.configKey, "ga_service_account")).limit(1),
      db.select().from(appConfigs).where(eq(appConfigs.configKey, "ga4_property_id")).limit(1),
      db.select().from(appConfigs).where(eq(appConfigs.configKey, "google_analytics_id")).limit(1),
    ]);

    const serviceAccountJson = serviceAccountRow[0]?.configValue?.trim();
    const propertyId = propertyRow[0]?.configValue?.trim() || "";

    // Sem credenciais reais → não conecta
    if (!serviceAccountJson || !propertyId) {
      return null;
    }

    // Valida que é JSON de service account
    const credentials = JSON.parse(serviceAccountJson);
    if (!credentials?.type || credentials.type !== "service_account") {
      logger.warn("[GA4] Service account JSON inválido — campo 'type' ausente ou incorreto");
      return null;
    }

    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    return { propertyId, auth };
  } catch (err) {
    logger.error({ err }, "[GA4] Erro ao carregar credenciais do banco");
    return null;
  }
}

async function ga4Request(
  auth: GoogleAuth,
  propertyId: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const res = await fetch(
    `${GA4_API_BASE}/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GA4 API error ${res.status}: ${error}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

function parseRows(data: Record<string, unknown>, dimensionKey?: string): Record<string, unknown>[] {
  const rows = (data.rows as Record<string, unknown>[] | undefined) || [];
  return rows.map((row) => {
    const dims = (row.dimensionValues as { value: string }[] | undefined) || [];
    const mets = (row.metricValues as { value: string }[] | undefined) || [];
    return {
      dimension: dimensionKey ? dims[0]?.value : undefined,
      value: Number(mets[0]?.value || 0),
      secondary: mets[1] ? Number(mets[1].value || 0) : undefined,
    };
  });
}

export const ga4AnalyticsRouter = router({

  // Verifica status completo: Service Account + Measurement ID + API
  checkConnection: superAdminProcedure.query(async () => {
    const db = await getDb();
    const creds = await getGA4Credentials();

    // Lê Measurement ID do banco
    const gaIdRow = await db
      .select()
      .from(appConfigs)
      .where(eq(appConfigs.configKey, "google_analytics_id"))
      .limit(1);

    const measurementId = gaIdRow[0]?.configValue?.trim() || null;
    const measurementIdValid = Boolean(measurementId && /^G-[A-Z0-9]+$/i.test(measurementId));

    // Testa chamada real à API
    let apiWorking = false;
    if (creds) {
      try {
        const { auth, propertyId } = creds;
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        const res = await fetch(
          `${GA4_API_BASE}/properties/${propertyId}:runReport`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.token}` },
            body: JSON.stringify({
              dateRanges: [{ startDate: "1daysAgo", endDate: "today" }],
              metrics: [{ name: "sessions" }],
              limit: 1,
            }),
          }
        );
        apiWorking = res.ok;
      } catch {
        apiWorking = false;
      }
    }

    return {
      connected: !!creds,
      apiWorking,
      measurementId,
      measurementIdValid,
      propertyId: creds ? creds.propertyId : null,
    };
  }),

  // Resumo geral: sessões, usuários, pageviews
  getSummary: superAdminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const creds = await getGA4Credentials();
      if (!creds) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 não configuradas." });

      const { auth, propertyId } = creds;
      const data = await ga4Request(auth, propertyId, {
        dateRanges: [{ startDate: `${input.days}daysAgo`, endDate: "today" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      });

      const row = ((data.rows as Record<string, unknown>[])?.[0]?.metricValues as { value: string }[]) || [];
      return {
        sessions: Number(row[0]?.value || 0),
        users: Number(row[1]?.value || 0),
        pageviews: Number(row[2]?.value || 0),
        bounceRate: Number((Number(row[3]?.value || 0) * 100).toFixed(1)),
        avgSessionDuration: Number(Number(row[4]?.value || 0).toFixed(0)),
      };
    }),

  // Usuários ativos agora (tempo real)
  getActiveUsers: superAdminProcedure.query(async () => {
    const creds = await getGA4Credentials();
    if (!creds) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 não configuradas." });

    const { auth, propertyId } = creds;
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const res = await fetch(
      `${GA4_API_BASE}/properties/${propertyId}:runRealtimeReport`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.token}` },
        body: JSON.stringify({
          metrics: [{ name: "activeUsers" }],
          dimensions: [{ name: "unifiedScreenName" }],
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      logger.warn({ status: res.status, body: errBody.slice(0, 300) }, "[GA4] Realtime indisponível — retornando vazio");
      return { total: 0, pages: [] };
    }

    const data = await res.json() as Record<string, unknown>;
    const rows = ((data.rows as Record<string, unknown>[]) || []).map((row) => {
      const dims = (row.dimensionValues as { value: string }[]) || [];
      const mets = (row.metricValues as { value: string }[]) || [];
      return {
        page: dims[0]?.value || "(not set)",
        users: Number(mets[0]?.value || 0),
      };
    });

    const total = rows.reduce((acc, r) => acc + r.users, 0);
    return { total, pages: rows.slice(0, 10) };
  }),

  // Páginas mais visitadas
  getTopPages: superAdminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const creds = await getGA4Credentials();
      if (!creds) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 não configuradas." });

      const { auth, propertyId } = creds;
      const data = await ga4Request(auth, propertyId, {
        dateRanges: [{ startDate: `${input.days}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      });

      return parseRows(data, "pagePath").map((r) => ({
        page: String(r.dimension),
        views: r.value,
        users: r.secondary || 0,
      }));
    }),

  // Origens de tráfego
  getTrafficSources: superAdminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const creds = await getGA4Credentials();
      if (!creds) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 não configuradas." });

      const { auth, propertyId } = creds;
      const data = await ga4Request(auth, propertyId, {
        dateRanges: [{ startDate: `${input.days}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      });

      return parseRows(data, "channel").map((r) => ({
        channel: String(r.dimension),
        sessions: r.value,
      }));
    }),

  // Sessões por dia
  getSessionsOverTime: superAdminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const creds = await getGA4Credentials();
      if (!creds) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 não configuradas." });

      const { auth, propertyId } = creds;
      const data = await ga4Request(auth, propertyId, {
        dateRanges: [{ startDate: `${input.days}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      });

      return parseRows(data, "date").map((r) => ({
        date: String(r.dimension).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
        sessions: r.value,
        users: r.secondary || 0,
      }));
    }),
});
