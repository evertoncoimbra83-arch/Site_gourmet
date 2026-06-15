import "dotenv/config";
import { getDb } from "../db.js";
import { inArray, not, eq, and } from "drizzle-orm";
import * as schema from "../../drizzle/schema/index.js";
import { processAnalyticsJob } from "../workers/biWorker.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get current directory for backup file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=== BI FACTS REBUILD SCRIPT ===");

  // Parse arguments
  const args = process.argv.slice(2);
  const isDryRun = !args.includes("--execute");
  const confirmArg = args.find(arg => arg.startsWith("--confirm="));
  const confirmValue = confirmArg ? confirmArg.split("=")[1] : "";

  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    console.error("ERRO: DATABASE_URL não encontrada no ambiente.");
    process.exit(1);
  }

  // Guard de segurança contra bancos remotos/produção
  const lowerUrl = dbUrl.toLowerCase();
  if (
    lowerUrl.includes("supabase") ||
    lowerUrl.includes("online") ||
    lowerUrl.includes("prod") ||
    lowerUrl.includes("production") ||
    lowerUrl.includes("aws") ||
    lowerUrl.includes("rds") ||
    process.env.DATABASE_URL_ONLINE
  ) {
    console.error("ERRO DE SEGURANÇA: Execução bloqueada em banco de produção/remoto ou DATABASE_URL_ONLINE definida.");
    process.exit(1);
  }

  const db = await getDb();

  // 1. BACKUP E SELEÇÃO DE PEDIDOS
  console.log("Buscando pedidos elegíveis (status completed/shipped/delivered, não reembolsados)...");
  const eligibleOrders = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(
      and(
        inArray(schema.orders.status, ["completed", "shipped", "delivered"]),
        not(eq(schema.orders.paymentStatus, "refunded"))
      )
    );

  console.log(`Pedidos elegíveis encontrados: ${eligibleOrders.length}`);

  if (isDryRun) {
    console.log("\n--------------------------------------------------");
    console.log("MODO: DRY-RUN (SIMULAÇÃO)");
    console.log(`[DRY-RUN] Simulação: Seriam apagados todos os fatos de BI e reprocessados ${eligibleOrders.length} pedidos.`);
    console.log("Para executar alterações reais no banco de dados local, execute:");
    console.log("  pnpm exec tsx server/scripts/rebuild_bi_facts.ts --execute --confirm=REBUILD_BI_FACTS_LOCAL");
    console.log("--------------------------------------------------\n");
    process.exit(0);
  }

  if (confirmValue !== "REBUILD_BI_FACTS_LOCAL") {
    console.error("ERRO: Confirmação textual incorreta. Utilize --confirm=REBUILD_BI_FACTS_LOCAL");
    process.exit(1);
  }

  console.log("\n--------------------------------------------------");
  console.log("MODO: EXECUÇÃO REAL LOCAL");
  console.log("--------------------------------------------------\n");

  console.log("Starting backup of existing BI facts...");
  const financialFacts = await db.select().from(schema.biFinancialFacts);
  const salesFacts = await db.select().from(schema.biSalesFacts);

  const backupData = {
    timestamp: new Date().toISOString(),
    biFinancialFacts: financialFacts,
    biSalesFacts: salesFacts,
  };

  const backupPath = path.join(__dirname, `backup_bi_facts_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf-8");
  console.log(`Backup saved to ${backupPath}`);
  console.log(
    `Backed up ${financialFacts.length} financial facts and ${salesFacts.length} sales facts.`
  );

  try {
    // 2. TRUNCATE
    console.log("Cleaning BI facts tables (deleting all facts)...");
    await db.delete(schema.biSalesFacts);
    await db.delete(schema.biFinancialFacts);
    console.log("Tables cleaned successfully.");

    // 3. SELECTION
    console.log(`Using ${eligibleOrders.length} eligible orders pre-fetched.`);

    // 4. REPROCESS
    let successCount = 0;
    let failCount = 0;
    for (const order of eligibleOrders) {
      try {
        const mockJob = {
          data: {
            orderId: order.id,
            requestId: "rebuild-script",
          },
        } as any;
        await processAnalyticsJob(mockJob);
        successCount++;
        if (successCount % 50 === 0 || successCount === eligibleOrders.length) {
          console.log(
            `Processed ${successCount}/${eligibleOrders.length} orders...`
          );
        }
      } catch (err: any) {
        console.error(`Failed to process order ${order.id}:`, err);
        failCount++;
      }
    }

    console.log(
      `Process complete. Success: ${successCount}, Failures: ${failCount}`
    );

    // 5. VALIDATION
    const finFactsAfter = await db.select().from(schema.biFinancialFacts);
    const salFactsAfter = await db.select().from(schema.biSalesFacts);

    console.log(`=== Rebuild Summary ===`);
    console.log(`Total orders processed: ${eligibleOrders.length}`);
    console.log(`Financial facts generated: ${finFactsAfter.length}`);
    console.log(`Sales facts generated: ${salFactsAfter.length}`);

    // Check for collisions
    const duplicateIds = new Set<number>();
    const seenIds = new Set<number>();
    for (const fact of finFactsAfter) {
      if (seenIds.has(fact.orderId)) {
        duplicateIds.add(fact.orderId);
      }
      seenIds.add(fact.orderId);
    }

    if (duplicateIds.size > 0) {
      console.warn(
        `WARNING: Found ${duplicateIds.size} duplicate orderIds in bi_financial_facts!`,
        Array.from(duplicateIds)
      );
    } else {
      console.log(
        "Success: No duplicate orderIds in bi_financial_facts (No collisions!)."
      );
    }
  } catch (error) {
    console.error(
      "Critical error during rebuild. Rolling back to original state...",
      error
    );
    // ROLLBACK FROM BACKUP
    console.log("Restoring tables from backup...");
    await db.delete(schema.biSalesFacts);
    await db.delete(schema.biFinancialFacts);

    if (backupData.biFinancialFacts.length > 0) {
      const finChunks = chunkArray(backupData.biFinancialFacts, 100);
      for (const chunk of finChunks) {
        await db.insert(schema.biFinancialFacts).values(chunk);
      }
    }

    if (backupData.biSalesFacts.length > 0) {
      const salesChunks = chunkArray(backupData.biSalesFacts, 100);
      for (const chunk of salesChunks) {
        await db.insert(schema.biSalesFacts).values(chunk);
      }
    }
    console.log("Restore complete.");
  }

  process.exit(0);
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

main().catch(err => {
  console.error("Uncaught error:", err);
  process.exit(1);
});
