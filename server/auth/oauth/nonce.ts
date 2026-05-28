import crypto from "node:crypto";

/**
 * Gera um Nonce criptográfico aleatório contra ataques de replay.
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}
