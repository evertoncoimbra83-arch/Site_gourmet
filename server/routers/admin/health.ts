import { operatorProcedure, router } from "../../_core/trpc.js";
import { sql } from "drizzle-orm";
// ✅ Importação corrigida para exportação nomeada
import { redisConnection } from "../../lib/redis.js"; 

export const healthRouter = router({
  checkStatus: operatorProcedure.query(async ({ ctx }) => {
    const start = Date.now();

    // 1. Banco de Dados (.10)
    let dbStatus = "online";
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await ctx.db.execute(sql`SELECT 1`);
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = "offline";
    }

    // 2. Redis (.10)
    let redisStatus = "online";
    let redisLatency = 0;
    try {
      const redisStart = Date.now();
      // ✅ Usando redisConnection conforme definido no seu arquivo lib/redis
      await redisConnection.ping(); 
      redisLatency = Date.now() - redisStart;
    } catch {
      redisStatus = "offline";
    }

    return {
      status: dbStatus === "online" && redisStatus === "online" ? "healthy" : "critical",
      timestamp: new Date().toISOString(),
      totalLatency: Date.now() - start,
      components: [
        { id: "database", name: "MySQL Server (.10)", status: dbStatus, latency: dbLatency },
        { id: "redis", name: "Redis Cache (.10)", status: redisStatus, latency: redisLatency },
        { id: "api", name: "Node.js Engine (.6)", status: "online", latency: 0 }
      ]
    };
  }),
});
