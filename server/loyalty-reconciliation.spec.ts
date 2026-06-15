import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => {
  const execute = vi.fn();
  const insert = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  return { execute, insert, update, transaction };
});

const txMock = vi.hoisted(() => {
  const execute = vi.fn();
  const insertValues = vi.fn();
  const insert = vi.fn(() => ({ values: insertValues }));
  const updateWhere = vi.fn();
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));
  return { execute, insert, insertValues, update, updateSet, updateWhere };
});

vi.mock("./db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("./services/AuditLogService.js", () => ({
  AuditLogService: {
    record: vi.fn().mockResolvedValue(undefined),
    recordError: vi.fn().mockResolvedValue(undefined),
  },
}));

import { loyaltyAdminRouter } from "./routers/admin/automation.routes.js";
import { AuditLogService } from "./services/AuditLogService.js";
import {
  applyLoyaltyReconciliation,
  decryptDisplayName,
  getLoyaltyReconciliationPreview,
  normalizeReconciliationRows,
} from "./loyalty-reconciliation.js";
import { encrypt } from "./encryption.js";

describe("loyalty reconciliation preview", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.execute.mockReset();
    dbMock.insert.mockReset();
    dbMock.update.mockReset();
    dbMock.transaction.mockReset();
    txMock.execute.mockReset();
    txMock.insert.mockClear();
    txMock.insertValues.mockReset();
    txMock.update.mockClear();
    txMock.updateSet.mockClear();
    txMock.updateWhere.mockReset();
    vi.mocked(AuditLogService.record).mockReset();
  });

  it("marca saldo correto sem divergencia", () => {
    const [row] = normalizeReconciliationRows([
      {
        userId: "u-ok",
        nome: "Cliente OK",
        email: "ok@test.com",
        saldoAtual: 100,
        saldoTeorico: 100,
      },
    ]);

    expect(row.status).toBe("ok");
    expect(row.diferenca).toBe(0);
  });

  it("descriptografa nome vindo de SQL bruto", () => {
    const encryptedName = encrypt("Cliente Criptografado");

    const [row] = normalizeReconciliationRows([
      {
        userId: "u-crypto",
        nome: encryptedName,
        email: "crypto@test.com",
        saldoAtual: 10,
        saldoTeorico: 10,
      },
    ]);

    expect(row.nome).toBe("Cliente Criptografado");
  });

  it("marca saldo negativo", () => {
    const [row] = normalizeReconciliationRows([
      {
        userId: "u-neg",
        nome: "Cliente Negativo",
        email: "neg@test.com",
        saldoAtual: -20,
        saldoTeorico: -20,
      },
    ]);

    expect(row.status).toBe("negative");
  });

  it("calcula divergencia positiva", () => {
    const [row] = normalizeReconciliationRows([
      {
        userId: "u-pos",
        saldoAtual: 40,
        saldoTeorico: 90,
      },
    ]);

    expect(row.status).toBe("divergent");
    expect(row.diferenca).toBe(50);
  });

  it("calcula divergencia negativa", () => {
    const [row] = normalizeReconciliationRows([
      {
        userId: "u-neg-diff",
        saldoAtual: 90,
        saldoTeorico: 40,
      },
    ]);

    expect(row.status).toBe("divergent");
    expect(row.diferenca).toBe(-50);
  });

  it("normaliza valores invalidos sem retornar NaN", () => {
    const [row] = normalizeReconciliationRows([
      {
        userId: "u-invalid",
        nome: "Cliente Invalido",
        saldoAtual: "not-a-number",
        saldoTeorico: "",
      },
    ]);

    expect(row.saldoAtual).toBe(0);
    expect(row.saldoTeorico).toBe(0);
    expect(row.diferenca).toBe(0);
    expect(Number.isNaN(row.saldoAtual)).toBe(false);
    expect(Number.isNaN(row.saldoTeorico)).toBe(false);
    expect(Number.isNaN(row.diferenca)).toBe(false);
  });

  it("decryptDisplayName retorna fallback para string criptografada corrompida", () => {
    expect(
      decryptDisplayName("bad-iv:bad-tag:bad-payload", "cliente@test.com"),
    ).toBe("Cliente nao identificado");
  });

  it("dry-run nao altera banco", async () => {
    dbMock.execute.mockResolvedValue([
      [
        {
          userId: "u-1",
          nome: "Cliente",
          email: "cliente@test.com",
          saldoAtual: 10,
          saldoTeorico: 25,
        },
      ],
    ]);

    const preview = await getLoyaltyReconciliationPreview();

    expect(preview.auditedUsers).toBe(1);
    expect(preview.divergentUsers).toBe(1);
    expect(preview.totalDifference).toBe(15);
    expect(dbMock.transaction).not.toHaveBeenCalled();
    expect(dbMock.insert).not.toHaveBeenCalled();
    expect(dbMock.update).not.toHaveBeenCalled();
  });
});

describe("loyalty reconciliation apply", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.transaction.mockImplementation((cb) => cb(txMock));
    txMock.execute.mockReset();
    txMock.insertValues.mockReset();
    txMock.updateWhere.mockReset();
    vi.mocked(AuditLogService.record).mockReset();
  });

  it("apply atualiza somente o snapshot de saldo", async () => {
    txMock.execute.mockResolvedValue([
      [
        {
          userId: "u-1",
          nome: "Cliente",
          email: "cliente@test.com",
          saldoAtual: 10,
          saldoTeorico: 25,
        },
      ],
    ]);

    const result = await applyLoyaltyReconciliation({
      userId: "u-1",
      expectedDifference: 15,
      reason: "reconciliacao administrativa",
    });

    expect(result.applied).toBe(true);
    expect(txMock.insertValues).not.toHaveBeenCalled();
    expect(txMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        availablePoints: 25,
      }),
    );
    expect(result.snapshotUpdate).toEqual({
      oldBalance: 10,
      newBalance: 25,
      difference: 15,
      reason: "reconciliacao administrativa",
    });
  });

  it("apply bloqueia se divergencia mudou", async () => {
    txMock.execute.mockResolvedValue([
      [
        {
          userId: "u-1",
          saldoAtual: 10,
          saldoTeorico: 30,
        },
      ],
    ]);

    await expect(
      applyLoyaltyReconciliation({
        userId: "u-1",
        expectedDifference: 15,
        reason: "reconciliacao administrativa",
      }),
    ).rejects.toThrow("Divergencia mudou");

    expect(txMock.insertValues).not.toHaveBeenCalled();
    expect(txMock.updateSet).not.toHaveBeenCalled();
  });

  it("somente super_admin aplica pelo router", async () => {
    const caller = loyaltyAdminRouter.createCaller({
      user: { id: "admin-1", role: "admin" },
      session: { id: "sess-1" },
      req: { ip: "127.0.0.1", headers: {} },
      res: {},
    } as any);

    await expect(
      caller.applyReconciliation({
        userId: "u-1",
        expectedDifference: 15,
        reason: "tentativa admin",
      }),
    ).rejects.toThrow("permiss");
  });

  it("router registra auditoria ao aplicar", async () => {
    txMock.execute.mockResolvedValue([
      [
        {
          userId: "u-1",
          nome: "Cliente",
          email: "cliente@test.com",
          saldoAtual: 10,
          saldoTeorico: 25,
        },
      ],
    ]);

    const caller = loyaltyAdminRouter.createCaller({
      user: { id: "root-1", role: "super_admin" },
      session: { id: "sess-1" },
      req: { ip: "127.0.0.1", headers: {}, requestId: "req-1" },
      res: {},
    } as any);

    const result = await caller.applyReconciliation({
      userId: "u-1",
      expectedDifference: 15,
      reason: "reconciliacao administrativa",
    });

    expect(result.applied).toBe(true);
    expect(AuditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "LOYALTY_RECONCILIATION_APPLY",
        severity: "critical",
        entityId: "u-1",
        oldValues: expect.objectContaining({
          saldoAtual: 10,
          saldoTeorico: 25,
          diferenca: 15,
        }),
        newValues: expect.objectContaining({
          oldBalance: 10,
          newBalance: 25,
          difference: 15,
          reason: "reconciliacao administrativa",
        }),
      }),
    );
  });
});
