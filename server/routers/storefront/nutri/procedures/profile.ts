import { z } from "zod";
import { protectedProcedure } from "../../../../../server/_core/trpc.js"; // ✅ Removido publicProcedure
import { getDb } from "../../../../../server/db.js";
import { nutriProfiles, users, userAddresses } from "../../../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { encrypt, decrypt } from "../../../../../server/encryption.js"; // ✅ Removido piiHash

// ✅ Removidos: TRPCError (não usado nas procedures atuais) e hash (usado apenas no registro)

export const profileProcedures = {
  
  /**
   * BUSCA O PERFIL COMPLETO (Sincronizado com a tabela nutri_profiles)
   */
  getPublicProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    
    const [profile] = await db
      .select()
      .from(nutriProfiles)
      .where(eq(nutriProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile) return null;

    const [userData] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const addresses = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, ctx.user.id));

    return {
      ...profile,
      user: {
        name: userData?.name ? decrypt(userData.name) : ""
      },
      offices: addresses.map(addr => ({
        id: addr.id,
        label: addr.label ? decrypt(addr.label) : "",
        street: addr.street ? decrypt(addr.street) : "",
        number: addr.number ? decrypt(addr.number) : "",
        city: addr.city ? decrypt(addr.city) : "",
        zipCode: addr.zipCode ? decrypt(addr.zipCode) : "",
      }))
    };
  }),

  /**
   * ATUALIZAÇÃO COMPLETA
   */
  updateProfile: protectedProcedure
    .input(z.object({ 
      name: z.string().min(3),
      crn: z.string().min(4), 
      referralCode: z.string().min(3).transform(val => val.toLowerCase().replace(/\s+/g, '')),
      specialty: z.string().nullable().optional(),
      bio: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
      offices: z.array(z.object({
        label: z.string(),
        zipCode: z.string(),
        street: z.string(),
        number: z.string(),
        city: z.string()
      })).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      return await db.transaction(async (tx) => {
        // 1. Atualiza o nome (Criptografado)
        await tx.update(users)
          .set({ name: encrypt(input.name) })
          .where(eq(users.id, ctx.user.id));

        // 2. Atualiza Perfil Profissional
        await tx.update(nutriProfiles)
          .set({ 
            referralCode: input.referralCode,
            crn: input.crn,
            specialty: input.specialty,
            bio: input.bio,
            website: input.website,
            avatarUrl: input.avatarUrl,
            updatedAt: new Date() 
          })
          .where(eq(nutriProfiles.userId, ctx.user.id));

        // 3. Atualiza Endereços
        if (input.offices) {
          await tx.delete(userAddresses).where(eq(userAddresses.userId, ctx.user.id));
          
          if (input.offices.length > 0) {
            const newOffices = input.offices.map(o => ({
              id: uuidv4(),
              userId: ctx.user.id,
              label: encrypt(o.label),
              zipCode: encrypt(o.zipCode),
              street: encrypt(o.street),
              number: encrypt(o.number),
              city: encrypt(o.city),
              state: encrypt(""), 
              neighborhood: encrypt("")
            }));
            await tx.insert(userAddresses).values(newOffices);
          }
        }

        return { success: true, message: "Dados atualizados com sucesso!" };
      });
    }),
};