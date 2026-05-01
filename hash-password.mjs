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
  
  process.exit(1);
}

const hashed = hashPassword(password);



process.exit(0);