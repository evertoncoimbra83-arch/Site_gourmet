// server/routers/admin/ga4Analytics.ts
// Busca dados reais do Google Analytics 4 via Data API
// VERSÃO DE TESTE HARDCODED (Isolando erro de banco de dados)

import { router, adminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { GoogleAuth } from "google-auth-library";
import { logger } from "../../logger.js";

const GA4_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

async function getGA4Credentials(): Promise<{ propertyId: string; auth: GoogleAuth } | null> {
  try {
    // 🔥 1. COLOQUE AQUI O SEU PROPERTY ID REAL (AQUELE DE 9 DÍGITOS QUE VOCÊ ACHOU NO ANALYTICS)
    const propertyId = "250001647"; 

    // 🔥 2. COLE O CONTEÚDO DO SEU ARQUIVO JSON INTEIRO AQUI DENTRO (Mantenha as crases ` `)
    const serviceAccountJson = `
    {
      "type": "service_account",
      "project_id": "...",
      "private_key_id": "...",
      "private_key": "...",
      "client_email": "bi-analytics@gourmetbi.iam.gserviceaccount.com",
      "client_id": "...",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "...",
      "universe_domain": "googleapis.com"
    }
    `;

    if (!serviceAccountJson || serviceAccountJson.trim() === "" || propertyId === "250001647") {
      return null;
    }

    const credentials = JSON.parse(serviceAccountJson);
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    return { propertyId, auth };
  } catch (err) {
    logger.error({ err }, "❌ [GA4 TESTE HARDCODED] Erro Crítico ao carregar credenciais");
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
  // Verifica status completo: Service Account + Measurement ID
  checkConnection: adminProcedure.query(async () => {
    // 1. Checa Service Account
    const creds = await getGA4Credentials();

    // 🔥 3. SEU ID DE MEDIÇÃO HARDCODED AQUI
    const measurementId = "G-W52VV00WRZ"; 
    const measurementIdValid = true;

    // 3. Testa a API fazendo uma chamada real
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
      } catch (error) {
        logger.error({ error }, "❌ [GA4 TESTE HARDCODED] Falha na chamada da API");
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
  getSummary: adminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const creds = await getGA4Credentials();
      if (!creds) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 não configuradas." });

      const { auth, propertyId } = creds;
      const startDate = `${input.days}daysAgo`;

      const data = await ga4Request(auth, propertyId, {
        dateRanges: [{ startDate, endDate: "today" }],
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
  getActiveUsers: adminProcedure.query(async () => {
    const creds = await getGA4Credentials();
    if (!creds) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Credenciais GA4 não configuradas." });

    const { auth, propertyId } = creds;

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const res = await fetch(
      `${GA4_API_BASE}/properties/${propertyId}:runRealtimeReport`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.token}`,
        },
        body: JSON.stringify({
          metrics: [{ name: "activeUsers" }],
          dimensions: [{ name: "unifiedScreenName" }],
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      logger.warn({ status: res.status, body: errBody.slice(0, 300) }, "[GA4] Realtime API error — retornando vazio");
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
  getTopPages: adminProcedure
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
  getTrafficSources: adminProcedure
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

  // Sessões por dia (gráfico de linha)
  getSessionsOverTime: adminProcedure
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