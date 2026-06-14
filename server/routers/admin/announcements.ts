import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import {
  announcementTargets,
  announcements,
  users,
} from "../../../drizzle/schema/index.js";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { decrypt } from "../../encryption.js";

const visibilityScopeSchema = z.enum(["all", "authenticated", "specific_users"]);

const announcementInputSchema = z.object({
  title: z.string().min(1, "Titulo e obrigatorio"),
  content: z.string().min(1, "Conteudo e obrigatorio"),
  isActive: z.boolean().default(true),
  startDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  endDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  type: z.enum(["INFO", "PROMO", "NEWS", "DELIVERY", "SYSTEM"]).default("INFO"),
  iconEmoji: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || [...val].length <= 4, {
      message: "O emoji deve ter no maximo 4 caracteres",
    }),
  visibilityScope: visibilityScopeSchema.default("all"),
  selectedUserIds: z.array(z.string().min(1)).optional().default([]),
});

function unseal(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (!str) return "";

  try {
    if (str.split(":").length !== 3) return str;
    return decrypt(str) || "";
  } catch {
    return "";
  }
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

async function validateSelectedUsers(
  db: Awaited<ReturnType<typeof getDb>>,
  ids: string[],
) {
  const selectedUserIds = uniqueIds(ids);

  if (selectedUserIds.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Selecione pelo menos um usuario para avisos especificos.",
    });
  }

  const foundUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(users.id, selectedUserIds), isNull(users.deletedAt)));

  const foundIds = new Set(foundUsers.map((user) => user.id));
  const missingIds = selectedUserIds.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Um ou mais usuarios selecionados nao existem.",
    });
  }

  return selectedUserIds;
}

async function replaceTargets(
  db: Awaited<ReturnType<typeof getDb>>,
  announcementId: string,
  userIds: string[],
) {
  await db
    .delete(announcementTargets)
    .where(eq(announcementTargets.announcementId, announcementId));

  if (userIds.length === 0) return;

  await db.insert(announcementTargets).values(
    userIds.map((userId) => ({
      id: crypto.randomUUID(),
      announcementId,
      userId,
      createdAt: new Date(),
    })),
  );
}

async function getTargetRows(
  db: Awaited<ReturnType<typeof getDb>>,
  announcementIds: string[],
) {
  if (announcementIds.length === 0) return [];

  return await db
    .select({
      announcementId: announcementTargets.announcementId,
      userId: users.id,
      email: users.email,
      name: users.name,
    })
    .from(announcementTargets)
    .innerJoin(users, eq(users.id, announcementTargets.userId))
    .where(inArray(announcementTargets.announcementId, announcementIds));
}

export const adminAnnouncementsRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    const items = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
    const targetRows = await getTargetRows(
      db,
      items.map((item) => item.id),
    );
    const targetsByAnnouncement = new Map<
      string,
      Array<{ id: string; email: string; name: string }>
    >();

    for (const row of targetRows) {
      if (!row.userId) continue;
      const current = targetsByAnnouncement.get(row.announcementId) ?? [];
      current.push({
        id: row.userId,
        email: row.email,
        name: unseal(row.name) || row.email,
      });
      targetsByAnnouncement.set(row.announcementId, current);
    }

    return items.map((item) => {
      const targetUsers = targetsByAnnouncement.get(item.id) ?? [];
      return {
        ...item,
        visibilityScope: item.visibilityScope ?? "all",
        selectedUserCount: targetUsers.length,
        targetUsers,
      };
    });
  }),

  create: adminProcedure
    .input(announcementInputSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      if (input.startDate && input.startDate < startOfToday) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de inicio nao pode ser anterior ao dia atual.",
        });
      }

      if (input.endDate && input.endDate < startOfToday) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de termino nao pode ser anterior ao dia atual.",
        });
      }

      if (input.startDate && input.endDate && input.endDate < input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de termino nao pode ser anterior a data de inicio.",
        });
      }

      const targetUserIds =
        input.visibilityScope === "specific_users"
          ? await validateSelectedUsers(db, input.selectedUserIds)
          : [];

      const id = crypto.randomUUID();
      await db.insert(announcements).values({
        id,
        title: input.title,
        content: input.content,
        isActive: input.isActive,
        startDate: input.startDate,
        endDate: input.endDate,
        type: input.type,
        iconEmoji: input.iconEmoji || null,
        visibilityScope: input.visibilityScope,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await replaceTargets(db, id, targetUserIds);
      return { success: true, id };
    }),

  update: adminProcedure
    .input(announcementInputSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [orig] = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, input.id))
        .limit(1);
      if (!orig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aviso nao encontrado.",
        });
      }

      const isStartDateChanged =
        input.startDate?.getTime() !== orig.startDate?.getTime();
      if (isStartDateChanged && input.startDate && input.startDate < startOfToday) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A nova data de inicio nao pode ser anterior ao dia atual.",
        });
      }

      if (input.endDate && input.endDate < startOfToday) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de termino nao pode ser anterior ao dia atual.",
        });
      }

      const effectiveStartDate =
        input.startDate !== undefined ? input.startDate : orig.startDate;
      if (effectiveStartDate && input.endDate && input.endDate < effectiveStartDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de termino nao pode ser anterior a data de inicio.",
        });
      }

      const targetUserIds =
        input.visibilityScope === "specific_users"
          ? await validateSelectedUsers(db, input.selectedUserIds)
          : [];

      await db
        .update(announcements)
        .set({
          title: input.title,
          content: input.content,
          isActive: input.isActive,
          startDate: input.startDate,
          endDate: input.endDate,
          type: input.type,
          iconEmoji: input.iconEmoji || null,
          visibilityScope: input.visibilityScope,
          updatedAt: new Date(),
        })
        .where(eq(announcements.id, input.id));
      await replaceTargets(db, input.id, targetUserIds);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .delete(announcementTargets)
        .where(eq(announcementTargets.announcementId, input.id));
      await db.delete(announcements).where(eq(announcements.id, input.id));
      return { success: true };
    }),
});
