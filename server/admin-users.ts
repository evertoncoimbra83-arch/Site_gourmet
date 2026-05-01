import { desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users, user_profiles, orders } from "../drizzle/schema";
import { encrypt, decrypt } from "./encryption";
import { TRPCError } from "@trpc/server";
import { hash } from "@node-rs/argon2";
import crypto from "crypto";

/**
 * 🛡️ Helper: Descriptografia segura
 */
function safeDecrypt(value: unknown): string | null {
  if (!value) return null;
  try {
    const rawValue = Buffer.isBuffer(value) ? value.toString('utf-8') : String(value);
    if (!rawValue || !rawValue.includes(":")) return rawValue;
    return decrypt(rawValue) || rawValue;
  } catch {
    // ✅ Removido 'error' não utilizado
    return String(value); 
  }
}

// ✅ Interfaces para remover o 'any'
interface UserUpdateInput {
  name?: string;
  customerDocument?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  professional_title?: string;
}

interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: "admin" | "user";
}

// ========================================================================
// 1. LISTAGEM PRINCIPAL
// ========================================================================

export async function getUsersPaginated(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  const db = await getDb();
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;

  const searchTerm = search?.trim();
  
  const whereClause = searchTerm 
    ? or(
        like(users.nameIndex, `%${searchTerm}%`), 
        like(users.email, `%${searchTerm}%`)
      )
    : undefined;

  const items = await db
    .select({
      id: users.id,
      name: users.name, 
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      docUser: users.customerDocument, 
      needsPasswordReset: users.needsPasswordReset,
    })
    .from(users)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(users.createdAt));

  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
  const total = Number(totalResult?.count ?? 0);

  return {
    items: items.map((row) => ({
      ...row,
      id: String(row.id),
      name: safeDecrypt(row.name), 
      customerDocument: safeDecrypt(row.docUser),
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}

// ========================================================================
// 2. DETALHES DO USUÁRIO
// ========================================================================

export async function getUserDetails(userId: string) {
  const db = await getDb();

  const [baseUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!baseUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

  const [profile] = await db.select().from(user_profiles).where(eq(user_profiles.userId, userId)).limit(1);

  const decryptedProfile = {
    userId,
    totalSpent: profile?.totalSpent ?? "0.00",
    customerDocument: safeDecrypt(baseUser.customerDocument),
    city: safeDecrypt(profile?.city),
    state: safeDecrypt(profile?.state),
    zipCode: safeDecrypt(profile?.zipCode),
    professional_title: profile?.professional_title,
  };

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  return {
    user: {
      ...baseUser,
      name: safeDecrypt(baseUser.name),
      customerDocument: safeDecrypt(baseUser.customerDocument),
      phone: safeDecrypt(baseUser.phone),
    },
    profile: decryptedProfile,
    orders: userOrders,
  };
}

// ========================================================================
// 3. SEGURANÇA (ALTERAR SENHA)
// ========================================================================

export async function setUserPassword(userId: string, newPw: string) {
  const db = await getDb();
  const hashedPassword = await hash(newPw);

  await db.update(users)
    .set({ 
      password: hashedPassword,
      needsPasswordReset: 0, 
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

  return { success: true };
}

// ========================================================================
// 4. ATUALIZAÇÃO DO PERFIL
// ========================================================================

export async function updateUserProfile(userId: string, data: UserUpdateInput) {
  const db = await getDb();

  // ✅ Atualização tipada para Users
  if (data.name || data.customerDocument) {
    await db.update(users).set({
      ...(data.name && { 
        name: encrypt(data.name),
        nameIndex: data.name.toUpperCase() 
      }),
      ...(data.customerDocument && { 
        customerDocument: encrypt(data.customerDocument) 
      }),
      updatedAt: new Date()
    }).where(eq(users.id, userId));
  }

  // ✅ Atualização tipada para Profiles
  const profilePayload = {
    city: data.city ? encrypt(data.city) : undefined,
    state: data.state ? encrypt(data.state) : undefined,
    zipCode: data.zipCode ? encrypt(data.zipCode) : undefined,
    professional_title: data.professional_title,
    updatedAt: new Date(),
  };

  const [existing] = await db.select().from(user_profiles).where(eq(user_profiles.userId, userId)).limit(1);

  if (existing) {
    await db.update(user_profiles).set(profilePayload).where(eq(user_profiles.userId, userId));
  } else {
    await db.insert(user_profiles).values({
      id: crypto.randomUUID(),
      userId,
      totalSpent: "0.00",
      ...profilePayload,
    });
  }

  return { success: true };
}

// ========================================================================
// 5. CRIAÇÃO DE USUÁRIO
// ========================================================================

export async function createUserWithProfile(input: CreateUserInput) {
  const db = await getDb();
  const hashedPassword = await hash(input.password);
  const newUserId = crypto.randomUUID();

  return await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: newUserId,
      email: input.email,
      name: encrypt(input.name), 
      nameIndex: input.name.toUpperCase(),
      role: input.role ?? "user",
      password: hashedPassword,
      loginMethod: "password",
      needsPasswordReset: 0,
    });

    await tx.insert(user_profiles).values({
      id: crypto.randomUUID(),
      userId: newUserId,
      totalSpent: "0.00",
    });

    return { id: newUserId };
  });
}