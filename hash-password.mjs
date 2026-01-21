// hash-password.mjs
import crypto from "crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

const password = process.argv[2];

if (!password) {
  console.log("Use: node hash-password.mjs SUA_SENHA");
  process.exit(1);
}

const hashed = hashPassword(password);
console.log("\nHash gerado:\n");
console.log(hashed);
console.log("\nCole esse valor no campo password do usuário.\n");
process.exit(0);