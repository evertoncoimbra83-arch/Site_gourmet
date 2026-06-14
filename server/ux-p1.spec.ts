import { describe, expect, it } from "vitest";
import {
  getCheckoutFocusSelector,
  getFirstCheckoutFocusIssue,
} from "../shared/domain/ux/checkoutFocus.js";
import { filterProductsBySearch } from "../shared/domain/ux/productSearch.js";
import { mapValidationError } from "../client/src/pages/checkout/logic/checkout-helpers.js";
import {
  canViewerSeeAnnouncement,
  selectFeaturedAnnouncement,
} from "../shared/domain/ux/announcements.js";
import {
  PROFILE_MOBILE_TEST_WIDTHS,
  shouldUseScrollableProfileTabs,
} from "../shared/domain/ux/responsive.js";

describe("UX P1 checkout focus", () => {
  const readyCheckout = {
    hasItems: true,
    customerName: "Cliente Teste",
    customerPhone: "11999999999",
    customerCpf: "12345678909",
    isCpfValid: true,
    guestSessionReady: true,
    shippingType: "delivery",
    selectedAddressId: "addr-1",
    canDeliver: true,
    canContinueShipping: true,
    selectedPaymentId: "pix",
    acceptedTerms: true,
  };

  it("detects invalid CPF as the first blocking field", () => {
    const issue = getFirstCheckoutFocusIssue({
      ...readyCheckout,
      customerCpf: "123",
      isCpfValid: false,
    });

    expect(issue?.field).toBe("customerCpf");
    expect(issue?.section).toBe("customer");
  });

  it("exposes a stable selector for smooth scroll and focus", () => {
    expect(getCheckoutFocusSelector("customerCpf")).toBe(
      '[data-checkout-field="customerCpf"]',
    );
  });

  it("detects missing payment after customer and shipping are valid", () => {
    const issue = getFirstCheckoutFocusIssue({
      ...readyCheckout,
      selectedPaymentId: null,
    });

    expect(issue?.field).toBe("payment");
  });
});

describe("UX P1 product search", () => {
  const products = [
    {
      name: "Frango grelhado",
      categoryName: "Proteinas",
      description: "Marmita fit com arroz integral",
      ingredients: "frango batata doce",
    },
    {
      name: "Lasanha de legumes",
      categoryName: "Vegano",
      description: "Sem carne",
      ingredients: "berinjela tomate",
    },
  ];

  it("finds products by name", () => {
    expect(filterProductsBySearch(products, "frango")).toHaveLength(1);
  });

  it("finds products by category", () => {
    expect(filterProductsBySearch(products, "vegano")).toHaveLength(1);
  });

  it("returns no results when nothing matches", () => {
    expect(filterProductsBySearch(products, "low carb")).toHaveLength(0);
  });
});

describe("UX P1 featured announcement", () => {
  const now = new Date("2026-05-30T12:00:00.000Z");

  it("selects the newest active visible announcement", () => {
    const featured = selectFeaturedAnnouncement(
      [
        {
          title: "Antigo",
          isActive: true,
          createdAt: "2026-05-20T12:00:00.000Z",
        },
        {
          title: "Comunicado",
          isActive: true,
          startDate: "2026-05-29T12:00:00.000Z",
          endDate: "2026-06-01T12:00:00.000Z",
          createdAt: "2026-05-29T12:00:00.000Z",
        },
      ],
      now,
    );

    expect(featured?.title).toBe("Comunicado");
  });

  it("hides expired announcements", () => {
    const featured = selectFeaturedAnnouncement(
      [
        {
          title: "Expirado",
          isActive: true,
          endDate: "2026-05-01T12:00:00.000Z",
          createdAt: "2026-05-01T12:00:00.000Z",
        },
      ],
      now,
    );

    expect(featured).toBeNull();
  });

  it("treats announcements without visibility scope as all", () => {
    expect(canViewerSeeAnnouncement({ isActive: true })).toBe(true);
  });

  it("allows anonymous viewers to see only all announcements", () => {
    expect(
      canViewerSeeAnnouncement({ isActive: true, visibilityScope: "all" }),
    ).toBe(true);
    expect(
      canViewerSeeAnnouncement({
        isActive: true,
        visibilityScope: "authenticated",
      }),
    ).toBe(false);
    expect(
      canViewerSeeAnnouncement({
        isActive: true,
        visibilityScope: "specific_users",
        targetUserIds: ["user-1"],
      }),
    ).toBe(false);
  });

  it("allows logged viewers to see all, authenticated, and own specific announcements", () => {
    const viewer = { userId: "user-1" };

    expect(
      canViewerSeeAnnouncement(
        { isActive: true, visibilityScope: "all" },
        viewer,
      ),
    ).toBe(true);
    expect(
      canViewerSeeAnnouncement(
        { isActive: true, visibilityScope: "authenticated" },
        viewer,
      ),
    ).toBe(true);
    expect(
      canViewerSeeAnnouncement(
        {
          isActive: true,
          visibilityScope: "specific_users",
          targetUserIds: ["user-1"],
        },
        viewer,
      ),
    ).toBe(true);
  });

  it("blocks logged viewers from seeing another user's specific announcement", () => {
    expect(
      canViewerSeeAnnouncement(
        {
          isActive: true,
          visibilityScope: "specific_users",
          targetUserIds: ["user-2"],
        },
        { userId: "user-1" },
      ),
    ).toBe(false);
  });

  it("does not select a private featured announcement for anonymous viewers", () => {
    const featured = selectFeaturedAnnouncement(
      [
        {
          title: "Privado",
          isActive: true,
          visibilityScope: "authenticated" as const,
          createdAt: "2026-05-30T12:00:00.000Z",
        },
        {
          title: "Publico",
          isActive: true,
          visibilityScope: "all" as const,
          createdAt: "2026-05-29T12:00:00.000Z",
        },
      ],
      now,
    );

    expect(featured?.title).toBe("Publico");
  });
});

describe("UX P1 mobile profile tabs", () => {
  it("keeps the audited mobile widths on scrollable tabs", () => {
    expect(PROFILE_MOBILE_TEST_WIDTHS.every(shouldUseScrollableProfileTabs)).toBe(
      true,
    );
  });

  it("does not require scrollable tab layout on desktop widths", () => {
    expect(shouldUseScrollableProfileTabs(768)).toBe(false);
  });
});

describe("Checkout validation error handling", () => {
  it("correctly identifies and maps tRPC phone validation errors without leaking promise rejection", () => {
    // Simula um erro do tRPC para telefone inválido
    const trpcError = {
      message: "O telefone informado é inválido.",
      data: {
        code: "BAD_REQUEST",
      },
    };

    // Mapeia o erro
    const { errors, isValidationError, focusField } = mapValidationError(trpcError);

    expect(isValidationError).toBe(true);
    expect(errors.phone).toBe("O telefone informado é inválido.");
    expect(focusField).toBe("customerPhone");
  });

  it("correctly identifies and maps Zod field validation errors for document/CPF", () => {
    const trpcZodError = {
      message: "Validation error",
      data: {
        zodError: {
          fieldErrors: {
            customerDocument: ["CPF incompleto"],
          },
        },
      },
    };

    const { errors, isValidationError, focusField } = mapValidationError(trpcZodError);

    expect(isValidationError).toBe(true);
    expect(errors.cpf).toBe("CPF incompleto");
    expect(focusField).toBe("customerCpf");
  });

  it("correctly bubbles up unexpected errors", () => {
    const unexpectedError = {
      message: "Database connection failed",
      data: {
        code: "INTERNAL_SERVER_ERROR",
      },
    };

    const { isValidationError } = mapValidationError(unexpectedError);
    expect(isValidationError).toBe(false);
  });
});
