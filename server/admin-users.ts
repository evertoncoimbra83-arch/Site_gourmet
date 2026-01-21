import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users, user_profiles, orders, userAddresses } from "../drizzle/schema";
import { encrypt, decrypt } from "./encryption";
import { TRPCError } from "@trpc/server";
import { hash } from "@node-rs/argon2";

/**
 * 🛡️ Helper: Descriptografia segura
 */
function safeDecrypt(value: unknown): string | null {
  if (!value) return null;
  try {
    const rawValue = Buffer.isBuffer(value) ? value.toString('utf-8') : String(value);
    if (!rawValue.includes(":")) return rawValue;
    return decrypt(rawValue) || rawValue;
  } catch (error) {
    return String(value); 
  }
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
    ? or(like(users.name, `%${searchTerm}%`), like(users.email, `%${searchTerm}%`))
    : undefined;

  const items = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      // ✅ CORREÇÃO: O erro indica que 'customerDocument' não existe em user_profiles.
      // Verifique se o nome real é 'document' ou algo similar. Removi a referência inexistente.
      docUser: users.customerDocument, 
    })
    .from(users)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(users.createdAt));

  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
  const total = Number(totalResult?.count ?? 0);

  return {
    users: items.map((row) => ({
      ...row,
      customerDocument: safeDecrypt(row.docUser),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ========================================================================
// 2. DETALHES DO USUÁRIO
// ========================================================================

export async function getUserDetails(userId: string) { // ✅ Alterado para string
  const db = await getDb();

  const [baseUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!baseUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

  const [profile] = await db.select().from(user_profiles).where(eq(user_profiles.userId, userId)).limit(1);

  // ✅ CORREÇÃO: Mapeando apenas campos que o TS confirmou que existem no profile
  const decryptedProfile = {
    userId,
    // totalSpent no seu banco é String/Decimal
    totalSpent: profile?.totalSpent ?? "0.00",
    // Fallbacks para campos que não existem em 'profile' segundo o erro
    customerDocument: safeDecrypt(baseUser.customerDocument),
    city: safeDecrypt(profile?.city),
    state: safeDecrypt(profile?.state),
    zipCode: safeDecrypt(profile?.zipCode),
  };

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  return {
    user: baseUser,
    profile: decryptedProfile,
    orders: userOrders,
  };
}

// ========================================================================
// 3. BUSCA DE ENDEREÇOS
// ========================================================================

export async function listUserAddresses(userId: string) { // ✅ Alterado para string
  const db = await getDb();
  const rows = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId));

  return rows.map((addr: any) => ({
    ...addr,
    // ✅ CORREÇÃO: Removido 'addr.address' pois o erro diz que não existe
    street: safeDecrypt(addr.street), 
    number: safeDecrypt(addr.number),
    neighborhood: safeDecrypt(addr.neighborhood),
    city: safeDecrypt(addr.city),
    zipCode: safeDecrypt(addr.zipCode),
  }));
}

// ========================================================================
// 4. ATUALIZAÇÃO DO PERFIL
// ========================================================================

export async function updateUserProfile(
  userId: string, // ✅ Alterado para string
  data: any
) {
  const db = await getDb();

  if (data.name) {
    await db.update(users).set({ name: data.name }).where(eq(users.id, userId));
  }

  const profileData: any = {
    city: data.city ? encrypt(data.city) : undefined,
    state: data.state ? encrypt(data.state) : undefined,
    zipCode: data.zipCode ? encrypt(data.zipCode) : undefined,
    updated_at: new Date(), // ✅ Usando snake_case conforme seu schema
  };

  const [existing] = await db.select().from(user_profiles).where(eq(user_profiles.userId, userId)).limit(1);

  if (existing) {
    await db.update(user_profiles).set(profileData).where(eq(user_profiles.userId, userId));
  } else {
    await db.insert(user_profiles).values({
      id: crypto.randomUUID(), // ✅ Adicionado ID manual (string)
      userId,
      ...profileData,
      totalSpent: "0.00",
    });
  }

  return { success: true };
}

// ========================================================================
// 5. CRIAÇÃO DE USUÁRIO
// ========================================================================

export async function createUserWithProfile(input: any) {
  const db = await getDb();
  const hashedPassword = await hash(input.password);
  const newUserId = crypto.randomUUID(); // ✅ Gerando ID string

  await db.insert(users).values({
    id: newUserId,
    email: input.email,
    name: input.name,
    role: input.role || "user",
    password: hashedPassword,
    loginMethod: "password",
  });

  await db.insert(user_profiles).values({
    id: crypto.randomUUID(),
    userId: newUserId,
    totalSpent: "0.00",
  });

  return { id: newUserId };
}