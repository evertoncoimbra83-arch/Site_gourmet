import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  return { select };
});

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../encryption.js", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    decrypt: vi.fn((val) => val),
    encrypt: vi.fn((val) => val),
    piiHash: vi.fn((val) => val),
    normalizeDigits: vi.fn((val) => val),
  };
});

import { profileRouter } from "./profile.js";

describe("Profile Router - Completeness", () => {
  const ctx = {
    user: { id: "user-1" },
    session: { id: "sess-1" },
    req: {},
    res: {},
  } as any;

  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
  });

  it("should calculate 100% completeness and false for isIncomplete when all fields are present", async () => {
    const mockUser = {
      id: "user-1",
      name: "John Doe",
      email: "john@example.com",
      phone: "11999999999",
      birthDate: "1990-01-01",
      customerDocument: "12345678909",
      password: "hashedpassword",
      referralCode: null,
      birthYear: 1990,
    };

    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });

    const caller = profileRouter.createCaller(ctx);
    const result = await caller.get();

    expect(result.completionPercentage).toBe(100);
    expect(result.isIncomplete).toBe(false);
  });

  it("should calculate 75% completeness and true for isIncomplete when birthDate is missing", async () => {
    const mockUser = {
      id: "user-1",
      name: "John Doe",
      email: "john@example.com",
      phone: "11999999999",
      birthDate: "",
      customerDocument: "12345678909",
      password: "hashedpassword",
      referralCode: null,
      birthYear: null,
    };

    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });

    const caller = profileRouter.createCaller(ctx);
    const result = await caller.get();

    expect(result.completionPercentage).toBe(75);
    expect(result.isIncomplete).toBe(true);
  });

  it("should calculate 50% completeness and true for isIncomplete when birthDate and phone are missing", async () => {
    const mockUser = {
      id: "user-1",
      name: "John Doe",
      email: "john@example.com",
      phone: "",
      birthDate: null,
      customerDocument: "12345678909",
      password: "hashedpassword",
      referralCode: null,
      birthYear: null,
    };

    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });

    const caller = profileRouter.createCaller(ctx);
    const result = await caller.get();

    expect(result.completionPercentage).toBe(50);
    expect(result.isIncomplete).toBe(true);
  });
});
