import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readSource(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function block(source: string, startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("Nutri client canonical link P0", () => {
  it("auth.linkReferral writes professional_clients and keeps users.referral_code", () => {
    const source = block(
      readSource("server/routers/storefront/auth/index.ts"),
      "linkReferral: protectedProcedure",
      "listSessions: protectedProcedure",
    );

    expect(source).toContain("tx.insert(professionalClients).values");
    expect(source).toContain("professionalId: nutri.id");
    expect(source).toContain("clientId: ctx.user.id");
    expect(source).toContain(".set({ referralCode: input.referralCode })");
  });

  it("auth.linkReferral is idempotent and reactivates inactive links", () => {
    const source = block(
      readSource("server/routers/storefront/auth/index.ts"),
      "linkReferral: protectedProcedure",
      "listSessions: protectedProcedure",
    );

    expect(source).toContain("existingRelationship");
    expect(source).toContain('status: existingRelationship ? "ALREADY_LINKED" : "LINKED"');
    expect(source).toContain('existingRelationship.status !== "active"');
    expect(source).toContain(".update(professionalClients)");
    expect(source).toContain('.set({ status: "active", updatedAt: new Date() })');
  });

  it("createOrLinkClient writes the canonical link and keeps the legacy referral", () => {
    const source = readSource(
      "server/routers/storefront/nutri/procedures/clients.ts",
    );

    expect(source).toContain("async function ensureProfessionalClientLink");
    expect(source).toContain("db.insert(professionalClients).values");
    expect(source).toContain("professionalId: profile.id");
    expect(source).toContain("clientId");
    expect(source).toContain(".set({ referralCode: nutriCode })");
    expect(source).toContain("referralCode: nutriCode");
  });

  it("getMyClients lists by professional_clients without depending on prescriptions", () => {
    const source = block(
      readSource("server/routers/storefront/nutri/procedures/clients.ts"),
      "getMyClients: protectedProcedure.query",
      "createOrLinkClient: protectedProcedure",
    );

    expect(source).toContain(".from(professionalClients)");
    expect(source).toContain(
      "eq(professionalClients.professionalId, profile.id)",
    );
    expect(source).toContain(".innerJoin(users, eq(professionalClients.clientId, users.id))");
    expect(source).toContain("legacyRows");
    expect(source).toContain("await ensureProfessionalClientLink(db, profile, row.id)");
    expect(source.indexOf("const clientRows")).toBeLessThan(
      source.indexOf("const allPrescriptions"),
    );
  });

  it("assignPrescription validates canonical link with legacy fallback", () => {
    const source = block(
      readSource("server/routers/storefront/nutri/procedures/prescription.ts"),
      "async function assertClientBelongsToProfile",
      "async function assertPrescriptionBelongsToProfile",
    );

    expect(source).toContain(".from(professionalClients)");
    expect(source).toContain(
      "eq(professionalClients.professionalId, profile.id)",
    );
    expect(source).toContain("eq(professionalClients.clientId, clientId)");
    expect(source).toContain("eq(users.referralCode, referralCode)");
    expect(source).toContain("await db.insert(professionalClients).values");
  });

  it("deletePrescription does not remove client links or clear legacy referral", () => {
    const source = block(
      readSource("server/routers/storefront/nutri/procedures/prescription.ts"),
      "deletePrescription: protectedProcedure",
      "getPrescriptionDetails: protectedProcedure",
    );

    expect(source).toContain(
      "Deleting a prescription must not remove the professional-client link.",
    );
    expect(source).toContain(".delete(prescriptionItems)");
    expect(source).toContain(".delete(prescriptions)");
    expect(source).not.toContain(".update(users)");
    expect(source).not.toContain("referralCode: null");
    expect(source).not.toContain(".delete(professionalClients)");
  });

  it("admin getLinkedUsers prefers professional_clients with legacy fallback", () => {
    const source = block(
      readSource("server/routers/admin/nutri/nutri.ts"),
      "getLinkedUsers: adminProcedure",
      "getDetails: adminProcedure",
    );

    expect(source).toContain(".from(professionalClients)");
    expect(source).toContain(
      "eq(professionalClients.professionalId, nutri.id)",
    );
    expect(source).toContain("legacyRows");
    expect(source).toContain("rowsById");
  });

  it("invite URL uses the current environment and encodes the referral code", () => {
    const helperSource = readSource("client/src/lib/referral-invite-url.ts");
    const adminSource = readSource("client/src/pages/adminNutri/logic/useAdminNutri.ts");
    const nutriSource = readSource("client/src/pages/nutri/NutriDashboardView.tsx");
    const routesSource = readSource("client/src/app/logic/routesConfig.tsx");

    expect(helperSource).toContain("window.location.origin");
    expect(helperSource).toContain("encodeURIComponent(referralCode)");
    expect(helperSource).toContain("/convite/");
    expect(adminSource).toContain("buildReferralInviteUrl(referralCode)");
    expect(adminSource).not.toContain("https://gourmetsaudavel.com/convite");
    expect(nutriSource).toContain("buildReferralInviteUrl(profile.referralCode)");
    expect(routesSource).toContain("/convite/:referralCode");
  });
});
