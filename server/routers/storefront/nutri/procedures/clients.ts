import { protectedProcedure } from "../../../../../server/_core/trpc.js";
import { getDb } from "../../../../../server/db.js";
import {
  auditLogs,
  nutriProfiles,
  prescriptions,
  professionalClients,
  users,
} from "../../../../../drizzle/schema/index.js";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  decrypt,
  encrypt,
  normalizeDigits,
  piiHash,
} from "../../../../../server/encryption.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

type DbType = Awaited<ReturnType<typeof getDb>>;
type NutriProfile = typeof nutriProfiles.$inferSelect;

async function ensureProfessionalClientLink(
  db: DbType,
  profile: NutriProfile,
  clientId: string,
) {
  const [existingLink] = await db
    .select({ id: professionalClients.id, status: professionalClients.status })
    .from(professionalClients)
    .where(
      and(
        eq(professionalClients.professionalId, profile.id),
        eq(professionalClients.clientId, clientId),
      ),
    )
    .limit(1);

  if (existingLink) {
    if (existingLink.status !== "active") {
      await db
        .update(professionalClients)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(professionalClients.id, existingLink.id));
    }
    return existingLink.id;
  }

  const linkId = uuidv4();
  await db.insert(professionalClients).values({
    id: linkId,
    professionalId: profile.id,
    clientId,
    status: "active",
  });
  return linkId;
}

export const clientProcedures = {
  /**
   * Obtem a lista de pacientes vinculados ao nutricionista logado.
   * professional_clients e a fonte canonica; users.referral_code e fallback legado.
   */
  getMyClients: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();

      const profile = await db.query.nutriProfiles.findFirst({
        where: eq(nutriProfiles.userId, ctx.user.id),
      });

      if (!profile) return [];

      const canonicalRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        })
        .from(professionalClients)
        .innerJoin(users, eq(professionalClients.clientId, users.id))
        .where(eq(professionalClients.professionalId, profile.id));

      const clientMap = new Map<string, (typeof canonicalRows)[number]>();
      canonicalRows.forEach((row) => clientMap.set(row.id, row));

      const referralCode = profile.referralCode?.trim();
      if (referralCode) {
        const legacyRows = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
          })
          .from(users)
          .where(eq(users.referralCode, referralCode));

        for (const row of legacyRows) {
          if (!clientMap.has(row.id)) {
            clientMap.set(row.id, row);
            await ensureProfessionalClientLink(db, profile, row.id);
          }
        }
      }

      const clientRows = Array.from(clientMap.values());
      if (!clientRows.length) return [];

      const clientIds = clientRows.map((client) => client.id);
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

      return clientRows.map((row) => {
        let clientDisplayName = "Paciente";
        let decryptedPhone = "";

        try {
          clientDisplayName = decrypt(row.name) || row.email.split("@")[0];
        } catch {
          clientDisplayName = row.email?.split("@")[0] || "Usuario";
        }

        try {
          decryptedPhone = decrypt(row.phone) || "";
        } catch {
          decryptedPhone = "";
        }

        const clientPrescriptions = allPrescriptions
          .filter((prescription) => String(prescription.clientId) === String(row.id))
          .slice(0, 4);

        return {
          id: row.id,
          client: {
            id: row.id,
            name: clientDisplayName,
            email: row.email,
            phone: decryptedPhone,
          },
          prescriptions: clientPrescriptions,
        };
      });
    } catch (error: unknown) {
      if (error instanceof TRPCError) throw error;

      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("ERRO getMyClients:", errorMessage);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar lista de pacientes.",
      });
    }
  }),

  /**
   * Cria ou vincula um paciente de forma silenciosa e segura.
   */
  createOrLinkClient: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
        phone: z.string().min(8, "O telefone deve ter pelo menos 8 digitos"),
        email: z.string().email("E-mail invalido").optional().nullable(),
        forceTransfer: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();

        const profile = await db.query.nutriProfiles.findFirst({
          where: eq(nutriProfiles.userId, ctx.user.id),
        });

        if (!profile?.referralCode) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Voce precisa ter um perfil profissional e codigo de indicacao ativos.",
          });
        }

        const nutriCode = profile.referralCode.trim();
        const normalizedPhone = normalizeDigits(input.phone);
        const phoneIndexHash = piiHash(normalizedPhone);

        if (!phoneIndexHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Telefone invalido.",
          });
        }

        const finalEmail =
          input.email && input.email.trim() !== ""
            ? input.email.toLowerCase().trim()
            : `paciente-${normalizedPhone}@gourmetsaudavel.temp`;

        let targetUser = await db.query.users.findFirst({
          where: eq(users.phoneIndex, phoneIndexHash),
        });

        if (!targetUser) {
          targetUser = await db.query.users.findFirst({
            where: eq(users.email, finalEmail),
          });
        }

        if (targetUser) {
          const clientReferral = targetUser.referralCode?.trim() || "";
          const [existingCanonicalLink] = await db
            .select({ id: professionalClients.id })
            .from(professionalClients)
            .where(
              and(
                eq(professionalClients.professionalId, profile.id),
                eq(professionalClients.clientId, targetUser.id),
              ),
            )
            .limit(1);

          if (existingCanonicalLink || clientReferral === nutriCode) {
            await ensureProfessionalClientLink(db, profile, targetUser.id);
            if (clientReferral !== nutriCode) {
              await db
                .update(users)
                .set({ referralCode: nutriCode })
                .where(eq(users.id, targetUser.id));
            }

            return {
              status: "ALREADY_LINKED" as const,
              client: {
                id: targetUser.id,
                name: input.name,
                email: targetUser.email,
              },
            };
          }

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
                  currentReferral: clientReferral,
                },
              };
            }

            await db.transaction(async (tx) => {
              await tx
                .update(users)
                .set({ referralCode: nutriCode })
                .where(eq(users.id, targetUser.id));

              await tx.insert(auditLogs).values({
                userId: ctx.user.id,
                action: "PATIENT_TRANSFER",
                entity: "users",
                entityId: targetUser.id,
                oldValues: JSON.stringify({ referralCode: clientReferral }),
                newValues: JSON.stringify({ referralCode: nutriCode }),
              });
            });

            await ensureProfessionalClientLink(db, profile, targetUser.id);

            return {
              status: "LINKED" as const,
              client: {
                id: targetUser.id,
                name: input.name,
                email: targetUser.email,
              },
            };
          }

          await db
            .update(users)
            .set({ referralCode: nutriCode })
            .where(eq(users.id, targetUser.id));
          await ensureProfessionalClientLink(db, profile, targetUser.id);

          return {
            status: "LINKED" as const,
            client: {
              id: targetUser.id,
              name: input.name,
              email: targetUser.email,
            },
          };
        }

        const newUserId = uuidv4();
        await db.transaction(async (tx) => {
          await tx.insert(users).values({
            id: newUserId,
            email: finalEmail,
            name: encrypt(input.name.trim()),
            phone: encrypt(normalizedPhone),
            phoneIndex: phoneIndexHash,
            nameIndex: input.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim(),
            role: "user",
            loginMethod: "placeholder_email",
            referralCode: nutriCode,
            availablePoints: 0,
            aiCredits: 2,
          });

          await tx.insert(professionalClients).values({
            id: uuidv4(),
            professionalId: profile.id,
            clientId: newUserId,
            status: "active",
          });
        });

        return {
          status: "CREATED" as const,
          client: {
            id: newUserId,
            name: input.name,
            email: finalEmail,
          },
        };
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;

        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error("ERRO createOrLinkClient:", errorMessage);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage || "Erro ao processar criacao de paciente.",
        });
      }
    }),
};
