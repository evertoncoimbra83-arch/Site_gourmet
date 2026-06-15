import "dotenv/config";
import { listClosedPdvComandaIds, syncPdvComandaToBI } from "../pdv-bi-sync.js";

async function main() {
  console.log("=== PDV COMANDAS -> BI SYNC ===");

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

  console.log("Buscando comandas fechadas...");
  const comandaIds = await listClosedPdvComandaIds();

  if (isDryRun) {
    console.log("\n--------------------------------------------------");
    console.log("MODO: DRY-RUN (SIMULAÇÃO)");
    console.log(`[DRY-RUN] Simulação: Seriam sincronizadas ${comandaIds.length} comandas com o BI.`);
    console.log("Para executar alterações reais no banco de dados local, execute:");
    console.log("  pnpm exec tsx server/scripts/sync_pdv_comandas_bi.ts --execute --confirm=SYNC_PDV_BI_LOCAL");
    console.log("--------------------------------------------------\n");
    process.exit(0);
  }

  if (confirmValue !== "SYNC_PDV_BI_LOCAL") {
    console.error("ERRO: Confirmação textual incorreta. Utilize --confirm=SYNC_PDV_BI_LOCAL");
    process.exit(1);
  }

  console.log("\n--------------------------------------------------");
  console.log("MODO: EXECUÇÃO REAL LOCAL");
  console.log("--------------------------------------------------\n");

  const summary = {
    totalFechadas: comandaIds.length,
    sincronizadas: 0,
    ignoradas: 0,
    erros: 0,
  };

  for (const comandaId of comandaIds) {
    try {
      const result = await syncPdvComandaToBI(comandaId);
      if (result.status === "synced") {
        summary.sincronizadas++;
      } else {
        summary.ignoradas++;
      }

      if (result.collisionRisk) {
        console.warn(
          `WARNING: order_id >= 10000000 ja existe no BI. comanda=${comandaId}, orderIdBi=${result.orderIdBi}`
        );
      }
    } catch (error) {
      summary.erros++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao sincronizar comanda ${comandaId}: ${message}`);
    }
  }

  console.log("=== Resumo ===");
  console.log(`Total fechadas: ${summary.totalFechadas}`);
  console.log(`Sincronizadas: ${summary.sincronizadas}`);
  console.log(`Ignoradas: ${summary.ignoradas}`);
  console.log(`Erros: ${summary.erros}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Erro fatal no sync historico de comandas PDV:", error);
    process.exit(1);
  });
