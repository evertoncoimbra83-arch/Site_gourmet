import { eq } from "drizzle-orm";
import { getDb } from "./db";
// ✅ Apenas importando a tabela principal users (que inclui login e senha)
import { users } from "../drizzle/schema/index"; 
import { hash } from "@node-rs/argon2";
import crypto from "node:crypto";
import { encrypt, piiHash } from "./encryption";

/**
 * Cria um usuário persistindo tudo na tabela 'users'
 * (Como agora os campos auth e profile foram unificados)
 */
export async function createUserWithPassword(email: string, passwordPlain: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const unifiedId = crypto.randomUUID();
  const hashedPassword = await hash(passwordPlain);
  const normalizedEmail = email.toLowerCase().trim();
  const rawName = name || email.split('@')[0];

  try {
    // 1. Criar tudo unificado na tabela users 
    // O Drizzle infere os tipos de users.$inferInsert sem precisar de any
    await db.insert(users).values({
      id: unifiedId,
      email: normalizedEmail,
      password: hashedPassword,
      name: encrypt(rawName.trim()),
      nameIndex: piiHash(rawName.toLowerCase().trim()),
      role: "user",
      loginMethod: "password",
      needsPasswordReset: 0,
      availablePoints: 0, 
    });

    return await db.query.users.findFirst({ 
      where: eq(users.id, unifiedId) 
    });
    
  } catch (error) {
    // ✅ FIX: Tratamento de erro sem 'any' para satisfazer o ESLint
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro ao criar usuário persistente:", message);
    throw new Error("Falha ao criar conta. Verifique se o e-mail já está em uso.");
  }
}

export async function getFirstAdmin() {
  const db = await getDb();
  if (!db) return null;

  return await db.query.users.findFirst({
    where: eq(users.role, "admin"),
  });
}