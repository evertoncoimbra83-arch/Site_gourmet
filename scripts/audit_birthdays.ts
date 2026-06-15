/**
 * SCRIPT DE MANUTENÇÃO - APENAS LEITURA (READ-ONLY)
 *
 * ATENÇÃO:
 * - Este script é estritamente de leitura para fins de diagnóstico local.
 * - NÃO execute contra bancos de dados de produção.
 */

import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { decrypt } from "../server/encryption.js";

function getDatabaseUrl() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    const upEnvPath = path.resolve(process.cwd(), "..", ".env");
    if (fs.existsSync(upEnvPath)) {
      return parseEnvFile(upEnvPath);
    }
    console.error("No .env file found at " + envPath);
    return null;
  }
  return parseEnvFile(envPath);
}

function parseEnvFile(envPath: string): string | null {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*(["']?)(.*?)\1\s*$/);
    if (match) {
      return match[2].trim();
    }
  }
  return null;
}

async function run() {
  const dbUrl = getDatabaseUrl();
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
    // 1. Obter apenas os dados necessários para estatísticas (ID, data nascimento)
    const [users] = (await connection.query(
      "SELECT id, birth_date, birth_year FROM users WHERE deleted_at IS NULL"
    )) as any[];

    console.log(`Total de usuários ativos: ${users.length}`);

    let countHasBirthdate = 0;
    let countOnlyMonthDay = 0;
    let countFullDate = 0;
    let countNoInfo = 0;

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    let birthdaysToday = 0;
    let birthdaysNext7Days = 0;
    let birthdaysNext30Days = 0;

    // Helper para verificar aniversários
    const isBirthdayInRange = (
      birthDateStr: string,
      daysAhead: number
    ): boolean => {
      if (!birthDateStr) return false;
      // Formato esperado YYYY-MM-DD ou MM-DD
      const parts = birthDateStr.split("-");
      let m = 0;
      let d = 0;
      if (parts.length === 3) {
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      } else if (parts.length === 2) {
        m = parseInt(parts[0], 10);
        d = parseInt(parts[1], 10);
      } else {
        return false;
      }

      const now = new Date();
      for (let i = 0; i <= daysAhead; i++) {
        const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        if (checkDate.getMonth() + 1 === m && checkDate.getDate() === d) {
          return true;
        }
      }
      return false;
    };

    for (const u of users) {
      const bDate = u.birth_date;
      if (!bDate || bDate.trim() === "") {
        countNoInfo++;
      } else {
        countHasBirthdate++;
        const parts = bDate.split("-");
        if (parts.length === 3) {
          countFullDate++;
        } else {
          countOnlyMonthDay++;
        }

        // Verificar aniversário hoje
        if (isBirthdayInRange(bDate, 0)) {
          birthdaysToday++;
        }
        // Verificar aniversário nos próximos 7 dias
        if (isBirthdayInRange(bDate, 7)) {
          birthdaysNext7Days++;
        }
        // Verificar aniversário nos próximos 30 dias
        if (isBirthdayInRange(bDate, 30)) {
          birthdaysNext30Days++;
        }
      }
    }

    console.log(`\n--- Estatísticas de Cadastro ---`);
    console.log(
      `Clientes com data de nascimento preenchida: ${countHasBirthdate}`
    );
    console.log(`Clientes com apenas mês/dia: ${countOnlyMonthDay}`);
    console.log(`Clientes com data completa: ${countFullDate}`);
    console.log(`Clientes sem informação de aniversário: ${countNoInfo}`);
    console.log(
      `Percentual preenchido: ${((countHasBirthdate / users.length) * 100).toFixed(2)}%`
    );

    console.log(`\n--- Estatísticas de Aniversariantes ---`);
    console.log(`Aniversariantes hoje: ${birthdaysToday}`);
    console.log(`Aniversariantes próximos 7 dias: ${birthdaysNext7Days}`);
    console.log(`Aniversariantes próximos 30 dias: ${birthdaysNext30Days}`);

    // Buscar LTV e VIPs aniversariantes
    const [orders] = (await connection.query(`
      SELECT
        user_id,
        SUM(CAST(total AS DECIMAL(10,2))) as totalSpent
      FROM orders
      WHERE status IN ('completed', 'shipped', 'delivered')
        AND payment_status != 'refunded'
      GROUP BY user_id
    `)) as any[];

    const ltvMap = new Map<string, number>();
    for (const o of orders) {
      ltvMap.set(o.user_id, Number(o.totalSpent || 0));
    }

    let vipBirthdaysToday = 0;
    let vipBirthdays7 = 0;
    let vipBirthdays30 = 0;

    for (const u of users) {
      const bDate = u.birth_date;
      if (bDate && bDate.trim() !== "") {
        const ltv = ltvMap.get(u.id) || 0;
        const isVip = ltv >= 1500; // Ouro ou Diamante

        if (isVip) {
          if (isBirthdayInRange(bDate, 0)) vipBirthdaysToday++;
          if (isBirthdayInRange(bDate, 7)) vipBirthdays7++;
          if (isBirthdayInRange(bDate, 30)) vipBirthdays30++;
        }
      }
    }

    console.log(`\n--- Estatísticas VIP (Ouro/Diamante) ---`);
    console.log(`VIPs aniversariantes hoje: ${vipBirthdaysToday}`);
    console.log(`VIPs aniversariantes próximos 7 dias: ${vipBirthdays7}`);
    console.log(`VIPs aniversariantes próximos 30 dias: ${vipBirthdays30}`);
  } catch (err) {
    console.error("Error executing audit query:", err);
  } finally {
    await connection.end();
  }
}
run();
