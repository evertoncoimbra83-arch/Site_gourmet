import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { users } from "./../drizzle/schema.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid"; 

export async function createUserWithPassword(email: string, passwordPlain: string, name?: string) {
  const db = await getDb();
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  const newUser = {
    email,
    password: hashedPassword,
    name: name || email.split('@')[0],
    role: "user",
    openId: uuidv4(), // ✅ Isso evita o erro 500 no banco
  };

  await db.insert(users).values(newUser);
  return await db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function getFirstAdmin() {
  const db = await getDb();
  return await db.query.users.findFirst({
    where: eq(users.role, "admin"),
  });
}