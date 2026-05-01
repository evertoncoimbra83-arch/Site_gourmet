import { TRPCError } from "@trpc/server";
import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { media } from "../../../drizzle/schema/index";
import { createRateLimitMiddleware } from "../../_core/trpc";
import { adminProcedure, router } from "../../_core/trpc";
import { getDb } from "../../db";
import {
  buildSafeMediaFilename,
  sanitizeMediaFolder,
  validateAndDecodeImageUpload,
} from "../../lib/upload-security";
import { cloudinary } from "../lib/cloudinary";

// --- INTERFACES DE TIPAGEM ---
interface CloudinaryFolder {
  name: string;
  path: string;
}

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
}

interface CloudinaryApiFoldersResponse {
  folders: CloudinaryFolder[];
}

interface CloudinaryApiResourcesResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
}

const ESSENTIAL_MEDIA_FOLDERS = [
  "geral",
  "pratos",
  "logo",
  "banners",
  "nutris",
] as const;

function normalizeMediaFolderFilter(folder?: string | null) {
  const normalized = (folder || "all").toLowerCase().trim();
  return normalized === "all" ? "all" : sanitizeMediaFolder(normalized);
}

// ✅ DETECÇÃO DE PASTA ROBUSTA
function getCloudinaryAppFolder(publicId: string): string {
  const parts = publicId
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  // Se o caminho for: gourmet/pratos/imagem.webp -> parts[1] é "pratos"
  if (parts[0] === "gourmet" && parts.length >= 3) {
    return sanitizeMediaFolder(parts[1]);
  }

  // Se estiver na raiz "gourmet/imagem.webp" ou fora do padrão -> "geral"
  return "geral";
}

export const adminMediaRouter = router({
  listFolders: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco offline" });

    try {
      const [result, dbFolders] = await Promise.all([
        cloudinary.api.sub_folders("gourmet") as Promise<CloudinaryApiFoldersResponse>,
        db.select({ folder: media.folder }).from(media).groupBy(media.folder),
      ]);

      const cloudFolders = result.folders.map((folder) => sanitizeMediaFolder(folder.name));
      const persistedFolders = dbFolders.map((row) => sanitizeMediaFolder(row.folder));

      return Array.from(
        new Set([
          ...ESSENTIAL_MEDIA_FOLDERS,
          ...cloudFolders,
          ...persistedFolders,
        ]),
      ).sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.error("Erro ao listar pastas Cloudinary:", error);
      const dbFolders = await db.select({ folder: media.folder }).from(media).groupBy(media.folder);
      return Array.from(
        new Set([
          ...ESSENTIAL_MEDIA_FOLDERS,
          ...dbFolders.map((row) => sanitizeMediaFolder(row.folder)),
        ]),
      ).sort((a, b) => a.localeCompare(b));
    }
  }),

  syncCloudinary: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco offline" });

    console.log("🚀 [DEBUG] Iniciando sincronização total...");

    try {
      let allResources: CloudinaryResource[] = [];
      let nextCursor: string | undefined;
      let page = 1;

      do {
        console.log(`   📦 [DEBUG] Buscando página ${page}...`);
        // ✅ AJUSTE: Removida a barra do prefixo para encontrar subpastas e arquivos raiz
        const result = (await cloudinary.api.resources({
          type: "upload",
          prefix: "gourmet", 
          max_results: 500,
          next_cursor: nextCursor,
        })) as CloudinaryApiResourcesResponse;

        console.log(`   [DEBUG] Cloudinary retornou ${result.resources?.length || 0} itens nesta página.`);
        allResources = [...allResources, ...(result.resources || [])];
        nextCursor = result.next_cursor;
        page++;
      } while (nextCursor);

      console.log(`   ✅ [DEBUG] Total final capturado: ${allResources.length} arquivos.`);

      let newCount = 0;
      let updateCount = 0;

      for (const resource of allResources) {
        if (resource.public_id.includes("samples/")) continue;

        const folder = getCloudinaryAppFolder(resource.public_id);
        const originalFilename = resource.public_id.split("/").pop() || "imagem_nuvem";
        const mimeType = `image/${resource.format}`;

        const [existing] = await db
          .select()
          .from(media)
          .where(
            or(
              eq(media.filePath, resource.public_id),
              eq(media.url, resource.secure_url),
            ),
          )
          .limit(1);

        if (!existing) {
          await db.insert(media).values({
            url: resource.secure_url,
            originalFilename,
            mimeType,
            filePath: resource.public_id,
            folder,
          });
          newCount++;
          continue;
        }

        const shouldUpdate =
          existing.folder !== folder ||
          existing.url !== resource.secure_url ||
          existing.filePath !== resource.public_id;

        if (shouldUpdate) {
          await db.update(media).set({
            url: resource.secure_url,
            originalFilename,
            mimeType,
            filePath: resource.public_id,
            folder,
          }).where(eq(media.id, existing.id));
          updateCount++;
        }
      }

      console.log(`🏁 [DEBUG] Fim do Sync. Novos: ${newCount}, Atualizados: ${updateCount}`);

      return {
        success: true,
        message: `Sync: ${newCount} novos, ${updateCount} atualizados de ${allResources.length} totais.`,
      };
    } catch (error) {
      console.error("❌ [ERROR] Erro na sincronia:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao sincronizar Cloudinary",
      });
    }
  }),

  upload: adminProcedure
    .use(createRateLimitMiddleware({ keyPrefix: "admin-media-upload", limit: 30, windowMs: 5 * 60 * 1000 }))
    .input(z.object({
      filename: z.string(),
      mimeType: z.string(),
      base64Data: z.string(),
      folder: z.string().optional().default("geral"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco offline" });

      try {
        const folder = sanitizeMediaFolder(input.folder);
        const validated = validateAndDecodeImageUpload({
          base64Data: input.base64Data,
          mimeType: input.mimeType,
          filename: input.filename,
        });

        const safeFilename = buildSafeMediaFilename(validated.mimeType);
        const cloudPath = folder === "geral" ? "gourmet" : `gourmet/${folder}`;

        const cloudRes = await cloudinary.uploader.upload(
          `data:${validated.mimeType};base64,${validated.buffer.toString("base64")}`,
          {
            folder: cloudPath,
            resource_type: "image",
            public_id: safeFilename.replace(/\.[^.]+$/, ""),
            overwrite: false,
            use_filename: true,
            unique_filename: false,
          },
        );

        const publicId = String(cloudRes.public_id || "");
        const derivedFolder = getCloudinaryAppFolder(publicId);

        const [existing] = await db.select().from(media)
          .where(or(eq(media.filePath, publicId), eq(media.url, cloudRes.secure_url)))
          .limit(1);

        if (existing) {
          await db.update(media).set({
            url: cloudRes.secure_url,
            originalFilename: input.filename,
            mimeType: validated.mimeType,
            filePath: publicId,
            folder: derivedFolder,
          }).where(eq(media.id, existing.id));
        } else {
          await db.insert(media).values({
            url: cloudRes.secure_url,
            originalFilename: input.filename,
            mimeType: validated.mimeType,
            filePath: publicId,
            folder: derivedFolder,
          });
        }

        return { success: true, url: cloudRes.secure_url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro no upload",
        });
      }
    }),

  list: adminProcedure
    .input(z.object({ folder: z.string().nullish() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco offline" });

      const folder = normalizeMediaFolderFilter(input?.folder);
      if (folder === "all") {
        return db.select().from(media).orderBy(desc(media.id));
      }
      return db.select().from(media).where(eq(media.folder, folder)).orderBy(desc(media.id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.union([z.string(), z.number()]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco offline" });

      const targetId = typeof input.id === "string" ? parseInt(input.id, 10) : input.id;
      const [item] = await db.select().from(media).where(eq(media.id, targetId)).limit(1);

      if (item && item.filePath) {
        try {
          await cloudinary.uploader.destroy(item.filePath);
        } catch (error) {
          console.warn("Cloudinary delete failed:", error);
        }
        await db.delete(media).where(eq(media.id, targetId));
      }

      return { success: true };
    }),
});