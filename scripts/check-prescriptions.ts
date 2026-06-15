/**
 * SCRIPT DE DIAGNÓSTICO DE PRESCRIÇÕES - APENAS LEITURA (READ-ONLY)
 *
 * ATENÇÃO:
 * - Este script é estritamente de leitura para fins de diagnóstico local.
 * - NÃO execute contra bancos de dados de produção.
 */

import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
  }

  // Guard de segurança contra conexão remota/produção
  if (
    dbUrl.includes("supabase") ||
    dbUrl.includes("online") ||
    dbUrl.includes("prod") ||
    dbUrl.includes("aws") ||
    dbUrl.includes("rds")
  ) {
    console.error("ERRO DE SEGURANÇA: Conexão detectada como base remota/produção. Operação cancelada.");
    process.exit(1);
  }

  const connection = await mysql.createConnection(dbUrl);

  try {
    console.log("=== ÚLTIMAS 5 PRESCRIÇÕES DO BANCO ===");
    const [prescs]: any = await connection.execute(
      `SELECT id, client_id, professional_id, status, plan_name, updated_at
       FROM prescriptions
       ORDER BY updated_at DESC
       LIMIT 5`
    );

    console.table(prescs);

    if (prescs.length === 0) {
      console.log("Nenhuma prescrição encontrada.");
      return;
    }

    const latestPrescriptionId = prescs[0].id;
    console.log(
      `\n=== ITENS DA ÚLTIMA PRESCRIÇÃO (${latestPrescriptionId}) ===`
    );
    const [items]: any = await connection.execute(
      `SELECT id, prescription_id, dish_id, size_id, dish_name,
              LEFT(accompaniments_json, 150) AS accompaniments_json_preview,
              JSON_LENGTH(accompaniments_json) AS accs_len
       FROM prescription_items
       WHERE prescription_id = ?`,
      [latestPrescriptionId]
    );

    console.table(items);

    console.log(
      `\n=== ACOMPANHAMENTOS DETALHADOS DA ÚLTIMA PRESCRIÇÃO (${latestPrescriptionId}) ===`
    );
    const [detailedAccs]: any = await connection.execute(
      `SELECT
         pi.id AS item_id,
         jt.id AS acc_id,
         jt.name AS acc_name,
         jt.groupId,
         jt.groupName,
         jt.weight,
         jt.defaultGrammage
       FROM prescription_items pi,
       JSON_TABLE(pi.accompaniments_json, '$[*]' COLUMNS (
         id VARCHAR(64) PATH '$.id',
         name VARCHAR(255) PATH '$.name',
         groupId VARCHAR(64) PATH '$.groupId',
         groupName VARCHAR(255) PATH '$.groupName',
         weight DECIMAL(10,2) PATH '$.weight',
         defaultGrammage DECIMAL(10,2) PATH '$.defaultGrammage'
       )) jt
       WHERE pi.prescription_id = ?`,
      [latestPrescriptionId]
    );

    console.table(detailedAccs);
  } catch (err) {
    console.error("Erro ao executar query:", err);
  } finally {
    await connection.end();
  }
}

main();
