// project-report.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// 1. ✅ ADICIONADO: 'docs' e 'scripts' para o Gemini ler o motor de busca
const INCLUDE_DIRS = [
  "server",
  "client/src",
  "docs",    // Importante para ler o motor de busca (.md)
  "scripts", // Para eu ver seus scripts de automação
  "prisma",
  "db",
];

const ROOT_FILES = [
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.mjs",
  ".env.example",
];

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".vscode",
  ".idea",
  "coverage",
  "logs",
]);

// 2. ✅ ADICIONADO: '.md' na lista de extensões permitidas
const INCLUDE_EXTS = new Set([
  ".ts", ".tsx",
  ".js", ".jsx", ".mjs", ".cjs",
  ".json",
  ".sql",
  ".prisma",
  ".css",
  ".html",
  ".md" // Necessário para ler o cart_architecture.md, etc.
]);

const MAX_FILE_KB = 150; 

function isIgnoredDir(name) {
  return IGNORE_DIRS.has(name);
}

function walkDir(startDir) {
  const result = [];
  if (!fs.existsSync(startDir)) return result;

  function walk(current) {
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
      
    }
  }
  walk(startDir);
  return result;
}

function buildTreeLines(entries) {
  const dirs = new Set();
  const files = [];
  for (const e of entries) {
    if (e.type === "dir") dirs.add(e.path);
    else files.push(e.path);
  }
  const allPaths = [...dirs, ...files].sort();
  return allPaths;
}

function shouldIncludeContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return INCLUDE_EXTS.has(ext) || ROOT_FILES.includes(path.basename(filePath));
}

function generateReport() {
  let report = "";
  report += "# Project Report\n\n";
  report += `Gerado em: ${new Date().toISOString()}\n\n`;

  let allEntries = [];

  for (const file of ROOT_FILES) {
    if (fs.existsSync(path.join(ROOT, file))) {
      allEntries.push({ type: "file", path: file });
    }
  }

  for (const dir of INCLUDE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    const entries = walkDir(abs);
    allEntries = allEntries.concat(entries);
  }

  report += "## Estrutura do Projeto\n\n";
  const treeLines = buildTreeLines(allEntries);
  report += "```\n";
  for (const line of treeLines) {
    report += line + "\n";
  }
  report += "```\n\n";

  report += "## Conteúdo dos Arquivos\n\n";
  for (const entry of allEntries) {
    if (entry.type !== "file") continue;
    const relPath = entry.path;
    
    if (!shouldIncludeContent(relPath)) continue;

    const absPath = path.join(ROOT, relPath);
    const stats = fs.statSync(absPath);
    const sizeKB = stats.size / 1024;

    report += `---\n\n`;
    report += `### Arquivo: \`${relPath}\`\n\n`;

    if (sizeKB > MAX_FILE_KB) {
      report += `> Arquivo muito grande (${sizeKB.toFixed(1)} KB). Omitido.\n\n`;
      continue;
    }

    let content = fs.readFileSync(absPath, "utf8");
    content = content.replace(/\u0000/g, "");

    const ext = path.extname(relPath).toLowerCase();
    let lang = "txt";
    if ([".ts", ".tsx"].includes(ext)) lang = "ts";
    else if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext)) lang = "js";
    else if (ext === ".json") lang = "json";
    else if (ext === ".sql") lang = "sql";
    else if (ext === ".prisma") lang = "prisma";
    else if (ext === ".css") lang = "css";
    else if (ext === ".html") lang = "html";
    else if (ext === ".md") lang = "markdown"; // ✅ Adicionado

    report += "```" + lang + "\n";
    report += content + "\n";
    report += "```\n\n";
  }

  const outFile = path.join(ROOT, "project-report.md");
  fs.writeFileSync(outFile, report, "utf8");
  
}

generateReport();