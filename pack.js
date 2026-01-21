// pack.js
import AdmZip from 'adm-zip';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zip = new AdmZip();

const foldersToInclude = [
  { src: './dist', dest: 'dist' },           // Frontend compilado
  { src: './server', dest: 'server' },       // Lógica do servidor
  { src: './drizzle', dest: 'drizzle' },     // Migrações do banco
];

const filesToInclude = [
  'package.json',
  'package-lock.json'
];

async function createPackage() {
  console.log("📦 Iniciando empacotamento do sistema...");

  try {
    // Adiciona pastas
    for (const folder of foldersToInclude) {
      if (await fs.pathExists(folder.src)) {
        zip.addLocalFolder(path.join(__dirname, folder.src), folder.dest);
        console.log(`✅ Pasta adicionada: ${folder.src}`);
      }
    }

    // Adiciona arquivos avulsos
    for (const file of filesToInclude) {
      if (await fs.pathExists(file)) {
        zip.addLocalFile(path.join(__dirname, file));
        console.log(`✅ Arquivo adicionado: ${file}`);
      }
    }

    const outputName = 'update-package.zip';
    zip.writeZip(path.join(__dirname, outputName));
    
    console.log("\n-------------------------------------------");
    console.log(`🚀 SUCESSO! Pacote pronto: ${outputName}`);
    console.log("-------------------------------------------\n");
  } catch (err) {
    console.error("❌ Erro ao criar pacote:", err);
  }
}

createPackage();