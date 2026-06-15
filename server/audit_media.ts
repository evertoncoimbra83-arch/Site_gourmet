import { getDb } from "./db.js";
import { media, mediaLibrary, dishes, packages, storeSettings } from "../drizzle/schema/index.js";
import fs from "fs";
import path from "path";

async function run() {
  console.log("=== INICIANDO AUDITORIA DE MÍDIA LOCAL E SEGURA ===");

  // 1. Auditoria de arquivos locais (uploads locais na VPS/Desenvolvimento)
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  console.log("\n--- AUDITORIA DE DIRETÓRIO LOCAL (public/uploads) ---");
  try {
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`Diretório local: public/uploads (relativo)`);
      console.log(`Total de arquivos físicos encontrados: ${files.length}`);
      if (files.length > 0) {
        console.log("Exemplos de arquivos locais:");
        files.slice(0, 5).forEach(f => {
          const stats = fs.statSync(path.join(uploadsDir, f));
          console.log(` - ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
      }
    } else {
      console.log("Diretório 'public/uploads' não existe localmente.");
    }
  } catch (err: any) {
    console.error(`Erro ao escanear diretório local: ${err.message}`);
  }

  // 2. Conexão e auditoria de banco de dados
  const dbUrl = process.env.DATABASE_URL;
  let hasDbAccess = false;

  if (!dbUrl) {
    console.log("\n⚠️ DATABASE_URL não encontrada. Ignorando auditoria de tabelas do banco.");
  } else {
    const isLocalHost = /localhost|127\.0\.0\.1|mariadb|mysql-local/i.test(dbUrl);
    const allowOnline = process.argv.includes("--online");

    if (!isLocalHost && !allowOnline) {
      console.log("\n⚠️ A URL do banco parece ser remota/online (ou não localhost).");
      console.log("   Por segurança, a auditoria automática do banco foi desativada.");
      console.log("   Execute o script com '--online' para auditar o banco de dados remoto.");
    } else {
      hasDbAccess = true;
    }
  }

  if (hasDbAccess) {
    try {
      const db = await getDb();

      // A. Tabela media
      const allMedia = await db.select().from(media);
      console.log("\n--- TABELA 'media' (Cloudinary) ---");
      console.log(`Total de registros: ${allMedia.length}`);
      const mediaWithUrl = allMedia.filter(m => m.url && m.url.trim() !== "");
      const mediaWithoutUrl = allMedia.filter(m => !m.url || m.url.trim() === "");
      const mediaWithFilePath = allMedia.filter(m => m.filePath && m.filePath.trim() !== "");
      const mediaWithoutFilePath = allMedia.filter(m => !m.filePath || m.filePath.trim() === "");
      console.log(`Total com URL: ${mediaWithUrl.length}`);
      console.log(`Total sem URL: ${mediaWithoutUrl.length}`);
      console.log(`Total com filePath (public_id): ${mediaWithFilePath.length}`);
      console.log(`Total sem filePath (public_id): ${mediaWithoutFilePath.length}`);
      if (allMedia.length > 0) {
        console.log("Exemplos de registros em 'media':");
        allMedia.slice(0, 3).forEach(m => console.log(` - ID ${m.id}: url='${m.url}', filePath='${m.filePath}'`));
      }

      // B. Tabela media_library
      const allMediaLib = await db.select().from(mediaLibrary);
      console.log("\n--- TABELA 'media_library' (VPS Local) ---");
      console.log(`Total de registros: ${allMediaLib.length}`);
      const mediaLibWithUrl = allMediaLib.filter(m => m.url && m.url.trim() !== "");
      const mediaLibWithoutUrl = allMediaLib.filter(m => !m.url || m.url.trim() === "");
      console.log(`Total com URL: ${mediaLibWithUrl.length}`);
      console.log(`Total sem URL: ${mediaLibWithoutUrl.length}`);
      if (allMediaLib.length > 0) {
        console.log("Exemplos de registros em 'media_library':");
        allMediaLib.slice(0, 3).forEach(m => console.log(` - ID ${m.id}: url='${m.url}', fileName='${m.fileName}'`));
      }

      // C. Tabela dishes (Pratos)
      const allDishes = await db.select().from(dishes);
      console.log("\n--- TABELA 'dishes' (Pratos) ---");
      console.log(`Total de pratos: ${allDishes.length}`);
      const dishesWithImg = allDishes.filter(d => d.imageUrl && d.imageUrl.trim() !== "");
      const dishesWithoutImg = allDishes.filter(d => !d.imageUrl || d.imageUrl.trim() === "");
      const dishesWithHttp = allDishes.filter(d => d.imageUrl && d.imageUrl.startsWith("http"));
      const dishesWithUploads = allDishes.filter(d => d.imageUrl && d.imageUrl.startsWith("/uploads"));
      console.log(`Pratos com imagem: ${dishesWithImg.length}`);
      console.log(`Pratos sem imagem: ${dishesWithoutImg.length}`);
      console.log(`Pratos com imagem remota (http): ${dishesWithHttp.length}`);
      console.log(`Pratos com imagem local (/uploads): ${dishesWithUploads.length}`);
      if (dishesWithImg.length > 0) {
        console.log("Exemplos de imagens de pratos:");
        dishesWithImg.slice(0, 5).forEach(d => console.log(` - Prato '${d.name}' (ID ${d.id}): imageUrl='${d.imageUrl}'`));
      }

      // D. Tabela packages (Pacotes)
      const allPackages = await db.select().from(packages);
      console.log("\n--- TABELA 'packages' (Pacotes) ---");
      console.log(`Total de pacotes: ${allPackages.length}`);
      const pkgsWithImg = allPackages.filter(p => p.imageUrl && p.imageUrl.trim() !== "");
      const pkgsWithoutImg = allPackages.filter(p => !p.imageUrl || p.imageUrl.trim() === "");
      const pkgsWithHttp = allPackages.filter(p => p.imageUrl && p.imageUrl.startsWith("http"));
      const pkgsWithUploads = allPackages.filter(p => p.imageUrl && p.imageUrl.startsWith("/uploads"));
      console.log(`Pacotes com imagem: ${pkgsWithImg.length}`);
      console.log(`Pacotes sem imagem: ${pkgsWithoutImg.length}`);
      console.log(`Pacotes com imagem remota (http): ${pkgsWithHttp.length}`);
      console.log(`Pacotes com imagem local (/uploads): ${pkgsWithUploads.length}`);
      if (pkgsWithImg.length > 0) {
        console.log("Exemplos de imagens de pacotes:");
        pkgsWithImg.slice(0, 5).forEach(p => console.log(` - Pacote '${p.name}' (ID ${p.id}): imageUrl='${p.imageUrl}'`));
      }

      // E. Configurações da loja (Logos)
      const settings = await db.select().from(storeSettings);
      console.log("\n--- TABELA 'store_settings' (Configurações / Logo) ---");
      settings.forEach(s => console.log(` - Config ID ${s.id}: logoUrl='${s.logoUrl}', favicon='${s.favicon}'`));

    } catch (err: any) {
      console.error(`\n❌ Falha ao consultar o banco de dados: ${err.message}`);
    }
  }

  console.log("\n=== FIM DA AUDITORIA DE MÍDIA ===");
}

run().catch(console.error);
