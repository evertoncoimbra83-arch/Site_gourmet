import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const insert = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  return { select, insert, update, delete: deleteFn };
});

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../services/AuditLogService.js", () => ({
  AuditLogService: {
    record: vi.fn(async () => undefined),
    recordError: vi.fn(async () => undefined),
  },
}));

import { adminAnnouncementsRouter } from "./announcements.js";
import { storefrontAnnouncementsRouter } from "../storefront/announcements.js";

function mockSelectChain(result: unknown, shape: "orderBy" | "limit" | "where" = "where") {
  if (shape === "orderBy") {
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(result),
        }),
        orderBy: vi.fn().mockResolvedValue(result),
      }),
    };
  }

  if (shape === "limit") {
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(result),
        }),
      }),
    };
  }

  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(result),
      }),
      where: vi.fn().mockResolvedValue(result),
    }),
  };
}

function queueSelects(...chains: unknown[]) {
  const queue = [...chains];
  dbMock.select.mockImplementation(() => queue.shift());
}

function mockInsert() {
  const values = vi.fn().mockResolvedValue({ success: true });
  dbMock.insert.mockReturnValue({ values });
  return values;
}

function mockUpdate() {
  const where = vi.fn().mockResolvedValue({ success: true });
  const set = vi.fn().mockReturnValue({ where });
  dbMock.update.mockReturnValue({ set });
  return { set, where };
}

function mockDelete() {
  const where = vi.fn().mockResolvedValue({ success: true });
  dbMock.delete.mockReturnValue({ where });
  return where;
}

describe("Announcements Router", () => {
  const adminCtx = {
    user: { id: "admin-1", role: "admin" },
    session: { id: "sess-1" },
    req: {},
    res: {},
  } as any;

  const publicCtx = {
    user: null,
    session: null,
    req: {},
    res: {},
  } as any;

  const userCtx = {
    user: { id: "user-1", role: "user" },
    session: { id: "sess-2" },
    req: {},
    res: {},
  } as any;

  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
    dbMock.insert.mockReset();
    dbMock.update.mockReset();
    dbMock.delete.mockReset();
  });

  describe("Admin CRUD", () => {
    it("lists announcements with all as fallback and target summary", async () => {
      const mockList = [
        { id: "1", title: "Aviso 1", createdAt: new Date(), visibilityScope: null },
        { id: "2", title: "Aviso 2", createdAt: new Date(), visibilityScope: "specific_users" },
      ];
      queueSelects(
        mockSelectChain(mockList, "orderBy"),
        mockSelectChain([
          {
            announcementId: "2",
            userId: "user-1",
            email: "cliente@example.com",
            name: "Cliente",
          },
        ]),
      );

      const caller = adminAnnouncementsRouter.createCaller(adminCtx);
      const result = await caller.list();

      expect(result[0].visibilityScope).toBe("all");
      expect(result[1].selectedUserCount).toBe(1);
      expect(result[1].targetUsers[0].email).toBe("cliente@example.com");
    });

    it("creates a global announcement and clears targets", async () => {
      const insertValues = mockInsert();
      const deleteWhere = mockDelete();

      const caller = adminAnnouncementsRouter.createCaller(adminCtx);
      const result = await caller.create({
        title: "Novo Aviso",
        content: "Conteudo do aviso",
        isActive: true,
        type: "DELIVERY",
        startDate: null,
        endDate: null,
        iconEmoji: null,
        visibilityScope: "all",
        selectedUserIds: ["ignored-user"],
      });

      expect(result.success).toBe(true);
      expect(insertValues).toHaveBeenCalled();
      expect(insertValues.mock.calls[0][0]).toMatchObject({
        title: "Novo Aviso",
        visibilityScope: "all",
      });
      expect(deleteWhere).toHaveBeenCalledTimes(1);
    });

    it("blocks specific_users create without users", async () => {
      const caller = adminAnnouncementsRouter.createCaller(adminCtx);

      await expect(
        caller.create({
          title: "Aviso privado",
          content: "Conteudo",
          isActive: true,
          type: "INFO",
          startDate: null,
          endDate: null,
          visibilityScope: "specific_users",
          selectedUserIds: [],
        }),
      ).rejects.toThrow("Selecione pelo menos um usuario");
    });

    it("saves specific_users targets without duplicating selected ids", async () => {
      queueSelects(mockSelectChain([{ id: "user-1" }, { id: "user-2" }]));
      const insertValues = mockInsert();
      mockDelete();

      const caller = adminAnnouncementsRouter.createCaller(adminCtx);
      await caller.create({
        title: "Aviso privado",
        content: "Conteudo",
        isActive: true,
        type: "INFO",
        startDate: null,
        endDate: null,
        visibilityScope: "specific_users",
        selectedUserIds: ["user-1", "user-1", "user-2"],
      });

      expect(insertValues).toHaveBeenCalledTimes(2);
      const targetRows = insertValues.mock.calls[1][0];
      expect(targetRows).toHaveLength(2);
      expect(targetRows.map((row: any) => row.userId)).toEqual(["user-1", "user-2"]);
    });

    it("update all clears targets", async () => {
      const now = new Date();
      queueSelects(
        mockSelectChain(
          [{ id: "ann-1", startDate: now, endDate: null, visibilityScope: "specific_users" }],
          "limit",
        ),
      );
      mockUpdate();
      const deleteWhere = mockDelete();

      const caller = adminAnnouncementsRouter.createCaller(adminCtx);
      const result = await caller.update({
        id: "ann-1",
        title: "Aviso",
        content: "Conteudo",
        isActive: true,
        type: "INFO",
        startDate: now.toISOString(),
        endDate: null,
        visibilityScope: "all",
        selectedUserIds: ["user-1"],
      });

      expect(result.success).toBe(true);
      expect(deleteWhere).toHaveBeenCalledTimes(1);
    });

    it("update authenticated clears targets", async () => {
      const now = new Date();
      queueSelects(
        mockSelectChain(
          [{ id: "ann-1", startDate: now, endDate: null, visibilityScope: "specific_users" }],
          "limit",
        ),
      );
      mockUpdate();
      const deleteWhere = mockDelete();

      const caller = adminAnnouncementsRouter.createCaller(adminCtx);
      await caller.update({
        id: "ann-1",
        title: "Aviso",
        content: "Conteudo",
        isActive: true,
        type: "INFO",
        startDate: now.toISOString(),
        endDate: null,
        visibilityScope: "authenticated",
        selectedUserIds: ["user-1"],
      });

      expect(deleteWhere).toHaveBeenCalledTimes(1);
    });
  });

  describe("Storefront active filter list", () => {
    it("anonymous users only receive announcements allowed by the backend filter", async () => {
      const mockActive = [
        { id: "1", title: "Aviso Ativo", isActive: true, visibilityScope: "all" },
      ];
      queueSelects(mockSelectChain(mockActive, "orderBy"));

      const caller = storefrontAnnouncementsRouter.createCaller(publicCtx);
      const result = await caller.listActive();

      expect(result).toEqual(mockActive);
      expect(dbMock.select).toHaveBeenCalled();
    });

    it("logged users use user context in listActive", async () => {
      const mockActive = [
        { id: "1", title: "Geral", isActive: true, visibilityScope: "all" },
        {
          id: "2",
          title: "Autenticado",
          isActive: true,
          visibilityScope: "authenticated",
        },
      ];
      queueSelects(mockSelectChain(mockActive, "orderBy"));

      const caller = storefrontAnnouncementsRouter.createCaller(userCtx);
      const result = await caller.listActive();

      expect(result).toHaveLength(2);
    });

    it("featured announcement is filtered by visibility before returning", async () => {
      const featured = { id: "public", title: "Publico", visibilityScope: "all" };
      const chain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([featured]),
            }),
          }),
        }),
      };
      queueSelects(chain);

      const caller = storefrontAnnouncementsRouter.createCaller(publicCtx);
      await expect(caller.getFeatured()).resolves.toEqual(featured);
    });
  });
});
