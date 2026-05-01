import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const PII_PEPPER = process.env.PII_PEPPER || "";
const HASH_NO_BANCO = "99d5d9e12d8b23d1ffcb5a7d33c6fefa73505aa7535f3517a1d19712a88e57fd";

function gerarHash(input) {
    return crypto.createHash("sha256").update(input + PII_PEPPER).digest("hex");
}

const cpfLimpo = "31574375857";
const cpfComPontos = "315.743.758-57";

console.log("\n--- 🔍 DEBUG DE HASH ---");
console.log("PII_PEPPER:", PII_PEPPER);
console.log("Gerado (Limpo): ", gerarHash(cpfLimpo));
console.log("Gerado (Sujo):  ", gerarHash(cpfComPontos));
console.log("No Banco:       ", HASH_NO_BANCO);
console.log("------------------------\n");

if (gerarHash(cpfLimpo) === HASH_NO_BANCO) console.log("✅ O banco está com o CPF LIMPO");
else if (gerarHash(cpfComPontos) === HASH_NO_BANCO) console.log("⚠️ O banco está com o CPF SUJO (com pontos)");
else console.log("❌ NENHUM BATEU! O Pepper no .env deve estar diferente.");