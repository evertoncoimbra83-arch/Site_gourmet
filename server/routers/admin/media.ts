import { z } from "zod";
import { adminProcedure, router } from "../../_core/trpc.js"; 
import { getDb } from "../../db.js"; 
import { media } from "../../../drizzle/schema/index.js"; 
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ✅ Caminho absoluto para a pasta de uploads
const UPLOADS_DIR = path.resolve(__dirname, "../../../public/uploads");

/**
 * Roteador de Mídia (Admin)
 * Gerencia o processamento de imagens e armazenamento físico.
 */
export const adminMediaRouter = router({
  // --- UPLOAD COM PROCESSAMENTO (SHARP) ---
  upload: adminProcedure
    .input(z.object({ 
      filename: z.string(), 
      mimeType: z.string(), 
      base64Data: z.string() 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD Offline" });

      try {
        // Garante que a pasta existe
        await fs.mkdir(UPLOADS_DIR, { recursive: true });

        const buffer = Buffer.from(input.base64Data, "base64");
        // Geramos um nome único em WebP
        const uniqueName = `img-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filePath = path.join(UPLOADS_DIR, uniqueName);

        // 🚀 Processamento Profissional: Redimensiona, converte para WebP e otimiza
        await sharp(buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filePath);

        const fileUrl = `/uploads/${uniqueName}`;

        // Salva metadados no banco
        await db.insert(media).values({
          url: fileUrl,
          originalFilename: input.filename,
          mimeType: "image/webp",
          filePath: filePath, 
        } as any);

        return { success: true, url: fileUrl };
      } catch (error: any) {
        console.error("❌ [MEDIA UPLOAD ERROR]:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Falha ao processar imagem: ${error.message}` 
        });
      }
    }),

  // --- LISTAGEM ---
  list: adminProcedure.query(async () => {
    const db = await getDb();
    return await db.select().from(media).orderBy(desc(media.id));
  }),

  // --- DELEÇÃO FÍSICA E LÓGICA ---
  delete: adminProcedure
    .input(z.object({ id: z.union([z.string(), z.number()]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = isNaN(Number(input.id)) ? input.id : Number(input.id);
      
      try {
        const [item] = await db.select().from(media).where(eq(media.id, id as any));
        
        if (item) {
          // 1. Tenta remover o arquivo físico do disco
          if (item.filePath) {
            try { 
              await fs.unlink(item.filePath); 
            } catch (e) { 
              console.warn(`⚠️ Arquivo ${item.filePath} não encontrado no disco.`); 
            }
          }
          // 2. Remove o registro do banco de dados
          await db.delete(media).where(eq(media.id, id as any));
        }

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Erro ao excluir mídia do servidor." 
        });
      }
    }),
});