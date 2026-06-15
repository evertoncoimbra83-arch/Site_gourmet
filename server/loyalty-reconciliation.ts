import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";

import { users } from "../drizzle/schema/index.js";
import { getDb } from "./db.js";
import { decrypt } from "./encryption.js";
import { safeInteger, safeNumber } from "./lib/safe-parse.js";
import { logger } from "./logger.js";

export type LoyaltyReconciliationStatus =
  | "ok"
  | "divergent"
  | "negative"
  | "negative_divergent";

export interface LoyaltyReconciliationRow {
  userId: string;
  nome: string;
  email: string;
  saldoAtual: number;
  saldoTeorico: number;
  diferenca: number;
  status: LoyaltyReconciliationStatus;
  sugestao: string;
}

export interface LoyaltyReconciliationPreview {
  auditedUsers: number;
  divergentUsers: number;
  negativeUsers: number;
  totalDifference: number;
  topDivergences: LoyaltyReconciliationRow[];
  users: LoyaltyReconciliationRow[];
}

type RawReconciliationRow = {
  userId?: string | null;
  nome?: string | Buffer | null;
  email?: string | null;
  saldoAtual?: number | string | null;
  saldoTeorico?: number | string | null;
};

function toNumber(value: unknown): number {
  return safeNumber(value, 0);
}

function toInteger(value: unknown): number {
  return safeInteger(toNumber(value), 0);
}

function rowsFromExecuteResult(result: unknown): RawReconciliationRow[] {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as RawReconciliationRow[];
  }
  if (Array.isArray(result)) {
    return result as RawReconciliationRow[];
  }
  return [];
}

export function decryptDisplayName(
  rawName: string | Buffer | null | undefined,
  email: string | null | undefined,
): string {
  try {
    const rawText = Buffer.isBuffer(rawName)
      ? rawName.toString("utf8")
      : typeof rawName === "string"
        ? rawName
        : "";
    const looksEncrypted = rawText.split(":").length === 3;
    const decrypted = decrypt(rawName);
    const cleanName = decrypted?.trim();

    if (cleanName && (!looksEncrypted || cleanName !== rawText.trim())) {
      return cleanName;
    }

    if (looksEncrypted && cleanName === rawText.trim()) {
      logger.warn(
        { encryptedNameMalformed: true },
        "Falha sanitizada ao descriptografar nome de cliente na reconciliacao",
      );
    }
  } catch (error) {
    logger.warn(
      { err: error instanceof Error ? error.message : "unknown" },
      "Falha sanitizada ao descriptografar nome de cliente na reconciliacao",
    );
  }

  return "Cliente nao identificado";
}

export function normalizeReconciliationRows(
  rows: RawReconciliationRow[],
): LoyaltyReconciliationRow[] {
  return rows.map((row) => {
    const saldoAtual = toInteger(row.saldoAtual);
    const saldoTeorico = toInteger(row.saldoTeorico);
    const diferenca = toInteger(saldoTeorico - saldoAtual);
    const isDivergent = diferenca !== 0;
    const isNegative = saldoAtual < 0 || saldoTeorico < 0;
    const status: LoyaltyReconciliationStatus =
      isNegative && isDivergent
        ? "negative_divergent"
        : isNegative
          ? "negative"
          : isDivergent
            ? "divergent"
            : "ok";

    return {
      userId: String(row.userId || ""),
      nome: decryptDisplayName(row.nome, row.email),
      email: row.email || "",
      saldoAtual,
      saldoTeorico,
      diferenca,
      status,
      sugestao: isDivergent
        ? `Ajustar saldo para ${saldoTeorico} ponto(s).`
        : "Nenhum ajuste necessario.",
    };
  });
}

export function summarizeReconciliationRows(
  users: LoyaltyReconciliationRow[],
): LoyaltyReconciliationPreview {
  const divergent = users.filter((row) => row.diferenca !== 0);
  const negative = users.filter(
    (row) => row.saldoAtual < 0 || row.saldoTeorico < 0,
  );

  return {
    auditedUsers: users.length,
    divergentUsers: divergent.length,
    negativeUsers: negative.length,
    totalDifference: divergent.reduce(
      (sum, row) => toInteger(sum + row.diferenca),
      0,
    ),
    topDivergences: [...divergent]
      .sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca))
      .slice(0, 10),
    users: divergent,
  };
}

export async function getLoyaltyReconciliationPreview() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql`
    SELECT
      base.user_id AS userId,
      COALESCE(u.name, u.email, 'Cliente sem nome') AS nome,
      COALESCE(u.email, '') AS email,
      COALESCE(u.loyalty_balance, 0) AS saldoAtual,
      COALESCE(SUM(lh.points_change), 0) AS saldoTeorico
    FROM (
      SELECT id AS user_id FROM users
      UNION
      SELECT user_id FROM loyalty_history
    ) base
    LEFT JOIN users u ON u.id = base.user_id
    LEFT JOIN loyalty_history lh ON lh.user_id = base.user_id
    GROUP BY base.user_id, u.name, u.email, u.loyalty_balance
    ORDER BY ABS(COALESCE(SUM(lh.points_change), 0) - COALESCE(u.loyalty_balance, 0)) DESC
  `);

  return summarizeReconciliationRows(
    normalizeReconciliationRows(rowsFromExecuteResult(result)),
  );
}

export async function getUserReconciliationRow(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql`
    SELECT
      base.user_id AS userId,
      COALESCE(u.name, u.email, 'Cliente sem nome') AS nome,
      COALESCE(u.email, '') AS email,
      COALESCE(u.loyalty_balance, 0) AS saldoAtual,
      COALESCE(SUM(lh.points_change), 0) AS saldoTeorico
    FROM (
      SELECT ${userId} AS user_id
    ) base
    LEFT JOIN users u ON u.id = base.user_id
    LEFT JOIN loyalty_history lh ON lh.user_id = base.user_id
    GROUP BY base.user_id, u.name, u.email, u.loyalty_balance
  `);

  const [row] = normalizeReconciliationRows(rowsFromExecuteResult(result));
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Usuario nao encontrado para reconciliacao.",
    });
  }
  return row;
}

export async function applyLoyaltyReconciliation(input: {
  userId: string;
  expectedDifference: number;
  reason: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const reason = input.reason.trim();
  if (!reason) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Motivo obrigatorio para aplicar reconciliacao.",
    });
  }

  return db.transaction(async (tx) => {
    const result = await tx.execute(sql`
      SELECT
        ${input.userId} AS userId,
        COALESCE(u.name, u.email, 'Cliente sem nome') AS nome,
        COALESCE(u.email, '') AS email,
        COALESCE(u.loyalty_balance, 0) AS saldoAtual,
        COALESCE(SUM(lh.points_change), 0) AS saldoTeorico
      FROM users u
      LEFT JOIN loyalty_history lh ON lh.user_id = u.id
      WHERE u.id = ${input.userId}
      GROUP BY u.id, u.name, u.email, u.loyalty_balance
    `);

    const [current] = normalizeReconciliationRows(rowsFromExecuteResult(result));
    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Usuario nao encontrado para reconciliacao.",
      });
    }

    if (current.diferenca !== input.expectedDifference) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Divergencia mudou desde a simulacao. Rode a simulacao novamente.",
      });
    }

    if (current.diferenca === 0) {
      return { success: true, applied: false, row: current };
    }

    await tx
      .update(users)
      .set({
        availablePoints: current.saldoTeorico,
        updatedAt: new Date(),
      })
      .where(sql`${users.id} = ${input.userId}`);

    return {
      success: true,
      applied: true,
      row: current,
      snapshotUpdate: {
        oldBalance: current.saldoAtual,
        newBalance: current.saldoTeorico,
        difference: current.diferenca,
        reason,
      },
    };
  });
}
