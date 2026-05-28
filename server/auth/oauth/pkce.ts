import crypto from "node:crypto";

/**
 * Gera um Code Verifier PKCE aleatório e de alta entropia.
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Gera um Code Challenge PKCE SHA-256 a partir de um Code Verifier.
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}
