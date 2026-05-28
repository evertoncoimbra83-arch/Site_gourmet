import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { media } from "../../drizzle/schema";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sanitizeMediaFolder } from "../lib/upload-security";

function normalizeMediaFolderFilter(folder?: string | null) {
  const normalized = (folder || "all").toLowerCase().trim();
  return normalized === "all" ? "all" : sanitizeMediaFolder(normalized);
}

export const mediaRouter = router({
  getImagesByFolder: adminProcedure
    .input(
      z.object({
        folder: z.string().optional().default("all"),
      }),
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco offline",
        });
      }

      const folder = normalizeMediaFolderFilter(input.folder);
      const results =
        folder === "all"
          ? await db.select().from(media).orderBy(desc(media.id))
          : await db
              .select()
              .from(media)
              .where(eq(media.folder, folder))
              .orderBy(desc(media.id));

      return results.map((item) => ({
        id: String(item.id),
        url: item.url,
        name: item.originalFilename || item.filePath.split("/").pop() || "imagem",
        format: item.mimeType?.split("/")[1] || "",
        folder: item.folder,
      }));
    }),
});
