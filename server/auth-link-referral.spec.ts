import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readSource(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function linkReferralBlock(source: string) {
  const start = source.indexOf("linkReferral: protectedProcedure");
  const end = source.indexOf("listSessions: protectedProcedure", start);
  return source.slice(start, end);
}

describe("auth.linkReferral nutri client link contract", () => {
  it("defines the auth.linkReferral mutation expected by the invite page", () => {
    const authSource = readSource("server/routers/storefront/auth/index.ts");
    const inviteSource = readSource("client/src/pages/InviteAccept.tsx");

    expect(authSource).toContain("linkReferral: protectedProcedure");
    expect(authSource).toContain("referralCode: z");
    expect(inviteSource).toContain("authRouter.linkReferral.useMutation");
    expect(inviteSource).toContain("linkMutation.mutate({ referralCode })");
  });

  it("uses the Nutri referral source instead of the commercial user referral source", () => {
    const source = readSource("server/routers/storefront/auth/index.ts");

    expect(source).toContain("nutriProfiles.referralCode");
    expect(source).toContain("eq(nutriProfiles.referralCode, input.referralCode)");
    expect(source).not.toContain("validateReferralCode(");
  });

  it("persists the client-nutri link in both current referral stores", () => {
    const source = readSource("server/routers/storefront/auth/index.ts");

    expect(source).toContain(".update(users)");
    expect(source).toContain(".set({ referralCode: input.referralCode })");
    expect(source).toContain("tx.insert(professionalClients).values");
    expect(source).toContain("professionalId: nutri.id");
    expect(source).toContain("clientId: ctx.user.id");
  });

  it("treats duplicate relationships as idempotent instead of throwing 500", () => {
    const source = readSource("server/routers/storefront/auth/index.ts");

    expect(source).toContain("existingRelationship");
    expect(source).toContain('status: existingRelationship ? "ALREADY_LINKED" : "LINKED"');
    expect(source).toContain("if (!existingRelationship)");
  });

  it("returns controlled errors for invalid input, invalid invite and self-link", () => {
    const source = readSource("server/routers/storefront/auth/index.ts");

    expect(source).toContain('min(2, "Codigo de convite obrigatorio.")');
    expect(source).toContain('message: "Codigo de convite invalido ou inativo."');
    expect(source).toContain("nutri.userId === ctx.user.id");
    expect(source).toContain("O nutricionista nao pode aceitar o proprio convite");
  });

  it("records sanitized audit logs without raw personal data", () => {
    const source = linkReferralBlock(readSource("server/routers/storefront/auth/index.ts"));

    expect(source).toContain("REFERRAL_LINK_DENIED");
    expect(source).toContain("REFERRAL_LINKED");
    expect(source).toContain("hadReferral: Boolean(currentUser.referralCode)");
    expect(source).not.toContain("customerDocument");
    expect(source).not.toContain("password");
  });
});
