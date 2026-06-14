import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// Setup database mock object
const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const insert = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  const transaction = vi.fn();

  return {
    select,
    insert,
    update,
    delete: deleteFn,
    transaction,
  };
});

// Mock database
vi.mock("./db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

// Mock auth
vi.mock("./auth.js", () => ({
  lucia: {
    createSession: vi.fn(async (userId) => ({ id: "mock-session-id" })),
    createSessionCookie: vi.fn(() => ({
      serialize: vi.fn(() => "mock-session-cookie"),
      attributes: {},
    })),
  },
  promoteCart: vi.fn(async () => {}),
}));

// Mock audit logs
vi.mock("./services/AuditLogService.js", () => ({
  AuditLogService: {
    record: vi.fn(),
    recordError: vi.fn(),
  },
}));

// Mock encryption preserving original custom types (like encryptedText)
vi.mock("./encryption.js", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    encrypt: vi.fn((val) => val ? `enc_${val}` : val),
    decrypt: vi.fn((val) => val && typeof val === "string" && val.startsWith("enc_") ? val.slice(4) : val),
    piiHash: vi.fn((val) => val ? `hash_${val}` : val),
    normalizeDigits: vi.fn((val) => val ? val.replace(/\D/g, "") : val),
  };
});

// Mock checkout calculations & loading helpers
vi.mock("./orders/logic/recalculateOrder.js", () => ({
  recalculateCheckoutFromCart: vi.fn(async (params) => {
    return {
      cart: {
        id: params.cartId,
        couponCode: null,
        couponId: null,
      },
      shippingCost: params.shippingCost || 0,
      pointsUsed: params.useLoyaltyPoints ? 50 : 0,
      pointsEarned: 10,
      totals: {
        subtotal: 100,
        shipping: params.shippingCost || 0,
        autoDiscount: 0,
        couponDiscount: 0,
        loyaltyDiscount: params.useLoyaltyPoints ? 5.0 : 0,
        total: 100 + (params.shippingCost || 0) - (params.useLoyaltyPoints ? 5.0 : 0),
      }
    };
  })
}));

vi.mock("./routers/storefront/checkout/address.js", () => ({
  loadAddressSnapshot: vi.fn(async (tx, opts) => {
    if (opts.shippingType === "pickup") {
      return {
        type: "pickup" as const,
        text: "Retirada no Local / Balcão",
        zipCode: null,
        price: 0,
      };
    }
    return {
      type: "delivery" as const,
      id: opts.addressId || "addr-1",
      text: "Rua Teste, 123",
      zipCode: "12345678",
      price: 15.0,
    };
  })
}));

vi.mock("./routers/storefront/checkout/orders.js", () => ({
  createOrderWithItems: vi.fn(async (params) => ({
    orderId: "mock-order-id-123",
    publicAccessToken: params.isGuest ? "mock-public-access-token-uuid" : null,
  })),
  cleanupCheckoutCarts: vi.fn(async () => {}),
}));

// Import target routers and schemas
import { authRouter } from "./routers/storefront/auth/index.js";
import { checkoutRouter } from "./routers/storefront/checkout/index.js";
import { ordersRouter } from "./routers/storefront/orders.js";
import { users, userAddresses, paymentMethods, orders, orderItems } from "../drizzle/schema/index.js";
import { promoteCart } from "./auth.js";

// Helper to safely inspect Drizzle where expressions without circular refs
function inspectWhere(val: any): string {
  if (!val || typeof val !== "object") return "";
  let res = "";
  if (val.name) res += " " + val.name;
  if (val.mapFromDriverValue) res += " column";

  const keys = Object.keys(val);
  for (const k of keys) {
    if (k === "table" || k === "config") continue; // avoid circular reference
    const child = val[k];
    if (child && typeof child === "object") {
      res += " " + inspectWhere(child);
    } else {
      res += " " + String(child);
    }
  }
  return res;
}

// Database state
let mockUsers: any[] = [];
let mockAddresses: any[] = [];
let mockPaymentMethods: any[] = [{ id: "pix", name: "Pix" }];
let mockOrders: any[] = [];
let mockOrderItems: any[] = [];

let mockUsersEmailQuery = "";
let mockUsersCpfQuery = "";
let insertedUsers: any[] = [];
let insertedOrders: any[] = [];
let updateSetMock = vi.fn();

describe("Guest Checkout & Public Access Token - Integration Specs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
    dbMock.insert.mockReset();
    dbMock.update.mockReset();
    dbMock.delete.mockReset();
    dbMock.transaction.mockReset();

    mockUsers = [];
    mockAddresses = [];
    mockPaymentMethods = [{ id: "pix", name: "Pix" }];
    mockOrders = [];
    mockOrderItems = [];

    mockUsersEmailQuery = "";
    mockUsersCpfQuery = "";
    insertedUsers = [];
    insertedOrders = [];
    updateSetMock = vi.fn();

    // Setup db transaction mock
    dbMock.transaction.mockImplementation(async (callback) => {
      return callback(dbMock);
    });

    // Implement chainable select matching table schemas
    dbMock.select.mockImplementation(() => {
      const chain: any = {
        from: (table: any) => {
          let resolvedValue: any[] = [];
          if (table === users) {
            resolvedValue = mockUsers;
          } else if (table === userAddresses) {
            resolvedValue = mockAddresses;
          } else if (table === paymentMethods) {
            resolvedValue = mockPaymentMethods;
          } else if (table === orders) {
            resolvedValue = mockOrders;
          } else if (table === orderItems) {
            resolvedValue = mockOrderItems;
          }

          const subChain: any = {
            leftJoin: () => subChain,
            where: (whereClause: any) => {
              const sqlStr = inspectWhere(whereClause);
              if (table === users) {
                if (sqlStr.includes("email")) {
                  resolvedValue = mockUsers.filter(u => u.email === mockUsersEmailQuery);
                } else if (sqlStr.includes("document_index") || sqlStr.includes("documentIndex")) {
                  resolvedValue = mockUsers.filter(u => u.documentIndex === mockUsersCpfQuery);
                }
              } else if (table === orders) {
                if (sqlStr.includes("userId") || sqlStr.includes("user_id")) {
                  resolvedValue = mockOrders.filter(o => o.userId && sqlStr.includes(String(o.userId)));
                } else {
                  resolvedValue = mockOrders.filter(o => o.id && sqlStr.includes(String(o.id)));
                }
              } else if (table === orderItems) {
                resolvedValue = mockOrderItems.filter(item => item.orderId && sqlStr.includes(String(item.orderId)));
              }
              return subChain;
            },
            orderBy: () => subChain,
            limit: () => subChain,
            then: (onfulfilled: any) => Promise.resolve(resolvedValue).then(onfulfilled),
          };
          return subChain;
        },
        then: (onfulfilled: any) => Promise.resolve([]).then(onfulfilled),
      };
      return chain;
    });

    // Implement simple insert mock tracking entries
    dbMock.insert.mockImplementation((table: any) => {
      const chain: any = {
        values: (valuesObj: any) => {
          if (table === users) {
            insertedUsers.push(valuesObj);
          } else if (table === orders) {
            insertedOrders.push(valuesObj);
          }
          return Promise.resolve({ insertId: 1 });
        },
        then: (onfulfilled: any) => Promise.resolve({ insertId: 1 }).then(onfulfilled),
      };
      return chain;
    });

    // Implement update mock
    dbMock.update.mockImplementation((table: any) => {
      const chain: any = {
        set: (updateObj: any) => {
          updateSetMock(updateObj);
          return {
            where: () => Promise.resolve({ affectedRows: 1 }),
            then: (onfulfilled: any) => Promise.resolve({ affectedRows: 1 }).then(onfulfilled),
          };
        },
        then: (onfulfilled: any) => Promise.resolve({ affectedRows: 1 }).then(onfulfilled),
      };
      return chain;
    });

    // Implement delete mock
    dbMock.delete.mockImplementation((table: any) => {
      const chain: any = {
        where: () => Promise.resolve({ affectedRows: 1 }),
        then: (onfulfilled: any) => Promise.resolve({ affectedRows: 1 }).then(onfulfilled),
      };
      return chain;
    });
  });

  it("1. guest novo cria shadow user e pedido com publicAccessToken", async () => {
    // Setup empty DB
    mockUsers = [];
    mockUsersEmailQuery = "newguest@example.com";
    mockUsersCpfQuery = "hash_12345678909";

    const authCtx = {
      guestId: "cart-guest-123",
      req: { ip: "127.0.0.1", headers: { "user-agent": "Mozilla" } },
      res: { appendHeader: vi.fn(), append: vi.fn() },
    } as any;

    const authCaller = authRouter.createCaller(authCtx);
    const guestSessionResult = await authCaller.createGuestSession({
      email: "newguest@example.com",
      name: "Guest Client",
      phone: "11999999999",
      cpf: "12345678909",
    });

    expect(guestSessionResult.success).toBe(true);
    expect(guestSessionResult.userId).toBeDefined();

    // Verify user was inserted as guest/shadow
    expect(insertedUsers).toHaveLength(1);
    expect(insertedUsers[0].loginMethod).toBe("guest");
    expect(insertedUsers[0].email).toBe("newguest@example.com");

    // Verify cart was promoted
    expect(promoteCart).toHaveBeenCalledWith("cart-guest-123", guestSessionResult.userId);

    // Verify placing order as this guest works and returns publicAccessToken
    mockAddresses = [{
      id: "addr-1",
      userId: guestSessionResult.userId,
      street: "enc_Rua Teste",
      number: "enc_123",
      neighborhood: "enc_Bairro",
      city: "enc_Cidade",
      state: "enc_SP",
      zipCode: "enc_12345678",
      lat: null,
      lng: null,
    }];
    mockUsers = [{
      id: guestSessionResult.userId,
      email: "newguest@example.com",
      loginMethod: "guest",
      availablePoints: 0,
    }];

    const checkoutCtx = {
      user: { id: guestSessionResult.userId, role: "user" },
      session: { id: "mock-sess-id" },
    } as any;

    const checkoutCaller = checkoutRouter.createCaller(checkoutCtx);
    const orderResult = await checkoutCaller.placeOrder({
      id: "cart-123",
      paymentMethodId: "pix",
      shippingType: "delivery",
      addressId: "addr-1",
      customerDocument: "12345678909",
      customerName: "Guest Client",
      customerPhone: "11999999999",
      customerEmail: "newguest@example.com",
      useLoyaltyPoints: false,
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.orderId).toBeDefined();
    // Guest order should include publicAccessToken
    expect(orderResult.publicAccessToken).toBe("mock-public-access-token-uuid");
  });

  it("2. guest com CPF existente não bloqueia checkout", async () => {
    // Mock user already existing with the same CPF but different email
    mockUsers = [{
      id: "real-user-123",
      email: "realowner@example.com",
      documentIndex: "hash_12345678909",
      loginMethod: "credentials",
    }];

    mockUsersEmailQuery = "newguest@example.com";
    mockUsersCpfQuery = "hash_12345678909";

    const authCtx = {
      guestId: "cart-guest-123",
      req: { ip: "127.0.0.1", headers: { "user-agent": "Mozilla" } },
      res: { appendHeader: vi.fn() },
    } as any;

    const authCaller = authRouter.createCaller(authCtx);
    const guestSessionResult = await authCaller.createGuestSession({
      email: "newguest@example.com",
      name: "Guest Client",
      phone: "11999999999",
      cpf: "12345678909",
    });

    expect(guestSessionResult.success).toBe(true);

    // Email should be suffixed to bypass unique constraint
    expect(insertedUsers).toHaveLength(1);
    expect(insertedUsers[0].loginMethod).toBe("guest");
    expect(insertedUsers[0].email).toContain("newguest@example.com.guest_");
  });

  it("3. guest com e-mail existente não sobrescreve usuário real", async () => {
    // Mock real registered user with that email
    mockUsers = [{
      id: "real-user-123",
      email: "realowner@example.com",
      documentIndex: "hash_99999999999",
      loginMethod: "credentials",
    }];

    mockUsersEmailQuery = "realowner@example.com";
    mockUsersCpfQuery = "hash_12345678909";

    const authCtx = {
      guestId: "cart-guest-123",
      req: { ip: "127.0.0.1", headers: { "user-agent": "Mozilla" } },
      res: { appendHeader: vi.fn() },
    } as any;

    const authCaller = authRouter.createCaller(authCtx);
    const guestSessionResult = await authCaller.createGuestSession({
      email: "realowner@example.com",
      name: "Guest Client",
      phone: "11999999999",
      cpf: "12345678909",
    });

    expect(guestSessionResult.success).toBe(true);

    // Registered user should NOT be overwritten (insertedUsers has a new guest entry instead)
    expect(insertedUsers).toHaveLength(1);
    expect(insertedUsers[0].id).not.toBe("real-user-123");
    expect(insertedUsers[0].email).toContain("realowner@example.com.guest_");
    expect(insertedUsers[0].loginMethod).toBe("guest");
  });

  it("4. guest não acessa histórico completo", async () => {
    // Mock user is a guest
    mockUsers = [{
      id: "guest-user-123",
      email: "guest@example.com",
      loginMethod: "guest",
    }];

    const ordersCtx = {
      user: { id: "guest-user-123", role: "user" },
      session: { id: "mock-sess-id" },
    } as any;

    const ordersCaller = ordersRouter.createCaller(ordersCtx);

    // Trying to list orders should throw FORBIDDEN
    await expect(ordersCaller.list()).rejects.toThrowError(
      new TRPCError({
        code: "FORBIDDEN",
        message: "Não é permitido visualizar histórico de pedidos como visitante.",
      })
    );
  });

  it("5. guest não usa pontos de fidelidade", async () => {
    mockUsers = [{
      id: "guest-user-123",
      email: "guest@example.com",
      loginMethod: "guest",
      availablePoints: 100,
    }];
    mockAddresses = [{
      id: "addr-1",
      userId: "guest-user-123",
      street: "enc_Rua Teste",
      number: "enc_123",
      neighborhood: "enc_Bairro",
      city: "enc_Cidade",
      state: "enc_SP",
      zipCode: "enc_12345678",
      lat: null,
      lng: null,
    }];

    const checkoutCtx = {
      user: { id: "guest-user-123", role: "user" },
      session: { id: "mock-sess-id" },
    } as any;

    const checkoutCaller = checkoutRouter.createCaller(checkoutCtx);

    // We pass useLoyaltyPoints: true, but it should be ignored for guest
    await checkoutCaller.placeOrder({
      id: "cart-123",
      paymentMethodId: "pix",
      shippingType: "delivery",
      addressId: "addr-1",
      customerDocument: "12345678909",
      customerName: "Guest Client",
      customerPhone: "11999999999",
      customerEmail: "guest@example.com",
      useLoyaltyPoints: true, // true, but will be ignored
    });

    // Verify loyalty point deductions did not happen.
    expect(updateSetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        availablePoints: expect.anything()
      })
    );
  });

  it("6. guest acessa pedido com publicAccessToken válido e recebe resposta sanitizada", async () => {
    // Populate mockOrders with publicAccessToken
    mockOrders = [{
      id: "order-123",
      userId: "guest-user-123",
      cartId: null,
      publicAccessToken: "valid-public-token-abc",
      total: 100.0,
      subtotal: 100.0,
      shippingCost: 0,
      totalDiscount: 0,
      pointsEarned: 0,
      pointsUsed: 0,
      status: "pending",
      customerName: "Guest Client",
      customerDocument: "enc_12345678909",
      customerPhone: "enc_11999999999",
      customerDocumentHash: "hash_12345678909",
      customerPhoneHash: "hash_11999999999",
      paymentMethod: "Pix",
      shippingCity: "Jundiaí",
      shippingState: "SP",
      notes: "",
      discountsSnapshot: "{}",
      createdAt: new Date(),
    }];

    const ordersCtx = {
      user: null, // anonymous/guest viewer context
    } as any;

    const ordersCaller = ordersRouter.createCaller(ordersCtx);

    // Call getById with correct orderId and correct publicAccessToken
    const result = await ordersCaller.getById({
      id: "order-123",
      token: "valid-public-token-abc",
    });

    expect(result).toBeDefined();
    expect(result.id).toBe("order-123");
    expect(result.status).toBe("pending");
    expect(result.total).toBeDefined();
    expect(result.customerName).toBe("Guest Client");

    // Sanitization: guest should NOT receive internal fields
    expect((result as any).userId).toBeUndefined();
    expect((result as any).cartId).toBeUndefined();
    expect((result as any).publicAccessToken).toBeUndefined();
    expect((result as any).customerDocument).toBeUndefined();
    expect((result as any).customerPhone).toBeUndefined();
    expect((result as any).customerDocumentHash).toBeUndefined();
    expect((result as any).customerPhoneHash).toBeUndefined();
    expect((result as any).discountsSnapshot).toBeUndefined();
    expect((result as any).pointsEarned).toBeUndefined();
    expect((result as any).pointsUsed).toBeUndefined();
  });

  it("7. token inválido retorna FORBIDDEN", async () => {
    mockOrders = [{
      id: "order-123",
      userId: "guest-user-123",
      publicAccessToken: "valid-public-token-abc",
      total: 100.0,
      subtotal: 100.0,
      shippingCost: 0,
      totalDiscount: 0,
      pointsEarned: 0,
      pointsUsed: 0,
    }];

    const ordersCtx = {
      user: null,
    } as any;

    const ordersCaller = ordersRouter.createCaller(ordersCtx);

    // Wrong token
    await expect(ordersCaller.getById({
      id: "order-123",
      token: "wrong-token",
    })).rejects.toThrow("Pedido não pertence ao usuário.");

    // No token at all
    await expect(ordersCaller.getById({
      id: "order-123",
    })).rejects.toThrow("Pedido não pertence ao usuário.");

    // Empty string token
    await expect(ordersCaller.getById({
      id: "order-123",
      token: "",
    })).rejects.toThrow("Pedido não pertence ao usuário.");
  });

  it("8. orderId trocado com token válido de outro pedido retorna NOT_FOUND", async () => {
    mockOrders = [{
      id: "order-123",
      userId: "guest-user-123",
      publicAccessToken: "valid-public-token-abc",
      total: 100.0,
      subtotal: 100.0,
      shippingCost: 0,
      totalDiscount: 0,
      pointsEarned: 0,
      pointsUsed: 0,
    }];

    const ordersCtx = { user: null } as any;
    const ordersCaller = ordersRouter.createCaller(ordersCtx);

    // Trying to access a non-existent order ID with a valid token from another order
    await expect(ordersCaller.getById({
      id: "order-999-nonexistent",
      token: "valid-public-token-abc",
    })).rejects.toThrow("Pedido não encontrado.");
  });

  it("9. pedido antigo sem publicAccessToken funciona para usuário logado", async () => {
    // Old order without publicAccessToken (NULL)
    mockOrders = [{
      id: "old-order-123",
      userId: "real-user-123",
      publicAccessToken: null,
      cartId: null,
      total: 50.0,
      subtotal: 50.0,
      shippingCost: 0,
      totalDiscount: 0,
      pointsEarned: 5,
      pointsUsed: 0,
      status: "delivered",
      createdAt: new Date(),
    }];

    const ordersCtx = {
      user: { id: "real-user-123", role: "user" },
      session: { id: "mock-sess-id" },
    } as any;

    const ordersCaller = ordersRouter.createCaller(ordersCtx);
    const result = await ordersCaller.getById({ id: "old-order-123" });

    // Logged-in user should get full order including all fields
    expect(result).toBeDefined();
    expect(result.id).toBe("old-order-123");
    expect((result as any).userId).toBe("real-user-123");
    expect((result as any).pointsEarned).toBe(5);
  });

  it("10. fluxo logado continua funcionando como antes", async () => {
    // Mock registered credentials user
    mockUsers = [{
      id: "real-user-123",
      email: "real@example.com",
      loginMethod: "credentials",
      availablePoints: 200,
    }];
    mockAddresses = [{
      id: "addr-1",
      userId: "real-user-123",
      street: "enc_Rua Teste",
      number: "enc_123",
      neighborhood: "enc_Bairro",
      city: "enc_Cidade",
      state: "enc_SP",
      zipCode: "enc_12345678",
      lat: null,
      lng: null,
    }];

    // Registered user CAN view order history
    const ordersCtx = {
      user: { id: "real-user-123", role: "user" },
      session: { id: "mock-sess-id" },
    } as any;
    const ordersCaller = ordersRouter.createCaller(ordersCtx);

    mockOrders = [{
      id: "order-999",
      userId: "real-user-123",
      total: 100,
    }];
    const history = await ordersCaller.list();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("order-999");

    // Registered user CAN use loyalty points
    const checkoutCtx = {
      user: { id: "real-user-123", role: "user" },
      session: { id: "mock-sess-id" },
    } as any;
    const checkoutCaller = checkoutRouter.createCaller(checkoutCtx);

    const orderResult = await checkoutCaller.placeOrder({
      id: "cart-123",
      paymentMethodId: "pix",
      shippingType: "delivery",
      addressId: "addr-1",
      customerDocument: "12345678909",
      customerName: "Real User",
      customerPhone: "11999999999",
      customerEmail: "real@example.com",
      useLoyaltyPoints: true,
    });

    // Logged-in user should NOT get publicAccessToken (not guest)
    expect(orderResult.publicAccessToken).toBeNull();

    // Check that update WAS called to deduct the points for registered user
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        availablePoints: expect.anything()
      })
    );
  });

  it("11. usuário autenticado não pode acessar pedido de outro usuário", async () => {
    mockOrders = [{
      id: "order-other-user",
      userId: "other-user-456",
      publicAccessToken: null,
      total: 75.0,
      subtotal: 75.0,
      shippingCost: 0,
      totalDiscount: 0,
      pointsEarned: 0,
      pointsUsed: 0,
    }];

    const ordersCtx = {
      user: { id: "real-user-123", role: "user" },
      session: { id: "mock-sess-id" },
    } as any;

    const ordersCaller = ordersRouter.createCaller(ordersCtx);

    await expect(ordersCaller.getById({
      id: "order-other-user",
    })).rejects.toThrow("Pedido não pertence ao usuário.");
  });
});
