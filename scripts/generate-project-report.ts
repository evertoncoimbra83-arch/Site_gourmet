// ARQUIVO: scripts/generate-project-report.ts

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// --- CONFIGURAÇÕES APRIMORADAS ---
const INCLUDE_DIRS = [
  "server",
  "client/src",
  "drizzle", // ✅ Essencial para o DB (Schemas e Migrations)
  "scripts", // Útil se tiver scripts de seed do banco
];

// ✅ Arquivos de raiz importantes para contexto profundo
const ROOT_FILES = [
  "package.json",
  "tsconfig.json",
  "drizzle.config.ts", // 🔍 Configuração do DB
  "vite.config.ts",
  "tailwind.config.ts",
  ".env.example",      // 🔍 Variáveis de ambiente (sem senhas reais)
];

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
]);

const INCLUDE_EXTS = new Set([
  ".ts", ".tsx",
  ".js", ".jsx", ".mjs", ".cjs",
  ".json",
  ".sql",    // 🔍 Migrations SQL
  ".prisma", 
  ".css",
  ".env.example"
]);

const MAX_FILE_KB = 300; // Aumentei um pouco para pegar arquivos maiores se necessário
// --- FIM DAS CONFIGURAÇÕES ---

interface FileEntry {
  path: string;
  content: string | null;
  sizeKB: number;
  language: string;
}

interface ReportStructure {
  timestamp: string;
  root: string;
  tree: string[];
  files: FileEntry[];
}

function isIgnoredDir(name: string) {
  return IGNORE_DIRS.has(name);
}

// Caminha pelos diretórios recursivamente
function walkDir(startDir: string) {
  const result: { type: "dir" | "file"; path: string }[] = [];
  if (!fs.existsSync(startDir)) return result; 

  function walk(current: string) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue; 
        
        const fullPath = path.join(current, entry.name);
        const relPath = path.relative(ROOT, fullPath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          if (isIgnoredDir(entry.name)) continue;
          result.push({ type: "dir", path: relPath });
          walk(fullPath);
        } else {
          result.push({ type: "file", path: relPath });
        }
      }
    } catch (e) {
      console.warn(`⚠️ Não foi possível ler: ${current}`);
    }
  }
  walk(startDir);
  return result;
}

function getLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (path.basename(filePath).startsWith(".env")) return "bash";
    
    switch (ext) {
        case ".ts":
        case ".tsx": return "typescript";
        case ".js":
        case ".jsx":
        case ".mjs":
        case ".cjs": return "javascript";
        case ".json": return "json";
        case ".sql": return "sql";
        case ".prisma": return "prisma";
        case ".css": return "css";
        case ".html": return "html";
        case ".md": return "markdown";
        default: return "txt";
    }
}

function shouldIncludeContent(filePath: string): boolean {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  return INCLUDE_EXTS.has(ext) || ROOT_FILES.includes(fileName) || fileName.startsWith(".env");
}

function generateReportData(): ReportStructure {
  let allEntries: { type: "dir" | "file"; path: string }[] = [];

  // 1. Arquivos da Raiz
  for (const file of ROOT_FILES) {
    if (fs.existsSync(path.join(ROOT, file))) {
      allEntries.push({ type: "file", path: file });
    }
  }

  // 2. Diretórios Definidos
  for (const dir of INCLUDE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    const entries = walkDir(abs);
    allEntries = allEntries.concat(entries);
  }

  // 3. Gerar Árvore Visual
  const treeLines: string[] = allEntries
    .map(e => e.path)
    .sort();
    
  // 4. Ler Conteúdo
  const filesContent: FileEntry[] = [];
  for (const entry of allEntries) {
    if (entry.type !== "file") continue;
    const relPath = entry.path;
    
    if (!shouldIncludeContent(relPath)) continue;

    const absPath = path.join(ROOT, relPath);
    try {
        const stats = fs.statSync(absPath);
        const sizeKB = stats.size / 1024;

        if (sizeKB > MAX_FILE_KB) {
        filesContent.push({ path: relPath, content: `[CONTEÚDO OMITIDO: Arquivo muito grande (${sizeKB.toFixed(2)} KB)]`, sizeKB, language: getLanguage(relPath) });
        continue;
        }

        let content = fs.readFileSync(absPath, "utf8");
        content = content.replace(/\u0000/g, ""); // Remove nulos
        
        filesContent.push({
        path: relPath,
        content: content,
        sizeKB: parseFloat(sizeKB.toFixed(2)),
        language: getLanguage(relPath)
        });
    } catch (err) {
        console.error(`Erro ao ler arquivo ${relPath}`);
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    root: ROOT,
    tree: treeLines,
    files: filesContent,
  };
}

// --- FUNÇÃO EXTRA: Gerar Markdown (Melhor para LLMs) ---
function generateMarkdown(report: ReportStructure): string {
    let md = `# Relatório do Projeto\n\n`;
    md += `Gerado em: ${report.timestamp}\n\n`;
    
    md += `## Estrutura do Projeto\n\n`;
    md += "```\n";
    md += report.tree.join("\n");
    md += "\n```\n\n";

    md += `## Conteúdo dos Arquivos\n\n`;
    
    report.files.forEach(file => {
        md += `### Arquivo: \`${file.path}\`\n\n`;
        md += "```" + file.language + "\n";
        md += file.content;
        md += "\n```\n\n";
        md += "---\n\n";
    });

    return md;
}

// Execução Principal
try {
    console.log("🔍 Escaneando projeto...");
    const report = generateReportData();

    // 1. Salva JSON
    const outputJSON = JSON.stringify(report, null, 2);
    const jsonPath = path.join(ROOT, "project-report.json");
    fs.writeFileSync(jsonPath, outputJSON, "utf8");
    console.log(`✅ JSON gerado: ${jsonPath}`);

    // 2. Salva Markdown (Novo!)
    const outputMD = generateMarkdown(report);
    const mdPath = path.join(ROOT, "project-report.md");
    fs.writeFileSync(mdPath, outputMD, "utf8");
    console.log(`✅ MARKDOWN gerado: ${mdPath}`);
    
    console.log(`\n📊 Total de arquivos processados: ${report.files.length}`);
    console.log("👉 Use o arquivo .md para colar no chat da IA.");

} catch(e: any) {
    console.error("❌ Erro fatal:", e.message);
    process.exit(1);
}