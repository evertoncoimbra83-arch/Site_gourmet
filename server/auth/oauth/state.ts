import crypto from "node:crypto";

/**
 * Gera um State aleatório de alta segurança contra CSRF.
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}
