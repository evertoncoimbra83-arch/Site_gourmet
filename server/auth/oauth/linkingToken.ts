import crypto from "crypto";

const TEST_LINKING_SECRET = "test-only-oauth-linking-secret";

export interface LinkingTokenPayload {
  userId: string;
  provider: string;
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  expiresAt: number;
}

function getLinkingSecret(): string {
  const secret = process.env.DB_ENCRYPTION_KEY;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "test") {
    return TEST_LINKING_SECRET;
  }

  throw new Error(
    "DB_ENCRYPTION_KEY is required for OAuth account linking tokens.",
  );
}

function createSignature(data: string): string {
  return crypto
    .createHmac("sha256", getLinkingSecret())
    .update(data)
    .digest("hex");
}

function signaturesMatch(signature: string, expectedSignature: string): boolean {
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function signLinkingToken(payload: LinkingTokenPayload): string {
  const data = JSON.stringify(payload);
  const signature = createSignature(data);
  return Buffer.from(JSON.stringify({ data, signature })).toString("base64");
}

export function verifyLinkingToken(token: string): LinkingTokenPayload | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const { data, signature } = JSON.parse(raw);
    if (typeof data !== "string" || typeof signature !== "string") {
      return null;
    }

    const expectedSignature = createSignature(data);
    if (!signaturesMatch(signature, expectedSignature)) {
      return null;
    }

    const payload = JSON.parse(data) as LinkingTokenPayload;
    if (payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
