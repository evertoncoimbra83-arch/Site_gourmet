import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EMAIL_IDENTITY_CHECK_DEBOUNCE_MS,
  canCheckUserExists,
  normalizeCheckoutEmail,
} from "../shared/domain/checkout/emailIdentityCheck";
import {
  formatCpf,
  isValidCpf,
  maskCpfForDisplay,
  normalizeCpf,
} from "../shared/domain/checkout/cpf";
import { getFirstCheckoutFocusIssue } from "../shared/domain/ux/checkoutFocus";
import { CheckoutService } from "../client/src/pages/checkout/logic/checkoutService";

const baseInput = {
  authLoading: false,
  isAuthenticated: false,
  normalizedEmail: "cliente@example.com",
  lastCheckedEmail: null,
  isPending: false,
  now: 1_000,
  rateLimitedUntil: 0,
};

describe("checkout guest email identity check guard", () => {
  it("does not call auth.checkUserExists on logged-out checkout mount without email", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        normalizedEmail: normalizeCheckoutEmail(""),
      }),
    ).toBe(false);
  });

  it("does not call auth.checkUserExists for invalid email", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        normalizedEmail: normalizeCheckoutEmail("cliente@"),
      }),
    ).toBe(false);
  });

  it("does not call auth.checkUserExists while CPF is incomplete", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        cleanCpf: "1234567890",
      }),
    ).toBe(false);
  });

  it("calls auth.checkUserExists once for a new valid email after debounce", () => {
    expect(EMAIL_IDENTITY_CHECK_DEBOUNCE_MS).toBeGreaterThanOrEqual(500);
    expect(EMAIL_IDENTITY_CHECK_DEBOUNCE_MS).toBeLessThanOrEqual(800);
    expect(canCheckUserExists(baseInput)).toBe(true);
  });

  it("does not call auth.checkUserExists again for the same email on re-render", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        lastCheckedEmail: "cliente@example.com",
      }),
    ).toBe(false);
  });

  it("does not call auth.checkUserExists again for the same email and CPF", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        cleanCpf: "12345678901",
        lastCheckedEmail: "cliente@example.com",
        lastCheckedCpf: "12345678901",
      }),
    ).toBe(false);
  });

  it("allows one new call when email changes to another valid value", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        normalizedEmail: "outro@example.com",
        lastCheckedEmail: "cliente@example.com",
      }),
    ).toBe(true);
  });

  it("allows one new call when CPF changes from empty to complete", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        cleanCpf: "12345678901",
        lastCheckedEmail: "cliente@example.com",
        lastCheckedCpf: "",
      }),
    ).toBe(true);
  });

  it("does not call auth.checkUserExists while auth is loading", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        authLoading: true,
      }),
    ).toBe(false);
  });

  it("does not call auth.checkUserExists for authenticated users", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        isAuthenticated: true,
      }),
    ).toBe(false);
  });

  it("does not call auth.checkUserExists while a request is pending", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        isPending: true,
      }),
    ).toBe(false);
  });

  it("does not retry automatically during a recent 429 pause", () => {
    expect(
      canCheckUserExists({
        ...baseInput,
        now: 10_000,
        rateLimitedUntil: 60_000,
      }),
    ).toBe(false);
  });

  it("keeps sticky CTA and readiness out of auth.checkUserExists", () => {
    const checkoutPage = readFileSync("client/src/pages/Checkout.tsx", "utf8");
    const readiness = readFileSync(
      "client/src/pages/checkout/logic/useCheckoutReadiness.ts",
      "utf8",
    );

    expect(checkoutPage).not.toContain("checkUserExists");
    expect(readiness).not.toContain("checkUserExists");
  });

  it("does not render checkout readiness debug text in desktop or mobile CTA", () => {
    const checkoutPage = readFileSync("client/src/pages/Checkout.tsx", "utf8");
    const checkoutSummary = readFileSync(
      "client/src/pages/checkout/components/CheckoutSummary.tsx",
      "utf8",
    );

    expect(checkoutSummary).not.toContain("gate={readiness.gate}");
    expect(checkoutSummary).not.toContain("machine={machineState}");
    expect(checkoutSummary).toContain("firstIssue?.message");
    expect(checkoutPage).toContain("firstIssue?.message");
    expect(checkoutPage).not.toContain("gate=");
    expect(checkoutPage).not.toContain("machine=");
  });

  it("explains guest checkout without saying data is not saved", () => {
    const checkoutCustomer = readFileSync(
      "client/src/pages/checkout/components/CheckoutCustomer.tsx",
      "utf8",
    );

    expect(checkoutCustomer).toContain("Você não precisa criar senha");
    expect(checkoutCustomer).toContain("cadastro temporário de visitante");
    expect(checkoutCustomer).toContain("Finalizar como visitante");
    expect(checkoutCustomer).not.toContain("Continuar sem criar conta");
    expect(checkoutCustomer).not.toContain("dados não são salvos");
  });

  it("guards guest session creation against duplicate clicks and same payload retries", () => {
    const checkoutCustomer = readFileSync(
      "client/src/pages/checkout/components/CheckoutCustomer.tsx",
      "utf8",
    );

    expect(checkoutCustomer).toContain("isCreatingGuestRef.current");
    expect(checkoutCustomer).toContain("pendingGuestPayloadRef.current");
    expect(checkoutCustomer).toContain("createdGuestPayloadRef.current");
  });

  it("confirms auth.me before releasing guest address flow", () => {
    const checkoutCustomer = readFileSync(
      "client/src/pages/checkout/components/CheckoutCustomer.tsx",
      "utf8",
    );

    expect(checkoutCustomer).toContain("await trpcUtils.auth.me.invalidate()");
    expect(checkoutCustomer).toContain("await trpcUtils.auth.me.fetch()");
    expect(checkoutCustomer).toContain(
      "await trpcUtils.store.addresses.list.invalidate()",
    );
  });

  it("does not call store.addresses.create before guest session guard", () => {
    const addressForm = readFileSync(
      "client/src/pages/checkout/components/CheckoutAddressForm.tsx",
      "utf8",
    );
    const guardIndex = addressForm.indexOf("if (!session.isReady)");
    const mutateIndex = addressForm.indexOf("createAddressMutation.mutate");

    expect(guardIndex).toBeGreaterThan(-1);
    expect(mutateIndex).toBeGreaterThan(guardIndex);
    expect(addressForm).toContain(
      "finalize primeiro sua identificação como visitante",
    );
    expect(addressForm).toContain('code === "UNAUTHORIZED"');
  });

  it("blocks opening address form before guest session is active", () => {
    const shipping = readFileSync(
      "client/src/pages/checkout/components/CheckoutShipping.tsx",
      "utf8",
    );

    expect(shipping).toContain("needsGuestSessionForDelivery");
    expect(shipping).toContain("requestGuestIdentification");
    expect(shipping).toContain("onClick={openAddressForm}");
    expect(shipping).not.toContain('onClick={() => setAddressMode("form")}');
  });

  it("shows visitor identification before address readiness issues", () => {
    const focus = readFileSync("shared/domain/ux/checkoutFocus.ts", "utf8");
    const readiness = readFileSync(
      "client/src/pages/checkout/logic/useCheckoutReadiness.ts",
      "utf8",
    );

    expect(focus.indexOf("guestSessionReady")).toBeGreaterThan(-1);
    expect(focus.indexOf("!input.guestSessionReady")).toBeLessThan(
      focus.indexOf('input.shippingType === "delivery"'),
    );
    expect(readiness).toContain('"visitor"');
    expect(readiness.indexOf("!visitorOk")).toBeLessThan(
      readiness.indexOf("!logisticsOk"),
    );
  });

  it("uses one normalized CPF rule for guest identification and final readiness", () => {
    const cpf = "123.456.789-09";

    expect(normalizeCpf(cpf)).toBe("12345678909");
    expect(isValidCpf(cpf)).toBe(true);

    const issue = getFirstCheckoutFocusIssue({
      hasItems: true,
      customerName: "Cliente Teste",
      customerPhone: "11999999999",
      customerCpf: cpf,
      isCpfValid: false,
      guestSessionReady: true,
      shippingType: "pickup",
      selectedPaymentId: "pix",
      acceptedTerms: true,
    });

    expect(issue?.field).not.toBe("customerCpf");
  });

  it("keeps invalid CPF blocked in readiness", () => {
    const issue = getFirstCheckoutFocusIssue({
      hasItems: true,
      customerName: "Cliente Teste",
      customerPhone: "11999999999",
      customerCpf: "111.111.111-11",
      isCpfValid: true,
      guestSessionReady: true,
      shippingType: "pickup",
      selectedPaymentId: "pix",
      acceptedTerms: true,
    });

    expect(issue?.field).toBe("customerCpf");
  });

  it("does not use visually masked CPF as final order document", () => {
    const realCpf = "12345678909";
    const displayCpf = maskCpfForDisplay(realCpf);

    expect(displayCpf).toBe("123.***.***-09");
    expect(isValidCpf(displayCpf)).toBe(false);

    const payload = CheckoutService.preparePayload({
      cartId: "cart-123",
      customerName: "Cliente Teste",
      customerCpf: formatCpf(realCpf),
      customerPhone: "(11) 99999-9999",
      customerEmail: "cliente@example.com",
      selectedPaymentId: "pix",
      selectedShippingType: "pickup",
      selectedAddressId: null,
      usesLoyalty: false,
    });

    expect(payload.customerDocument).toBe(realCpf);
  });

  it("does not overwrite checkout CPF with masked session values", () => {
    const viewModel = readFileSync(
      "client/src/pages/checkout/logic/useCheckoutViewModel.ts",
      "utf8",
    );
    const customer = readFileSync(
      "shared/domain/checkout/customer.ts",
      "utf8",
    );
    const checkoutCustomer = readFileSync(
      "client/src/pages/checkout/components/CheckoutCustomer.tsx",
      "utf8",
    );

    expect(customer).toContain("normalizeCpf");
    expect(viewModel).toContain("isValidCpf(customerData.cpf)");
    expect(viewModel).toContain("normalizeCpf(customerData.cpf)");
    expect(checkoutCustomer).toContain("cpf: cleanCpf");
    expect(checkoutCustomer).toContain("maskCpfForDisplay(customer.cpf)");
  });
});
