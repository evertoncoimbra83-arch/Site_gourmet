/**
 * Sistema de gerenciamento de biblioteca de imagens (Media Library)
 * Upload de imagens para S3 e gerenciamento de metadados
 */

import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
// ✅ CORREÇÃO: Troca media_library pelo nome correto 'mediaLibrary'
import { mediaLibrary } from "../drizzle/schema"; 
import { storagePut } from "./storage"; // Presumindo que 'storage.ts' existe

// Tipos base
export type MediaLibraryItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaLibraryItem = typeof mediaLibrary.$inferInsert;

/**
 * Gera nome único para arquivo
 */
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  // Garante que a extensão seja tratada de forma segura
  const parts = originalFilename.split('.');
  const extension = parts.length > 1 ? parts.pop() : 'bin'; 
  return `${timestamp}-${randomStr}.${extension}`;
}

/**
 * Faz upload de imagem para S3 e salva metadados no banco
 */
export async function uploadImage(data: {
  file: Buffer | Uint8Array;
  originalFilename: string;
  mimeType: string;
  uploadedBy: number;
  fileSize: number; // Adicionado para inserção no DB
  altText?: string;
}): Promise<MediaLibraryItem> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Gerar nome único para o arquivo
    const filename = generateUniqueFilename(data.originalFilename);
    const fileKey = `media-library/${filename}`;

    // Upload para S3
    // NOTE: A função 'storagePut' precisa ser ajustada para retornar o URL final, se for o caso.
    const { url } = await storagePut(data.file, fileKey, data.mimeType); 

    // Salva metadados no banco
    const [inserted] = await db.insert(mediaLibrary).values({
      url,
      fileName: filename,
      mimeType: data.mimeType,
      size: data.fileSize,
      altText: data.altText,
      uploadedBy: data.uploadedBy,
    });
    // .returning(); // Se o seu Drizzle suportar

    // Busca o item inserido se o .returning() não for suportado
    const [newItem] = await db.select().from(mediaLibrary).where(eq(mediaLibrary.url, url)).limit(1);

    return newItem;
  } catch (error) {
    console.error("[MediaLibrary] Error uploading image:", error);
    throw error;
  }
}

/**
 * Lista todas as imagens da biblioteca
 */
export async function listMediaLibrary(): Promise<MediaLibraryItem[]> {
  const db = await getDb(); // ✅ CORREÇÃO: Usar getDb()
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // ✅ CORREÇÃO: Usar mediaLibrary (camelCase)
    return await db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt)); 
  } catch (error) {
    console.error("[MediaLibrary] Error listing media:", error);
    throw error;
  }
}

/**
 * Busca imagem por ID
 */
export async function getMediaById(id: number): Promise<MediaLibraryItem | null> {
  const db = await getDb(); // ✅ CORREÇÃO: Usar getDb()
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // ✅ CORREÇÃO: Usar mediaLibrary (camelCase)
    const results = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id)).limit(1); 

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("[MediaLibrary] Error getting media:", error);
    throw error;
  }
}

/**
 * Deleta imagem da biblioteca
 */
export async function deleteMedia(id: number): Promise<{ success: boolean }> {
  const db = await getDb(); // ✅ CORREÇÃO: Usar getDb()
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // ✅ CORREÇÃO: Usar mediaLibrary (camelCase)
    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id)); 
    return { success: true };
  } catch (error) {
    console.error("[MediaLibrary] Error deleting media:", error);
    throw error;
  }
}