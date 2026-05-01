/**
 * Sistema de gerenciamento de biblioteca de imagens (Media Library)
 * ✅ REVISADO: Armazenamento Local na VPS com Otimização Sharp
 */

import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { mediaLibrary } from "../drizzle/schema/index"; 
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

// ✅ Caminho absoluto para a pasta de uploads na raiz do projeto (fora da dist)
const UPLOADS_DIR = path.resolve(process.cwd(), "public/uploads");

// Tipos base para uso externo
export type MediaLibraryItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaLibraryItem = typeof mediaLibrary.$inferInsert;

/**
 * Gera nome único para arquivo convertido para WebP
 */
function generateUniqueWebpFilename(): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${randomStr}.webp`;
}

/**
 * Faz upload de imagem para a VPS e salva os metadados no banco de dados
 */
export async function uploadImage(data: {
  file: Buffer | Uint8Array;
  originalFilename: string;
  mimeType: string;
  uploadedBy: string; 
  fileSize: number;   
  altText?: string;
}): Promise<MediaLibraryItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Garantir que a pasta de uploads existe fisicamente
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  // 2. Gerar nome e caminhos
  const filename = generateUniqueWebpFilename();
  const filePath = path.join(UPLOADS_DIR, filename);
  const buffer = data.file instanceof Buffer ? data.file : Buffer.from(data.file);

  // 3. Processamento Sharp: Redimensiona, converte para WebP e Otimiza
  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filePath);

  // 4. URL relativa para o banco (Segredo para não quebrar na VPS)
  const fileUrl = `/uploads/${filename}`;
  const newId = crypto.randomUUID();

  // 5. Salva metadados no banco
  await db.insert(mediaLibrary).values({
    id: newId,
    url: fileUrl,
    fileName: filename,
    mimeType: "image/webp",
    size: data.fileSize,
    altText: data.altText || "",
    uploadedBy: data.uploadedBy,
  });

  // 6. Busca e retorna o item recém-criado
  const [newItem] = await db
    .select()
    .from(mediaLibrary)
    .where(eq(mediaLibrary.id, newId))
    .limit(1);

  if (!newItem) throw new Error("Erro ao recuperar item inserido");
  
  return newItem;
}

/**
 * Lista todas as imagens por ordem de criação
 */
export async function listMediaLibrary(): Promise<MediaLibraryItem[]> {
  const db = await getDb(); 
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(mediaLibrary)
    .orderBy(desc(mediaLibrary.createdAt)); 
}

/**
 * Busca metadados por ID
 */
export async function getMediaById(id: string): Promise<MediaLibraryItem | null> {
  const db = await getDb(); 
  if (!db) throw new Error("Database not available");

  const results = await db
    .select()
    .from(mediaLibrary)
    .where(eq(mediaLibrary.id, id))
    .limit(1); 

  return results.length > 0 ? results[0] : null;
}

/**
 * Deleta o registro e REMOVE O ARQUIVO FÍSICO da VPS
 */
export async function deleteMedia(id: string): Promise<{ success: boolean }> {
  const db = await getDb(); 
  if (!db) throw new Error("Database not available");

  const [item] = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id)).limit(1);
  
  if (item) {
    // ✅ Tenta remover o arquivo físico da pasta de uploads
    const filePath = path.join(UPLOADS_DIR, item.fileName);
    try {
      await fs.unlink(filePath);
    } catch {
      console.warn(`Arquivo físico não encontrado para remoção: ${filePath}`);
    }

    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id)); 
  }
  
  return { success: true };
}