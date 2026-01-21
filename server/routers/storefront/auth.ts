import { router, publicProcedure, protectedProcedure } from "./../../_core/trpc.js";
import { z } from "zod";
import { hash, verify } from "@node-rs/argon2";
import { eq, and, gt } from "drizzle-orm";
import { authUsers, users } from "../../../drizzle/schema/index.js";
import { getDb } from "../../db.js";
import { TRPCError } from "@trpc/server";
import { lucia, promoteCart } from "../../auth.js"; 
import { decrypt, encrypt, piiHash, normalizeDigits } from "../../encryption.js"; 
import crypto from "node:crypto";

// --- HELPERS ---
function unseal(val: any): string {
  if (!val) return "";
  try {
    const str = String(val);
    if (str.split(':').length !== 3) return str;
    const decrypted = decrypt(str);
    return decrypted || str;
  } catch { 
    return String(val); 
  }
}

export const authRouter = router({
  
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user || !ctx.session) return null;
    try {
      const db = await getDb();
      const profile = await db.query.users.findFirst({ 
        where: eq(users.id, ctx.user.id) 
      });
      if (!profile) return ctx.user;

      return { 
        ...ctx.user, 
        name: unseal(profile.name), 
        customerDocument: unseal(profile.customerDocument), 
        phone: unseal(profile.phone),
        email: profile.email,
        role: profile.role || (ctx.user as any).role || 'user'
      };
    } catch (error) {
      return ctx.user;
    }
  }),

  login: publicProcedure
    .input(z.object({ 
      identifier: z.string().email(), 
      password: z.string(), 
      guestSessionId: z.string().nullish() 
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const [existingAuth] = await db.select().from(authUsers)
        .where(eq(authUsers.email, input.identifier.toLowerCase())).limit(1);

      if (!existingAuth) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });

      const validPassword = await verify(existingAuth.password, input.password);
      if (!validPassword) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });

      const session = await lucia.createSession(existingAuth.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      if (ctx.res) ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());

      // Merge de carrinho em background para não atrasar o login
      if (input.guestSessionId) {
        promoteCart(input.guestSessionId, existingAuth.id).catch(console.error);
      }
      
      return { success: true };
    }),

  register: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      cpf: z.string().transform(v => v.replace(/\D/g, "")),
      whatsapp: z.string().optional().nullish(),
      guestSessionId: z.string().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      const documentHash = piiHash(input.cpf);
      const nameIndex = piiHash(input.name.toLowerCase());

      if (!documentHash || !nameIndex) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro de segurança." });
      }

      // Validações antecipadas (Leituras não travam o banco)
      const [existingCpf] = await db.select().from(users).where(eq(users.documentIndex, documentHash)).limit(1);
      if (existingCpf) throw new TRPCError({ code: "BAD_REQUEST", message: "Este CPF já está cadastrado." });

      const [existingEmail] = await db.select().from(authUsers).where(eq(authUsers.email, input.email.toLowerCase())).limit(1);
      if (existingEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "Este e-mail já está em uso." });

      const hashedPassword = await hash(input.password);
      const unifiedId = crypto.randomUUID(); 
      const cleanPhone = input.whatsapp ? normalizeDigits(input.whatsapp) : null;

      try {
        // --- 🟢 TRANSAÇÃO CURTA (Apenas escrita) ---
        await db.transaction(async (tx) => {
          await tx.insert(users).values({
            id: unifiedId, 
            email: input.email.toLowerCase(),
            name: encrypt(input.name),
            customerDocument: encrypt(input.cpf),
            phone: cleanPhone ? encrypt(cleanPhone) : null,
            nameIndex: nameIndex,
            documentIndex: documentHash,
            phoneIndex: cleanPhone ? piiHash(cleanPhone) : null,
            role: "user",
            loyaltyBalance: 0,
          } as any);

          await tx.insert(authUsers).values({
            id: unifiedId,
            email: input.email.toLowerCase(),
            password: hashedPassword,
            role: "user",
            loyaltyBalance: "0.00",
          } as any);
        });

        // --- 🔵 OPERAÇÕES PÓS-TRANSAÇÃO (Não bloqueantes) ---
        const session = await lucia.createSession(unifiedId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        if (ctx.res) ctx.res.appendHeader("Set-Cookie", sessionCookie.serialize());

        // Merge de carrinho (Assíncrono)
        if (input.guestSessionId) {
          promoteCart(input.guestSessionId, unifiedId).catch(err => 
            console.error("❌ Erro no promoteCart background:", err)
          );
        }

        // E-mail de Boas-vindas (Background Task)
        import("../lib/mailer.js").then(({ mailer }) => {
          mailer.sendWelcomeEmail(input.email, input.name).catch(err => 
            console.error("❌ Erro envio e-mail background:", err)
          );
        }).catch(() => {});

        return { success: true };

      } catch (error: any) {
        if (error.message.includes("Lock wait timeout")) {
          throw new TRPCError({ code: "TIMEOUT", message: "Servidor ocupado. Tente novamente." });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar conta." });
      }
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [userAuth] = await db.select().from(authUsers)
        .where(eq(authUsers.email, input.email.toLowerCase())).limit(1);
      
      if (!userAuth) return { success: true }; 

      const [profile] = await db.select().from(users).where(eq(users.id, userAuth.id)).limit(1);
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000);

      await db.update(authUsers)
        .set({ resetToken: token, resetExpires: expires } as any)
        .where(eq(authUsers.id, userAuth.id));

      const baseUrl = process.env.VITE_APP_URL || "http://localhost:5173";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      const name = profile ? unseal(profile.name) : "Cliente";

      // Envio de e-mail sem travar a resposta
      import("../lib/mailer.js").then(({ mailer }) => {
        mailer.sendPasswordReset(userAuth.email, name, resetLink).catch(console.error);
      }).catch(console.error);

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), password: z.string().min(6) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [userAuth] = await db.select().from(authUsers)
        .where(and(
          eq(authUsers.resetToken as any, input.token),
          gt(authUsers.resetExpires as any, new Date())
        )).limit(1);

      if (!userAuth) throw new TRPCError({ code: "BAD_REQUEST", message: "Link inválido." });

      const hashedPassword = await hash(input.password);
      await db.update(authUsers)
        .set({ password: hashedPassword, resetToken: null, resetExpires: null } as any)
        .where(eq(authUsers.id, userAuth.id));

      return { success: true };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session) await lucia.invalidateSession(ctx.session.id);
    const blankCookie = lucia.createBlankSessionCookie();
    if (ctx.res) ctx.res.appendHeader("Set-Cookie", blankCookie.serialize());
    return { success: true };
  }),
});