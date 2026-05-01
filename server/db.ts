// server/db.ts
import "dotenv/config";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import * as schema from "../drizzle/schema"; 
import { users } from "../drizzle/schema";

// =========================================================
// 1. CONFIGURAÇÃO E CONEXÃO (Singleton)
// =========================================================

export type DrizzleDB = MySql2Database<typeof schema>;

let dbInstance: DrizzleDB | undefined;
let pool: mysql.Pool | undefined;

export async function getDb(): Promise<DrizzleDB> {
  if (dbInstance) return dbInstance;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não encontrada no .env");
  }

  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      // ✅ FIX: Força o charset UTF8MB4 na conexão para evitar caracteres corrompidos (Mojibake)
      charset: 'utf8mb4',
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }

  dbInstance = drizzle(pool, { schema, mode: "default" });
  return dbInstance;
}

// =========================================================
// 2. FUNÇÕES AUXILIARES (USER / AUTH)
// =========================================================

type UpsertUserInput = {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: "admin" | "user" | null;
  lastSignedIn?: Date; 
};

/**
 * Atualiza ou insere um usuário baseado no openId.
 */
export async function upsertUser(input: UpsertUserInput) {
  const db = await getDb();

  if (!input?.openId?.trim()) return null;

  const openId = input.openId.trim();

  // 1. Verifica existência
  const existing = await db.query.users.findFirst({
    where: eq(users.openId, openId)
  });

  if (existing) {
    // 2. UPDATE
    const updateData = {
      name: input.name ?? existing.name,
      email: input.email?.toLowerCase() ?? existing.email ?? "", 
      loginMethod: input.loginMethod ?? existing.loginMethod,
      lastSignedIn: input.lastSignedIn ?? new Date(),
    };

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, existing.id));
    
    return { ...existing, ...updateData };
  }

  // 3. INSERT (Novo Usuário)
  const newId = generateIdFromEntropySize(15);
  
  const newUserValues: typeof users.$inferInsert = {
    id: newId,
    openId: openId,
    name: input.name ?? "Usuário",
    email: input.email?.toLowerCase() ?? "",
    loginMethod: input.loginMethod ?? "external",
    role: (input.role as "admin" | "user") ?? "user",
    lastSignedIn: input.lastSignedIn ?? new Date(),
  };

  await db.insert(users).values(newUserValues);
  
  return newUserValues;
}

/**
 * Busca usuário completo por openId (incluindo perfil).
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();

  // O uso de .query.users garante que o Drizzle utilize o mapeamento do schema.ts
  const result = await db.query.users.findFirst({
    where: eq(users.openId, openId),
    with: {
      profile: true 
    }
  });

  return result;
}