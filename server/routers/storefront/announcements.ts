import { router, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { announcements } from "../../../drizzle/schema/index.js";
import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

function activeDateCondition(now: Date) {
  return and(
    eq(announcements.isActive, true),
    or(isNull(announcements.startDate), lte(announcements.startDate, now)),
    or(isNull(announcements.endDate), gte(announcements.endDate, now)),
  );
}

function visibilityCondition(userId: string | null) {
  const globalCondition = or(
    isNull(announcements.visibilityScope),
    eq(announcements.visibilityScope, "all"),
  );

  if (!userId) return globalCondition;

  return or(
    globalCondition,
    eq(announcements.visibilityScope, "authenticated"),
    and(
      eq(announcements.visibilityScope, "specific_users"),
      sql`exists (
        select 1
        from announcement_targets target
        where target.announcement_id = ${announcements.id}
          and target.user_id = ${userId}
      )`,
    ),
  );
}

export const storefrontAnnouncementsRouter = router({
  listActive: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const now = new Date();
    const userId = ctx.user?.id ? String(ctx.user.id) : null;

    return await db
      .select()
      .from(announcements)
      .where(and(activeDateCondition(now), visibilityCondition(userId)))
      .orderBy(desc(announcements.createdAt));
  }),

  getFeatured: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const now = new Date();
    const userId = ctx.user?.id ? String(ctx.user.id) : null;

    const [featured] = await db
      .select()
      .from(announcements)
      .where(and(activeDateCondition(now), visibilityCondition(userId)))
      .orderBy(desc(announcements.createdAt))
      .limit(1);

    return featured ?? null;
  }),
});
