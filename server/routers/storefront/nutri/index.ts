// server/routers/storefront/nutri/index.ts

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../../../_core/trpc.js";
import { profileProcedures } from "./procedures/profile.js";
import { clientProcedures } from "./procedures/clients.js";
import { prescriptionProcedures } from "./procedures/prescription.js"; 
import { templateProcedures } from "./procedures/nutri_templates.js";
import { myPrescriptionProcedures } from "./myPrescription.js"; 
import { TRPCError } from "@trpc/server";
import { getDb } from "../../../db.js";
import { nutriScansTemp, users, nutriProfiles, userAddresses } from "../../../../drizzle/schema/index.js"; 
import { eq, desc, and } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import crypto from "crypto";
import { encrypt } from "../../../../server/encryption.js";

// Interface para tratar erros de banco de dados de forma tipada
interface DatabaseError {
  message?: string;
  code?: string;
}

export const nutriRouter = router({
  // ✅ Injeção de procedimentos modulares
  ...profileProcedures,
  ...clientProcedures,
  ...templateProcedures,
  ...prescriptionProcedures,
  ...myPrescriptionProcedures, 

  /**
   * ✅ REGISTRO DE NUTRICIONISTA (Blindado)
   * Realiza o cadastro de usuário, perfil profissional e endereços de consultório.
   */
  registerPublicProfile: publicProcedure
    .input(z.object({
      name: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(6),
      document: z.string(),
      phone: z.string(),
      crn: z.string().min(4),
      specialty: z.string().optional(),
      bio: z.string().optional(),
      offices: z.array(z.object({
        label: z.string(),
        zipCode: z.string(),
        street: z.string(),
        number: z.string(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
        complement: z.string().optional(),
        isDefault: z.boolean()
      })).optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database offline" });

      try {
        // 1. Hash seguro com Argon2
        const hashedPassword = await hash(input.password.trim());
        const userId = crypto.randomUUID();

        // 2. Inserir Usuário com criptografia de dados sensíveis (PII)
        await db.insert(users).values({
          id: userId,
          name: encrypt(input.name.trim()), 
          email: input.email.toLowerCase().trim(),
          password: hashedPassword, 
          role: 'nutri',
          updatedAt: new Date()
        });

        // 3. Inserir Perfil Profissional (CRN e Bio)
        await db.insert(nutriProfiles).values({
          id: crypto.randomUUID(),
          userId: userId,
          crn: input.crn.trim(),
          specialty: input.specialty || "Geral",
          bio: input.bio || "",
          referralCode: input.name.split(' ')[0].toLowerCase() + Math.floor(1000 + Math.random() * 9000),
          isActive: true 
        });

        // 4. Inserir Endereços de Consultório (Criptografados)
        if (input.offices && input.offices.length > 0) {
          const officesToInsert = input.offices.map(off => ({
            id: crypto.randomUUID(),
            userId: userId,
            label: encrypt(off.label),
            zipCode: encrypt(off.zipCode),
            street: encrypt(off.street),
            number: encrypt(off.number),
            neighborhood: encrypt(off.neighborhood),
            city: encrypt(off.city),
            state: encrypt(off.state),
            complement: off.complement ? encrypt(off.complement) : null,
            isDefault: off.isDefault,
            createdAt: new Date(),
            updatedAt: new Date()
          }));
          await db.insert(userAddresses).values(officesToInsert);
        }

        return { success: true, userId };

      } catch (error: unknown) {
        const dbError = error as DatabaseError;
        
        // Captura erro de duplicidade (E-mail ou Documento)
        if (dbError.message?.includes('Duplicate entry') || dbError.code === 'ER_DUP_ENTRY') {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "Este e-mail ou documento já está registrado no sistema." 
          });
        }

        console.error("❌ Erro Crítico no Registro de Nutri:", dbError);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Ocorreu um erro ao processar o seu cadastro." 
        });
      }
    }),

  /**
   * ✅ DASHBOARD DE SCANS (Privado)
   * Retorna os últimos scans de IA realizados pelo nutricionista logado.
   */
  getNutriScans: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const scans = await db.select()
        .from(nutriScansTemp)
        .where(eq(nutriScansTemp.userId, ctx.user.id))
        .orderBy(desc(nutriScansTemp.createdAt))
        .limit(10);
        
      return scans.map(s => ({ 
        id: s.id, 
        status: s.status, 
        createdAt: s.createdAt, 
        suggestedData: s.suggestedData 
      }));
    }),

  /**
   * ✅ BUSCA RESULTADO ESPECÍFICO DE IA
   * Valida se a análise pertence ao usuário que está solicitando.
   */
  getScanResult: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const [result] = await db.select()
        .from(nutriScansTemp)
        .where(
          and(
            eq(nutriScansTemp.id, input.id), 
            eq(nutriScansTemp.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Análise não encontrada." });
      return result;
    }),

  /**
   * ✅ LIMPEZA DE SCANS EXPIRADOS
   */
  clearExpiredScans: protectedProcedure.mutation(async () => {
    // Implementar lógica de expiração baseada em nutriScansTemp.expiresAt se necessário
    return { success: true };
  }),
});

export default nutriRouter;