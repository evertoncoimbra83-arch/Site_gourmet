import { router, adminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { professionalReviews } from "../../../drizzle/schema/index.js";
import { nanoid } from "nanoid";

export const adminReviewsRouter = router({
  saveReview: adminProcedure
    .input(z.object({
      dishId: z.string(),
      userId: z.string(), // ID da Nutri
      technicalInsight: z.string(),
      nutritionalHighlights: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db.insert(professionalReviews)
        .values({
          id: nanoid(),
          ...input,
          isActive: true
        });
        
      return { success: true };
    }),
});