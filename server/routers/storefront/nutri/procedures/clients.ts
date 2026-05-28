import { protectedProcedure } from "../../../../../server/_core/trpc.js";
import { getDb } from "../../../../../server/db.js";
import { 
  nutriProfiles, 
  users,
  prescriptions,
  auditLogs
} from "../../../../../drizzle/schema/index.js"; 
import { eq, desc, inArray } from "drizzle-orm"; 
import { decrypt, encrypt, piiHash, normalizeDigits } from "../../../../../server/encryption.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const clientProcedures = {
  /**
   * Obtém a lista de pacientes vinculados ao nutricionista logado
   * Retorna até as últimas prescrições para preencher os slots da UI.
   */
  getMyClients: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      
      // 1. Busca o perfil do nutricionista
      const profile = await db.query.nutriProfiles.findFirst({
        where: eq(nutriProfiles.userId, ctx.user.id)
      });
      
      if (!profile?.referralCode) return [];

      const nutriCode = profile.referralCode.trim();

      // 2. Busca os pacientes vinculados
      const clientRows = await db.query.users.findMany({
        where: eq(users.referralCode, nutriCode),
      });

      if (!clientRows.length) return [];

      const clientIds = clientRows.map(c => c.id);

      // 3. Busca TODAS as prescrições
      const allPrescriptions = await db
        .select({
          id: prescriptions.id,
          clientId: prescriptions.clientId,
          planName: prescriptions.planName,
          totalKcalTarget: prescriptions.totalKcalTarget,
          createdAt: prescriptions.createdAt,
          status: prescriptions.status,
        })
        .from(prescriptions)
        .where(inArray(prescriptions.clientId, clientIds))
        .orderBy(desc(prescriptions.createdAt));

      // 4. Montagem do objeto enriquecido
      return clientRows.map((row) => {
        let clientDisplayName = "Paciente";
        let decryptedPhone = "";
        
        try {
          clientDisplayName = decrypt(row.name) || row.email.split('@')[0];
        } catch { 
          clientDisplayName = row.email?.split('@')[0] || "Usuário";
        }

        try {
          decryptedPhone = decrypt(row.phone) || "";
        } catch {
          decryptedPhone = "";
        }

        const clientPrescriptions = allPrescriptions
          .filter(p => String(p.clientId) === String(row.id))
          .slice(0, 4);

        return {
          id: row.id,
          client: { 
            id: row.id,
            name: clientDisplayName, 
            email: row.email,
            phone: decryptedPhone
          },
          prescriptions: clientPrescriptions
        };
      });

    } catch (error: unknown) { 
       const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
       console.error("🔴 ERRO getMyClients:", errorMessage);
       
       throw new TRPCError({ 
         code: "INTERNAL_SERVER_ERROR", 
         message: "Erro ao buscar lista de pacientes." 
       });
    }
  }),

  /**
   * Cria ou vincula um paciente de forma silenciosa e segura
   */
  createOrLinkClient: protectedProcedure
    .input(z.object({
      name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
      phone: z.string().min(8, "O telefone deve ter pelo menos 8 dígitos"),
      email: z.string().email("E-mail inválido").optional().nullable(),
      forceTransfer: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        
        // 1. Busca o perfil do nutricionista
        const profile = await db.query.nutriProfiles.findFirst({
          where: eq(nutriProfiles.userId, ctx.user.id)
        });
        
        if (!profile?.referralCode) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Você precisa ter um perfil profissional e código de indicação ativos."
          });
        }

        const nutriCode = profile.referralCode.trim();
        const normalizedPhone = normalizeDigits(input.phone);
        const phoneIndexHash = piiHash(normalizedPhone);

        if (!phoneIndexHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Telefone inválido."
          });
        }

        // 2. Busca unificada de paciente (por phoneIndex ou por e-mail final)
        const finalEmail = input.email && input.email.trim() !== ""
          ? input.email.toLowerCase().trim()
          : `paciente-${normalizedPhone}@gourmetsaudavel.temp`;

        let targetUser = await db.query.users.findFirst({
          where: eq(users.phoneIndex, phoneIndexHash)
        });

        if (!targetUser) {
          targetUser = await db.query.users.findFirst({
            where: eq(users.email, finalEmail)
          });
        }

        if (targetUser) {
          const clientReferral = targetUser.referralCode?.trim() || "";
          
          // Caso A: Já está vinculado a este mesmo nutricionista
          if (clientReferral === nutriCode) {
            return {
              status: "ALREADY_LINKED" as const,
              client: {
                id: targetUser.id,
                name: input.name,
                email: targetUser.email
              }
            };
          }

          // Caso B: Está vinculado a outro nutricionista
          if (clientReferral && clientReferral !== "") {
            if (!input.forceTransfer) {
              let decryptedName = "";
              try {
                decryptedName = decrypt(targetUser.name) || "";
              } catch {
                decryptedName = targetUser.email.split("@")[0];
              }

              return {
                status: "REQUIRES_CONFIRMATION" as const,
                client: {
                  id: targetUser.id,
                  name: decryptedName || targetUser.email.split("@")[0],
                  email: targetUser.email,
                  currentReferral: clientReferral
                }
              };
            }

            // Realiza a transferência de vínculo intencional e auditada
            await db.transaction(async (tx) => {
              // Atualiza referralCode do paciente
              await tx.update(users)
                .set({ referralCode: nutriCode })
                .where(eq(users.id, targetUser.id));

              // Registra na tabela audit_logs
              await tx.insert(auditLogs).values({
                userId: ctx.user.id,
                action: "PATIENT_TRANSFER",
                entity: "users",
                entityId: targetUser.id,
                oldValues: JSON.stringify({ referralCode: clientReferral }),
                newValues: JSON.stringify({ referralCode: nutriCode }),
              });
            });

            return {
              status: "LINKED" as const,
              client: {
                id: targetUser.id,
                name: input.name,
                email: targetUser.email
              }
            };
          }

          // Caso C: Existe, mas não tem vínculo (referralCode nulo/em branco)
          await db.update(users)
            .set({ referralCode: nutriCode })
            .where(eq(users.id, targetUser.id));

          return {
            status: "LINKED" as const,
            client: {
              id: targetUser.id,
              name: input.name,
              email: targetUser.email
            }
          };
        }

        // 3. Caso não exista: Cria nova conta silenciosa com email fallback
        const newUserId = uuidv4();
        await db.insert(users).values({
          id: newUserId,
          email: finalEmail,
          name: encrypt(input.name.trim()),
          phone: encrypt(normalizedPhone),
          phoneIndex: phoneIndexHash,
          nameIndex: input.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(),
          role: "user",
          loginMethod: "placeholder_email",
          referralCode: nutriCode,
          availablePoints: 0,
          aiCredits: 2
        });

        return {
          status: "CREATED" as const,
          client: {
            id: newUserId,
            name: input.name,
            email: finalEmail
          }
        };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("🔴 ERRO createOrLinkClient:", errorMessage);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage || "Erro ao processar criação de paciente."
        });
      }
    })
};