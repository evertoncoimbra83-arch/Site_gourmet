import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  execute: vi.fn(),
}));

const state = vi.hoisted(() => ({
  appConfigs: [] as Array<{ configKey: string; configValue: string | null }>,
  shipping: [] as Array<Record<string, unknown>>,
}));

vi.mock("../../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../../storeSettings.js", () => ({
  getStoreSettings: vi.fn(async () => ({
    id: "1",
    favicon: "",
    emergencyMode: false,
    generalMinOrderAmount: "0.00",
    minOrderMessage: "",
  })),
}));

vi.mock("../../../db/lib/audit.js", () => ({
  logAction: vi.fn(),
}));

vi.mock("../../../services/AuditLogService.js", () => ({
  AuditLogService: {
    record: vi.fn(),
  },
}));

import { appConfigs, shippingSettings } from "../../../../drizzle/schema/index.js";
import { adminRouter } from "../index.js";
import { adminStoreSettingsRouter } from "./index.js";
import { getInjectableGtmId } from "./gtm.js";

function rowsWithDrizzleMethods<T>(rows: T[]) {
  const result = [...rows] as T[] & {
    where: () => { limit: () => T[] };
    limit: () => T[];
  };

  result.where = () => ({
    limit: () => result,
  });
  result.limit = () => result;

  return result;
}

function configureSelectMock() {
  dbMock.select.mockImplementation(() => ({
    from: (table: unknown) => {
      if (table === appConfigs) {
        return rowsWithDrizzleMethods(state.appConfigs);
      }
      if (table === shippingSettings) {
        return rowsWithDrizzleMethods(state.shipping);
      }
      return rowsWithDrizzleMethods([]);
    },
  }));
}

function createAdminCaller() {
  return adminStoreSettingsRouter.createCaller({
    user: { id: "admin-1", role: "super_admin" },
    session: { id: "session-1" },
    req: { ip: "127.0.0.1", headers: {} },
    res: {},
    db: dbMock,
  } as any);
}

describe("adminStoreSettingsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.appConfigs = [];
    state.shipping = [];
    configureSelectMock();
    dbMock.update.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    });
    dbMock.execute.mockResolvedValue([]);
  });

  it("registra o subrouter em admin.storeSettings", () => {
    const procedures = (adminRouter as any)._def.procedures;
    expect(procedures["storeSettings.get"]).toBeDefined();
    expect(procedures["storeSettings.upsert"]).toBeDefined();
  });

  it("responde leitura de configuracoes vazias sem quebrar o frontend", async () => {
    const caller = createAdminCaller();

    const settings = await caller.get();

    expect(settings).toMatchObject({
      id: "1",
      success_order_message: "",
      partners_json: "[]",
      pickupEnabled: false,
      gtmId: "",
      googleAnalyticsId: "",
      ga4PropertyId: "",
      accessibility: {
        vLibrasActive: false,
        highContrastActive: false,
      },
    });
  });

  it("atualiza GTM no app_configs sem alterar formato salvo", async () => {
    const caller = createAdminCaller();

    await caller.upsert({ gtmId: "gtm-abcd123" });

    expect(dbMock.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        queryChunks: expect.any(Array),
      }),
    );
    expect(JSON.stringify(dbMock.execute.mock.calls)).toContain("GTM-ABCD123");
  });

  it("atualiza GA4 sem expor private_key na leitura admin", async () => {
    state.appConfigs = [
      {
        configKey: "ga_service_account",
        configValue: JSON.stringify({
          type: "service_account",
          client_email: "svc@example.com",
          private_key: "secret-key",
        }),
      },
      { configKey: "ga4_property_id", configValue: "250001647" },
      { configKey: "google_analytics_id", configValue: "G-ABC123" },
    ];
    configureSelectMock();

    const settings = await createAdminCaller().get();

    expect(settings.ga4PropertyId).toBe("250001647");
    expect(settings.googleAnalyticsId).toBe("G-ABC123");
    expect(settings.gaServiceAccount).toContain("svc@example.com");
    expect(settings.gaServiceAccount).not.toContain("secret-key");
  });

  it("nao injeta GTM invalido no payload publico", () => {
    expect(getInjectableGtmId("teste")).toBeNull();
    expect(getInjectableGtmId("GTM-ABC123")).toBe("GTM-ABC123");
  });
});
