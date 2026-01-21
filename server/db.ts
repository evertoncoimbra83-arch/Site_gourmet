import "dotenv/config";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import * as schema from "../drizzle/schema"; 
import { users, user_profiles } from "../drizzle/schema";

// =========================================================
// 1. CONFIGURAÇÃO E CONEXÃO (Singleton)
// =========================================================

// Tipagem explícita para evitar o erro "Property 'users' does not exist"
type DrizzleDB = MySql2Database<typeof schema>;

let dbInstance: DrizzleDB | undefined;
let pool: mysql.Pool | undefined;

export async function getDb(): Promise<DrizzleDB> {
  if (dbInstance) return dbInstance;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não encontrada no .env");
  }

  try {
    if (!pool) {
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
      });
    }

    // Inicializa o Drizzle com o schema injetado
    dbInstance = drizzle(pool, { schema, mode: "default" });
    
    console.log("✅ Database Pool Initialized (MySQL)");
    return dbInstance;
  } catch (error) {
    console.error("❌ Falha ao conectar no banco de dados:", error);
    throw error;
  }
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
};

/**
 * Atualiza ou insere um usuário baseado no openId.
 * Ajustado para IDs em formato String (UUID/Lucia).
 */
export async function upsertUser(input: UpsertUserInput) {
  const db = await getDb();

  if (!input?.openId?.trim()) {
    console.warn("[Database] upsertUser chamado sem openId válido.");
    return null;
  }

  const openId = input.openId.trim();

  // 1. Verifica existência
  const existing = await db.query.users.findFirst({
    where: eq(users.openId, openId)
  });

  if (existing) {
    // 2. UPDATE
    await db.update(users)
      .set({
        name: input.name ?? existing.name,
        email: input.email?.toLowerCase() ?? existing.email,
        loginMethod: input.loginMethod ?? existing.loginMethod,
        lastSignedIn: new Date(),
      })
      .where(eq(users.id, existing.id));
    
    return existing;
  }

  // 3. INSERT (Novo Usuário)
  // Geramos o ID string manualmente antes do insert, pois MySQL não suporta .returning() para UUIDs
  const newId = generateIdFromEntropySize(15);
  
  const newUserValues = {
    id: newId,
    openId,
    name: input.name ?? null,
    email: input.email?.toLowerCase() ?? null,
    loginMethod: input.loginMethod ?? "external",
    role: (input.role as "admin" | "user") ?? "user",
    lastSignedIn: new Date(),
    loyaltyBalance: 0,
  };

  await db.insert(users).values(newUserValues);
  
  return newUserValues;
}

/**
 * Busca usuário completo por openId (incluindo perfil).
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();

  // O db.query já lida com o schema injetado, resolvendo o erro de tipagem '{}'
  const result = await db.query.users.findFirst({
    where: eq(users.openId, openId),
    with: {
      profile: true // Requer que a relação 'profile' esteja definida no schema/users.ts
    }
  });

  return result;
}